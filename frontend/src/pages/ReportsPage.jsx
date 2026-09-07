import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { BarChart2, Download, RefreshCw, CheckCircle2, AlertTriangle, FileText, Cpu } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/compliance');
      setReport(res.data);
      setGenerated(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { generateReport(); }, []);

  const categoryData = report ? Object.entries(report.categoryBreakdown || {}).map(([k, v]) => ({
    name: k.charAt(0) + k.slice(1).toLowerCase(),
    violations: v,
    fill: k === 'SAFETY' ? '#DC2626' : k === 'ENVIRONMENT' ? '#16A34A' : k === 'PRODUCTION' ? '#2563EB' : '#D97706',
  })) : [];

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#F47C20]" />
            Statutory Compliance Reports
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">DGMS / CPCB / Labour Department — Exportable Audit Reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={generateReport} disabled={loading}
            className="flex items-center gap-1.5 bg-[#252525] text-white font-bold text-xs px-3 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5 text-[#F47C20]" />}
            <span>{loading ? 'Generating...' : 'Regenerate'}</span>
          </button>
          <a href="/api/reports/export/violations" target="_blank"
            className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3 py-2 rounded transition">
            <Download className="w-3.5 h-3.5" /><span>Export Violations CSV</span>
          </a>
          <a href="/api/reports/export/inspections" target="_blank"
            className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs px-3 py-2 rounded transition">
            <Download className="w-3.5 h-3.5" /><span>Export Inspections</span>
          </a>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Cpu className="w-10 h-10 text-[#F47C20] animate-pulse" />
          <p className="text-sm font-bold text-gray-600">AI generating compliance report...</p>
          <p className="text-xs text-gray-400">Analyzing inspections, violations, and corrective actions</p>
        </div>
      )}

      {report && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Mines', val: report.summary.totalMines, color: 'text-blue-600' },
              { label: 'Avg Compliance', val: `${report.summary.averageComplianceScore}%`, color: 'text-emerald-600' },
              { label: 'Total Inspections', val: report.summary.totalInspections, color: 'text-gray-700' },
              { label: 'Total Violations', val: report.summary.totalViolations, color: 'text-amber-600' },
              { label: 'Open Violations', val: report.summary.openViolations, color: 'text-orange-600' },
              { label: 'Critical', val: report.summary.criticalViolations, color: 'text-red-600' },
            ].map((k, i) => (
              <div key={i} className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{k.label}</p>
                <p className={`text-2xl font-black ${k.color} mt-1`}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Report meta */}
          <div className="bg-[#252525] text-white rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Report Type</p>
              <p className="font-extrabold text-white">{report.reportType}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Generated At</p>
              <p className="font-bold text-[#F47C20]">{report.generatedAt?.replace('T', ' ').slice(0, 19)} UTC</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Violations by Regulation Category</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="violations" radius={[4,4,0,0]}>
                      {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Regulation-wise Compliance Status</h3>
              <div className="space-y-3">
                {Object.entries(report.categoryBreakdown || {}).map(([cat, count]) => {
                  const colors = { SAFETY: '#DC2626', ENVIRONMENT: '#16A34A', PRODUCTION: '#2563EB', LABOUR: '#D97706' };
                  const color = colors[cat] || '#6B7280';
                  const maxVal = Math.max(...Object.values(report.categoryBreakdown));
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-extrabold text-gray-700">{cat}</span>
                        <span className="font-bold text-gray-500">{count} violations</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${maxVal > 0 ? (count/maxVal)*100 : 0}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mine Performance Table */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Mine-wise Performance Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Mine</th>
                    <th className="px-4 py-2.5">State</th>
                    <th className="px-4 py-2.5">Compliance</th>
                    <th className="px-4 py-2.5">Risk Level</th>
                    <th className="px-4 py-2.5 text-center">Inspections</th>
                    <th className="px-4 py-2.5 text-center">Open Violations</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(report.minePerformance || []).map(m => (
                    <tr key={m.mineId} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-bold text-gray-900">{m.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.state}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.complianceScore >= 85 ? 'bg-emerald-500' : m.complianceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${m.complianceScore}%` }} />
                          </div>
                          <span className="font-extrabold">{m.complianceScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          m.riskLevel === 'CRITICAL' ? 'bg-red-600' : m.riskLevel === 'HIGH' ? 'bg-orange-600' : m.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}>{m.riskLevel}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold">{m.totalInspections}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-amber-700">{m.openViolations}</td>
                      <td className="px-4 py-2.5">
                        {m.complianceScore >= 80
                          ? <span className="flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" />Compliant</span>
                          : <span className="flex items-center gap-1 text-red-700 font-bold"><AlertTriangle className="w-3.5 h-3.5" />Review Required</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
