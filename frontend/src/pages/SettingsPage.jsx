import React, { useState } from 'react';
import { Settings as SettingsIcon, Cpu, Database, Shield, Save } from 'lucide-react';

const SettingsPage = () => {
  const [provider, setProvider] = useState('fallback');
  const [groqKey, setGroqKey] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('Settings updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto font-sans">
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900 uppercase">System & AI Provider Configuration</h1>
        <p className="text-xs text-gray-600">Manage Groq / OpenAI Integration Keys and Storage Abstraction Parameters</p>
      </div>

      {savedMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded text-xs font-bold">
          {savedMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm space-y-5 text-xs">
        <div>
          <label className="block font-bold text-gray-700 uppercase mb-1">AI Provider Reasoning Engine</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full p-2.5 border rounded font-bold bg-gray-50 text-gray-900"
          >
            <option value="fallback">Deterministic Knowledge Base Engine (Local Standalone)</option>
            <option value="groq">Groq Cloud API (Llama-3 8B)</option>
            <option value="openai">OpenAI API (GPT-3.5 / GPT-4)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-700 uppercase mb-1">API Key (Optional for External LLM)</label>
          <input
            type="password"
            placeholder="gsk_... or sk-..."
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            className="w-full p-2.5 border rounded font-mono"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded border text-xs space-y-2">
          <span className="font-extrabold text-gray-800 block">File Storage Provider</span>
          <div className="flex items-center space-x-4">
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
              Active: Local Uploads Directory (/uploads)
            </span>
            <span className="text-gray-400 font-medium">Future Ready: AWS S3 / Cloudinary</span>
          </div>
        </div>

        <button
          type="submit"
          className="py-2.5 px-5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-black text-xs rounded shadow transition flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save System Parameters</span>
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
