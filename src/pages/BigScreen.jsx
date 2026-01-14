import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// Reusing the components from original App.jsx
const BatteryOverlay = ({ percent, particles = [] }) => {
  // --- 调节区域 START ---
  // 您可以手动修改以下数值来调整进度条位置
  const batteryStyle = {
    top: '19.3%',    // 垂直位置 (向上调小，向下调大)
    left: '21.8%',   // 水平位置 (向左调小，向右调大)
    width: '56.4%',  // 宽度
    height: '62%',   // 高度
    borderRadius: '4px',
  };
  // --- 调节区域 END ---

  return (
    <div className="absolute z-10 flex flex-col"
      style={{
        ...batteryStyle,
        background: 'rgba(10, 20, 15, 0.6)',
        border: '1px solid rgba(0, 255, 127, 0.3)',
        boxShadow: 'inset 0 0 30px rgba(0, 255, 127, 0.1)',
      }}
    >
      <div className="absolute inset-0 z-20 opacity-30 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 255, 127, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 127, 0.2) 1px, transparent 1px)', 
             backgroundSize: '20px 20px'
           }} 
      />
      
      <div className="w-full h-full relative overflow-hidden p-1">
          <div className="absolute bottom-1 left-1 right-1 bg-brand-green/10 h-[calc(100%-8px)] rounded-[4px] overflow-hidden flex flex-col justify-end">
              {/* Name Bubbles */}
              {particles.map(p => (
                <div
                  key={p.id}
                  className="absolute z-10 text-black font-black text-2xl whitespace-nowrap px-6 py-3 bg-gradient-to-r from-brand-green to-emerald-400 border-2 border-white rounded-full shadow-[0_0_20px_rgba(0,255,127,0.8)] animate-[bubbleUp_4s_ease-out_forwards]"
                  style={{
                    left: `${p.x}%`,
                    bottom: '0%', // Start from bottom
                    boxShadow: '0 0 15px rgba(0, 255, 127, 0.6)'
                  }}
                >
                  {p.name}
                </div>
              ))}

              <div 
                className="w-full bg-gradient-to-t from-brand-green via-[#00FF9D] to-brand-green shadow-[0_0_30px_rgba(0,255,127,0.6)] transition-all duration-700 ease-out relative"
                style={{ height: `${percent}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white shadow-[0_0_15px_#FFF] z-10" />
                <div className="absolute inset-0 animate-[chargeFlicker_2s_infinite] bg-white/10" />
              </div>
          </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="flex flex-col items-center">
            <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-xl border border-brand-green/20 shadow-2xl mb-2">
                <span className="text-6xl font-black tracking-tighter text-brand-green drop-shadow-[0_0_20px_rgba(0,255,127,0.8)] tabular-nums">
                    {Math.min(100, Math.round(percent * 100) / 100).toFixed(2)}<span className="text-3xl align-top ml-1">%</span>
                </span>
            </div>
            
            {/* Energy Loading Hint Removed */}
            
          </div>
      </div>
    </div>
  );
};

const LiveLogs = ({ logs }) => {
  // Take only the last 5 logs
  const displayLogs = logs.slice(0, 5);
  
  return (
    <div className="flex flex-col gap-4 w-full mt-auto">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-brand-green animate-pulse" />
            <span className="text-white/60 text-base font-bold tracking-wider">实时充电参与者</span>
        </div>
        <div className="flex flex-col gap-3 w-full">
            {displayLogs.map((log, index) => (
                <div key={index} className="flex items-center justify-between text-base border-b border-white/5 pb-2 animate-[slideIn_0.5s_ease-out]">
                    <div className="flex items-center gap-3">
                        <span className="text-brand-green font-bold">{log.message.split(' ')[0]}</span>
                        <span className="text-white/40">{log.message.split(' ').slice(1).join(' ')}</span>
                    </div>
                    <span className="text-white/20 font-mono scale-90">{log.timestamp}</span>
                </div>
            ))}
            {displayLogs.length === 0 && (
                <div className="text-white/20 text-sm italic">等待能量注入...</div>
            )}
        </div>
    </div>
  );
};

export default function BigScreen() {
  const [percent, setPercent] = useState(0);
  const [particles, setParticles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [joinUrl, setJoinUrl] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [triggerName, setTriggerName] = useState('');

  useEffect(() => {
    // Connect to Socket.io server
    const socketUrl = window.location.port === '5173' 
      ? `http://${window.location.hostname}:3001`
      : '/';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Set Join URL for QR Code (Initial fallback)
    const currentPort = window.location.port || '80';
    setJoinUrl(`http://${window.location.hostname}:${currentPort}/join`);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('init', (state) => {
      setPercent(state.progress);
      setLogs(state.logs);
      
      // Prefer public URL if available
      if (state.publicUrl) {
          setJoinUrl(`${state.publicUrl}/join`);
      } else {
          // Improved logic: If we are on a public IP/domain, use it. 
          // Only fallback to serverIp (LAN IP) if we are on localhost.
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (isLocalhost && state.serverIp) {
              // Use Vite dev server port in development, server port in production
              const isDev = import.meta.env.DEV;
              const port = isDev ? window.location.port || 5173 : state.port || 3001;
              setJoinUrl(`http://${state.serverIp}:${port}/join`);
          } else {
              // Use current hostname (works for Public IPs, domains, etc.)
              const port = window.location.port ? `:${window.location.port}` : '';
              setJoinUrl(`${window.location.protocol}//${window.location.hostname}${port}/join`);
          }
      }
    });

    newSocket.on('progress_update', (p) => {
      setPercent(p);
    });

    newSocket.on('new_log', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 50)); // Keep history but display limits in component
    });

    newSocket.on('spawn_particle', (data) => {
        const particleId = Date.now() + Math.random();
        // Generate random x position between 5% and 75% to stay within battery width
        const randomX = 5 + Math.random() * 70;
        setParticles(prev => [...prev, { id: particleId, name: data.name, x: randomX }]);
        
        // Remove particle after animation (4s for bubbleUp)
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== particleId));
        }, 4000);
    });

    newSocket.on('completion', (data) => {
        // Trigger massive effect
        setIsComplete(true);
        setTriggerName(data.name || 'Anonymous');
    });

    return () => newSocket.close();
  }, []);

  return (
    <div className="w-screen h-screen bg-[#050508] flex items-center justify-center overflow-hidden relative font-sans">
      {/* Celebration Overlay */}
      {isComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-[fadeIn_0.5s_ease-out]">
            <div className="relative flex flex-col items-center justify-center">
                {/* Rays of Light */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] animate-[spin_10s_linear_infinite]">
                    <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,127,0.2)_20deg,transparent_40deg,rgba(255,215,0,0.2)_60deg,transparent_80deg)]" />
                </div>
                
                <div className="relative z-10 text-center space-y-8 animate-[scaleUp_0.8s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                    <div className="text-brand-green text-[10vmin] font-black tracking-tighter drop-shadow-[0_0_50px_rgba(0,255,127,0.8)]">
                        ENERGY FULL
                    </div>
                    <div className="text-white text-[5vmin] font-bold tracking-widest">
                        充能完成
                    </div>
                    {triggerName && (
                        <div className="text-brand-gold text-[3vmin] font-mono mt-4 animate-pulse">
                            关键充能者: {triggerName}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Particles */}
      {particles.map(p => (
          <div key={p.id} 
               className="fixed z-50 pointer-events-none flex flex-col items-center animate-[energyFly_1.5s_ease-in-out_forwards]" 
               style={{
                   top: '60%', 
                   left: '40%', // Start closer to the machine
               }}
          >
              <div className="w-4 h-4 rounded-full bg-brand-green shadow-[0_0_20px_#00FF7F,0_0_40px_#00FF7F]" />
          </div>
      ))}

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050508] to-black opacity-50" />
      </div>

      <div className="w-full h-full max-w-[1700px] relative z-10 grid grid-cols-[1fr_520px] items-center gap-16 px-10 py-10">
         
         {/* Left Side: Machine (Prominent) */}
         <div className="relative flex items-center justify-center">
            <div className="relative h-[90vh] w-auto max-h-[980px] aspect-[450/800] -translate-y-[3vh]">
                 <img src="/charging-station.png" className="h-full w-full object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]" alt="Energy Cabinet" />
                 
                 {/* Logo on Machine */}
                 <div className="absolute left-[8%] top-[15%] bottom-[15%] w-[0.5%] min-w-[3px] bg-brand-yellow/80 shadow-[0_0_15px_rgba(255,215,0,0.5)] flex flex-col justify-center items-center py-4 overflow-hidden">
                    <div className="whitespace-nowrap -rotate-90 text-brand-black font-bold tracking-[0.5em] text-xs absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 text-center">
                        ROCHEX ENERGY
                    </div>
                 </div>

                 {/* Status Lights */}
                 <div className="absolute top-[12%] left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                    <div className="w-2 h-2 rounded-full bg-[#FF0000] opacity-30" />
                    <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                 </div>

                 {/* Center Energy Core */}
                 <div className="absolute top-[35%] left-1/2 -translate-x-1/2 z-20">
                     <div className="relative w-16 h-16 flex items-center justify-center">
                        <div
                          className={`absolute inset-0 rounded-full ${particles.length > 0 ? 'animate-[electricPulse_0.18s_ease-in-out_infinite]' : 'animate-[electricPulse_1.6s_ease-in-out_infinite]'}`}
                          style={{
                            background:
                              'radial-gradient(circle at 30% 30%, rgba(0,255,127,0.55) 0%, rgba(0,255,127,0.18) 35%, rgba(0,0,0,0) 70%)',
                            boxShadow:
                              '0 0 18px rgba(0,255,127,0.45), 0 0 40px rgba(0,255,127,0.18), inset 0 0 14px rgba(0,0,0,0.6)',
                          }}
                        />
                        <div className="absolute inset-0 rounded-full bg-brand-green/20 animate-pulse" />
                     </div>
                 </div>

                 <BatteryOverlay percent={percent} particles={particles} />
            </div>
         </div>

         {/* Right Side: Panel (Fixed Size Card) */}
         <div className="w-full flex flex-col justify-center">
            <div className="bg-[#0A0A10] border border-white/10 rounded-xl p-10 shadow-2xl relative overflow-hidden min-h-[620px] flex flex-col">
                
                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="w-56 h-56 bg-white p-3 rounded-lg relative">
                         <QRCodeSVG value={joinUrl} className="w-full h-full" />
                         <div className="absolute inset-0 border-2 border-brand-green/30 rounded-lg animate-pulse pointer-events-none" />
                    </div>
                    
                    <div className="text-center space-y-3">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20">
                            <span className="text-brand-green font-bold text-sm tracking-widest uppercase">扫码蓄力 | SCAN TO POWER UP</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold mt-2">
                            使用微信扫码<br/>
                            <span className="text-brand-text-blue">为年会注入能量</span>
                        </h2>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/10 mb-6" />

                {/* Live Logs Section */}
                <LiveLogs logs={logs} />
                
            </div>
         </div>

      </div>
    </div>
  );
}
