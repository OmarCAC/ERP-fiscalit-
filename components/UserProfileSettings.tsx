
import React, { useState, useRef } from 'react';
import { 
  User, Bell, Shield, History, Settings, ChevronRight, LogOut, 
  CheckCircle2, Users, Plus, MoreHorizontal, Edit2, Trash2, 
  ShieldCheck, Lock, X, Save, Key, UserCheck, Smartphone, Globe, AlertTriangle, Fingerprint, Eye, FileText, Download,
  Moon, Laptop, Camera, Building2, Mail, LayoutGrid, Zap, ShieldAlert, Info, Sparkles
} from 'lucide-react';
import { User as UserType, Permission, UserRole, Taxpayer, UserNotificationSettings } from '../types';

const PERMISSION_GROUPS = [
  {
    label: 'Opérations de Base',
    perms: [
      { id: 'VIEW', label: 'Consulter les dossiers' },
      { id: 'CREATE', label: 'Créer des déclarations' },
      { id: 'EDIT', label: 'Modifier les brouillons' },
      { id: 'DELETE', label: 'Supprimer / Archiver' }
    ]
  },
  {
    label: 'Conformité & Finance',
    perms: [
      { id: 'VALIDATE', label: 'Valider formellement' },
      { id: 'RECTIFY', label: 'Émettre des rectificatives' },
      { id: 'PAY', label: 'Effectuer des paiements' }
    ]
  },
  {
    label: 'Administration',
    perms: [
      { id: 'SETTINGS', label: 'Accès Paramètres Système' }
    ]
  }
];

// --- NOUVEAU : MATRICE INTELLIGENTE PAR RÔLE ---
const NOTIFICATION_PRESETS: Record<UserRole, UserNotificationSettings> = {
  'ADMIN': {
    deadline: { email: true, sms: true, push: true },
    payment: { email: true, sms: false, push: true },
    security: { email: true, sms: true, push: true },
    admin: { email: true, sms: false, push: true }
  },
  'COMPTABLE': {
    deadline: { email: true, sms: false, push: true },
    payment: { email: true, sms: false, push: false },
    security: { email: true, sms: false, push: false },
    admin: { email: false, sms: false, push: false }
  },
  'CLIENT': {
    deadline: { email: false, sms: true, push: true },
    payment: { email: true, sms: true, push: false },
    security: { email: true, sms: true, push: false },
    admin: { email: false, sms: false, push: false }
  }
};

const MOCK_LOGS = [
  { id: 1, action: 'Connexion', user: 'Ahmed Benali', date: 'Aujourd\'hui 09:41', ip: '105.101.22.14', status: 'SUCCESS' },
  { id: 2, action: 'Modification G50', user: 'Sarah Comptable', date: 'Aujourd\'hui 08:30', ip: '192.168.1.5', status: 'SUCCESS' },
  { id: 3, action: 'Export Bilan', user: 'M. Le Gérant', date: 'Hier 16:15', ip: '41.200.10.55', status: 'WARNING' },
  { id: 4, action: 'Tentative d\'accès', user: 'Inconnu', date: 'Hier 03:00', ip: '14.15.22.11', status: 'FAILURE' },
  { id: 5, action: 'Création Utilisateur', user: 'Ahmed Benali', date: '20/05/2024 14:00', ip: '105.101.22.14', status: 'SUCCESS' },
];

interface Props {
  users: UserType[];
  setUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  taxpayers: Taxpayer[]; 
}

