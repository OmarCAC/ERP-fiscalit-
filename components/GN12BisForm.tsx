
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Calculator, 
  Table,
  Upload,
  Info,
  ArrowRight,
  Coins
} from 'lucide-react';
import { Taxpayer, Declaration } from '../types';

interface Props {
  taxpayer: Taxpayer | null;
  previousG12?: Declaration; // Déclaration G12 prévisionnelle précédente pour pré-remplissage
  onBack: () => void;
  onSubmit: (declaration: Declaration) => void;
}

const GN12BisForm: React.FC<Props> = ({ taxpayer, previousG12, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTable, setActiveTable] = useState<'III' | 'IV'>('III'); // Bascule entre CA et Marge
  
  // --- ÉTATS DU FORMULAIRE ---

  // 1. Volet Salaires (Section II)
  const [salaryData, setSalaryData] = useState({
    count: 0,
    masseBrute: 0,
    charges: 0,
    irg: 0
  });

  // 2. Chiffres d'Affaires (Section III) - Structure détaillée (Imposable / Exonéré)
  const [caData, setCaData] = useState({
    vente: { prev: 0, realImp: 0, realExo: 0 },   // 5%
    service: { prev: 0, realImp: 0, realExo: 0 }, // 12%
    auto: { prev: 0, realImp: 0, realExo: 0 },    // 0.5% (Auto-Entrepreneur)
  });

  // 3. Marge Bénéficiaire (Section IV)
  const [margeData, setMargeData] = useState({
    prev: 0,
    realImp: 0,
    realExo: 0
  });

  // 4. Validation
  const [validation, setValidation] = useState({
    place: taxpayer?.commune || 'Alger',
    date: new Date().toISOString().split('T')[0],
    certified: false
  });

  // --- INITIALISATION ---
  useEffect(() => {
    // Si une G12 prévisionnelle existe, on essaie de pré-remplir les colonnes "Prévisionnel"
    if (previousG12) {
       // On initialise le prévisionnel dans la section Service par défaut pour la démo
       const amount = previousG12.amount || 0;
       // Estimation inverse pour retrouver la base approximative
       setCaData(prev => ({
          ...prev,
          service: { ...prev.service, prev: Math.round(amount / 0.12) } 
       }));
    }
    
    if (taxpayer?.employeeCount) {
        setSalaryData(prev => ({ ...prev, count: taxpayer.employeeCount }));
    }
  }, [previousG12, taxpayer]);

  // --- CALCULS EN TEMPS RÉEL ---
  const calculations = useMemo(() => {
    const TAUX_VENTE = 0.05;
    const TAUX_SERVICE = 0.12;
    const TAUX_AUTO = 0.005;
    const TAUX_MARGE = 0.05;

    // Calcul des totaux globaux réalisés (Imposable + Exonéré)
    const totalVenteReal = caData.vente.realImp + caData.vente.realExo;
    const totalServiceReal = caData.service.realImp + caData.service.realExo;
    const totalAutoReal = caData.auto.realImp + caData.auto.realExo;
    const totalMargeReal = margeData.realImp + margeData.realExo;

    // Calculs différentiels (Base Imposable Réalisée - Prévisionnel Global déclaré)
    // Note: On compare l'imposable réalisé au prévisionnel
    
    // Vente
    const diffVente = Math.max(0, caData.vente.realImp - caData.vente.prev);
    const ifuVente = diffVente * TAUX_VENTE;

    // Service
    const diffService = Math.max(0, caData.service.realImp - caData.service.prev);
    const ifuService = diffService * TAUX_SERVICE;

    // Auto-Entrepreneur
    const diffAuto = Math.max(0, caData.auto.realImp - caData.auto.prev);
    const ifuAuto = diffAuto * TAUX_AUTO;

    // Marge (Tableau IV)
    const diffMarge = Math.max(0, margeData.realImp - margeData.prev);
    const ifuMarge = diffMarge * TAUX_MARGE;

    const totalComplementaire = ifuVente + ifuService + ifuAuto + ifuMarge;
    
    // Calcul du Revenu Net (Section IV bas de page - Estimation)
    // Impôt total réel sur la partie imposable
    const totalImpotReel = (caData.vente.realImp * TAUX_VENTE) + (caData.service.realImp * TAUX_SERVICE) + (caData.auto.realImp * TAUX_AUTO) + (margeData.realImp * TAUX_MARGE);
    // Le revenu net prend en compte tout le CA réalisé (y compris exonéré car c'est un revenu) moins l'impôt payé
    const totalCaReelGlobal = totalVenteReal + totalServiceReal + totalAutoReal + totalMargeReal;
    const revenuNet = totalCaReelGlobal - totalImpotReel;

    return {
       diffVente, ifuVente, totalVenteReal,
       diffService, ifuService, totalServiceReal,
       diffAuto, ifuAuto, totalAutoReal,
       diffMarge, ifuMarge, totalMargeReal,
       totalComplementaire,
       revenuNet
    };
  }, [caData, margeData]);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    const newDec: Declaration = {
      id: `G12BIS-${Math.floor(Math.random() * 10000)}`,
      type: 'Série G n°12 Bis (Définitive)',
      period: 'Exercice 2025',
      regime: 'IFU',
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status,
      amount: calculations.totalComplementaire,
      taxpayerName: taxpayer?.dynamicData['1']
    };
    onSubmit(newDec);
  };

  const formatMoney = (amount: number) => amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // --- VUE WIZARD (MODERNE) ---
  if (viewMode === 'WIZARD') {
    return (
      <div className="min-h-full bg-[#f8fafc] p-6 md:p-12 pb-32 font-sans">
        
        {/* HEADER */}
        <div className="max-w-7xl mx-auto mb-8">
           <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 text-xs font-bold uppercase tracking-widest">Déclarations / GN°12 Bis</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Déclaration Définitive IFU</h1>
           <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-black uppercase tracking-widest">En cours de saisie</span>
              <p className="text-sm text-slate-500">Étape : Régularisation Annuelle</p>
           </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
           
           {/* SELECTEUR DE TABLEAU (III ou IV) */}
           <div className="grid grid-cols-2 gap-4">
              <button 
                 onClick={() => setActiveTable('III')}
                 className={`p-6 rounded-[24px] border-2 flex items-center justify-center gap-4 transition-all ${activeTable === 'III' ? 'border-primary bg-white shadow-xl ring-4 ring-primary/10' : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-400'}`}
              >
                 <Coins className={`w-6 h-6 ${activeTable === 'III' ? 'text-primary' : 'text-slate-400'}`} />
                 <div className="text-left">
                    <p className={`text-sm font-black uppercase ${activeTable === 'III' ? 'text-slate-900' : 'text-slate-500'}`}>Tableau III</p>
                    <p className="text-[10px] font-bold text-slate-400">Chiffre d'Affaires Global</p>
                 </div>
              </button>
              
              <button 
                 onClick={() => setActiveTable('IV')}
                 className={`p-6 rounded-[24px] border-2 flex items-center justify-center gap-4 transition-all ${activeTable === 'IV' ? 'border-primary bg-white shadow-xl ring-4 ring-primary/10' : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-400'}`}
              >
                 <Table className={`w-6 h-6 ${activeTable === 'IV' ? 'text-primary' : 'text-slate-400'}`} />
                 <div className="text-left">
                    <p className={`text-sm font-black uppercase ${activeTable === 'IV' ? 'text-slate-900' : 'text-slate-500'}`}>Tableau IV</p>
                    <p className="text-[10px] font-bold text-slate-400">Marge Bénéficiaire</p>
                 </div>
              </button>
           </div>

           {/* TABLEAU III : CA DEFINITIFS */}
           {activeTable === 'III' && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-2">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                   <div className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm">III</div>
                   <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tableau des CA / Recettes Définitifs</h2>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                         <tr>
                            <th className="px-6 py-4 w-1/5">Nature d'Activité</th>
                            <th className="px-6 py-4 text-center">Taux</th>
                            <th className="px-2 py-4 text-center bg-blue-50/50 border-l border-blue-100">CA Imposable (1)</th>
                            <th className="px-2 py-4 text-center bg-blue-50/50">CA Exonéré</th>
                            <th className="px-6 py-4 text-right bg-blue-50/50 border-r border-blue-100 font-black text-slate-700">Total Réalisé</th>
                            <th className="px-6 py-4 text-right">Prévisionnel (2)</th>
                            <th className="px-6 py-4 text-right">Complémentaire</th>
                            <th className="px-6 py-4 text-right text-primary">IFU Dû</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                         {/* Ligne Vente */}
                         <tr>
                            <td className="px-6 py-4">Production / Vente</td>
                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">5%</span></td>
                            
                            {/* DECORTIQUAGE REALISE */}
                            <td className="px-2 py-4 bg-blue-50/20 border-l border-blue-50">
                               <input 
                                  type="number" 
                                  value={caData.vente.realImp || ''} 
                                  onChange={e => setCaData({...caData, vente: {...caData.vente, realImp: parseFloat(e.target.value)||0}})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 font-bold text-sm" 
                                  placeholder="Imposable"
                               />
                            </td>
                            <td className="px-2 py-4 bg-blue-50/20">
                               <input 
                                  type="number" 
                                  value={caData.vente.realExo || ''} 
                                  onChange={e => setCaData({...caData, vente: {...caData.vente, realExo: parseFloat(e.target.value)||0}})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm text-slate-500" 
                                  placeholder="Exonéré"
                               />
                            </td>
                            <td className="px-6 py-4 text-right bg-blue-50/20 border-r border-blue-50 font-black text-slate-900">
                               {formatMoney(calculations.totalVenteReal)}
                            </td>

                            <td className="px-6 py-4">
                               <input 
                                  type="number" 
                                  value={caData.vente.prev || ''} 
                                  onChange={e => setCaData({...caData, vente: {...caData.vente, prev: parseFloat(e.target.value)||0}})}
                                  className="w-full text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-slate-200 text-slate-500" 
                                  placeholder="0.00"
                               />
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">{formatMoney(calculations.diffVente)}</td>
                            <td className="px-6 py-4 text-right font-bold text-primary">{formatMoney(calculations.ifuVente)}</td>
                         </tr>
                         
                         {/* Ligne Service */}
                         <tr>
                            <td className="px-6 py-4">Prestations de Services</td>
                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">12%</span></td>
                            
                            <td className="px-2 py-4 bg-blue-50/20 border-l border-blue-50">
                               <input 
                                  type="number" 
                                  value={caData.service.realImp || ''} 
                                  onChange={e => setCaData({...caData, service: {...caData.service, realImp: parseFloat(e.target.value)||0}})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 font-bold text-sm" 
                                  placeholder="Imposable"
                               />
                            </td>
                            <td className="px-2 py-4 bg-blue-50/20">
                               <input 
                                  type="number" 
                                  value={caData.service.realExo || ''} 
                                  onChange={e => setCaData({...caData, service: {...caData.service, realExo: parseFloat(e.target.value)||0}})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm text-slate-500" 
                                  placeholder="Exonéré"
                               />
                            </td>
                            <td className="px-6 py-4 text-right bg-blue-50/20 border-r border-blue-50 font-black text-slate-900">
                               {formatMoney(calculations.totalServiceReal)}
                            </td>

                            <td className="px-6 py-4">
                               <input 
                                  type="number" 
                                  value={caData.service.prev || ''} 
                                  onChange={e => setCaData({...caData, service: {...caData.service, prev: parseFloat(e.target.value)||0}})}
                                  className="w-full text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-slate-200 text-slate-500" 
                                  placeholder="0.00"
                               />
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">{formatMoney(calculations.diffService)}</td>
                            <td className="px-6 py-4 text-right font-bold text-primary">{formatMoney(calculations.ifuService)}</td>
                         </tr>

                         {/* Ligne Auto-Entrepreneur */}
                         <tr>
                            <td className="px-6 py-4">Auto-entrepreneur</td>
                            <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">0,5%</span></td>
                            
                            <td className="px-2 py-4 bg-blue-50/20 border-l border-blue-50">
                               <input 
                                  type="number" 
                                  value={caData.auto.realImp || ''} 
                                  onChange={e => setCaData({...caData, auto: {...caData.auto, realImp: parseFloat(e.target.value)||0}})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 font-bold text-sm" 
                                  placeholder="Imposable"
                               />
                            </td>
                            <td className="px-2 py-4 bg-blue-50/20">
                               <input 
                                  type="number" 
                                  value={caData.auto.realExo || ''} 
                                  onChange={e => setCaData({...caData, auto: {...caData.auto, realExo: parseFloat(e.target.value)||0}})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm text-slate-500" 
                                  placeholder="Exonéré"
                               />
                            </td>
                            <td className="px-6 py-4 text-right bg-blue-50/20 border-r border-blue-50 font-black text-slate-900">
                               {formatMoney(calculations.totalAutoReal)}
                            </td>

                            <td className="px-6 py-4">
                               <input 
                                  type="number" 
                                  value={caData.auto.prev || ''} 
                                  onChange={e => setCaData({...caData, auto: {...caData.auto, prev: parseFloat(e.target.value)||0}})}
                                  className="w-full text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-slate-200 text-slate-500" 
                                  placeholder="0.00"
                               />
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">{formatMoney(calculations.diffAuto)}</td>
                            <td className="px-6 py-4 text-right font-bold text-primary">{formatMoney(calculations.ifuAuto)}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {/* TABLEAU IV : MARGE BENEFICIAIRE */}
           {activeTable === 'IV' && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-2">
                <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50 flex items-center gap-3">
                   <div className="bg-amber-500 text-white w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm">IV</div>
                   <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tableau IV : Marge Bénéficiaire</h2>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                         <tr>
                            <th className="px-6 py-4 w-1/5">Activité (Marge)</th>
                            <th className="px-6 py-4 text-center">Taux</th>
                            <th className="px-2 py-4 text-center bg-amber-50/50 border-l border-amber-100">Marge Imposable (1)</th>
                            <th className="px-2 py-4 text-center bg-amber-50/50">Marge Exonérée</th>
                            <th className="px-6 py-4 text-right bg-amber-50/50 border-r border-amber-100 font-black text-slate-700">Total Réalisé</th>
                            <th className="px-6 py-4 text-right">Prévisionnel (2)</th>
                            <th className="px-6 py-4 text-right">Complémentaire</th>
                            <th className="px-6 py-4 text-right text-primary">IFU Dû</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                         <tr>
                            <td className="px-6 py-4">Produits Réglementés (Marge)</td>
                            <td className="px-6 py-4 text-center"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">5%</span></td>
                            
                            <td className="px-2 py-4 bg-amber-50/20 border-l border-amber-50">
                               <input 
                                  type="number" 
                                  value={margeData.realImp || ''} 
                                  onChange={e => setMargeData({...margeData, realImp: parseFloat(e.target.value)||0})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 font-bold text-sm" 
                                  placeholder="Imposable"
                               />
                            </td>
                            <td className="px-2 py-4 bg-amber-50/20">
                               <input 
                                  type="number" 
                                  value={margeData.realExo || ''} 
                                  onChange={e => setMargeData({...margeData, realExo: parseFloat(e.target.value)||0})}
                                  className="w-28 text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 text-sm text-slate-500" 
                                  placeholder="Exonéré"
                               />
                            </td>
                            <td className="px-6 py-4 text-right bg-amber-50/20 border-r border-amber-50 font-black text-slate-900">
                               {formatMoney(calculations.totalMargeReal)}
                            </td>

                            <td className="px-6 py-4">
                               <input 
                                  type="number" 
                                  value={margeData.prev || ''} 
                                  onChange={e => setMargeData({...margeData, prev: parseFloat(e.target.value)||0})}
                                  className="w-full text-right bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 text-slate-500" 
                                  placeholder="0.00"
                               />
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">{formatMoney(calculations.diffMarge)}</td>
                            <td className="px-6 py-4 text-right font-bold text-amber-600">{formatMoney(calculations.ifuMarge)}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
                <div className="px-6 py-3 bg-amber-50 text-[10px] text-amber-800 italic border-t border-amber-100">
                   * Réservé aux contribuables commercialisant des produits à marge réglementée.
                </div>
             </div>
           )}

           {/* TOTAL BAR */}
           <div className="bg-slate-900 rounded-2xl px-8 py-6 flex justify-between items-center text-white shadow-lg">
              <div>
                 <span className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-1">TOTAL IFU COMPLÉMENTAIRE À PAYER</span>
                 <span className="text-[10px] text-slate-500">(Cumul Tableaux III & IV)</span>
              </div>
              <span className="text-3xl font-black">{formatMoney(calculations.totalComplementaire)} <span className="text-sm font-bold text-slate-500">DZD</span></span>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SECTION IV : REVENU NET */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm">IV</div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Détermination du Revenu Net</h2>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-700">Revenu net correspondant au Chiffre d'Affaire déclaré</label>
                       <div className="relative">
                          <div className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center px-4 font-mono text-xl font-bold text-slate-800">
                             {formatMoney(calculations.revenuNet)}
                          </div>
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">DZD</span>
                       </div>
                       <p className="text-[10px] text-slate-400 italic">Ce champ est obligatoire pour le calcul de l'assiette fiscale finale.</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden mt-4">
                       <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
                          <Calculator className="w-32 h-32" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solde à régulariser</p>
                       <p className="text-3xl font-black mb-4">{formatMoney(calculations.totalComplementaire)} <span className="text-sm font-normal text-slate-400">DZD</span></p>
                       <div className="flex items-center gap-2 text-[10px] bg-white/10 px-3 py-2 rounded-lg w-fit">
                          <Info className="w-3 h-3" /> Date limite de paiement : 20 Janvier
                       </div>
                    </div>
                 </div>
              </div>

              {/* SIGNATURE & VALIDATION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm"><FileText className="w-4 h-4" /></div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Signature & Validation</h2>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">Fait à</label>
                       <input 
                          type="text" 
                          value={validation.place} 
                          onChange={e => setValidation({...validation, place: e.target.value})}
                          className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-primary"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">Le</label>
                       <input 
                          type="date" 
                          value={validation.date} 
                          onChange={e => setValidation({...validation, date: e.target.value})}
                          className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-primary"
                       />
                    </div>
                 </div>

                 <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                       <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Cachet et Signature du Contribuable</p>
                    <p className="text-[10px] text-slate-400">Glissez-déposez un scan ou cliquez pour signer numériquement</p>
                 </div>

                 <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${validation.certified ? 'bg-primary border-primary text-white' : 'bg-white border-slate-300'}`}>
                       {validation.certified && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={validation.certified} onChange={e => setValidation({...validation, certified: e.target.checked})} />
                    <span className="text-xs text-slate-500 leading-snug group-hover:text-slate-700">Je certifie sous peine de sanctions légales l'exactitude des informations fournies dans ce tableau conformément aux registres comptables de l'entreprise.</span>
                 </label>
              </div>

           </div>

           {/* FOOTER ACTIONS */}
           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50">
              <div className="max-w-6xl mx-auto flex justify-between items-center">
                 <button onClick={() => handleSave('BROUILLON')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Sauvegarder Brouillon
                 </button>
                 <div className="flex gap-4">
                    <button onClick={() => setViewMode('OFFICIAL')} className="px-6 py-3 bg-white border border-primary text-primary rounded-xl text-xs font-bold hover:bg-primary/5 flex items-center gap-2">
                       <FileText className="w-4 h-4" /> Générer PDF Officiel
                    </button>
                    <button 
                       onClick={() => handleSave('VALIDÉ')} 
                       disabled={!validation.certified}
                       className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                       Valider et Transmettre <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>

        </div>
      </div>
    );
  }

  // --- VUE OFFICIELLE (PDF REPLICA) ---
  return (
    <div className="min-h-full bg-[#eef2f6] p-4 md:p-8 font-serif print:p-0 print:bg-white">
      {/* HEADER ACTIONS */}
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
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* PAGE A4 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full min-h-[297mm] p-[10mm] relative text-black font-sans box-border border-0 mb-8 leading-tight">
         
         {/* HEADER OFFICIEL */}
         <div className="text-center mb-4">
           <h1 className="text-lg font-bold font-serif leading-tight">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
           <h2 className="text-xs font-bold uppercase tracking-widest leading-tight">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
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
           <div className="w-[40mm] border-l border-black flex flex-col items-center justify-center p-1 bg-white">
              <div className="border border-black px-2 py-1 text-center mb-1">
                <p className="text-[10px] font-bold">Série G N°12 Bis (2025)</p>
              </div>
           </div>
        </div>

        {/* TITRE */}
        <div className="bg-[#f0fdf4] border border-black p-2 text-center mb-1 print:bg-[#f0fdf4]">
           <h2 className="text-sm font-bold uppercase">- REGIME DE L'IMPOT FORFAITAIRE UNIQUE (IFU) -</h2>
           <h1 className="text-lg font-black uppercase leading-tight">DECLARATION DEFINITIVE DU CHIFFRE D’AFFAIRES OU DES RECETTES PROFESSIONNELLES DE L’ANNEE : 2025</h1>
           <p className="text-[8px] font-bold">(Art 282 quater du CIDTA)</p>
           <p className="text-[10px] mt-1">Période du 01/01/2025 au 31/12/2025</p>
        </div>

        <div className="border border-black bg-white mb-1 p-1 text-center">
           <p className="text-[9px] font-bold">A souscrire auprès de la recette des impôts au plus tard le 20 janvier de l’année N+1</p>
        </div>

        {/* I - IDENTIFICATION */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb] flex justify-between">
              <h3 className="text-[10px] font-bold uppercase">I – IDENTIFICATION DU CONTRIBUABLE</h3>
              <h3 className="text-[10px] font-bold uppercase" dir="rtl">I- معلومات خاصة بالمكلف بالضريبة</h3>
           </div>
           <div className="p-2 space-y-1 text-[9px]">
              <div className="flex gap-2">
                 <span className="font-bold w-48">- Nom, Prénoms / Raison sociale :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black flex-1">{taxpayer?.dynamicData['1']}</span>
              </div>
              <div className="flex gap-2">
                 <span className="font-bold w-48">- Activité (s) exercée (s) :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black flex-1">{taxpayer?.dynamicData['7']}</span>
              </div>
              <div className="flex gap-2">
                 <span className="font-bold w-48">- Date du début d'activité :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black w-32">{taxpayer?.dynamicData['11'] || '...'}</span>
              </div>
              
              <div className="flex gap-2 mt-2">
                 <span className="font-bold">- Activité exonérée :</span>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-1"><div className="w-3 h-3 border border-black"></div> ANADE</label>
                    <label className="flex items-center gap-1"><div className="w-3 h-3 border border-black"></div> CNAC</label>
                    <label className="flex items-center gap-1"><div className="w-3 h-3 border border-black"></div> ANGEM</label>
                    <label className="flex items-center gap-1"><div className="w-3 h-3 border border-black"></div> Autres</label>
                 </div>
              </div>

              <div className="flex gap-2">
                 <span className="font-bold w-48">- Adresse du lieu d’exercice :</span>
                 <span className="font-bold uppercase border-b border-dotted border-black flex-1">{taxpayer?.dynamicData['adresse']}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-1">
                 <div><span className="font-bold">- NIF :</span> <span className="font-mono tracking-widest bg-slate-50 px-1 border border-black">{taxpayer?.dynamicData['2']}</span></div>
                 <div><span className="font-bold">- NIN :</span> <span className="font-mono tracking-widest border-b border-dotted border-black">{taxpayer?.dynamicData['nin']}</span></div>
                 <div><span className="font-bold">- Article :</span> <span className="font-mono tracking-widest border-b border-dotted border-black">{taxpayer?.dynamicData['article_imp']}</span></div>
                 <div><span className="font-bold">- Téléphone :</span> <span className="font-mono tracking-widest border-b border-dotted border-black">{taxpayer?.dynamicData['tel']}</span></div>
              </div>
           </div>
        </div>

        {/* II - SALAIRES */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb] flex justify-between">
              <h3 className="text-[10px] font-bold uppercase">II- VOLET RESERVE AUX SALAIRES</h3>
              <h3 className="text-[10px] font-bold uppercase" dir="rtl">II- إطار مخصص للأجور</h3>
           </div>
           <div className="p-2 space-y-1 text-[9px]">
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                 <span className="font-bold">- Nombre de salariés :</span>
                 <span className="font-mono font-bold">{salaryData.count}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                 <span className="font-bold">- Montant global brut des salaires versés * :</span>
                 <span className="font-mono font-bold text-right w-32">{formatMoney(salaryData.masseBrute)}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                 <span className="font-bold">- Montant des charges sociales versées * :</span>
                 <span className="font-mono font-bold text-right w-32">{formatMoney(salaryData.charges)}</span>
              </div>
              <div className="flex justify-between pb-0.5">
                 <span className="font-bold">- Montant annuel de l'IRG acquitté * :</span>
                 <span className="font-mono font-bold text-right w-32">{formatMoney(salaryData.irg)}</span>
              </div>
              <p className="text-[8px] italic">(*) Ces informations concernent l'année N</p>
           </div>
        </div>

        {/* III - CA DEFINITIFS - MODIFIÉ SELON PDF */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb] flex justify-between">
              <h3 className="text-[10px] font-bold uppercase">III- CHIFFRE D'AFFAIRES/RECETTES PROFESSIONNELLES DEFINITIFS (EN DA)</h3>
              <h3 className="text-[10px] font-bold uppercase" dir="rtl">III- رقم الأعمال/الإيرادات المهنية النهائي</h3>
           </div>
           <table className="w-full text-[8px] border-collapse">
              <thead>
                 <tr className="text-center font-bold">
                    <td className="border border-black p-1" rowSpan={2}>Nature de l'activité</td>
                    <td className="border border-black p-1" rowSpan={2}>Taux</td>
                    <td className="border border-black p-1" colSpan={3}>Chiffre d'affaires / Recettes Réalisés</td>
                    <td className="border border-black p-1" rowSpan={2}>CA Prévisionnel (2)</td>
                    <td className="border border-black p-1" rowSpan={2}>CA Complémentaire (3)</td>
                    <td className="border border-black p-1" rowSpan={2}>IFU Complémentaire (A)</td>
                 </tr>
                 <tr className="text-center font-bold">
                    <td className="border border-black p-1">Imposable</td>
                    <td className="border border-black p-1">Exonéré</td>
                    <td className="border border-black p-1">Global (1)</td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                    <td className="border border-black p-1 font-bold">Activités de production ou de vente</td>
                    <td className="border border-black p-1 text-center">5%</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.vente.realImp)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.vente.realExo)}</td>
                    <td className="border border-black p-1 text-right bg-gray-100 font-bold">{formatMoney(calculations.totalVenteReal)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.vente.prev)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(calculations.diffVente)}</td>
                    <td className="border border-black p-1 text-right font-bold">{formatMoney(calculations.ifuVente)}</td>
                 </tr>
                 <tr>
                    <td className="border border-black p-1 font-bold">Prestations de services</td>
                    <td className="border border-black p-1 text-center">12%</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.service.realImp)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.service.realExo)}</td>
                    <td className="border border-black p-1 text-right bg-gray-100 font-bold">{formatMoney(calculations.totalServiceReal)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.service.prev)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(calculations.diffService)}</td>
                    <td className="border border-black p-1 text-right font-bold">{formatMoney(calculations.ifuService)}</td>
                 </tr>
                 <tr>
                    <td className="border border-black p-1 font-bold">Auto-entrepreneur</td>
                    <td className="border border-black p-1 text-center">0,5%</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.auto.realImp)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.auto.realExo)}</td>
                    <td className="border border-black p-1 text-right bg-gray-100 font-bold">{formatMoney(calculations.totalAutoReal)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(caData.auto.prev)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(calculations.diffAuto)}</td>
                    <td className="border border-black p-1 text-right font-bold">{formatMoney(calculations.ifuAuto)}</td>
                 </tr>
                 <tr className="bg-slate-100 print:bg-slate-100">
                    <td colSpan={7} className="border border-black p-1 text-right font-bold">Total</td>
                    <td className="border border-black p-1 text-right font-black">{formatMoney(calculations.totalComplementaire)}</td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* IV - MARGE BENEFICIAIRE */}
        <div className="border border-black mb-1">
           <div className="bg-[#e5e7eb] border-b border-black p-1 print:bg-[#e5e7eb] flex justify-between">
              <h3 className="text-[10px] font-bold uppercase">IV- MARGE BENEFICIAIRE (EN DA)</h3>
              <h3 className="text-[10px] font-bold uppercase" dir="rtl">IV- هامش الربح</h3>
           </div>
           <table className="w-full text-[8px] border-collapse">
              <thead>
                 <tr className="text-center font-bold">
                    <td className="border border-black p-1" rowSpan={2}>Nature de l'activité</td>
                    <td className="border border-black p-1" rowSpan={2}>Taux</td>
                    <td className="border border-black p-1" colSpan={3}>Marge Réalisée</td>
                    <td className="border border-black p-1" rowSpan={2}>Marge Prévisionnelle (2)</td>
                    <td className="border border-black p-1" rowSpan={2}>Marge Complémentaire (3)</td>
                    <td className="border border-black p-1" rowSpan={2}>IFU Complémentaire (B)</td>
                 </tr>
                 <tr className="text-center font-bold">
                    <td className="border border-black p-1">Imposable</td>
                    <td className="border border-black p-1">Exonéré</td>
                    <td className="border border-black p-1">Global (1)</td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                    <td className="border border-black p-1 font-bold">Activités de production ou de vente (Marge)</td>
                    <td className="border border-black p-1 text-center">...</td>
                    <td className="border border-black p-1 text-right">{formatMoney(margeData.realImp)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(margeData.realExo)}</td>
                    <td className="border border-black p-1 text-right bg-gray-100 font-bold">{formatMoney(calculations.totalMargeReal)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(margeData.prev)}</td>
                    <td className="border border-black p-1 text-right">{formatMoney(calculations.diffMarge)}</td>
                    <td className="border border-black p-1 text-right font-bold">{formatMoney(calculations.ifuMarge)}</td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* TOTAL PAYER */}
        <div className="border border-black mb-2 p-1 flex justify-between items-center text-[10px] font-bold bg-[#e2efdb] print:bg-[#e2efdb]">
           <span>IFU A PAYER (A) + (B)</span>
           <span className="font-mono text-sm">{formatMoney(calculations.totalComplementaire)} DA</span>
        </div>
        
        {/* REVENU NET */}
        <div className="border border-black mb-2 p-1 flex justify-between items-center text-[9px]">
           <span className="font-bold">IV - REVENU NET CORRESPONDANT AU CHIFFRE D'AFFAIRES DECLARE (EN DA)</span>
           <span className="font-mono border-b border-dotted border-black w-32 text-right">{formatMoney(calculations.revenuNet)}</span>
        </div>

        {/* SIGNATURE */}
        <div className="flex border border-black min-h-[35mm] mb-2 text-[9px]">
           <div className="w-2/3 p-2 border-r border-black">
              <p className="font-bold mb-4">J'atteste de l'exactitude des renseignements portés sur la présente déclaration.</p>
              <div className="mt-8 flex justify-between">
                 <span>A {validation.place}, le {validation.date}</span>
                 <span className="font-bold mr-8">Cachet et signature du contribuable :</span>
              </div>
           </div>
           <div className="w-1/3 p-2 text-center">
               <p className="font-bold">Cadre réservé à l'administration</p>
           </div>
        </div>

        {/* TALON PAIEMENT */}
        <div className="border border-black p-2 text-[9px]">
           <p className="font-bold border-b border-black mb-2 text-center">PAIEMENT INTEGRAL DE L'IFU</p>
           <p>A ................................................., le .................................................</p>
           <div className="mt-2 text-center">
              <p className="font-bold">Montant total de l'IFU acquitté</p>
              <p className="my-1">En chiffres : ............................................... DA</p>
              <p>En lettres : ...................................................................................................................................................... DA</p>
           </div>
           <div className="flex justify-between mt-4">
              <p>Quittance N° .............................. du ..............................</p>
              <p className="font-bold">Cachet et signature du Caissier</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default GN12BisForm;
