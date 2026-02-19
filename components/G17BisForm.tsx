import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Save, Printer, CheckCircle2, FileText, 
  Building2, User, Coins, MapPin, 
  Users, ScrollText, CreditCard, Briefcase, Globe,
  Plus, Trash2
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

const G17BisForm: React.FC<Props> = ({ taxpayer, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTab, setActiveTab] = useState<'PARTIES' | 'TITRES' | 'CALCUL'>('PARTIES');
  
  // --- STATE DONNÉES ---
  
  // 1. Cédant (Vendeur)
  const [cedant, setCedant] = useState({
    nom: '',
    prenom: '',
    nif: '',
    nin: '',
    adresse: '',
    commune: '',
    wilaya: '',
    codePostal: '',
    residence: 'RESIDENT' as 'RESIDENT' | 'NON_RESIDENT'
  });

  // 2. Acquéreur(s) (Acheteur) - Multiples
  const [acquereurs, setAcquereurs] = useState([
    { id: '1', nom: '', adresse: '', nif: '' }
  ]);

  const addAcquereur = () => {
    if (acquereurs.length < 3) {
      setAcquereurs([...acquereurs, { id: Date.now().toString(), nom: '', adresse: '', nif: '' }]);
    }
  };

  const removeAcquereur = (id: string) => {
    if (acquereurs.length > 1) {
      setAcquereurs(acquereurs.filter(a => a.id !== id));
    }
  };

  const updateAcquereur = (id: string, field: string, value: string) => {
    setAcquereurs(acquereurs.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // 3. Désignation des Titres
  const [titres, setTitres] = useState({
    societe: '', // Société émettrice
    adresseSiege: '',
    commune: '',
    wilaya: '',
    codePostal: '',
    nifSociete: '',
    nature: 'ACTIONS' as 'ACTIONS' | 'PARTS_SOCIALES' | 'TITRES_PARTICIPATIFS' | 'AUTRES',
    nombre: 0,
    prixUnitaire: 0,
    dateCession: '',
    originePropriete: 'SOUSCRIPTION' as 'SOUSCRIPTION' | 'ACHAT' | 'SUCCESSION' | 'DONATION',
    reinvestissement: false // Optionnel
  });

  // 4. Financier
  const [financier, setFinancier] = useState({
    prixCessionUnitaire: 0,
    prixAcquisitionUnitaire: 0,
    fraisCession: 0, // Droits et taxes acquittés
    tauxImposition: 15 // Défaut
  });

  // --- EFFET DE CHARGEMENT (CONNEXION MODULE CONTRIBUABLE) ---
  useEffect(() => {
    if (taxpayer) {
        const rawName = taxpayer.dynamicData['1'] || '';
        let nom = rawName;
        let prenom = '';
        
        // Tentative de séparation Nom/Prénom si c'est une personne physique
        if (taxpayer.typeContribuable === 'PHYSIQUE' && rawName.includes(' ')) {
            const parts = rawName.split(' ');
            nom = parts[0];
            prenom = parts.slice(1).join(' ');
        }

        setCedant(prev => ({
            ...prev,
            nom: nom,
            prenom: prenom,
            nif: taxpayer.dynamicData['2'] || '',
            nin: taxpayer.dynamicData['nin'] || '',
            adresse: taxpayer.dynamicData['adresse'] || '',
            commune: taxpayer.commune || '',
            wilaya: taxpayer.wilaya || '',
            codePostal: '', // A remplir manuellement
            // Si le contribuable a une adresse locale, on présume résident par défaut
            residence: 'RESIDENT'
        }));
    }
  }, [taxpayer]);

  // --- AUTO-SELECTION TAUX ---
  useEffect(() => {
     let newTaux = 15;
     if (cedant.residence === 'NON_RESIDENT') newTaux = 20;
     else if (titres.reinvestissement) newTaux = 5;
     
     setFinancier(prev => ({...prev, tauxImposition: newTaux}));
  }, [cedant.residence, titres.reinvestissement]);

  // --- CALCULS ---
  const results = useMemo(() => {
    // 1. Valeurs Globales
    const prixCessionGlobal = titres.nombre * financier.prixCessionUnitaire;
    const prixAcquisitionGlobal = titres.nombre * financier.prixAcquisitionUnitaire;

    // 2. Prix de Cession Net
    const prixCessionNet = Math.max(0, prixCessionGlobal - financier.fraisCession);

    // 3. Plus-Value Dégagée (Brute)
    const plusValueDegagee = prixCessionNet - prixAcquisitionGlobal;

    // 4. Calcul Impôt
    const plusValueImposable = Math.max(0, plusValueDegagee);
    
    // Taux appliqué (Manuel ou Auto)
    const tauxApplique = financier.tauxImposition;
    
    const impotDu = Math.round(plusValueImposable * (tauxApplique / 100));
    
    return {
        prixCessionGlobal,
        prixAcquisitionGlobal,
        prixCessionNet,
        plusValueDegagee,
        plusValueImposable,
        tauxApplique,
        impotDu,
        montantAPayer: impotDu
    };
  }, [financier, titres]);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    onSubmit({
      id: `G17BIS-${Math.floor(Math.random() * 10000)}`,
      type: 'Série G n°17 Bis (Plus-Values Actions)',
      period: 'Ponctuelle',
      regime: 'IRG',
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status,
      amount: results.montantAPayer,
      taxpayerName: `${cedant.nom} ${cedant.prenom}`
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
                     <h1 className="text-2xl font-black text-slate-900 tracking-tight">PLUS-VALUES VALEURS MOBILIÈRES (G17 BIS)</h1>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cession d'Actions & Parts Sociales</p>
                  </div>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setViewMode('OFFICIAL')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2">
                      <Printer className="w-4 h-4" /> Aperçu
                  </button>
                  <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Sauvegarder
                  </button>
                  <button onClick={() => handleSave('VALIDÉ')} className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Valider
                  </button>
              </div>
           </div>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Onglets */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                  {['PARTIES', 'TITRES', 'CALCUL'].map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        {tab === 'PARTIES' ? 'Parties' : tab === 'TITRES' ? 'Titres' : 'Calcul IRG'}
                     </button>
                  ))}
            </div>

            {/* TAB 1: PARTIES */}
            {activeTab === 'PARTIES' && (
                <div className="space-y-6">
                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><User className="w-6 h-6 text-primary" /> 1. Désignation du Cédant</h2>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setCedant({...cedant, residence: 'RESIDENT'})} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${cedant.residence === 'RESIDENT' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Résident</button>
                                <button onClick={() => setCedant({...cedant, residence: 'NON_RESIDENT'})} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${cedant.residence === 'NON_RESIDENT' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Non-Résident</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nom</label><input type="text" value={cedant.nom} onChange={e => setCedant({...cedant, nom: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Prénom</label><input type="text" value={cedant.prenom} onChange={e => setCedant({...cedant, prenom: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">NIF</label><input type="text" value={cedant.nif} onChange={e => setCedant({...cedant, nif: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">NIN</label><input type="text" value={cedant.nin} onChange={e => setCedant({...cedant, nin: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" /></div>
                            <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Adresse</label><input type="text" value={cedant.adresse} onChange={e => setCedant({...cedant, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Commune</label><input type="text" value={cedant.commune} onChange={e => setCedant({...cedant, commune: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Wilaya</label><input type="text" value={cedant.wilaya} onChange={e => setCedant({...cedant, wilaya: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Users className="w-6 h-6 text-green-600" /> 2. Désignation de l'Acquéreur</h2>
                            {acquereurs.length < 3 && (
                                <button onClick={addAcquereur} className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/5 px-2 py-1 rounded"><Plus className="w-3 h-3" /> Ajouter</button>
                            )}
                        </div>
                        
                        <div className="space-y-6">
                            {acquereurs.map((acq, index) => (
                                <div key={acq.id} className="relative p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    {index > 0 && <button onClick={() => removeAcquereur(acq.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                                    <h3 className="text-xs font-black text-slate-400 uppercase mb-3">Acquéreur {index + 1}</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500">Nom, Prénom ou Raison Sociale</label><input type="text" value={acq.nom} onChange={e => updateAcquereur(acq.id, 'nom', e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg" /></div>
                                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500">Adresse</label><input type="text" value={acq.adresse} onChange={e => updateAcquereur(acq.id, 'adresse', e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg" /></div>
                                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500">NIF (Si disponible)</label><input type="text" value={acq.nif} onChange={e => updateAcquereur(acq.id, 'nif', e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg font-mono" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 2: TITRES */}
            {activeTab === 'TITRES' && (
                <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Briefcase className="w-6 h-6 text-indigo-600" /> Désignation des Titres Cédés</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Raison sociale de la société cible</label><input type="text" value={titres.societe} onChange={e => setTitres({...titres, societe: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">NIF de la société</label><input type="text" value={titres.nifSociete} onChange={e => setTitres({...titres, nifSociete: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" /></div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Nature des titres</label>
                            <select value={titres.nature} onChange={e => setTitres({...titres, nature: e.target.value as any})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <option value="ACTIONS">Actions</option>
                                <option value="PARTS_SOCIALES">Parts Sociales</option>
                                <option value="TITRES_PARTICIPATIFS">Titres Participatifs</option>
                                <option value="AUTRES">Autres valeurs mobilières</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Origine de la propriété</label>
                            <select value={titres.originePropriete} onChange={e => setTitres({...titres, originePropriete: e.target.value as any})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <option value="SOUSCRIPTION">Souscription au capital (Création)</option>
                                <option value="ACHAT">Acquisition à titre onéreux (Achat)</option>
                                <option value="SUCCESSION">Succession (Héritage)</option>
                                <option value="DONATION">Donation</option>
                            </select>
                        </div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nombre de parts/actions</label><input type="number" value={titres.nombre} onChange={e => setTitres({...titres, nombre: parseInt(e.target.value)||0})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Date de cession</label><input type="date" value={titres.dateCession} onChange={e => setTitres({...titres, dateCession: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        
                        <div className="col-span-2 pt-2">
                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                <input type="checkbox" checked={titres.reinvestissement} onChange={e => setTitres({...titres, reinvestissement: e.target.checked})} className="w-5 h-5 text-primary rounded" />
                                <div>
                                    <span className="block text-sm font-bold text-slate-700">Engagement de réinvestissement</span>
                                    <span className="text-[10px] text-slate-400">Ouvre droit à un taux réduit de 5% (Résidents uniquement)</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </section>
            )}

            {/* TAB 3: CALCUL */}
            {activeTab === 'CALCUL' && (
                <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-blue-600" /> Éléments de Calcul</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cession */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-slate-400 border-b pb-2">Prix de Cession</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Prix de cession unitaire (DA)</label>
                                <input type="number" value={financier.prixCessionUnitaire || ''} onChange={e => setFinancier({...financier, prixCessionUnitaire: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right font-bold" />
                            </div>
                            <div className="p-2 bg-slate-50 rounded text-right text-xs font-mono">Total Cession: {formatMoney(results.prixCessionGlobal)} DA</div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Montant des droits et taxes acquittés</label>
                                <input type="number" value={financier.fraisCession || ''} onChange={e => setFinancier({...financier, fraisCession: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right text-red-600" />
                            </div>
                        </div>

                        {/* Acquisition */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-slate-400 border-b pb-2">Coût d'Acquisition</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Prix d'acquisition unitaire (DA)</label>
                                <input type="number" value={financier.prixAcquisitionUnitaire || ''} onChange={e => setFinancier({...financier, prixAcquisitionUnitaire: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right font-bold" />
                            </div>
                             <div className="p-2 bg-slate-50 rounded text-right text-xs font-mono">Total Acquisition: {formatMoney(results.prixAcquisitionGlobal)} DA</div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <h3 className="text-sm font-black text-slate-700 uppercase">Taux d'Imposition</h3>
                        <div className="flex flex-wrap gap-2">
                           {[
                               { val: 15, label: '15% (Standard)' },
                               { val: 5, label: '5% (Réinvestissement)' },
                               { val: 20, label: '20% (Non-Résident)' },
                               { val: 0, label: 'Exonéré' }
                           ].map(t => (
                               <button 
                                 key={t.val} 
                                 onClick={() => setFinancier({...financier, tauxImposition: t.val})}
                                 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${financier.tauxImposition === t.val ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                               >
                                  {t.label}
                               </button>
                           ))}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-lg mt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-300">Plus-Value Imposable</span>
                            <span className="text-xl font-bold">{formatMoney(results.plusValueImposable)} DA</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-300">
                             <span className="text-xs font-bold">Taux appliqué</span>
                             <span className="text-sm font-bold">{results.tauxApplique} %</span>
                        </div>
                        <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                            <span className="text-lg font-black text-white">IMPÔT À PAYER</span>
                            <span className="text-3xl font-black text-white">{formatMoney(results.montantAPayer)} DA</span>
                        </div>
                    </div>
                </section>
            )}
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:px-8 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant à Payer :</span>
               <span className="text-xl font-black text-slate-900 tracking-tighter">{formatMoney(results.montantAPayer)} DA</span>
            </div>
            <div className="flex gap-3">
                {activeTab !== 'PARTIES' && <button onClick={() => setActiveTab(prev => prev === 'CALCUL' ? 'TITRES' : 'PARTIES')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50">Précédent</button>}
                {activeTab !== 'CALCUL' ? (
                   <button onClick={() => setActiveTab(prev => prev === 'PARTIES' ? 'TITRES' : 'CALCUL')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">Suivant</button>
                ) : (
                   <button onClick={() => handleSave('VALIDÉ')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/30">
                      <CheckCircle2 className="w-4 h-4" /> Valider G17 Bis
                   </button>
                )}
            </div>
        </div>
    </div>
  );

  // --- OFFICIAL VIEW (SÉRIE G N°17 BIS) ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-4 md:p-8 font-serif print:p-0 print:bg-white">
        
        {/* HEADER ACTIONS (Non imprimable) - MISE À JOUR AVEC LE STYLE G13 */}
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

        <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[8mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight border-0">
            
            {/* EN-TÊTE */}
            <div className="text-center mb-2">
                <h1 className="text-[12px] font-bold font-serif" dir="rtl">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
                <h2 className="text-[10px] font-bold uppercase tracking-widest">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
            </div>

            <div className="flex justify-between items-start mb-2 border-b border-black pb-2">
                <div className="text-left font-bold text-[9px] space-y-1 w-1/2">
                    <p>MINISTERE DES FINANCES</p>
                    <p>Direction Générale des Impôts</p>
                    <p>DGE/DIW de ................................................................</p>
                    <p>Structure .............................................................</p>
                </div>
                
                <div className="text-right font-bold text-[9px] space-y-1 w-1/2" dir="rtl">
                    <p>وزارة المالية</p>
                    <p>المديرية العامة للضرائب</p>
                    <p>مديرية كبريات المؤسسات/ مديرية الضرائب لولاية ..........................</p>
                    <p>مصلحة .................................................</p>
                </div>
                <div className="absolute right-[10mm] top-[20mm] border-2 border-black px-2 py-1 bg-gray-50 text-center">
                    <p className="font-bold text-[10px]">Série G N° 17 Bis</p>
                </div>
            </div>

            {/* TITRE */}
            <div className="bg-[#bfdbfe] border-2 border-black p-2 text-center mb-3 print:bg-[#bfdbfe]">
                <h1 className="text-sm font-black uppercase">IMPOT SUR LE REVENU GLOBAL</h1>
                <h2 className="text-xs font-bold uppercase mt-1">Plus-Values de Cessions, à titre onéreux, d'actions, de parts sociales et de titres assimilés, réalisées par :</h2>
                <div className="flex justify-around items-center mt-1">
                   <div className="flex items-center gap-2">
                      <span>Personne physique résidente</span>
                      <div className={`w-4 h-4 border-2 border-black flex items-center justify-center`}>{cedant.residence === 'RESIDENT' ? 'X' : ''}</div>
                   </div>
                   <div className="flex items-center gap-2">
                      <span>Personne physique non-résidente</span>
                      <div className={`w-4 h-4 border-2 border-black flex items-center justify-center`}>{cedant.residence === 'NON_RESIDENT' ? 'X' : ''}</div>
                   </div>
                </div>
                <p className="text-[8px] font-bold italic mt-1">(Art 80-2 du Code des Impôts Directs et Taxes Assimilées)</p>
            </div>
            
            <div className="border border-black p-2 mb-3 bg-[#e5e7eb] rounded-lg">
                <p className="text-[9px] font-bold leading-tight">Déclaration tenant lieu de bordereau-avis de versement, à souscrire, dans un délai de trente (30) jours à compter de la date de l'opération de cession, selon le cas, auprès de la recette des impôts dont relève :</p>
                <ul className="list-disc pl-6 mt-1 text-[9px] font-bold">
                    <li>le lieu de résidence du cédant,</li>
                    <li>le siège social de la société dont les titres ont fait l'objet de cession, lorsque le cédant n'est pas domicilié en Algérie.</li>
                </ul>
            </div>

            {/* SECTION I */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">I – RENSEIGNEMENTS CONCERNANT LE CEDANT ET L'/LES ACQUEREUR (S)</div>
                <div className="p-2 space-y-3 text-[9px]">
                    
                    {/* CEDANT */}
                    <div>
                        <p className="font-bold underline mb-1 text-[10px]">1. Désignation du cédant (1) :</p>
                        <div className="pl-2 space-y-1">
                            <div className="flex"><span className="w-32 font-bold">- Nom, Prénom :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{cedant.nom} {cedant.prenom}</span></div>
                            <div className="flex"><span className="w-32 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{cedant.adresse}</span></div>
                            <div className="flex gap-4">
                                <div className="flex flex-1"><span className="w-20 font-bold">Commune :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{cedant.commune}</span></div>
                                <div className="flex flex-1"><span className="w-16 font-bold">Wilaya :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{cedant.wilaya}</span></div>
                                <div className="flex items-center"><span className="font-bold mr-2">Code postal :</span> <GridInput value={cedant.codePostal} length={5} /></div>
                            </div>
                            <div className="flex gap-8 mt-2">
                                <div className="flex items-center"><span className="font-bold mr-2">- Numéro d’Identification Fiscale (NIF) (2) :</span> <GridInput value={cedant.nif} length={15} /></div>
                            </div>
                            <div className="flex items-center mt-1"><span className="font-bold mr-2">- Numéro d'Identification Nationale (NIN) :</span> <span className="border-b border-dotted border-black flex-1 font-mono tracking-widest">{cedant.nin}</span></div>
                        </div>
                    </div>

                    {/* ACQUEREUR */}
                    <div className="border-t border-black pt-2">
                        <p className="font-bold underline mb-1 text-[10px]">2. Désignation de ou des acquéreur (s) (3):</p>
                        <div className="pl-2 space-y-2">
                            {acquereurs.map((acq, index) => (
                                <div key={acq.id} className="space-y-1 mb-2">
                                    <div className="flex"><span className="w-48 font-bold">- Nom, Prénom ou raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{acq.nom}</span></div>
                                    <div className="flex"><span className="w-48 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{acq.adresse}</span></div>
                                    {index === 0 && (
                                        <>
                                           <div className="flex"><span className="w-48 font-bold">- Nom, Prénom ou raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold"></span></div>
                                           <div className="flex"><span className="w-48 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase"></span></div>
                                           <div className="flex"><span className="w-48 font-bold">- Nom, Prénom ou raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold"></span></div>
                                           <div className="flex"><span className="w-48 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase"></span></div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* SECTION II */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">II – DESIGNATION DES ACTIONS, PARTS SOCIALES OU TITRES ASSIMILEES CEDES</div>
                <div className="p-2 space-y-1 text-[9px]">
                    <div className="flex"><span className="w-64 font-bold">- Raison sociale de la société dont les actions, les parts ou les titres sont cédés :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{titres.societe}</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Adresse du siège social :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.adresseSiege}</span></div>
                    
                    <div className="flex gap-4">
                        <div className="flex flex-1"><span className="w-20 font-bold">Commune :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.commune}</span></div>
                        <div className="flex flex-1"><span className="w-16 font-bold">Wilaya :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.wilaya}</span></div>
                        <div className="flex items-center"><span className="font-bold mr-2">Code postal :</span> <GridInput value={titres.codePostal} length={5} /></div>
                    </div>
                    
                    <div className="flex items-center mt-2 mb-2"><span className="font-bold mr-2">- Numéro d'Identification Fiscale (NIF) :</span> <GridInput value={titres.nifSociete} length={15} /></div>
                    
                    <div className="flex"><span className="w-48 font-bold">- Nature de l'opération réalisée (4) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">Cession à titre onéreux</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Titres assimilés cédés (préciser leur nature) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.nature.replace('_', ' ')}</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Nombre des parts sociales, actions ou titres cédés :</span> <span className="border-b border-dotted border-black flex-1 font-mono font-bold tracking-widest">{titres.nombre}</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Prix unitaire (5) :</span> <span className="border-b border-dotted border-black flex-1 font-mono">{formatMoney(financier.prixCessionUnitaire)} DA</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Origine de la propriété (6) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.originePropriete}</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Date de cession :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{titres.dateCession}</span></div>
                </div>
            </div>
            
             {/* NOTES BAS DE PAGE (PAGE 1) */}
            <div className="mt-2 text-[7px] space-y-0.5 leading-tight">
                <p><strong>(1)</strong> Lorsque le cédant n’est pas domicilié en Algérie, la liquidation et le paiement de l’impôt peuvent être effectués par son mandataire dûment habilité.</p>
                <p><strong>(2)</strong> Sont tenus de renseigner ce champ, les contribuables disposant d’un NIF.</p>
                <p><strong>(3)</strong> A joindre un état reprenant lesdits renseignements, s'il y a plus de trois (03) acquéreurs.</p>
                <p><strong>(4)</strong> Préciser s’il s’agit d’une donation ou d’une cession à titre onéreux. En cas de donation, il y a lieu d’indiquer également, le degré de parenté.</p>
                <p><strong>(5)</strong> S'il existe plusieurs valeurs, il y a lieu de joindre un état détaillé faisant ressortir, pour chaque catégorie d'actions, parts sociales ou titres, le nombre et le prix unitaire y afférents.</p>
                <p><strong>(6)</strong> Préciser l'origine de la propriété (souscription, capitalisation des bénéfices, achat de titres, ...).</p>
            </div>

            {/* BREAK PAGE */}
            <div className="break-before-page mt-4"></div>

            {/* SECTION III */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">III – ELEMENTS A DECLARER (7)</div>
                <table className="w-full border-collapse text-[9px]">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border-r border-b border-black p-1 w-2/3">Désignation</th>
                            <th className="border-b border-black p-1 text-center">Valeur en DA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className="border-r border-black p-1 font-bold">- Prix de cession ou la juste valeur des actions, parts sociales ou titres assimilés (A) :</td><td className="p-1 text-right font-mono border-b border-dotted border-black">{formatMoney(results.prixCessionGlobal)}</td></tr>
                        <tr>
                            <td className="border-r border-black p-1 pl-4 italic">
                                <div className="border-l-2 border-black pl-2 ml-2">
                                   Montant des droits et taxes acquittés (B)<br/>
                                   Autres frais dûment justifiés (8) (C) :
                                </div>
                            </td>
                            <td className="p-1 text-right font-mono border-b border-dotted border-black align-bottom">
                                <div className="h-6 border-b border-dotted border-black mb-1">{formatMoney(financier.fraisCession)}</div>
                                <div>-</div>
                            </td>
                        </tr>
                        
                        <tr><td className="border-r border-black p-1 font-bold border-t border-black">- Prix d’acquisition ou de souscription des actions, parts sociales ou titres assimilés (D)</td><td className="p-1 text-right font-mono border-b border-dotted border-black border-t border-black">{formatMoney(results.prixAcquisitionGlobal)}</td></tr>

                        <tr className="bg-gray-200"><td className="border-r border-black p-1 font-bold text-right">Plus-Value imposable ((A-B-C)-D) :</td><td className="p-1 text-right font-black border-b border-black">{formatMoney(results.plusValueImposable)}</td></tr>
                    </tbody>
                </table>
            </div>

            {/* SECTION IV */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">IV – MONTANT DE L’IMPOT A PAYER</div>
                <table className="w-full border-collapse text-[9px]">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border-r border-b border-black p-1 w-1/2">Désignation</th>
                            <th className="border-b border-black p-1 text-center">Valeur en DA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className="border-r border-black p-1 font-bold">- Plus-Value imposable :</td><td className="p-1 text-right font-mono border-b border-dotted border-black">{formatMoney(results.plusValueImposable)}</td></tr>
                        <tr>
                            <td className="border-r border-black p-1 font-bold">- Taux de l’impôt :</td>
                            <td className="p-1 text-center border-b border-dotted border-black flex justify-around items-center">
                                <span>15% <div className={`inline-block w-4 h-4 border border-black ml-1 ${results.tauxApplique === 15 ? 'bg-black' : 'bg-white'}`}></div></span>
                                <span>5% <div className={`inline-block w-4 h-4 border border-black ml-1 ${results.tauxApplique === 5 ? 'bg-black' : 'bg-white'}`}></div></span>
                                <span>20% <div className={`inline-block w-4 h-4 border border-black ml-1 ${results.tauxApplique === 20 ? 'bg-black' : 'bg-white'}`}></div></span>
                                <span>Exonéré <div className={`inline-block w-4 h-4 border border-black ml-1 ${results.tauxApplique === 0 ? 'bg-black' : 'bg-white'}`}></div></span>
                            </td>
                        </tr>
                        <tr className="bg-gray-200"><td className="border-r border-black p-1 text-right font-black uppercase">Montant à payer (9) :</td><td className="p-1 text-right font-black">{formatMoney(results.impotDu)}</td></tr>
                    </tbody>
                </table>
            </div>
            
             <div className="border-2 border-black p-2 mb-3 bg-[#e5e7eb] rounded-lg">
                <p className="font-bold underline mb-1 text-[9px]">Précisions :</p>
                <ul className="list-disc pl-4 text-[8px] font-bold space-y-1">
                    <li>Les Plus-Values de Cessions, à titre onéreux, d'actions, de parts sociales ou de titres assimilés, réalisées par les personnes physiques résidentes sont soumises à l'IRG, au taux de 15%, libératoire d'impôt, lequel est ramené à 5% en cas de souscription des sommes équivalentes à la plus-value générée, au capital d'une ou de plusieurs entreprises. Pour le bénéfice de cette mesure, il convient de joindre à la présente déclaration, un engagement de réinvestissement.</li>
                    <li>Les Plus-Values de Cessions, à titre onéreux, d'actions, de parts sociales ou de titres assimilés, réalisées par les personnes physiques non-résidentes sont soumises à l'IRG, au taux de 20%, libératoire d'impôt.</li>
                </ul>
            </div>

            {/* ATTESTATION */}
            <div className="border-2 border-black p-2 mb-3 bg-[#bfdbfe] text-center">
                <p className="font-bold text-[11px] mb-2 uppercase">J’atteste de l’exactitude des renseignements portés sur la présente déclaration.</p>
                <div className="flex justify-between px-8 text-[10px]">
                    <p className="font-bold">A ..................................................., le ...................................................</p>
                    <p className="font-bold">Signature de l’intéressé (e)</p>
                </div>
                <div className="h-8"></div>
            </div>

            {/* MODE DE PAIEMENT */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">Mode de paiement</div>
                <div className="p-2 space-y-2 text-[9px]">
                    <div className="flex items-center gap-2 border-b border-dotted border-black pb-1">
                        <div className={`w-4 h-4 border border-black`}></div>
                        <span className="font-bold">Par chèque bancaire N°</span> <span className="border-b border-dotted border-black w-24 text-center">...................</span>
                        <span className="font-bold">du</span> <span className="border-b border-dotted border-black w-24 text-center">...................</span>
                        <span className="font-bold">Tirée sur l’agence</span> <span className="border-b border-dotted border-black flex-1">...................</span>
                    </div>
                    <div className="flex items-center gap-2 border-b border-dotted border-black pb-1">
                        <div className={`w-4 h-4 border border-black`}></div>
                        <span className="font-bold">Par chèque postal N°</span> <span className="border-b border-dotted border-black w-32 text-center">...................</span>
                        <span className="font-bold">du</span> <span className="border-b border-dotted border-black w-24 text-center">...................</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 border border-black`}></div>
                        <span className="font-bold">En numéraire</span>
                    </div>
                </div>
            </div>

            {/* CADRE RECETTE */}
            <div className="border-2 border-black bg-[#bfdbfe]/30 min-h-[35mm]">
                <div className="text-center font-bold text-[10px] border-b-2 border-black p-1 mb-2 bg-[#bfdbfe]">Cadre réservé à la Recette des Impôts</div>
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
            <div className="mt-2 text-[7px] space-y-0.5 leading-tight">
                <p><strong>(7)</strong> L’administration fiscale se réserve le droit de réévaluer les bases déclarées, conformément à la législation fiscale en vigueur.</p>
                <p><strong>(8)</strong> Les documents justifiant ces frais doivent être annexés à la présente déclaration.</p>
                <p><strong>(9)</strong> Les montants dus doivent être arrondis au dinar supérieur pour les fractions égales ou supérieures à cinquante (50) centimes. Les fractions inférieures à cinquante (50) centimes sont négligées.</p>
            </div>
        </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G17BisForm;