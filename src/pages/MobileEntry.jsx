import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Zap, CheckCircle } from 'lucide-react';

export default function MobileEntry() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = window.location.port === '5173' 
      ? `http://${window.location.hostname}:3001`
      : '/';
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleSubmit = () => {
    if (!name.trim() || !socket) return;
    
    setStatus('submitting');
    
    // Simulate network delay for effect
    setTimeout(() => {
        socket.emit('user_submit', { name });
        setStatus('success');
    }, 800);
  };

  if (status === 'success') {
      return (
        <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="w-24 h-24 rounded-full bg-brand-green/20 flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle className="w-12 h-12 text-brand-green" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">充能成功！</h1>
            <p className="text-brand-text-blue mb-8">感谢您的能量注入</p>
            <p className="text-brand-text-gray text-sm">请关注大屏幕查看能量汇聚效果</p>
            
            <button 
                onClick={() => { setName(''); setStatus('idle'); }}
                className="mt-12 px-6 py-2 rounded-full border border-white/10 text-brand-text-gray text-sm active:bg-white/5"
            >
                再次注入 (测试用)
            </button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 font-sans relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-green/5 to-transparent pointer-events-none" />
        
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full z-10">
            <div className="mb-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,255,127,0.1)]">
                    <Zap className="w-8 h-8 text-brand-green fill-current" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wider">ROCHEX ENERGY</h1>
                <p className="text-brand-text-gray text-sm mt-2">年会能量汇聚计划</p>
            </div>

            <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="space-y-2">
                    <label className="text-brand-text-gray text-xs font-bold uppercase tracking-widest ml-1">您的姓名 / Name</label>
                    <input 
                        type="text" 
                        placeholder="请输入姓名..." 
                        className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-4 text-white focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all placeholder:text-white/20 text-lg" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                    <button 
                        className="w-32 h-32 bg-brand-green rounded-full shadow-[0_0_30px_rgba(0,255,127,0.5)] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        onClick={handleSubmit}
                        disabled={!name.trim() || status === 'submitting'}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                        {status === 'submitting' ? (
                            <Zap className="w-16 h-16 text-brand-black animate-spin" />
                        ) : (
                            <Zap className="w-16 h-16 text-brand-black fill-current animate-[pulse_1s_infinite]" />
                        )}
                    </button>
                    <span className="text-brand-text-gray text-sm font-bold tracking-widest uppercase">
                        {status === 'submitting' ? '能量注入中...' : '点击闪电注入能量'}
                    </span>
                </div>
            </div>
        </div>
        
        <div className="py-6 text-center">
            <p className="text-white/20 text-xs">Powered by Rochex Tech</p>
        </div>
    </div>
  );
}
