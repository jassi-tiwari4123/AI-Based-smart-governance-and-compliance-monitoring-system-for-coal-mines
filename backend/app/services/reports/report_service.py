from app.database.connection import get_database
from datetime import datetime
import csv
import io

class ReportService:
    @staticmethod
    async def generate_compliance_report():
        db = get_database()
        mines = await db.mines.find().to_list(length=100)
        violations = await db.violations.find().to_list(length=500)
        inspections = await db.inspections.find().to_list(length=500)
        
        total_mines = len(mines)
        avg_score = sum(m.get("complianceScore", 85) for m in mines) / total_mines if total_mines > 0 else 85
        
        open_violations = [v for v in violations if v.get("status") not in ["CLOSED"]]
        critical_violations = [v for v in violations if v.get("riskLevel") == "CRITICAL"]
        
        category_breakdown = {
            "SAFETY": len([v for v in violations if v.get("category") == "SAFETY"]),
            "ENVIRONMENT": len([v for v in violations if v.get("category") == "ENVIRONMENT"]),
            "PRODUCTION": len([v for v in violations if v.get("category") == "PRODUCTION"]),
            "LABOUR": len([v for v in violations if v.get("category") == "LABOUR"])
        }
        
        mine_summary = []
        for m in mines:
            m_vios = [v for v in violations if v.get("mineId") == m.get("mineId")]
            m_ins = [i for i in inspections if i.get("mineId") == m.get("mineId")]
            mine_summary.append({
                "mineId": m.get("mineId"),
                "name": m.get("name"),
                "state": m.get("state"),
                "complianceScore": m.get("complianceScore"),
                "riskLevel": m.get("riskLevel"),
                "totalInspections": len(m_ins),
                "openViolations": len([v for v in m_vios if v.get("status") != "CLOSED"])
            })

        return {
            "reportType": "Statutory Compliance & Risk Summary Report",
            "generatedAt": datetime.utcnow().isoformat(),
            "summary": {
                "totalMines": total_mines,
                "averageComplianceScore": round(avg_score, 1),
                "totalInspections": len(inspections),
                "totalViolations": len(violations),
                "openViolations": len(open_violations),
                "criticalViolations": len(critical_violations)
            },
            "categoryBreakdown": category_breakdown,
            "minePerformance": mine_summary
        }

    @staticmethod
    async def export_csv_report(report_type: str) -> str:
        db = get_database()
        output = io.StringIO()
        writer = csv.writer(output)
        
        if report_type == "violations":
            writer.writerow(["Violation ID", "Mine ID", "Category", "Title", "Severity", "Risk Level", "Risk Score", "Status", "Created At"])
            violations = await db.violations.find().to_list(length=1000)
            for v in violations:
                writer.writerow([
                    v.get("violationId"),
                    v.get("mineId"),
                    v.get("category"),
                    v.get("title"),
                    v.get("severity"),
                    v.get("riskLevel"),
                    v.get("riskScore"),
                    v.get("status"),
                    v.get("createdAt")
                ])
        elif report_type == "inspections":
            writer.writerow(["Inspection ID", "Mine ID", "Zone", "Category", "Severity", "Inspector ID", "Status", "Inspection Date"])
            inspections = await db.inspections.find().to_list(length=1000)
            for i in inspections:
                writer.writerow([
                    i.get("inspectionId"),
                    i.get("mineId"),
                    i.get("zone"),
                    i.get("category"),
                    i.get("severity"),
                    i.get("inspectorId"),
                    i.get("status"),
                    i.get("inspectionDate")
                ])
        else:
            writer.writerow(["Mine ID", "Name", "Location", "State", "Manager", "Compliance Score", "Risk Level", "Operational Status"])
            mines = await db.mines.find().to_list(length=1000)
            for m in mines:
                writer.writerow([
                    m.get("mineId"),
                    m.get("name"),
                    m.get("location"),
                    m.get("state"),
                    m.get("manager"),
                    m.get("complianceScore"),
                    m.get("riskLevel"),
                    m.get("operationalStatus")
                ])

        return output.getvalue()
