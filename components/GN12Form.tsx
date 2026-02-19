
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Printer, FileText, CheckCircle2, Calculator, Coins, LayoutGrid, Calendar, Table, ArrowDownCircle, User, Building2, Wallet, ArrowRight } from 'lucide-react';
import { Taxpayer, Declaration } from '../types';

interface Props {
  taxpayer: Taxpayer | null;
  initialData?: Declaration | null; 
  onBack: () => void;
  onSubmit: (declaration: Declaration) => void;
}

const GN12Form: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  // Nouvelle gestion d'onglets style G11
  const [activeTab, setActiveTab] = useState<'IDENT' | 'CA' | 'MARGE' | 'PAIEMENT'>('IDENT'); 
  
  // États des données - Tableau II (CA Classique)
  const [table2Data, setTable2Data] = useState({
    vente: { global: '', exonere: '' },
    service: { global: '', exonere: '' },
    auto: { global: '', exonere: '' },
  });

  // États des données - Tableau III (Marge)
  const [margeData, setMargeData] = useState({
    caGlobal: '',
    partExoneree: '',
  });

  const [paymentMode, setPaymentMode] = useState<'integral' | 'fractionne'>('integral');
  const [calculations, setCalculations] = useState({
    ifuVente: 0,
    ifuService: 0,
    ifuAuto: 0,
    ifuMarge: 0,
    
    // Bases imposables calculées
    baseVente: 0,
    baseService: 0,
    baseAuto: 0,
    margeImposable: 0,

    totalIfu: 0,
    amountToPay: 0,
    isMinimum: false
  });

  // Constantes
  const TAUX_VENTE = 0.05;
  const TAUX_SERVICE = 0.12;
  const TAUX_AUTO = 0.005; // 0.5%
  const TAUX_MARGE = 0.05; // Généralement 5% pour la marge
  const MINIMUM_FISCAL_STD = 30000;
  const MINIMUM_FISCAL_AUTO = 10000;

  // Détection du Taux par défaut selon le code activité
  const detectedRate = React.useMemo(() => {
    const code = taxpayer?.dynamicData['code_act'] || '';
    if (code.startsWith('4') || code.startsWith('5') || code.startsWith('1')) return { rate: 0.05, label: '5% (Production/Vente)' };
    if (code.startsWith('6') || code.startsWith('7') || code.startsWith('8')) return { rate: 0.12, label: '12% (Prestations)' };
    return { rate: 0.05, label: '5% (Défaut)' };
  }, [taxpayer]);

  // CHARGEMENT DES DONNÉES INITIALES
  useEffect(() => {
    if (initialData) {
      if (initialData.amount > 0) {
         const estimatedBase = initialData.amount / TAUX_SERVICE;
         setTable2Data(prev => ({
             ...prev,
             service: { ...prev.service, global: estimatedBase.toString() }
         }));
      }

      if (initialData.status !== 'BROUILLON') {
        setViewMode('OFFICIAL');
      }
    }
  }, [initialData]);

  // Calcul automatique
  useEffect(() => {
    // Calcul Tableau II : Global - Exonéré = Imposable
    // Vente
    const vGlobal = parseFloat(table2Data.vente.global) || 0;
    const vExo = parseFloat(table2Data.vente.exonere) || 0;
    const vImp = Math.max(0, vGlobal - vExo);
    const ifuVente = vImp * TAUX_VENTE;

    // Service
    const sGlobal = parseFloat(table2Data.service.global) || 0;
    const sExo = parseFloat(table2Data.service.exonere) || 0;
    const sImp = Math.max(0, sGlobal - sExo);
    const ifuService = sImp * TAUX_SERVICE;

    // Auto
    const aGlobal = parseFloat(table2Data.auto.global) || 0;
    const aExo = parseFloat(table2Data.auto.exonere) || 0;
    const aImp = Math.max(0, aGlobal - aExo);
    const ifuAuto = aImp * TAUX_AUTO;
    
    // Calcul Tableau III (Marge) : CA Global - Part Exonérée = Base Imposable
    const valCaGlobalMarge = parseFloat(margeData.caGlobal) || 0;
    const valPartExonereeMarge = parseFloat(margeData.partExoneree) || 0;
    const valMargeImposable = Math.max(0, valCaGlobalMarge - valPartExonereeMarge);
    
    const ifuMarge = valMargeImposable * TAUX_MARGE;

    const totalCalculated = ifuVente + ifuService + ifuAuto + ifuMarge;
    
    // Détermination du minimum applicable
    let minApplicable = MINIMUM_FISCAL_STD;
    // Si uniquement Auto-Entrepreneur, min réduit
    if (aImp > 0 && vImp === 0 && sImp === 0 && valMargeImposable === 0) {
      minApplicable = MINIMUM_FISCAL_AUTO;
    }

    const amountToPay = Math.max(totalCalculated, minApplicable);

    setCalculations({
      ifuVente,
      ifuService,
      ifuAuto,
      ifuMarge,
      
      baseVente: vImp,
      baseService: sImp,
      baseAuto: aImp,
      margeImposable: valMargeImposable,

      totalIfu: totalCalculated,
      amountToPay,
      isMinimum: totalCalculated < minApplicable
    });
  }, [table2Data, margeData]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    const newDec: Declaration = {
      id: initialData?.id || `G12-${Math.floor(Math.random() * 10000)}`,
      type: 'Série G n°12 (Prévisionnelle)',
      period: 'Exercice 2025',
      regime: 'IFU',
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status,
      amount: calculations.amountToPay,
      taxpayerName: taxpayer?.dynamicData['1']
    };
    onSubmit(newDec);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const GridInput = ({ value, length }: { value: string, length: number }) => {
    const safeValue = value || '';
    const cells = Array.from({ length });
    return (
      <div className="flex border-l border-t border-b border-black h-5 bg-white w-fit">
        {cells.map((_, i) => (
          <div key={i} className="w-4 border-r border-black flex items-center justify-center text-[9px] font-mono font-bold leading-none">
            {safeValue[i] || ''}
          </div>
        ))}
      </div>
    );
  };

  // --- VUE 1 : WIZARD (STYLE G11) ---
  if (viewMode === 'WIZARD') {
    return (
      <div className="min-h-full bg-[#f6f7f8] flex flex-col pb-32">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
                  <div>
                     <h1 className="text-2xl font-black text-slate-900 tracking-tight">SÉRIE G N°12</h1>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Déclaration Prévisionnelle IFU</p>
                  </div>
              </div>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  {['IDENT', 'CA', 'MARGE', 'PAIEMENT'].map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        {tab === 'IDENT' ? 'Identification' : tab === 'CA' ? 'Chiffre d\'Affaires' : tab === 'MARGE' ? 'Marge' : 'Paiement'}
                     </button>
                  ))}
              </div>
           </div>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           
           {/* IDENTIFICATION */}
           {activeTab === 'IDENT' && (
             <div className="space-y-6">
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6"><Building2 className="w-6 h-6 text-primary" /> Identification du Contribuable</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="col-span-2">
                           <label className="text-xs font-bold text-slate-500 uppercase">Nom / Raison Sociale</label>
                           <div className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-bold text-slate-800">{taxpayer?.dynamicData['1']}</div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">NIF</label>
                           <div className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-mono tracking-widest">{taxpayer?.dynamicData['2']}</div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Code Activité (NAA)</label>
                           <div className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-bold">{taxpayer?.dynamicData['code_act']}</div>
                       </div>
                       <div className="col-span-2">
                           <label className="text-xs font-bold text-slate-500 uppercase">Activité Principale</label>
                           <div className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-bold">{taxpayer?.dynamicData['7']}</div>
                       </div>
                       <div className="col-span-2">
                           <label className="text-xs font-bold text-slate-500 uppercase">Adresse Exercice</label>
                           <div className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-medium">{taxpayer?.dynamicData['adresse']}</div>
                       </div>
                   </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-4"><CheckCircle2 className="w-6 h-6 text-green-600" /> Taux Suggéré</h2>
                   <p className="text-sm text-slate-600">
                      D'après votre code activité, le taux principal applicable est de : 
                      <span className="font-black text-slate-900 ml-2 bg-slate-100 px-2 py-1 rounded-lg">{detectedRate.label}</span>
                   </p>
                </div>
             </div>
           )}

           {/* TABLEAU II : CA */}
           {activeTab === 'CA' && (
             <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                   <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-primary" /> Chiffre d'Affaires Prévisionnel</h2>
                   <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase tracking-wider">Tableau II</div>
                </div>

                <div className="space-y-6">
                   {/* VENTE */}
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-blue-300 transition-colors group">
                      <div className="flex justify-between items-center">
                         <h3 className="text-sm font-bold text-slate-800">Production / Vente</h3>
                         <span className="text-xs font-black text-white bg-blue-500 px-2 py-1 rounded">5%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">CA Global</label>
                            <input type="number" value={table2Data.vente.global} onChange={e => setTable2Data({...table2Data, vente: {...table2Data.vente, global: e.target.value}})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold focus:ring-2 focus:ring-blue-500/20" placeholder="0.00" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Dont Exonéré</label>
                            <input type="number" value={table2Data.vente.exonere} onChange={e => setTable2Data({...table2Data, vente: {...table2Data.vente, exonere: e.target.value}})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold text-slate-500 focus:ring-2 focus:ring-blue-500/20" placeholder="0.00" />
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                         <span className="text-xs text-slate-500">Base Imposable: <span className="font-bold text-slate-900">{formatCurrency(calculations.baseVente)}</span></span>
                         <span className="text-sm font-black text-blue-700">IFU: {formatCurrency(calculations.ifuVente)} DA</span>
                      </div>
                   </div>

                   {/* SERVICE */}
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-indigo-300 transition-colors group">
                      <div className="flex justify-between items-center">
                         <h3 className="text-sm font-bold text-slate-800">Prestations de Services</h3>
                         <span className="text-xs font-black text-white bg-indigo-500 px-2 py-1 rounded">12%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">CA Global</label>
                            <input type="number" value={table2Data.service.global} onChange={e => setTable2Data({...table2Data, service: {...table2Data.service, global: e.target.value}})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold focus:ring-2 focus:ring-indigo-500/20" placeholder="0.00" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Dont Exonéré</label>
                            <input type="number" value={table2Data.service.exonere} onChange={e => setTable2Data({...table2Data, service: {...table2Data.service, exonere: e.target.value}})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold text-slate-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="0.00" />
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                         <span className="text-xs text-slate-500">Base Imposable: <span className="font-bold text-slate-900">{formatCurrency(calculations.baseService)}</span></span>
                         <span className="text-sm font-black text-indigo-700">IFU: {formatCurrency(calculations.ifuService)} DA</span>
                      </div>
                   </div>

                   {/* AUTO ENTREPRENEUR */}
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-green-300 transition-colors group">
                      <div className="flex justify-between items-center">
                         <h3 className="text-sm font-bold text-slate-800">Auto-Entrepreneur</h3>
                         <span className="text-xs font-black text-white bg-green-500 px-2 py-1 rounded">0.5%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">CA Global</label>
                            <input type="number" value={table2Data.auto.global} onChange={e => setTable2Data({...table2Data, auto: {...table2Data.auto, global: e.target.value}})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold focus:ring-2 focus:ring-green-500/20" placeholder="0.00" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Dont Exonéré</label>
                            <input type="number" value={table2Data.auto.exonere} onChange={e => setTable2Data({...table2Data, auto: {...table2Data.auto, exonere: e.target.value}})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold text-slate-500 focus:ring-2 focus:ring-green-500/20" placeholder="0.00" />
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                         <span className="text-xs text-slate-500">Base Imposable: <span className="font-bold text-slate-900">{formatCurrency(calculations.baseAuto)}</span></span>
                         <span className="text-sm font-black text-green-700">IFU: {formatCurrency(calculations.ifuAuto)} DA</span>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* TABLEAU III : MARGE */}
           {activeTab === 'MARGE' && (
             <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                   <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Table className="w-6 h-6 text-amber-500" /> Marge Bénéficiaire</h2>
                   <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-black uppercase tracking-wider">Tableau III</div>
                </div>
                
                <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 space-y-4">
                   <div className="flex justify-between items-center">
                         <h3 className="text-sm font-bold text-slate-800">Activités à Marge Réglementée</h3>
                         <span className="text-xs font-black text-white bg-amber-500 px-2 py-1 rounded">5%</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase">CA Global</label>
                         <input type="number" value={margeData.caGlobal} onChange={e => setMargeData({...margeData, caGlobal: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold focus:ring-2 focus:ring-amber-500/20" placeholder="0.00" />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Part Exonérée</label>
                         <input type="number" value={margeData.partExoneree} onChange={e => setMargeData({...margeData, partExoneree: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-right font-bold text-slate-500 focus:ring-2 focus:ring-amber-500/20" placeholder="0.00" />
                      </div>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                         <span className="text-xs text-slate-500">Marge Imposable: <span className="font-bold text-slate-900">{formatCurrency(calculations.margeImposable)}</span></span>
                         <span className="text-sm font-black text-amber-700">IFU: {formatCurrency(calculations.ifuMarge)} DA</span>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                   * Ce tableau concerne uniquement les activités dont la marge est réglementée par l'État.
                </div>
             </div>
           )}

           {/* PAIEMENT */}
           {activeTab === 'PAIEMENT' && (
             <div className="space-y-6">
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                   <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Wallet className="w-6 h-6 text-primary" /> Modalités de Paiement</h2>
                   
                   <div className="flex flex-col md:flex-row gap-4">
                      <button 
                         onClick={() => setPaymentMode('integral')}
                         className={`flex-1 p-6 rounded-2xl border-2 text-left transition-all ${paymentMode === 'integral' ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${paymentMode === 'integral' ? 'text-primary' : 'text-slate-500'}`}>Intégral</span>
                            {paymentMode === 'integral' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                         </div>
                         <p className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(calculations.amountToPay)} DA</p>
                         <p className="text-xs text-slate-500">Paiement unique avant le 30 Juin</p>
                      </button>

                      <button 
                         onClick={() => setPaymentMode('fractionne')}
                         className={`flex-1 p-6 rounded-2xl border-2 text-left transition-all ${paymentMode === 'fractionne' ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${paymentMode === 'fractionne' ? 'text-primary' : 'text-slate-500'}`}>Fractionné</span>
                            {paymentMode === 'fractionne' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                         </div>
                         <p className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(calculations.amountToPay / 2)} DA</p>
                         <p className="text-xs text-slate-500">50% maintenant, puis 25% Sept / 25% Déc</p>
                      </button>
                   </div>

                   {calculations.isMinimum && (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-800 text-xs font-bold">
                         <LayoutGrid className="w-4 h-4" />
                         Application du Minimum Fiscal ({formatCurrency(calculations.amountToPay)} DA) car l'impôt calculé est inférieur au seuil.
                      </div>
                   )}
                </div>

                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl flex justify-between items-center">
                   <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total à Payer (IFU)</p>
                      <p className="text-3xl font-black tracking-tighter">{formatCurrency(calculations.amountToPay)} <span className="text-sm font-normal text-slate-400">DA</span></p>
                   </div>
                   <button onClick={() => handleSave('VALIDÉ')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                      Valider G12 <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
           )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:px-8 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total IFU Calculé :</span>
              <span className="text-xl font-black text-slate-900 tracking-tighter">{formatCurrency(calculations.amountToPay)} DA</span>
           </div>
           <div className="flex gap-3">
              <button onClick={() => setViewMode('OFFICIAL')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-2"><Printer className="w-4 h-4" /> Aperçu PDF</button>
              <button onClick={() => handleSave('BROUILLON')} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2"><Save className="w-4 h-4" /> Sauvegarder</button>
           </div>
        </div>
      </div>
    );
  }

  // --- VUE 2 : OFFICIEL (PAPIER) ---
  return (
    <div className="min-h-full bg-[#525659] p-4 md:p-8 font-serif print:p-0 print:bg-white">
      {/* HEADER ACTIONS (Non imprimable) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour à l'assistant
        </button>
        <div className="flex gap-3">
          <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 font-sans">
            <Save className="w-4 h-4" /> Sauvegarder Brouillon
          </button>
          <button onClick={() => handleSave('VALIDÉ')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 font-sans">
            <CheckCircle2 className="w-4 h-4" /> Valider la Déclaration
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* PAGE 1 : DÉCLARATION */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full min-h-[297mm] p-[10mm] relative text-black font-sans box-border border-0 mb-8 print:mb-0 print:break-after-page">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-4">
           <h1 className="text-lg font-bold font-serif leading-tight">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
           <h2 className="text-sm font-bold uppercase tracking-widest leading-tight">République Algérienne Démocratique et Populaire</h2>
        </div>

        <div className="flex border border-black min-h-[30mm] mb-1">
           <div className="flex-1 p-2 border-r border-black text-[9px] font-bold space-y-1">
              <p>DIRECTION GENERALE DES IMPOTS</p>
              <p>DIW DE ................................................................</p>
              <p>Structure : {taxpayer?.cpiRattachement}</p>
              <p>Recette des Impôts de .........................................</p>
              <p>Commune de {taxpayer?.commune}</p>
           </div>
           <div className="flex-1 p-2 text-right text-[10px] font-bold space-y-1" dir="rtl">
              <p>المديرية العامة للضرائب</p>
              <p>مديرية الضرائب لولاية .....................................</p>
              <p>المصلحة ...........................................................</p>
              <p>قباضة الضرائب لـ ..............................................</p>
              <p>بلدية ..............................................................</p>
           </div>
           <div className="w-[35mm] border-l border-black flex flex-col items-center justify-center p-1 bg-white">
              <div className="border border-black px-2 py-1 text-center mb-1">
                <p className="text-[10px] font-bold">Série GN°12(2025)</p>
              </div>
           </div>
        </div>

        {/* TITRE */}
        <div className="bg-[#f0fdf4] border border-black p-2 text-center mb-1 print:bg-[#f0fdf4]">
           <h2 className="text-sm font-bold uppercase">- REGIME DE L'IMPOT FORFAITAIRE UNIQUE (IFU) -</h2>
           <h1 className="text-lg font-black uppercase leading-tight">DECLARATION PREVISIONNELLE DU CHIFFRE D'AFFAIRES OU DES RECETTES PROFESSIONNELLES DE L'ANNEE 2025</h1>
           <p className="text-[8px] font-bold">(Art 1 er du Code des Procédures Fiscales)</p>
        </div>

        <div className="border border-black bg-white mb-1 p-1 text-center">
           <p className="text-[9px] font-bold">A souscrire auprès de la recette des impôts au plus tard le 30 juin de l’année 2025</p>
        </div>

        {/* SECTION I : IDENTIFICATION */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb]">
              <h3 className="text-[10px] font-bold uppercase">I – IDENTIFICATION DU CONTRIBUABLE</h3>
           </div>
           <div className="p-2 space-y-2 text-[10px]">
              <div className="flex gap-2">
                 <span className="font-bold w-48">- Nom, Prénoms / Raison sociale :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black flex-1">{taxpayer?.dynamicData['1']}</span>
              </div>
              <div className="flex gap-2">
                 <span className="font-bold w-48">- Activité (s) exercée (s) :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black flex-1">{taxpayer?.dynamicData['7']}</span>
              </div>
              <div className="flex gap-2">
                 <span className="font-bold w-48">- Adresse du lieu d’exercice :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black flex-1">{taxpayer?.dynamicData['adresse']}</span>
              </div>
              <div className="flex gap-8 mt-2">
                 <div className="flex gap-2 items-center">
                    <span className="font-bold">- NIF :</span>
                    <div className="border border-black px-2 py-0.5 tracking-[0.2em] font-mono font-bold bg-slate-50">{taxpayer?.dynamicData['2']}</div>
                 </div>
                 <div className="flex gap-2 items-center">
                    <span className="font-bold">- Article :</span>
                    <div className="border border-black px-2 py-0.5 tracking-[0.2em] font-mono font-bold bg-slate-50">{taxpayer?.dynamicData['article_imp']}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION II : CA PREVISIONNEL */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb]">
              <h3 className="text-[10px] font-bold uppercase">II- CHIFFRE D'AFFAIRES/RECETTES PROFESSIONNELLES PREVISIONNELS (DA)</h3>
           </div>
           <table className="w-full text-[9px] border-collapse">
              <thead>
                 <tr>
                    <th className="border-r border-b border-black p-1 text-left w-[30%]">Nature de l'activité</th>
                    <th className="border-r border-b border-black p-1 text-center w-[10%]">Taux</th>
                    <th className="border-r border-b border-black p-1 text-center w-[15%]">CA Global</th>
                    <th className="border-r border-b border-black p-1 text-center w-[15%]">Imposable</th>
                    <th className="border-r border-b border-black p-1 text-center w-[15%]">Exonéré</th>
                    <th className="border-b border-black p-1 text-center w-[15%]">IFU dû (A)</th>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                    <td className="border-r border-b border-black p-2 font-bold">Activités de production ou de vente de marchandises</td>
                    <td className="border-r border-b border-black p-2 text-center font-bold">5%</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{table2Data.vente.global ? formatCurrency(parseFloat(table2Data.vente.global)) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{calculations.baseVente > 0 ? formatCurrency(calculations.baseVente) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{table2Data.vente.exonere ? formatCurrency(parseFloat(table2Data.vente.exonere)) : '-'}</td>
                    <td className="border-b border-black p-2 text-right font-mono font-bold">{calculations.ifuVente > 0 ? formatCurrency(calculations.ifuVente) : '-'}</td>
                 </tr>
                 <tr>
                    <td className="border-r border-b border-black p-2 font-bold">Prestations de services ou autres activités</td>
                    <td className="border-r border-b border-black p-2 text-center font-bold">12%</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{table2Data.service.global ? formatCurrency(parseFloat(table2Data.service.global)) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{calculations.baseService > 0 ? formatCurrency(calculations.baseService) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{table2Data.service.exonere ? formatCurrency(parseFloat(table2Data.service.exonere)) : '-'}</td>
                    <td className="border-b border-black p-2 text-right font-mono font-bold">{calculations.ifuService > 0 ? formatCurrency(calculations.ifuService) : '-'}</td>
                 </tr>
                 <tr>
                    <td className="border-r border-b border-black p-2 font-bold">Activités exercées sous le statut d‘auto entrepreneur</td>
                    <td className="border-r border-b border-black p-2 text-center font-bold">0,5%</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{table2Data.auto.global ? formatCurrency(parseFloat(table2Data.auto.global)) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{calculations.baseAuto > 0 ? formatCurrency(calculations.baseAuto) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{table2Data.auto.exonere ? formatCurrency(parseFloat(table2Data.auto.exonere)) : '-'}</td>
                    <td className="border-b border-black p-2 text-right font-mono font-bold">{calculations.ifuAuto > 0 ? formatCurrency(calculations.ifuAuto) : '-'}</td>
                 </tr>
                 <tr className="bg-slate-100 print:bg-slate-100">
                    <td colSpan={5} className="border-r border-black p-2 text-right font-black uppercase">Total IFU Calculé (Hors Minimum)</td>
                    <td className="border-black p-2 text-right font-mono font-black">{formatCurrency(calculations.ifuVente + calculations.ifuService + calculations.ifuAuto)}</td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* SECTION III : MARGE BENEFICIAIRE */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb]">
              <h3 className="text-[10px] font-bold uppercase">III- MARGE BENEFICIAIRE EN DA (Cas Spécifiques)</h3>
           </div>
           <table className="w-full text-[9px] border-collapse">
              <thead>
                 <tr>
                    <th className="border-r border-b border-black p-1 text-left w-[30%]">Nature de l'activité</th>
                    <th className="border-r border-b border-black p-1 text-center w-[10%]">Taux</th>
                    <th className="border-r border-b border-black p-1 text-center w-[20%]">Chiffre d'affaires Global</th>
                    <th className="border-r border-b border-black p-1 text-center w-[15%]">Chiffre d'Affaires Imposable</th>
                    <th className="border-b border-black p-1 text-center w-[15%]">IFU dû (B)</th>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                    <td className="border-r border-b border-black p-2 font-bold">Activités soumises à la marge</td>
                    <td className="border-r border-b border-black p-2 text-center font-bold">5%</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{margeData.caGlobal ? formatCurrency(parseFloat(margeData.caGlobal)) : '-'}</td>
                    <td className="border-r border-b border-black p-2 text-right font-mono">{calculations.margeImposable > 0 ? formatCurrency(calculations.margeImposable) : '-'}</td>
                    <td className="border-b border-black p-2 text-right font-mono font-bold">{calculations.ifuMarge > 0 ? formatCurrency(calculations.ifuMarge) : '-'}</td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* TOTAL A PAYER */}
        <div className="border border-black mb-4 p-2 flex justify-between items-center bg-[#f0fdf4] print:bg-[#f0fdf4]">
           <span className="text-[10px] font-black uppercase">IFU A PAYER (A) + (B) (Minimum appliqué si nécessaire) :</span>
           <span className="text-lg font-black font-mono">{formatCurrency(calculations.amountToPay)} DA</span>
        </div>

        {/* SIGNATURE */}
        <div className="flex border border-black min-h-[40mm]">
           <div className="flex-1 p-2 border-r border-black">
              <p className="text-[9px] font-bold">J’atteste de l’exactitude des renseignements portés sur la présente déclaration.</p>
           </div>
           <div className="flex-1 p-4 relative">
              <p className="text-[10px] font-bold mb-8">A {taxpayer?.commune || '.....................'}, le .........................</p>
              <p className="text-center text-[10px] font-bold border-t border-black pt-2 w-3/4 mx-auto">Cachet et signature du contribuable</p>
           </div>
        </div>

      </div>

      {/* PAGE 2 : PAIEMENT */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full min-h-[297mm] p-[10mm] relative text-black font-sans box-border border-0">
         <div className="text-center border border-black p-2 mb-4 bg-slate-100 print:bg-slate-100">
            <h1 className="text-xl font-bold uppercase">PAIEMENT DE L'IFU</h1>
            <h2 className="text-sm font-bold">تسديد الضريبة الجزافية الوحيدة</h2>
         </div>

         <div className="border border-black p-2 mb-4 text-[10px]">
            <p><span className="font-bold">NIF :</span> {taxpayer?.dynamicData['2']}</p>
            <p><span className="font-bold">Nom / Raison Sociale :</span> {taxpayer?.dynamicData['1']}</p>
         </div>

         {/* OPTION 1 : PAIEMENT TOTAL */}
         <div className={`border-2 mb-6 p-4 ${paymentMode === 'integral' ? 'border-black bg-white' : 'border-slate-300 opacity-50'}`}>
            <h3 className="text-sm font-black uppercase underline mb-4">Paiement total (Avant le 30 Juin)</h3>
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2 text-[10px]">
                  <p>Montant total de l'IFU acquitté :</p>
                  <div className="border-b border-dotted border-black h-6 flex items-end font-mono font-bold text-sm">
                     {paymentMode === 'integral' ? formatCurrency(calculations.amountToPay) : ''}
                  </div>
                  <p>En toutes lettres : ..................................................................................</p>
               </div>
               <div className="border border-black p-4 min-h-[30mm] flex items-center justify-center text-center">
                  <p className="text-[8px] font-bold text-slate-400">Cadre réservé à la Quittance<br/>(Cachet et Signature du Caissier)</p>
               </div>
            </div>
         </div>

         {/* OPTION 2 : PAIEMENT FRACTIONNÉ */}
         <div className={`border-2 mb-6 p-4 ${paymentMode === 'fractionne' ? 'border-black bg-white' : 'border-slate-300 opacity-50'}`}>
            <h3 className="text-sm font-black uppercase underline mb-4">Paiement fractionné (3 Tranches)</h3>
            
            {/* Tranche 1 */}
            <div className="mb-4 border-b border-dashed border-black pb-4">
               <p className="text-[10px] font-bold mb-2">1ère Tranche (50%) - Avant le 30 Juin</p>
               <div className="grid grid-cols-2 gap-8">
                  <div className="text-[10px]">
                     <p>Montant : <span className="font-mono font-bold text-sm ml-2">{paymentMode === 'fractionne' ? formatCurrency(calculations.amountToPay * 0.5) : ''}</span></p>
                  </div>
                  <div className="border border-black p-2 h-[20mm] text-[8px] text-center text-slate-400">Quittance Tranche 1</div>
               </div>
            </div>

            {/* Tranche 2 */}
            <div className="mb-4 border-b border-dashed border-black pb-4">
               <p className="text-[10px] font-bold mb-2">2ème Tranche (25%) - 1er au 15 Septembre</p>
               <div className="grid grid-cols-2 gap-8">
                  <div className="text-[10px]">
                     <p>Montant : <span className="font-mono font-bold text-sm ml-2">{paymentMode === 'fractionne' ? formatCurrency(calculations.amountToPay * 0.25) : ''}</span></p>
                  </div>
                  <div className="border border-black p-2 h-[20mm] text-[8px] text-center text-slate-400">Quittance Tranche 2</div>
               </div>
            </div>

            {/* Tranche 3 */}
            <div>
               <p className="text-[10px] font-bold mb-2">3ème Tranche (25%) - 1er au 15 Décembre</p>
               <div className="grid grid-cols-2 gap-8">
                  <div className="text-[10px]">
                     <p>Montant : <span className="font-mono font-bold text-sm ml-2">{paymentMode === 'fractionne' ? formatCurrency(calculations.amountToPay * 0.25) : ''}</span></p>
                  </div>
                  <div className="border border-black p-2 h-[20mm] text-[8px] text-center text-slate-400">Quittance Tranche 3</div>
               </div>
            </div>
         </div>

         <p className="text-[8px] italic">* Sont exclus du paiement fractionné, les contribuables n’ayant pas souscrit leurs déclarations dans le délai imparti.</p>
      </div>

    </div>
  );
};

export default GN12Form;
