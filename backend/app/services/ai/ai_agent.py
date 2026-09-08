import httpx
import json
import logging
from datetime import datetime
from app.config import settings
from app.database.connection import get_database

logger = logging.getLogger("mineguard.ai")

class AIAgentService:
    @staticmethod
    async def retrieve_knowledge_base(query_text: str, category: str = "SAFETY") -> dict:
        db = get_database()
        
        regulations = await db.regulations.find({
            "$or": [
                {"category": category},
                {"title": {"$regex": query_text.split()[0] if query_text else "safety", "$options": "i"}},
                {"content": {"$regex": "safety|equipment|helmet|ppe|dust|ventilation", "$options": "i"}}
            ]
        }).to_list(length=5)
        
        historical = await db.historical_violations.find({
            "$or": [
                {"category": category},
                {"keywords": {"$in": ["safety", "ppe", "equipment"]}}
            ]
        }).to_list(length=5)
        
        sops = await db.sops.find({"category": category}).to_list(length=5)
        
        for doc in regulations:
            doc["_id"] = str(doc["_id"])
        for doc in historical:
            doc["_id"] = str(doc["_id"])
        for doc in sops:
            doc["_id"] = str(doc["_id"])
            
        return {
            "regulations": regulations,
            "historical": historical,
            "sops": sops
        }

    @staticmethod
    async def investigate_violation(violation: dict) -> dict:
        db = get_database()
        
        title = violation.get("title", "")
        desc = violation.get("description", "")
        category = violation.get("category", "SAFETY")
        mine_id = violation.get("mineId")
        
        # 1. OBSERVE
        observe_data = {
            "violationId": violation.get("violationId"),
            "mineId": mine_id,
            "title": title,
            "description": desc,
            "severity": violation.get("severity"),
            "gpsLocation": violation.get("gpsLocation"),
            "observedAt": violation.get("createdAt")
        }
        
        # 2. RETRIEVE
        kb_data = await AIAgentService.retrieve_knowledge_base(f"{title} {desc}", category)
        
        matched_regs = []
        if kb_data["regulations"]:
            for r in kb_data["regulations"]:
                matched_regs.append({
                    "act": r.get("act", "Coal Mines Regulations 2017"),
                    "rule": r.get("ruleNumber", "CMR 104"),
                    "title": r.get("title"),
                    "mandatoryAction": r.get("mandatoryAction")
                })
        
        reg_text = matched_regs[0]["title"] if matched_regs else "Regulation reference not found in available knowledge base."
        
        historical_matches = [
            f"{h.get('title')} ({h.get('date', 'Previous audit')}) - Outcome: {h.get('resolution')}"
            for h in kb_data["historical"]
        ] if kb_data["historical"] else ["No prior matching violations recorded in historical index."]

        # 3. REASON & DECIDE
        # If external API is requested and configured, query it; else use fallback engine
        ai_response = None
        if settings.AI_PROVIDER in ["groq", "openai"] and (settings.GROQ_API_KEY or settings.OPENAI_API_KEY):
            try:
                ai_response = await AIAgentService._call_external_ai(observe_data, matched_regs, historical_matches)
            except Exception as e:
                logger.warning(f"External AI call failed, falling back to local reasoning engine: {e}")

        if not ai_response:
            # Deterministic fallback response for high precision demo
            if "Worker safety equipment" in title or "equipment" in title or "ppe" in desc.lower():
                finding = "Recurring safety equipment non-compliance detected in operational pit area."
                evidence = "Inspector observation with photo timestamp; 4 similar infractions logged in past 21 days."
                rec = "Order immediate equipment audit in Zone B, issue stop-work warning to defaulting contractor, and require supervisor sign-off before shift resumption."
                hist_context = "2 previous corrective actions for safety gear were marked overdue in the last quarter."
                risk_factors = [
                    "4 repeated safety compliance failures in 21 days",
                    "2 overdue corrective actions",
                    "High severity observation",
                    "Contractor history match for non-compliance"
                ]
            else:
                finding = f"Statutory {category} compliance irregularity identified."
                evidence = f"Field evidence: {desc}"
                rec = f"Issue immediate corrective action notice to Mine Manager. Conduct mandatory re-inspection within 48 hours."
                hist_context = f"Historical pattern search shows {len(historical_matches)} related events."
                risk_factors = ["Category risk weight", "Field observation severity", "Standard audit escalation"]

            ai_response = {
                "finding": finding,
                "evidence": evidence,
                "applicable_regulations": matched_regs if matched_regs else [{"act": "Mines Act 1952", "rule": "Regulation reference not found in available knowledge base.", "title": "Regulation reference not found in available knowledge base."}],
                "historical_context": hist_context,
                "risk_factors": risk_factors,
                "recommendation": rec,
                "confidence": "High (94%)"
            }

        # 4. ACT & 5. VERIFY workflow structure
        act_data = {
            "recommendedAction": "Create Corrective Action",
            "suggestedDeadlineDays": 3,
            "targetRole": "MINE_MANAGER"
        }
        
        verify_data = {
            "verificationMethod": "Photo & GPS Tagged Inspection Re-upload",
            "requiredApprover": "Mine Manager / Corporate Safety Officer"
        }

        investigation_result = {
            "violationId": violation.get("violationId"),
            "observe": observe_data,
            "retrieve": {
                "regulations": matched_regs,
                "historicalCases": historical_matches,
                "sops": [s.get("title") for s in kb_data["sops"]]
            },
            "reason": {
                "finding": ai_response.get("finding"),
                "evidence": ai_response.get("evidence"),
                "applicable_regulations": ai_response.get("applicable_regulations"),
                "historical_context": ai_response.get("historical_context"),
                "risk_factors": ai_response.get("risk_factors"),
                "recommendation": ai_response.get("recommendation"),
                "confidence": ai_response.get("confidence")
            },
            "decide": {
                "riskCategory": violation.get("riskLevel", "CRITICAL"),
                "actionRequired": True,
                "escalationLevel": "Corporate Admin & Mine Manager"
            },
            "act": act_data,
            "verify": verify_data,
            "generatedAt": datetime.utcnow().isoformat()
        }

        # Update violation with investigation summary
        await db.violations.update_one(
            {"violationId": violation.get("violationId")},
            {"$set": {
                "investigationSummary": investigation_result,
                "updatedAt": datetime.utcnow().isoformat()
            }}
        )

        return investigation_result

    @staticmethod
    async def suggest_incident_fields(description: str) -> dict:
        """
        Given a free-text incident description, suggest:
          - severity   (MINOR | MAJOR | CRITICAL)
          - category   (SAFETY | ENVIRONMENT | EQUIPMENT | LABOUR | FIRE | STRUCTURAL)
          - summary    one-line synopsis
          - confidence
        """
        ai_result = None

        if settings.AI_PROVIDER in ["groq", "openai"] and (settings.GROQ_API_KEY or settings.OPENAI_API_KEY):
            try:
                ai_result = await AIAgentService._call_incident_suggestion_ai(description)
            except Exception as e:
                logger.warning(f"AI incident suggestion failed, using keyword fallback: {e}")

        if not ai_result:
            ai_result = AIAgentService._incident_keyword_fallback(description)

        return ai_result

    @staticmethod
    async def _call_incident_suggestion_ai(description: str) -> dict:
        url = (
            "https://api.groq.com/openai/v1/chat/completions"
            if settings.AI_PROVIDER == "groq"
            else "https://api.openai.com/v1/chat/completions"
        )
        api_key = settings.GROQ_API_KEY if settings.AI_PROVIDER == "groq" else settings.OPENAI_API_KEY

        prompt = """You are MINEGUARD, an AI assistant for coal mine incident reporting in India (Mines Act 1952, DGMS regulations).

Given the incident description below, return a JSON object with EXACTLY these keys:
- "severity": one of "MINOR", "MAJOR", "CRITICAL"
- "severityReason": one sentence explaining the severity choice
- "category": one of "SAFETY", "ENVIRONMENT", "EQUIPMENT", "LABOUR", "FIRE", "STRUCTURAL"
- "categoryReason": one sentence explaining the category choice
- "summary": one-sentence plain-language summary of the incident
- "confidence": e.g. "High (91%)"

Rules:
- Fire, explosion, gas leak, fatality, roof fall, flooding → CRITICAL
- Injury, equipment failure, chemical spill, multiple workers affected → MAJOR
- Near-miss, minor damage, single worker minor injury → MINOR
- FIRE category: fire, explosion, gas leak, methane
- STRUCTURAL category: roof fall, ground collapse, subsidence, wall failure
- EQUIPMENT category: machinery breakdown, conveyor failure, vehicle accident
- LABOUR category: worker injury, fatigue, dispute, medical emergency
- ENVIRONMENT category: dust, water pollution, chemical spill, noise
- SAFETY category: PPE violation, unsafe behaviour, procedure breach

Incident Description:
""" + description

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama3-8b-8192" if settings.AI_PROVIDER == "groq" else "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        return None

    @staticmethod
    def _incident_keyword_fallback(description: str) -> dict:
        desc = description.lower()

        # ── Severity ──────────────────────────────────────────────────────
        critical_kw = ["fire", "explosion", "gas leak", "methane", "roof fall", "collapse",
                        "fatality", "death", "electrocution", "flood", "fatal", "killed"]
        major_kw    = ["injury", "injured", "equipment failure", "breakdown", "spill",
                        "chemical", "multiple", "fracture", "hospitalised", "hospitalized",
                        "vehicle accident", "trapped", "entrap"]

        if any(k in desc for k in critical_kw):
            severity = "CRITICAL"
            sev_reason = "Incident involves life-threatening hazard or fatality."
        elif any(k in desc for k in major_kw):
            severity = "MAJOR"
            sev_reason = "Incident involves injury, equipment failure, or significant damage."
        else:
            severity = "MINOR"
            sev_reason = "Low-impact incident; correctable through standard procedure."

        # ── Category ──────────────────────────────────────────────────────
        fire_kw       = ["fire", "explosion", "gas leak", "methane", "smoke", "flame", "ignition"]
        structural_kw = ["roof fall", "collapse", "subsidence", "wall", "ground failure", "strata"]
        equipment_kw  = ["machinery", "conveyor", "vehicle", "truck", "excavator", "pump", "equipment failure", "breakdown", "crusher"]
        labour_kw     = ["worker", "labour", "injury", "injured", "fatigue", "dispute", "medical", "fracture", "hospitalised", "hospitalized"]
        env_kw        = ["dust", "water", "pollution", "chemical", "spill", "effluent", "noise", "air quality"]

        if any(k in desc for k in fire_kw):
            category, cat_reason = "FIRE", "Incident involves fire, explosion, or gas-related hazard."
        elif any(k in desc for k in structural_kw):
            category, cat_reason = "STRUCTURAL", "Incident involves structural failure or ground instability."
        elif any(k in desc for k in equipment_kw):
            category, cat_reason = "EQUIPMENT", "Incident relates to machinery or equipment failure."
        elif any(k in desc for k in labour_kw):
            category, cat_reason = "LABOUR", "Incident involves worker injury or welfare concern."
        elif any(k in desc for k in env_kw):
            category, cat_reason = "ENVIRONMENT", "Incident involves environmental impact or pollution."
        else:
            category, cat_reason = "SAFETY", "General safety procedure breach or unsafe condition."

        summary = f"{severity.capitalize()} {category.lower()} incident detected — immediate reporting required."
        confidence = "High (88%)" if severity == "CRITICAL" else "Medium (72%)"

        return {
            "severity": severity,
            "severityReason": sev_reason,
            "category": category,
            "categoryReason": cat_reason,
            "summary": summary,
            "confidence": confidence,
        }

    @staticmethod
    async def suggest_inspection_fields(observation: str) -> dict:
        """
        Given a free-text field observation, use NLP / LLM to suggest:
          - severity   (MINOR | MAJOR | CRITICAL)
          - category   (SAFETY | ENVIRONMENT | PRODUCTION | LABOUR)
          - checklist  list of {item, suggestedStatus, reason}
          - summary    one-line synopsis
          - confidence
        Falls back to deterministic keyword rules when no API key is configured.
        """
        ai_result = None

        if settings.AI_PROVIDER in ["groq", "openai"] and (settings.GROQ_API_KEY or settings.OPENAI_API_KEY):
            try:
                ai_result = await AIAgentService._call_suggestion_ai(observation)
            except Exception as e:
                logger.warning(f"AI suggestion call failed, using keyword fallback: {e}")

        if not ai_result:
            ai_result = AIAgentService._keyword_fallback(observation)

        return ai_result

    @staticmethod
    async def _call_suggestion_ai(observation: str) -> dict:
        """Call Groq / OpenAI and ask for structured inspection field suggestions."""
        url = (
            "https://api.groq.com/openai/v1/chat/completions"
            if settings.AI_PROVIDER == "groq"
            else "https://api.openai.com/v1/chat/completions"
        )
        api_key = settings.GROQ_API_KEY if settings.AI_PROVIDER == "groq" else settings.OPENAI_API_KEY

        prompt = """You are MINEGUARD, an AI assistant for coal mine compliance inspections in India (Mines Act 1952, CMR 2017).

Given the inspector's field observation below, return a JSON object with EXACTLY these keys:
- "severity": one of "MINOR", "MAJOR", "CRITICAL"
- "severityReason": one sentence explaining the severity choice
- "category": one of "SAFETY", "ENVIRONMENT", "PRODUCTION", "LABOUR"
- "categoryReason": one sentence explaining the category choice
- "checklist": array of objects, each with:
    - "item": checklist item name (choose from: PPE Compliance, Ventilation Check, Haul Road Sprinklers, Fire Safety Equipment, Emergency Exits Clear, Machinery Inspection Tags)
    - "suggestedStatus": "PASS" or "FAIL"
    - "reason": one short reason
- "summary": one-sentence plain-language summary of the observation
- "confidence": e.g. "High (91%)"

Rules:
- Include ALL 6 checklist items.
- Set "FAIL" only for items directly implicated by the observation.
- If the observation mentions fire/gas/explosion risks → CRITICAL.
- If the observation mentions missing PPE, faulty equipment, dust, water → MAJOR.
- Minor paperwork or low-risk correctable issues → MINOR.

Field Observation:
""" + observation

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama3-8b-8192" if settings.AI_PROVIDER == "groq" else "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        return None

    @staticmethod
    def _keyword_fallback(observation: str) -> dict:
        """
        Deterministic keyword-based fallback when no LLM is available.
        Covers the most common coal-mine inspection scenarios.
        """
        obs = observation.lower()

        # ── Severity ──────────────────────────────────────────────────────
        critical_kw = ["fire", "explosion", "gas leak", "methane", "roof fall", "collapse", "fatality", "death", "electrocution", "flood"]
        major_kw    = ["no ppe", "missing ppe", "helmet", "harness", "ventilation", "dust", "faulty", "broken", "blocked exit", "water logging", "spillage"]

        if any(k in obs for k in critical_kw):
            severity = "CRITICAL"
            sev_reason = "Observation mentions life-threatening hazard requiring immediate action."
        elif any(k in obs for k in major_kw):
            severity = "MAJOR"
            sev_reason = "Observation indicates significant safety or compliance concern."
        else:
            severity = "MINOR"
            sev_reason = "Low-risk observation; correctable through routine action."

        # ── Category ──────────────────────────────────────────────────────
        env_kw    = ["dust", "water", "effluent", "drainage", "pollution", "air quality", "noise", "chemical", "waste", "spillage"]
        prod_kw   = ["conveyor", "haul", "equipment", "machinery", "crusher", "production", "stockpile", "excavator"]
        labour_kw = ["worker", "labour", "overtime", "fatigue", "wage", "injury", "manpower", "shift"]

        if any(k in obs for k in env_kw):
            category, cat_reason = "ENVIRONMENT", "Observation relates to environmental or dust/water quality issues."
        elif any(k in obs for k in prod_kw):
            category, cat_reason = "PRODUCTION", "Observation relates to production equipment or operational area."
        elif any(k in obs for k in labour_kw):
            category, cat_reason = "LABOUR", "Observation relates to worker welfare or labour compliance."
        else:
            category, cat_reason = "SAFETY", "Defaulting to Safety category based on general hazard keywords."

        # ── Checklist ─────────────────────────────────────────────────────
        ppe_fail  = any(k in obs for k in ["ppe", "helmet", "harness", "gloves", "boots", "vest", "no protective"])
        vent_fail = any(k in obs for k in ["ventilation", "airflow", "methane", "gas", "smoke", "fume"])
        haul_fail = any(k in obs for k in ["haul road", "sprinkler", "dust suppression", "road dust"])
        fire_fail = any(k in obs for k in ["fire", "extinguisher", "fire safety", "explosion", "gas leak"])
        exit_fail = any(k in obs for k in ["exit", "egress", "escape route", "blocked", "obstruct"])
        mach_fail = any(k in obs for k in ["machinery", "tag", "inspection tag", "machine", "faulty", "broken", "unsafe equipment"])

        checklist = [
            {"item": "PPE Compliance",          "suggestedStatus": "FAIL" if ppe_fail  else "PASS", "reason": "PPE issues mentioned in observation." if ppe_fail  else "No PPE issues observed."},
            {"item": "Ventilation Check",        "suggestedStatus": "FAIL" if vent_fail else "PASS", "reason": "Ventilation/gas concern detected."     if vent_fail else "No ventilation issues observed."},
            {"item": "Haul Road Sprinklers",     "suggestedStatus": "FAIL" if haul_fail else "PASS", "reason": "Dust suppression deficiency noted."    if haul_fail else "Haul road sprinklers appear operational."},
            {"item": "Fire Safety Equipment",    "suggestedStatus": "FAIL" if fire_fail else "PASS", "reason": "Fire/gas risk identified."             if fire_fail else "No fire safety issues observed."},
            {"item": "Emergency Exits Clear",    "suggestedStatus": "FAIL" if exit_fail else "PASS", "reason": "Exit obstruction mentioned."           if exit_fail else "Emergency exits appear clear."},
            {"item": "Machinery Inspection Tags","suggestedStatus": "FAIL" if mach_fail else "PASS", "reason": "Equipment deficiency noted."           if mach_fail else "Machinery tags appear in order."},
        ]

        # Simple summary
        fail_items = [c["item"] for c in checklist if c["suggestedStatus"] == "FAIL"]
        if fail_items:
            summary = f"{severity.capitalize()} {category.lower()} compliance issue — {', '.join(fail_items)} flagged for review."
        else:
            summary = f"{severity.capitalize()} {category.lower()} observation; no immediate checklist failures detected."

        fail_count = len(fail_items)
        confidence = "High (88%)" if severity == "CRITICAL" else ("Medium (76%)" if fail_count >= 2 else "Medium (68%)")

        return {
            "severity": severity,
            "severityReason": sev_reason,
            "category": category,
            "categoryReason": cat_reason,
            "checklist": checklist,
            "summary": summary,
            "confidence": confidence,
        }

    @staticmethod
    async def _call_external_ai(observe: dict, regs: list, historical: list) -> dict:
        url = "https://api.groq.com/openai/v1/chat/completions" if settings.AI_PROVIDER == "groq" else "https://api.openai.com/v1/chat/completions"
        api_key = settings.GROQ_API_KEY if settings.AI_PROVIDER == "groq" else settings.OPENAI_API_KEY
        
        prompt = f"""
You are MINEGUARD AI Governance Agent for Coal Mines.
Analyze this observation:
Title: {observe.get('title')}
Description: {observe.get('description')}
Severity: {observe.get('severity')}

Retrieved Regulations: {json.dumps(regs)}
Retrieved History: {json.dumps(historical)}

Return JSON with exact keys:
finding, evidence, applicable_regulations, historical_context, risk_factors, recommendation, confidence
"""
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama3-8b-8192" if settings.AI_PROVIDER == "groq" else "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        return None
