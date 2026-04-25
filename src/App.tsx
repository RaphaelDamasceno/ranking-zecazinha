/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, TrendingUp, Calendar, Medal, Award, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function App() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [directorateRanking, setDirectorateRanking] = useState<any[]>([]);
  const [totalAgendamentos, setTotalAgendamentos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [newBooking, setNewBooking] = useState<any>(null);
  const metaEvento = 5000;
  const progress = (totalAgendamentos / metaEvento) * 100;

  // Use a ref to track the previous count without triggering useEffect re-runs
  const prevCountRef = useRef(0);
  
  const fetchSheetData = async (isInitial = false) => {
    try {
      const url = 'https://docs.google.com/spreadsheets/d/1qHObVRBjTQuUuHjFJN7_z60kKEfqkhzr8Zjogp7ydUg/gviz/tq?tqx=out:csv';
      const res = await fetch(url);
      const text = await res.text();
      
      const rows = text.split('\n').map(row => {
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
      }).filter(row => row.length > 0);

      if (rows.length < 2) return;

      const dataRows = rows.slice(1);
      const currentCount = dataRows.length;
      
      const toTitleCase = (str: string) => {
        return str.toLowerCase().trim().split(/\s+/).map(word => {
          if (word.length === 0) return '';
          const lower = ['de', 'da', 'do', 'dos', 'das', 'e'].includes(word);
          if (lower) return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      };

      const brokerCounts: Record<string, { name: string, unit: string, count: number }> = {};
      const dirCounts: Record<string, number> = {};
      
      dataRows.forEach(row => {
        const rawName = row[1];
        const team = row[2] || '';
        const rawDir = row[3] || 'OUTROS';
        
        if (!rawName) return;
        
        const cleanNameKey = rawName.trim().toUpperCase().replace(/\s+/g, ' ');
        const displayName = toTitleCase(cleanNameKey);
        const cleanDir = rawDir.trim().toUpperCase();
        
        if (!brokerCounts[cleanNameKey]) {
          brokerCounts[cleanNameKey] = { 
            name: displayName, 
            unit: toTitleCase(`${team} / ${rawDir}`.replace(/^\s*\/?\s*|\s*\/?\s*$/g, '')), 
            count: 0 
          };
        }
        brokerCounts[cleanNameKey].count++;
        dirCounts[cleanDir] = (dirCounts[cleanDir] || 0) + 1;
      });

      const processedRanking = Object.values(brokerCounts)
        .sort((a, b) => b.count - a.count)
        .map((item, index) => ({
          id: index + 1,
          ...item
        }));

      const processedDirRanking = Object.entries(dirCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name: toTitleCase(name), count }));

      // Handle Notification for new entry
      if (!isInitial && currentCount > prevCountRef.current) {
        const newest = dataRows[dataRows.length - 1];
        const brokerName = toTitleCase(newest[1]);
        const project = newest[5] || 'Imóvel MCMV';
        
        setNewBooking({
          name: brokerName,
          team: toTitleCase(newest[2] || 'Tropa de Elite'),
          project: project
        });
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 8000);

        setLastNotification(`🚀 AGENDOU! ${brokerName} tá imparável!`);
        setTimeout(() => setLastNotification(null), 6000);
      }

      setRanking(processedRanking);
      setDirectorateRanking(processedDirRanking);
      setTotalAgendamentos(currentCount);
      prevCountRef.current = currentCount;
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sheet:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetData(true);
    const interval = setInterval(() => fetchSheetData(false), 20000);
    return () => clearInterval(interval);
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-dark font-black tracking-widest uppercase text-sm">Carregando Ranking...</p>
        </div>
      </div>
    );
  }

  const podium = ranking.slice(0, 3);
  const list = ranking.slice(3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const displayPodium = [];
  if (podium[1]) displayPodium.push(podium[1]);
  if (podium[0]) displayPodium.push(podium[0]);
  if (podium[2]) displayPodium.push(podium[2]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans overflow-hidden relative">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 bg-texture pointer-events-none" />
      
      {/* NEW APPOINTMENT POPUP */}
      <AnimatePresence>
        {showPopup && newBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative bg-white rounded-[40px] p-12 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(255,255,255,0.2)] border-t-[12px] border-brand-blue"
            >
              {/* Confetti simulation/Particles would be nice but let's stick to brand assets */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2">
                <motion.img 
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [-2, 2, -2]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  src="https://i.postimg.cc/fJVzDvyQ/erasebg-transformed.png" 
                  alt="Zeca Zinha"
                  className="w-48 h-48 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]"
                />
              </div>

              <div className="mt-20 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="bg-brand-dark text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-[0.3em] inline-block mb-4">
                    🔥 BROCOU! AGENDOU! 🔥
                  </span>
                  <h2 className="text-6xl font-black text-brand-dark uppercase leading-[0.9] tracking-tighter mb-2">
                    {newBooking.name}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-brand-light font-display text-2xl font-black uppercase">
                    <Star fill="currentColor" size={24} />
                    {newBooking.team}
                    <Star fill="currentColor" size={24} />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 mt-8"
                >
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1">PRODUTO LANÇADO:</p>
                  <p className="text-3xl font-black text-brand-dark uppercase tracking-tight">{newBooking.project}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pt-6"
                >
                  <p className="text-brand-dark font-black text-xl italic uppercase">"Sente o cheiro da comissão! BORA VENDER!"</p>
                </motion.div>
              </div>
              
              {/* Decoration */}
              <div className="absolute bottom-0 right-0 p-4 opacity-10">
                <TrendingUp size={120} className="text-brand-dark" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 h-screen relative z-10">
        
        {/* Sidebar - Consistent with Brand */}
        <motion.aside 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-[24px] p-8 shadow-xl border-t-[8px] border-brand-dark flex flex-col h-full relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-dark/5 rounded-full -mr-16 -mt-16" />
          
          <img 
            src="https://morarbempe.com.br/wp-content/uploads/2023/06/logofull-600x163.png" 
            alt="Morar Bem Logo" 
            className="w-full mb-10 relative z-10"
          />

          <div className="space-y-6 relative z-10">
            {/* ALERT NOTIFICATION */}
            <AnimatePresence>
              {lastNotification && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 overflow-hidden"
                >
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>
                    <Star size={20} fill="currentColor" />
                  </motion.div>
                  <p className="text-xs font-black uppercase leading-tight">{lastNotification}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-brand-dark" />
                <span className="text-[11px] uppercase tracking-[0.1em] font-black text-slate-400">Placar Geral</span>
              </div>
              <span className="text-4xl font-black text-brand-dark tabular-nums flex items-end gap-1">
                {totalAgendamentos.toLocaleString('pt-BR')}
                <span className="text-xs text-green-600 font-bold mb-1.5 flex items-center">
                  <TrendingUp size={12} /> BORA!
                </span>
              </span>
            </div>

            {/* RANKING DIRETORIAS */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-inner">
              <div className="flex items-center gap-2 mb-4">
                <Medal size={16} className="text-brand-dark" />
                <span className="text-[11px] uppercase tracking-[0.1em] font-black text-slate-400">Ranking Diretorias</span>
              </div>
              <div className="space-y-3">
                {directorateRanking.slice(0, 5).map((dir, i) => (
                  <div key={dir.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${i === 0 ? 'bg-amber-400 text-brand-dark' : 'bg-slate-200 text-slate-500'}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-brand-dark truncate max-w-[120px]">{dir.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-brand-light">{dir.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto text-center relative z-10">
            <div className="bg-brand-dark/5 p-4 rounded-2xl mb-6 italic text-sm text-slate-600 font-medium leading-relaxed">
              "Faca na caveira, tropa! O Zeca Zinha só para quando zerar o estoque!"
            </div>
            
            <div className="relative inline-block pb-4">
              <motion.div 
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <img 
                  src="https://i.postimg.cc/fJVzDvyQ/erasebg-transformed.png" 
                  alt="Zeca Zinha" 
                  className="w-32 h-32 object-contain mx-auto drop-shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6 overflow-hidden">
          
          {/* Header Bar - High Impact */}
          <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-6">
              <div className="relative">
                <motion.img 
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  src="https://i.postimg.cc/fJVzDvyQ/erasebg-transformed.png" 
                  alt="Zeca Zinha Mini" 
                  className="w-14 h-14 object-contain drop-shadow-md"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="font-display text-[54px] leading-[0.8] font-black text-brand-dark uppercase tracking-tighter">
                  RANKING
                </h2>
                <div className="flex items-center gap-3">
                  <span className="font-display text-[22px] font-extrabold text-brand-light uppercase tracking-tight">
                    DE ATENDIMENTOS
                  </span>
                  <div className="h-[2px] bg-brand-light flex-1 min-w-[100px]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Última atualização</p>
                  <p className="text-sm font-bold text-brand-dark">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h • {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center relative">
                  <TrendingUp className="text-emerald-600" size={20} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </div>
              </div>
            </div>
          </motion.header>

          <main className="grid grid-rows-[340px_1fr] gap-6 overflow-hidden">
            
            {/* Monumental Podium - Exact Match to Design */}
            <section className="grid grid-cols-3 gap-0 px-10 items-end min-h-[300px]">
              <AnimatePresence mode="popLayout">
                {displayPodium.map((user, idx) => {
                  const actualRank = user === podium[0] ? 1 : user === podium[1] ? 2 : 3;
                  
                  // Styles based on rank
                  const rankStyles = {
                    1: {
                      bg: 'bg-brand-dark',
                      height: 'h-[260px]',
                      number: '1',
                      glow: 'shadow-[0_-20px_50px_-12px_rgba(13,36,71,0.3)]',
                      accent: 'text-amber-400'
                    },
                    2: {
                      bg: 'bg-brand-blue',
                      height: 'h-[200px]',
                      number: '2',
                      glow: '',
                      accent: 'text-slate-200'
                    },
                    3: {
                      bg: 'bg-brand-light',
                      height: 'h-[160px]',
                      number: '3',
                      glow: '',
                      accent: 'text-brand-dark'
                    }
                  }[actualRank];

                  return (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      {/* Avatar & Info */}
                      <div className="mb-4 text-center">
                        <p className="font-black text-brand-dark uppercase tracking-tight text-sm line-clamp-1">{user.name}</p>
                        <p className="text-slate-400 font-extrabold uppercase text-[10px] tracking-widest mt-1">{user.unit}</p>
                      </div>

                      {/* The Block */}
                      <div className={`w-full ${rankStyles.height} ${rankStyles.bg} ${rankStyles.glow} rounded-t-lg flex flex-col items-center justify-center border-x border-t border-white/10 group relative`}>
                        <span className="font-display text-[100px] font-black text-white/20 leading-none tracking-tighter select-none absolute top-1/2 -translate-y-1/2">
                          {rankStyles.number}
                        </span>
                        
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full mb-1 ${actualRank === 1 ? 'bg-amber-400 text-brand-dark' : 'bg-white/10 text-white backdrop-blur-sm'}`}>
                            <Star size={12} fill="currentColor" />
                            <span className="text-2xl font-black tabular-nums tracking-tighter">{user.count}</span>
                          </div>
                          <span className={`${actualRank === 1 ? 'text-amber-400/80' : 'text-white/60'} text-[10px] uppercase font-black tracking-widest`}>Agendamentos</span>
                        </div>
                        
                        {actualRank === 1 && (
                          <div className="absolute top-4 right-4 text-amber-400/20">
                            <Trophy size={48} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>

            {/* List Table - Refined and Dense */}
            <section className="bg-white rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4">
              <div className="overflow-y-auto h-full scrollbar-none">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b-2 border-slate-100">
                    <tr>
                      <th className="px-8 py-5 font-display text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Posição</th>
                      <th className="px-8 py-5 font-display text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Consultor</th>
                      <th className="px-8 py-5 font-display text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Unidade / Equipe</th>
                      <th className="px-8 py-5 font-display text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Desempenho</th>
                      <th className="px-8 py-5 font-display text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((user, idx) => (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 transition-all group"
                      >
                        <td className="px-8 py-4">
                          <span className="font-display text-lg font-black text-slate-300 group-hover:text-brand-dark transition-colors">
                            #{idx + 4}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center font-black text-sm shadow-sm">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-bold text-brand-dark tracking-tight">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">{user.unit}</span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(user.count / (podium[0]?.count || 1)) * 100}%` }}
                                className="h-full bg-brand-blue rounded-full"
                              />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 tabular-nums">
                              {Math.round((user.count / (podium[0]?.count || 1)) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <span className="font-display text-xl font-black text-brand-dark tabular-nums">
                            {user.count}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Decorative Assets */}
      <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
        <Award size={400} strokeWidth={1} />
      </div>
    </div>
  );
}

