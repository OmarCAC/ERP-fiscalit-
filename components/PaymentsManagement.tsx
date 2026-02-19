
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, CreditCard, FileDown, Eye, ChevronDown, CheckCircle2, 
  AlertTriangle, TrendingUp, ShieldCheck, Coins, History, Download, 
  Printer, QrCode, Building, Plus, Trash2, Edit2, Wallet, X, Save,
  Building2, ArrowRight, Hash, Calendar as CalendarIcon, UserCheck, FileText,
  LayoutDashboard, PieChart as PieChartIcon, UploadCloud, Banknote, AlertCircle, ArrowLeft,
  FileCheck, Landmark, ScrollText, Signature, Users, Clock, RefreshCw, Pencil, Star,
  List, Layers, Columns, ChevronRight, MoreVertical, Scan, Sparkles, Zap, Calculator
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Declaration, BankAccount, Taxpayer } from '../types';
import { useNotification } from '../contexts/NotificationContext'; // IMPORT CONTEXT

interface Props {
  declarations?: Declaration[]; 
  onPay?: (id: string, details: any) => void;
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  taxpayers: Taxpayer[];
}

const PAYABLE_FORMS_LIST = [
  'G50 Mensuel',
  'G50 Trimestriel',
  'Série G n°12 (Prévisionnelle)',
  'Série G n°12 Bis (Définitive)',
  'G50 Ter (Salaires)',
  'G50 Simplifié (Réel Simplifié)',
  'G50 Complet (Réel Normal)',
  'Série G n°11 (Liasse BIC)',
  'Série G n°13 (Liasse BNC)',
  'Série G n°15 (Agricole)',
  'Série G n°17 (Plus-Values Cession)',
  'Série G n°17 Ter (Plus-Values IBS)',
  'Série G n°51 (Foncier)',
  'TVA Mensuelle',
  'Acompte IBS',
  'TAP Annuelle'
];

const PAYMENT_KANBAN_COLUMNS = [
  { id: 'DUE', label: 'À Payer', status: 'À Payer', color: 'bg-blue-50', accent: 'bg-blue-500', icon: Clock },
  { id: 'LATE', label: 'En Retard', status: 'En Retard', color: 'bg-red-50', accent: 'bg-red-500', icon: AlertTriangle },
  { id: 'PAID', label: 'Payé / Clôturé', status: 'Payé', color: 'bg-emerald-50', accent: 'bg-emerald-500', icon: CheckCircle2 }
];

const calculateFiscalPenalty = (amount: number, deadlineStr: string, status: string, simulationDate?: string) => {
  if (status === 'PAYÉE') return { amount: 0, rate: 0, isLate: false, monthsLate: 0 };
  
  const deadline = new Date(deadlineStr.split('/').reverse().join('-'));
  const validDeadline = isNaN(deadline.getTime()) ? new Date(deadlineStr) : deadline;
  
  // Utiliser la date de simulation si fournie, sinon aujourd'hui
  const comparisonDate = simulationDate ? new Date(simulationDate) : new Date();
  
  validDeadline.setHours(0,0,0,0);
  comparisonDate.setHours(0,0,0,0);

  if (comparisonDate <= validDeadline) return { amount: 0, rate: 0, isLate: false, monthsLate: 0 };

  let monthsLate = (comparisonDate.getFullYear() - validDeadline.getFullYear()) * 12;
  monthsLate -= validDeadline.getMonth();
  monthsLate += comparisonDate.getMonth();
  if (comparisonDate.getDate() > validDeadline.getDate()) monthsLate += 1;
  monthsLate = Math.max(1, monthsLate);

  let rate = 0.10;
  if (monthsLate > 1) rate += (monthsLate - 1) * 0.03;
  if (rate > 0.25) rate = 0.25;

  return { amount: amount * rate, rate: rate, isLate: true, monthsLate };
};

