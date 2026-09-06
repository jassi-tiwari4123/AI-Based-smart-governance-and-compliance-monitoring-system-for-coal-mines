import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Cpu, BookOpen, Database, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AiInsightsPage = () => {
  const [kb, setKb] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const fetchKnowledgeBase = async () => {
    try {
      const res = await API.get('/ai/knowledge-base');
      setKb(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading AI Knowledge Base Index...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">AI Knowledge Base & Regulatory Index</h1>
          <p className="text-xs text-gray-600">Authentic Indexed Regulations (Coal Mines Regulations 2017, Mines Act 1952) & Historical Precedents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Statutory Regulations Indexed</span>
          <span className="text-2xl font-black text-gray-900">{kb?.regulationsCount || 0}</span>
          <span className="text-[10px] text-emerald-700 font-bold block mt-1">✓ Strictly Enforcement Verified</span>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Standard Operating Procedures</span>
          <span className="text-2xl font-black text-blue-600">{kb?.sopsCount || 0}</span>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Historical Violation Cases</span>
          <span className="text-2xl font-black text-purple-600">{kb?.historicalViolationsCount || 0}</span>
        </div>
      </div>

      {/* Indexed Regulations */}
      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b font-bold text-xs uppercase text-gray-900">
          Authentic Regulations Repository (AI Agent Retrieval Base)
        </div>
        <div className="divide-y divide-gray-200 text-xs">
          {kb?.regulations?.map((reg) => (
            <div key={reg.regId || reg._id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-amber-700">{reg.act}</span>
                <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">{reg.ruleNumber}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">{reg.category}</span>
              </div>
              <h3 className="font-bold text-gray-900 mt-1">{reg.title}</h3>
              <p className="text-gray-600 mt-1"><strong>Mandatory Action:</strong> {reg.mandatoryAction}</p>
              <p className="text-red-700 font-semibold text-[11px] mt-1">Penalty Clause: {reg.penaltyClause}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiInsightsPage;
