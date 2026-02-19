
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  User, 
  RefreshCw, 
  Download, 
  ShieldCheck,
  ChevronDown,
  Building2,
  CalendarDays,
  ArrowRight,
  Calculator,
  Coins,
  Lock,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Taxpayer, Declaration } from '../types';

interface Props {
  taxpayer: Taxpayer | null;
  initialData?: Declaration | null; // NOUVEAU : Données existantes
  onBack: () => void;
  onSubmit: (declaration: Declaration) => void;
}

const G50TerForm: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedTrim, setSelectedTrim] = useState<number | null>(null);
  
  // État pour les données saisies
  const [inputData, setInputData] = useState({
    imposable: '',
    irg: ''
  });

  // État pour la pénalité calculée
  const [penalty, setPenalty] = useState({ isLate: false, amount: 0, rate: 0, months: 0 });
  
  // Données initiales des trimestres
  const [trimesters, setTrimesters] = useState([
    { id: 1, label: '1er Trimestre', months: 'Janvier, Février, Mars', imposable: 0, irg: 0, deadline: '2024-04-20', status: 'Normale' },
    { id: 2, label: '2ème Trimestre', months: 'Avril, Mai, Juin', imposable: 0, irg: 0, deadline: '2024-07-20', status: 'Normale' },
    { id: 3, label: '3ème Trimestre', months: 'Juillet, Août, Septembre', imposable: 0, irg: 0, deadline: '2024-10-20', status: 'Normale' },
    { id: 4, label: '4ème Trimestre', months: 'Octobre, Novembre, Décembre', imposable: 0, irg: 0, deadline: '2025-01-20', status: 'Exonéré' },
  ]);

  // CHARGEMENT DES DONNÉES INITIALES (POUR ÉDITION/VISUALISATION)
  useEffect(() => {
    if (initialData) {
      // 1. Extraire le trimestre de la période "Trimestre X 2024"
      const trimMatch = initialData.period.match(/Trimestre (\d)/);
      if (trimMatch) {
        const trimId = parseInt(trimMatch[1]);
        setSelectedTrim(trimId);
        
        // Simuler la récupération des montants (dans une vraie app, amount serait détaillé)
        // Ici on assume que amount = IRG, et on estime l'imposable
        setInputData({
          imposable: (initialData.amount * 10).toString(), // Simulation inverse
          irg: initialData.amount.toString()
        });
      }
      // Si validé ou plus, on passe direct en mode officiel
      if (initialData.status !== 'BROUILLON') {
         setViewMode('OFFICIAL');
      }
    }
  }, [initialData]);

  // SYSTÈME DE CALCUL DE PÉNALITÉ
  useEffect(() => {
    if (selectedTrim && inputData.irg) {
      const trim = trimesters.find(t => t.id === selectedTrim);
      if (trim) {
        const deadline = new Date(trim.deadline);
        const today = new Date();
        const amount = parseFloat(inputData.irg) || 0;

        if (today > deadline && amount > 0) {
          // Calcul retard
          let monthsLate = (today.getFullYear() - deadline.getFullYear()) * 12;
          monthsLate -= deadline.getMonth();
          monthsLate += today.getMonth();
          if (today.getDate() > deadline.getDate()) monthsLate += 1;
          monthsLate = Math.max(1, monthsLate);

          // Calcul taux (10% + 3% par mois supp, max 25%)
          let rate = 0.10;
          if (monthsLate > 1) rate += (monthsLate - 1) * 0.03;
          if (rate > 0.25) rate = 0.25;

          setPenalty({
            isLate: true,
            amount: amount * rate,
            rate: rate,
            months: monthsLate
          });
        } else {
          setPenalty({ isLate: false, amount: 0, rate: 0, months: 0 });
        }
      }
    }
  }, [selectedTrim, inputData.irg, trimesters]);

  // Met à jour les données du trimestre sélectionné avant de passer à la vue officielle
  const handleGenerate = () => {
    if (selectedTrim) {
      const updatedTrimesters = trimesters.map(t => {
        if (t.id === selectedTrim) {
          return {
            ...t,
            imposable: parseFloat(inputData.imposable) || 0,
            irg: parseFloat(inputData.irg) || 0
          };
        }
        return t;
      });
      setTrimesters(updatedTrimesters);
      setViewMode('OFFICIAL');
    }
  };

  const handleSelectTrim = (id: number) => {
    setSelectedTrim(id);
    const existing = trimesters.find(t => t.id === id);
    // Si pas de données initiales chargées, on utilise les données locales du state trimesters
    if (!initialData) {
      setInputData({
        imposable: existing?.imposable ? existing.imposable.toString() : '',
        irg: existing?.irg ? existing.irg.toString() : ''
      });
    }
  };

  const activeTrimester = trimesters.find(t => t.id === selectedTrim);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    const finalAmount = (parseFloat(inputData.irg) || 0) + penalty.amount;
    const newDec: Declaration = {
      id: initialData?.id || `G50-${Math.floor(Math.random() * 10000)}`, // Garder l'ID si édition
      type: 'G50 Ter (Salaires)',
      period: selectedTrim ? `Trimestre ${selectedTrim} ${selectedYear}` : `Exercice ${selectedYear}`,
      regime: 'IFU',
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status === 'VALIDÉ' && penalty.isLate ? 'EN RETARD' : status, // Auto-statut En Retard
      amount: finalAmount,
      taxpayerName: taxpayer?.dynamicData['1'] // Correction : Ajout du nom du contribuable
    };
    onSubmit(newDec);
  };

  // --- VUE 1 : ASSISTANT DE CRÉATION (WIZARD) ---
  if (viewMode === 'WIZARD') {
    return (
      <div className="min-h-full bg-[#f6f7f8] p-6 md:p-12 pb-32">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* En-tête */}
          <div className="text-center space-y-4 mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
               {initialData ? `Édition Déclaration ${initialData.id}` : 'Nouvelle Déclaration'}
            </h1>
            <p className="text-slate-500 text-lg">Configurez les paramètres initiaux pour générer le formulaire G50 Ter (IRG Salaires).</p>
          </div>

          {/* Carte Paramètres */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Paramètres de déclaration</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Série G 50 Ter</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500">Étape {selectedTrim ? '3' : '2'} sur 3</span>
            </div>

            <div className="p-10 space-y-10">
              
              {/* 1. Sélection Contribuable (ReadOnly ici car déjà sélectionné) */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Sélectionner le Contribuable</h3>
                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6 flex items-start justify-between group hover:border-primary/30 transition-all">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-black text-primary border-2 border-primary shadow-sm">
                         {taxpayer?.dynamicData['1']?.substring(0, 2).toUpperCase() || 'NA'}
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-lg font-black text-slate-900 uppercase">{taxpayer?.dynamicData['1']}</h4>
                         <p className="text-xs font-mono text-slate-500 tracking-wider">NIF: {taxpayer?.dynamicData['2']} • ARTICLE: {taxpayer?.dynamicData['article_imp']}</p>
                         <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                            <Building2 className="w-3 h-3" /> {taxpayer?.dynamicData['7']}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                         <CheckCircle2 className="w-3 h-3" /> Régime IFU
                      </span>
                   </div>
                </div>
              </div>

              {/* 2. Période */}
              <div className="space-y-6">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Période d'imposition</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-2">
                       <label className="text-xs font-bold text-slate-500">Année</label>
                       <div className="relative">
                          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full h-14 pl-4 pr-10 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20">
                             <option value="2024">2024</option>
                             <option value="2023">2023</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                       <label className="text-xs font-bold text-slate-500">Trimestre</label>
                       <div className="grid grid-cols-4 gap-4">
                          {trimesters.map((t) => (
                             <button 
                                key={t.id}
                                onClick={() => handleSelectTrim(t.id)}
                                className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedTrim === t.id ? 'border-primary bg-primary/5 text-primary shadow-lg ring-2 ring-primary/20' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                             >
                                <span className="text-2xl font-black">T{t.id}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest">{t.months.split(',')[0]}...</span>
                                {selectedTrim === t.id && <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center absolute -top-2 -right-2 shadow-md"><CheckCircle2 className="w-3 h-3" /></div>}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* 3. MASQUE DE SAISIE (Conditionnel) */}
              {selectedTrim && (
                 <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-primary" /> 3. Détails du Versement (T{selectedTrim})
                       </h3>
                       <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Importer du module Paie
                       </button>
                    </div>

                    <div className="bg-slate-50 rounded-[24px] border border-slate-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">
                       
                       {/* Champ Montant Imposable */}
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Masse Salariale Imposable</label>
                          <div className="relative group">
                             <input 
                                type="number" 
                                value={inputData.imposable}
                                onChange={(e) => setInputData({...inputData, imposable: e.target.value})}
                                placeholder="0.00"
                                className="w-full h-16 pl-6 pr-16 bg-white border-2 border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                             />
                             <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 group-focus-within:text-primary">DZD</div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium ml-2">Total des salaires bruts imposables du trimestre.</p>
                       </div>

                       {/* Champ Montant IRG */}
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Montant IRG à Payer</label>
                          <div className="relative group">
                             <input 
                                type="number" 
                                value={inputData.irg}
                                onChange={(e) => setInputData({...inputData, irg: e.target.value})}
                                placeholder="0.00"
                                className="w-full h-16 pl-6 pr-16 bg-white border-2 border-slate-200 rounded-2xl text-xl font-black text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                             />
                             <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 group-focus-within:text-primary">DZD</div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium ml-2">Montant retenu à la source selon le barème.</p>
                       </div>

                    </div>

                    {/* ALERTE PÉNALITÉ (SI RETARD) */}
                    {penalty.isLate && (
                       <div className="bg-red-50 border border-red-100 rounded-[20px] p-6 flex items-start gap-4 animate-in slide-in-from-left-2">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                             <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="space-y-2 flex-1">
                             <h4 className="text-sm font-black text-red-900 uppercase">Pénalités de retard applicables</h4>
                             <p className="text-xs text-red-700 font-medium">
                                La date limite pour le T{selectedTrim} était le <strong>{new Date(trimesters.find(t=>t.id===selectedTrim)?.deadline || '').toLocaleDateString('fr-FR')}</strong>. 
                                Un retard de <strong>{penalty.months} mois</strong> a été détecté.
                             </p>
                             <div className="flex gap-4 pt-2">
                                <div className="px-4 py-2 bg-white rounded-lg border border-red-100 text-xs font-bold text-red-800">
                                   Taux : {(penalty.rate * 100).toFixed(0)}%
                                </div>
                                <div className="px-4 py-2 bg-white rounded-lg border border-red-100 text-xs font-bold text-red-800">
                                   Montant : {penalty.amount.toLocaleString()} DA
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Résumé rapide */}
                    {(inputData.imposable || inputData.irg) && (
                       <div className="flex items-center gap-4 bg-green-50 border border-green-100 p-4 rounded-xl">
                          <Coins className="w-6 h-6 text-green-600" />
                          <div>
                             <p className="text-xs font-black text-green-800 uppercase">Prêt à valider</p>
                             <p className="text-[10px] font-medium text-green-700">
                                Total à payer : {(parseFloat(inputData.irg || '0') + penalty.amount).toLocaleString()} DA
                                {penalty.isLate && <span className="text-red-500 font-bold ml-1">(dont pénalités)</span>}
                             </p>
                          </div>
                       </div>
                    )}
                 </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
               <button onClick={onBack} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                  Annuler
               </button>
               <div className="flex gap-3">
                  <button onClick={() => handleSave('BROUILLON')} className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                     <Save className="w-4 h-4" /> Sauvegarder Brouillon
                  </button>
                  <button 
                     disabled={!selectedTrim || !inputData.imposable || !inputData.irg}
                     onClick={handleGenerate}
                     className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${(!selectedTrim || !inputData.imposable || !inputData.irg) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white shadow-xl hover:bg-primary/90 hover:scale-105'}`}
                  >
                     Établir la déclaration <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VUE 2 : FORMULAIRE OFFICIEL (A4 PAPER LOOK) ---
  return (
    <div className="min-h-full bg-[#eef2f6] p-4 md:p-8 font-serif print:p-0 print:bg-white">
      
      {/* HEADER ACTIONS (Non imprimable) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-sans font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux paramètres
        </button>
        <div className="flex gap-3">
          <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 font-sans">
            <Save className="w-4 h-4" /> Sauvegarder Brouillon
          </button>
          <button onClick={() => handleSave('VALIDÉ')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 font-sans">
            <CheckCircle2 className="w-4 h-4" /> Valider la Déclaration
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* PAGE A4 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full min-h-[297mm] p-[10mm] relative text-slate-900 box-border">
        
        {/* ... (En-tête et Identification inchangés) ... */}
        {/* EN-TÊTE RÉPUBLIQUE */}
        <div className="text-center mb-6">
           <h1 className="text-sm font-bold font-serif uppercase tracking-widest text-slate-500">République Algérienne Démocratique et Populaire</h1>
           <h2 className="text-xs font-bold font-serif text-slate-400">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
        </div>

        {/* BLOC PRINCIPAL */}
        <div className="border-2 border-slate-900 p-1 flex">
           <div className="w-1/3 p-4 space-y-2 border-r-2 border-slate-900 text-[10px] font-bold">
              <p>MINISTÈRE DES FINANCES</p>
              <p>DIRECTION GÉNÉRALE DES IMPÔTS</p>
              <div className="mt-4 space-y-1">
                 <p>DIRECTION DES IMPÔTS DE WILAYA DE : <span className="font-mono uppercase">{taxpayer?.wilaya || '...................'}</span></p>
                 <p>SERVICE : <span className="font-mono uppercase">GC</span></p>
                 <p>RECETTE : <span className="font-mono uppercase">{taxpayer?.recetteAffectee || '...................'}</span></p>
                 <p>COMMUNE : <span className="font-mono uppercase">{taxpayer?.commune || '...................'}</span></p>
                 <p>ANNÉE : <span className="font-mono text-base">{selectedYear}</span></p>
              </div>
           </div>
           <div className="flex-1 p-4 text-center flex flex-col justify-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-tight">IMPÔT FORFAITAIRE UNIQUE</h1>
              <h2 className="text-lg font-serif font-bold text-slate-800">الضريبة الجزافية الوحيدة</h2>
              <div className="mt-4 bg-blue-50/50 py-3 px-6 border-2 border-blue-100 rounded-lg">
                 <h3 className="text-sm font-black text-blue-900 uppercase">AVIS DE VERSEMENT DE L'IRG SALAIRES</h3>
                 <p className="text-xs font-bold text-blue-800 font-serif">إشعار بالدفع</p>
              </div>
           </div>
           <div className="w-1/3 p-4 text-right space-y-2 border-l-2 border-slate-900 text-[10px] font-bold">
              <p>وزارة المالية</p>
              <p>المديرية العامة للضرائب</p>
              <div className="mt-4 space-y-1">
                 <p>................... : مديرية الضرائب لولاية</p>
                 <p>.................................. : مصلحة</p>
                 <p>.................................. : قباضة</p>
                 <p>.................................. : بلدية</p>
              </div>
           </div>
        </div>

        {/* IDENTIFICATION */}
        <div className="mt-6 border-2 border-slate-900 rounded-lg overflow-hidden">
           <div className="bg-slate-100 border-b-2 border-slate-900 px-4 py-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-xs font-black uppercase">Identification du contribuable</span>
              <span className="ml-auto bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div> Données Synchronisées
              </span>
           </div>
           
           <div className="p-4 grid grid-cols-2 gap-6 text-xs">
              <div className="col-span-1 space-y-4">
                 <div className="space-y-1">
                    <label className="font-bold text-slate-500">Numéro d'Identification Fiscale (NIF)</label>
                    <div className="flex gap-1 items-center bg-slate-50 border border-slate-300 p-2 font-mono text-base font-bold tracking-widest relative">
                       {taxpayer?.dynamicData['2']}
                       <Lock className="w-3 h-3 absolute right-2 text-slate-400" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="font-bold text-slate-500">Nom et Prénom - Raison sociale</label>
                    <div className="bg-slate-50 border border-slate-300 p-2 font-bold uppercase">{taxpayer?.dynamicData['1']}</div>
                 </div>
              </div>
              <div className="col-span-1 space-y-4">
                 <div className="space-y-1">
                    <label className="font-bold text-slate-500">Activité</label>
                    <div className="bg-slate-50 border border-slate-300 p-2 font-bold uppercase">{taxpayer?.dynamicData['7']}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* DÉTAIL DES TRIMESTRES AVEC PÉNALITÉS */}
        <div className="mt-6 border-2 border-slate-900 rounded-lg overflow-hidden">
           <div className="bg-white border-b-2 border-slate-900 px-4 py-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase">Détail des Trimestres</h3>
              <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                 <RefreshCw className="w-3 h-3" /> Vérifier la cohérence avec le module Paie
              </button>
           </div>
           
           <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                 <tr>
                    <th className="px-4 py-3">Trimestre</th>
                    <th className="px-4 py-3 w-40">Montant Imposable</th>
                    <th className="px-4 py-3 w-40 text-right">Montant IRG</th>
                    <th className="px-4 py-3 w-32 text-right">Pénalités</th>
                    <th className="px-4 py-3 text-center">Délais</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                 {trimesters.map((t) => {
                    const isSelected = t.id === selectedTrim;
                    return (
                    <tr key={t.id} className={isSelected ? 'bg-blue-50/50' : ''}>
                       <td className="px-4 py-4">
                          <span className="block font-bold text-slate-900">{t.id === 1 ? '1er' : `${t.id}ème`} Trimestre</span>
                       </td>
                       <td className="px-4 py-4">
                          {isSelected ? (t.imposable.toFixed(2)) : '-'}
                       </td>
                       <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">
                          {isSelected && t.irg > 0 ? t.irg.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                       </td>
                       <td className="px-4 py-4 text-right font-mono font-bold text-red-600">
                          {isSelected && penalty.isLate ? penalty.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                       </td>
                       <td className="px-4 py-4 text-center text-[10px]">
                          {t.deadline}
                       </td>
                    </tr>
                 )})}
              </tbody>
              <tfoot className="bg-blue-50/30 border-t-2 border-slate-900">
                 <tr>
                    <td colSpan={2} className="px-4 py-4 text-right font-black uppercase text-slate-900 text-sm">Total à Payer</td>
                    <td colSpan={3} className="px-4 py-4 text-right">
                       <span className="block text-lg font-black text-blue-900">
                          {(activeTrimester ? (activeTrimester.irg + (penalty.isLate ? penalty.amount : 0)) : 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </span>
                       <span className="text-xs font-bold text-blue-700">DA</span>
                    </td>
                 </tr>
              </tfoot>
           </table>
        </div>

        {/* ... (Bas de page et Copyright inchangés) ... */}
        
      </div>
    </div>
  );
};

export default G50TerForm;
