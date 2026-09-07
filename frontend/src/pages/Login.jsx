import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const { login, loading }      = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

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
        <p className="text-center text-xs text-gray-500 mt-1">
          Authorized Coal Mine Governance &amp; Statutory Monitoring
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-8 shadow-md border border-gray-300 rounded-lg">
          {error && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-600 p-3 text-xs text-red-700 flex items-center gap-2 rounded-r">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@mineguard.gov.in"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-2.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md shadow-sm text-xs font-extrabold text-slate-950 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-60 focus:outline-none transition"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to MineGuard'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-gray-400">
            Contact your Corporate Admin if you do not have an account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
