
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Save, Printer, CheckCircle2, FileText, 
  Building2, User, Coins, MapPin, 
  Users, ScrollText, CreditCard, Briefcase, Globe,
  Plus, Trash2, Landmark, Share2, Calculator
} from 'lucide-react';
import { Declaration, Taxpayer } from '../types';

interface Props {
  taxpayer?: Taxpayer | null;
  onBack: () => void;
  onSubmit: (dec: Declaration) => void;
}

// Helper pour les grilles de saisie (NIF, Code Postal)
const GridInput = ({ value, length }: { value: string, length: number }) => {
  const safeValue = value || '';
  const cells = Array.from({ length });
  return (
    <div className="flex border-l border-t border-b border-black h-5 bg-white w-fit inline-flex align-middle">
      {cells.map((_, i) => (
        <div key={i} className="w-5 border-r border-black flex items-center justify-center text-[10px] font-mono font-bold leading-none">
          {safeValue[i] || ''}
        </div>
      ))}
    </div>
  );
};

const G17TerForm: React.FC<Props> = ({ taxpayer, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTab, setActiveTab] = useState<'PARTIES' | 'CIBLE' | 'CALCUL'>('PARTIES');
  
  // --- STATE ---
  
  // 1. Cédant (Société Étrangère - Non Résidente)
  const [cedant, setCedant] = useState({
    raisonSociale: '',
    adresse: '',
    pays: '',
    idFiscalEtranger: ''
  });

  // 2. Acquéreur (Acheteur)
  const [acquereur, setAcquereur] = useState({
    nom: '', // ou Raison Sociale
    adresse: '',
    pays: 'Algérie',
    nif: ''
  });

  // 3. Société Cible (Société Algérienne dont les titres sont cédés)
  const [societeCible, setSocieteCible] = useState({
    raisonSociale: '',
    nif: '',
    adresse: '',
    commune: '',
    wilaya: '',
    codePostal: ''
  });

  // 4. Titres & Calcul
  const [titres, setTitres] = useState({
    nature: 'ACTIONS' as 'ACTIONS' | 'PARTS_SOCIALES' | 'TITRES_PARTICIPATIFS' | 'AUTRES',
    nombre: 0,
    prixUnitaire: 0, // Pour info
    dateCession: '',
    originePropriete: 'SOUSCRIPTION'
  });

  const [financier, setFinancier] = useState({
    prixCessionGlobal: 0,
    prixAcquisitionGlobal: 0,
    fraisCession: 0
  });

  // --- EFFET DE CHARGEMENT (CONNEXION MODULE CONTRIBUABLE) ---
  useEffect(() => {
    if (taxpayer) {
       // Dans le contexte G17 Ter (Plus-values de cession par des non-résidents), 
       // le déclarant local (taxpayer) est généralement la Société Cible Algérienne 
       // qui effectue la retenue ou déclare la transaction.
       
       setSocieteCible(prev => ({
           ...prev,
           raisonSociale: taxpayer.dynamicData['1'] || '',
           nif: taxpayer.dynamicData['2'] || '',
           adresse: taxpayer.dynamicData['adresse'] || '',
           commune: taxpayer.commune || '',
           wilaya: taxpayer.wilaya || '',
           codePostal: '' // A remplir
       }));
    }
  }, [taxpayer]);

  // --- CALCULS ---
  const results = useMemo(() => {
    // A. Prix Cession Net
    // Note: Dans le G17 Ter officiel, on demande le "Prix de cession" (A) et "Prix d'acquisition" (B)
    // Les frais ne sont pas explicitement dans le tableau III, mais souvent déduits du A. 
    // Pour rester fidèle à la logique fiscale, on calcule la PV.
    
    // B. Plus-Value (A - B)
    const plusValue = Math.max(0, financier.prixCessionGlobal - financier.prixAcquisitionGlobal);
    
    // C. IBS Dû (20%)
    const taux = 20; 
    const impotDu = Math.round(plusValue * 0.20);

    return { plusValue, taux, impotDu };
  }, [financier]);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    onSubmit({
      id: `G17TER-${Math.floor(Math.random() * 10000)}`,
      type: 'Série G n°17 Ter (IBS Non-Résident)',
      period: 'Ponctuelle',
      regime: 'IBS',
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status,
      amount: results.impotDu,
      taxpayerName: cedant.raisonSociale || 'Société Étrangère'
    });
  };

  const formatMoney = (amount: number) => amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // --- WIZARD VIEW ---
  const renderWizard = () => (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col pb-32 font-sans">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
           <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
                  <div>
                     <h1 className="text-2xl font-black text-slate-900 tracking-tight">PLUS-VALUES DE CESSION (G17 TER)</h1>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sociétés Étrangères (IBS)</p>
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
            
            {/* Navigation Onglets */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {['PARTIES', 'CIBLE', 'CALCUL'].map(tab => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      {tab === 'PARTIES' ? 'Cédant & Acquéreurs' : tab === 'CIBLE' ? 'Titres & Société' : 'Calcul Plus-Value'}
                   </button>
                ))}
            </div>

            {/* TAB 1: PARTIES */}
            {activeTab === 'PARTIES' && (
                <div className="space-y-6">
                    {/* Cédant */}
                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Globe className="w-5 h-5" /></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Cédant (Compagnie Étrangère)</h2>
                                <p className="text-xs text-slate-500">Société non-résidente réalisant la plus-value</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Raison Sociale</label><input type="text" value={cedant.raisonSociale} onChange={e => setCedant({...cedant, raisonSociale: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Nom de l'entreprise étrangère" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Pays de Résidence</label><input type="text" value={cedant.pays} onChange={e => setCedant({...cedant, pays: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Adresse Siège Social</label><input type="text" value={cedant.adresse} onChange={e => setCedant({...cedant, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        </div>
                    </section>

                    {/* Acquéreur */}
                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><User className="w-5 h-5" /></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Acquéreur</h2>
                                <p className="text-xs text-slate-500">Personne physique ou morale achetant les titres</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nom / Raison Sociale</label><input type="text" value={acquereur.nom} onChange={e => setAcquereur({...acquereur, nom: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Adresse</label><input type="text" value={acquereur.adresse} onChange={e => setAcquereur({...acquereur, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 2: CIBLE & TITRES */}
            {activeTab === 'CIBLE' && (
                <div className="space-y-6">
                    {/* Société Cible */}
                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Landmark className="w-5 h-5" /></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Société Algérienne Cible</h2>
                                <p className="text-xs text-slate-500">Société dont les actions ou parts sociales sont cédées</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1"><label className="text-xs font-bold text-slate-500">NIF</label><input type="text" value={societeCible.nif} onChange={e => setSocieteCible({...societeCible, nif: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" placeholder="000..." /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Raison Sociale</label><input type="text" value={societeCible.raisonSociale} onChange={e => setSocieteCible({...societeCible, raisonSociale: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                             <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Siège Social (Adresse)</label><input type="text" value={societeCible.adresse} onChange={e => setSocieteCible({...societeCible, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Wilaya</label><input type="text" value={societeCible.wilaya} onChange={e => setSocieteCible({...societeCible, wilaya: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Code Postal</label><input type="text" value={societeCible.codePostal} onChange={e => setSocieteCible({...societeCible, codePostal: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        </div>
                    </section>

                    {/* Titres */}
                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Share2 className="w-5 h-5" /></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Titres Cédés</h2>
                                <p className="text-xs text-slate-500">Détails de la transaction</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nature des titres</label>
                                <select value={titres.nature} onChange={e => setTitres({...titres, nature: e.target.value as any})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <option value="ACTIONS">Actions</option>
                                    <option value="PARTS_SOCIALES">Parts Sociales</option>
                                    <option value="TITRES_PARTICIPATIFS">Titres Participatifs</option>
                                    <option value="AUTRES">Autres valeurs mobilières</option>
                                </select>
                            </div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nombre</label><input type="number" value={titres.nombre} onChange={e => setTitres({...titres, nombre: parseInt(e.target.value)||0})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Date de Cession</label><input type="date" value={titres.dateCession} onChange={e => setTitres({...titres, dateCession: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Origine Propriété</label><input type="text" value={titres.originePropriete} onChange={e => setTitres({...titres, originePropriete: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Ex: Souscription, Achat" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Prix Unitaire</label><input type="number" value={titres.prixUnitaire} onChange={e => setTitres({...titres, prixUnitaire: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 3: CALCUL */}
            {activeTab === 'CALCUL' && (
                <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Calculator className="w-5 h-5" /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Calculateur Financier</h2>
                            <p className="text-xs text-slate-500">Détermination de la base imposable et de l'IBS dû</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Prix de Cession Global (A)</label>
                                <input type="number" value={financier.prixCessionGlobal || ''} onChange={e => setFinancier({...financier, prixCessionGlobal: parseFloat(e.target.value)||0})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-lg" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Prix d'Acquisition (B)</label>
                                <input type="number" value={financier.prixAcquisitionGlobal || ''} onChange={e => setFinancier({...financier, prixAcquisitionGlobal: parseFloat(e.target.value)||0})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col justify-between shadow-xl">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold">Plus-Value</span>
                                    <span className="font-black text-green-400">{formatMoney(results.plusValue)} DA</span>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">IBS à retenir (20%)</p>
                                <p className="text-4xl font-black">{formatMoney(results.impotDu)} <span className="text-sm text-slate-400">DA</span></p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:px-8 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant IBS :</span>
               <span className="text-xl font-black text-slate-900 tracking-tighter">{formatMoney(results.impotDu)} DA</span>
            </div>
            <div className="flex gap-3">
                {activeTab !== 'PARTIES' && <button onClick={() => setActiveTab(prev => prev === 'CALCUL' ? 'CIBLE' : 'PARTIES')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50">Précédent</button>}
                {activeTab !== 'CALCUL' ? (
                   <button onClick={() => setActiveTab(prev => prev === 'PARTIES' ? 'CIBLE' : 'CALCUL')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">Suivant</button>
                ) : (
                   <button onClick={() => handleSave('VALIDÉ')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/30">
                      <CheckCircle2 className="w-4 h-4" /> Valider G17 Ter
                   </button>
                )}
            </div>
        </div>
    </div>
  );

  // --- OFFICIAL VIEW (SÉRIE G N°17 TER) ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-8 font-serif print:p-0 print:bg-white">
        
        {/* HEADER ACTIONS (Non imprimable) */}
        <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
          <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour aux données
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

        <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight border-0">
            
            {/* EN-TÊTE RÉPUBLIQUE */}
            <div className="text-center mb-4">
                <h1 className="text-[12px] font-bold font-serif" dir="rtl">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
                <h2 className="text-[10px] font-bold uppercase tracking-widest">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
            </div>

            <div className="flex justify-between items-start mb-4 border-b border-black pb-2">
                <div className="text-left font-bold text-[9px] space-y-1 w-1/2">
                    <p>MINISTERE DES FINANCES</p>
                    <p>Direction Générale des Impôts</p>
                    <p>DGE/DIW de : .............................................................</p>
                    <p>................................................................................................</p>
                    <p>Recette des Impôts de ................................................</p>
                </div>
                
                <div className="text-right font-bold text-[9px] space-y-1 w-1/2" dir="rtl">
                    <p>وزارة المالية</p>
                    <p>المديرية العامة للضرائب</p>
                    <p>مديرية كبريات المؤسسات/ مديرية الضرائب لولاية ..........................</p>
                    <p>مصلحة .................................................</p>
                </div>
                <div className="absolute right-[10mm] top-[20mm] border-2 border-black px-2 py-1 bg-gray-50 text-center">
                    <p className="font-bold text-[10px]">Série G N°17 Ter</p>
                </div>
            </div>

            {/* TITRE PRINCIPAL */}
            <div className="bg-[#dce6d5] border-2 border-black p-2 text-center mb-4 print:bg-[#dce6d5]">
                <h1 className="text-sm font-black uppercase">IMPOT SUR LES BENEFICES DES SOCIETES</h1>
                <h2 className="text-xs font-bold uppercase mt-1">Plus-Values de Cessions, à titre onéreux, d’actions, de parts sociales et titres assimilés, réalisées par les sociétés n’ayant pas d’installation professionnelle permanente en Algérie</h2>
                <p className="text-[8px] font-bold italic mt-1">(Art 149 bis du Code des Impôts Directs et Taxes Assimilées)</p>
            </div>

            {/* AVIS */}
            <div className="border-2 border-black p-2 text-center font-bold text-[10px] mb-4 bg-gray-50 rounded-xl">
                Déclaration tenant lieu de bordereau-avis de versement, à souscrire, dans un délai de trente (30) jours, à compter de la date de l’opération de cession, par les sociétés n’ayant pas d’installation professionnelle permanente en Algérie auprès de la recette des impôts de rattachement de la société dont les titres ont fait l’objet de cession.
            </div>

            {/* I - RENSEIGNEMENTS CONCERNANT LE CEDANT ET L'/LES ACQUEREUR (S) */}
            <div className="border-2 border-black mb-4">
                <div className="bg-[#dce6d5] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">I – RENSEIGNEMENTS CONCERNANT LE CEDANT ET L'/LES ACQUEREUR (S)</div>
                <div className="p-2 space-y-3 text-[9px]">
                    
                    {/* 1. CEDANT */}
                    <div>
                        <p className="font-bold underline mb-1 text-[10px]">1. Désignation du cédant (1) :</p>
                        <div className="pl-2 space-y-1">
                            <div className="flex"><span className="w-32 font-bold">- Raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{cedant.raisonSociale}</span></div>
                            <div className="flex"><span className="w-32 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{cedant.adresse}</span></div>
                            <div className="flex"><span className="w-full border-b border-dotted border-black"></span></div>
                             <div className="flex justify-end"><span className="font-bold mr-2">, Pays de résidence :</span> <span className="border-b border-dotted border-black w-48 uppercase">{cedant.pays}</span></div>
                        </div>
                    </div>

                    {/* 2. ACQUEREUR */}
                    <div className="border-t border-black pt-2">
                         <p className="font-bold underline mb-1 text-[10px]">2. Désignation de ou des acquéreur (s) (2):</p>
                        <div className="pl-2 space-y-2">
                             <div className="space-y-1">
                                <div className="flex"><span className="w-48 font-bold">- Nom, Prénom ou raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{acquereur.nom}</span></div>
                                <div className="flex"><span className="w-48 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{acquereur.adresse}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* II - DESIGNATION DES PARTS SOCIALES... */}
            <div className="border-2 border-black mb-4">
                <div className="bg-[#dce6d5] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">II – DESIGNATION DES PARTS SOCIALES, ACTIONS OU TITRES ASSIMILEES CEDES</div>
                <div className="p-2 space-y-2 text-[9px]">
                    <div className="flex"><span className="w-96 font-bold">- Raison sociale de la société dont les actions, les parts ou les titres sont cédés :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{societeCible.raisonSociale}</span></div>
                    <div className="flex"><span className="w-40 font-bold">- Adresse du siège social :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{societeCible.adresse}</span></div>
                    
                    <div className="flex gap-4">
                        <div className="flex flex-1"><span className="w-20 font-bold">Commune :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{societeCible.commune}</span></div>
                        <div className="flex flex-1"><span className="w-16 font-bold">Wilaya :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{societeCible.wilaya}</span></div>
                        <div className="flex items-center"><span className="font-bold mr-2">Code postal :</span> <GridInput value={societeCible.codePostal} length={5} /></div>
                    </div>
                    
                    <div className="flex items-center mt-1"><span className="font-bold mr-2">- Numéro d’Identification Fiscale (NIF) :</span> <GridInput value={societeCible.nif} length={15} /></div>
                    
                    <div className="flex"><span className="w-64 font-bold">- Titres assimilés (préciser leur nature) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.nature === 'AUTRES' ? 'AUTRES' : ''}</span></div>
                    <div className="flex"><span className="w-80 font-bold">- Nombre des parts sociales, actions ou titres cédés :</span> <span className="border-b border-dotted border-black flex-1 font-mono font-bold">{titres.nombre}</span></div>
                    <div className="flex"><span className="w-32 font-bold">- Prix unitaire (3):</span> <span className="border-b border-dotted border-black flex-1 font-mono">{formatMoney(titres.prixUnitaire)}</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Origine de la propriété (4) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.originePropriete}</span></div>
                    
                    <div className="flex mt-2"><span className="w-full border-b border-dotted border-black"></span></div>
                    <div className="flex"><span className="w-32 font-bold">- Date de cession :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.dateCession}</span></div>
                </div>
            </div>

            {/* III - ELEMENTS A DECLARER */}
             <div className="border-2 border-black mb-4">
                <div className="bg-[#dce6d5] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">III – ELEMENTS A DECLARER (5)</div>
                <table className="w-full border-collapse text-[9px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border-r border-b border-black p-1 w-2/3 text-center">Désignation</th>
                            <th className="border-b border-black p-1 text-center">Valeur en DA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border-r border-b border-black p-1 font-bold">- Prix de cession ou la juste valeur des actions, parts sociales ou titres assimilés (A)</td>
                            <td className="border-b border-black p-1 text-right font-mono">{formatMoney(financier.prixCessionGlobal)}</td>
                        </tr>
                         <tr>
                            <td className="border-r border-b border-black p-1 font-bold">- Prix d’acquisition ou de souscription des actions, parts sociales ou titres assimilés (B)</td>
                            <td className="border-b border-black p-1 text-right font-mono">{formatMoney(financier.prixAcquisitionGlobal)}</td>
                        </tr>
                        <tr>
                            <td className="border-r border-black p-1 font-bold text-right bg-gray-50">Plus-Value imposable (A-B) :</td>
                            <td className="border-black p-1 text-right font-black bg-gray-50">{formatMoney(results.plusValue)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* IV - MONTANT DE L'IMPOT A PAYER */}
             <div className="border-2 border-black mb-4">
                <div className="bg-[#dce6d5] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">IV – MONTANT DE L’IMPOT A PAYER</div>
                <table className="w-full border-collapse text-[9px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border-r border-b border-black p-1 w-1/2 text-center">Désignation</th>
                            <th className="border-b border-black p-1 text-center">Valeur en DA</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr>
                            <td className="border-r border-b border-black p-1 font-bold">- Plus-Value imposable</td>
                            <td className="border-b border-black p-1 text-right font-mono">{formatMoney(results.plusValue)}</td>
                        </tr>
                         <tr>
                            <td className="border-r border-b border-black p-1 font-bold">- Taux de l’impôt</td>
                             <td className="border-b border-black p-1 text-center flex justify-around items-center">
                                <span>20% <div className={`inline-block w-4 h-4 border border-black ml-1 ${results.taux === 20 ? 'bg-black' : 'bg-white'}`}></div></span>
                                <span>Exonéré <div className={`inline-block w-4 h-4 border border-black ml-1 ${results.taux === 0 ? 'bg-black' : 'bg-white'}`}></div></span>
                            </td>
                        </tr>
                        <tr>
                            <td className="border-r border-black p-1 font-bold text-right bg-gray-50">Montant à payer (6) :</td>
                            <td className="border-black p-1 text-right font-black bg-gray-50">{formatMoney(results.impotDu)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ATTESTATION */}
            <div className="border-2 border-black p-2 mb-4 bg-[#dce6d5] text-center">
                <p className="font-bold text-[11px] mb-2 uppercase">J’atteste de l’exactitude des renseignements portés sur la présente déclaration.</p>
                <div className="flex justify-between px-8 text-[10px] mt-4">
                    <p className="font-bold">A ..................................................., le ...................................................</p>
                    <p className="font-bold">Signature de l’intéressé (e)</p>
                </div>
                <div className="h-8"></div>
            </div>

            {/* CADRE RECETTE */}
            <div className="border-2 border-black bg-[#dce6d5]/50 min-h-[35mm]">
                <div className="text-center font-bold text-[10px] border-b-2 border-black p-1 mb-2 bg-[#dce6d5]">Cadre réservé à la Recette des Impôts</div>
                <div className="p-4 flex justify-between items-start text-[9px]">
                    <div>
                        <p>A ..................................................., le .................................................</p>
                        <p className="mt-4 font-bold">Montant payé en chiffres et en lettres :</p>
                        <p className="border-b border-dotted border-black w-64 h-4 mt-1"></p>
                        <p className="border-b border-dotted border-black w-64 h-4 mt-1"></p>
                        <p className="mt-4 font-bold">Quittance N° ................................. du .................................</p>
                    </div>
                    <div className="text-center w-1/3">
                        <p className="font-bold mb-8">Cachet et signature du Caissier</p>
                    </div>
                </div>
            </div>

            {/* NOTES BAS DE PAGE */}
            <div className="mt-4 text-[7px] space-y-0.5 leading-tight border-t border-black pt-1">
                <p><strong>(1)</strong> Les sociétés étrangères peuvent désigner un mandataire dûment habilité pour accomplir les formalités de déclaration et de paiement.</p>
                <p><strong>(2)</strong> A joindre un état reprenant lesdits renseignements, s’il y a plus de trois (03) acquéreurs.</p>
                <p><strong>(3)</strong> S’il existe plusieurs valeurs, il y a lieu de joindre un état détaillé faisant ressortir, pour chaque catégorie d’actions, parts sociales ou titres, le nombre et le prix unitaire y afférents.</p>
                <p><strong>(4)</strong> Préciser l’origine de la propriété (souscription, capitalisation des bénéfices, achat de titres, ...).</p>
                <p><strong>(5)</strong> L’administration fiscale se réserve le droit de réévaluer les valeurs déclarées, conformément à la législation fiscale en vigueur.</p>
                <p><strong>(6)</strong> Les montants dus doivent être arrondis au dinar supérieur pour les fractions égales ou supérieures à cinquante (50) centimes. Les fractions inférieures à cinquante (50) centimes sont négligées.</p>
            </div>

        </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G17TerForm;
