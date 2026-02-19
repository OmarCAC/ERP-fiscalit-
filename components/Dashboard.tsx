
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Calendar as CalendarIcon, 
  Activity, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Users, 
  Building2, 
  Filter, 
  AlertTriangle, 
  FileCheck,
  Wallet,
  TrendingUp,
  CreditCard,
  Banknote,
  Landmark,
  PieChart as PieChartIcon,
  ShieldCheck
} from 'lucide-react';
import { AppView, Taxpayer, Declaration } from '../types';

interface Props {
  onViewChange: (view: AppView) => void;
  taxpayers?: Taxpayer[];
  declarations?: Declaration[];
}

const Dashboard: React.FC<Props> = ({ onViewChange, taxpayers = [], declarations = [] }) => {
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<string>('ALL');

  // --- 1. CONTEXTE & FILTRAGE ---
  const currentTaxpayer = useMemo(() => {
    return taxpayers.find(t => t.id === selectedTaxpayerId);
  }, [selectedTaxpayerId, taxpayers]);

  const filteredDeclarations = useMemo(() => {
    if (selectedTaxpayerId === 'ALL') return declarations;
    return declarations.filter(d => d.taxpayerName === currentTaxpayer?.dynamicData['1']); 
  }, [selectedTaxpayerId, declarations, currentTaxpayer]);

  // --- 2. CALCUL DES KPIS RÉELS ---
  const kpiData = useMemo(() => {
    const totalPaid = filteredDeclarations
      .filter(d => d.status === 'PAYÉE' || d.status === 'ACCEPTÉE')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const pendingAmount = filteredDeclarations
      .filter(d => ['VALIDÉ', 'EN RETARD', 'EN COURS', 'TRANSMIS', 'À Payer'].includes(d.status))
      .reduce((sum, d) => sum + d.amount, 0);

    let healthScore = 100;
    const lateCount = filteredDeclarations.filter(d => d.status === 'EN RETARD').length;
    
    healthScore -= (lateCount * 15);
    if (healthScore < 0) healthScore = 0;

    return { totalPaid, pendingAmount, healthScore };
  }, [filteredDeclarations]);

  // --- 3. FLUX DE DÉCAISSEMENT FISCAL (REAL DATA) ---
  const cashFlowData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    // Initialisation
    const data = months.map(m => ({ name: m, paid: 0, due: 0 }));

    filteredDeclarations.forEach(d => {
      let monthIndex = -1;
      // Parsing simple de la période ou de la date
      const p = d.period.toLowerCase();
      
      // Détection mois par nom
      if (p.includes('jan')) monthIndex = 0;
      else if (p.includes('fév')) monthIndex = 1;
      else if (p.includes('mar')) monthIndex = 2;
      else if (p.includes('avr')) monthIndex = 3;
      else if (p.includes('mai')) monthIndex = 4;
      else if (p.includes('juin')) monthIndex = 5;
      else if (p.includes('juil')) monthIndex = 6;
      else if (p.includes('août')) monthIndex = 7;
      else if (p.includes('sep')) monthIndex = 8;
      else if (p.includes('oct')) monthIndex = 9;
      else if (p.includes('nov')) monthIndex = 10;
      else if (p.includes('déc')) monthIndex = 11;
      // Détection trimestre
      else if (p.includes('t1') || p.includes('1er')) monthIndex = 2; // Mars
      else if (p.includes('t2') || p.includes('2ème')) monthIndex = 5; // Juin
      else if (p.includes('t3') || p.includes('3ème')) monthIndex = 8; // Sept
      else if (p.includes('t4') || p.includes('4ème')) monthIndex = 11; // Dec

      if (monthIndex >= 0) {
        if (d.status === 'PAYÉE' || d.status === 'ACCEPTÉE') {
            data[monthIndex].paid += d.amount;
        } else if (['VALIDÉ', 'EN RETARD', 'EN COURS', 'TRANSMIS', 'À Payer'].includes(d.status)) {
            data[monthIndex].due += d.amount;
        }
      }
    });

    return data;
  }, [filteredDeclarations]);

  // --- 4. RÉPARTITION DES MOYENS DE PAIEMENT (REAL DATA) ---
  const paymentMethodsData = useMemo(() => {
    const methods = {
        'VIREMENT': { value: 0, count: 0, color: '#3b82f6', label: 'Virement' },
        'CHEQUE': { value: 0, count: 0, color: '#f59e0b', label: 'Chèque' },
        'NUMERAIRE': { value: 0, count: 0, color: '#10b981', label: 'Espèces' }
    };

    let totalPaidSum = 0;

    filteredDeclarations.forEach(d => {
        if (d.status === 'PAYÉE') {
            // Si le détail existe on l'utilise, sinon on suppose un virement par défaut pour l'affichage (ou inconnu)
            const m = d.paymentDetails?.method || 'VIREMENT'; 
            if (methods[m]) {
                methods[m].value += d.amount;
                methods[m].count += 1;
                totalPaidSum += d.amount;
            }
        }
    });

    const result = Object.values(methods).filter(m => m.value > 0).map(m => ({
        name: m.label,
        value: Number(((m.value / totalPaidSum) * 100).toFixed(1)), // Pourcentage
        rawAmount: m.value,
        color: m.color
    }));

    return result.length > 0 ? result : [
        { name: 'Aucune donnée', value: 100, rawAmount: 0, color: '#e2e8f0' } // Placeholder gris
    ];

  }, [filteredDeclarations]);

  // --- 5. ÉCHÉANCIER ---
  const nextDeadlines = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    let nextG50Date = new Date(currentYear, currentMonth, 20);
    if (today.getDate() > 20) {
       nextG50Date = new Date(currentYear, currentMonth + 1, 20);
    }

    const deadlines = [
      { 
        date: `20 ${monthNames[nextG50Date.getMonth()].toUpperCase()}`, 
        title: 'G50 Mensuel', 
        sub: 'TVA / TAP / IRG', 
        color: 'bg-primary',
        urgent: (nextG50Date.getTime() - today.getTime()) / (1000 * 3600 * 24) < 5
      }
    ];

    if (currentMonth >= 4 && currentMonth <= 5) {
       deadlines.push({ date: '30 JUIN', title: 'G12 IFU', sub: 'Déclaration Prévisionnelle', color: 'bg-orange-500', urgent: currentMonth === 5 });
    } else if (currentMonth === 0) {
       deadlines.push({ date: '20 JANVIER', title: 'G12 Bis', sub: 'Déclaration Définitive', color: 'bg-purple-500', urgent: true });
    } else {
       deadlines.push({ date: '30 AVRIL', title: 'Liasse Fiscale', sub: 'Bilan Annuel', color: 'bg-emerald-500', urgent: false });
    }

    return deadlines;
  }, []);

  const recentActivity = useMemo(() => {
    const sorted = [...filteredDeclarations].sort((a, b) => {
       const dateA = a.submissionDate !== '-' ? new Date(a.submissionDate.split('/').reverse().join('-')).getTime() : 0;
       const dateB = b.submissionDate !== '-' ? new Date(b.submissionDate.split('/').reverse().join('-')).getTime() : 0;
       if (dateA !== dateB) return dateB - dateA;
       return 0;
    }).slice(0, 4);

    return sorted.map(d => ({
       id: d.id,
       title: d.type,
       user: d.taxpayerName?.split(' ')[0] || 'Système',
       status: d.status,
       amount: d.amount,
       time: d.submissionDate !== '-' ? d.submissionDate : 'Brouillon récent'
    }));
  }, [filteredDeclarations]);

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Console de Pilotage Fiscal</h1>
            <div className="flex items-center gap-3">
               <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <Activity className="w-3 h-3 text-green-500" /> Données en temps réel
               </span>
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Users className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select 
                  value={selectedTaxpayerId}
                  onChange={(e) => setSelectedTaxpayerId(e.target.value)}
                  className="pl-12 pr-10 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer min-w-[280px] shadow-sm hover:border-slate-300"
                >
                   <option value="ALL">Vue Globale ({taxpayers.length} dossiers)</option>
                   {taxpayers.map(t => (
                      <option key={t.id} value={t.id}>{t.dynamicData['1']} (NIF: {t.dynamicData['2']})</option>
                   ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                   <Filter className="h-4 w-4 text-slate-400" />
                </div>
             </div>

             <button onClick={() => onViewChange('wizard')} className="bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest h-full">
                <Zap className="w-5 h-5 fill-current" /> Nouvelle Déclaration
             </button>
          </div>
        </div>

        {/* CARTE D'IDENTITÉ FISCALE */}
        {currentTaxpayer ? (
           <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-2xl font-black">
                       {currentTaxpayer.dynamicData['1'].substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black uppercase tracking-tight">{currentTaxpayer.dynamicData['1']}</h2>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${currentTaxpayer.regimeSelectionne.includes('IFU') ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-orange-500/20 border-orange-400 text-orange-300'}`}>
                             {currentTaxpayer.regimeSelectionne}
                          </span>
                       </div>
                       <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> NIF: <span className="text-white font-mono">{currentTaxpayer.dynamicData['2']}</span></span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span className="max-w-[300px] truncate">Activité: <span className="text-white">{currentTaxpayer.dynamicData['7']}</span></span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span>Wilaya: <span className="text-white">{currentTaxpayer.wilaya}</span></span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-8 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Déclarations</p>
                       <p className="text-xl font-black">{filteredDeclarations.length}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Reste à Payer</p>
                       <p className={`text-xl font-black ${kpiData.pendingAmount > 0 ? 'text-orange-400' : 'text-white'}`}>{kpiData.pendingAmount.toLocaleString()} <span className="text-xs text-slate-500">DA</span></p>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payé (Global)</p>
                 <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpiData.totalPaid.toLocaleString()} <span className="text-sm text-slate-400">DA</span></p>
                    <div className="p-2 bg-green-50 rounded-xl text-green-600"><TrendingUp className="w-5 h-5" /></div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dette Fiscale Totale</p>
                 <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-orange-500 tracking-tighter">{kpiData.pendingAmount.toLocaleString()} <span className="text-sm text-slate-400">DA</span></p>
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-500"><AlertTriangle className="w-5 h-5" /></div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Conformité</p>
                 <div className="flex items-end justify-between">
                    <p className={`text-3xl font-black tracking-tighter ${kpiData.healthScore >= 80 ? 'text-green-600' : 'text-red-500'}`}>{kpiData.healthScore}/100</p>
                    <div className={`p-2 rounded-xl ${kpiData.healthScore >= 80 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}><ShieldCheck className="w-5 h-5" /></div>
                 </div>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* GRAPHIQUE GAUCHE : FLUX DE DÉCAISSEMENT RÉEL */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[120px] transition-transform group-hover:scale-110 duration-700"></div>
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Flux de Décaissement Fiscal</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Paiements effectués vs Dettes engagées
                 </p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg text-[9px] font-bold text-blue-600 border border-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Réalisé (Payé)
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg text-[9px] font-bold text-amber-600 border border-amber-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Engagé (Dû)
                 </div>
              </div>
           </div>
           
           <div className="h-[350px] w-full relative z-10">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={cashFlowData}>
                 <defs>
                   <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#94a3b8'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black', fill: '#94a3b8'}} />
                 <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '16px'}}
                   itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                   formatter={(value: number) => value.toLocaleString() + ' DA'}
                 />
                 <Area type="monotone" dataKey="paid" name="Réalisé" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPaid)" />
                 <Area type="monotone" dataKey="due" name="Engagé" stroke="#f59e0b" strokeWidth={3} fill="none" strokeDasharray="5 5" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* GRAPHIQUE DROITE : MOYENS DE PAIEMENT RÉELS */}
        <div className="lg:col-span-4 bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 flex flex-col">
           <h3 className="text-lg font-black text-slate-900 w-full text-left mb-6">Moyens de Paiement</h3>
           
           <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="h-64 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                          data={paymentMethodsData} 
                          innerRadius={60} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          dataKey="value"
                       >
                          {paymentMethodsData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'}}
                          formatter={(value: number) => `${value}%`}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Centre du Pie */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Majorité</p>
                    <p className="text-2xl font-black text-slate-900">
                       {paymentMethodsData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name.substring(0,3).toUpperCase()}
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-3 mt-6">
              {paymentMethodsData.map((m, i) => (
                 <div key={i} className="flex justify-between items-center text-xs p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: m.color}}></div>
                       <span className="font-bold text-slate-700">{m.name}</span>
                    </div>
                    <span className="font-black text-slate-900">{m.value}%</span>
                 </div>
              ))}
           </div>
        </div>

        {/* Colonne Droite: Échéancier et Activité */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Échéancier Fiscal Dynamique */}
          <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
             <div className="flex items-center justify-between relative z-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Prochaines Échéances</h2>
                <Clock className="w-5 h-5 text-primary" />
             </div>
             <div className="space-y-6 relative z-10">
                {nextDeadlines.map((ev, i) => (
                  <div key={i} className="flex gap-4 group cursor-pointer hover:translate-x-2 transition-transform">
                     <div className={`w-1 h-12 rounded-full ${ev.urgent ? 'bg-red-500 animate-pulse' : ev.color}`}></div>
                     <div className="space-y-1">
                        <p className={`text-[10px] font-black ${ev.urgent ? 'text-red-400' : 'text-slate-500'}`}>{ev.date}</p>
                        <p className="text-sm font-black uppercase tracking-tight">{ev.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{ev.sub}</p>
                     </div>
                     <ArrowUpRight className="w-4 h-4 ml-auto text-slate-700 group-hover:text-primary transition-colors" />
                  </div>
                ))}
             </div>
             <button onClick={() => onViewChange('calendar')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Calendrier Complet</button>
          </div>

          {/* Audit Log Réel */}
          <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-6">
             <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Activité Récente</h2>
             <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((log, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.status === 'PAYÉE' ? 'bg-green-50 text-green-600' : log.status === 'EN RETARD' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {log.status === 'PAYÉE' ? <CheckCircle2 className="w-6 h-6" /> : log.status === 'EN RETARD' ? <AlertTriangle className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-black text-slate-800 truncate">{log.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{log.user} • {log.status}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{log.amount.toLocaleString()} DA</p>
                        <span className="text-[9px] text-slate-400 font-bold">{log.time}</span>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-slate-400 text-xs italic">Aucune activité récente</div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Liens Rapides Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Annuaire Taux NAA', icon: Activity, color: 'bg-indigo-50 text-indigo-600', view: 'naa_rates' },
          { label: 'Module Contribuable', icon: ShieldCheck, color: 'bg-blue-50 text-primary', view: 'taxpayer_management' },
          { label: 'Rapports & Analytique', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', view: 'reports' },
          { label: 'Support & Aide', icon: Clock, color: 'bg-orange-50 text-orange-600', view: 'help' },
        ].map((link, i) => (
          <button 
            key={i} 
            onClick={() => onViewChange(link.view as AppView)}
            className="flex flex-col items-center gap-6 p-10 bg-white rounded-[48px] border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:-translate-y-2 transition-all group"
          >
            <div className={`p-6 rounded-[24px] ${link.color} group-hover:scale-110 transition-transform shadow-inner`}>
              <link.icon className="w-10 h-10" />
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest text-center">{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