const UserProfileSettings: React.FC<Props> = ({ users, setUsers, taxpayers }) => {
  const [activeTab, setActiveTab] = useState('USERS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [modalTab, setModalTab] = useState<'INFO' | 'PERMS' | 'NOTIFS'>('INFO');
  
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);
  
  // État local pour l'édition des préférences
  const [userNotifPrefs, setUserNotifPrefs] = useState<UserNotificationSettings>({
      deadline: { email: true, sms: false, push: true },
      payment: { email: true, sms: true, push: false },
      security: { email: true, sms: true, push: true },
      admin: { email: true, sms: false, push: true }
  });

  const [securityForm, setSecurityForm] = useState({ currentPass: '', newPass: '', confirmPass: '', twoFactor: false });
  const [activeSessions, setActiveSessions] = useState([
     { device: 'Chrome / Windows', location: 'Alger, Algérie', ip: '105.101.22.14', current: true },
     { device: 'Safari / iPhone 13', location: 'Oran, Algérie', ip: '41.220.15.10', current: false },
  ]);

  const [preferences, setPreferences] = useState({
    language: 'fr',
    currency: 'DZD',
    emailNotifications: true,
    smsNotifications: false,
    autoSave: true,
    density: 'comfortable',
    fiscalYear: new Date().getFullYear(),
    reminderDays: 3
  });

  // --- ACTIONS ---
  
  const handleEditUser = (user: UserType) => {
    setCurrentUserData({ ...user });
    setModalTab('INFO'); 
    
    // Chargement des prefs : Si l'user a déjà des settings, on les prend, sinon on charge le preset par défaut
    const loadedPrefs = user.notificationSettings || NOTIFICATION_PRESETS[user.role] || NOTIFICATION_PRESETS['CLIENT'];
    setUserNotifPrefs(loadedPrefs);
    
    setIsEditing(true);
  };

  const handleCreateUser = () => {
    setCurrentUserData({
      id: `u_${Date.now()}`,
      name: '',
      email: '',
      role: 'CLIENT',
      organization: '', 
      avatar: 'https://picsum.photos/id/1/50/50',
      permissions: ['VIEW']
    });
    setModalTab('INFO');
    setUserNotifPrefs(NOTIFICATION_PRESETS['CLIENT']); 
    setIsEditing(true);
  };

  const handleDeleteUser = (id: string) => {
    if(confirm("Supprimer cet utilisateur définitivement ?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleSaveUser = () => {
    if (!currentUserData || !currentUserData.name) return;
    
    // On persiste les préférences de notification dans l'objet User
    const dataToSave: UserType = {
        ...currentUserData,
        organization: currentUserData.organization || 'Organisation Externe',
        notificationSettings: userNotifPrefs // Sauvegarde clé
    };

    setUsers(prev => {
      const exists = prev.find(u => u.id === dataToSave.id);
      if (exists) {
        return prev.map(u => u.id === dataToSave.id ? dataToSave : u);
      }
      return [...prev, dataToSave];
    });
    setIsEditing(false);
    setCurrentUserData(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUserData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCurrentUserData({ ...currentUserData, avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const togglePermission = (perm: Permission) => {
    if (!currentUserData) return;
    const currentPerms = currentUserData.permissions;
    if (currentPerms.includes(perm)) {
      setCurrentUserData({ ...currentUserData, permissions: currentPerms.filter(p => p !== perm) });
    } else {
      setCurrentUserData({ ...currentUserData, permissions: [...currentPerms, perm] });
    }
  };

  const applyRoleTemplate = (role: UserRole): Permission[] => {
    switch(role) {
      case 'ADMIN': return ['VIEW', 'EDIT', 'CREATE', 'DELETE', 'VALIDATE', 'PAY', 'SETTINGS', 'RECTIFY'];
      case 'COMPTABLE': return ['VIEW', 'EDIT', 'CREATE', 'RECTIFY'];
      case 'CLIENT': return ['VIEW', 'VALIDATE', 'PAY'];
      default: return ['VIEW'];
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
     if(!currentUserData) return;
     const newPerms = applyRoleTemplate(newRole);
     setCurrentUserData({ ...currentUserData, role: newRole, permissions: newPerms as any });
  };
  
  const applyNotificationPreset = () => {
      if(!currentUserData) return;
      const role = currentUserData.role;
      const preset = NOTIFICATION_PRESETS[role];
      if(preset) {
          setUserNotifPrefs(preset);
      }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPTABLE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CLIENT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const toggleUserNotif = (category: keyof UserNotificationSettings, channel: 'email'|'sms'|'push') => {
      setUserNotifPrefs(prev => ({
          ...prev,
          [category]: { ...prev[category], [channel]: !prev[category][channel] }
      }));
  };

  const renderUserManagement = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Utilisateurs</h3>
          <p className="text-slate-500 text-sm mt-1">Configurez les profils et les niveaux d'accès.</p>
        </div>
        <button onClick={handleCreateUser} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2">
           <Plus className="w-4 h-4" /> Nouvel Utilisateur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all">
             <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full">
                   {user.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-slate-400" />}
                </div>
             </div>
             
             <div className="flex-1 text-center md:text-left space-y-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                   <h4 className="text-lg font-black text-slate-900">{user.name}</h4>
                   <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit mx-auto md:mx-0 ${getRoleBadge(user.role)}`}>
                      {user.role}
                   </span>
                </div>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-2 justify-center md:justify-start">
                    {user.email} 
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span> 
                    <Building2 className="w-3 h-3 text-slate-400" /> {user.organization}
                </p>
                <div className="flex flex-wrap gap-1 justify-center md:justify-start mt-2">
                   {user.permissions.slice(0, 5).map(p => (
                      <span key={p} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-bold">{p}</span>
                   ))}
                   {user.permissions.length > 5 && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">+{user.permissions.length - 5}</span>}
                </div>
             </div>

             <div className="flex gap-2">
                <button onClick={() => handleEditUser(user)} className="p-3 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all">
                   <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteUser(user.id)} className="p-3 hover:bg-red-50 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
                   <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderEditModal = () => {
    if (!currentUserData) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
         <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configuration Profil</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">ID: {currentUserData.id}</p>
               </div>
               <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex border-b border-slate-100 px-8">
                {['INFO', 'PERMS', 'NOTIFS'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setModalTab(tab as any)} 
                        className={`px-4 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${modalTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab === 'INFO' ? 'Général' : tab === 'PERMS' ? 'Permissions' : 'Notifications'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               
               {modalTab === 'INFO' && (
                   <div className="space-y-6">
                       <div className="flex flex-col items-center gap-4 mb-6">
                           <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                               <img src={currentUserData.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm" />
                               <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></div>
                           </div>
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom Complet</label>
                                <input type="text" value={currentUserData.name} onChange={e => setCurrentUserData({...currentUserData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                                <input type="email" value={currentUserData.email} onChange={e => setCurrentUserData({...currentUserData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Organisation</label>
                                <select value={currentUserData.organization} onChange={e => setCurrentUserData({...currentUserData, organization: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                                    <option value="">Sélectionner...</option>
                                    {taxpayers.map(t => <option key={t.id} value={t.dynamicData['1']}>{t.dynamicData['1']}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Rôle</label>
                                <select value={currentUserData.role} onChange={e => handleRoleChange(e.target.value as UserRole)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                                <option value="ADMIN">Administrateur</option><option value="COMPTABLE">Comptable</option><option value="CLIENT">Client</option>
                                </select>
                            </div>
                        </div>
                   </div>
               )}

               {modalTab === 'PERMS' && (
                   <div className="space-y-4">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
                         {PERMISSION_GROUPS.map((group, idx) => (
                            <div key={idx}>
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 border-b border-slate-200 pb-1">{group.label}</p>
                               <div className="grid grid-cols-2 gap-3">
                                  {group.perms.map((perm) => {
                                     const isChecked = currentUserData.permissions.includes(perm.id as Permission);
                                     return (
                                        <label key={perm.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? 'bg-white border-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                                           <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-primary border-primary' : 'bg-slate-200 border-slate-300'}`}>
                                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                           </div>
                                           <input type="checkbox" className="hidden" checked={isChecked} onChange={() => togglePermission(perm.id as Permission)} />
                                           <span className={`text-xs font-bold ${isChecked ? 'text-primary' : 'text-slate-500'}`}>{perm.label}</span>
                                        </label>
                                     );
                                  })}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
               )}

               {modalTab === 'NOTIFS' && (
                   <div className="space-y-6">
                       <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg"><Sparkles className="w-5 h-5 text-yellow-300" /></div>
                              <div>
                                  <p className="text-xs font-black uppercase tracking-wide">Assistant Configuration</p>
                                  <p className="text-[10px] text-slate-300">Appliquer les préférences recommandées pour <span className="font-bold text-white">{currentUserData.role}</span></p>
                              </div>
                          </div>
                          <button onClick={applyNotificationPreset} className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Appliquer</button>
                       </div>

                       <div className="bg-white rounded-2xl border border-slate-200 p-6">
                           <div className="space-y-4">
                               {/* Row 1: Echeances */}
                               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                   <div className="flex items-center gap-3"><div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><History className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-700 uppercase">Rappels Échéances</span></div>
                                   <div className="flex gap-2">
                                       <button onClick={() => toggleUserNotif('deadline', 'email')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${userNotifPrefs.deadline.email ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}>Email</button>
                                       <button onClick={() => toggleUserNotif('deadline', 'sms')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${userNotifPrefs.deadline.sms ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}>SMS</button>
                                   </div>
                               </div>
                               {/* Row 2: Paiements */}
                               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                   <div className="flex items-center gap-3"><div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-700 uppercase">Confirmations Paiement</span></div>
                                   <div className="flex gap-2">
                                       <button onClick={() => toggleUserNotif('payment', 'email')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${userNotifPrefs.payment.email ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}>Email</button>
                                       <button onClick={() => toggleUserNotif('payment', 'sms')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${userNotifPrefs.payment.sms ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}>SMS</button>
                                   </div>
                               </div>
                               {/* Row 3: Securité */}
                               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                   <div className="flex items-center gap-3"><div className="p-2 bg-red-100 text-red-600 rounded-lg"><ShieldAlert className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-700 uppercase">Alertes Sécurité</span></div>
                                   <div className="flex gap-2">
                                       <button onClick={() => toggleUserNotif('security', 'email')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${userNotifPrefs.security.email ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}>Email</button>
                                       <button onClick={() => toggleUserNotif('security', 'sms')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${userNotifPrefs.security.sms ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}>SMS</button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
               <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100">Annuler</button>
               <button onClick={handleSaveUser} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Enregistrer
               </button>
            </div>
         </div>
      </div>
    );
  };

  const renderSecurity = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sécurité & Connexion</h2>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
             <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Lock className="w-5 h-5 text-primary" /> Mot de passe</h3>
             <div className="space-y-4">
                <input type="password" placeholder="Mot de passe actuel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={securityForm.currentPass} onChange={e => setSecurityForm({...securityForm, currentPass: e.target.value})} />
                <input type="password" placeholder="Nouveau mot de passe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={securityForm.newPass} onChange={e => setSecurityForm({...securityForm, newPass: e.target.value})} />
                <input type="password" placeholder="Confirmer le nouveau mot de passe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={securityForm.confirmPass} onChange={e => setSecurityForm({...securityForm, confirmPass: e.target.value})} />
                <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">Mettre à jour</button>
             </div>
          </div>
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Fingerprint className="w-5 h-5 text-purple-600" /> Authentification à deux facteurs</h3>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                   <div>
                      <p className="text-sm font-bold text-purple-900">2FA (Google Authenticator)</p>
                      <p className="text-xs text-purple-700 mt-1">Sécurisez votre compte avec un code temporaire.</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={securityForm.twoFactor} onChange={e => setSecurityForm({...securityForm, twoFactor: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Laptop className="w-5 h-5 text-slate-400" /> Sessions Actives</h3>
                <div className="space-y-3">
                   {activeSessions.map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                         <div>
                            <p className="text-sm font-bold text-slate-800">{session.device}</p>
                            <p className="text-xs text-slate-500">{session.location} • {session.ip}</p>
                         </div>
                         {session.current ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Actuelle</span> : <button className="text-xs font-bold text-red-500 hover:underline">Révoquer</button>}
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Journal d'Activité</h2>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2"><Download className="w-4 h-4" /> Exporter CSV</button>
       </div>
       <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                <tr><th className="px-6 py-4">Action</th><th className="px-6 py-4">Utilisateur</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">IP</th><th className="px-6 py-4 text-center">Statut</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {MOCK_LOGS.map(log => (
                   <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{log.action}</td>
                      <td className="px-6 py-4 text-slate-600">{log.user}</td>
                      <td className="px-6 py-4 text-slate-500">{log.date}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{log.ip}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : log.status === 'WARNING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Préférences Générales</h2>
       <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Affichage & Langue</h3>
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                   <span className="text-sm font-bold text-slate-700">Langue de l'interface</span>
                   <select value={preferences.language} onChange={e => setPreferences({...preferences, language: e.target.value})} className="bg-slate-50 border-none rounded-lg text-sm font-bold px-3 py-2 cursor-pointer">
                      <option value="fr">Français</option><option value="ar">العربية</option>
                   </select>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                   <span className="text-sm font-bold text-slate-700">Densité d'affichage</span>
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setPreferences({...preferences, density: 'comfortable'})} className={`px-3 py-1 rounded text-xs font-bold ${preferences.density === 'comfortable' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>Confort</button>
                      <button onClick={() => setPreferences({...preferences, density: 'compact'})} className={`px-3 py-1 rounded text-xs font-bold ${preferences.density === 'compact' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>Compact</button>
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Système</h3>
                <label className="flex items-center justify-between p-4 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50">
                   <span className="text-sm font-bold text-slate-700">Sauvegarde automatique</span>
                   <div className="relative">
                      <input type="checkbox" className="sr-only peer" checked={preferences.autoSave} onChange={e => setPreferences({...preferences, autoSave: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                   </div>
                </label>
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                   <span className="text-sm font-bold text-slate-700">Délai Rappel Échéances</span>
                   <select value={preferences.reminderDays} onChange={e => setPreferences({...preferences, reminderDays: parseInt(e.target.value)})} className="bg-slate-50 border-none rounded-lg text-sm font-bold px-3 py-2 cursor-pointer">
                      <option value={1}>J-1</option><option value={3}>J-3</option><option value={7}>J-7</option>
                   </select>
                </div>
             </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex justify-end">
             <button onClick={() => alert("Préférences enregistrées")} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">Enregistrer</button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex h-full bg-[#f5f7fa]">
      <aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 shrink-0">
        <div className="space-y-4">
           <h2 className="text-xl font-black text-slate-900 tracking-tight">Paramètres</h2>
           <nav className="space-y-1">
             {[{ id: 'PROFILE', label: 'Profil & Organisation', icon: User }, { id: 'USERS', label: 'Utilisateurs & Accès', icon: Users }, { id: 'NOTIF', label: 'Préférences', icon: Bell }, { id: 'SECURITY', label: 'Sécurité', icon: Shield }, { id: 'LOGS', label: 'Journal d\'Activité', icon: History }].map((item) => (
               <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
               </button>
             ))}
           </nav>
        </div>
        <div className="mt-auto">
           <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all group">
             <span className="text-xs font-black uppercase tracking-widest">Déconnexion</span>
             <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto space-y-12">
        {activeTab === 'USERS' && renderUserManagement()}
        {activeTab === 'SECURITY' && renderSecurity()}
        {activeTab === 'LOGS' && renderAuditLogs()}
        {activeTab === 'NOTIF' && renderPreferences()}
        {activeTab === 'PROFILE' && (
            // Placeholder Profil
            <div className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Paramètres</span><ChevronRight className="w-3 h-3" /><span className="text-slate-900">Profil</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 space-y-10">
                        <div className="flex items-center justify-between"><h3 className="text-lg font-black text-slate-900 tracking-tight">Détails Personnels</h3><button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Modifier</button></div>
                        <div className="space-y-6">
                            {[{ label: 'Nom Complet', val: 'Ahmed Benali' }, { label: 'Rôle', val: 'Administrateur' }, { label: 'Email', val: 'ahmed.benali@example.dz' }, { label: 'Téléphone', val: '+213 555 12 34 56' }].map((f, i) => (
                            <div key={i} className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label}</label><div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800">{f.val}</div></div>
                            ))}
                        </div>
                        <div className="pt-4 flex items-center gap-3"><button className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Enregistrer les modifications</button></div>
                    </section>
                </div>
            </div>
        )}
      </main>

      {isEditing && renderEditModal()}
    </div>
  );
};

export default UserProfileSettings;
