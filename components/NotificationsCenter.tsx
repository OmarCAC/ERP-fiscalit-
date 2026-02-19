
import React, { useMemo, useState } from 'react';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Filter, 
  AlertCircle,
  Check,
  Mail,
  MessageCircle,
  Smartphone,
  Share2,
  Trash2,
  Inbox,
  Calendar,
  Eye,
  FileText,
  LifeBuoy,
  Sliders,
  Moon,
  Zap,
  ShieldAlert,
  Activity,
  AlarmClock,
  History,
  X,
  TrendingUp,
  UserCog,
  CheckCheck
} from 'lucide-react';
import { NotificationChannels, NotificationPreferences } from '../types';
import { useNotification } from '../contexts/NotificationContext'; // IMPORT CONTEXT

interface Props {
  // Notifications removed from props, using context
  channels: NotificationChannels;
  setChannels: React.Dispatch<React.SetStateAction<NotificationChannels>>;
  preferences: NotificationPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
}

const NotificationsCenter: React.FC<Props> = ({ 
  channels, 
  setChannels,
  preferences,
  setPreferences
}) => {
  const { notifications, history, markAsRead, snoozeNotification, removeNotification, dispatch } = useNotification(); // HOOK
  const [activeTab, setActiveTab] = useState<'INBOX' | 'SNOOZED' | 'HISTORY' | 'PREFERENCES'>('INBOX');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [previewChannel, setPreviewChannel] = useState<'email' | 'sms' | 'whatsapp' | null>(null);

  // --- FILTRAGE ---
  const filteredItems = useMemo(() => {
    return notifications.filter(n => {
      const isSnoozed = n.snoozedUntil && n.snoozedUntil > Date.now();
      
      // Logique Tabs
      if (activeTab === 'INBOX' && isSnoozed) return false;
      if (activeTab === 'SNOOZED' && !isSnoozed) return false;
      if (activeTab === 'HISTORY' || activeTab === 'PREFERENCES') return false;

      // Logique Filtres
      const matchType = filterType === 'ALL' || n.regime === filterType; // Note: 'regime' utilisé comme catégorie ici
      const matchStatus = filterStatus === 'ALL' || 
                          (filterStatus === 'UNREAD' && n.status === 'unread') || 
                          (filterStatus === 'READ' && n.status === 'read');
      
      return matchType && matchStatus;
    });
  }, [notifications, filterType, filterStatus, activeTab]);

  const deadlines = filteredItems.filter(n => n.type === 'DEADLINE');
  const insights = filteredItems.filter(n => n.type === 'INSIGHT');
  const others = filteredItems.filter(n => n.type !== 'DEADLINE' && n.type !== 'INSIGHT');

  const toggleChannel = (channel: keyof NotificationChannels) => {
    setChannels(prev => ({
      ...prev,
      [channel]: { ...prev[channel], enabled: !prev[channel].enabled }
    }));
  };

  const updateMatrixRole = (type: string, role: any) => {
    setPreferences(prev => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [type]: { ...prev.matrix[type], targetRole: role }
      }
    }));
  };

  const togglePreferenceMatrix = (type: string, method: string) => {
    const key = method as 'email' | 'push' | 'sms' | 'whatsapp';
    setPreferences(prev => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [type]: {
          ...prev.matrix[type],
          [key]: !prev.matrix[type][key]
        }
      }
    }));
  };

  const handleReminderDayToggle = (day: number) => {
    setPreferences(prev => {
      const currentDays = prev.deadlines.reminderDays;
      const newDays = currentDays.includes(day) 
        ? currentDays.filter(d => d !== day) 
        : [...currentDays, day].sort((a,b) => b-a);
      return { ...prev, deadlines: { ...prev.deadlines, reminderDays: newDays } };
    });
  };

  const markAllAsRead = () => {
      notifications.forEach(n => {
          if (n.status === 'unread') markAsRead(n.id);
      });
  };

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-32 relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centre de Notifications Fiscales</h1>
            {activeTab === 'INBOX' && (
              <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                  <Check className="w-4 h-4" /> Tout Marquer Comme Lu
              </button>
            )}
         </div>
         
         {/* TABS */}
         <div className="flex gap-6 border-b border-slate-100 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('INBOX')}
              className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'INBOX' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <Inbox className="w-4 h-4" /> Tableau de Bord
               {notifications.filter(n => n.status === 'unread' && (!n.snoozedUntil || n.snoozedUntil < Date.now())).length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{notifications.filter(n => n.status === 'unread' && (!n.snoozedUntil || n.snoozedUntil < Date.now())).length}</span>
               )}
            </button>
            <button 
              onClick={() => setActiveTab('SNOOZED')}
              className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'SNOOZED' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <AlarmClock className="w-4 h-4" /> En Attente (Snooze)
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'HISTORY' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <History className="w-4 h-4" /> Journal des Envois
            </button>
            <button 
              onClick={() => setActiveTab('PREFERENCES')}
              className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'PREFERENCES' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <Sliders className="w-4 h-4" /> Préférences & Canaux
            </button>
         </div>
      </div>

      {activeTab === 'INBOX' || activeTab === 'SNOOZED' ? (
        <div className="flex flex-col lg:flex-row h-full">
          {/* SIDEBAR FILTRES */}
          <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 space-y-8 flex-shrink-0 min-h-screen hidden md:block">
             <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900">Filtres</h3>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-900">Type de Déclaration</label>
                   <select 
                     value={filterType} 
                     onChange={(e) => setFilterType(e.target.value)}
                     className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                   >
                      <option value="ALL">Tous les types</option>
                      <option value="SYSTEM">Système</option>
                      <option value="IFU">IFU</option>
                      <option value="REEL">Réel</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-900">Statut</label>
                   <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                         <input type="radio" name="status" checked={filterStatus === 'ALL'} onChange={() => setFilterStatus('ALL')} className="text-primary focus:ring-primary" /> Tout
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                         <input type="radio" name="status" checked={filterStatus === 'UNREAD'} onChange={() => setFilterStatus('UNREAD')} className="text-primary focus:ring-primary" /> Non lus
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                         <input type="radio" name="status" checked={filterStatus === 'READ'} onChange={() => setFilterStatus('READ')} className="text-primary focus:ring-primary" /> Lus / Traités
                      </label>
                   </div>
                </div>
             </div>
          </aside>

          {/* CONTENU PRINCIPAL */}
          <main className="flex-1 p-8 space-y-10 overflow-y-auto">
             
             {/* INSIGHTS INTELLIGENTS */}
             {insights.length > 0 && activeTab === 'INBOX' && (
               <section className="space-y-4">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-indigo-500" /> Fiscal Intelligence</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {insights.map(notif => (
                        <div key={notif.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-lg shadow-indigo-200">
                           <div className="bg-white rounded-xl p-5 h-full flex flex-col relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                 <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg"><notif.icon className="w-6 h-6" /></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-50 px-2 py-1 rounded">IA Détecté</span>
                              </div>
                              <h3 className="text-base font-black text-slate-900 mb-2">{notif.title}</h3>
                              <p className="text-xs text-slate-500 leading-relaxed mb-4">{notif.desc}</p>
                              
                              {notif.insightData && (
                                <div className="mt-auto mb-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                                   <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Écart constaté</p>
                                      <p className={`text-xl font-black ${notif.insightData.trend === 'UP' ? 'text-red-500' : 'text-green-500'}`}>{notif.insightData.value}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Benchmark</p>
                                      <p className="text-sm font-bold text-slate-700">{notif.insightData.benchmark}</p>
                                   </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                 <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">{notif.action}</button>
                                 <button onClick={() => markAsRead(notif.id)} className="px-3 py-2 bg-slate-100 text-slate-400 rounded-lg hover:text-slate-600"><Check className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
             )}

             {/* NOTIFICATIONS STANDARD */}
             <section className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Vos Notifications</h2>
                <div className="space-y-4">
                   {[...deadlines, ...others].map(notif => (
                      <div key={notif.id} className={`bg-white border rounded-xl p-5 shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${notif.status === 'unread' ? 'border-l-4 border-l-primary' : 'border-slate-200 opacity-75'}`}>
                         <div className={`p-2.5 rounded-full ${notif.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                            {notif.type === 'DEADLINE' ? <Clock className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <h3 className={`text-sm font-bold ${notif.status === 'unread' ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h3>
                               <span className="text-[10px] font-medium text-slate-400">{notif.date}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{notif.desc}</p>
                            <div className="flex items-center gap-2 mt-3">
                               {notif.action && (
                                  <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-primary transition-colors">
                                     {notif.action}
                                  </button>
                               )}
                               {notif.status === 'unread' && (
                                   <button onClick={() => markAsRead(notif.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex items-center gap-1">
                                       <Check className="w-3 h-3" /> Lu
                                   </button>
                               )}
                               <button onClick={() => snoozeNotification(notif.id, 4)} className="p-1.5 text-slate-300 hover:text-orange-500 transition-colors" title="Snooze 4h"><AlarmClock className="w-4 h-4" /></button>
                               <button onClick={() => removeNotification(notif.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                      </div>
                   ))}
                   {filteredItems.length === 0 && (
                      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                         <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                         <p className="text-sm font-medium text-slate-500">Aucune notification à afficher.</p>
                      </div>
                   )}
                </div>
             </section>
          </main>
        </div>
      ) : activeTab === 'HISTORY' ? (
        // --- VUE HISTORIQUE ---
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-in fade-in">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Journal des Envois</h2>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Filter className="w-4 h-4" /> Filtrer</button>
           </div>
           
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <th className="px-6 py-4">Date & Heure</th>
                       <th className="px-6 py-4">Canal</th>
                       <th className="px-6 py-4">Événement</th>
                       <th className="px-6 py-4">Destinataire</th>
                       <th className="px-6 py-4 text-center">Statut</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 font-medium text-sm">
                    {history.map(log => (
                       <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.date}</td>
                          <td className="px-6 py-4">
                             <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                {log.channel === 'EMAIL' && <Mail className="w-3.5 h-3.5" />}
                                {log.channel === 'SMS' && <Smartphone className="w-3.5 h-3.5" />}
                                {log.channel === 'WHATSAPP' && <MessageCircle className="w-3.5 h-3.5" />}
                                {log.channel}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-slate-900">{log.event}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{log.recipient}</td>
                          <td className="px-6 py-4 text-center">
                             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                log.status === 'DELIVERED' ? 'bg-green-50 text-green-600' :
                                log.status === 'OPENED' ? 'bg-blue-50 text-blue-600' :
                                log.status === 'FAILED' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                             }`}>
                                {log.status === 'DELIVERED' && <CheckCheck className="w-3 h-3" />}
                                {log.status === 'OPENED' && <Eye className="w-3 h-3" />}
                                {log.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                                {log.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                    {history.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-slate-400 italic">Aucun envoi récent.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        // --- VUE PREFERENCES ---
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
           
           {/* ... Header ... */}
           <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Préférences de Notification</h2>
                 <p className="text-slate-500 font-medium">Contrôlez précisément ce que vous recevez et sur quel canal.</p>
              </div>
              <button onClick={() => alert("Paramètres enregistrés")} className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                 Enregistrer les modifications
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* GAUCHE : CANAUX & MODE */}
              <div className="lg:col-span-4 space-y-8">
                 {/* MODE SILENCIEUX */}
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><Moon className="w-5 h-5 text-slate-400" /> Mode "Ne Pas Déranger"</h3>
                    <div className="space-y-6">
                       <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-bold text-slate-700">Activer le mode silencieux</span>
                          <div className="relative">
                             <input type="checkbox" className="sr-only peer" checked={preferences.general.doNotDisturb} onChange={() => setPreferences(prev => ({...prev, general: {...prev.general, doNotDisturb: !prev.general.doNotDisturb}}))} />
                             <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                          </div>
                       </label>
                       
                       {preferences.general.doNotDisturb && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black uppercase text-slate-400">De</label>
                                   <input type="time" value={preferences.general.dndStart} onChange={e => setPreferences(prev => ({...prev, general: {...prev.general, dndStart: e.target.value}}))} className="w-full bg-white border border-slate-200 rounded-lg text-sm font-bold px-3 py-2" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black uppercase text-slate-400">À</label>
                                   <input type="time" value={preferences.general.dndEnd} onChange={e => setPreferences(prev => ({...prev, general: {...prev.general, dndEnd: e.target.value}}))} className="w-full bg-white border border-slate-200 rounded-lg text-sm font-bold px-3 py-2" />
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* CANAUX ACTIFS */}
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-3"><Share2 className="w-5 h-5 text-slate-400" /> Canaux Actifs</h3>
                    {[
                       { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
                       { id: 'sms', label: 'SMS', icon: Smartphone, color: 'text-slate-800', bg: 'bg-slate-100' },
                       { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    ].map((c) => (
                       <div key={c.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className={`p-2.5 rounded-xl ${c.bg} ${c.color}`}><c.icon className="w-5 h-5" /></div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">{c.label}</p>
                                <p className="text-[10px] font-medium text-slate-400">{channels[c.id as keyof NotificationChannels].enabled ? 'Connecté' : 'Désactivé'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <button onClick={() => setPreviewChannel(c.id as any)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-primary transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Test
                             </button>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={channels[c.id as keyof NotificationChannels].enabled} onChange={() => toggleChannel(c.id as any)} />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                             </label>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* DROITE : MATRICE & DÉLAIS */}
              <div className="lg:col-span-8 space-y-8">
                 
                 {/* DELAIS DE RAPPEL */}
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Clock className="w-5 h-5 text-slate-400" /> Fréquence des Rappels Fiscaux</h3>
                    <div className="flex flex-wrap gap-3">
                       {[30, 15, 7, 3, 1, 0].map(day => (
                          <button 
                             key={day} 
                             onClick={() => handleReminderDayToggle(day)}
                             className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${preferences.deadlines.reminderDays.includes(day) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                          >
                             {day === 0 ? "Le Jour J" : `J-${day}`}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* MATRICE DE NOTIFICATION AMÉLIORÉE */}
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Activity className="w-5 h-5 text-slate-400" /> Matrice de Notification & Rôles</h3>
                    </div>

                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr>
                                <th className="py-4 pl-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 rounded-l-xl">Type d'événement</th>
                                <th className="py-4 text-center text-xs font-black text-slate-400 uppercase bg-slate-50">Email</th>
                                <th className="py-4 text-center text-xs font-black text-slate-400 uppercase bg-slate-50">Push</th>
                                <th className="py-4 text-center text-xs font-black text-slate-400 uppercase bg-slate-50">SMS</th>
                                <th className="py-4 text-center text-xs font-black text-slate-400 uppercase bg-slate-50">Target</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {[
                                { id: 'deadline', label: 'Échéances Fiscales', icon: Clock },
                                { id: 'payment', label: 'Paiements & Reçus', icon: CheckCircle2 },
                                { id: 'admin', label: 'Mises à jour Admin', icon: FileText },
                                { id: 'security', label: 'Sécurité & Compte', icon: ShieldAlert },
                             ].map(row => (
                                <tr key={row.id} className="group hover:bg-slate-50/50">
                                   <td className="py-6 pl-4">
                                      <div className="flex items-center gap-3">
                                         <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><row.icon className="w-4 h-4" /></div>
                                         <span className="text-sm font-bold text-slate-800">{row.label}</span>
                                      </div>
                                   </td>
                                   {['email', 'push', 'sms'].map(col => (
                                      <td key={col} className="py-6 text-center">
                                         <label className="inline-flex items-center cursor-pointer">
                                            <input 
                                              type="checkbox" 
                                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                                              checked={preferences.matrix[row.id][col as 'email' | 'push' | 'sms'] as boolean}
                                              onChange={() => togglePreferenceMatrix(row.id, col)}
                                              disabled={col === 'sms' && !channels.sms.enabled}
                                            />
                                         </label>
                                      </td>
                                   ))}
                                   <td className="py-6 px-4">
                                      <select 
                                        value={preferences.matrix[row.id].targetRole || 'ALL'} 
                                        onChange={(e) => updateMatrixRole(row.id, e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold py-2 px-3 text-slate-700"
                                      >
                                         <option value="ALL">Tout le monde</option>
                                         <option value="MANAGER">Gérant Uniquement</option>
                                         <option value="ACCOUNTANT">Comptable</option>
                                      </select>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {previewChannel && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
               <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase flex items-center gap-2">
                     {previewChannel === 'whatsapp' ? <MessageCircle className="w-5 h-5" /> : previewChannel === 'sms' ? <Smartphone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                     Aperçu {previewChannel}
                  </h3>
                  <button onClick={() => setPreviewChannel(null)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X className="w-5 h-5" /></button>
               </div>
               <div className="p-8 bg-slate-100 min-h-[300px] flex items-center justify-center">
                  <div className="text-center text-slate-400 text-xs italic">
                     Simulation d'un message {previewChannel}...<br/>
                     "Votre déclaration G50 est attendue pour demain."
                  </div>
               </div>
               <div className="p-4 text-center">
                  <button onClick={() => { dispatch({ type: 'INFO', title: 'Test', message: `Test ${previewChannel}`, targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT'] }); setPreviewChannel(null);}} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all">Envoyer un test réel</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  )
}

export default NotificationsCenter;
