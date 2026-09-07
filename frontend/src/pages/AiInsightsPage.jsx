import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Cpu, BookOpen, AlertTriangle, FileText, ChevronRight, RefreshCw } from 'lucide-react';

const AiInsightsPage = () => {
  const [violations, setViolations] = useState([]);
  const [kb, setKb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kbLoading, setKbLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/violations').then(r => setViolations((r.data || []).filter(v => v.riskLevel && v.riskLevel !== 'LOW').slice(0, 15))),
      API.get('/ai/knowledge-base').then(r => setKb(r.data)).catch(() => {})
    ]).finally(() => { setLoading(false); setKbLoading(false); });
  }, []);

  const critical = violations.filter(v => v.riskLevel === 'CRITICAL');
  const high = violations.filter(v => v.riskLevel === 'HIGH');

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#F47C20]" />AI Risk & Insights Engine
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time risk scoring, violation detection, and AI-powered compliance insights</p>
        </div>
      </div>

      {/* Risk Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total AI-Analyzed', val: violations.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Critical Risk', val: critical.length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'High Risk', val: high.length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Knowledge Base', val: kb ? `${kb.regulationsCount} regs` : '—', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((k, i) => (
          <div key={i} className={`${k.bg} border border-gray-200 rounded-lg p-4 shadow-sm`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{k.label}</p>
            <p className={`text-2xl font-black ${k.color} mt-1`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Critical + High Risk Violations */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />High Priority Violations — AI Risk Scores
        </h2>
        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400 animate-pulse">Fetching AI risk data...</div>
        ) : (
          violations.map(v => {
            const riskColor = v.riskLevel === 'CRITICAL' ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50';
            const scoreColor = v.riskLevel === 'CRITICAL' ? 'text-red-600' : 'text-orange-600';
            const badgeBg = v.riskLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-600';
            return (
              <div key={v.violationId} className={`bg-white border rounded-lg shadow-sm overflow-hidden border-gray-200`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-gray-500">{v.violationId}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${badgeBg}`}>{v.riskLevel}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${v.severity === 'CRITICAL' ? 'bg-red-700' : v.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{v.severity}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{v.title}</p>
                      <p className="text-xs text-gray-500">{v.mineId} · {v.category} · {v.detectedDate?.split('T')[0]}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    <div className="text-right">
                      <p className={`text-2xl font-black ${scoreColor}`}>{v.riskScore}</p>
                      <p className="text-[10px] text-gray-400">/100</p>
                    </div>
                    <Link to={`/ai-investigation/${v.violationId}`}
                      className="flex items-center gap-1.5 bg-[#252525] hover:bg-gray-700 text-white font-bold text-xs px-3 py-1.5 rounded transition">
                      <Cpu className="w-3.5 h-3.5 text-[#F47C20]" /><span>Investigate</span>
                    </Link>
                  </div>
                </div>
                {v.aiAnalysis?.riskFactors && (
                  <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex flex-wrap gap-2">
                    {v.aiAnalysis.riskFactors.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium">
                        ⚠ {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        {!loading && violations.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Cpu className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold">No high-risk violations found</p>
            <p className="text-xs mt-1">All violations are currently LOW risk</p>
          </div>
        )}
      </div>

      {/* Knowledge Base */}
      {kb && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />AI Knowledge Base
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Regulations ({kb.regulationsCount})</p>
              <div className="space-y-2">
                {(kb.regulations || []).slice(0, 4).map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded p-2 text-xs">
                    <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">{r.ruleNumber}</span>
                    <p className="font-semibold text-gray-700 mt-1 leading-tight">{r.title}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">SOPs ({kb.sopsCount})</p>
              <div className="space-y-2">
                {(kb.sops || []).map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded p-2 text-xs">
                    <p className="font-semibold text-gray-700">{s.title}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{s.category}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Historical Cases ({kb.historicalViolationsCount})</p>
              <div className="space-y-2">
                {(kb.historicalViolations || []).map((h, i) => (
                  <div key={i} className="bg-gray-50 rounded p-2 text-xs">
                    <p className="font-semibold text-gray-700 leading-tight">{h.title}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Resolution: {h.resolution?.slice(0, 60)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiInsightsPage;
