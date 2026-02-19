
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  CheckCircle2, 
  Download, 
  FileText,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  MapPin,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  Search,
  Eye,
  RefreshCw,
  Fingerprint,
  Briefcase,
  Lightbulb,
  ArrowUpRight
} from 'lucide-react';
import { Taxpayer, Declaration } from '../types';

interface Props {
  taxpayer: Taxpayer | null;
  initialData?: Declaration | null; 
  onBack: () => void;
  onSubmit: (dec: Declaration) => void;
}

const ExistenceForm: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  // Mode d'affichage : 'WIZARD' (Assistant moderne) ou 'OFFICIAL' (Formulaire Papier)
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');

  // Données du formulaire
  const [formData, setFormData] = useState({
    diw: taxpayer?.wilaya || '',
    structure: taxpayer?.cpiRattachement || '',
    nif: taxpayer?.dynamicData['2'] || '',
    article: taxpayer?.dynamicData['article_imp'] || '',
    regime: taxpayer?.regimeSelectionne.includes('IFU') ? 'IFU' : taxpayer?.regimeSelectionne.includes('Société') ? 'IBS' : 'IRG',
    nomRaison: taxpayer?.dynamicData['1'] || '',
    nin: taxpayer?.dynamicData['nin'] || '',
    formeJuridique: taxpayer?.typeContribuable === 'MORALE' ? 'SARL' : 'Personne Physique',
    activitePrincipale: taxpayer?.dynamicData['7'] || '',
    activitesSecondaires: '',
    codeActivite: taxpayer?.dynamicData['code_act'] || '',
    adresseSiege: taxpayer?.dynamicData['adresse'] || '',
    adresseEtablissement: '',
    adresseDomicile: '',
    tel: taxpayer?.dynamicData['16'] || '',
    email: `contact@${taxpayer?.dynamicData['1']?.split(' ')[0].toLowerCase() || 'email'}.dz`,
    rc: taxpayer?.dynamicData['rc'] || '',
    agrement: taxpayer?.dynamicData['agrement'] || '',
    qualite: 'Propriétaire',
    dateDebut: taxpayer?.dynamicData['11'] || new Date().toISOString().split('T')[0],
    villeSignature: taxpayer?.commune || 'Alger',
    dateSignature: new Date().toISOString().split('T')[0]
  });

  // CHARGEMENT DONNÉES INITIALES
  useEffect(() => {
    if (initialData) {
      // Si une déclaration existe déjà et n'est pas un brouillon, on passe en mode officiel
      if (initialData.status !== 'BROUILLON') {
        setViewMode('OFFICIAL');
      }
      // Note: On pourrait aussi hydrater le formData ici si initialData contenait plus de détails
    }
  }, [initialData]);

  // Calculs simulés pour l'affichage (CA Prévisionnel, Seuil, etc.)
  const caPrevisionnel = 2500000;
  const seuilIFU = 8000000;
  const progression = (caPrevisionnel / seuilIFU) * 100;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleValidateWizard = () => {
    // Transition vers le formulaire officiel
    setViewMode('OFFICIAL');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    const newDec: Declaration = {
      id: initialData?.id || `G08-${Math.floor(Math.random() * 10000)}`,
      type: 'Existence (G n°08)',
      period: 'Début Activité',
      regime: formData.regime,
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status,
      amount: 0 // Pas de montant pour une déclaration d'existence
    };
    onSubmit(newDec);
  };

  // Composant Grille Saisie (pour la vue officielle) avec style strict
  const GridInput = ({ value, length, onChange }: { value: string, length: number, onChange: (val: string) => void }) => {
    const chars = value.split('');
    return (
      <div className="flex gap-[1px] w-full">
        {Array.from({ length }).map((_, i) => (
          <div key={i} className="w-5 h-7 border border-black bg-white flex items-center justify-center text-sm font-bold text-slate-900 leading-none">
            {chars[i] || ''}
          </div>
        ))}
        {/* Input invisible pour la saisie */}
        <input 
          type="text" 
          value={value} 
          maxLength={length}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute opacity-0 w-0 h-0"
        />
      </div>
    );
  };

  // --- VUE 1: ASSISTANT MODERNE (WIZARD) ---
  if (viewMode === 'WIZARD') {
    return (
      <div className="min-h-full bg-[#f6f7f8] p-6 md:p-10 font-sans pb-32">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-md">Module Contribuable Connecté</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Série G n°08/2024</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Déclaration d'Existence</h1>
        </div>

        {/* Bannière de synchro */}
        <div className="max-w-6xl mx-auto bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between mb-8 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                 <RefreshCw className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Données synchronisées avec le Module Contribuable <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                 </p>
                 <p className="text-xs text-slate-500 font-medium">Dossier actif : <span className="font-bold text-slate-700">{taxpayer?.dynamicData['1']} (NIF: {taxpayer?.dynamicData['2']})</span></p>
              </div>
           </div>
           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
              <Download className="w-4 h-4" /> Importer un autre contribuable
           </button>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* COLONNE GAUCHE : FORMULAIRE */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* CARD 1: IDENTITÉ (READ ONLY) */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                       <Fingerprint className="w-6 h-6 text-slate-400" /> I - IDENTITÉ (LECTURE SEULE)
                    </h3>
                    <button className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg hover:bg-primary/10">Modifier dans le profil</button>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Nom, Prénom / Raison Sociale <Lock className="w-3 h-3" /></label>
                       <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100">{formData.nomRaison}</div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">NIF <Lock className="w-3 h-3" /></label>
                       <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100 font-mono">{formData.nif}</div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">NIN <Lock className="w-3 h-3" /></label>
                       <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100 font-mono">{formData.nin || 'Non renseigné'}</div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Forme Juridique <Lock className="w-3 h-3" /></label>
                       <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100">{formData.formeJuridique}</div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Article d'Imposition <Lock className="w-3 h-3" /></label>
                       <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100">{formData.article || 'En attente'}</div>
                    </div>
                 </div>
              </div>

              {/* CARD 2: LOCALISATION (READ ONLY) */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                       <MapPin className="w-6 h-6 text-slate-400" /> II - LOCALISATION (SYNCHRONISÉE)
                    </h3>
                    <button className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg hover:bg-primary/10">Modifier dans le profil</button>
                 </div>
                 <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 text-center">{formData.diw || 'Wilaya'}</div>
                    <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 text-center">{formData.structure || 'CPI Rattachement'}</div>
                    <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 text-center">{formData.villeSignature}</div>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Adresse du Siège Social <Lock className="w-3 h-3" /></label>
                       <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100">{formData.adresseSiege}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Téléphone <Lock className="w-3 h-3" /></label>
                          <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100">{formData.tel}</div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Email <Lock className="w-3 h-3" /></label>
                          <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 border border-slate-100 truncate">{formData.email}</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* CARD 3: DETAILS PRO (EDITABLE) */}
              <div className="bg-white rounded-[32px] p-8 border-2 border-primary/10 shadow-lg ring-4 ring-primary/5">
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6">
                    <Briefcase className="w-6 h-6 text-primary" /> III - DÉTAILS PROFESSIONNELS
                 </h3>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Activité Principale <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          value={formData.activitePrincipale}
                          onChange={(e) => handleChange('activitePrincipale', e.target.value)}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Activités Secondaires</label>
                       <textarea 
                          rows={2}
                          value={formData.activitesSecondaires}
                          onChange={(e) => handleChange('activitesSecondaires', e.target.value)}
                          placeholder="Saisir..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Date de Début d'Activité <span className="text-red-500">*</span></label>
                          <input 
                             type="date" 
                             value={formData.dateDebut}
                             onChange={(e) => handleChange('dateDebut', e.target.value)}
                             className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-primary transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Code d'Activité (NAA)</label>
                          <input 
                             type="text" 
                             value={formData.codeActivite}
                             onChange={(e) => handleChange('codeActivite', e.target.value)}
                             className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-primary transition-all text-center"
                          />
                       </div>
                    </div>

                    {/* CHAMPS SUPPLÉMENTAIRES (Établissement & Domicile) */}
                    <div className="pt-6 mt-2 border-t border-slate-100 space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresses Complémentaires (Cas Spécifiques)</h4>
                       
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Adresse de l'établissement en Algérie <span className="text-[10px] text-slate-400 font-normal ml-1">(Sociétés étrangères uniquement)</span></label>
                          <div className="relative">
                             <input 
                                type="text" 
                                value={formData.adresseEtablissement}
                                onChange={(e) => handleChange('adresseEtablissement', e.target.value)}
                                placeholder="Saisir l'adresse de l'établissement..."
                                className="w-full h-12 px-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                             />
                             <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Adresse du domicile <span className="text-[10px] text-slate-400 font-normal ml-1">(Si non-résident)</span></label>
                          <div className="relative">
                             <input 
                                type="text" 
                                value={formData.adresseDomicile}
                                onChange={(e) => handleChange('adresseDomicile', e.target.value)}
                                placeholder="Saisir l'adresse du domicile..."
                                className="w-full h-12 px-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                             />
                             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                       </div>
                    </div>

                 </div>
              </div>

              {/* CARD 4: VÉRIFICATION (AUTO) */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                       <ShieldCheck className="w-6 h-6 text-primary" /> IV - VÉRIFICATION DE CONFORMITÉ
                    </h3>
                    <span className="bg-blue-50 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Automatique</span>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl">
                       <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
                       <div>
                          <p className="text-xs font-black text-green-800 uppercase">Cohérence NIF/NIN vérifiée</p>
                          <p className="text-[10px] font-medium text-green-700">Données conformes au registre central.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl">
                       <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
                       <div>
                          <p className="text-xs font-black text-green-800 uppercase">Adresse géolocalisée</p>
                          <p className="text-[10px] font-medium text-green-700">L'adresse correspond à la zone du CPI {formData.structure}.</p>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                       <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm"><AlertTriangle className="w-5 h-5" /></div>
                          <div>
                             <p className="text-xs font-black text-amber-800 uppercase">Document manquant détecté</p>
                             <p className="text-[10px] font-medium text-amber-700">Veuillez joindre le contrat de location avant validation finale.</p>
                          </div>
                       </div>
                       <button className="text-[10px] font-bold text-primary hover:underline">Ajouter</button>
                    </div>
                 </div>
              </div>

           </div>

           {/* COLONNE DROITE : RÉGIME FIXÉ */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 sticky top-24 shadow-2xl">
                 <div className="flex items-center gap-4">
                    <Lock className="w-6 h-6 text-slate-400" />
                    <h3 className="text-xl font-black uppercase tracking-widest">Régime Fixé</h3>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Position Seuil {seuilIFU.toLocaleString()} DA</span>
                       <span className="text-blue-400">Verrouillé</span>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{width: `${Math.min(100, progression)}%`}}></div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CA Prévisionnel (N-1 Central) <Lock className="w-3 h-3 inline" /></p>
                    <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                       <span className="text-2xl font-black">{caPrevisionnel.toLocaleString()}</span>
                       <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-[8px] text-right italic text-slate-500">* Donnée importée du bilan N-1</p>
                 </div>

                 <div className="text-center py-6 border-t border-white/10 border-b mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Régime Assigné</p>
                    <p className="text-5xl font-black text-primary tracking-tighter mb-1">{formData.regime}</p>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Forfaitaire</p>
                 </div>

                 <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                       <CheckCircle2 className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase">Validation Système</span>
                    </div>
                    <p className="text-xs font-bold text-white mb-1">Régime Verrouillé</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                       Conformément aux données de votre dossier central (CA N-1 {"<"} 8M DA), le régime IFU est appliqué automatiquement.
                    </p>
                 </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-4">
                 <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" /> Contestation du régime ?
                 </h4>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Si vous estimez que ce régime ne correspond plus à votre activité actuelle, vous devez mettre à jour votre dossier central.
                 </p>
                 <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Accéder au portail de réclamation <ArrowUpRight className="w-3 h-3" />
                 </button>
              </div>
           </div>

        </div>

        {/* FOOTER FLOTTANT */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-6 z-50">
           <div className="max-w-6xl mx-auto flex justify-between items-center">
              <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-800">Annuler</button>
              <div className="flex gap-4">
                 <button onClick={() => handleSave('BROUILLON')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" /> Sauvegarder Brouillon
                 </button>
                 <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Prévisualiser PDF
                 </button>
                 <button onClick={handleValidateWizard} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Valider & Transmettre
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- VUE 2: FORMULAIRE OFFICIEL (STRICT REPLICA) ---
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
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all">
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* PAGE 1 : DÉCLARATION */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full min-h-[297mm] p-[5mm] relative text-black font-sans box-border border-0">
        
        {/* EN-TÊTE OFFICIEL */}
        <div className="border border-black mb-1">
          <div className="text-center border-b border-black py-1">
            <h1 className="text-lg font-bold font-serif leading-none mb-1">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
            <h2 className="text-[10px] font-bold uppercase tracking-widest leading-none">République Algérienne Démocratique et Populaire</h2>
          </div>
          
          <div className="flex">
            {/* Cadre Administration */}
            <div className="w-[12mm] border-r border-black flex items-center justify-center bg-white relative">
              <p className="text-[7px] font-bold -rotate-90 whitespace-nowrap absolute">Cadre réservé à l'administration</p>
            </div>

            {/* Infos Ministère & DGI */}
            <div className="flex-1 p-2 grid grid-cols-2 gap-x-2">
              <div className="space-y-1 text-[9px] font-bold">
                <p>MINISTERE DES FINANCES</p>
                <p>Direction Générale des Impôts</p>
                <div className="flex items-end gap-1 mt-1">
                  <span>DIW de .........................................</span>
                  <div className="absolute ml-[40px] -mt-[2px] font-mono text-[10px] uppercase">{formData.diw}</div>
                </div>
                <div className="flex items-end gap-1">
                  <span>Structure ....................................</span>
                  <div className="absolute ml-[40px] -mt-[2px] font-mono text-[10px] uppercase">{formData.structure}</div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1">
                   <span className="text-[8px] font-bold whitespace-nowrap">- Numéro d'Identification Fiscale (NIF): </span>
                   <GridInput length={15} value={formData.nif} onChange={v => handleChange('nif', v)} />
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-[8px] font-bold whitespace-nowrap">- Numéro d'article d'imposition : </span>
                   <div className="w-[70%]">
                      <GridInput length={11} value={formData.article} onChange={v => handleChange('article', v)} />
                   </div>
                </div>
              </div>
            </div>

            {/* Série */}
            <div className="w-[35mm] border-l border-black flex flex-col items-center justify-center p-1">
              <div className="border border-black px-2 py-1 text-center bg-white mb-2">
                <p className="text-[10px] font-bold">Série G n° 08/2024</p>
              </div>
            </div>
          </div>

          {/* Choix du régime */}
          <div className="border-t border-black p-1 text-[8px]">
            <p className="font-bold mb-1 ml-2">- Cocher la case correspondante :</p>
            <div className="flex justify-around items-center px-4 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-black flex items-center justify-center">
                  {formData.regime === 'IBS' && <span className="font-bold text-[10px]">X</span>}
                </div>
                <div className="text-center leading-tight">
                  <span className="block font-bold">Impôt sur les Bénéfices des Sociétés</span>
                  <span>(IBS)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-black flex items-center justify-center">
                  {formData.regime === 'IRG' && <span className="font-bold text-[10px]">X</span>}
                </div>
                <div className="text-center leading-tight">
                  <span className="block font-bold">Impôt sur le Revenu Global</span>
                  <span>(IRG), catégorie ....................</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-black flex items-center justify-center">
                  {formData.regime === 'IFU' && <span className="font-bold text-[10px]">X</span>}
                </div>
                <div className="text-center leading-tight">
                  <span className="block font-bold">Impôt forfaitaire Unique</span>
                  <span>(IFU)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TITRE PRINCIPAL */}
        <div className="bg-[#fcfbe3] border border-black p-1 text-center mb-1 print:bg-[#fcfbe3]">
          <h2 className="text-lg font-bold uppercase">- Déclaration d'existence -</h2>
          <p className="text-[9px] font-bold">(Article 51 du CTCA et article 183 du CIDTA)</p>
        </div>

        <div className="border border-black px-2 py-1 text-center mb-1 bg-white">
          <p className="text-[9px] font-bold leading-tight">Déclaration à souscrire dans les trente (30) jours qui suivent la date de début de l’activité, auprès des services des impôts dont relève l’activité exercée.</p>
        </div>

        {/* CORPS DU FORMULAIRE */}
        <div className="border border-black bg-[#e2efdb] print:bg-[#e2efdb]">
          <div className="border-b border-black p-1 text-center text-[10px] font-bold">
            RENSEIGNEMENTS CONCERNANT LE CONTRIBUABLE :
          </div>
        </div>
          
        <div className="border-x border-b border-black p-3 space-y-3 text-[9px] bg-white">
            {/* Ligne 1 : Nom */}
            <div className="flex items-end gap-1">
              <span className="font-bold whitespace-nowrap">- Nom, Prénom/ Raison sociale :</span>
              <div className="border-b border-dotted border-black flex-1 text-[10px] font-bold uppercase px-2">{formData.nomRaison}</div>
            </div>

            {/* Ligne 2 : NIN */}
            <div className="flex items-center gap-2">
              <span className="font-bold whitespace-nowrap">- Numéro d'Identification National (NIN) :</span>
              <div className="flex-1">
                <GridInput length={18} value={formData.nin} onChange={v => handleChange('nin', v)} />
              </div>
            </div>

            {/* Ligne 3 : Forme Juridique */}
            <div className="flex items-end gap-1">
              <span className="font-bold whitespace-nowrap">- Forme juridique (1) :</span>
              <div className="border-b border-dotted border-black flex-1 text-[10px] uppercase px-2">{formData.formeJuridique}</div>
            </div>

            {/* Ligne 4 : Activité Principale */}
            <div className="flex items-end gap-1">
              <span className="font-bold whitespace-nowrap">- Activité principale :</span>
              <div className="border-b border-dotted border-black flex-1 text-[10px] uppercase px-2">{formData.activitePrincipale}</div>
            </div>

            {/* Ligne 5 : Activités Secondaires */}
            <div className="flex flex-col gap-1">
              <span className="font-bold">- Activités secondaires ainsi que leurs adresses :</span>
              <div className="border-b border-dotted border-black w-full h-4 text-[10px] uppercase px-2">{formData.activitesSecondaires}</div>
              <div className="border-b border-dotted border-black w-full h-4"></div>
              <div className="border-b border-dotted border-black w-full h-4"></div>
            </div>

            {/* Ligne 6 : Siège Social */}
            <div className="flex flex-col gap-1">
              <span className="font-bold">- Adresse du siège social ou du lieu d’exercice de l’activité :</span>
              <div className="border-b border-dotted border-black w-full text-[10px] uppercase px-2">{formData.adresseSiege}</div>
              <div className="border-b border-dotted border-black w-full h-4"></div>
            </div>

            {/* Ligne 7 : Etablissement Etranger (NOUVEAU CHAMP) */}
            <div className="flex flex-col gap-1">
              <span className="font-bold">- Adresse de l’établissement en Algérie (cadre réservé aux sociétés étrangères) (2) :</span>
              <div className="border-b border-dotted border-black w-full text-[10px] uppercase px-2">{formData.adresseEtablissement}</div>
              <div className="border-b border-dotted border-black w-full h-4"></div>
            </div>

            {/* Ligne 8 : Domicile (NOUVEAU CHAMP) */}
            <div className="flex flex-col gap-1">
              <span className="font-bold">- Adresse du domicile du contribuable en Algérie ou à l’étranger s’il s’agit d’un non-résident :</span>
              <div className="border-b border-dotted border-black w-full text-[10px] uppercase px-2">{formData.adresseDomicile}</div>
              <div className="border-b border-dotted border-black w-full h-4"></div>
            </div>

            {/* Ligne 9 : Tel / Email */}
            <div className="flex gap-4">
              <div className="flex items-end gap-1 flex-1">
                <span className="font-bold whitespace-nowrap">- Numéro de tél :</span>
                <div className="border-b border-dotted border-black flex-1 text-[10px] px-2">{formData.tel}</div>
              </div>
              <div className="flex items-end gap-1 flex-1">
                <span className="font-bold whitespace-nowrap">- Adresse e-mail :</span>
                <div className="border-b border-dotted border-black flex-1 text-[10px] px-2">{formData.email}</div>
              </div>
            </div>

            {/* Ligne 10 : RC */}
            <div className="flex items-end gap-1">
              <span className="font-bold whitespace-nowrap">- Numéro du Registre de Commerce :</span>
              <div className="border-b border-dotted border-black flex-1 text-[10px] uppercase px-2">{formData.rc}</div>
            </div>

            {/* Ligne 11 : Agrément */}
            <div className="flex items-end gap-1">
              <span className="font-bold whitespace-nowrap">- Numéro de l’agrément, de la carte d'artisan/agriculteur/auto-entrepreneur(3) :</span>
              <div className="border-b border-dotted border-black flex-1 text-[10px] uppercase px-2">{formData.agrement}</div>
            </div>

            {/* Ligne 12 : Qualité */}
            <div className="flex items-center gap-4 py-1">
              <span className="font-bold whitespace-nowrap">- Qualité du déclarant :</span>
              <div className="flex gap-4">
                 <span className={`${formData.qualite === 'Propriétaire' ? 'font-bold' : 'line-through text-slate-400'}`}>Propriétaire</span>
                 <span className="font-bold">-</span>
                 <span className={`${formData.qualite === 'Locataire' ? 'font-bold' : 'line-through text-slate-400'}`}>Locataire</span>
                 <span className="font-bold">-</span>
                 <span className={`${formData.qualite === 'Gérant libre' ? 'font-bold' : 'line-through text-slate-400'}`}>Gérant libre</span>
                 <span className="font-bold">-</span>
                 <span className={`${formData.qualite === 'Gérant' ? 'font-bold' : 'line-through text-slate-400'}`}>Gérant (3)</span>
              </div>
            </div>

            {/* Ligne 13 : Date Début */}
            <div className="flex items-end gap-1 justify-center py-2">
              <span className="font-bold whitespace-nowrap text-sm">- Date de début d’activité :</span>
              <div className="border-b border-dotted border-black w-48 text-center text-sm font-bold">{formData.dateDebut}</div>
            </div>
        </div>

        {/* PIED DE PAGE FORMULAIRE */}
        <div className="mt-1 border border-black p-1 text-center font-bold text-[10px] bg-[#e2efdb] print:bg-[#e2efdb]">
          J’atteste de l’exactitude des renseignements portés sur la présente déclaration.
        </div>

        <div className="flex mt-1 border border-black min-h-[40mm]">
          <div className="w-[60%] p-2 text-[8px] space-y-1 leading-tight border-r border-black">
            <p><strong>(1)</strong> Indiquer s’il s’agit d’une personne morale ou d’une personne physique.</p>
            <p><strong>(2)</strong> Pour les sociétés étrangères, joindre une copie du ou des contrats conclus, ainsi que le mandat du représentant légal.</p>
            <p><strong>(3)</strong> Rayer les mentions inutiles.</p>
          </div>
          <div className="flex-1 p-2 relative">
            <div className="text-[10px] font-bold mb-4">
              A ................................................, le ......................................
              <div className="absolute top-2 left-8 font-mono">{formData.villeSignature}</div>
              <div className="absolute top-2 right-12 font-mono">{formData.dateSignature}</div>
            </div>
            <p className="text-center text-[10px] font-bold mt-4">Cachet et signature du contribuable</p>
          </div>
        </div>

      </div>

      {/* PAGE 2 : DOCUMENTS À FOURNIR (Imprimable sur page séparée) */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full min-h-[297mm] p-[10mm] mt-8 print:break-before-page text-black font-sans border-0 box-border">
        <div className="bg-[#e2efdb] border border-black p-2 text-center mb-8 print:bg-[#e2efdb]">
          <h2 className="text-sm font-bold uppercase">DOCUMENTS A FOURNIR A L’APPUI DE CETTE DECLARATION :</h2>
        </div>

        <div className="space-y-8 text-[10px] font-medium">
          {/* Section 1 : Personnes Morales */}
          <div className={`p-4 rounded border border-black ${formData.formeJuridique.includes('SARL') || formData.formeJuridique.includes('EURL') ? 'bg-slate-50' : ''}`}>
            <h3 className="font-bold text-xs mb-3 underline">
              1. Pour les personnes morales :
            </h3>
            <ul className="list-disc pl-8 space-y-1 marker:text-black">
              <li>Copie des statuts ;</li>
              <li>Spécimen de signature du Gérant ;</li>
              <li>Copie du registre de commerce ;</li>
              <li>Copie du contrat de location ou de l’acte de propriété ou tout document en tenant lieu ;</li>
              <li>Acte de naissance n°12 du Gérant.</li>
            </ul>
          </div>

          {/* Section 2 : Personnes Physiques */}
          <div className={`p-4 rounded border border-black ${formData.formeJuridique.includes('Physique') && !formData.agrement ? 'bg-slate-50' : ''}`}>
            <h3 className="font-bold text-xs mb-3 underline">
              2. Pour les personnes physiques :
            </h3>
            <ul className="list-disc pl-8 space-y-1 marker:text-black">
              <li>Copie du registre de commerce ou tout document en tenant lieu (agrément, carte d’artisan/agriculteur) ;</li>
              <li>Copie du contrat de location ou de l'acte de propriété ou tout document en tenant lieu ;</li>
              <li>Acte de naissance n°12.</li>
            </ul>
          </div>

          {/* Section 3 : Auto-entrepreneur */}
          <div className={`p-4 rounded border border-black ${formData.agrement ? 'bg-slate-50' : ''}`}>
            <h3 className="font-bold text-xs mb-3 underline">
              3. Pour les personnes physiques exerçant des activités sous le statut de l‘auto-entrepreneur :
            </h3>
            <ul className="list-disc pl-8 space-y-1 marker:text-black">
              <li>Copie de la carte d’auto-entrepreneur ;</li>
              <li>Copie de l’attestation portant le Numéro d’Identification Fiscale (NIF) ;</li>
              <li>Copie du titre justifiant l’occupation du local abritant l’activité (contrat de location, acte de propriété ou tout document en tenant lieu, certificat de résidence lorsque l’activité est exercée au domicile du contribuable ou tout autre document justifiant l’exercice de l’activité dans un espace de travail commun).</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExistenceForm;
