
import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Settings, Menu, Layers, ChevronDown, User, LogOut, FileText, BarChart3, ShieldCheck, Users, X, Check, ArrowRight } from 'lucide-react';
import { AppView, User as UserType } from '../types';
import { MOCK_USERS } from '../data/initial_data';
import { useNotification } from '../contexts/NotificationContext'; // IMPORT HOOK

interface NavbarProps {
  onViewChange: (view: AppView) => void;
  currentView: AppView;
  toggleSidebar: () => void;
  // unreadCount removed from props, used from context
  currentUser?: UserType;
  onSwitchUser?: (user: UserType) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onViewChange, currentView, toggleSidebar, currentUser, onSwitchUser }) => {
  const { unreadCount, notifications, markAsRead } = useNotification(); // USE CONTEXT
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  // Fallback si currentUser n'est pas passé
  const user = currentUser || MOCK_USERS[0];

  const navLinks = [
    { id: 'dashboard', label: 'Tableau de Bord' },
    { id: 'declarations', label: 'Déclarations' },
    { id: 'payments', label: 'Paiements' },
    { id: 'reports', label: 'Rapports' },
  ];

  // Récupérer les 5 dernières notifs non lues pour le dropdown
  const recentNotifications = notifications
    .filter(n => n.status === 'unread' && (!n.snoozedUntil || n.snoozedUntil < Date.now()))
    .slice(0, 5);

  return (
    <header className="h-16 bg-[#1e293b] flex items-center justify-between px-6 sticky top-0 z-50 text-white shadow-xl">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewChange('dashboard')}>
          <div className="bg-white/10 p-1.5 rounded-lg group-hover:bg-primary transition-colors">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase hidden lg:block">Portail Fiscal Algérie</span>
          <span className="text-lg font-black tracking-tighter uppercase lg:hidden">Jibayatic</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => onViewChange(link.id as AppView)}
              className={`text-xs font-black uppercase tracking-widest transition-all py-1.5 border-b-2 ${
                currentView === link.id
                  ? 'border-primary text-white' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="relative group hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-48 pl-10 pr-4 py-1.5 bg-white/5 border-white/10 focus:bg-white/10 focus:ring-0 rounded-lg text-xs text-white placeholder-slate-500 transition-all border"
          />
        </div>
        
        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative">
          <button 
             onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)} 
             className="p-2 hover:bg-white/5 rounded-full transition-colors relative text-slate-400 hover:text-white group"
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-white' : ''} group-hover:animate-swing`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-[#1e293b] flex items-center justify-center text-[9px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{unreadCount} nouvelles</span>
               </div>
               <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {recentNotifications.length > 0 ? (
                     recentNotifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group relative">
                           <div className="flex justify-between items-start mb-1">
                              <p className={`text-xs font-bold ${notif.priority === 'high' ? 'text-red-600' : 'text-slate-800'}`}>{notif.title}</p>
                              <span className="text-[9px] text-slate-400">{notif.date}</span>
                           </div>
                           <p className="text-[10px] text-slate-500 leading-tight pr-6">{notif.desc}</p>
                           <button 
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-primary hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                              title="Marquer comme lu"
                           >
                              <Check className="w-4 h-4" />
                           </button>
                        </div>
                     ))
                  ) : (
                     <div className="p-8 text-center text-slate-400 text-xs italic">
                        Aucune nouvelle notification
                     </div>
                  )}
               </div>
               <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button 
                     onClick={() => { onViewChange('notifications'); setIsNotifMenuOpen(false); }}
                     className="w-full py-2 text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1"
                  >
                     Voir toutes les notifications <ArrowRight className="w-3 h-3" />
                  </button>
               </div>
            </div>
          )}
        </div>

        <button onClick={() => onViewChange('help')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-slate-700/50 mx-1"></div>

        {/* USER DROPDOWN */}
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 leading-none mb-1">
                 {user.role === 'ADMIN' ? 'Administrateur' : user.role === 'COMPTABLE' ? 'Comptable' : 'Client'}
              </p>
              <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">{user.name}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-white/10 flex items-center justify-center overflow-hidden transition-transform group-active:scale-95">
               <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connecté en tant que</p>
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-medium italic">{user.organization}</p>
              </div>
              
              <div className="p-2 border-b border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">Changer de profil (Démo)</p>
                 {MOCK_USERS.filter(u => u.id !== user.id).map(u => (
                    <button 
                       key={u.id}
                       onClick={() => { if(onSwitchUser) onSwitchUser(u); setIsUserMenuOpen(false); }}
                       className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                    >
                       <img src={u.avatar} className="w-5 h-5 rounded-full" alt={u.name} />
                       {u.name} ({u.role})
                    </button>
                 ))}
              </div>

              <div className="p-2">
                <button onClick={() => { onViewChange('settings'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all">
                  <Users className="w-4 h-4" /> Gestion Utilisateurs & Accès
                </button>
                <button onClick={() => { onViewChange('system_parameters'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all">
                  <Settings className="w-4 h-4" /> Paramètres Système
                </button>
                <button onClick={() => { onViewChange('regime_details'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all">
                  <ShieldCheck className="w-4 h-4" /> Mon Régime Fiscal
                </button>
              </div>
              <div className="p-2 border-t border-slate-100">
                <button onClick={() => { onViewChange('landing'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