const PaymentsManagement: React.FC<Props> = ({ declarations = [], onPay, bankAccounts, setBankAccounts, taxpayers }) => {
  const { dispatch } = useNotification(); // HOOK NOTIF

  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'INITIATE' | 'RECEIPT'>('DASHBOARD');
  
  // NOUVEAUX ETATS POUR LES VUES
  const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED' | 'KANBAN'>('LIST');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [selectedDeclarationId, setSelectedDeclarationId] = useState<string | null>(null);
  
  // FORMULAIRE DE PAIEMENT
  const [paymentMethod, setPaymentMethod] = useState<'VIREMENT' | 'CHEQUE' | 'NUMERAIRE'>('VIREMENT');
  const [paymentForm, setPaymentForm] = useState({ proofNumber: '', proofDate: new Date().toISOString().split('T')[0], depositorName: '', uploadedFile: null as File | null });
  const [penaltyInput, setPenaltyInput] = useState<number>(0);
  const [selectedSourceRib, setSelectedSourceRib] = useState<string>('');

  // ETATS POUR LE SIMULATEUR & OCR
  const [simulatedDate, setSimulatedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // FILTRES DASHBOARD
  const [filters, setFilters] = useState({ search: '', regime: 'ALL', status: 'ALL', taxpayer: 'ALL' });

  // DONNÉES
  const rawList = useMemo(() => declarations.length > 0 ? declarations : [], [declarations]);
  const uniqueTaxpayers = useMemo(() => Array.from(new Set(rawList.map(d => d.taxpayerName))).filter(Boolean).sort(), [rawList]);

  const paymentRows = useMemo(() => {
    return rawList.map(d => {
       const penaltyAssessment = calculateFiscalPenalty(d.amount, d.submissionDate, d.status);
       return { ...d, statusLabel: d.status === 'PAYÉE' ? 'Payé' : penaltyAssessment.isLate ? 'En Retard' : 'À Payer', isLate: penaltyAssessment.isLate, penaltyAmount: penaltyAssessment.amount, penaltyRate: penaltyAssessment.rate, monthsLate: penaltyAssessment.monthsLate, totalDue: d.amount + penaltyAssessment.amount };
    }).filter(d => {
      if (d.status === 'BROUILLON') return false;
      const s = filters.search.toLowerCase();
      // En mode Kanban, on ignore le filtre de statut pour afficher toutes les colonnes
      const matchStatus = viewMode === 'KANBAN' ? true : (filters.status === 'ALL' || d.statusLabel === filters.status);
      return (d.id.toLowerCase().includes(s) || d.type.toLowerCase().includes(s)) && matchStatus && (filters.taxpayer === 'ALL' || d.taxpayerName === filters.taxpayer);
    });
  }, [rawList, filters, viewMode]);

  // LOGIQUE DE GROUPEMENT
  const groupedPayments = useMemo(() => {
    if (viewMode === 'LIST') return null;
    
    // Pour Kanban
    if (viewMode === 'KANBAN') {
        const columns: Record<string, { items: typeof paymentRows, total: number }> = {};
        PAYMENT_KANBAN_COLUMNS.forEach(col => {
            columns[col.id] = { items: [], total: 0 };
        });
        
        paymentRows.forEach(row => {
            const col = PAYMENT_KANBAN_COLUMNS.find(c => c.status === row.statusLabel);
            if (col) {
                columns[col.id].items.push(row);
                columns[col.id].total += row.totalDue;
            }
        });
        return columns;
    }

    // Pour Grouped List
    const groups: Record<string, { id: string, name: string, total: number, count: number, items: typeof paymentRows }> = {};
    paymentRows.forEach(row => {
        const key = row.taxpayerName || 'Inconnu';
        if (!groups[key]) {
            groups[key] = { id: key, name: key, total: 0, count: 0, items: [] };
        }
        groups[key].items.push(row);
        groups[key].total += row.totalDue;
        groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [paymentRows, viewMode]);

  // STATISTIQUES
  const stats = useMemo(() => {
     const totalPaid = paymentRows.filter(d => d.status === 'PAYÉE').reduce((acc, curr) => acc + curr.amount, 0);
     const totalDue = paymentRows.filter(d => d.status !== 'PAYÉE').reduce((acc, curr) => acc + curr.totalDue, 0);
     return { totalPaid, totalDue };
  }, [paymentRows]);

  const toggleGroupExpansion = (groupKey: string) => {
     const newSet = new Set(expandedGroups);
     if (newSet.has(groupKey)) newSet.delete(groupKey);
     else newSet.add(groupKey);
     setExpandedGroups(newSet);
  };

  // --- HANDLERS ACTIONS ---

  const handleInitiate = (id: string) => {
    setSelectedDeclarationId(id);
    setScanSuccess(false);
    setSimulatedDate(new Date().toISOString().split('T')[0]); // Reset date simulation

    const decl = paymentRows.find(p => p.id === id);
    if (decl) {
        setPenaltyInput(decl.penaltyAmount);
        // Pré-sélectionner le premier compte du contribuable concerné
        const taxpayer = taxpayers.find(t => t.dynamicData['1'] === decl.taxpayerName);
        if (taxpayer) {
            // Filtrer les comptes de ce contribuable depuis la liste globale
            const taxpayerAccounts = bankAccounts.filter(a => a.taxpayerId === taxpayer.id);
            if (taxpayerAccounts.length > 0) {
                // Priorité au compte par défaut
                const defaultAcc = taxpayerAccounts.find(a => a.isDefault);
                setSelectedSourceRib(defaultAcc ? defaultAcc.id : taxpayerAccounts[0].id);
            } else {
                setSelectedSourceRib('');
            }
        }
    }
    setCurrentView('INITIATE');
  };

  const handleSimulateDateChange = (date: string) => {
      setSimulatedDate(date);
      setPaymentForm(prev => ({ ...prev, proofDate: date })); // Sync proof date
      if (selectedDecl) {
          const sim = calculateFiscalPenalty(selectedDecl.amount, selectedDecl.submissionDate, selectedDecl.status, date);
          setPenaltyInput(sim.amount);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsScanning(true);
          setScanSuccess(false);
          // Simulation OCR
          setTimeout(() => {
              setIsScanning(false);
              setScanSuccess(true);
              setPaymentForm(prev => ({
                  ...prev,
                  proofNumber: `REF-${Math.floor(Math.random() * 100000)}`, // Mock extraction
                  proofDate: new Date().toISOString().split('T')[0],
                  uploadedFile: file
              }));
          }, 2000);
      }
  };

  const handleConfirmPayment = () => {
    if (onPay && selectedDeclarationId) {
        onPay(selectedDeclarationId, {
            method: paymentMethod,
            proofNumber: paymentForm.proofNumber,
            date: paymentForm.proofDate,
            penalty: penaltyInput,
            sourceRib: selectedSourceRib,
            file: paymentForm.uploadedFile
        });

        // NOTIFICATION DE PAIEMENT
        const decl = paymentRows.find(p => p.id === selectedDeclarationId);
        dispatch({
            type: 'PAYMENT',
            title: 'Paiement Confirmé',
            message: `Le paiement de ${decl?.amount.toLocaleString()} DA pour ${selectedDeclarationId} a été enregistré.`,
            targetRoles: ['COMPTABLE', 'CLIENT']
        });
    }
    setCurrentView('RECEIPT');
  };

  const selectedDecl = paymentRows.find(p => p.id === selectedDeclarationId);
  
  const simulationResults = useMemo(() => {
      if (!selectedDecl) return { amount: 0, rate: 0, isLate: false, monthsLate: 0 };
      return calculateFiscalPenalty(selectedDecl.amount, selectedDecl.submissionDate, selectedDecl.status, simulatedDate);
  }, [selectedDecl, simulatedDate]);
  
  // Filtrer les comptes pour le contribuable sélectionné lors du paiement
  const availableAccountsForPayment = useMemo(() => {
      if (!selectedDecl) return [];
      const taxpayer = taxpayers.find(t => t.dynamicData['1'] === selectedDecl.taxpayerName);
      if (!taxpayer) return [];
      return bankAccounts.filter(a => a.taxpayerId === taxpayer.id);
  }, [selectedDecl, bankAccounts, taxpayers]);

  // HELPER RENDU LIGNE (Pour LIST et GROUPED)
  const renderPaymentRow = (row: any, isNested: boolean = false) => (
       <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${isNested ? 'bg-slate-50/30' : ''}`}>
           <td className={`px-6 py-4 font-mono text-slate-500 ${isNested ? 'pl-10' : ''}`}>
               <div className="flex items-center gap-4">
                  {isNested && <div className="w-4 border-l-2 border-b-2 border-slate-200 h-4 -mt-4 rounded-bl-lg"></div>}
                  {row.id}
               </div>
           </td>
           <td className="px-6 py-4">
              <span className="font-bold text-slate-800 block">{row.taxpayerName}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{row.type}</span>
           </td>
           <td className="px-6 py-4 text-slate-600 text-xs font-medium">{row.period}</td>
           <td className="px-6 py-4 text-right">
              <span className="font-black text-slate-900 block">{row.totalDue.toLocaleString()} DA</span>
              {row.penaltyAmount > 0 && <span className="text-[9px] text-red-500 font-bold">+ {row.penaltyAmount.toLocaleString()} pénalités</span>}
           </td>
           <td className="px-6 py-4 text-center">
               <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${row.statusLabel === 'Payé' ? 'bg-green-100 text-green-700' : row.statusLabel === 'En Retard' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                   {row.statusLabel}
               </span>
           </td>
           <td className="px-6 py-4 text-right">
               {row.statusLabel !== 'Payé' ? (
                   <button onClick={() => handleInitiate(row.id)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-slate-900/10">
                       Payer
                   </button>
               ) : (
                   <button className="p-2 text-slate-400 hover:text-slate-600">
                       <FileCheck className="w-4 h-4" />
                   </button>
               )}
           </td>
       </tr>
  );

  const renderKanbanCard = (row: any) => (
      <div key={row.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3">
          <div className="flex justify-between items-start">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">{row.period}</span>
              <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></button>
          </div>
          
          <div>
              <h4 className="text-sm font-black text-slate-900 leading-tight">{row.type}</h4>
              <p className="text-xs font-medium text-slate-500 truncate mt-1">{row.taxpayerName}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <div className="flex flex-col">
                 <span className="text-sm font-black text-slate-900">{row.totalDue.toLocaleString()} DA</span>
                 {row.penaltyAmount > 0 && <span className="text-[9px] text-red-500 font-bold">+ Pénalités</span>}
              </div>
              
              {row.statusLabel !== 'Payé' ? (
                  <button onClick={() => handleInitiate(row.id)} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-primary transition-all">
                      <CreditCard className="w-4 h-4" />
                  </button>
              ) : (
                  <div className="p-1.5 rounded-lg bg-green-50 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                  </div>
              )}
          </div>
      </div>
  );

  // --- VUE 1 : DASHBOARD PAIEMENTS ---
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
       {/* ... (Code Dashboard inchangé : KPIs, Filtres, Tableau/Kanban) ... */}
       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
           <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl"></div>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Décaissé</p>
               <div className="flex items-center gap-4">
                   <span className="text-4xl font-black tracking-tighter">{stats.totalPaid.toLocaleString()}</span>
                   <span className="text-sm font-bold text-slate-500">DA</span>
               </div>
               <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-400">
                   <TrendingUp className="w-4 h-4" /> +12% ce mois
               </div>
           </div>
           
           <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Reste à Payer (Engagé)</p>
               <div className="flex items-center gap-4">
                   <span className="text-4xl font-black tracking-tighter text-slate-900">{stats.totalDue.toLocaleString()}</span>
                   <span className="text-sm font-bold text-slate-500">DA</span>
               </div>
               {stats.totalDue > 0 && (
                   <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg w-fit">
                       <Clock className="w-3 h-3" /> Échéances proches
                   </div>
               )}
           </div>
       </div>

       {/* FILTRES & LISTE */}
       <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-6 flex-1 flex flex-col min-h-0">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Echéancier des Paiements</h3>
               
               <div className="flex gap-2 items-center">
                   <div className="relative group">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                          type="text" 
                          placeholder="Rechercher..." 
                          value={filters.search}
                          onChange={e => setFilters({...filters, search: e.target.value})}
                          className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold w-48 focus:ring-2 focus:ring-primary/20"
                       />
                   </div>
                   
                   <select 
                      value={filters.status}
                      onChange={e => setFilters({...filters, status: e.target.value})}
                      className="pl-4 pr-8 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                      disabled={viewMode === 'KANBAN'}
                   >
                      <option value="ALL">Tous statuts</option>
                      <option value="À Payer">À Payer</option>
                      <option value="En Retard">En Retard</option>
                      <option value="Payé">Payé</option>
                   </select>

                   {/* VIEW MODE TOGGLES */}
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
               </div>
           </div>

           <div className="flex-1 overflow-auto custom-scrollbar relative">
               
               {/* MODE LISTE & GROUPÉ */}
               {(viewMode === 'LIST' || viewMode === 'GROUPED') && (
               <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0 z-10 shadow-sm">
                       <tr>
                           <th className="px-6 py-4 rounded-tl-xl bg-slate-50">Référence</th>
                           <th className="px-6 py-4 bg-slate-50">Contribuable & Type</th>
                           <th className="px-6 py-4 bg-slate-50">Période</th>
                           <th className="px-6 py-4 text-right bg-slate-50">Montant dû</th>
                           <th className="px-6 py-4 text-center bg-slate-50">Statut</th>
                           <th className="px-6 py-4 text-right rounded-tr-xl bg-slate-50">Action</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-medium text-xs">
                       {viewMode === 'LIST' && paymentRows.map(row => renderPaymentRow(row))}
                       
                       {viewMode === 'GROUPED' && (groupedPayments as any[]).map(group => (
                           <React.Fragment key={group.id}>
                                <tr className="bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-100" onClick={() => toggleGroupExpansion(group.id)}>
                                    <td className="px-6 py-4" colSpan={3}>
                                        <div className="flex items-center gap-3">
                                            {expandedGroups.has(group.id) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{group.name}</span>
                                            <span className="bg-white px-2 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">{group.count} Paiements</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-slate-900">{group.total.toLocaleString()} DA</span>
                                    </td>
                                    <td className="px-6 py-4 text-center" colSpan={2}>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Groupe</span>
                                    </td>
                                </tr>
                                {expandedGroups.has(group.id) && group.items.map((row: any) => renderPaymentRow(row, true))}
                           </React.Fragment>
                       ))}

                       {paymentRows.length === 0 && (
                           <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Aucune déclaration à afficher.</td></tr>
                       )}
                   </tbody>
               </table>
               )}

               {/* MODE KANBAN */}
               {viewMode === 'KANBAN' && (
                 <div className="h-full overflow-x-auto custom-scrollbar flex gap-6 pb-2">
                     {PAYMENT_KANBAN_COLUMNS.map(col => {
                         const colData = (groupedPayments as any)[col.id];
                         return (
                             <div key={col.id} className="min-w-[320px] w-[320px] flex flex-col h-full rounded-2xl bg-slate-50 border border-slate-200">
                                 {/* Column Header */}
                                 <div className={`p-4 rounded-t-2xl border-b border-slate-200 ${col.color}`}>
                                     <div className="flex justify-between items-center mb-1">
                                         <div className="flex items-center gap-2">
                                             <col.icon className="w-4 h-4 opacity-60" />
                                             <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{col.label}</span>
                                         </div>
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
                                     {colData.items.map((row: any) => renderKanbanCard(row))}
                                     {colData.items.length === 0 && (
                                         <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                                             Aucun paiement
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
  );

  // --- VUE 2 : INITIALISATION PAIEMENT (AVEC AMÉLIORATIONS) ---
  const renderInitiate = () => {
     if (!selectedDecl) return <div>Erreur de chargement</div>;

     return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
            <button onClick={() => setCurrentView('DASHBOARD')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4">
                <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* COLONNE GAUCHE : Saisie & OCR */}
               <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                   <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                       <div>
                           <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Détails Paiement</h2>
                           <p className="text-xs font-medium text-slate-500">{selectedDecl.taxpayerName} • {selectedDecl.period}</p>
                       </div>
                   </div>

                   <div className="p-8 space-y-8">
                       
                       {/* COFFRE-FORT & OCR */}
                       <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center group hover:border-primary/50 transition-all relative overflow-hidden">
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleFileUpload} accept="image/*,.pdf" />
                          
                          {isScanning ? (
                             <div className="py-8 flex flex-col items-center justify-center space-y-3">
                                 <div className="relative">
                                    <Scan className="w-10 h-10 text-primary animate-pulse" />
                                    <div className="absolute -inset-2 border-2 border-primary/30 rounded-lg animate-ping"></div>
                                 </div>
                                 <p className="text-xs font-bold text-primary animate-pulse">Analyse I.A. en cours...</p>
                             </div>
                          ) : scanSuccess ? (
                             <div className="py-4 flex flex-col items-center justify-center space-y-2 animate-in zoom-in-95">
                                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                     <CheckCircle2 className="w-6 h-6 text-green-600" />
                                 </div>
                                 <p className="text-xs font-bold text-green-700">Justificatif analysé avec succès !</p>
                                 <p className="text-[10px] text-slate-400">Données extraites automatiquement</p>
                             </div>
                          ) : (
                             <div className="py-6 space-y-2">
                                 <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-slate-400 group-hover:text-primary transition-colors">
                                     <UploadCloud className="w-6 h-6" />
                                 </div>
                                 <p className="text-sm font-bold text-slate-600 group-hover:text-slate-800">Glissez votre reçu ou cliquez pour scanner</p>
                                 <p className="text-[10px] text-slate-400">OCR Intelligent : Extraction automatique Réf. & Date</p>
                             </div>
                          )}
                       </div>

                       {/* CHAMPS MANUELS (AUTO-REMPLIS) */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                               <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Mode de paiement</label>
                               <div className="flex gap-2">
                                  {['VIREMENT', 'CHEQUE', 'NUMERAIRE'].map(m => (
                                     <button key={m} onClick={() => setPaymentMethod(m as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMethod === m ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                        {m}
                                     </button>
                                  ))}
                               </div>
                           </div>

                           <div className="space-y-4">
                               <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                     Référence Preuve {scanSuccess && <Sparkles className="w-3 h-3 text-amber-500" />}
                                  </label>
                                  <input type="text" value={paymentForm.proofNumber} onChange={e => setPaymentForm({...paymentForm, proofNumber: e.target.value})} className={`w-full px-4 py-3 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all ${scanSuccess ? 'bg-amber-50 text-amber-900 ring-2 ring-amber-200' : 'bg-slate-50'}`} placeholder={paymentMethod === 'CHEQUE' ? "N° Chèque" : "N° Opération"} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Date Opération</label>
                                  <input type="date" value={paymentForm.proofDate} onChange={e => { setPaymentForm({...paymentForm, proofDate: e.target.value}); setSimulatedDate(e.target.value); }} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" />
                               </div>
                           </div>
                       </div>
                       
                       {/* SECTION COMPTE BANCAIRE */}
                       <div className="space-y-4 pt-6 border-t border-slate-100">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-primary" /> Compte de prélèvement
                           </h3>
                           {availableAccountsForPayment.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                 {availableAccountsForPayment.map(acc => (
                                    <div key={acc.id} onClick={() => setSelectedSourceRib(acc.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedSourceRib === acc.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
                                       <div className={`p-2 rounded-xl ${selectedSourceRib === acc.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                          {acc.type === 'POSTAL' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                       </div>
                                       <div className="flex-1">
                                          <div className="flex justify-between">
                                             <p className={`text-xs font-black uppercase ${selectedSourceRib === acc.id ? 'text-primary' : 'text-slate-700'}`}>{acc.bankName}</p>
                                             {acc.isDefault && <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Principal</span>}
                                          </div>
                                          <p className="text-sm font-mono font-bold text-slate-600 tracking-widest">{acc.rib}</p>
                                       </div>
                                       {selectedSourceRib === acc.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center text-xs text-red-600 font-bold">Aucun compte bancaire configuré.</div>
                           )}
                       </div>
                   </div>
               </div>

               {/* COLONNE DROITE : SIMULATEUR & TOTAL */}
               <div className="lg:col-span-4 space-y-6">
                   
                   {/* SIMULATEUR DE PÉNALITÉS */}
                   <div className="bg-white rounded-[32px] border border-slate-200 shadow-lg p-6 space-y-6">
                       <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Calculator className="w-5 h-5" /></div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Simulateur de Pénalités</h3>
                       </div>

                       <div className="space-y-4">
                           <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400">Date de paiement simulée</label>
                               <input type="date" value={simulatedDate} onChange={(e) => handleSimulateDateChange(e.target.value)} className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-200" />
                           </div>

                           {simulationResults.isLate ? (
                               <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-3 animate-in slide-in-from-top-2">
                                   <div className="flex justify-between items-center">
                                       <span className="text-xs font-bold text-red-700 uppercase">Retard Détecté</span>
                                       <span className="bg-white text-red-600 text-[10px] font-black px-2 py-1 rounded border border-red-100">{simulationResults.monthsLate} mois</span>
                                   </div>
                                   <div className="h-px bg-red-200 w-full"></div>
                                   <div className="flex justify-between items-center">
                                       <span className="text-xs font-medium text-red-600">Majoration ({simulationResults.rate * 100}%)</span>
                                       <span className="text-sm font-black text-red-700">+{simulationResults.amount.toLocaleString()} DA</span>
                                   </div>
                               </div>
                           ) : (
                               <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                                   <CheckCircle2 className="w-5 h-5 text-green-600" />
                                   <p className="text-xs font-bold text-green-700">Aucune pénalité applicable à cette date.</p>
                               </div>
                           )}
                       </div>
                   </div>

                   {/* RÉCAPITULATIF TOTAL */}
                   <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                       <div className="relative z-10 space-y-6">
                           <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant Principal</p>
                               <p className="text-lg font-bold">{selectedDecl.amount.toLocaleString()} DA</p>
                           </div>
                           <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pénalités (Simulées)</p>
                               <p className={`text-lg font-bold ${simulationResults.amount > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                                   {simulationResults.amount > 0 ? `+ ${simulationResults.amount.toLocaleString()} DA` : '-'}
                               </p>
                           </div>
                           <div className="pt-6 border-t border-white/10">
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total à payer</p>
                               <p className="text-4xl font-black tracking-tighter">{(selectedDecl.amount + simulationResults.amount).toLocaleString()} <span className="text-sm text-slate-500">DA</span></p>
                           </div>
                           
                           <button 
                               onClick={handleConfirmPayment}
                               disabled={!selectedSourceRib && paymentMethod !== 'NUMERAIRE'}
                               className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                           >
                               Confirmer <ArrowRight className="w-4 h-4" />
                           </button>
                       </div>
                   </div>

               </div>
            </div>
        </div>
     );
  };

  // --- VUE 3 : REÇU ---
  const renderReceipt = () => (
     <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-xl shadow-green-100">
           <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Paiement Enregistré !</h2>
           <p className="text-slate-500 font-medium">La déclaration a été mise à jour. Vous pouvez télécharger la quittance.</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-left space-y-6">
           <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase text-slate-400">Montant Payé</span>
              <span className="text-xl font-black text-slate-900">{(selectedDecl ? selectedDecl.amount + penaltyInput : 0).toLocaleString()} DA</span>
           </div>
           <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase text-slate-400">Référence</span>
              <span className="text-sm font-bold text-slate-700">{paymentForm.proofNumber || 'N/A'}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-400">Date</span>
              <span className="text-sm font-bold text-slate-700">{paymentForm.proofDate}</span>
           </div>
        </div>

        <div className="flex justify-center gap-4">
           <button onClick={() => setCurrentView('DASHBOARD')} className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Retour</button>
           <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg flex items-center gap-2">
              <Download className="w-4 h-4" /> Télécharger Quittance
           </button>
        </div>
     </div>
  );

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col p-8 md:p-12 pb-32">
       {/* MENU PRINCIPAL */}
       <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          {currentView === 'DASHBOARD' && renderDashboard()}
          {currentView === 'INITIATE' && renderInitiate()}
          {currentView === 'RECEIPT' && renderReceipt()}
       </div>
    </div>
  );
};

export default PaymentsManagement;