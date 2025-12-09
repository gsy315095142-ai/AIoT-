
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cpu } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [showInput, setShowInput] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username);
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 relative overflow-hidden flex flex-col items-center justify-between py-20 px-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-900"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* Content */}
      <div className="z-10 text-center mt-10">
        <h1 className="text-3xl font-extrabold text-white tracking-widest drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] leading-tight">
          IoT设备<br/>
          <span className="text-2xl text-blue-300">管理平台</span>
        </h1>
        <div className="mt-2 h-1 w-20 bg-blue-500 mx-auto rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
      </div>

      <div className="z-10 flex-1 flex items-center justify-center w-full my-4 relative">
        <div className="relative w-72 h-72 flex items-center justify-center">
           {/* Sci-Fi Circle / Glow Animation */}
           <div className="absolute inset-0 bg-blue-600 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
           <div className="absolute inset-0 border border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
           <div className="absolute inset-4 border border-cyan-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
           
           {/* Replaced broken image with abstract tech icon */}
           <Cpu size={80} className="text-blue-500/50 relative z-10 animate-pulse drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
           
           {/* HUD overlay effects simulation */}
           <div className="absolute top-1/2 -left-4 w-8 h-[2px] bg-blue-400/80"></div>
           <div className="absolute top-1/2 -right-4 w-8 h-[2px] bg-blue-400/80"></div>
           
           {/* Floating Info Box Simulation */}
           <div className="absolute bottom-4 -right-2 bg-slate-900/80 border border-blue-500/50 p-2 rounded text-[8px] text-blue-200 font-mono backdrop-blur">
              <div className="flex gap-2">
                 <span>SYS: ONLINE</span>
                 <span className="text-green-400">●</span>
              </div>
              <div className="w-full bg-slate-700 h-1 mt-1 rounded overflow-hidden">
                 <div className="bg-blue-500 w-[80%] h-full"></div>
              </div>
           </div>
        </div>
      </div>

      <div className="z-10 w-full mb-10">
        {!showInput ? (
          <button 
            onClick={() => setShowInput(true)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xl rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400/50 active:scale-95 transition-all relative overflow-hidden group"
          >
            <span className="relative z-10">登 录</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        ) : (
          <form onSubmit={handleLogin} className="animate-fadeIn">
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-blue-500/30 shadow-2xl relative">
              {/* Corner Decorations */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-400"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-blue-400"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-blue-400"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-blue-400"></div>

              <label className="block text-blue-300 text-sm font-bold mb-3 tracking-wider uppercase text-center">用户身份认证</label>
              
              <input 
                autoFocus
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-800/50 border border-blue-500/50 rounded-lg p-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-4 text-center placeholder-slate-600 transition-all"
                placeholder="请输入用户名称"
              />
              
              <button 
                type="submit"
                disabled={!username.trim()}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-3 border border-cyan-400/30"
              >
                进入系统
              </button>
              
              <button 
                type="button"
                onClick={() => setShowInput(false)}
                className="w-full py-2 text-slate-400 text-xs hover:text-white transition-colors"
              >
                返回
              </button>
            </div>
          </form>
        )}
        <p className="text-center text-slate-500 text-[10px] mt-6 tracking-widest uppercase">
            System Version v2.4.0
        </p>
      </div>
    </div>
  );
};
