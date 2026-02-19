import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Save, Printer, CheckCircle2, FileText, 
  Building2, User, Coins, MapPin, 
  Users, ScrollText
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
    <div className="flex border-l border-t border-b border-black h-5 bg-white w-fit inline-flex">
      {cells.map((_, i) => (
        <div key={i} className="w-5 border-r border-black flex items-center justify-center text-[10px] font-mono font-bold leading-none">
          {safeValue[i] || ''}
        </div>
      ))}
    </div>
  );
};

const G17Form: React.FC<Props> = ({ taxpayer, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTab, setActiveTab] = useState<'PARTIES' | 'BIEN' | 'CALCUL'>('PARTIES');
  
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
    codePostal: ''
  });

  // 2. Acquéreur(s) (Acheteur) - NOUVEAU
  const [acquereur, setAcquereur] = useState({
    nom: '', // Ou Raison Sociale
    adresse: '',
    nom2: '', // Second acquéreur éventuel
    adresse2: ''
  });

  // 3. Désignation du Bien (Juridique & Technique) - ENRICHI
  const [bien, setBien] = useState({
    nature: 'APPARTEMENT' as 'TERRAIN' | 'MAISON' | 'APPARTEMENT' | 'LOCAL' | 'AUTRE',
    consistance: 'Bâtie' as 'Bâtie' | 'Non Bâtie',
    natureDroits: 'Pleine propriété',
    adresse: '',
    commune: '',
    wilaya: '',
    codePostal: '',
    article: '', // Article d'imposition
    natureOperation: 'Cession à titre onéreux',
    originePropriete: 'Achat',
    dateAcquisition: '',
    dateCreation: '', // Si construit
    dateActe: '',
    natureActe: 'Notarié',
    dateCession: '',
    isResidencePrincipale: false
  });

  // 4. Financier
  const [financier, setFinancier] = useState({
    prixCession: 0,
    fraisCession: 0, // Droits et taxes acquittés
    autresFrais: 0,
    prixAcquisition: 0,
    fraisAcquisition: 0, // Frais d'entretien, amélioration, etc.
    fraisAcquisitionForfaitaire: true // Option pour utiliser le forfait ou le réel
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
            codePostal: '' // A remplir manuellement si non dispo
        }));
    }
  }, [taxpayer]);

  // --- CALCULS ---
  const results = useMemo(() => {
    // 1. Prix de Cession Net
    const prixCessionNet = Math.max(0, financier.prixCession - financier.fraisCession - financier.autresFrais);

    // 2. Coût d'Acquisition (Plafond frais 30% si forfaitaire)
    let fraisRetenus = 0;
    if (financier.fraisAcquisitionForfaitaire) {
       const plafondFrais = financier.prixAcquisition * 0.30;
       // Si l'utilisateur saisit 0 ou une valeur, on applique la logique : 
       // souvent c'est le forfait de 30% qui est appliqué automatiquement si pas de justificatifs.
       // Ici on simplifie : on prend 30% forfaitaire par défaut.
       fraisRetenus = plafondFrais;
    } else {
       fraisRetenus = financier.fraisAcquisition;
    }
    
    const coutAcquisitionTotal = financier.prixAcquisition + fraisRetenus;

    // 3. Plus-Value Dégagée (Brute)
    const plusValueDegagee = prixCessionNet - coutAcquisitionTotal;

    // 4. Abattement Durée (5% par an à partir de la 3ème année, max 50%)
    let tauxAbattement = 0;
    let anneesDetention = 0;
    
    if (bien.dateAcquisition && bien.dateCession) {
        const d1 = new Date(bien.dateAcquisition);
        const d2 = new Date(bien.dateCession);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        anneesDetention = Math.floor(diffDays / 365);

        if (anneesDetention > 2) {
            tauxAbattement = Math.min(50, (anneesDetention - 2) * 5);
        }
    }

    const montantAbattement = Math.max(0, plusValueDegagee * (tauxAbattement / 100));
    
    // 5. Plus-Value Imposable (Base)
    const plusValueImposable = Math.max(0, plusValueDegagee - montantAbattement);

    // 6. Calcul Impôt (15%)
    let impotDu = plusValueImposable * 0.15;

    // 7. Réduction Résidence Principale (50%)
    // Note: La résidence principale est souvent exonérée totalement si occupée > X temps, 
    // mais ici on suit la logique de réduction pour "Logement collectif unique propriété".
    let reduction = 0;
    if (bien.isResidencePrincipale) {
        reduction = impotDu * 0.50;
    }
    
    const montantAPayer = Math.max(0, impotDu - reduction);

    return {
        prixCessionNet,
        coutAcquisitionTotal,
        fraisRetenus,
        plusValueDegagee,
        anneesDetention,
        tauxAbattement,
        montantAbattement,
        plusValueImposable,
        reduction,
        impotDu,
        montantAPayer: Math.round(montantAPayer) // Arrondi au dinar
    };
  }, [financier, bien]);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    onSubmit({
      id: `G17-${Math.floor(Math.random() * 10000)}`,
      type: 'Série G n°17 (Plus-Values Cession)',
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
                     <h1 className="text-2xl font-black text-slate-900 tracking-tight">PLUS-VALUES IMMOBILIÈRES (G17)</h1>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Déclaration & Bordereau de Versement</p>
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
            
            {/* Onglets de navigation */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {['PARTIES', 'BIEN', 'CALCUL'].map(tab => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      {tab === 'PARTIES' ? 'Parties' : tab === 'BIEN' ? 'Le Bien' : 'Calcul IRG'}
                   </button>
                ))}
            </div>

            {/* TAB 1: PARTIES */}
            {activeTab === 'PARTIES' && (
                <div className="space-y-6">
                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><User className="w-6 h-6 text-primary" /> 1. Désignation du Cédant</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nom</label><input type="text" value={cedant.nom} onChange={e => setCedant({...cedant, nom: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Prénom</label><input type="text" value={cedant.prenom} onChange={e => setCedant({...cedant, prenom: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">NIF</label><input type="text" value={cedant.nif} onChange={e => setCedant({...cedant, nif: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">NIN (Numéro National)</label><input type="text" value={cedant.nin} onChange={e => setCedant({...cedant, nin: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" /></div>
                            <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Adresse</label><input type="text" value={cedant.adresse} onChange={e => setCedant({...cedant, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Commune</label><input type="text" value={cedant.commune} onChange={e => setCedant({...cedant, commune: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Code Postal</label><input type="text" value={cedant.codePostal} onChange={e => setCedant({...cedant, codePostal: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Users className="w-6 h-6 text-green-600" /> 2. Désignation de l'Acquéreur</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nom, Prénom ou Raison Sociale</label><input type="text" value={acquereur.nom} onChange={e => setAcquereur({...acquereur, nom: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Acheteur principal" /></div>
                            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Adresse</label><input type="text" value={acquereur.adresse} onChange={e => setAcquereur({...acquereur, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                            
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Second Acquéreur (Optionnel)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={acquereur.nom2} onChange={e => setAcquereur({...acquereur, nom2: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Nom complet" />
                                    <input type="text" value={acquereur.adresse2} onChange={e => setAcquereur({...acquereur, adresse2: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Adresse" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 2: BIEN */}
            {activeTab === 'BIEN' && (
                <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><Building2 className="w-6 h-6 text-orange-500" /> Désignation du Bien</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nature & Consistance */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Nature du bien</label>
                            <select value={bien.nature} onChange={e => setBien({...bien, nature: e.target.value as any})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <option value="APPARTEMENT">Appartement</option>
                                <option value="MAISON">Maison / Villa</option>
                                <option value="TERRAIN">Terrain</option>
                                <option value="LOCAL">Local Commercial</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Consistance Globale</label>
                            <select value={bien.consistance} onChange={e => setBien({...bien, consistance: e.target.value as any})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <option value="Bâtie">Bâtie</option>
                                <option value="Non Bâtie">Non Bâtie</option>
                            </select>
                        </div>
                        
                        {/* Adresse & Localisation */}
                        <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">Adresse / Lieu de situation</label><input type="text" value={bien.adresse} onChange={e => setBien({...bien, adresse: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Commune</label><input type="text" value={bien.commune} onChange={e => setBien({...bien, commune: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Wilaya</label><input type="text" value={bien.wilaya} onChange={e => setBien({...bien, wilaya: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Article d'Imposition</label><input type="text" value={bien.article} onChange={e => setBien({...bien, article: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono" placeholder="N° Article" /></div>
                        
                        {/* Juridique */}
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nature des droits cédés</label><input type="text" value={bien.natureDroits} onChange={e => setBien({...bien, natureDroits: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Ex: Pleine propriété" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Origine de propriété</label><input type="text" value={bien.originePropriete} onChange={e => setBien({...bien, originePropriete: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Ex: Achat, Héritage" /></div>
                        
                        {/* Dates */}
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Date d'Acquisition / Création</label><input type="date" value={bien.dateAcquisition} onChange={e => setBien({...bien, dateAcquisition: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Date de l'Acte (Cession)</label><input type="date" value={bien.dateActe} onChange={e => setBien({...bien, dateActe: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-500">Nature de l'Acte</label><input type="text" value={bien.natureActe} onChange={e => setBien({...bien, natureActe: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Ex: Acte notarié" /></div>
                        
                        <div className="col-span-2 pt-2">
                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                                <input type="checkbox" checked={bien.isResidencePrincipale} onChange={e => setBien({...bien, isResidencePrincipale: e.target.checked})} className="w-5 h-5 text-primary rounded" />
                                <div>
                                    <span className="block text-sm font-bold text-slate-700">Habitation Principale (Unique propriété)</span>
                                    <span className="text-[10px] text-slate-400">Ouvre droit à une réduction de 50% de l'impôt (Logement collectif)</span>
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
                                <label className="text-xs font-bold text-slate-700">Prix de vente (Acte)</label>
                                <input type="number" value={financier.prixCession || ''} onChange={e => setFinancier({...financier, prixCession: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Droits et Taxes acquittés</label>
                                <input type="number" value={financier.fraisCession || ''} onChange={e => setFinancier({...financier, fraisCession: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right text-red-600" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Autres Frais</label>
                                <input type="number" value={financier.autresFrais || ''} onChange={e => setFinancier({...financier, autresFrais: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right text-red-600" />
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100">
                                <span className="text-xs font-bold text-blue-800">Prix Net Cession</span>
                                <span className="font-black text-blue-900">{formatMoney(results.prixCessionNet)} DA</span>
                            </div>
                        </div>

                        {/* Acquisition */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-slate-400 border-b pb-2">Coût d'Acquisition</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Prix d'acquisition (Origine)</label>
                                <input type="number" value={financier.prixAcquisition || ''} onChange={e => setFinancier({...financier, prixAcquisition: parseFloat(e.target.value)||0})} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right font-bold" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-700">Frais d'acquisition</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={financier.fraisAcquisitionForfaitaire} onChange={e => setFinancier({...financier, fraisAcquisitionForfaitaire: e.target.checked})} className="rounded text-primary" />
                                        <span className="text-[10px] text-slate-500">Forfait 30%</span>
                                    </label>
                                </div>
                                <input 
                                    type="number" 
                                    value={financier.fraisAcquisitionForfaitaire ? '' : (financier.fraisAcquisition || '')} 
                                    onChange={e => setFinancier({...financier, fraisAcquisition: parseFloat(e.target.value)||0})} 
                                    disabled={financier.fraisAcquisitionForfaitaire}
                                    placeholder={financier.fraisAcquisitionForfaitaire ? `Calculé: ${formatMoney(financier.prixAcquisition * 0.3)}` : '0.00'}
                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-right disabled:bg-slate-50 disabled:text-slate-400" 
                                />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                                <span className="text-xs font-bold text-slate-600">Coût Total</span>
                                <span className="font-black text-slate-900">{formatMoney(results.coutAcquisitionTotal)} DA</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-lg mt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-300">Plus-Value Dégagée</span>
                            <span className="text-xl font-bold">{formatMoney(results.plusValueDegagee)} DA</span>
                        </div>
                        {results.montantAbattement > 0 && (
                            <div className="flex justify-between items-center text-green-400">
                                <span className="text-sm font-bold">Abattement Durée ({results.tauxAbattement}% / {results.anneesDetention} ans)</span>
                                <span className="text-lg font-bold">- {formatMoney(results.montantAbattement)} DA</span>
                            </div>
                        )}
                        <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                            <span className="text-base font-black uppercase tracking-widest">Impôt Dû (15%)</span>
                            <span className="text-4xl font-black">{formatMoney(results.impotDu)} DA</span>
                        </div>
                        {results.reduction > 0 && (
                            <div className="flex justify-between items-center text-orange-400 text-xs font-bold">
                                <span>Réduction Résidence Principale (50%)</span>
                                <span>- {formatMoney(results.reduction)} DA</span>
                            </div>
                        )}
                        <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                            <span className="text-lg font-black text-white">NET À PAYER</span>
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
                {activeTab !== 'PARTIES' && <button onClick={() => setActiveTab(prev => prev === 'CALCUL' ? 'BIEN' : 'PARTIES')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50">Précédent</button>}
                {activeTab !== 'CALCUL' ? (
                   <button onClick={() => setActiveTab(prev => prev === 'PARTIES' ? 'BIEN' : 'CALCUL')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">Suivant</button>
                ) : (
                   <button onClick={() => handleSave('VALIDÉ')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/30">
                      <CheckCircle2 className="w-4 h-4" /> Valider G17
                   </button>
                )}
            </div>
        </div>
    </div>
  );

  // --- OFFICIAL VIEW (SÉRIE G N°17) ---
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
            
            {/* EN-TÊTE RÉPUBLIQUE */}
            <div className="text-center mb-2">
                <h1 className="text-[12px] font-bold font-serif" dir="rtl">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
                <h2 className="text-[10px] font-bold uppercase tracking-widest">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
            </div>

            {/* BLOC ADMINISTRATION */}
            <div className="flex justify-between items-start mb-2 pb-2">
                <div className="text-left font-bold text-[9px] space-y-1 w-1/2">
                    <p>MINISTERE DES FINANCES</p>
                    <p>Direction Générale des Impôts</p>
                    <p>DIW de ................................................................</p>
                    <p>Structure .............................................................</p>
                </div>
                
                <div className="text-right font-bold text-[9px] space-y-1 w-1/2" dir="rtl">
                    <p>وزارة المالية</p>
                    <p>المديرية العامة للضرائب</p>
                    <p>مديرية الضرائب لولاية ..........................</p>
                    <p>مصلحة .................................................</p>
                </div>
                <div className="absolute right-[10mm] top-[20mm] border-2 border-black px-2 py-1 bg-gray-50 text-center">
                    <p className="font-bold text-[10px]">Série G N°17</p>
                </div>
            </div>

            {/* TITRE PRINCIPAL */}
            <div className="bg-[#bfdbfe] border-2 border-black p-2 text-center mb-3 print:bg-[#bfdbfe]">
                <h1 className="text-sm font-black uppercase">IMPOT SUR LE REVENU GLOBAL</h1>
                <h2 className="text-xs font-bold uppercase mt-1">Plus-Values de Cessions à titre onéreux des immeubles bâtis ou non bâtis et des droits réels immobiliers</h2>
                <p className="text-[8px] font-bold italic mt-1">(Art 80-1 du Code des Impôts Directs et Taxes Assimilées)</p>
            </div>

            {/* AVIS */}
            <div className="border-2 border-black p-2 text-center font-bold text-[9px] mb-3 bg-gray-50 rounded-lg">
                Déclaration tenant lieu de bordereau-avis de versement, à souscrire, auprès de la recette des impôts du lieu de situation du bien, dans un délai n'excédant pas trente (30) jours, à compter de la date de l'établissement de l'acte de vente.
            </div>

            {/* SECTION I : RENSEIGNEMENTS PARTIES */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">I – RENSEIGNEMENTS CONCERNANT LE CEDANT ET L'/LES ACQUEREUR (S)</div>
                <div className="p-2 space-y-3 text-[9px]">
                    
                    {/* 1. CEDANT */}
                    <div>
                        <p className="font-bold underline mb-1 text-[10px]">1. Désignation du cédant (1):</p>
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

                    {/* 2. ACQUEREUR */}
                    <div className="border-t border-black pt-2">
                        <p className="font-bold underline mb-1 text-[10px]">2. Désignation de ou des acquéreur (s) :</p>
                        <div className="pl-2 space-y-2">
                            <div className="space-y-1">
                                <div className="flex"><span className="w-48 font-bold">- Nom, Prénom ou raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{acquereur.nom}</span></div>
                                <div className="flex"><span className="w-48 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{acquereur.adresse}</span></div>
                            </div>
                            
                            {/* Slot 2 */}
                            <div className="space-y-1">
                                <div className="flex"><span className="w-48 font-bold">- Nom, Prénom ou raison sociale :</span> <span className="border-b border-dotted border-black flex-1 uppercase font-bold">{acquereur.nom2}</span></div>
                                <div className="flex"><span className="w-48 font-bold">- Adresse :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{acquereur.adresse2}</span></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* SECTION II : DESIGNATION DU BIEN */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">II – DESIGNATION DU BIEN OU DES DROITS REELS CEDES</div>
                <div className="p-2 space-y-1 text-[9px]">
                    <div className="flex">
                        <span className="w-40 font-bold">- Nature du bien cédé (3):</span> 
                        <span className="border-b border-dotted border-black flex-1 font-bold uppercase">{bien.nature}</span>
                        <span className="w-56 font-bold ml-2">, Consistance globale (bâtie ou non bâtie) (4) :</span>
                        <span className="border-b border-dotted border-black flex-1 font-bold uppercase">{bien.consistance}</span>
                    </div>
                    <div className="flex"><span className="w-48 font-bold">- Nature des droits réels cédés :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.natureDroits}</span></div>
                    <div className="flex"><span className="w-48 font-bold">- Adresse ou lieu de situation du bien :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.adresse}</span></div>
                    
                    <div className="flex gap-4">
                        <div className="flex flex-1"><span className="w-20 font-bold">Commune :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.commune}</span></div>
                        <div className="flex flex-1"><span className="w-16 font-bold">Wilaya :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.wilaya}</span></div>
                        <div className="flex items-center"><span className="font-bold mr-2">Code postal :</span> <GridInput value={bien.codePostal} length={5} /></div>
                    </div>

                    <div className="flex"><span className="w-64 font-bold">- Numéro d’Article d’Imposition du bien :</span> <span className="border-b border-dotted border-black flex-1 font-mono font-bold tracking-widest">{bien.article}</span></div>
                    <div className="flex"><span className="w-64 font-bold">- Nature de l’opération réalisée (5) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.natureOperation}</span></div>
                    <div className="flex"><span className="w-64 font-bold">- Origine de la propriété (6) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.originePropriete}</span></div>
                    <div className="flex"><span className="w-64 font-bold">- Date d’acquisition ou de création :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.dateAcquisition || bien.dateCreation}</span></div>
                    <div className="flex"><span className="w-64 font-bold">- Date d’établissement de l’acte :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.dateActe}</span></div>
                    <div className="flex"><span className="w-64 font-bold">- Nature de l’acte (7) :</span> <span className="border-b border-dotted border-black flex-1 uppercase">{bien.natureActe}</span></div>
                </div>
            </div>

            {/* SECTION III : ELEMENTS A DECLARER (TABLEAU) */}
            <div className="border-2 border-black mb-3">
                <div className="bg-[#bfdbfe] border-b-2 border-black p-1 text-center font-bold text-[10px] uppercase">III – ELEMENTS A DECLARER (8)</div>
                <table className="w-full border-collapse text-[9px]">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border-r border-b border-black p-1 w-2/3">Désignation</th>
                            <th className="border-b border-black p-1 text-center">Valeur en DA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className="border-r border-black p-1 font-bold">- Prix de cession du bien ou des droits réels (9) (A)</td><td className="p-1 text-right font-mono border-b border-dotted border-black">{formatMoney(financier.prixCession)}</td></tr>
                        <tr>
                            <td className="border-r border-black p-1 pl-4 italic">
                                <div className="border-l-2 border-black pl-2 ml-2">
                                   Montant des droits et taxes acquittés (B)<br/>
                                   Autres frais dûment justifiés (10) (C)
                                </div>
                            </td>
                            <td className="p-1 text-right font-mono border-b border-dotted border-black align-bottom">
                                <div className="h-6 border-b border-dotted border-black mb-1">{formatMoney(financier.fraisCession)}</div>
                                <div>{formatMoney(financier.autresFrais)}</div>
                            </td>
                        </tr>
                        
                        <tr><td className="border-r border-black p-1 font-bold border-t border-black">- Prix d’acquisition ou la valeur de création (11) (D)</td><td className="p-1 text-right font-mono border-b border-dotted border-black border-t border-black">{formatMoney(financier.prixAcquisition)}</td></tr>
                        <tr>
                            <td className="border-r border-black p-1 pl-4 italic">
                                <div className="border-l-2 border-black pl-2 ml-2">
                                    Frais d’acquisition, d’entretien et d’amélioration dûment justifiés (Dans la limite de 30% du prix d’acquisition ou de la valeur de création du bien cédé) (10) (E)
                                </div>
                            </td>
                            <td className="p-1 text-right font-mono border-b border-black align-middle">{formatMoney(results.fraisRetenus)}</td>
                        </tr>

                        <tr className="bg-gray-200"><td className="border-r border-black p-1 font-bold text-right border-b border-black">Plus-Value dégagée (F) = ((A-B-C) – (D+E)):</td><td className="p-1 text-right font-black border-b border-black">{formatMoney(results.plusValueDegagee)}</td></tr>
                        
                        <tr><td className="border-r border-black p-1 text-right font-bold">Taux de l’abattement :</td><td className="p-1 text-right font-mono border-b border-dotted border-black">{results.tauxAbattement} %</td></tr>
                        <tr><td className="border-r border-black p-1 text-right font-bold">Montant de l’abattement (G) = (F X Taux) :</td><td className="p-1 text-right font-mono border-b border-black">{formatMoney(results.montantAbattement)}</td></tr>
                        
                        <tr className="bg-gray-200"><td className="border-r border-black p-1 text-right font-black uppercase">Plus-Value imposable (H) = (F-G) :</td><td className="p-1 text-right font-black">{formatMoney(results.plusValueImposable)}</td></tr>
                    </tbody>
                </table>
                <div className="p-1 text-[8px] italic border-t border-black bg-white">
                    <span className="font-bold underline">Précision :</span> Le montant de l’abattement est de l’ordre de 5% par an, à compter de la troisième (03) année de la date d’entrée en possession du bien cédé, et ce, dans la limite de 50%. Pour déterminer la période de trois (03) ans, il y a lieu de procéder à un décompte de date à date.
                </div>
            </div>

            {/* SECTION IV : MONTANT A PAYER */}
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
                        <tr><td className="border-r border-black p-1 font-bold">- Plus-Value imposable</td><td className="p-1 text-right font-mono border-b border-dotted border-black">{formatMoney(results.plusValueImposable)}</td></tr>
                        <tr>
                            <td className="border-r border-black p-1 font-bold">- Taux de l’impôt</td>
                            <td className="p-1 text-center border-b border-dotted border-black flex justify-around items-center">
                                <span>15% <div className="inline-block w-4 h-4 border border-black ml-1 bg-white"></div></span>
                                <span>Exonéré <div className="inline-block w-4 h-4 border border-black ml-1 bg-white"></div></span>
                            </td>
                        </tr>
                        <tr><td className="border-r border-black p-1 text-right font-bold border-t border-black">Montant de l’impôt (12) (I) :</td><td className="p-1 text-right font-mono border-b border-dotted border-black border-t border-black">{formatMoney(results.impotDu)}</td></tr>
                        <tr><td className="border-r border-black p-1 text-right font-bold">Réduction d’impôt de 50% (J) = ((I) X 50 %) :</td><td className="p-1 text-right font-mono border-b border-black">{results.reduction > 0 ? formatMoney(results.reduction) : '...................................................'}</td></tr>
                        <tr className="bg-gray-200"><td className="border-r border-black p-1 text-right font-black uppercase">Montant à payer (K)= (I – J) (12) :</td><td className="p-1 text-right font-black">{formatMoney(results.montantAPayer)}</td></tr>
                    </tbody>
                </table>
                 <div className="p-1 text-[8px] italic border-t border-black bg-white">
                    <span className="font-bold underline">Précision :</span> La réduction d’impôt de 50% n’est accordée que dans le cadre de la cession de logements collectifs constituant l’unique propriété et l’habitation principale.
                </div>
            </div>

            {/* ATTESTATION */}
            <div className="border-2 border-black p-2 mb-3 bg-[#e5e7eb]">
                <p className="text-center font-bold text-[11px] mb-2 uppercase">J’atteste de l’exactitude des renseignements portés sur la présente déclaration.</p>
                <div className="flex justify-between px-8">
                    <p className="font-bold text-[9px]">A ..................................................., le ...................................................</p>
                    <p className="font-bold text-[9px]">Signature de l’intéressé (e)</p>
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
                <p><strong>(1)</strong> Lorsque le cédant n’est pas domicilié en Algérie, la liquidation et le paiement de l’impôt peuvent être effectués par son mandataire dûment habilité.</p>
                <p><strong>(2)</strong> Sont tenus de renseigner ce champ, les contribuables disposant d’un NIF.</p>
                <p><strong>(3)</strong> Préciser la nature du bien (terrain nu, maison individuelle, bien collectif, ...).</p>
                <p><strong>(4)</strong> Préciser la surface globale, la partie non bâtie, bâtie et le nombre de niveaux en cas de maison individuelle.</p>
                <p><strong>(5)</strong> Préciser s’il s’agit d’une donation ou d’une cession à titre onéreux. En cas de donation, il y a lieu également d’indiquer le degré de parenté.</p>
                <p><strong>(6)</strong> Préciser si le bien cédé est issu d’une succession, d’une donation ou il a fait l’objet d’acquisition.</p>
                <p><strong>(7)</strong> Indiquer la nature de l’acte (Acte administratif, acte de propriété, ...).</p>
                <p><strong>(8)</strong> L’administration fiscale se réserve le droit de réévaluer les bases déclarées, conformément aux dispositions de l’article 78 du Code des Impôts Directs et Taxes Assimilées.</p>
                <p><strong>(9)</strong> En cas de donation, il y a lieu de mentionner la valeur vénale du bien.</p>
                <p><strong>(10)</strong> Les documents justifiant ces frais doivent être annexés à la présente déclaration.</p>
                <p><strong>(11)</strong> Lorsque l’origine du bien cédé provient d’une donation ou d’une succession, il y a lieu de retenir la valeur vénale du bien à la date de la donation ou de la succession.</p>
                <p><strong>(12)</strong> Les montants dus doivent être arrondis au dinar supérieur pour les fractions égales ou supérieures à cinquante (50) centimes. Les fractions inférieures à cinquante (50) centimes sont négligées.</p>
            </div>
        </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G17Form;