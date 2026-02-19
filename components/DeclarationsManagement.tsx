
import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Edit2, Trash2, FileText, CheckCircle2, 
  Printer, History, CreditCard, Lock, Unlock, AlertTriangle, X,
  Paperclip, Shield, AlertOctagon, Info, Calendar, Filter,
  Archive, MoreHorizontal, ArrowRight, Download, Zap,
  Inbox, RefreshCw, TrendingUp, TrendingDown, Minus,
  MessageSquare, Send, User, Layers, List, ChevronRight, ChevronDown, Columns, MoreVertical
} from 'lucide-react';
import { Declaration, Taxpayer, FiscalYear, User as UserType, UserRole } from '../types';
import { useNotification } from '../contexts/NotificationContext'; // IMPORT CONTEXT

// --- CONFIGURATION DU CYCLE DE VIE (TIMELINE) ---
const STEPS = [
  { id: 1, label: 'Saisie', codes: ['BROUILLON', 'EN COURS'] },
  { id: 2, label: 'Validation', codes: ['VALIDÉ', 'TRANSMIS'] },
  { id: 3, label: 'Paiement', codes: ['À Payer', 'PAYÉE', 'EN RETARD'] },
  { id: 4, label: 'Clôture', codes: ['ACCEPTÉE', 'REÇUE', 'ARCHIVÉE'] }
];

const KANBAN_COLUMNS = [
  { id: 'DRAFT', label: 'Brouillons & En Cours', codes: ['BROUILLON', 'EN COURS'], color: 'bg-slate-100', accent: 'bg-slate-500' },
  { id: 'VALIDATED', label: 'Validées / À Transmettre', codes: ['VALIDÉ', 'TRANSMIS'], color: 'bg-blue-50', accent: 'bg-blue-500' },
  { id: 'DUE', label: 'À Payer / En Retard', codes: ['À Payer', 'EN RETARD'], color: 'bg-orange-50', accent: 'bg-orange-500' },
  { id: 'DONE', label: 'Terminées & Archivées', codes: ['PAYÉE', 'ACCEPTÉE', 'REÇUE', 'ARCHIVÉE'], color: 'bg-emerald-50', accent: 'bg-emerald-500' }
];

const getStepStatus = (currentStatus: string, stepId: number) => {
  let currentStepIndex = 0; 
  if (['VALIDÉ', 'TRANSMIS'].includes(currentStatus)) currentStepIndex = 1;
  if (['À Payer', 'EN RETARD', 'PAYÉE'].includes(currentStatus)) currentStepIndex = 2;
  if (['ACCEPTÉE', 'REÇUE', 'ARCHIVÉE'].includes(currentStatus)) currentStepIndex = 3;

  if (stepId < currentStepIndex + 1) return 'completed';
  if (stepId === currentStepIndex + 1) return 'current';
  return 'pending'; 
};

