
import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Download, Calendar, Filter, FileText, ChevronRight, AlertTriangle, TrendingUp, CheckCircle2, Coins } from 'lucide-react';
import { Declaration } from '../types';

interface Props {
  declarations?: Declaration[];
}

const FiscalReports: React.FC<Props> = ({ declarations = [] }) => {
  
  // --- CALCULS DYNAMIQUES ---

  // 1. KPIs Globaux
  const kpiData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearDecls = declarations.filter(d => d.period.includes(currentYear.toString()));
    
    // Total Passif Fiscal (Somme de tous les montants dus/payés)
    const totalFiscalLiability = currentYearDecls.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Taux de Conformité (Payées / Total Soumis)
    const paidCount = currentYearDecls.filter(d => d.status === 'PAYÉE').length;
    const submittedCount = currentYearDecls.filter(d => d.status !== 'BROUILLON').length;
    const complianceRate = submittedCount > 0 ? Math.round((paidCount / submittedCount) * 100) : 0;

    // Prochaine Échéance (Première "À Payer" ou "En Retard")
    const nextDue = declarations
      .filter(d => ['À Payer', 'EN RETARD', 'VALIDÉ'].includes(d.status) || (d.status === 'VALIDÉ' && !d.paymentDate))
      .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime())[0];

    return { totalFiscalLiability, complianceRate, nextDue };
  }, [declarations]);

  // 2. Données Historiques (Bar Chart - Déclaré vs Payé par Mois)
  const barData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = months.map(m => ({ name: m, déclaré: 0, payé: 0 }));

    declarations.forEach(d => {
      // Détection mois (simplifiée)
      let monthIndex = -1;
      const p = d.period.toLowerCase();
      if (p.includes('jan')) monthIndex = 0;
      else if (p.includes('fév')) monthIndex = 1;
      else if (p.includes('mar') || p.includes('t1')) monthIndex = 2;
      else if (p.includes('avr')) monthIndex = 3;
      else if (p.includes('mai')) monthIndex = 4;
      else if (p.includes('juin') || p.includes('t2')) monthIndex = 5;
      else if (p.includes('juil')) monthIndex = 6;
      else if (p.includes('août')) monthIndex = 7;
      else if (p.includes('sep') || p.includes('t3')) monthIndex = 8;
      else if (p.includes('oct')) monthIndex = 9;
      else if (p.includes('nov')) monthIndex = 10;
      else if (p.includes('déc') || p.includes('t4')) monthIndex = 11;

      if (monthIndex >= 0) {
        data[monthIndex].déclaré += d.amount;
        if (d.status === 'PAYÉE' || d.status === 'ACCEPTÉE') {
          data[monthIndex].payé += d.amount;
        }
      }
    });
    return data;
  }, [declarations]);

  // 3. Répartition par Régime (Pie Chart)
  const pieData = useMemo(() => {
    const regimes: Record<string, number> = { 'IFU': 0, 'RÉEL SIMPLIFIÉ': 0, 'RÉEL NORMAL': 0 };
    
    declarations.forEach(d => {
      const r = d.regime.toUpperCase();
      if (r.includes('IFU')) regimes['IFU'] += d.amount;
      else if (r.includes('SIMPLIFIÉ')) regimes['RÉEL SIMPLIFIÉ'] += d.amount;
      else if (r.includes('NORMAL')) regimes['RÉEL NORMAL'] += d.amount;
      else {
         // Fallback si regime inconnu
         regimes['RÉEL NORMAL'] = (regimes['RÉEL NORMAL'] || 0) + d.amount;
      }
    });

    const result = Object.entries(regimes).map(([name, value]) => ({ 
      name, 
      value, 
      color: name === 'IFU' ? '#10b981' : name === 'RÉEL SIMPLIFIÉ' ? '#f59e0b' : '#1173d4' 
    })).filter(d => d.value > 0);

    // Si vide, placeholder
    if (result.length === 0) return [{ name: 'Aucune donnée', value: 100, color: '#e2e8f0' }];
    return result;
  }, [declarations]);

  // 4. Tendances de Paiement (Area Chart - Cumul des paiements)
  const areaData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // On calcule simplement le volume payé par mois pour voir la tendance de trésorerie sortante
    const data = months.map(m => ({ name: m, val: 0 }));
    
    declarations.filter(d => d.status === 'PAYÉE').forEach(d => {
        // Même logique de détection de mois
        let monthIndex = -1;
        const p = d.period.toLowerCase();
        if (p.includes('jan')) monthIndex = 0;
        else if (p.includes('fév')) monthIndex = 1;
        else if (p.includes('mar') || p.includes('t1')) monthIndex = 2;
        else if (p.includes('avr')) monthIndex = 3;
        else if (p.includes('mai')) monthIndex = 4;
        else if (p.includes('juin') || p.includes('t2')) monthIndex = 5;
        else if (p.includes('juil')) monthIndex = 6;
        else if (p.includes('août')) monthIndex = 7;
        else if (p.includes('sep') || p.includes('t3')) monthIndex = 8;
        else if (p.includes('oct')) monthIndex = 9;
        else if (p.includes('nov')) monthIndex = 10;
        else if (p.includes('déc') || p.includes('t4')) monthIndex = 11;

        if (monthIndex >= 0) {
            data[monthIndex].val += d.amount;
        }
    });
    return data;
  }, [declarations]);

  return (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col">
      {/* Top Header */}
      <header className="bg-[#1e293b] text-white px-10 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 group cursor-pointer">
              <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-primary transition-colors">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-black tracking-tighter uppercase">Portail Fiscal Algérie</span>
           </div>
           <nav className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-slate-400">
              <button className="hover:text-white transition-colors">Tableau de Bord</button>
              <button className="hover:text-white transition-colors">Déclarations</button>
              <button className="hover:text-white transition-colors">Paiements</button>
              <button className="text-white border-b-2 border-primary pb-1">Rapports</button>
              <button className="hover:text-white transition-colors">Paramètres</button>
           </nav>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
              <div className="w-7 h-7 rounded-full bg-slate-500 overflow-hidden border border-white/20">
                 <img src="https://picsum.photos/id/64/30/30" alt="avatar" />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-slate-400 leading-none">Utilisateur Connecté</p>
              </div>
           </div>
           <div className="flex gap-2 text-[10px] font-black uppercase tracking-tighter">
              <span className="text-white cursor-pointer">FR</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-500 cursor-pointer hover:text-white">AR</span>
           </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="p-10 space-y-10 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">Rapports et Analyses Fiscales</h1>
              <div className="relative inline-block group">
                 <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                    Période: <span className="text-slate-900">Exercice {new Date().getFullYear()}</span> <Calendar className="w-3.5 h-3.5" />
                 </button>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2">
                 <Download className="w-3.5 h-3.5" /> Exporter les Données
              </button>
              <button className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                 Générer un Rapport Personnalisé
              </button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Passif Fiscal ({new Date().getFullYear()})</p>
              <div className="flex items-end gap-3">
                 <span className="text-3xl font-black text-slate-900 tracking-tighter">{kpiData.totalFiscalLiability.toLocaleString()} DZD</span>
              </div>
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm group hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taux de Conformité des Paiements</p>
              <div className="flex items-center gap-3">
                 <span className={`text-4xl font-black tracking-tighter ${kpiData.complianceRate >= 90 ? 'text-green-600' : kpiData.complianceRate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                    {kpiData.complianceRate}%
                 </span>
                 <TrendingUp className={`w-6 h-6 ${kpiData.complianceRate >= 90 ? 'text-green-500' : kpiData.complianceRate >= 50 ? 'text-orange-500' : 'text-red-500'}`} />
              </div>
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm border-l-4 border-l-orange-400">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                Prochaine Échéance <AlertTriangle className="w-3 h-3 text-orange-500" />
              </p>
              <div className="space-y-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                   {kpiData.nextDue ? kpiData.nextDue.submissionDate : 'Aucune'}
                </span>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-tighter">
                   {kpiData.nextDue ? `(${kpiData.nextDue.type})` : '(À jour)'}
                </p>
              </div>
           </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Historic Chart */}
           <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Passif Fiscal Historique vs. Paiements</h3>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-primary rounded-sm"></div>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">Déclaré</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">Payé</span>
                    </div>
                 </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={barData}>
                    <defs>
                      <linearGradient id="colorDec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1173d4" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1173d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} formatter={(value) => value.toLocaleString() + ' DA'} />
                    <Bar dataKey="déclaré" name="Déclaré" fill="#1173d4" radius={[4, 4, 0, 0]} barSize={30} />
                    <Line type="monotone" dataKey="payé" name="Payé" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-[10px] font-bold text-slate-300 tracking-[0.4em] uppercase">{new Date().getFullYear()}</div>
           </div>

           {/* Pie Chart */}
           <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 flex flex-col items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest w-full text-left">Répartition par Régime Fiscal</h3>
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString() + ' DA'} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Total:</p>
                   <p className="text-xl font-black text-slate-900 leading-none">100%</p>
                </div>
              </div>
              <div className="grid grid-cols-1 w-full gap-4 pt-4">
                 {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                          <span className="text-[11px] font-bold text-slate-700">{d.name} ({Math.round((d.value / kpiData.totalFiscalLiability) * 100) || 0}%)</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-900">{d.value.toLocaleString()} DA</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Area Chart: Trend */}
           <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tendances de Paiement (Cash Flow Sortant)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={areaData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                     <Tooltip formatter={(value) => value.toLocaleString() + ' DA'} />
                     <Area type="monotone" dataKey="val" name="Paiements" stroke="#1173d4" fill="#1173d4" fillOpacity={0.1} strokeWidth={3} />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                 <Coins className="w-5 h-5 text-blue-500 shrink-0" />
                 <p className="text-xs font-bold text-blue-800">
                    <span className="uppercase">Analyse :</span> Les paiements sont concentrés sur les fins de trimestres (G50). Pensez à lisser votre trésorerie.
                 </p>
              </div>
           </div>

           {/* List: Recent Declarations (Top 5) */}
           <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Dernières Déclarations & Statut</h3>
              <div className="overflow-hidden border border-slate-100 rounded-2xl">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <tr>
                          <th className="px-6 py-4">Période</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Montant</th>
                          <th className="px-6 py-4 text-center">Statut</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[11px] font-bold">
                       {declarations.length > 0 ? declarations.slice(0, 5).map((d) => (
                         <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-slate-800">{d.period}</td>
                            <td className="px-6 py-4 text-slate-500">{d.type}</td>
                            <td className="px-6 py-4 text-slate-800">{d.amount.toLocaleString()} DA</td>
                            <td className="px-6 py-4 text-center">
                               <span className={`px-2 py-1 rounded text-[9px] uppercase ${d.status === 'PAYÉE' ? 'bg-green-100 text-green-700' : d.status === 'EN RETARD' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {d.status}
                               </span>
                            </td>
                         </tr>
                       )) : (
                          <tr>
                             <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic font-medium">Aucune déclaration enregistrée.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default FiscalReports;
