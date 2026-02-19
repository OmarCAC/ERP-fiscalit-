
import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings, 
  ChevronRight,
  BookOpen,
  Bell,
  Users,
  Layers,
  ShieldCheck,
  MapPin,
  Cpu,
  History,
  Lock
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen }) => {
  const menuGroups = [
    {
      title: 'Pilotage',
      items: [
        { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Identité & Régime',
      items: [
        { id: 'taxpayer_management', label: 'Module Contribuable', icon: Users },
        { id: 'regime_details', label: 'Mon Régime Fiscal', icon: ShieldCheck },
      ]
    },
    {
      title: 'Temporalité',
      items: [
        { id: 'fiscal_periods', label: 'Gestion des Périodes', icon: History },
        { id: 'calendar', label: 'Calendrier Fiscal', icon: Calendar },
      ]
    },
    {
      title: 'Opérations',
      items: [
        { id: 'declarations', label: 'Gestion Déclarations', icon: FileText },
        { id: 'payments', label: 'Gestion Paiements', icon: CreditCard },
      ]
    },
    {
      title: 'Analyse',
      items: [
        { id: 'reports', label: 'Rapports & Analytique', icon: BarChart3 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      title: 'Outils & Référentiels',
      items: [
        { id: 'naa_rates', label: 'Annuaire Taux NAA', icon: Layers },
        { id: 'tax_jurisdiction', label: 'Annuaire des CPI', icon: MapPin },
        { id: 'system_parameters', label: 'Paramètres Système', icon: Cpu },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'settings', label: 'Utilisateurs & Privilèges', icon: Lock },
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-white border-r border-slate-200 h-full flex flex-col sticky top-16 hidden lg:flex shrink-0">
      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">
              {group.title}
            </p>
            <nav className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as AppView)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all group ${
                    currentView === item.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 transition-colors ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  {currentView === item.id && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/40 transition-all"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aide en ligne</p>
          <h4 className="text-sm font-bold mb-4 leading-tight">Besoin d'aide fiscale ?</h4>
          <button 
            onClick={() => onViewChange('help')}
            className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition-all shadow-sm"
          >
            Consulter le centre
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;