// --- ANALYSE DE RISQUE ---
const analyzeRisk = (d: Declaration) => {
  if (d.status === 'EN RETARD') return { level: 'CRITICAL', label: 'Délai dépassé', icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' };
  if (d.amount > 1000000 && d.status === 'BROUILLON') return { level: 'HIGH', label: 'Montant élevé non validé', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' };
  if (d.amount === 0 && d.status !== 'PAYÉE') return { level: 'INFO', label: 'Déclaration Néant', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' };
  return null;
};

interface ChatMessage {
  id: string;
  user: string;
  role: UserRole | 'SYSTEM';
  text: string;
  date: string;
  isSystem?: boolean;
}

interface Props {
  declarations: Declaration[];
  taxpayers: Taxpayer[];
  fiscalYears: FiscalYear[];
  currentUser?: UserType; // Ajout Utilisateur Connecté
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onValidate: (id: string) => void;
  onFillOfficial: (id: string) => void;
  onTransmit?: (id: string) => void;
}

const DeclarationsManagement: React.FC<Props> = ({ 
  declarations, taxpayers, fiscalYears, currentUser, onNew, onEdit, onDelete, onValidate, onFillOfficial
}) => {
  const { dispatch } = useNotification(); // HOOK NOTIF

  // --- ETATS ---
  const [filters, setFilters] = useState({ search: '', status: 'ALL', year: 'ALL', regime: 'ALL' });
  
  // Selection & Actions de masse
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Drawer & Audit
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDeclaration, setActiveDeclaration] = useState<Declaration | null>(null);
  const [drawerTab, setDrawerTab] = useState<'DETAILS' | 'CHAT'>('DETAILS');

  // View Modes (List, Grouped, Kanban)
  const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED' | 'KANBAN'>('LIST');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Chat State
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Record<string, ChatMessage[]>>({
     'mock': [
         { id: '1', user: 'Système', role: 'SYSTEM', text: 'Déclaration générée automatiquement depuis le module Comptabilité.', date: '12 Mai 10:00', isSystem: true },
         { id: '2', user: 'Ahmed Benali', role: 'ADMIN', text: 'Attention, le montant de la TVA semble élevé ce mois-ci. J\'attends la facture rectificative.', date: '12 Mai 14:30' }
     ]
  });

  // Pagination (Table Views Only)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- PERMISSIONS HELPERS (RBAC) ---
  const canEdit = currentUser?.permissions.includes('EDIT') || false;
  const canDelete = currentUser?.permissions.includes('DELETE') || false;
  const canValidate = currentUser?.permissions.includes('VALIDATE') || false;
  const canPay = currentUser?.permissions.includes('PAY') || false;

  // --- LOGIQUE METIER ---
  
  // Fonction pour calculer l'écart fiscal (Variance Monitor)
  const calculateVariance = (currentDecl: Declaration) => {
    const previousDecl = declarations.find(d => 
        d.id !== currentDecl.id && 
        d.taxpayerName === currentDecl.taxpayerName && 
        d.type === currentDecl.type &&
        d.amount > 0 
    );

    if (!previousDecl) return null;

    const diff = currentDecl.amount - previousDecl.amount;
    const percent = (diff / previousDecl.amount) * 100;
    
    return {
        percent: Math.abs(percent).toFixed(1),
        direction: percent > 0 ? 'UP' : percent < 0 ? 'DOWN' : 'STABLE',
        value: percent
    };
  };
  
  const getAuditLogs = (decl: Declaration) => {
    // Dans une vraie app, ces logs viendraient du backend. Ici on simule avec des données dynamiques si dispo.
    const logs = [
      { action: 'Création (Brouillon)', user: 'Système', date: 'Il y a 5 jours', icon: FileText, color: 'text-slate-400' },
    ];
    
    // Simulation dynamique
    if (decl.status !== 'BROUILLON') {
      // Si on a un utilisateur courant qui a les droits de validation, on simule que c'est lui pour la démo
      const validatorName = currentUser?.role === 'ADMIN' ? currentUser.name : 'Ahmed Benali';
      logs.unshift({ action: 'Validation Formelle', user: validatorName, date: decl.submissionDate, icon: CheckCircle2, color: 'text-green-500' });
    }
    if (decl.status === 'PAYÉE') {
       const payerName = currentUser?.role === 'CLIENT' ? currentUser.name : 'M. Le Gérant';
      logs.unshift({ action: 'Paiement Enregistré', user: payerName, date: 'Aujourd\'hui', icon: CreditCard, color: 'text-emerald-600' });
    }
    return logs;
  };

  const filteredDeclarations = useMemo(() => {
    return declarations.filter(d => {
      const matchesSearch = d.id.toLowerCase().includes(filters.search.toLowerCase()) || d.taxpayerName?.toLowerCase().includes(filters.search.toLowerCase()) || d.period.toLowerCase().includes(filters.search.toLowerCase());
      
      // En mode KANBAN, on ignore le filtre de statut pour afficher toutes les colonnes
      const matchesStatus = viewMode === 'KANBAN' ? true : (filters.status === 'ALL' || d.status === filters.status);
      
      const matchesYear = filters.year === 'ALL' || d.period.includes(filters.year);
      const matchesRegime = filters.regime === 'ALL' || d.regime === filters.regime;

      return matchesSearch && matchesStatus && matchesYear && matchesRegime;
    });
  }, [declarations, filters, viewMode]);

  // --- LOGIQUE DE GROUPEMENT ---
  const groupedData = useMemo(() => {
    if (viewMode === 'LIST') return null;
    if (viewMode === 'KANBAN') {
        const columns: Record<string, { items: Declaration[], total: number }> = {};
        KANBAN_COLUMNS.forEach(col => {
            columns[col.id] = { items: [], total: 0 };
        });
        
        filteredDeclarations.forEach(d => {
            const col = KANBAN_COLUMNS.find(c => c.codes.includes(d.status));
            if (col) {
                columns[col.id].items.push(d);
                columns[col.id].total += d.amount;
            }
        });
        return columns; // Returns kanban structure
    }
    
    // Default GROUPED (By Taxpayer)
    const groups: Record<string, { id: string, name: string, total: number, count: number, items: Declaration[] }> = {};
    filteredDeclarations.forEach(d => {
        const key = d.taxpayerName || 'Inconnu';
        if (!groups[key]) {
            groups[key] = { id: key, name: key, total: 0, count: 0, items: [] };
        }
        groups[key].items.push(d);
        groups[key].total += d.amount;
        groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredDeclarations, viewMode]);

  // --- LOGIQUE PAGINATION ---
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    
    if (viewMode === 'GROUPED' && Array.isArray(groupedData)) {
        return {
            type: 'GROUPED',
            items: groupedData.slice(start, start + itemsPerPage)
        };
    }
    if (viewMode === 'KANBAN') return { type: 'KANBAN', items: [] }; // No pagination in Kanban for now
    
    return {
        type: 'LIST',
        items: filteredDeclarations.slice(start, start + itemsPerPage)
    };
  }, [filteredDeclarations, groupedData, currentPage, itemsPerPage, viewMode]);
  
  // Helper pour checkbox "Select All"
  const displayedDeclarationIds = useMemo(() => {
      if (viewMode === 'GROUPED' && Array.isArray(paginatedData.items)) {
          return (paginatedData.items as any[]).flatMap((g: any) => g.items.map((i: any) => i.id));
      }
      if (viewMode === 'LIST' && Array.isArray(paginatedData.items)) {
          return (paginatedData.items as Declaration[]).map(d => d.id);
      }
      return [];
  }, [paginatedData, viewMode]);

  // --- GESTION SELECTION ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === displayedDeclarationIds.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(displayedDeclarationIds));
    }
  };

  const toggleGroupExpansion = (groupKey: string) => {
     const newSet = new Set(expandedGroups);
     if (newSet.has(groupKey)) newSet.delete(groupKey);
     else newSet.add(groupKey);
     setExpandedGroups(newSet);
  };

  const toggleGroupSelection = (groupItems: Declaration[]) => {
      const newSet = new Set(selectedIds);
      const allSelected = groupItems.every(d => newSet.has(d.id));
      
      if (allSelected) {
          groupItems.forEach(d => newSet.delete(d.id));
      } else {
          groupItems.forEach(d => newSet.add(d.id));
      }
      setSelectedIds(newSet);
  };

  const isLocked = (status: string) => ['VALIDÉ', 'PAYÉE', 'TRANSMIS', 'ACCEPTÉE', 'ARCHIVÉE'].includes(status);

  const handleOpenDrawer = (decl: Declaration) => {
    setActiveDeclaration(decl);
    setDrawerTab('DETAILS'); 
    setDrawerOpen(true);
    
    if (!comments[decl.id]) {
        setComments(prev => ({
            ...prev,
            [decl.id]: [
                { id: 'init', user: 'Système', role: 'SYSTEM', text: `Dossier ${decl.id} initialisé.`, date: 'À l\'instant', isSystem: true }
            ]
        }));
    }
  };

  const handleAddComment = () => {
      if (!activeDeclaration || !newComment.trim() || !currentUser) return;
      const msg: ChatMessage = {
          id: Date.now().toString(),
          user: currentUser.name,
          role: currentUser.role, // Dynamic Role
          text: newComment,
          date: 'À l\'instant'
      };
      setComments(prev => ({
          ...prev,
          [activeDeclaration.id]: [...(prev[activeDeclaration.id] || []), msg]
      }));
      setNewComment('');
  };
  
  // WRAPPER POUR ACTIONS LOCALES + NOTIF
  const handleValidateWrapper = (id: string) => {
     onValidate(id);
     // Trigger notification via context
     dispatch({
        type: 'ADMIN', // Utilise le type ADMIN ou DEADLINE
        title: 'Validation Effectuée',
        message: `La déclaration ${id} a été validée formellement par ${currentUser?.name || 'l\'expert'}.`,
        targetRoles: ['CLIENT', 'ADMIN'] // Le client et l'admin sont notifiés
     });
  };

  const handleBatchAction = (action: string) => {
      if (action === 'VALIDER' && !canValidate) {
          alert("Vous n'avez pas les droits pour valider.");
          return;
      }
      if(confirm(`Exécuter l'action ${action} sur ${selectedIds.size} déclarations ?`)) {
          if (action === 'VALIDER') {
              // Simuler validation de masse
              selectedIds.forEach(id => onValidate(id));
              // Notif de masse
               dispatch({
                    type: 'ADMIN',
                    title: 'Validation en Masse',
                    message: `${selectedIds.size} déclarations ont été validées simultanément.`,
                    targetRoles: ['CLIENT', 'ADMIN']
               });
          }
          setSelectedIds(new Set());
      }
  };

  // --- COMPOSANT TIMELINE ---
  const Timeline = ({ status }: { status: string }) => (
    <div className="flex items-center w-32 relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
      {STEPS.map((step) => {
        const state = getStepStatus(status, step.id);
        let dotClass = "bg-slate-200 border-slate-300"; 
        
        if (state === 'completed') dotClass = "bg-primary border-primary";
        if (state === 'current') {
           if (status === 'EN RETARD') dotClass = "bg-red-500 border-red-600 animate-pulse";
           else dotClass = "bg-orange-400 border-orange-500";
        }

        return (
          <div key={step.id} className="flex-1 flex justify-center group relative">
             <div className={`w-2.5 h-2.5 rounded-full border-2 ${dotClass} z-10 transition-all`}></div>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                {step.label}
             </div>
          </div>
        );
      })}
    </div>
  );

  // --- RENDER ROW HELPER ---
  const renderDeclarationRow = (d: Declaration, isNested: boolean = false) => {
      const locked = isLocked(d.status);
      const risk = analyzeRisk(d);
      const variance = calculateVariance(d);

      return (
         <tr key={d.id} className={`group hover:bg-blue-50/30 transition-all cursor-pointer ${activeDeclaration?.id === d.id ? 'bg-blue-50/50' : ''} ${isNested ? 'bg-slate-50/30' : ''}`} onClick={() => handleOpenDrawer(d)}>
            <td className={`px-6 py-5 ${isNested ? 'pl-10' : ''}`} onClick={(e) => e.stopPropagation()}>
               <div className="flex items-center gap-4">
                  {isNested && <div className="w-4 border-l-2 border-b-2 border-slate-200 h-4 -mt-4 rounded-bl-lg"></div>}
                  <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleSelection(d.id)} className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
               </div>
            </td>
            <td className="px-6 py-5">
               <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${locked ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-primary/20 text-primary'}`}>
                     {locked ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                     <p className="text-sm font-black text-slate-900">{d.id}</p>
                     {!isNested && <p className="text-xs font-medium text-slate-500 truncate max-w-[180px]">{d.taxpayerName}</p>}
                     <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.period}</p>
                  </div>
               </div>
            </td>
            <td className="px-6 py-5">
               <div className="flex flex-col gap-1.5">
                  <Timeline status={d.status} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 w-fit px-2 py-0.5 rounded ${d.status === 'EN RETARD' ? 'bg-red-100 text-red-600' : 'text-slate-500 bg-slate-100'}`}>{d.status}</span>
               </div>
            </td>
            <td className="px-6 py-5 text-right">
               <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-black text-slate-900 tabular-nums">{d.amount.toLocaleString()} DA</p>
                    
                    {/* FISCAL VARIANCE MONITOR */}
                    {variance && (
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            variance.direction === 'UP' ? 'text-red-600 bg-red-50' : 
                            variance.direction === 'DOWN' ? 'text-emerald-600 bg-emerald-50' : 
                            'text-slate-500 bg-slate-100'
                        }`}>
                            {variance.direction === 'UP' && <TrendingUp className="w-3 h-3" />}
                            {variance.direction === 'DOWN' && <TrendingDown className="w-3 h-3" />}
                            {variance.direction === 'STABLE' && <Minus className="w-3 h-3" />}
                            <span>{variance.percent}%</span>
                        </div>
                    )}

                    {/* RISQUE */}
                    {risk && (
                        <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${risk.color}`}>
                            <risk.icon className="w-3 h-3" />
                            <span>{risk.label}</span>
                        </div>
                    )}
               </div>
            </td>
            <td className="px-6 py-5 text-right">
               <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {!locked ? (
                     <>
                       {/* BOUTON EDITER : Visible si permission EDIT */}
                       {canEdit && (
                         <button onClick={() => onEdit(d.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-primary hover:border-primary transition-all" title="Éditer">
                            <Edit2 className="w-4 h-4" />
                         </button>
                       )}
                       {/* BOUTON VALIDER : Visible si permission VALIDATE */}
                       {canValidate && (
                         <button onClick={() => handleValidateWrapper(d.id)} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-all" title="Valider">
                            <CheckCircle2 className="w-4 h-4" />
                         </button>
                       )}
                     </>
                  ) : (
                     <button onClick={() => onFillOfficial(d.id)} className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-200 flex items-center gap-2">
                        <Download className="w-3 h-3" /> PDF
                     </button>
                  )}
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                  </button>
               </div>
            </td>
         </tr>
      );
  }

  // --- RENDER KANBAN CARD ---
  const renderKanbanCard = (d: Declaration) => {
      const risk = analyzeRisk(d);
      const locked = isLocked(d.status);

      return (
          <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3" onClick={() => handleOpenDrawer(d)}>
              <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">{d.period}</span>
                  <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></button>
              </div>
              
              <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">{d.type}</h4>
                  <p className="text-xs font-medium text-slate-500 truncate mt-1">{d.taxpayerName}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-sm font-black text-slate-900">{d.amount.toLocaleString()} DA</span>
                  {risk ? (
                     <div className={`p-1.5 rounded-lg ${risk.bg} ${risk.color}`} title={risk.label}>
                        <risk.icon className="w-4 h-4" />
                     </div>
                  ) : locked ? (
                     <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400">
                        <Lock className="w-4 h-4" />
                     </div>
                  ) : (
                     <div className="p-1.5 rounded-lg bg-blue-50 text-primary">
                        <Edit2 className="w-4 h-4" />
                     </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-full relative overflow-hidden bg-[#f8fafc]">
      
      {/* --- CONTENU PRINCIPAL --- */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${drawerOpen ? 'pr-[400px]' : ''}`}>
        
        <div className="p-8 space-y-6 pb-40 h-full flex flex-col">
          
          {/* HEADER */}
          <div className="flex justify-between items-end flex-shrink-0">
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cockpit Fiscal</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Supervision et Conformité</p>
            </div>
            {/* BOUTON NOUVELLE DÉCLARATION : RBAC (CREATE) */}
            {currentUser?.permissions.includes('CREATE') && (
                <button onClick={onNew} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-widest">
                    <Plus className="w-4 h-4" /> Nouvelle Déclaration
                </button>
            )}
          </div>

          {/* BARRE DE FILTRES INTELLIGENTE */}
          <div className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center flex-shrink-0">
            {/* ... Filtres existants ... */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                value={filters.search} 
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Rechercher (Ref, Client, Période)..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
                />
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

            <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                <select 
                    value={filters.year} 
                    onChange={e => setFilters({...filters, year: e.target.value})}
                    className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[100px]"
                >
                    <option value="ALL">Année (Toutes)</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                </select>

                <select 
                    value={filters.status} 
                    onChange={e => setFilters({...filters, status: e.target.value})}
                    className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[120px]"
                    disabled={viewMode === 'KANBAN'} 
                >
                    <option value="ALL">Statut (Tous)</option>
                    <option value="BROUILLON">Brouillon</option>
                    <option value="VALIDÉ">Validé</option>
                    <option value="EN RETARD">En Retard</option>
                    <option value="PAYÉE">Payée</option>
                </select>

                {/* VIEW MODE TOGGLE */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                       onClick={() => setViewMode('LIST')}
                       className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                       title="Vue Liste"
                    >
                       <List className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => setViewMode('GROUPED')}
                       className={`p-2 rounded-lg transition-all ${viewMode === 'GROUPED' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                       title="Groupement Intelligent"
                    >
                       <Layers className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => setViewMode('KANBAN')}
                       className={`p-2 rounded-lg transition-all ${viewMode === 'KANBAN' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                       title="Vue Kanban"
                    >
                       <Columns className="w-4 h-4" />
                    </button>
                </div>

                <button 
                    onClick={() => setFilters({ search: '', status: 'ALL', year: 'ALL', regime: 'ALL' })}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Réinitialiser"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 min-h-0 relative">
             
             {/* MODE LISTE & GROUPÉ (TABLEAU) */}
             {(viewMode === 'LIST' || viewMode === 'GROUPED') && (
                 <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden relative h-full flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-12 px-6 py-4 bg-slate-50">
                                    <input type="checkbox" onChange={toggleAll} checked={selectedIds.size > 0 && selectedIds.size === displayedDeclarationIds.length} className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50">Référence & Client</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50">Cycle de Vie</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right bg-slate-50">Montant & Variance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right bg-slate-50">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {/* MODE LISTE PLATE */}
                                {viewMode === 'LIST' && (paginatedData.items as Declaration[]).map(d => renderDeclarationRow(d))}

                                {/* MODE GROUPEMENT INTELLIGENT */}
                                {viewMode === 'GROUPED' && (paginatedData.items as { id: string, name: string, total: number, count: number, items: Declaration[] }[]).map(group => (
                                    <React.Fragment key={group.id}>
                                        {/* En-tête de Groupe */}
                                        <tr className="bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-100" onClick={() => toggleGroupExpansion(group.id)}>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={group.items.every(d => selectedIds.has(d.id))}
                                                    onChange={() => toggleGroupSelection(group.items)}
                                                    className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" 
                                                />
                                            </td>
                                            <td className="px-6 py-4" colSpan={2}>
                                                <div className="flex items-center gap-3">
                                                    {expandedGroups.has(group.id) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{group.name}</span>
                                                    <span className="bg-white px-2 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">{group.count} Déclarations</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900">{group.total.toLocaleString()} DA</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Groupe</span>
                                            </td>
                                        </tr>
                                        {/* Lignes du groupe */}
                                        {expandedGroups.has(group.id) && group.items.map(d => renderDeclarationRow(d, true))}
                                    </React.Fragment>
                                ))}

                                {paginatedData.items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                                            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Aucune déclaration trouvée</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
             )}

             {/* MODE KANBAN */}
             {viewMode === 'KANBAN' && (
                 <div className="h-full overflow-x-auto custom-scrollbar flex gap-6 pb-2">
                     {KANBAN_COLUMNS.map(col => {
                         const colData = (groupedData as Record<string, { items: Declaration[], total: number }>)[col.id];
                         return (
                             <div key={col.id} className="min-w-[320px] w-[320px] flex flex-col h-full rounded-2xl bg-slate-50 border border-slate-200">
                                 {/* Column Header */}
                                 <div className={`p-4 rounded-t-2xl border-b border-slate-200 ${col.color}`}>
                                     <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{col.label}</span>
                                         <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">
                                             {colData.items.length}
                                         </span>
                                     </div>
                                     <div className={`h-1 w-full rounded-full ${col.accent} opacity-20`}>
                                         <div className={`h-full ${col.accent} rounded-full`} style={{ width: `${Math.min(100, (colData.items.length / 10) * 100)}%` }}></div>
                                     </div>
                                     <div className="mt-2 text-right">
                                         <span className="text-xs font-black text-slate-900">{colData.total.toLocaleString()} DA</span>
                                     </div>
                                 </div>
                                 
                                 {/* Column Body */}
                                 <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                     {colData.items.map(d => renderKanbanCard(d))}
                                     {colData.items.length === 0 && (
                                         <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                                             Aucune déclaration
                                         </div>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}

          </div>

        </div>
      </div>

      {/* ... (Reste du composant: Floating Bar, Drawer ...) */}
      {/* ... Drawer Tab DETAILS : Bouton VALIDER mis à jour avec le Wrapper ... */}
      
      {/* --- FLOATING COMMAND BAR (ACTIONS DE MASSE) --- */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-2 flex items-center gap-2 border border-slate-700/50 pl-4">
                <span className="text-xs font-bold mr-2"><span className="bg-white text-slate-900 px-1.5 rounded text-[10px] mr-1">{selectedIds.size}</span> sélectionné(s)</span>
                <div className="h-6 w-px bg-white/20 mx-1"></div>
                
                {/* ACTIONS DE MASSE (RBAC) */}
                {canValidate && (
                    <button onClick={() => handleBatchAction('VALIDER')} className="px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Valider
                    </button>
                )}
                
                <button onClick={() => handleBatchAction('IMPRIMER')} className="px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                    <Printer className="w-4 h-4 text-blue-400" /> Imprimer
                </button>
                
                {canDelete && (
                    <button onClick={() => handleBatchAction('ARCHIVER')} className="px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                        <Archive className="w-4 h-4 text-orange-400" /> Archiver
                    </button>
                )}
                
                <div className="h-6 w-px bg-white/20 mx-1"></div>
                
                <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}

      {/* --- DRAWER D'AUDIT & DÉTAIL (Overlay) --- */}
      <div 
         className={`fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
         {activeDeclaration ? (
            <>
               {/* ... Drawer Header ... */}
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="inline-block px-2 py-1 rounded bg-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">{activeDeclaration.type}</span>
                        <h2 className="text-xl font-black text-slate-900">{activeDeclaration.id}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">{activeDeclaration.taxpayerName}</p>
                     </div>
                     <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  {/* ... Tabs Controller ... */}
                  <div className="flex p-1 bg-slate-200 rounded-xl">
                      <button onClick={() => setDrawerTab('DETAILS')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${drawerTab === 'DETAILS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Détails & Audit</button>
                      <button onClick={() => setDrawerTab('CHAT')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${drawerTab === 'CHAT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Discussions</button>
                  </div>
               </div>

               {/* TAB 1: DETAILS & AUDIT */}
               {drawerTab === 'DETAILS' && (
               <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  
                  {/* ... Résumé Financier ... */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Montant Déclaré</p>
                     <p className="text-4xl font-black tracking-tighter">{activeDeclaration.amount.toLocaleString()} <span className="text-sm font-normal text-slate-400">DA</span></p>
                     
                     <div className="mt-6 flex items-center justify-between">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5`}>
                            {isLocked(activeDeclaration.status) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {activeDeclaration.status}
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] text-slate-400 uppercase font-bold">Échéance</p>
                           <p className="text-xs font-bold">20 {activeDeclaration.period}</p>
                        </div>
                     </div>
                  </div>

                  {/* ... Risk Analysis ... */}
                  {(() => {
                      const risk = analyzeRisk(activeDeclaration);
                      if (risk) return (
                          <div className={`p-4 rounded-2xl border flex items-start gap-4 ${risk.bg} ${risk.color.replace('text-', 'border-').replace('600', '200')}`}>
                              <risk.icon className={`w-6 h-6 shrink-0 ${risk.color}`} />
                              <div>
                                  <p className={`text-sm font-black uppercase ${risk.color}`}>{risk.level} : {risk.label}</p>
                                  <p className="text-xs mt-1 text-slate-600 leading-snug">Veuillez vérifier les pièces justificatives avant validation définitive.</p>
                              </div>
                          </div>
                      );
                  })()}

                  {/* ... Audit Log ... */}
                  <div>
                     <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4" /> Historique des actions</h3>
                     <div className="space-y-6 relative border-l-2 border-slate-100 ml-2 pl-6 pb-2">
                        {getAuditLogs(activeDeclaration).map((log, i) => (
                           <div key={i} className="relative group">
                              <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm bg-slate-200 group-hover:bg-primary transition-colors`}></div>
                              <div className="flex flex-col gap-1">
                                 <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold ${log.color}`}>{log.action}</span>
                                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded">{log.date}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <log.icon className="w-3 h-3" />
                                    <span>Par {log.user}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               )}

               {/* TAB 2: CHAT (Code identique) ... */}
               {drawerTab === 'CHAT' && (
                  <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
                      {/* ... Chat UI ... */}
                       <div className="p-4 bg-white border-t border-slate-200">
                           <div className="flex gap-2">
                               <input 
                                   type="text" 
                                   value={newComment}
                                   onChange={(e) => setNewComment(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                   placeholder="Écrire une note ou une question..." 
                                   className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                   disabled={!currentUser}
                               />
                               <button onClick={handleAddComment} disabled={!newComment.trim() || !currentUser} className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><Send className="w-5 h-5" /></button>
                           </div>
                           <p className="text-[10px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Espace sécurisé et audité</p>
                       </div>
                  </div>
               )}

               {/* Footer Actions Contextuelles */}
               {drawerTab === 'DETAILS' && (
               <div className="p-6 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                  {isLocked(activeDeclaration.status) ? (
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onFillOfficial(activeDeclaration.id)} className="py-4 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 hover:border-slate-300 transition-all flex justify-center items-center gap-2 text-slate-700 shadow-sm">
                           <Printer className="w-4 h-4" /> Imprimer
                        </button>
                        {currentUser?.permissions.includes('RECTIFY') && (
                            <button className="py-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all flex justify-center items-center gap-2 shadow-sm">
                               <RefreshCw className="w-4 h-4" /> Rectifier
                            </button>
                        )}
                     </div>
                  ) : (
                     <div className="grid grid-cols-2 gap-4">
                        {canDelete && (
                            <button onClick={() => onDelete(activeDeclaration.id)} className="py-4 bg-white border border-slate-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:border-red-100 transition-all shadow-sm">Supprimer</button>
                        )}
                        {canValidate ? (
                            <button onClick={() => handleValidateWrapper(activeDeclaration.id)} className="py-4 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all flex justify-center items-center gap-2">
                               <CheckCircle2 className="w-4 h-4" /> Valider
                            </button>
                        ) : (
                            <div className="py-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex justify-center items-center gap-2 border border-slate-200 cursor-not-allowed">
                                <Lock className="w-3 h-3" /> Validation Requise
                            </div>
                        )}
                     </div>
                  )}
               </div>
               )}
            </>
         ) : null}
      </div>
    </div>
  );
};

export default DeclarationsManagement;