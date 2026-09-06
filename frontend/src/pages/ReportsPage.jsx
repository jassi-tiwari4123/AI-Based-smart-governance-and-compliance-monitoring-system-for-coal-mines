import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { BarChart3, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await API.get('/reports/compliance');
      setReport(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (type) => {
    window.open(`/api/reports/export/${type}`, '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Generating Statutory Compliance Report...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Statutory Compliance & Regulatory Reports</h1>
          <p className="text-xs text-gray-600">Exportable Governance Data for Ministry of Coal & DGMS Regulators</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportCSV('violations')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-3.5 py-2 rounded shadow transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Violations CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded shadow transition flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Report Document Box */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm space-y-6">
        <div className="border-b pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">STATUTORY REPORT</span>
            <h2 className="text-xl font-black text-gray-900">{report?.reportType}</h2>
            <span className="text-xs text-gray-500 font-mono block mt-1">Generated: {report?.generatedAt}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-gray-800 block">DIRECTORATE GENERAL OF MINES SAFETY</span>
            <span className="text-[10px] text-gray-500">Ministry of Coal Compliance Monitoring</span>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded border">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Monitored Mines</span>
            <span className="text-xl font-extrabold text-gray-900">{report?.summary?.totalMines}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Average Compliance</span>
            <span className="text-xl font-extrabold text-emerald-700">{report?.summary?.averageComplianceScore}%</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Inspections</span>
            <span className="text-xl font-extrabold text-gray-900">{report?.summary?.totalInspections}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Critical Violations</span>
            <span className="text-xl font-extrabold text-red-600">{report?.summary?.criticalViolations}</span>
          </div>
        </div>

        {/* Mine Summary Table */}
        <div>
          <h3 className="text-xs font-extrabold uppercase text-gray-900 mb-3">Mine Governance & Risk Ranking Summary</h3>
          <table className="w-full text-left text-xs border border-gray-300">
            <thead className="bg-[#252525] text-white uppercase text-[10px]">
              <tr>
                <th className="p-2 border-b">Mine ID</th>
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">State</th>
                <th className="p-2 border-b">Compliance Score</th>
                <th className="p-2 border-b">Risk Level</th>
                <th className="p-2 border-b text-center">Open Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium">
              {report?.minePerformance?.map((m) => (
                <tr key={m.mineId}>
                  <td className="p-2 font-mono font-bold">{m.mineId}</td>
                  <td className="p-2 font-bold">{m.name}</td>
                  <td className="p-2">{m.state}</td>
                  <td className="p-2 font-extrabold">{m.complianceScore}%</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      m.riskLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-600'
                    }`}>
                      {m.riskLevel}
                    </span>
                  </td>
                  <td className="p-2 text-center font-bold text-amber-700">{m.openViolations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
