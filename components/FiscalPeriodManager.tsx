
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Lock, 
  Unlock, 
  Plus, 
  Archive, 
  CheckCircle2, 
  History, 
  CalendarDays, 
  RefreshCw, 
  LayoutGrid, 
  List, 
  ShieldAlert, 
  PlayCircle, 
  StopCircle, 
  Layers, 
  CheckCheck, 
  Ban,
  ArrowLeft,
  ArrowRight,
  AlertTriangle, 
  FolderOpen,
  Clock,
  Coins,
  FileX
} from 'lucide-react';
import { FiscalYear, FiscalPeriod, PeriodStatus } from '../types';

interface Props {
  years: FiscalYear[];
  setYears: React.Dispatch<React.SetStateAction<FiscalYear[]>>;
  periods: FiscalPeriod[];
  setPeriods: React.Dispatch<React.SetStateAction<FiscalPeriod[]>>;
  onDeclareNeant?: (period: FiscalPeriod) => void; 
}

const FiscalPeriodManager: React.FC<Props> = ({ years, setYears, periods, setPeriods, onDeclareNeant }) => {
  const [currentView, setCurrentView] = useState<'YEARS_DASHBOARD' | 'PERIOD_DETAILS'>('YEARS_DASHBOARD');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [archiveTab, setArchiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');

  const currentDate = new Date();
  const currentFiscalYear = currentDate.getFullYear();
  const prescriptionLimitYear = currentFiscalYear - 3; 

  // Séparation dynamique des années actives et archivées
  const { activeYearsList, archivedYearsList } = useMemo(() => {
    const active: FiscalYear[] = [];
    const archived: FiscalYear[] = [];

    years.forEach(y => {
      // Priorité absolue au statut : Si ARCHIVED, ça va dans les archives, quelle que soit l'année
      if (y.status === 'ARCHIVED') {
         archived.push(y);
      }
      // Sinon, on affiche dans les actifs si c'est récent ou explicitement ouvert (comme 2026)
      else if (y.year >= prescriptionLimitYear || y.status === 'OPEN') {
        active.push(y);
      } else {
        // Les très vieilles années fermées vont aussi en archives par défaut
        archived.push(y);
      }
    });

    return { 
      activeYearsList: active.sort((a, b) => b.year - a.year), 
      archivedYearsList: archived.sort((a, b) => b.year - a.year) 
    };
  }, [years, prescriptionLimitYear]);

  const activePeriods = useMemo(() => {
    return periods.filter(p => p.year === selectedYear).sort((a, b) => {
        const typeOrder = { 'MONTH': 1, 'TRIMESTER': 2, 'ANNUAL': 3 };
        if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
        return a.index - b.index;
    });
  }, [periods, selectedYear]);

  const activeYearData = years.find(y => y.year === selectedYear);
  const isYearOpen = activeYearData?.status === 'OPEN';

  // --- MOTEUR INTELLIGENT DE DATES ---
  const getSmartDeadline = (deadlineStr: string) => {
      const parts = deadlineStr.split(' ');
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      
      const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const monthIndex = monthsFr.indexOf(monthStr);
      
      if (monthIndex === -1) return { dateObj: new Date(), isShifted: false, label: deadlineStr };

      let dateObj = new Date(year, monthIndex, day);
      let isShifted = false;
      let shiftReason = '';

      if (dateObj.getDay() === 5) {
          dateObj.setDate(dateObj.getDate() + 2); 
          isShifted = true;
          shiftReason = 'Weekend (Ven)';
      } else if (dateObj.getDay() === 6) {
          dateObj.setDate(dateObj.getDate() + 1); 
          isShifted = true;
          shiftReason = 'Weekend (Sam)';
      }

      return {
          dateObj,
          isShifted,
          shiftReason,
          label: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      };
  };

  const getDeadlineStatus = (deadlineStr: string, status: PeriodStatus) => {
      if (status === 'CLOSED') return { color: 'text-slate-400', bg: 'bg-slate-100', label: 'Clôturé', icon: CheckCircle2 };
      if (status === 'LOCKED') return { color: 'text-slate-400', bg: 'bg-slate-50', label: 'Verrouillé', icon: Lock };

      const { dateObj } = getSmartDeadline(deadlineStr);
      const now = new Date();
      now.setHours(0,0,0,0);
      
      const diffTime = dateObj.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { color: 'text-red-600', bg: 'bg-red-50', label: `Retard (${Math.abs(diffDays)}j)`, icon: AlertTriangle, urgent: true };
      if (diffDays === 0) return { color: 'text-orange-600', bg: 'bg-orange-50', label: "Aujourd'hui !", icon: Clock, urgent: true };
      if (diffDays <= 3) return { color: 'text-orange-500', bg: 'bg-orange-50', label: `J-${diffDays}`, icon: Clock, urgent: false };
      
      return { color: 'text-green-600', bg: 'bg-green-50', label: `J-${diffDays}`, icon: CalendarDays, urgent: false };
  };

  const generatePeriodsForYear = (year: number, defaultStatus: PeriodStatus = 'LOCKED') => {
    const newPeriods: FiscalPeriod[] = [];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    months.forEach((m, i) => {
      newPeriods.push({
        id: `m_${i+1}_${year}`, label: m, type: 'MONTH', year: year, index: i+1,
        deadline: `20 ${months[Math.min(11, i+1)]} ${year}`, status: defaultStatus, declarationsLinked: 0
      });
    });
    
    [1, 2, 3, 4].forEach(t => {
      const deadlineMonth = t === 4 ? 'Janvier' : months[t*3];
      const deadlineYear = t === 4 ? year + 1 : year;
      newPeriods.push({
        id: `t_${t}_${year}`, label: `${t}${t === 1 ? 'er' : 'ème'} Trimestre`, type: 'TRIMESTER', year: year, index: t,
        deadline: `20 ${deadlineMonth} ${deadlineYear}`, status: defaultStatus, declarationsLinked: 0
      });
    });

    newPeriods.push({
        id: `y_${year}`, label: `Exercice ${year}`, type: 'ANNUAL', year: year, index: 1,
        deadline: `30 Avril ${year + 1}`, status: defaultStatus === 'CLOSED' ? 'CLOSED' : 'OPEN', declarationsLinked: 0
    });

    return newPeriods;
  };

  // --- ACTIONS ---

  const handleSelectYear = (year: number) => {
    const hasPeriods = periods.some(p => p.year === year);
    if (!hasPeriods) {
        let status: PeriodStatus = 'LOCKED';
        if (year < currentFiscalYear) status = 'CLOSED';
        if (year === currentFiscalYear) status = 'OPEN';
        
        const generated = generatePeriodsForYear(year, status);
        setPeriods(prev => [...prev, ...generated]);
    }
    setSelectedYear(year);
    setCurrentView('PERIOD_DETAILS');
  };

  const handleCreateNextYear = () => {
    const maxYear = Math.max(...years.map(y => y.year), currentFiscalYear);
    const newYear = maxYear + 1;
    
    const newFiscalYear: FiscalYear = { 
        year: newYear, 
        status: 'OPEN', 
        progress: 0, 
        declarationsCount: 0, 
        isDefault: true 
    };

    setYears(prev => [newFiscalYear, ...prev]);
    
    const newPeriods = generatePeriodsForYear(newYear, 'OPEN'); 
    
    setPeriods(prev => [...prev, ...newPeriods]);
    setSelectedYear(newYear);
    setCurrentView('PERIOD_DETAILS');
    
    alert(`Exercice ${newYear} créé avec succès et entièrement déverrouillé.`);
  };

  // Correction : Ajout de e.preventDefault() et e.stopPropagation() pour isoler le clic
  const handleArchiveYear = (e: React.MouseEvent, year: number) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    // Confirmation explicite
    if (window.confirm(`Voulez-vous vraiment archiver l'exercice ${year} ?\n\nIl sera déplacé vers l'onglet 'Archives & Historique'.`)) {
      // Mise à jour de l'état : l'année passe en 'ARCHIVED'
      setYears(prev => prev.map(y => y.year === year ? { ...y, status: 'ARCHIVED' } : y));
      // Optionnel : on ferme toutes les périodes pour sécuriser
      setPeriods(prev => prev.map(p => p.year === year ? { ...p, status: 'CLOSED' } : p));
    }
  };

  const handleRestoreYear = (year: number) => {
    setYears(prev => prev.map(y => y.year === year ? { ...y, status: 'CLOSED' } : y));
    setArchiveTab('ACTIVE');
  };

  const toggleYearStatus = () => {
    if (!selectedYear) return;
    setYears(prev => prev.map(y => {
      if (y.year === selectedYear) {
        return { ...y, status: y.status === 'OPEN' ? 'CLOSED' : 'OPEN' };
      }
      return y;
    }));
  };

  const changePeriodStatus = (periodId: string, newStatus: PeriodStatus) => {
    if (!isYearOpen) return;
    setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, status: newStatus } : p));
  };

  const declareNeant = (periodId: string) => {
      const period = periods.find(p => p.id === periodId);
      if (!period) return;

      const { urgent } = getDeadlineStatus(period.deadline, period.status);
      const confirmationMsg = urgent 
        ? `Attention ! Cette période est EN RETARD.\n\nConfirmer la déclaration 'Néant' générera automatiquement une pénalité forfaitaire.\nVoulez-vous continuer ?`
        : `Confirmer la déclaration 'Néant' pour ${period.label} ${period.year} ? \n\nCela va générer une déclaration à 0 DA, clôre la période et mettre à jour votre calendrier fiscal.`;

      if(confirm(confirmationMsg)) {
          if (onDeclareNeant) {
              onDeclareNeant(period); 
          } else {
              changePeriodStatus(periodId, 'CLOSED');
          }
      }
  };

  const batchAction = (action: 'OPEN_ALL' | 'CLOSE_ALL') => {
    if (!isYearOpen || !selectedYear) return;
    setPeriods(prev => prev.map(p => {
      if (p.year === selectedYear) {
        return { ...p, status: action === 'OPEN_ALL' ? 'OPEN' : 'CLOSED' };
      }
      return p;
    }));
  };

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto w-full px-8 -mt-8 relative z-20 space-y-10">
        
        <div className="flex justify-center">
            <div className="bg-white p-1.5 rounded-[20px] shadow-lg border border-slate-200 inline-flex">
                <button 
                  onClick={() => setArchiveTab('ACTIVE')}
                  className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${archiveTab === 'ACTIVE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                   <Calendar className="w-4 h-4" /> Exercices Actifs (Prescription)
                </button>
                <button 
                  onClick={() => setArchiveTab('ARCHIVE')}
                  className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${archiveTab === 'ARCHIVE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                   <Archive className="w-4 h-4" /> Archives & Historique
                </button>
            </div>
        </div>

        {archiveTab === 'ACTIVE' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* CARTE NOUVEL EXERCICE */}
                    <button 
                       onClick={handleCreateNextYear}
                       className="group flex flex-col items-center justify-center p-8 bg-slate-900 rounded-[32px] border-2 border-slate-800 text-white hover:bg-primary hover:border-primary hover:scale-[1.02] transition-all shadow-xl"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">Ouvrir Nouvel Exercice</span>
                        <span className="text-xs opacity-60 mt-1 font-mono">{Math.max(...years.map(y=>y.year), currentFiscalYear) + 1}</span>
                    </button>

                    {/* CARTES ANNEES ACTIVES */}
                    {activeYearsList.map(year => {
                        const isPrescriptionLimit = year.year === prescriptionLimitYear;
                        return (
                          <div key={year.year} className="relative group bg-white rounded-[32px] border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl transition-all hover:border-primary/30">
                              {isPrescriptionLimit && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-200 shadow-sm whitespace-nowrap flex items-center gap-1">
                                     <AlertTriangle className="w-3 h-3" /> Limite Prescription
                                  </div>
                              )}
                              
                              <div className="flex justify-between items-start mb-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${year.status === 'OPEN' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                     {year.year.toString().slice(2)}
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${year.status === 'OPEN' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                     {year.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
                                  </div>
                              </div>
                              
                              <div className="space-y-4">
                                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{year.year}</h3>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div className={`h-full ${year.status === 'OPEN' ? 'bg-green-500' : 'bg-slate-400'}`} style={{width: `${year.progress}%`}}></div>
                                  </div>
                                  <div className="flex gap-2 relative z-10">
                                      <button onClick={() => handleSelectYear(year.year)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-primary transition-all">Gérer</button>
                                      
                                      {/* BOUTON ARCHIVER AVEC TYPE BUTTON, PREVENT DEFAULT ET STOP PROPAGATION */}
                                      <button 
                                          type="button"
                                          onClick={(e) => handleArchiveYear(e, year.year)} 
                                          className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer z-50 relative" 
                                          title="Archiver cet exercice"
                                      >
                                          <Archive className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                        );
                    })}
                </div>
            </div>
        )}

        {archiveTab === 'ARCHIVE' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                {archivedYearsList.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-16 text-center text-slate-400">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest">Aucune archive disponible</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {archivedYearsList.map(year => (
                           <div key={year.year} className="bg-slate-50 rounded-[32px] border border-slate-200 p-6 opacity-75 hover:opacity-100 transition-all">
                              <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-2xl font-black text-slate-500">{year.year}</h3>
                                 <Lock className="w-5 h-5 text-slate-400" />
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 mb-6">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase text-center">
                                    {year.status === 'ARCHIVED' ? 'Exercice Archivé' : 'Exercice Prescrit'}
                                 </p>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => handleSelectYear(year.year)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100">Consulter</button>
                                 <button onClick={() => handleRestoreYear(year.year)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-green-600 hover:border-green-200" title="Restaurer">
                                    <RefreshCw className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );

  // ... (Reste du composant renderPeriodDetails et render inchangé)
  const renderPeriodDetails = () => (
    <div className="max-w-7xl mx-auto w-full px-8 -mt-8 relative z-20 space-y-8 animate-in zoom-in-95 duration-300">
         <button onClick={() => setCurrentView('YEARS_DASHBOARD')} className="flex items-center gap-2 text-white/80 hover:text-white font-bold text-xs uppercase tracking-widest mb-4 bg-slate-900/30 w-fit px-4 py-2 rounded-full backdrop-blur-sm hover:bg-slate-900/50 transition-all">
            <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
         </button>

         <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exercice</p>
                  <div className="flex items-center gap-3">
                     <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedYear}</h2>
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${activeYearData?.status === 'OPEN' ? 'bg-green-50 text-green-600 border-green-100' : activeYearData?.status === 'ARCHIVED' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {activeYearData?.status === 'ARCHIVED' ? 'ARCHIVÉ (AUDIT)' : activeYearData?.status}
                     </span>
                  </div>
               </div>
               <div className="h-12 w-px bg-slate-100"></div>
               
               {isYearOpen ? (
                 <div className="flex gap-2">
                    <button onClick={() => batchAction('OPEN_ALL')} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase hover:bg-green-100 transition-colors flex items-center gap-2">
                       <Layers className="w-3 h-3" /> Tout Ouvrir
                    </button>
                    <button onClick={() => batchAction('CLOSE_ALL')} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-colors flex items-center gap-2">
                       <CheckCheck className="w-3 h-3" /> Tout Clôturer
                    </button>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 opacity-50 cursor-not-allowed">
                    <Ban className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Actions verrouillées</span>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-3">
               <button 
                  onClick={toggleYearStatus}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                     isYearOpen 
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-lg shadow-green-500/20'
                  }`}
               >
                  {isYearOpen ? (
                    <><Lock className="w-4 h-4" /> Clôturer l'exercice</>
                  ) : (
                    <><Unlock className="w-4 h-4" /> {activeYearData?.status === 'ARCHIVED' ? 'Ouvrir pour Audit' : "Réouvrir l'exercice"}</>
                  )}
               </button>
            </div>
         </div>

         {isYearOpen ? (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              <div className="lg:col-span-8 space-y-8">
                 {['MONTH', 'TRIMESTER', 'ANNUAL'].map(type => {
                    const typePeriods = activePeriods.filter(p => p.type === type);
                    if (typePeriods.length === 0) return null;

                    return (
                        <div key={type} className="space-y-6 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                                {type === 'MONTH' ? 'Déclarations Mensuelles' : type === 'TRIMESTER' ? 'Déclarations Trimestrielles' : 'Déclarations Annuelles'}
                            </p>
                            <div className={`grid gap-4 ${viewMode === 'GRID' && type !== 'ANNUAL' ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                                {typePeriods.map((period) => {
                                    const smartDeadline = getSmartDeadline(period.deadline);
                                    const statusInfo = getDeadlineStatus(period.deadline, period.status);
                                    
                                    return (
                                        <div key={period.id} className={`group relative bg-white border rounded-2xl p-5 transition-all shadow-sm ${period.status === 'OPEN' ? 'border-green-200 ring-2 ring-green-500/10' : 'border-slate-200 hover:border-blue-200'}`}>
                                            {/* Header Carte */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${period.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {period.type === 'MONTH' ? period.index : period.type === 'TRIMESTER' ? `T${period.index}` : 'AN'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{period.label}</h4>
                                                        {smartDeadline.isShifted && <span className="text-[8px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">Reporté ({smartDeadline.shiftReason})</span>}
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${statusInfo.bg} ${statusInfo.color}`}>
                                                    <statusInfo.icon className="w-3 h-3" /> {statusInfo.label}
                                                </div>
                                            </div>

                                            {/* Body Carte - Smart Alerts */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 font-medium">Échéance</span>
                                                    <span className={`font-bold ${statusInfo.urgent ? 'text-red-600' : 'text-slate-700'}`}>{smartDeadline.label}</span>
                                                </div>
                                                
                                                {/* Estimation Pénalité si retard */}
                                                {statusInfo.urgent && period.status === 'OPEN' && (
                                                    <div className="bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                                                        <Coins className="w-4 h-4 text-red-500" />
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-bold text-red-700 uppercase">Risque Pénalité</p>
                                                            <p className="text-[10px] font-medium text-red-600">Min. 10% de majoration</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Barre de progression temporelle */}
                                                {period.status === 'OPEN' && (
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${statusInfo.urgent ? 'bg-red-500' : 'bg-green-500'}`} style={{width: '75%'}}></div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Rapides */}
                                            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                                                {period.status === 'OPEN' ? (
                                                    <>
                                                        <button onClick={() => declareNeant(period.id)} className="py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 flex items-center justify-center gap-1 border border-slate-200">
                                                            <FileX className="w-3 h-3" /> Néant
                                                        </button>
                                                        <button onClick={() => changePeriodStatus(period.id, 'CLOSED')} className="py-2 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase hover:bg-green-100 flex items-center justify-center gap-1 border border-green-200">
                                                            <StopCircle className="w-3 h-3" /> Clôturer
                                                        </button>
                                                    </>
                                                ) : period.status === 'LOCKED' ? (
                                                    <button onClick={() => changePeriodStatus(period.id, 'OPEN')} className="col-span-2 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg text-[10px] font-black uppercase hover:text-green-600 hover:border-green-200 flex items-center justify-center gap-2">
                                                        <Unlock className="w-3 h-3" /> Déverrouiller
                                                    </button>
                                                ) : (
                                                    <button onClick={() => changePeriodStatus(period.id, 'OPEN')} className="col-span-2 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[10px] font-black uppercase hover:bg-orange-100 flex items-center justify-center gap-2">
                                                        <RefreshCw className="w-3 h-3" /> Réouvrir (Rectificative)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                 })}
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Légende Intelligente</h4>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-green-500 border border-green-600"></div><span className="text-xs font-bold text-slate-600">Période Active (Déclarable)</span></div>
                       <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></div><span className="text-xs font-bold text-slate-600">En Retard (Pénalités)</span></div>
                       <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400"></div><span className="text-xs font-bold text-slate-600">Clôturée / Payée</span></div>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
           <div className="w-full bg-white rounded-[40px] border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center mb-4"><Lock className="w-10 h-10 text-slate-400" /></div>
              <div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Exercice {selectedYear} Verrouillé</h2><p className="text-slate-500 text-lg font-medium mt-2 max-w-lg mx-auto">L'accès aux périodes est désactivé. Veuillez déverrouiller l'exercice pour effectuer des modifications.</p></div>
              <button onClick={toggleYearStatus} className="px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3 mt-4"><Unlock className="w-4 h-4" /> Déverrouiller l'exercice</button>
           </div>
         )}
    </div>
  );

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-32">
      <div className="bg-[#1e293b] text-white pt-12 pb-24 px-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
           <CalendarDays className="w-full h-full" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          <div className="flex justify-between items-start">
             <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30">
                   <History className="w-3 h-3" /> Machine Temporelle Fiscale
                </div>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none uppercase">
                   Gestion des <span className="text-primary-400">Périodes</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-xl">
                   Pilotez vos exercices fiscaux, gérez la prescription et archivez vos données avec intelligence.
                </p>
             </div>
          </div>
        </div>
      </div>

      {currentView === 'YEARS_DASHBOARD' ? renderDashboard() : renderPeriodDetails()}
    </div>
  );
};

export default FiscalPeriodManager;
