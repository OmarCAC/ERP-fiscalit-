
import React, { useState } from 'react';
import { 
  Beaker, 
  User, 
  Bell, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  ShieldAlert, 
  CreditCard,
  ChevronUp,
  ChevronDown,
  Bug,
  Database,
  Zap
} from 'lucide-react';
import { User as UserType, Declaration, AppNotification } from '../types';
import { MOCK_USERS } from '../data/initial_data';
import { useNotification } from '../contexts/NotificationContext';

interface Props {
  currentUser: UserType;
  setCurrentUser: (user: UserType) => void;
  declarations: Declaration[];
  setDeclarations: React.Dispatch<React.SetStateAction<Declaration[]>>;
}

export const ScenarioSimulator: React.FC<Props> = ({ 
  currentUser, 
  setCurrentUser, 
  declarations, 
  setDeclarations 
}) => {
  const { dispatch, clearAll } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ROLES' | 'EVENTS' | 'DATA'>('ROLES');

  // --- SCENARIOS ---

  // 1. Simulation d'une attaque (Test Sécurité & Canaux)
  const simulateSecurityBreach = () => {
     dispatch({
        type: 'SECURITY',
        title: 'Connexion Suspecte Bloquée',
        message: 'Tentative de connexion depuis IP 192.168.1.55 (Moscou, RU). Votre compte a été temporairement verrouillé.',
        targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT']
     });
  };

  // 2. Simulation Fin de Mois (Test Charge & Délais)
  const simulateMonthEnd = () => {
      dispatch({
         type: 'DEADLINE',
         title: 'Rappel G50 Mensuel',
         message: 'N\'oubliez pas votre déclaration mensuelle avant le 20.',
         targetRoles: ['COMPTABLE', 'CLIENT']
      });
      dispatch({
         type: 'DEADLINE',
         title: 'Acompte IBS',
         message: 'Le 2ème acompte IBS arrive à échéance.',
         targetRoles: ['COMPTABLE', 'ADMIN']
      });
  };

  // 3. Injection de Données (Test UI Dashboard)
  const injectLateDeclaration = () => {
     const newDecl: Declaration = {
        id: `SIM-LATE-${Math.floor(Math.random() * 1000)}`,
        type: 'G50 Mensuel',
        period: 'Janvier 2023',
        regime: 'Réel Normal',
        submissionDate: '-',
        status: 'EN RETARD',
        amount: 540000,
        taxpayerName: 'SIMULATION SARL'
     };
     setDeclarations(prev => [newDecl, ...prev]);
     dispatch({
        type: 'ADMIN',
        title: 'Nouvelle Anomalie Détectée',
        message: 'Une déclaration marquée "EN RETARD" a été injectée dans le système.',
        targetRoles: ['ADMIN']
     });
  };

  // 4. Cycle Complet (Workflow Automatique)
  const runFullCycle = async () => {
      // Étape 1 : Création
      dispatch({ type: 'INFO', title: 'Cycle Auto: Démarrage', message: 'Création de la déclaration G50...', targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT'] });
      await new Promise(r => setTimeout(r, 1500));
      
      const id = `AUTO-${Date.now()}`;
      const decl: Declaration = {
          id, type: 'G50 Auto', period: 'Cycle Test', regime: 'Réel', submissionDate: '-', status: 'BROUILLON', amount: 100000, taxpayerName: 'TEST FLOW'
      };
      setDeclarations(prev => [decl, ...prev]);

      // Étape 2 : Validation
      await new Promise(r => setTimeout(r, 1500));
      setDeclarations(prev => prev.map(d => d.id === id ? { ...d, status: 'VALIDÉ', submissionDate: new Date().toLocaleDateString('fr-FR') } : d));
      dispatch({ type: 'ADMIN', title: 'Cycle Auto: Validé', message: 'Déclaration validée par le système.', targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT'] });

      // Étape 3 : Paiement
      await new Promise(r => setTimeout(r, 1500));
      setDeclarations(prev => prev.map(d => d.id === id ? { ...d, status: 'PAYÉE' } : d));
      dispatch({ type: 'PAYMENT', title: 'Cycle Auto: Payé', message: 'Paiement reçu et confirmé. Cycle terminé.', targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT'] });
  };

  return (
    <div className={`fixed bottom-4 left-4 z-[1000] font-sans transition-all duration-300 ${isOpen ? 'w-80' : 'w-14'}`}>
      
      {/* TOGGLE BUTTON */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-2 border-slate-700"
          title="Ouvrir le Simulateur"
        >
          <Beaker className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* PANEL */}
      {isOpen && (
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[600px]">
           {/* Header */}
           <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                 <Beaker className="w-5 h-5 text-purple-400" />
                 <span className="font-bold text-sm uppercase tracking-wider">Test Lab</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><ChevronDown className="w-5 h-5" /></button>
           </div>

           {/* Tabs */}
           <div className="flex bg-slate-800 p-1">
              <button onClick={() => setActiveTab('ROLES')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'ROLES' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Identité</button>
              <button onClick={() => setActiveTab('EVENTS')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'EVENTS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Scénarios</button>
              <button onClick={() => setActiveTab('DATA')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'DATA' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Données</button>
           </div>

           {/* Content */}
           <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
              
              {/* ONGLET ROLES */}
              {activeTab === 'ROLES' && (
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilisateur Actuel</p>
                    <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-3 border border-slate-700">
                       <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden">
                          <img src={currentUser.avatar} className="w-full h-full object-cover" />
                       </div>
                       <div>
                          <p className="text-xs font-bold">{currentUser.name}</p>
                          <p className={`text-[10px] font-black uppercase ${currentUser.role === 'ADMIN' ? 'text-purple-400' : currentUser.role === 'COMPTABLE' ? 'text-blue-400' : 'text-green-400'}`}>{currentUser.role}</p>
                       </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Changer d'identité</p>
                    <div className="grid grid-cols-1 gap-2">
                       {MOCK_USERS.map(u => (
                          <button 
                             key={u.id}
                             onClick={() => setCurrentUser(u)}
                             className={`text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors ${currentUser.id === u.id ? 'bg-slate-800 border border-slate-600' : ''}`}
                          >
                             <div className={`w-2 h-2 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500' : u.role === 'COMPTABLE' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                             {u.name}
                          </button>
                       ))}
                    </div>
                 </div>
              )}

              {/* ONGLET EVENTS */}
              {activeTab === 'EVENTS' && (
                 <div className="space-y-3">
                    <button onClick={simulateSecurityBreach} className="w-full text-left p-3 bg-red-900/20 border border-red-900/50 rounded-lg hover:bg-red-900/40 transition-all group">
                       <div className="flex items-center gap-2 text-red-400 mb-1">
                          <ShieldAlert className="w-4 h-4" /> <span className="text-xs font-bold">Alerte Sécurité</span>
                       </div>
                       <p className="text-[10px] text-red-300/70">Simule une intrusion IP étrangère.</p>
                    </button>

                    <button onClick={simulateMonthEnd} className="w-full text-left p-3 bg-orange-900/20 border border-orange-900/50 rounded-lg hover:bg-orange-900/40 transition-all group">
                       <div className="flex items-center gap-2 text-orange-400 mb-1">
                          <Bell className="w-4 h-4" /> <span className="text-xs font-bold">Fin de Mois</span>
                       </div>
                       <p className="text-[10px] text-orange-300/70">Envoie les rappels d'échéance G50.</p>
                    </button>

                    <button onClick={runFullCycle} className="w-full text-left p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg hover:bg-blue-900/40 transition-all group">
                       <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <RefreshCw className="w-4 h-4 group-hover:animate-spin" /> <span className="text-xs font-bold">Cycle Automatique</span>
                       </div>
                       <p className="text-[10px] text-blue-300/70">Crée, valide et paie une déclaration.</p>
                    </button>

                    <button onClick={clearAll} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white border border-dashed border-slate-700 rounded-lg hover:bg-slate-800 transition-all mt-4">
                       Vider les notifications
                    </button>
                 </div>
              )}

              {/* ONGLET DATA */}
              {activeTab === 'DATA' && (
                 <div className="space-y-3">
                    <button onClick={injectLateDeclaration} className="w-full text-left p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-500">
                       <div className="flex items-center gap-2 text-slate-300 mb-1">
                          <Database className="w-4 h-4" /> <span className="text-xs font-bold">Injecter "En Retard"</span>
                       </div>
                       <p className="text-[10px] text-slate-500">Ajoute une déclaration G50 en retard pour tester les pénalités.</p>
                    </button>
                    
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                       <p className="text-[10px] font-mono text-green-400 mb-1">
                          Debug Info:
                       </p>
                       <div className="text-[9px] text-slate-500 font-mono space-y-1">
                          <p>User Role: {currentUser.role}</p>
                          <p>Permissions: {currentUser.permissions.length}</p>
                          <p>Declarations: {declarations.length}</p>
                          <p>Notifs Settings: {currentUser.notificationSettings ? 'OK' : 'Default'}</p>
                       </div>
                    </div>
                 </div>
              )}

           </div>
        </div>
      )}
    </div>
  );
};
