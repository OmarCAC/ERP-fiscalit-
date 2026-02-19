import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Save, Printer, CheckCircle2, FileText,
  Briefcase, Calculator, Coins, Users, Building2,
  Trash2, Plus, ArrowRight
} from 'lucide-react';
import { Declaration, Taxpayer, Partner } from '../types';

interface Props {
  taxpayer?: Taxpayer | null;
  initialData?: Declaration | null;
  onBack: () => void;
  onSubmit?: (declaration: Declaration) => void;
}

// Helper components
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

const formatCurrency = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const G13Form: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTab, setActiveTab] = useState<'IDENT' | 'RECETTES' | 'DEPENSES' | 'RESULTAT' | 'LIQUIDATION'>('IDENT');

  // --- STATE ---
  const [identData, setIdentData] = useState({
    nom: '', activite: '', dateDebut: '', telephone: '', adresse: '', adresseDomicile: '',
    commune: '', wilaya: '', nif: '', article: '', nin: '', exoneration: 'AUCUNE'
  });
  const [associates, setAssociates] = useState<Partner[]>([]);

  const [recettes, setRecettes] = useState<{[key: string]: number}>({
    r01: 0, r02: 0, r03: 0, r05: 0, r06: 0
  });

  const [depenses, setDepenses] = useState<{[key: string]: number}>({
    d08: 0, d09: 0, d10: 0, d11: 0, d12: 0, d13: 0, d14: 0, d15: 0, d16: 0, d17: 0, d18: 0, d19: 0,
    d20: 0, d21: 0, d22: 0, d23: 0, d24: 0, d25: 0, d26: 0, d27: 0, d28: 0, d29: 0
  });

  const [resultatData, setResultatData] = useState({
    gainCession: 0, deficitAnterieur: 0, beneficeExonere: 0
  });

  const [liquidation, setLiquidation] = useState({
    excedentAnterieur: 0, acompte1: 0, acompte2: 0
  });

  const [assets, setAssets] = useState<any[]>([]);
  const [capitalGains, setCapitalGains] = useState<any[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (taxpayer) {
      setIdentData({
        nom: taxpayer.dynamicData['1'] || '',
        activite: taxpayer.dynamicData['7'] || '',
        dateDebut: taxpayer.dynamicData['11'] || '',
        telephone: taxpayer.dynamicData['tel'] || '',
        adresse: taxpayer.dynamicData['adresse'] || '',
        adresseDomicile: taxpayer.homeAddress || '',
        commune: taxpayer.commune || '',
        wilaya: taxpayer.wilaya || '',
        nif: taxpayer.dynamicData['2'] || '',
        article: taxpayer.dynamicData['article_imp'] || '',
        nin: taxpayer.dynamicData['nin'] || '',
        exoneration: taxpayer.exonerations.anade ? 'ANADE' : taxpayer.exonerations.cnac ? 'CNAC' : taxpayer.exonerations.angem ? 'ANGEM' : 'AUCUNE'
      });
      if (taxpayer.partners) setAssociates(taxpayer.partners);
    }
    if (initialData && initialData.status !== 'BROUILLON') {
        setViewMode('OFFICIAL');
    }
  }, [taxpayer, initialData]);

  // --- CALCULATIONS ---
  const connexions = useMemo(() => {
    const recettesBrutes = Number(recettes.r01 || 0);
    const recettesNettes = Number(recettes.r01 || 0) - (Number(recettes.r02 || 0) + Number(recettes.r03 || 0));
    const totalRecettes_I = recettesNettes + Number(recettes.r05 || 0) + Number(recettes.r06 || 0);

    // Explicitly typing arguments for reduce to ensure number arithmetic
    const totalDepenses_II = (Object.values(depenses) as number[]).reduce((a: number, b: number) => a + b, 0);

    const diff = totalRecettes_I - totalDepenses_II;
    const excedent = diff > 0 ? diff : 0;
    const insuffisance = diff < 0 ? Math.abs(diff) : 0;

    // Simulation PV (Usually calculated from capitalGains array)
    const pvCourtTerme = capitalGains
      .filter((c: any) => c.nature === 'Court terme')
      .reduce((acc: number, curr: any) => {
        const price = Number(curr.price || 0);
        const value = Number(curr.value || 0);
        return acc + (price - value);
      }, 0);
    
    const pvLongTerme = capitalGains
      .filter((c: any) => c.nature === 'Long terme')
      .reduce((acc: number, curr: any) => {
        const price = Number(curr.price || 0);
        const value = Number(curr.value || 0);
        return acc + (price - value);
      }, 0);

    const total_III = Number(excedent) + Number(pvCourtTerme) + Number(pvLongTerme) + Number(resultatData.gainCession || 0);
    
    // Amortissements (from assets)
    const amortissements = assets.reduce((acc: number, curr: any) => {
      const val = Number(curr.value || 0);
      const rate = Number(curr.rate || 0);
      return acc + (val * rate / 100);
    }, 0);
    
    const total_IV = Number(insuffisance) + Number(amortissements) + Number(resultatData.deficitAnterieur || 0);

    const diffFinal = total_III - total_IV;
    const beneficeImposable = diffFinal > 0 ? diffFinal : 0;
    const deficit = diffFinal < 0 ? Math.abs(diffFinal) : 0;

    // Impôt dû (IRG Barème simulation)
    let impotDu = 0;
    if (beneficeImposable > 240000) impotDu = (beneficeImposable - 240000) * 0.23; // Rough approximation
    impotDu = Math.max(10000, impotDu);

    const soldeAPayer = Math.max(0, impotDu - (Number(liquidation.excedentAnterieur || 0) + Number(liquidation.acompte1 || 0) + Number(liquidation.acompte2 || 0)));
    const excedentVersement = Math.max(0, (Number(liquidation.excedentAnterieur || 0) + Number(liquidation.acompte1 || 0) + Number(liquidation.acompte2 || 0)) - impotDu);

    return {
        recettesBrutes, recettesNettes, totalRecettes_I, totalDepenses_II,
        excedent, insuffisance, pvCourtTerme, pvLongTerme,
        total_III, amortissements, total_IV,
        beneficeImposable, deficit, impotDu,
        soldeAPayer, excedentVersement
    };
  }, [recettes, depenses, resultatData, liquidation, assets, capitalGains]);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
      if (onSubmit) {
          onSubmit({
              id: initialData?.id || `G13-${Date.now()}`,
              type: 'Série G n°13 (Liasse BNC)',
              period: 'Exercice 2025',
              regime: 'RÉEL SIMPLIFIÉ',
              status: status,
              submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
              amount: connexions.soldeAPayer,
              taxpayerName: identData.nom
          });
      }
  };

  // --- RENDER WIZARD ---
  const renderWizard = () => (
      <div className="min-h-full bg-[#f6f7f8] flex flex-col pb-32">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
             <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                       <h1 className="text-2xl font-black text-slate-900 tracking-tight">LIASSE FISCALE G13</h1>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bénéfices Non Commerciaux (BNC)</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setViewMode('OFFICIAL')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2"><Printer className="w-4 h-4" /> Aperçu</button>
                    <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"><Save className="w-4 h-4" /> Sauvegarder</button>
                    <button onClick={() => handleSave('VALIDÉ')} className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Valider</button>
                </div>
             </div>
          </div>

          <div className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             
             {/* TABS */}
             <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                {['IDENT', 'RECETTES', 'DEPENSES', 'RESULTAT', 'LIQUIDATION'].map(tab => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                   >
                      {tab}
                   </button>
                ))}
             </div>

             {/* IDENTIFICATION */}
             {activeTab === 'IDENT' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Briefcase className="w-6 h-6 text-primary" /> Identification</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div><label className="text-xs font-bold text-slate-500">Nom / Raison Sociale</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" value={identData.nom} readOnly /></div>
                         <div><label className="text-xs font-bold text-slate-500">Activité</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" value={identData.activite} readOnly /></div>
                         <div><label className="text-xs font-bold text-slate-500">NIF</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" value={identData.nif} readOnly /></div>
                         <div><label className="text-xs font-bold text-slate-500">Exonération</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" value={identData.exoneration} readOnly /></div>
                     </div>
                 </div>
             )}

             {/* RECETTES */}
             {activeTab === 'RECETTES' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-green-600" /> Recettes Professionnelles</h2>
                     <div className="grid grid-cols-1 gap-4">
                         <div><label className="text-xs font-bold text-slate-500">01. Recettes Brutes</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={recettes.r01} onChange={e => setRecettes({...recettes, r01: parseFloat(e.target.value)||0})} /></div>
                         <div><label className="text-xs font-bold text-slate-500">02. Débours</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={recettes.r02} onChange={e => setRecettes({...recettes, r02: parseFloat(e.target.value)||0})} /></div>
                         <div><label className="text-xs font-bold text-slate-500">03. Honoraires Rétrocédés</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={recettes.r03} onChange={e => setRecettes({...recettes, r03: parseFloat(e.target.value)||0})} /></div>
                         <div className="p-4 bg-green-50 rounded-xl flex justify-between"><span className="font-bold text-green-800">Recettes Nettes</span><span className="font-black text-green-900">{formatCurrency(connexions.recettesNettes)} DA</span></div>
                     </div>
                 </div>
             )}

             {/* DEPENSES */}
             {activeTab === 'DEPENSES' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Calculator className="w-6 h-6 text-red-600" /> Dépenses Professionnelles</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-slate-500">Loyers (11)</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={depenses.d11} onChange={e => setDepenses({...depenses, d11: parseFloat(e.target.value)||0})} /></div>
                         <div><label className="text-xs font-bold text-slate-500">Salaires Nets (20)</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={depenses.d20} onChange={e => setDepenses({...depenses, d20: parseFloat(e.target.value)||0})} /></div>
                         <div><label className="text-xs font-bold text-slate-500">Charges Sociales (21)</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={depenses.d21} onChange={e => setDepenses({...depenses, d21: parseFloat(e.target.value)||0})} /></div>
                         <div><label className="text-xs font-bold text-slate-500">Impôts et Taxes (23+24)</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={depenses.d23} onChange={e => setDepenses({...depenses, d23: parseFloat(e.target.value)||0})} /></div>
                         <div className="col-span-2"><label className="text-xs font-bold text-slate-500">Autres Dépenses (29)</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={depenses.d29} onChange={e => setDepenses({...depenses, d29: parseFloat(e.target.value)||0})} /></div>
                     </div>
                     <div className="p-4 bg-red-50 rounded-xl flex justify-between"><span className="font-bold text-red-800">Total Dépenses</span><span className="font-black text-red-900">{formatCurrency(connexions.totalDepenses_II)} DA</span></div>
                 </div>
             )}

             {/* RESULTAT */}
             {activeTab === 'RESULTAT' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-blue-600" /> Résultat Fiscal</h2>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl"><span className="text-sm font-bold">Total Recettes</span><span>{formatCurrency(connexions.totalRecettes_I)}</span></div>
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl"><span className="text-sm font-bold">Total Dépenses</span><span>{formatCurrency(connexions.totalDepenses_II)}</span></div>
                         <div className="h-px bg-slate-200 my-2"></div>
                         <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                             <span className="font-bold text-blue-800">Bénéfice Imposable</span>
                             <span className="text-xl font-black text-blue-900">{formatCurrency(connexions.beneficeImposable)} DA</span>
                         </div>
                     </div>
                 </div>
             )}

             {/* LIQUIDATION */}
             {activeTab === 'LIQUIDATION' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-indigo-600" /> Liquidation de l'Impôt</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div><label className="text-xs font-bold text-slate-500">Impôt Dû (Estimé)</label><input className="w-full h-10 px-3 bg-indigo-50 border border-indigo-100 rounded-lg text-right font-bold" value={formatCurrency(connexions.impotDu)} readOnly /></div>
                         <div><label className="text-xs font-bold text-slate-500">Acomptes versés</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={liquidation.acompte1} onChange={e => setLiquidation({...liquidation, acompte1: parseFloat(e.target.value)||0})} /></div>
                     </div>
                     <div className="p-6 bg-slate-900 rounded-2xl text-white text-center mt-4">
                         <p className="text-xs font-black uppercase tracking-widest opacity-60">Solde à Payer</p>
                         <p className="text-4xl font-black tracking-tighter">{formatCurrency(connexions.soldeAPayer)} DA</p>
                     </div>
                 </div>
             )}

          </div>
      </div>
  );

  // --- RENDER OFFICIAL (PDF REPLICA) ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-4 md:p-8 font-serif print:p-0 print:bg-white">
       {/* HEADER ACTIONS */}
       <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
         <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
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

       {/* PAGE 1 */}
       <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[5mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight print:shadow-none print:m-0 print:break-after-page border-0">
          
          {/* HEADER DGI */}
          <div className="text-center mb-2">
             <h1 className="text-[12px] font-bold font-serif" dir="rtl">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
             <h2 className="text-[10px] font-bold uppercase tracking-widest">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
          </div>
          
          <div className="flex border-b-2 border-black pb-2 mb-2">
             <div className="w-1/2 text-left text-[9px] font-bold">
                <p>MINISTERE DES FINANCES</p>
                <p>Direction Générale des Impôts</p>
                <p>DIW de ................................................................</p>
                <p>Structure .............................................................</p>
             </div>
             <div className="w-1/2 text-right text-[9px] font-bold" dir="rtl">
                <p>وزارة المالية</p>
                <p>المديرية العامة للضرائب</p>
                <p>مديرية الضرائب لوالية..............................</p>
                <p>مصلحة.................................................</p>
             </div>
             <div className="absolute right-[5mm] top-[5mm] text-right font-bold text-[10px]">Série G N°13 / 2023</div>
          </div>

          <div className="text-center border-2 border-black p-2 mb-2 bg-[#d1d5db]">
             <h1 className="text-sm font-black uppercase">IMPOT SUR LE REVENU GLOBAL</h1>
             <h2 className="text-xs font-bold">Déclaration des bénéfices des professions non commerciales</h2>
             <p className="text-[9px]">(Régime simplifié des professions non commerciales)</p>
             <p className="text-[9px] font-bold mt-1">Année de souscription 20...... / Résultat de l’année 20......</p>
             <p className="text-[8px] italic">(Art 31 bis du Code des Impôts Directs et Taxes Assimilées)</p>
          </div>

          <div className="border-2 border-black p-2 text-center font-bold mb-2">
             Déclaration à souscrire au plus tard le trente (30) Avril de chaque année, auprès du CDI ou de l’inspection des impôts dont relève le lieu de l’exercice de la profession du contribuable
          </div>

          <div className="border-2 border-black mb-1">
             <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px]">I – IDENTIFICATION DU CONTRIBUABLE</div>
             <div className="p-2 space-y-1">
                <div className="font-bold underline mb-1">1. Désignation du contribuable :</div>
                <div className="flex"><span className="w-48 font-bold">- Nom et Prénom ou dénomination :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{identData.nom}</span></div>
                <div className="flex"><span className="w-48 font-bold">- Date de naissance :</span> <span className="border-b border-dotted border-black flex-1">...................................................................................................</span></div>
                <div className="flex gap-4">
                   <div className="flex flex-1"><span className="font-bold">- Téléphone :</span> <span className="border-b border-dotted border-black flex-1">{identData.telephone}</span></div>
                   <div className="flex flex-1"><span className="font-bold">Fax :</span> <span className="border-b border-dotted border-black flex-1">....................</span></div>
                   <div className="flex flex-1"><span className="font-bold">Email :</span> <span className="border-b border-dotted border-black flex-1">....................</span></div>
                </div>
                <div className="flex"><span className="w-48 font-bold">- Numéro du compte : Bancaire</span> <span className="border-b border-dotted border-black flex-1">.................................................</span> <span className="font-bold mx-2">Postal</span> <span className="border-b border-dotted border-black flex-1">.................................................</span></div>
                
                <div className="flex mt-1"><span className="w-48 font-bold">- Nature de la profession:</span> <span className="border-b border-dotted border-black flex-1 uppercase">{identData.activite}</span></div>
                <div className="flex"><span className="w-48 font-bold">- Lieu de l’exercice de la profession :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{identData.adresse}</span></div>
                <div className="flex"><span className="w-48 font-bold">- Date de début de la profession :</span> <span className="border-b border-dotted border-black flex-1">{identData.dateDebut}</span></div>
                
                <div className="flex gap-4 mt-1 items-center">
                   <span className="font-bold underline">- Profession exonérée :</span>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 border border-black flex items-center justify-center">{identData.exoneration === 'ANADE' ? 'X' : ''}</div> ANADE (Ex-ANSEJ)</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 border border-black flex items-center justify-center">{identData.exoneration === 'CNAC' ? 'X' : ''}</div> CNAC</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 border border-black flex items-center justify-center">{identData.exoneration === 'ANGEM' ? 'X' : ''}</div> ANGEM</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 border border-black flex items-center justify-center">{identData.exoneration === 'AUCUNE' ? '' : identData.exoneration === 'AUTRES' ? 'X' : ''}</div> Autres exonérations</div>
                   </div>
                </div>

                <div className="flex mt-1"><span className="font-bold">- Lieu des établissements secondaires :</span> <span className="border-b border-dotted border-black flex-1">..........................................................................</span></div>
                
                <div className="mt-2">
                   <span className="font-bold">- Adresse du Domicile au 1er janvier :</span> <span className="border-b border-dotted border-black">{identData.adresseDomicile}</span>
                   <div className="flex gap-4 mt-1">
                      <span className="font-bold">Commune :</span> <span className="border-b border-dotted border-black w-32">{identData.commune}</span>
                      <span className="font-bold">Wilaya :</span> <span className="border-b border-dotted border-black w-32">{identData.wilaya}</span>
                      <span className="font-bold">Code postal :</span> <GridInput value="" length={5} />
                   </div>
                </div>

                {/* TALON BOTTOM PAGE 1 */}
                <div className="border-t-2 border-black pt-2 mt-4">
                   <div className="flex justify-between items-center text-[10px] font-bold px-2">
                       <div className="flex items-center gap-2"><span>- Numéro d’Identification Fiscale (NIF):</span> <GridInput value={identData.nif} length={15} /></div>
                       <div className="flex items-center gap-2"><span>- Numéro d’article d’imposition :</span> <GridInput value={identData.article} length={11} /></div>
                   </div>
                   <div className="flex justify-center items-center gap-2 text-[10px] font-bold px-2 mt-2">
                       <span>- Numéro d’identification national (NIN):</span> <GridInput value={identData.nin} length={18} />
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* PAGE 2 */}
       <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[5mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight print:shadow-none print:m-0 print:break-after-page border-0 mt-4">
          
          <div className="border-2 border-black mb-4">
             <div className="bg-gray-100 border-b-2 border-black p-1 text-center font-bold">III– ELEMENTS SERVANT A LA DETERMINATION DE LA BASE IMPOSABLE</div>
             
             {/* A. RECETTES */}
             <table className="w-full border-collapse">
                 <thead>
                     <tr className="bg-gray-200 border-b border-black">
                         <th className="border-r border-black p-1 text-left w-2/3 underline">A.RECETTES PROFESSIONNELLES</th>
                         <th className="p-1 text-center">Montant en DA</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr><td className="border-r border-black border-b border-black p-1 font-bold">- Recettes brutes professionnelles :</td><td className="border-b border-black p-1 text-right font-mono">{formatCurrency(recettes.r01)}</td></tr>
                     <tr><td className="border-r border-black border-b border-black p-1 font-bold">- Recettes à déduire :</td><td className="border-b border-black p-1 text-right font-mono">{formatCurrency(recettes.r02 + recettes.r03)}</td></tr>
                     <tr className="bg-gray-100"><td className="border-r border-black border-b border-black p-1 text-center font-black">Total Recettes (I) :</td><td className="border-b border-black p-1 text-right font-black">{formatCurrency(connexions.totalRecettes_I)}</td></tr>
                 </tbody>
             </table>

             {/* B. DEPENSES */}
             <table className="w-full border-collapse border-t-2 border-black">
                 <thead>
                     <tr className="bg-gray-200 border-b border-black">
                         <th className="border-r border-black p-1 text-left w-2/3 underline">B. DEPENSES PROFESSIONNELLES</th>
                         <th className="p-1 text-center">Montant en DA</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr><td className="border-r border-black p-2 font-bold">Total Dépenses (II)</td><td className="p-1 text-right font-mono align-middle">{formatCurrency(connexions.totalDepenses_II)}</td></tr>
                 </tbody>
             </table>

             {/* C. RESULTAT */}
             <table className="w-full border-collapse border-t-2 border-black">
                 <thead>
                     <tr className="bg-gray-200 border-b border-black">
                         <th className="border-r border-black p-1 text-left w-2/3 underline">C. RESULTAT FISCAL</th>
                         <th className="p-1 text-center">Montant en DA</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr><td className="border-r border-black border-b border-black p-1 font-bold text-center">- Bénéfice imposable :</td><td className="border-b border-black p-1 text-right font-mono">{formatCurrency(connexions.beneficeImposable)}</td></tr>
                     <tr><td className="border-r border-black p-1 font-bold text-center">- Déficit :</td><td className="p-1 text-right font-mono">{formatCurrency(connexions.deficit)}</td></tr>
                 </tbody>
             </table>
          </div>

          {/* IV - LIQUIDATION */}
          <div className="border-2 border-black mb-4">
              <div className="bg-gray-200 border-b-2 border-black p-1 text-center font-bold">IV-DETERMINATION DU SOLDE</div>
              <table className="w-full border-collapse">
                  <tbody>
                      <tr><td className="border-r border-black border-b border-black p-1 font-bold w-2/3">Impôt dû :</td><td className="border-b border-black p-1 text-right font-mono">{formatCurrency(connexions.impotDu)}</td></tr>
                      <tr><td className="border-r border-black border-b border-black p-1 font-bold">Total Acomptes :</td><td className="border-b border-black p-1 text-right font-mono">{formatCurrency(Number(liquidation.excedentAnterieur || 0) + Number(liquidation.acompte1 || 0) + Number(liquidation.acompte2 || 0))}</td></tr>
                      <tr className="bg-gray-100">
                          <td className="border-r border-black p-1 text-center font-black">Solde à Payer :</td>
                          <td className="p-1 text-right font-black">{connexions.soldeAPayer > 0 ? formatCurrency(connexions.soldeAPayer) : '-'}</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <div className="flex justify-between px-8 min-h-[40mm]">
              <div className="text-center w-1/3">
                  <p className="mb-8">A ......................................., le .......................................</p>
                  <p className="font-bold">Signature du contribuable</p>
              </div>
          </div>
       </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G13Form;