
import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Printer,
  CheckCircle2,
  FileText,
  Building2,
  Users,
  Calculator,
  Coins,
  Briefcase
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

const CheckBox = ({ checked, label }: { checked: boolean, label: string }) => (
  <div className="flex items-center gap-1">
    <div className={`w-3 h-3 border border-black flex items-center justify-center ${checked ? 'bg-black' : 'bg-white'}`}>
      {checked && <div className="w-2 h-2 bg-black"></div>}
    </div>
    <span className="text-[8px] font-bold">{label}</span>
  </div>
);

const G11Form: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTab, setActiveTab] = useState<'IDENT' | 'TAP_TLS' | 'RESULTAT' | 'LIQUIDATION'>('IDENT');

  // --- STATE ---
  const [identData, setIdentData] = useState({
    nom: '',
    activite: '',
    dateDebut: '',
    rib: '',
    adresse: '',
    adresseDomicile: '',
    nif: '',
    article: '',
    nin: '',
    wilaya: '',
    cpiRattachement: '',
    exonerations: { anade: false, cnac: false, angem: false, artisanat: false, autres: false }
  });

  const [associates, setAssociates] = useState<any[]>([]);
  
  const [comptaData, setComptaData] = useState({
    cabinetName: '',
    cabinetAddress: '',
    cabinetNif: '',
    cabinetNin: ''
  });

  const [tapTlsData, setTapTlsData] = useState({
    tlsBaseSansRef: 0,
    tlsBaseAvecRef: 0,
    tlsExoAnade: 0,
    tlsExoAnsej: 0,
    tlsExoAngem: 0,
    tlsExoCnac: 0
  });

  const [fiscalData, setFiscalData] = useState({
    resultatComptable: 0,
    deductions: 0,
    reintegrations: 0,
    deficitsAnterieurs: 0,
    resultatExonere: 0
  });

  const [liquidationData, setLiquidationData] = useState({
    excedentAnterieur: 0,
    acompte1: 0,
    acompte2: 0
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    if (taxpayer) {
      setIdentData({
        nom: taxpayer.dynamicData['1'] || '',
        activite: taxpayer.dynamicData['7'] || '',
        dateDebut: taxpayer.dynamicData['11'] || '',
        rib: '', // Not in standard taxpayer model usually, strictly G11
        adresse: taxpayer.dynamicData['adresse'] || '',
        adresseDomicile: taxpayer.homeAddress || '',
        nif: taxpayer.dynamicData['2'] || '',
        article: taxpayer.dynamicData['article_imp'] || '',
        nin: taxpayer.dynamicData['nin'] || '',
        wilaya: taxpayer.wilaya || '',
        cpiRattachement: taxpayer.cpiRattachement || '',
        exonerations: taxpayer.exonerations || { anade: false, cnac: false, angem: false, artisanat: false, autres: false }
      });

      if (taxpayer.partners) {
        setAssociates(taxpayer.partners.map(p => ({
          name: p.name, share: p.share, address: p.address, nif: p.nif, nin: p.nin
        })));
      }
      
      if (taxpayer.accountant) {
          setComptaData({
              cabinetName: taxpayer.accountant.name,
              cabinetAddress: taxpayer.accountant.address,
              cabinetNif: taxpayer.accountant.nif,
              cabinetNin: taxpayer.accountant.nin
          });
      }
    }
    if (initialData && initialData.status !== 'BROUILLON') {
        setViewMode('OFFICIAL');
    }
  }, [taxpayer, initialData]);

  // --- CALCULATIONS ---
  const totals = useMemo(() => {
      // TLS
      const tlsTotalImposable = tapTlsData.tlsBaseSansRef + tapTlsData.tlsBaseAvecRef;
      const tlsTotalExonere = tapTlsData.tlsExoAnade + tapTlsData.tlsExoAnsej + tapTlsData.tlsExoAngem + tapTlsData.tlsExoCnac;
      const tlsTotalRealise = tlsTotalImposable + tlsTotalExonere;

      // Resultat
      const totalDeduc = fiscalData.deductions;
      const totalReint = fiscalData.reintegrations;
      const resultatFiscal = fiscalData.resultatComptable - totalDeduc - fiscalData.deficitsAnterieurs + totalReint;
      const resultatImposable = Math.max(0, resultatFiscal - fiscalData.resultatExonere);
      
      // Impot (Simulé barème IRG sur résultat imposable BIC)
      // Note: G11 is usually for determination of result, actual tax is paid via G50 or G1 for physical persons.
      // But G11 mentions "Impôt dû". Let's approximate.
      let impotDu = 0;
      if (resultatImposable > 0) {
          // Simple approximation for demo if IRG scale
          if (resultatImposable > 240000) impotDu = (resultatImposable - 240000) * 0.23; // Very rough
          // Or minimum
          if (impotDu < 10000) impotDu = 10000;
      }
      
      const totalAcomptes = liquidationData.excedentAnterieur + liquidationData.acompte1 + liquidationData.acompte2;
      const solde = impotDu - totalAcomptes;

      return {
          tlsTotalImposable, tlsTotalExonere, tlsTotalRealise,
          totalDeduc, totalReint, resultatFiscal, resultatImposable,
          impotDu, solde
      };
  }, [tapTlsData, fiscalData, liquidationData]);

  const formatMoney = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
      if (onSubmit) {
          onSubmit({
              id: initialData?.id || `G11-${Date.now()}`,
              type: 'Série G n°11 (Liasse BIC)',
              period: 'Exercice 2025',
              regime: 'RÉEL NORMAL',
              status: status,
              submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
              amount: totals.solde > 0 ? totals.solde : 0,
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
                       <h1 className="text-2xl font-black text-slate-900 tracking-tight">LIASSE FISCALE G11</h1>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bénéfices Industriels et Commerciaux (Réel)</p>
                    </div>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    {['IDENT', 'TAP_TLS', 'RESULTAT', 'LIQUIDATION'].map(tab => (
                       <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                          {tab === 'IDENT' ? 'Identification' : tab === 'TAP_TLS' ? 'TAP & TLS' : tab === 'RESULTAT' ? 'Résultat' : 'Liquidation'}
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
                         <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6"><Building2 className="w-6 h-6 text-primary" /> Identification</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div><label className="text-xs font-bold text-slate-500">Nom / Raison Sociale</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" value={identData.nom} onChange={e => setIdentData({...identData, nom: e.target.value})} /></div>
                             <div><label className="text-xs font-bold text-slate-500">Activité</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" value={identData.activite} onChange={e => setIdentData({...identData, activite: e.target.value})} /></div>
                             <div><label className="text-xs font-bold text-slate-500">NIF</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" value={identData.nif} onChange={e => setIdentData({...identData, nif: e.target.value})} /></div>
                             <div><label className="text-xs font-bold text-slate-500">RIB</label><input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" value={identData.rib} onChange={e => setIdentData({...identData, rib: e.target.value})} /></div>
                         </div>
                     </div>
                     <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                         <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6"><Users className="w-6 h-6 text-primary" /> Associés & Comptable</h2>
                         <div className="space-y-4">
                             {associates.map((assoc, i) => (
                                 <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                                     <span className="font-bold text-sm">{assoc.name}</span>
                                     <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-slate-300">{assoc.share}%</span>
                                 </div>
                             ))}
                             {associates.length === 0 && <p className="text-sm text-slate-400 italic">Aucun associé.</p>}
                         </div>
                         <div className="mt-6 pt-6 border-t border-slate-100">
                             <label className="text-xs font-bold text-slate-500 block mb-2">Cabinet Comptable</label>
                             <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" value={comptaData.cabinetName} onChange={e => setComptaData({...comptaData, cabinetName: e.target.value})} placeholder="Nom du cabinet" />
                         </div>
                     </div>
                 </div>
             )}

             {/* TAP & TLS */}
             {activeTab === 'TAP_TLS' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-orange-500" /> Taxe Locale de Solidarité</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div><label className="text-xs font-bold text-slate-500">Base Sans Réfaction</label><input type="number" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-right" value={tapTlsData.tlsBaseSansRef} onChange={e => setTapTlsData({...tapTlsData, tlsBaseSansRef: parseFloat(e.target.value)||0})} /></div>
                         <div><label className="text-xs font-bold text-slate-500">Base Avec Réfaction (30%)</label><input type="number" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-right" value={tapTlsData.tlsBaseAvecRef} onChange={e => setTapTlsData({...tapTlsData, tlsBaseAvecRef: parseFloat(e.target.value)||0})} /></div>
                     </div>
                     <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center">
                         <span className="text-sm font-bold text-orange-800">Total Imposable TLS</span>
                         <span className="text-xl font-black text-orange-900">{formatMoney(totals.tlsTotalImposable)} DA</span>
                     </div>
                 </div>
             )}

             {/* RESULTAT */}
             {activeTab === 'RESULTAT' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Calculator className="w-6 h-6 text-blue-600" /> Détermination du Résultat</h2>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                             <label className="text-sm font-bold text-slate-700">1. Résultat Comptable</label>
                             <input type="number" className="w-40 h-9 px-2 border border-slate-300 rounded text-right" value={fiscalData.resultatComptable} onChange={e => setFiscalData({...fiscalData, resultatComptable: parseFloat(e.target.value)||0})} />
                         </div>
                         <div className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                             <label className="text-sm font-bold text-slate-700">2. Déductions</label>
                             <input type="number" className="w-40 h-9 px-2 border border-slate-300 rounded text-right" value={fiscalData.deductions} onChange={e => setFiscalData({...fiscalData, deductions: parseFloat(e.target.value)||0})} />
                         </div>
                         <div className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                             <label className="text-sm font-bold text-slate-700">3. Déficits Antérieurs</label>
                             <input type="number" className="w-40 h-9 px-2 border border-slate-300 rounded text-right" value={fiscalData.deficitsAnterieurs} onChange={e => setFiscalData({...fiscalData, deficitsAnterieurs: parseFloat(e.target.value)||0})} />
                         </div>
                         <div className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                             <label className="text-sm font-bold text-slate-700">4. Réintégrations</label>
                             <input type="number" className="w-40 h-9 px-2 border border-slate-300 rounded text-right" value={fiscalData.reintegrations} onChange={e => setFiscalData({...fiscalData, reintegrations: parseFloat(e.target.value)||0})} />
                         </div>
                         <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                             <span className="text-sm font-bold text-blue-800">Résultat Fiscal</span>
                             <span className="text-xl font-black text-blue-900">{formatMoney(totals.resultatFiscal)} DA</span>
                         </div>
                     </div>
                 </div>
             )}

             {/* LIQUIDATION */}
             {activeTab === 'LIQUIDATION' && (
                 <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                     <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Briefcase className="w-6 h-6 text-green-600" /> Liquidation de l'Impôt</h2>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center p-2">
                             <span className="text-sm font-bold text-slate-700">Impôt Dû (Estimé)</span>
                             <span className="text-lg font-black text-slate-900">{formatMoney(totals.impotDu)} DA</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div><label className="text-xs font-bold text-slate-500">Excédent Antérieur</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={liquidationData.excedentAnterieur} onChange={e => setLiquidationData({...liquidationData, excedentAnterieur: parseFloat(e.target.value)||0})} /></div>
                             <div><label className="text-xs font-bold text-slate-500">Acompte 1</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={liquidationData.acompte1} onChange={e => setLiquidationData({...liquidationData, acompte1: parseFloat(e.target.value)||0})} /></div>
                             <div><label className="text-xs font-bold text-slate-500">Acompte 2</label><input type="number" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right" value={liquidationData.acompte2} onChange={e => setLiquidationData({...liquidationData, acompte2: parseFloat(e.target.value)||0})} /></div>
                         </div>
                         <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 ${totals.solde > 0 ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                             <span className="text-xs font-black uppercase tracking-widest">{totals.solde > 0 ? 'Solde à Payer' : 'Excédent'}</span>
                             <span className="text-4xl font-black tracking-tighter">{formatMoney(Math.abs(totals.solde))} DA</span>
                         </div>
                     </div>
                 </div>
             )}

          </div>

          {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:px-8 z-50 flex justify-between items-center shadow-lg">
              <div className="flex gap-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Résultat Fiscal : <span className="text-slate-900">{formatMoney(totals.resultatFiscal)} DA</span></span>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setViewMode('OFFICIAL')} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2"><Printer className="w-4 h-4" /> Aperçu</button>
                  <button onClick={() => handleSave('BROUILLON')} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"><Save className="w-4 h-4" /> Sauvegarder</button>
                  <button onClick={() => handleSave('VALIDÉ')} className="px-8 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Valider</button>
              </div>
          </div>
      </div>
  );

  // --- VUE OFFICIELLE (PAPIER) ---
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

       {/* PAGE 1 : IDENTIFICATION & TITRE */}
       <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[5mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight print:shadow-none print:m-0 print:break-after-page border-0">
           
           {/* HEADER DGI */}
           <div className="border-2 border-black bg-[#e2e8f0] mb-2">
              <div className="flex border-b border-black">
                 <div className="flex-1 text-center py-2 relative">
                    <h1 className="text-[12px] font-bold font-serif" dir="rtl">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
                    <div className="absolute right-0 top-0 h-full border-l border-black flex items-center px-2">
                       <span className="text-[10px] font-bold border-2 border-black px-1">Série G N°11 (2025)</span>
                    </div>
                 </div>
              </div>
              <div className="flex p-2 gap-4">
                 <div className="w-1/2 space-y-1 font-bold text-[9px]">
                    <p>MINISTERE DES FINANCES</p>
                    <p>Direction Générale des Impôts</p>
                    <div className="flex items-end"><span>DIW de ................................................................</span><span className="absolute ml-[35px] font-mono">{identData.wilaya}</span></div>
                    <div className="flex items-end"><span>Structure .............................................................</span><span className="absolute ml-[35px] font-mono">{identData.cpiRattachement}</span></div>
                 </div>
                 <div className="w-1/2 space-y-1 text-right font-bold text-[9px]" dir="rtl">
                    <p>وزارة المالية</p>
                    <p>المديرية العامة للضرائب</p>
                    <p>مديرية الضرائب لوالية.........................</p>
                    <p>مصلحة...........................................</p>
                 </div>
              </div>
              {/* NIF BLOCK */}
              <div className="border-t border-black p-2 space-y-2 bg-white">
                  <div className="flex items-center justify-center gap-2">
                      <span className="font-bold w-[200px] text-right">- Numéro d’Identification Fiscale (NIF):</span>
                      <GridInput value={identData.nif} length={15} />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                      <span className="font-bold w-[200px] text-right">- Numéro d’article d’imposition :</span>
                      <GridInput value={identData.article} length={11} />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                      <span className="font-bold w-[200px] text-right">- Numéro d’Identification National (NIN) :</span>
                      <GridInput value={identData.nin} length={18} />
                  </div>
              </div>
           </div>

           {/* TITRE PRINCIPAL */}
           <div className="text-center py-2 mb-2 bg-[#d1d5db] border-2 border-black">
               <h1 className="text-sm font-black uppercase mb-1">IMPOT SUR LE REVENU GLOBAL</h1>
               <h2 className="text-xs font-black uppercase mb-1">DECLARATION DES BENEFICES INDUSTRIELS ET COMMERCIAUX</h2>
               <p className="text-[9px] font-bold mb-1">(Régime du bénéfice réel)</p>
               <h3 className="text-xs font-black uppercase">TAXE LOCALE DE SOLIDARITE</h3>
               <div className="mt-1 font-bold text-[9px]">
                   Résultat de l’exercice : 20.. / Période d’imposition du .. / .. au .. / .. / 20..<br/>
                   Année de souscription 20……
               </div>
               <p className="text-[8px] mt-1 italic">(Art 18 et 231 septies du Code des Impôts Directs et Taxes Assimilées)</p>
           </div>

           {/* WARNING BOX */}
           <div className="border-2 border-black p-2 text-center font-bold text-[9px] bg-[#f3f4f6] mb-2">
               Déclaration à souscrire, au plus tard le 30 Avril de chaque année, auprès du CDI ou de l’Inspection des Impôts dont relève le lieu de l’exercice de l’activité
           </div>

           {/* I - IDENTIFICATION */}
           <div className="border-2 border-black mb-2">
               <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px]">I – IDENTIFICATION DE L’ENTREPRISE</div>
               <div className="p-2 space-y-1 text-[9px]">
                  <div className="flex gap-1 items-end"><span className="font-bold whitespace-nowrap">- Nom, Prénom/ Raison sociale :</span><span className="border-b border-dotted border-black flex-1 font-bold uppercase px-2">{identData.nom}</span></div>
                  <div className="flex gap-1 items-end"><span className="font-bold whitespace-nowrap">- Activité (s) exercée (s) :</span><span className="border-b border-dotted border-black flex-1 font-bold uppercase px-2">{identData.activite}</span></div>
                  <div className="flex gap-1 items-end"><span className="font-bold whitespace-nowrap">- Date du début d’activité :</span><span className="border-b border-dotted border-black flex-1 font-bold uppercase px-2">{identData.dateDebut}</span></div>
                  <div className="flex gap-1 items-end"><span className="font-bold whitespace-nowrap">- Numéro (s) de compte (s) bancaire (s) :</span><span className="border-b border-dotted border-black flex-1 font-bold uppercase px-2">{identData.rib}</span></div>
                  
                  <div className="flex gap-2 items-center mt-2">
                      <span className="font-bold whitespace-nowrap">- Activité exonérée :</span>
                      <div className="flex gap-4">
                          <CheckBox checked={identData.exonerations.anade} label="ANADE (NESDA )- ANSEJ" />
                          <CheckBox checked={identData.exonerations.cnac} label="CNAC" />
                          <CheckBox checked={identData.exonerations.angem} label="ANGEM" />
                          <CheckBox checked={identData.exonerations.autres} label="Autres exonérations" />
                      </div>
                  </div>

                  <div className="flex gap-1 items-end mt-2"><span className="font-bold whitespace-nowrap">- Adresse du lieu d’exercice de l‘activité :</span><span className="border-b border-dotted border-black flex-1 font-bold uppercase px-2">{identData.adresse}</span></div>
                  <div className="flex gap-1 items-end"><span className="font-bold whitespace-nowrap">- Adresse du domicile au 1er janvier :</span><span className="border-b border-dotted border-black flex-1 font-bold uppercase px-2">{identData.adresseDomicile}</span></div>
               </div>
           </div>

           {/* II - ASSOCIÉS */}
           <div className="border-2 border-black mb-2">
               <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px]">II – IDENTIFICATION DE OU DES PERSONNES IMPOSABLES (1)</div>
               <table className="w-full border-collapse text-[8px]">
                  <thead className="bg-gray-100">
                      <tr>
                          <th className="border border-black p-2 w-1/4">Nom et Prénom</th>
                          <th className="border border-black p-2 w-[10%]">Part des bénéfices (%)</th>
                          <th className="border border-black p-2 w-1/4">Adresse du domicile fiscal</th>
                          <th className="border border-black p-2">Numéro d’Identification Fiscale (NIF)</th>
                          <th className="border border-black p-2">Numéro d’Identification National (NIN)</th>
                      </tr>
                  </thead>
                  <tbody>
                     {associates.map((a, i) => (
                        <tr key={i} className="h-12">
                            <td className="border border-black p-1 align-bottom pb-2 font-bold">- {a.name}</td>
                            <td className="border border-black p-1 text-center align-bottom pb-2 font-bold">{a.share} %</td>
                            <td className="border border-black p-1 align-bottom pb-2">{a.address}</td>
                            <td className="border border-black p-1 align-middle"><GridInput value={a.nif} length={15} /></td>
                            <td className="border border-black p-1 align-middle"><GridInput value={a.nin} length={18} /></td>
                        </tr>
                     ))}
                     {/* Lignes vides si nécessaire */}
                     {[...Array(Math.max(0, 3 - associates.length))].map((_, i) => (
                        <tr key={`empty-${i}`} className="h-12">
                            <td className="border border-black p-1 align-bottom pb-2">- ........................................</td>
                            <td className="border border-black p-1 text-center align-bottom pb-2">..... %</td>
                            <td className="border border-black p-1 align-bottom pb-2">........................................</td>
                            <td className="border border-black p-1 align-middle"><GridInput value="" length={15} /></td>
                            <td className="border border-black p-1 align-middle"><GridInput value="" length={18} /></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               <div className="text-[7px] italic p-1 border-t border-black">
                   Si le cadre est insuffisant, joindre un état suivant le même modèle<br/>
                   (1) Pour les sociétés de personnes, il y a lieu de renseigner, pour chaque associé, les renseignements y relatifs.
               </div>
           </div>

           {/* III - COMPTABILITE */}
           <div className="border-2 border-black mb-1">
               <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px]">III –TENUE DE LA COMPTABILITE</div>
               <div className="p-2 space-y-2 text-[9px]">
                   <div className="flex gap-2 items-center">
                       <div className="w-4 h-4 border border-black"></div>
                       <span className="font-bold">Personnel salarié de l’entreprise</span>
                   </div>
                   <div className="flex gap-2 items-center">
                       <div className="w-4 h-4 border border-black"></div>
                       <span className="font-bold whitespace-nowrap">Cabinet de comptabilité ou d’expertise comptable :</span>
                       <span className="border-b border-dotted border-black flex-1 uppercase">{comptaData.cabinetName}</span>
                   </div>
                   <div className="flex gap-1 items-end">
                       <span className="font-bold whitespace-nowrap">- Adresse :</span>
                       <span className="border-b border-dotted border-black flex-1 uppercase">{comptaData.cabinetAddress}</span>
                   </div>
                   <div className="flex gap-4">
                       <div className="flex gap-2 items-center">
                           <span className="font-bold">- Numéro d’Identification Fiscale (NIF):</span>
                           <GridInput value={comptaData.cabinetNif} length={15} />
                       </div>
                       <div className="flex gap-2 items-center">
                           <span className="font-bold">- Numéro d’Identification National (NIN) :</span>
                           <GridInput value={comptaData.cabinetNin} length={18} />
                       </div>
                   </div>
               </div>
           </div>
       </div>

       {/* PAGE 2 */}
       <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[5mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight print:shadow-none print:m-0 print:break-after-page border-0 mt-4">
           
           {/* HEADER PAGE 2 */}
           <div className="bg-[#bfdbfe] border-2 border-black p-1 text-center font-bold text-[10px] mb-2">
               IV – VOLET RELATIF A LA TAXE SUR L’ACTIVITE PROFESSIONNELLE ET À LA TAXE LOCALE DE SOLIDARITE
           </div>

           {/* 1. TAP (Avec mention spécifique des exercices antérieurs) */}
           <div className="border-2 border-black mb-2">
               <div className="bg-gray-100 border-b border-black p-1 font-bold pl-2 text-[9px]">1.VOLET RELATIF A LA TAXE SUR L’ACTIVITE PROFESSIONNELLE</div>
               <div className="p-1 text-[8px] italic text-center font-bold">
                   (Ce volet est réservé exclusivement aux encaissements réalisés au cours des exercices 2024 et suivants, inhérents à des opérations réalisées antérieurement au 01 janvier 2024 et dont l’exigibilité de la TAP intervient à l’encaissement)
               </div>
               
               <table className="w-full border-collapse border-t border-black text-[9px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-r border-black p-1 font-bold text-center w-1/3">Nature des opérations</th>
                      <th className="border-r border-black p-1 font-bold text-center w-1/4">Montant brut encaissé</th>
                      <th className="border-r border-black p-1 font-bold text-center w-1/6">Taux de réfaction</th>
                      <th className="p-1 font-bold text-center">Montant des encaissements exonérés</th>
                    </tr>
                  </thead>
                  <tbody>
                     <tr className="h-6">
                       <td className="border-r border-b border-dotted border-black p-1">............................................................</td>
                       <td className="border-r border-b border-dotted border-black p-1 text-right">........................DA</td>
                       <td className="border-r border-b border-dotted border-black p-1 text-center">................%</td>
                       <td className="border-b border-dotted border-black p-1 text-right">................................................DA</td>
                     </tr>
                     <tr className="h-6">
                       <td className="border-r border-b border-black p-1">............................................................</td>
                       <td className="border-r border-b border-black p-1 text-right">........................DA</td>
                       <td className="border-r border-b border-black p-1 text-center">................%</td>
                       <td className="border-b border-black p-1 text-right">................................................DA</td>
                     </tr>
                     <tr className="bg-gray-50 font-bold">
                        <td className="border-r border-black p-1">TOTAL</td>
                        <td className="border-r border-black p-1 text-right">........................ DA</td>
                        <td className="border-r border-black p-1 text-center">/</td>
                        <td className="p-1 text-right">................................................DA</td>
                     </tr>
                  </tbody>
               </table>
               <div className="text-[7px] italic p-1 border-t border-black">Si le cadre est insuffisant, joindre un état suivant le même modèle.</div>
           </div>

           {/* 2. TLS / ACTIVITES MINIERES */}
           <div className="border-2 border-black mb-4">
               <div className="bg-gray-100 border-b border-black p-1 font-bold pl-2 text-[9px]">2. VOLET RELATIF A LA TAXE LOCALE DE SOLIDARITE/ACTIVITES MINIERES</div>
               
               <table className="w-full border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-r border-b border-black p-1 text-left w-2/3">CHIFFRE D’AFFAIRES</th>
                      <th className="border-b border-black p-1 text-center">MONTANT DU CHIFFRE D’AFFAIRES</th>
                    </tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td className="border-r border-b border-dotted border-black p-1">- Chiffre d’affaires ne bénéficiant pas de la réfaction : (1)</td>
                        <td className="border-b border-dotted border-black p-1 text-right">{formatMoney(tapTlsData.tlsBaseSansRef)}</td>
                     </tr>
                     <tr>
                        <td className="border-r border-b border-black p-1">- Chiffre d’affaires bénéficiant de la réfaction de 30% (Art. 231 ter – 2 du CIDTA) : (2)</td>
                        <td className="border-b border-black p-1 text-right">{formatMoney(tapTlsData.tlsBaseAvecRef)}</td>
                     </tr>
                     <tr className="bg-gray-100 font-bold">
                        <td className="border-r border-b border-black p-1 text-center">- Montant total du chiffre d’affaires [(1) + (2)] : (3)</td>
                        <td className="border-b border-black p-1 text-right">{formatMoney(totals.tlsTotalImposable)}</td>
                     </tr>
                     
                     <tr className="bg-gray-50">
                        <td className="border-r border-b border-black p-1 font-bold">OPERATIONS EXONEREES (Art 231 bis du CIDTA) :</td>
                        <td className="border-b border-black p-1 font-bold text-center">MONTANT DU CHIFFRE D’AFFAIRES</td>
                     </tr>
                     
                     <tr><td className="border-r border-b border-dotted border-black p-1 pl-4">- ANADE(NESDA)</td><td className="border-b border-dotted border-black p-1 text-right">{formatMoney(tapTlsData.tlsExoAnade)}</td></tr>
                     <tr><td className="border-r border-b border-dotted border-black p-1 pl-4">- ANSEJ</td><td className="border-b border-dotted border-black p-1 text-right">{formatMoney(tapTlsData.tlsExoAnsej)}</td></tr>
                     <tr><td className="border-r border-b border-dotted border-black p-1 pl-4">- ANGEM</td><td className="border-b border-dotted border-black p-1 text-right">{formatMoney(tapTlsData.tlsExoAngem)}</td></tr>
                     <tr><td className="border-r border-b border-black p-1 pl-4">- CNAC</td><td className="border-b border-black p-1 text-right">{formatMoney(tapTlsData.tlsExoCnac)}</td></tr>
                     
                     <tr className="bg-gray-100 font-bold">
                        <td className="border-r border-b border-black p-1 text-center">- Montant total du chiffre d’affaires exonéré (4)</td>
                        <td className="border-b border-black p-1 text-right">{formatMoney(totals.tlsTotalExonere)}</td>
                     </tr>
                     
                     <tr className="bg-gray-200 font-bold">
                        <td className="border-r border-black p-1 text-center">- Montant total du chiffre d’affaires réalisé [(3) + (4)]</td>
                        <td className="p-1 text-right">{formatMoney(totals.tlsTotalRealise)}</td>
                     </tr>
                  </tbody>
               </table>
           </div>

           {/* V - DETERMINATION RESULTAT */}
           <div className="border-2 border-black mb-2">
               <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px]">V –DETERMINATION DE LA BASE IMPOSABLE</div>
               <div className="p-2 text-[9px]">
                  <p className="font-bold underline mb-2">DETERMINATION DU RESULTAT FISCAL</p>
                  <div className="flex justify-between items-end border-b border-dotted border-black pb-1 mb-1">
                      <span>- Résultat comptable.......................................................................................................................... (1)</span>
                      <span className="font-mono">{formatMoney(fiscalData.resultatComptable)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-black pb-1 mb-1">
                      <span>- Total des déductions (Tableau 9)..................................... .............................................................. (2)</span>
                      <span className="font-mono">{formatMoney(totals.totalDeduc)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-black pb-1 mb-1">
                      <span>- Total des déficits à déduire (Tableau 9) ........................................................................................ (3)</span>
                      <span className="font-mono">{formatMoney(fiscalData.deficitsAnterieurs)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-black pb-1 mb-1">
                      <span>- Total des réintégrations (Tableau 9)..............................................................................................(4)</span>
                      <span className="font-mono">{formatMoney(totals.totalReint)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-black pb-1 mb-1 font-bold bg-gray-50">
                      <span>- Résultat fiscal [(1) – (2) – (3) + (4)] ............................................................................................... (5)</span>
                      <span className="font-mono">{formatMoney(totals.resultatFiscal)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dotted border-black pb-1 mb-1">
                      <span>- Résultat fiscal exonéré................................................................................................................... (6)</span>
                      <span className="font-mono">{formatMoney(fiscalData.resultatExonere)}</span>
                  </div>
                  <div className="flex justify-between items-end pb-1 font-bold">
                      <span className="w-full text-right pr-4">- Résultat imposable [(5)-(6)]</span>
                      <span className="font-mono border border-black px-2 bg-white">{formatMoney(totals.resultatImposable)}</span>
                  </div>
               </div>
           </div>

           {/* VI - LIQUIDATION */}
           <div className="border-2 border-black mb-4">
               <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px]">VI – DETERMINATION DU SOLDE DE LIQUIDATION/EXCEDENT DE VERSEMENT (*)</div>
               <table className="w-full border-collapse text-[9px]">
                  <thead className="bg-gray-100">
                     <tr><th className="border-r border-b border-black p-1 text-center">Désignation</th><th className="border-b border-black p-1 text-center w-1/4">Montant en DA</th></tr>
                  </thead>
                  <tbody>
                     <tr><td className="border-r border-b border-dotted border-black p-1">Excédent de versement antérieur........................................................................ (1)</td><td className="border-b border-dotted border-black p-1 text-right">{formatMoney(liquidationData.excedentAnterieur)}</td></tr>
                     <tr><td className="border-r border-b border-dotted border-black p-1 font-bold">Impôt dû (Le montant y afférent ne peut être inférieur à 10.000 DA)................(2)</td><td className="border-b border-dotted border-black p-1 text-right font-bold">{formatMoney(totals.impotDu)}</td></tr>
                     <tr><td className="border-r border-b border-dotted border-black p-1">1er acompte versé ..................................................................................................(3)</td><td className="border-b border-dotted border-black p-1 text-right">{formatMoney(liquidationData.acompte1)}</td></tr>
                     <tr><td className="border-r border-b border-black p-1">2éme acompte versé................................................................................................ (4)</td><td className="border-b border-black p-1 text-right">{formatMoney(liquidationData.acompte2)}</td></tr>
                     <tr className="bg-gray-100">
                         <td className="border-r border-b border-black p-1 font-bold text-center">Solde de liquidation [(2) - (1) - (3) - (4)]</td>
                         <td className="border-b border-black p-1 text-right font-black">{totals.solde >= 0 ? formatMoney(totals.solde) : ''}</td>
                     </tr>
                     <tr className="bg-gray-100">
                         <td className="border-r border-black p-1 font-bold text-center">Excédent de versement [(2) - (1) - (3) - (4)]</td>
                         <td className="p-1 text-right font-black">{totals.solde < 0 ? formatMoney(Math.abs(totals.solde)) : ''}</td>
                     </tr>
                  </tbody>
               </table>
           </div>

           {/* SIGNATURE */}
           <div className="flex items-start justify-between p-2 mt-4">
               <div className="w-1/2">
                   <p className="font-bold text-[9px] mb-2 text-center">J’atteste de l’exactitude des renseignements portés sur la présente déclaration</p>
                   <div className="text-center">
                       <p className="font-bold text-[10px]">A ....................................., le .............................</p>
                       <p className="font-bold text-[10px] mt-4">Cachet et signature du contribuable</p>
                   </div>
               </div>
               <div className="w-1/3"></div>
           </div>

           {/* PRECISIONS */}
           <div className="border-t-2 border-black mt-4 pt-2 text-[8px] text-justify leading-tight">
               <p className="mb-1"><span className="font-bold underline">PRECISIONS :</span> Les contribuables sont tenus de s’acquitter du solde résultant de la liquidation de l’IRG/BIC, sans avertissement préalable, par bordereau-avis de versement (G n°50), au plus tard le vingt (20) du mois qui suit la date limite pour la souscription de la déclaration série G n°11, le 20 mai en l’occurrence, et ce, auprès de la recette des impôts dont relève l’activité exercée.</p>
               <p className="mb-1">Les sommes versées, au titre de l’impôt dû, constituent un crédit d’impôt, qui s’imputera sur l’imposition devant être établie par les services dont relève le domicile fiscal.</p>
               <p><span className="font-bold">(*) Le volet « VI – DETERMINATION DU SOLDE DE LIQUIDATION/EXCEDENT DE VERSEMENT »</span> ne doit pas être renseigné par les sociétés de personnes dans la mesure où les associés sont personnellement recherchés pour le paiement de l’IRG, suivant la quote-part des bénéfices qui leur revient. En effet, le paiement des acomptes provisionnels et du solde de liquidation auprès de la recette des impôts dont relève le lieu de l’exercice de l’activité, incombe à ces associés, lesquels devront s’acquitter des droits dus par bordereau-avis de versement (G n°50).</p>
           </div>
       </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G11Form;
