import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import {
  Cpu, Eye, BookOpen, Brain, Lightbulb, Zap, ShieldCheck,
  ArrowLeft, AlertTriangle, Clock, CheckCircle2, RefreshCw,
  ChevronRight, MapPin, Calendar, User
} from 'lucide-react';

const STEPS = [
  { key: 'observe',  label: 'OBSERVE',   icon: Eye,         color: 'blue',   desc: 'Analyzing the violation data and field context' },
  { key: 'retrieve', label: 'RETRIEVE',  icon: BookOpen,    color: 'purple', desc: 'Querying regulations & historical cases' },
  { key: 'reason',   label: 'REASON',    icon: Brain,       color: 'amber',  desc: 'Assessing severity, patterns, and root cause' },
  { key: 'decide',   label: 'DECIDE',    icon: Lightbulb,   color: 'orange', desc: 'Generating corrective action recommendations' },
  { key: 'act',      label: 'ACT',       icon: Zap,         color: 'red',    desc: 'Setting assignments, deadlines, escalations' },
  { key: 'verify',   label: 'VERIFY',    icon: ShieldCheck, color: 'green',  desc: 'Defining resolution criteria and proof' },
];

const colorMap = {
  blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-800'   },
  purple: { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  amber:  { bg: 'bg-amber-500',  light: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800'   },
  orange: { bg: 'bg-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  red:    { bg: 'bg-red-600',    light: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-800'       },
  green:  { bg: 'bg-emerald-600',light: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',badge: 'bg-emerald-100 text-emerald-800'},
};

const AiInvestigationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [violation, setViolation] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [revealedSteps, setRevealedSteps] = useState([]);

  useEffect(() => {
    fetchViolation();
  }, [id]);

  const fetchViolation = async () => {
    try {
      const res = await API.get(`/violations/${id}`);
      setViolation(res.data);
      if (res.data.investigationSummary) {
        setInvestigation(res.data.investigationSummary);
        setRevealedSteps(STEPS.map(s => s.key));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runInvestigation = async () => {
    setRunning(true);
    setInvestigation(null);
    setRevealedSteps([]);
    setActiveStep(0);

    try {
      // Animate through steps while waiting for API
      for (let i = 0; i < STEPS.length; i++) {
        setActiveStep(i);
        await new Promise(r => setTimeout(r, 700));
        setRevealedSteps(prev => [...prev, STEPS[i].key]);
      }
      const res = await API.post(`/ai/investigate/${id}`);
      setInvestigation(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
      setActiveStep(-1);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading AI Investigation Engine...</div>;
  }

  const riskColor = violation?.riskLevel === 'CRITICAL' ? 'text-red-600' :
    violation?.riskLevel === 'HIGH' ? 'text-orange-600' :
    violation?.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#F47C20]" />
              <span>AI Agent Investigation</span>
            </h1>
            <p className="text-xs text-gray-500">6-Step Reasoning Engine — Observe → Retrieve → Reason → Decide → Act → Verify</p>
          </div>
        </div>
        <button
          onClick={runInvestigation}
          disabled={running}
          className="flex items-center space-x-2 bg-[#252525] hover:bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded shadow transition disabled:opacity-50"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          <span>{running ? 'Investigating...' : 'Re-Run Investigation'}</span>
        </button>
      </div>

      {/* Violation Context Card */}
      {violation && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-[#252525] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#F47C20]" />
              <span className="font-extrabold text-sm">{violation.violationId}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                violation.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                violation.riskLevel === 'HIGH' ? 'bg-orange-600' :
                violation.riskLevel === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
              } text-white`}>{violation.riskLevel}</span>
            </div>
            <span className={`text-2xl font-black ${riskColor}`}>{violation.riskScore}/100</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wide block">Title</span>
              <span className="text-gray-900 font-semibold mt-0.5 block">{violation.title}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wide block flex items-center gap-1"><MapPin className="w-3 h-3"/>Mine</span>
              <span className="text-gray-900 font-semibold mt-0.5 block">{violation.mineId}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wide block flex items-center gap-1"><Calendar className="w-3 h-3"/>Detected</span>
              <span className="text-gray-900 font-semibold mt-0.5 block">{violation.detectedDate?.split('T')[0]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Step Progress Bar */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide mb-3">Investigation Progress</h3>
        <div className="flex items-center">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const c = colorMap[step.color];
            const isRevealed = revealedSteps.includes(step.key);
            const isActive = activeStep === idx;
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isRevealed ? c.bg + ' text-white shadow-md' :
                    isActive ? c.bg + ' text-white animate-pulse shadow-lg scale-110' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {isActive && !isRevealed ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[9px] font-extrabold mt-1 uppercase tracking-wide ${isRevealed ? c.text : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-all ${isRevealed && revealedSteps.includes(STEPS[idx+1]?.key) ? 'bg-gray-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Investigation Steps */}
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const c = colorMap[step.color];
        const isRevealed = revealedSteps.includes(step.key);
        const data = investigation?.[step.key];

        return (
          <div key={step.key} className={`rounded-lg border shadow-sm overflow-hidden transition-all duration-500 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-30'
          } ${c.border} ${c.light}`}>
            <div className={`px-4 py-3 flex items-center space-x-3 ${c.bg}`}>
              <div className="bg-white/20 p-1.5 rounded">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-extrabold text-sm">Step {idx + 1}: {step.label}</span>
                <p className="text-white/80 text-[11px]">{step.desc}</p>
              </div>
              {isRevealed && <CheckCircle2 className="w-5 h-5 text-white ml-auto" />}
            </div>

            <div className="p-4">
              {!isRevealed && (
                <p className="text-xs text-gray-400 font-medium italic">Waiting for investigation to run...</p>
              )}
              {isRevealed && !data && (
                <p className="text-xs text-gray-400 font-medium">No data captured for this step.</p>
              )}
              {isRevealed && data && (
                <div className="space-y-3 text-xs">
                  {step.key === 'observe' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(data).map(([k, v]) => v && (
                        <div key={k} className="bg-white rounded border border-gray-200 p-2">
                          <span className="text-gray-400 font-bold uppercase text-[10px] block">{k}</span>
                          <span className="text-gray-900 font-semibold mt-0.5 block truncate">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.key === 'retrieve' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-gray-700 uppercase tracking-wide text-[11px] mb-2">Applicable Regulations</h4>
                        <div className="space-y-2">
                          {(data.regulations || []).map((r, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded p-2.5">
                              <span className={`${c.badge} text-[10px] font-bold px-1.5 py-0.5 rounded`}>{r.rule || r.act}</span>
                              <p className="text-gray-800 font-semibold mt-1">{r.title}</p>
                              {r.mandatoryAction && <p className="text-gray-500 mt-0.5">{r.mandatoryAction}</p>}
                            </div>
                          ))}
                          {(!data.regulations || data.regulations.length === 0) && <p className="text-gray-400">No regulations matched.</p>}
                        </div>
                      </div>
                      {data.historicalCases && data.historicalCases.length > 0 && (
                        <div>
                          <h4 className="font-extrabold text-gray-700 uppercase tracking-wide text-[11px] mb-2">Historical Cases</h4>
                          {data.historicalCases.map((h, i) => (
                            <p key={i} className="text-gray-600 py-1 border-b border-gray-100 last:border-0">{h}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {step.key === 'reason' && (
                    <div className="space-y-3">
                      <div className={`${c.light} border ${c.border} rounded p-3`}>
                        <p className="font-extrabold text-gray-800 text-sm">{data.finding}</p>
                        <p className="text-gray-600 mt-1">{data.evidence}</p>
                      </div>
                      {data.risk_factors && (
                        <div>
                          <h4 className="font-extrabold text-gray-700 uppercase tracking-wide text-[11px] mb-2">Risk Factors Identified</h4>
                          <div className="space-y-1">
                            {data.risk_factors.map((f, i) => (
                              <div key={i} className="flex items-start space-x-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-gray-700">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.historical_context && (
                        <div className="bg-white border border-gray-200 rounded p-2.5">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">Historical Context</span>
                          <p className="text-gray-700 mt-0.5">{data.historical_context}</p>
                        </div>
                      )}
                      {data.confidence && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">AI Confidence:</span>
                          <span className={`${c.badge} font-extrabold px-2 py-0.5 rounded`}>{data.confidence}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {step.key === 'decide' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Risk Category</span>
                        <span className={`font-extrabold text-base ${riskColor}`}>{data.riskCategory}</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Action Required</span>
                        <span className="font-extrabold text-emerald-700 text-base">{data.actionRequired ? 'YES — IMMEDIATE' : 'No'}</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Escalation Level</span>
                        <span className="font-extrabold text-red-700 text-sm">{data.escalationLevel}</span>
                      </div>
                    </div>
                  )}
                  {step.key === 'act' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Recommended Action</span>
                        <span className="text-gray-900 font-semibold">{data.recommendedAction}</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block flex items-center gap-1"><Clock className="w-3 h-3"/>Deadline</span>
                        <span className="font-extrabold text-red-700">{data.suggestedDeadlineDays} days</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block flex items-center gap-1"><User className="w-3 h-3"/>Assign To</span>
                        <span className="text-gray-900 font-semibold">{data.targetRole}</span>
                      </div>
                    </div>
                  )}
                  {step.key === 'verify' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Verification Method</span>
                        <span className="text-gray-900 font-semibold">{data.verificationMethod}</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <span className="text-gray-400 font-bold uppercase text-[10px] block">Required Approver</span>
                        <span className="text-gray-900 font-semibold">{data.requiredApprover}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Action Footer */}
      {investigation && (
        <div className="bg-[#252525] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white text-xs">
            <span className="font-extrabold text-[#F47C20]">Investigation Complete</span>
            <span className="text-gray-400 ml-2">Generated at {investigation.generatedAt?.split('T')[0]}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/violations/${id}`}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded transition"
            >
              View Violation
            </Link>
            <Link
              to="/corrective-actions"
              className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 text-xs font-extrabold px-4 py-2 rounded transition flex items-center space-x-1"
            >
              <span>Create Corrective Action</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Trigger first run if no investigation */}
      {!investigation && !running && (
        <div className="text-center py-8">
          <Cpu className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500 mb-4">No investigation data yet. Run the AI Agent to analyze this violation.</p>
          <button
            onClick={runInvestigation}
            className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-extrabold text-sm px-6 py-3 rounded shadow-lg transition"
          >
            🔍 Launch AI Investigation
          </button>
        </div>
      )}
    </div>
  );
};

export default AiInvestigationPage;
