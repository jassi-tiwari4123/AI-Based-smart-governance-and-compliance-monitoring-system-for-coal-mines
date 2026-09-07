import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Users, Search } from 'lucide-react';

const ContractorsList = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/corrective-actions')
      .then(r => setActions(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by contractor
  const contractorMap = {};
  actions.forEach(a => {
    const key = a.assignedTo || 'Unassigned';
    if (!contractorMap[key]) contractorMap[key] = { name: key, tasks: 0, pending: 0, completed: 0, escalated: 0 };
    contractorMap[key].tasks++;
    if (['ASSIGNED','IN_PROGRESS'].includes(a.status)) contractorMap[key].pending++;
    if (['VERIFIED','CLOSED'].includes(a.status)) contractorMap[key].completed++;
    if (['ESCALATED','ESCALATED_CORPORATE'].includes(a.status)) contractorMap[key].escalated++;
  });

  const contractors = Object.values(contractorMap).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading contractors...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F47C20]" />Contractor Compliance
          </h1>
          <p className="text-xs text-gray-500">{contractors.length} contractors with assigned tasks</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contractors..."
          className="flex-1 text-xs border-0 focus:ring-0 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contractors.map((c, i) => {
          const compRate = c.tasks > 0 ? Math.round((c.completed / c.tasks) * 100) : 0;
          return (
            <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-extrabold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.tasks} total assigned tasks</p>
                </div>
                {c.escalated > 0 && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded">
                    {c.escalated} ESCALATED
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500">Completion Rate</span>
                    <span className="font-extrabold text-gray-800">{compRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${compRate >= 75 ? 'bg-emerald-500' : compRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${compRate}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-amber-50 rounded p-1.5">
                    <p className="font-extrabold text-amber-700">{c.pending}</p>
                    <p className="text-gray-500 text-[10px]">Pending</p>
                  </div>
                  <div className="bg-emerald-50 rounded p-1.5">
                    <p className="font-extrabold text-emerald-700">{c.completed}</p>
                    <p className="text-gray-500 text-[10px]">Completed</p>
                  </div>
                  <div className="bg-red-50 rounded p-1.5">
                    <p className="font-extrabold text-red-700">{c.escalated}</p>
                    <p className="text-gray-500 text-[10px]">Escalated</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {contractors.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No contractors found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorsList;
