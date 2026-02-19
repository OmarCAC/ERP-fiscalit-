
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  X,
  Lightbulb,
  Check,
  CalendarDays,
  Flag,
  AlertCircle,
  Sparkles,
  Filter,
  Download,
  Plus,
  BellRing // Ajout icone
} from 'lucide-react';
import { CalendarConfig, Declaration } from '../types';
import { useNotification } from '../contexts/NotificationContext'; 
// ... imports existants ...

interface FiscalCalendarProps {
  calendarConfig: CalendarConfig;
  declarations?: Declaration[]; 
  onAddReminder?: (title: string, date: Date) => void;
}

const FiscalCalendar: React.FC<FiscalCalendarProps> = ({ calendarConfig, declarations = [], onAddReminder }) => {
  const { dispatch } = useNotification(); 
  const [currentDate, setCurrentDate] = useState(new Date());
  // ... autres states inchangés ...
  const [completedEvents, setCompletedEvents] = useState<Record<string, boolean>>({});
  const [guideModal, setGuideModal] = useState<{ isOpen: boolean; event: any | null } | null>(null);
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({});

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // ... (Garder les useEffects et fonctions existants comme toggleCategory, isEventCompletedByDeclaration, etc.) ...
  
  const toggleCategory = (catId: string) => {
    setVisibleCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const isEventCompletedByDeclaration = (title: string, date: Date) => {
      // Simple heuristic based on title and date
      // Assuming monthly declarations are for the previous month
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      let targetMonthIndex = date.getMonth() - 1;
      let targetYear = date.getFullYear();
      if (targetMonthIndex < 0) {
          targetMonthIndex = 11;
          targetYear--;
      }
      const targetMonthName = monthNames[targetMonthIndex];
      
      return declarations.some(d => {
         // Check matching status and period (loose match)
         return d.status !== 'BROUILLON' && 
                d.period.includes(targetYear.toString()) &&
                d.period.includes(targetMonthName) &&
                (d.type.includes(title) || title.includes(d.type));
      });
  };

  useEffect(() => {
    const initialFilters: Record<string, boolean> = { 'HOLIDAY': true };
    calendarConfig.categories.forEach(cat => {
      initialFilters[cat.id] = true;
    });
    setVisibleCategories(initialFilters);
  }, [calendarConfig.categories]);

  // Fonction de test manuel pour la démonstration
  const testTriggerDeadline = (ruleTitle: string) => {
      // Cette fonction simule l'envoi d'une alerte ciblée par rôle
      dispatch({
          type: 'DEADLINE',
          title: `Rappel Manuel : ${ruleTitle}`,
          message: `Ceci est un test d'intégration. Seuls les COMPTABLES et ADMINS devraient voir ça.`,
          targetRoles: ['COMPTABLE', 'ADMIN'], // CIBLAGE PAR RÔLE
      });
      alert(`Signal envoyé pour "${ruleTitle}" aux rôles : COMPTABLE, ADMIN.\nVérifiez la cloche si vous avez le bon rôle !`);
  };

  // ... (Garder monthEvents, filteredEvents, calendarGrid, changeMonth, getDaysRemaining, openGuide, createReminder, getEventStatusStyle inchangés) ...

  const monthEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); 
    const events: any[] = [];

    calendarConfig.rules.forEach(rule => {
      let eventDate: Date | null = null;
      let shouldAdd = false;

      if (rule.frequency === 'MENSUEL') {
        const day = typeof rule.dayDeadline === 'number' ? rule.dayDeadline : parseInt(rule.dayDeadline as string);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const actualDay = Math.min(day, daysInMonth);
        eventDate = new Date(year, month, actualDay);
        shouldAdd = true;
      } 
      else if (rule.frequency === 'TRIMESTRIEL') {
        const targetMonths = [0, 3, 6, 9]; 
        if (targetMonths.includes(month)) {
           const day = typeof rule.dayDeadline === 'number' ? rule.dayDeadline : parseInt(rule.dayDeadline as string);
           const daysInMonth = new Date(year, month + 1, 0).getDate();
           eventDate = new Date(year, month, Math.min(day, daysInMonth));
           shouldAdd = true;
        }
      } 
      else if (rule.frequency === 'ANNUEL') {
        if (typeof rule.dayDeadline === 'string' && rule.dayDeadline.includes('-')) {
           const parts = rule.dayDeadline.split('-');
           const ruleMonth = parseInt(parts[0]) - 1; 
           const ruleDay = parseInt(parts[1]);
           if (ruleMonth === month) {
              eventDate = new Date(year, month, ruleDay);
              shouldAdd = true;
           }
        }
      }

      if (shouldAdd && eventDate) {
        const category = calendarConfig.categories.find(c => c.id === rule.categoryId);
        const isAutoCompleted = isEventCompletedByDeclaration(rule.title, eventDate);
        
        events.push({
          id: `${rule.id}-${year}-${month}`,
          date: eventDate,
          title: rule.title,
          type: rule.categoryId,
          detail: rule.description,
          color: category?.color || 'bg-slate-500',
          isAutoCompleted
        });
      }
    });

    calendarConfig.holidays.forEach(h => {
       const [mStr, dStr] = h.date.split('-');
       const hMonth = parseInt(mStr) - 1;
       const hDay = parseInt(dStr);

       if (hMonth === month) {
          events.push({
             id: `${h.id}-${year}`,
             date: new Date(year, month, hDay),
             title: h.label,
             type: 'HOLIDAY',
             detail: 'Jour férié chômé payé',
             color: 'bg-red-500',
             isAutoCompleted: false
          });
       }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [currentDate, calendarConfig, declarations]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const filteredEvents = useMemo(() => {
    return monthEvents.filter(e => visibleCategories[e.type]);
  }, [monthEvents, visibleCategories]);

  const calendarGrid = useMemo(() => {
    const grid = [];
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      grid.push({ day: prevMonthDays - startOffset + i + 1, type: 'prev', events: [], isWeekend: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayOfWeek = date.getDay();
      const isWeekend = calendarConfig.general.weekends.includes(dayOfWeek);
      const dayEvents = filteredEvents.filter(e => e.date.getDate() === i);
      grid.push({ day: i, type: 'curr', events: dayEvents, isWeekend });
    }
    
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({ day: i, type: 'next', events: [], isWeekend: false });
    }
    return grid;
  }, [currentDate, filteredEvents, startOffset, daysInMonth, calendarConfig]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const getDaysRemaining = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    targetDate.setHours(0,0,0,0);
    const diff = targetDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const openGuide = (event: any) => {
    if(event.type === 'HOLIDAY') return;
    setGuideModal({ isOpen: true, event });
  };

  const createReminder = (event: any) => {
      if (onAddReminder) {
          onAddReminder(event.title, event.date);
          alert("Rappel ajouté aux notifications !");
          setGuideModal(null);
      }
  };

  const getEventStatusStyle = (event: any) => {
    if (event.type === 'HOLIDAY') return { bg: 'bg-red-50 border-none', text: 'text-red-500 font-black', label: 'FÉRIÉ', icon: Flag };
    if (event.isAutoCompleted || completedEvents[event.id]) return { bg: 'bg-green-100 border-l-4 border-green-500', text: 'text-green-800', label: 'Déclaré', icon: Check };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const evDate = new Date(event.date);
    evDate.setHours(0,0,0,0);

    const daysRemaining = getDaysRemaining(evDate);
    const isCritical = daysRemaining <= calendarConfig.alerts.criticalDays && daysRemaining >= 0;
    const isWarning = daysRemaining <= calendarConfig.alerts.warningDays && daysRemaining > calendarConfig.alerts.criticalDays;

    if (evDate < today) return { bg: 'bg-red-50 border-l-4 border-red-500', text: 'text-red-800', label: 'Retard', icon: AlertCircle };
    if (daysRemaining === 0) return { bg: 'bg-orange-50 border-l-4 border-orange-500', text: 'text-orange-800', label: "Auj.", icon: Clock };
    if (isCritical) return { bg: 'bg-red-50 border-l-4 border-red-400 shadow-md', text: 'text-red-800', label: `J-${daysRemaining}`, icon: Clock };
    if (isWarning) return { bg: 'bg-amber-50 border-l-4 border-amber-400 shadow-md', text: 'text-amber-800', label: `J-${daysRemaining}`, icon: Clock };
    return { bg: 'bg-white border-l-4 border-slate-300 shadow-sm', text: 'text-slate-700', label: 'À venir', icon: CalendarDays };
  };

  // ... (Garder le return du composant tel quel jusqu'à l'affichage des événements dans la liste du bas) ...

  return (
    <div className="min-h-full bg-[#f8fafc] text-slate-900 flex flex-col pb-16 font-sans relative">
      
      {/* ... MODALE et HEADER inchangés ... */}
      {/* MODALE GUIDE */}
      {guideModal?.isOpen && guideModal.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                 <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                       <Lightbulb className="w-5 h-5 text-yellow-400" /> 
                       {guideModal.event.title}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">{guideModal.event.detail}</p>
                 </div>
                 <button onClick={() => setGuideModal(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Détails</h4>
                 <p className="text-sm text-slate-600">{guideModal.event.detail}</p>
                 <p className="text-xs text-slate-400 italic">Échéance calculée selon la configuration système.</p>
                 {guideModal.event.isAutoCompleted && (
                     <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 flex items-center gap-2">
                         <Check className="w-4 h-4" /> Déclaration déjà effectuée pour cette période.
                     </div>
                 )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => createReminder(guideModal.event)} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 flex items-center gap-2">
                    <Plus className="w-3 h-3" /> M'alerter
                 </button>
                 {!guideModal.event.isAutoCompleted && (
                    <button onClick={() => { 
                        setCompletedEvents(prev => ({...prev, [guideModal.event.id]: true}));
                        setGuideModal(null);
                    }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-2">
                        <Check className="w-3 h-3" /> Marquer comme fait
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-[#1e293b] text-white px-8 py-4 flex justify-between items-center shadow-md sticky top-0 z-30">
        <h1 className="text-xl font-bold tracking-tight">Calendrier Fiscal Algérie</h1>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
              <CalendarDays className="w-4 h-4 text-primary-300" />
              <span className="text-xs font-bold capitalize">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row p-6 gap-6 max-w-[1920px] mx-auto w-full">
        {/* ... Sidebar inchangée ... */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
           <div 
              onClick={() => setIsSmartMode(!isSmartMode)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 shadow-sm ${isSmartMode ? 'bg-primary/5 border-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}
           >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSmartMode ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                 <Sparkles className="w-5 h-5" />
              </div>
              <div>
                 <p className={`text-xs font-black uppercase ${isSmartMode ? 'text-primary' : 'text-slate-900'}`}>Mode Intelligent</p>
                 <p className="text-[10px] text-slate-500 font-medium leading-tight">Filtrer selon mon régime</p>
              </div>
           </div>

           <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="mb-4 flex items-center gap-2">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <label className="text-sm font-bold block text-slate-900">Catégories</label>
              </div>
              <div className="space-y-2">
                 {calendarConfig.categories.map(cat => (
                   <label key={cat.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg -mx-2 hover:bg-slate-50 transition-colors">
                      <div 
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCategories[cat.id] ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'}`}
                        onClick={(e) => { e.preventDefault(); toggleCategory(cat.id); }}
                      >
                         {visibleCategories[cat.id] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{cat.label}</span>
                   </label>
                 ))}
                 
                 <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg -mx-2 hover:bg-slate-50 transition-colors">
                    <div 
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleCategories['HOLIDAY'] ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'}`}
                      onClick={(e) => { e.preventDefault(); toggleCategory('HOLIDAY'); }}
                    >
                       {visibleCategories['HOLIDAY'] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Jours Fériés</span>
                 </label>
              </div>
           </div>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 flex flex-col gap-6">
           {/* CALENDRIER */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 capitalize min-w-[140px] text-center shadow-sm">
                       {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500"><ChevronRight className="w-5 h-5" /></button>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-primary transition-all">Aujourd'hui</button>
                 </div>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                 {weekDays.map((d, i) => (
                    <div key={d} className={`py-3 text-center text-xs font-black uppercase tracking-wider border-r border-slate-200 last:border-0 ${calendarConfig.general.weekends.includes(i) ? 'text-red-400 bg-red-50/30' : 'text-slate-400'}`}>{d}</div>
                 ))}
              </div>

              <div className="grid grid-cols-7 bg-slate-200 gap-px border-b border-slate-200">
                 {calendarGrid.map((cell, idx) => (
                    <div key={idx} className={`bg-white min-h-[140px] p-2 flex flex-col gap-1.5 transition-colors ${cell.type !== 'curr' ? 'bg-slate-50/50' : cell.isWeekend ? 'bg-slate-50/30' : 'hover:bg-blue-50/10'}`}>
                       <span className={`text-sm font-bold mb-1 ${cell.type !== 'curr' ? 'text-slate-300' : cell.isWeekend ? 'text-red-300' : 'text-slate-700'}`}>{cell.day}</span>
                       
                       {cell.events.map((ev: any, i: number) => {
                          const status = getEventStatusStyle(ev);
                          return (
                             <div 
                                key={i} 
                                onClick={() => openGuide(ev)}
                                className={`p-2 rounded-lg text-[10px] mb-1 flex flex-col gap-0.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-sm ${status.bg} ${status.text}`}
                             >
                                <div className="flex justify-between items-start">
                                   <div className={`w-2 h-2 rounded-full ${ev.color}`}></div>
                                   <status.icon className="w-3 h-3 flex-shrink-0" />
                                </div>
                                <span className="leading-tight opacity-90 truncate font-medium">{ev.title}</span>
                                {status.label.startsWith('J-') && !completedEvents[ev.id] && (
                                   <span className="text-[9px] font-black text-amber-600 mt-1 flex items-center gap-1 bg-amber-100 px-1 py-0.5 rounded w-fit">
                                      {status.label}
                                   </span>
                                )}
                             </div>
                          );
                       })}
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                 <Clock className="w-5 h-5 text-primary" /> Prochaines Échéances Clés
              </h3>
              <div className="space-y-3">
                 {filteredEvents.filter(e => e.date >= new Date() && e.type !== 'HOLIDAY').slice(0, 5).map((item: any, i: number) => {
                    const category = calendarConfig.categories.find(c => c.id === item.type);
                    const isCompleted = item.isAutoCompleted || completedEvents[item.id];
                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center text-sm gap-1 sm:gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                         <span className={`font-black min-w-[200px] flex items-center gap-2 ${isCompleted ? 'text-green-700 line-through decoration-slate-300' : 'text-slate-900'}`}>
                            <div className={`w-2 h-2 rounded-full ${category?.color || 'bg-slate-400'}`}></div>
                            {item.title}
                         </span>
                         <span className="text-slate-500 font-medium flex-1 truncate">{item.detail}</span>
                         <span className={`font-bold whitespace-nowrap px-3 py-1 rounded-full text-xs ${item.date < new Date() && !isCompleted ? 'bg-red-50 text-red-600' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                            {isCompleted ? 'Fait' : new Date(item.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}
                         </span>
                         <div className="flex gap-2">
                             <button onClick={() => openGuide(item)} className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">
                                Détails
                             </button>
                             {/* BOUTON TEST INTEGRATION */}
                             <button onClick={(e) => { e.stopPropagation(); testTriggerDeadline(item.title); }} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg" title="Tester Notification (Admin/Compta)">
                                <BellRing className="w-4 h-4" />
                             </button>
                         </div>
                      </div>
                    );
                 })}
                 {filteredEvents.filter(e => e.date >= new Date() && e.type !== 'HOLIDAY').length === 0 && (
                    <div className="p-4 text-center text-slate-400 italic">
                       Aucune échéance à venir pour ce mois avec les filtres actuels.
                    </div>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default FiscalCalendar;