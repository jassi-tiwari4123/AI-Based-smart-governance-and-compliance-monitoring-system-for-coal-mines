import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('inspector@mineguard.gov.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const quickDemoAccounts = [
    { role: 'INSPECTOR', label: 'Inspector (Ananya Sharma)', email: 'inspector@mineguard.gov.in', desc: 'Create inspections & field observations' },
    { role: 'MINE_MANAGER', label: 'Mine Manager (Subhashish Panda)', email: 'manager@mineguard.gov.in', desc: 'Assign actions & verify compliance' },
    { role: 'CORPORATE_ADMIN', label: 'Corporate Admin (Rajesh Kumar)', email: 'admin@mineguard.gov.in', desc: 'Enterprise executive overview' },
    { role: 'REGULATOR', label: 'Coal Regulator (Dr. V. K. Singh)', email: 'regulator@mineguard.gov.in', desc: 'Statutory compliance & audit access' },
    { role: 'CONTRACTOR', label: 'Contractor (Vikram Heavy Infra)', email: 'contractor@mineguard.gov.in', desc: 'Submit corrective evidence & task status' },
    { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'superadmin@mineguard.gov.in', desc: 'Full system administration' },
  ];

  return (
    <div className="min-h-screen bg-[#F3F3F1] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-[#252525] p-3 rounded-md shadow-md text-white flex items-center space-x-3">
            <div className="bg-[#F47C20] p-2 rounded">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-wider block leading-none">MINEGUARD</span>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">AI Coal Governance System</span>
            </div>
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-gray-900">
          Sign in to Mine Compliance Platform
        </h2>
        <p className="text-center text-xs text-gray-600 mt-1">
          Authorized Coal Mine Governance & Statutory Monitoring
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-md border border-gray-300 rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-3 text-xs text-red-700 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Official Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-bold text-slate-950 bg-[#F47C20] hover:bg-orange-600 focus:outline-none transition"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to MineGuard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 border-t border-gray-200 pt-5">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Demo Account Role:</span>
            <div className="grid grid-cols-1 gap-2">
              {quickDemoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('password123');
                  }}
                  className={`text-left p-2.5 rounded border text-xs flex items-center justify-between transition ${
                    email === acc.email
                      ? 'border-[#F47C20] bg-orange-50/70 font-bold text-gray-900'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-gray-900">{acc.label}</span>
                    <span className="text-[10px] text-gray-500 block">{acc.desc}</span>
                  </div>
                  {email === acc.email && <UserCheck className="w-4 h-4 text-[#F47C20]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
