import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, 
  X, 
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  FileText,
  Search,
  Plus,
  Edit2,
  UserCheck,
  MapPin,
  BookOpen,
  Users,
  Briefcase,
  Coins,
  Download,
  Trash2,
  Eye,
  Heart,
  Wallet,
  Layout,
  ChevronDown,
  Building,
  User,
  Calculator,
  ArrowRight,
  Tractor,
  Ruler,
  Landmark,
  CreditCard,
  Star
} from 'lucide-react';
import { AppView, ConfigField, Taxpayer, ExclusionRule, RegimeConfig, Partner, AccountantInfo, BankAccount } from '../types';
import { Jurisdiction } from '../data/jurisdictions';
import { NAAActivity, detectExclusion } from '../data/naa_data';

interface TaxpayerManagementProps {
  taxpayers: Taxpayer[];
  setTaxpayers: React.Dispatch<React.SetStateAction<Taxpayer[]>>;
  onViewChange: (view: AppView) => void;
  configFields: ConfigField[];
  onContextUpdate: (ctx: { name: string, activity: string, activityCode: string, estimatedCA: number, category: 'BIC' | 'BNC', typeContribuable: 'PHYSIQUE' | 'MORALE' | 'AGRICOLE' }) => void;
  ifuThreshold: number;
  jurisdictions: Jurisdiction[];
  naaData: NAAActivity[];
  exclusionRules: ExclusionRule[];
  regimeConfig: RegimeConfig[];
}

const TaxpayerManagement: React.FC<TaxpayerManagementProps> = ({ 
  taxpayers, setTaxpayers, configFields, ifuThreshold, jurisdictions, naaData, exclusionRules, onViewChange, onContextUpdate, regimeConfig
}) => {
  // État de l'interface
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Données du formulaire (Données dynamiques issues du Studio)
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<'PHYSIQUE' | 'MORALE' | 'AGRICOLE'>('PHYSIQUE');

  // --- NOUVEAUX ETATS POUR G1 ---
  const [personalInfo, setPersonalInfo] = useState({
      birthDate: '',
      birthPlace: '',
      familyStatus: 'CELIBATAIRE' as 'CELIBATAIRE' | 'MARIE' | 'VEUF' | 'DIVORCE',
      childrenCount: 0
  });
  const [spouseInfo, setSpouseInfo] = useState({
      name: '',
      birthDate: '',
      birthPlace: '',
      nif: '',
      nin: ''
  });
  
  // GESTION DES COMPTES BANCAIRES (INTEGRÉE)
  const [managedAccounts, setManagedAccounts] = useState<BankAccount[]>([]);
  const [newAccount, setNewAccount] = useState({ bankName: 'BEA', rib: '', type: 'BANCAIRE' as 'BANCAIRE'|'POSTAL'|'TRESOR' });
  
  // --- NOUVEAUX ETATS POUR AGRICOLE (G15 Specifique) ---
  const [agriInfo, setAgriInfo] = useState({
      surface: '',
      locationType: 'NORD' as 'SUD' | 'HAUTS_PLATEAUX' | 'MONTAGNE' | 'NORD' | 'AUTRE',
      exploitationAddress: '',
      dateDebut: ''
  });

  // --- NOUVEAUX ETATS POUR G11 ---
  const [homeAddress, setHomeAddress] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [accountant, setAccountant] = useState<AccountantInfo>({
      salaried: false, name: '', address: '', nif: '', nin: ''
  });
  // -----------------------------

  // Filtres du tableau
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegime, setFilterRegime] = useState('ALL');
  const [filterWilaya, setFilterWilaya] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // États pour la localisation (Cascading Selects)
  const [selectedDri, setSelectedDri] = useState<string>('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<string>('');
  const [selectedCpiId, setSelectedCpiId] = useState<string>('');

  // États pour l'autocomplétion NAA
  const [naaSearchTerm, setNaaSearchTerm] = useState('');
  const [showNaaSuggestions, setShowNaaSuggestions] = useState(false);

  // --- LOGIQUE METIER & CALCULS ---

  // Valeurs calculées pour l'intelligence fiscale (on se base sur les IDs standards du Studio)
  const estimatedCA = Number(formData['ca_estim'] || 0);
  const employeeCount = Number(formData['employee_count'] || 0);
  const activityCode = formData['code_act'] || '';
  const activityLabel = formData['7'] || ''; 

  // Filtrage des activités NAA
  const filteredNaa = useMemo(() => {
    if (!naaSearchTerm) return [];
    const lower = naaSearchTerm.toLowerCase();
    return naaData.filter(act => 
      act.code.includes(lower) || act.label.toLowerCase().includes(lower)
    ).slice(0, 5);
  }, [naaSearchTerm, naaData]);

  const handleSelectNaa = (activity: NAAActivity) => {
    setFormData(prev => ({
      ...prev,
      'code_act': activity.code,
      '7': activity.label
    }));
    setNaaSearchTerm(activity.code);
    setShowNaaSuggestions(false);
  };

  // Listes déroulantes pour la localisation
  const dris = useMemo(() => Array.from(new Set(jurisdictions.map(j => j.dri))).sort(), [jurisdictions]);

  const wilayas = useMemo(() => {
    if (!selectedDri) return [];
    const filtered = jurisdictions.filter(j => j.dri === selectedDri);
    const unique = new Map();
    filtered.forEach(j => unique.set(j.wilayaCode, j.wilayaName));
    return Array.from(unique.entries()).map(([code, name]) => ({ code, name })).sort((a, b) => Number(a.code) - Number(b.code));
  }, [selectedDri, jurisdictions]);

  const cpis = useMemo(() => {
    if (!selectedWilayaCode) return [];
    return jurisdictions.filter(j => j.wilayaCode === selectedWilayaCode);
  }, [selectedWilayaCode, jurisdictions]);

  const communes = useMemo(() => {
    if (!selectedCpiId) return [];
    const cpi = jurisdictions.find(j => j.id === selectedCpiId);
    return cpi ? cpi.communes : [];
  }, [selectedCpiId, jurisdictions]);

  // Remplissage automatique des champs liés au CPI
  useEffect(() => {
    const cpi = jurisdictions.find(j => j.id === selectedCpiId);
    if (cpi) {
      setFormData(prev => ({
        ...prev,
        'cpi_rattachement': cpi.cpi,
        'recette_affectee': cpi.recette,
        'wilaya': cpi.wilayaName,
        'wilaya_code': cpi.wilayaCode
      }));
    }
  }, [selectedCpiId, jurisdictions]);

  // Détection automatique du régime fiscal
  const classification = useMemo(() => {
    const exclusion = detectExclusion(activityCode, activityLabel, exclusionRules);
    
    // Essayer de trouver l'ID du régime dans la config pour la suggestion
    let suggestedId = 'IFU'; 
    let suggestedLabel = 'Impôt Forfaitaire Unique';
    let description = 'Éligible au régime forfaitaire (CA < Seuil).';
    
    if (exclusion.isExcluded) {
      suggestedId = 'NORMAL';
      suggestedLabel = 'Régime Réel Normal';
      description = `Exclu de l'IFU : ${exclusion.reason}`;
    } else if (estimatedCA > ifuThreshold) {
      suggestedId = 'SIMPLIFI';
      suggestedLabel = 'Régime Simplifié';
      description = 'Dépassement du seuil IFU.';
    }

    // Gestion Personne Morale (Toujours Réel IBS)
    if (selectedType === 'MORALE') {
        suggestedId = 'NORMAL';
        suggestedLabel = 'Réel Normal (IBS)';
        description = 'Société soumise à l\'IBS.';
    }

    return { suggestedId, suggestedLabel, description, isExcluded: exclusion.isExcluded };
  }, [estimatedCA, activityCode, activityLabel, ifuThreshold, exclusionRules, selectedType]);

  // Suggestions d'obligations fiscales
  const dynamicObligations = useMemo(() => {
    const g50Periodicity = employeeCount > 10 ? 'Mensuelle (Obligatoire > 10 salariés)' : 'Trimestrielle';

    if (classification.suggestedId === 'IFU') {
      const obls = [
        { icon: FileText, color: 'text-blue-500', label: 'G12 (Annuelle)', text: 'Déclaration prévisionnelle.' },
        { icon: BookOpen, color: 'text-purple-500', label: 'Tenue des registres', text: 'Achats & Ventes paraphés.' }
      ];
      if (employeeCount > 0) obls.push({ icon: Users, color: 'text-indigo-500', label: `G50 Salariés (${g50Periodicity})`, text: 'IRG sur salaires.' });
      return obls;
    } else {
      return [
        { icon: CheckCircle2, color: 'text-green-500', label: `G50 ${g50Periodicity}`, text: 'TVA, TAP et Salaires.' },
        { icon: Lightbulb, color: 'text-amber-500', label: 'Liasse Fiscale', text: 'Bilan annuel complet.' }
      ];
    }
  }, [classification.suggestedId, employeeCount]);

  // --- GESTION DES ASSOCIÉS ---
  const addPartner = () => {
      setPartners([...partners, { id: Date.now().toString(), name: '', share: 0, address: '', nif: '', nin: '' }]);
  };
  const removePartner = (id: string) => {
      setPartners(partners.filter(p => p.id !== id));
  };
  const updatePartner = (id: string, field: keyof Partner, value: any) => {
      setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // --- GESTION DES COMPTES (NOUVEAU) ---
  const addAccount = () => {
      if(!newAccount.rib) return;
      // Auto correction Nom banque si type change
      let bank = newAccount.bankName;
      if (newAccount.type === 'POSTAL') bank = 'Algérie Poste (CCP)';
      if (newAccount.type === 'TRESOR') bank = 'Trésor Public';

      setManagedAccounts([...managedAccounts, {
          id: `acc_${Date.now()}`,
          taxpayerId: editingId || 'temp',
          type: newAccount.type,
          bankName: bank,
          rib: newAccount.rib,
          owner: formData['1'] || 'Titulaire',
          isDefault: managedAccounts.length === 0,
          logoColor: 'text-slate-900'
      }]);
      setNewAccount({ bankName: 'BEA', rib: '', type: 'BANCAIRE' });
  };

  const removeAccount = (id: string) => {
      setManagedAccounts(managedAccounts.filter(a => a.id !== id));
  };

  const setDefaultAccount = (id: string) => {
      setManagedAccounts(managedAccounts.map(a => ({...a, isDefault: a.id === id})));
  };

  // --- GESTION DU CRUD ---

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({});
    setPersonalInfo({ birthDate: '', birthPlace: '', familyStatus: 'CELIBATAIRE', childrenCount: 0 });
    setSpouseInfo({ name: '', birthDate: '', birthPlace: '', nif: '', nin: '' });
    setManagedAccounts([]);
    setAgriInfo({ surface: '', locationType: 'NORD', exploitationAddress: '', dateDebut: '' });
    setHomeAddress('');
    setPartners([]);
    setAccountant({ salaried: false, name: '', address: '', nif: '', nin: '' });
    setSelectedDri('');
    setSelectedWilayaCode('');
    setSelectedCpiId('');
    setNaaSearchTerm('');
  };

  const handleSave = () => {
    // Si aucun régime sélectionné, on prend la suggestion
    const selectedRegimeId = formData['5'] || classification.suggestedId;

    // Fusion des données Agri dans dynamicData pour persistance
    const dataToSave = { ...formData };
    if (selectedType === 'AGRICOLE') {
        dataToSave['agri_surface'] = agriInfo.surface;
        dataToSave['agri_zone'] = agriInfo.locationType;
        dataToSave['agri_address'] = agriInfo.exploitationAddress;
        dataToSave['11'] = agriInfo.dateDebut; // Date début activité standard
    }

    const newEntry: Taxpayer = {
      id: editingId || Date.now().toString(),
      typeContribuable: selectedType,
      hasSalaries: employeeCount > 0,
      employeeCount: employeeCount,
      regimeSelectionne: selectedRegimeId,
      dynamicData: dataToSave,
      
      // MAPPING NOUVEAUX CHAMPS G1
      birthDate: personalInfo.birthDate,
      birthPlace: personalInfo.birthPlace,
      familyStatus: personalInfo.familyStatus,
      childrenCount: personalInfo.childrenCount,
      spouse: personalInfo.familyStatus === 'MARIE' ? spouseInfo : undefined,
      personalAccounts: { // Retro-compatibilité avec G1Form
          tresor: managedAccounts.find(a => a.type === 'TRESOR')?.rib || '',
          postal: managedAccounts.find(a => a.type === 'POSTAL')?.rib || '',
          bancaire: managedAccounts.find(a => a.type === 'BANCAIRE')?.rib || ''
      },
      
      // MAPPING NOUVEAUX CHAMPS G11 / AGRICOLE
      homeAddress: homeAddress,
      partners: partners,
      accountant: accountant,
      
      exonerations: { anade: false, cnac: false, angem: false, artisanat: false, autres: false },
      commune: formData['commune'] || '',
      wilaya: formData['wilaya'] || '',
      wilayaCode: formData['wilaya_code'] || '',
      cpiRattachement: formData['cpi_rattachement'] || '',
      recetteAffectee: formData['recette_affectee'] || '',
      driRattachement: selectedDri,
      status: 'ACTIF'
    };

    if (editingId) {
      setTaxpayers(prev => prev.map(t => t.id === editingId ? newEntry : t));
    } else {
      setTaxpayers(prev => [newEntry, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (taxpayer: Taxpayer) => {
    setFormData({
        ...taxpayer.dynamicData,
        '5': taxpayer.regimeSelectionne // S'assurer que le champ Régime est bien peuplé
    });
    setSelectedType(taxpayer.typeContribuable);
    setEditingId(taxpayer.id);

    // Chargement des données État Civil
    setPersonalInfo({
        birthDate: taxpayer.birthDate || '',
        birthPlace: taxpayer.birthPlace || '',
        familyStatus: taxpayer.familyStatus || 'CELIBATAIRE',
        childrenCount: taxpayer.childrenCount || 0
    });
    if (taxpayer.spouse) {
        setSpouseInfo({
            ...taxpayer.spouse,
            nif: taxpayer.spouse.nif || '',
            nin: taxpayer.spouse.nin || ''
        });
    }
    
    // Chargement des comptes (Simulation depuis les props existantes pour l'exemple)
    const existingAccounts: BankAccount[] = [];
    if (taxpayer.personalAccounts?.bancaire) existingAccounts.push({ id: 'acc_1', taxpayerId: taxpayer.id, type: 'BANCAIRE', bankName: 'BEA', rib: taxpayer.personalAccounts.bancaire, owner: taxpayer.dynamicData['1'] || '', isDefault: true, logoColor: '' });
    if (taxpayer.personalAccounts?.postal) existingAccounts.push({ id: 'acc_2', taxpayerId: taxpayer.id, type: 'POSTAL', bankName: 'CCP', rib: taxpayer.personalAccounts.postal, owner: taxpayer.dynamicData['1'] || '', isDefault: false, logoColor: '' });
    
    setManagedAccounts(existingAccounts);
    
    // Chargement Agri
    if (taxpayer.typeContribuable === 'AGRICOLE') {
        setAgriInfo({
            surface: taxpayer.dynamicData['agri_surface'] || '',
            locationType: (taxpayer.dynamicData['agri_zone'] as any) || 'NORD',
            exploitationAddress: taxpayer.dynamicData['agri_address'] || '',
            dateDebut: taxpayer.dynamicData['11'] || ''
        });
    }

    // Chargement G11 Support
    setHomeAddress(taxpayer.homeAddress || '');
    setPartners(taxpayer.partners || []);
    if (taxpayer.accountant) {
        setAccountant(taxpayer.accountant);
    } else {
        setAccountant({ salaried: false, name: '', address: '', nif: '', nin: '' });
    }
    
    // Restaurer les sélections géographiques
    setSelectedDri(taxpayer.driRattachement);
    setSelectedWilayaCode(taxpayer.wilayaCode);
    
    // Trouver le CPI correspondant
    const cpiObj = jurisdictions.find(j => j.cpi === taxpayer.cpiRattachement);
    if (cpiObj) setSelectedCpiId(cpiObj.id);
    
    setIsAddingNew(true);
  };

  // --- CONNECTEUR CLÉ AVEC LE MODULE RÉGIME FISCAL ---
  const handleView = (taxpayer: Taxpayer) => {
    // 1. Mettre à jour le contexte global avec TOUTES les infos nécessaires
    onContextUpdate({
      name: taxpayer.dynamicData['1'] || 'Contribuable',
      activity: taxpayer.dynamicData['7'] || 'Activité inconnue',
      activityCode: taxpayer.dynamicData['code_act'] || '',
      estimatedCA: Number(taxpayer.dynamicData['ca_estim'] || 0),
      category: 'BIC', // Par défaut BIC, le module régime affinera
      typeContribuable: taxpayer.typeContribuable // ESSENTIEL : Passe le type (Physique/Morale/Agricole)
    });
    // 2. Rediriger vers la vue détails
    onViewChange('regime_details');
  };

  const handleDelete = (id: string) => {
    if (confirm("Confirmer la suppression du dossier ?")) {
      setTaxpayers(prev => prev.filter(t => t.id !== id));
    }
  };

  // Filtrage du tableau
  const filteredTaxpayers = useMemo(() => {
    return taxpayers.filter(t => {
      const s = searchQuery.toLowerCase();
      const matchesSearch = t.dynamicData['1']?.toLowerCase().includes(s) || t.dynamicData['2']?.includes(s);
      const matchesRegime = filterRegime === 'ALL' || t.regimeSelectionne === filterRegime;
      const matchesWilaya = filterWilaya === 'ALL' || t.wilaya === filterWilaya;
      const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchesSearch && matchesRegime && matchesWilaya && matchesStatus;
    });
  }, [taxpayers, searchQuery, filterRegime, filterWilaya, filterStatus]);

  const uniqueWilayas = useMemo(() => Array.from(new Set(taxpayers.map(t => t.wilaya))).filter(Boolean), [taxpayers]);

  // --- MOTEUR DE RENDU DES CHAMPS DYNAMIQUES (STUDIO) ---
  const renderFieldInput = (field: ConfigField) => {
    const value = formData[field.id] || '';
    
    return (
      <div key={field.id} className="space-y-2">
        <label className="text-xs font-bold text-slate-700">
           {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {/* CAS 1 : LISTE DÉROULANTE (SPECIFIED) */}
        {field.inputType === 'specified' && field.options ? (
           <div className="relative">
              <select
                value={value}
                onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                {field.options.split(',').map(opt => (
                   <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
        ) : (
           /* CAS 2 : CHAMP LIBRE (TEXTE, DATE, NUMERIQUE) */
           <input
             type={field.nature === 'date' ? 'date' : 'text'}
             maxLength={field.maxLength}
             value={value}
             onChange={e => {
                const val = e.target.value;
                // Validation numérique stricte si nécessaire
                if (['numeric', 'nif', 'nin', 'article'].includes(field.nature) && val !== '' && !/^\d*$/.test(val)) return;
                setFormData({ ...formData, [field.id]: val });
             }}
             className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all ${['nif', 'nin', 'article'].includes(field.nature) ? 'font-mono tracking-wider' : ''}`}
             placeholder={field.label}
           />
        )}
      </div>
    );
  };

  // --- FONCTION DE FILTRAGE DES CHAMPS DU STUDIO ---
  // Affiche uniquement les champs configurés pour le type sélectionné
  const getFieldsBySection = (section: string) => {
    return configFields.filter(f => 
       (f.section || 'AUTRE') === section && 
       // Si targetTypes est vide ou indéfini, on affiche pour tous. Sinon, on vérifie si le type actuel est dedans.
       (!f.targetTypes || f.targetTypes.length === 0 || f.targetTypes.includes(selectedType))
    );
  };

  // Helper pour afficher le label du régime
  const getRegimeLabel = (id: string) => regimeConfig.find(r => r.id === id)?.label || id;
  const getRegimeColor = (id: string) => {
     const regime = regimeConfig.find(r => r.id === id);
     if (regime?.id === 'IFU') return 'bg-blue-50 text-blue-600 border-blue-100';
     if (regime?.id === 'SIMPLIFI') return 'bg-orange-50 text-orange-600 border-orange-100';
     return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <div className="min-h-full bg-[#f8fafc] p-6 md:p-12 pb-32 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-slate-900 rounded-lg"><ShieldCheck className="w-6 h-6 text-white" /></div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion du Contribuable</h1>
        </div>
        {!isAddingNew && (
          <button onClick={() => setIsAddingNew(true)} className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
             <Plus className="w-4 h-4" /> Nouveau Contribuable
          </button>
        )}
      </div>

      {isAddingNew ? (
        // FORMULAIRE D'AJOUT / ÉDITION
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">{editingId ? 'Modifier le Dossier' : 'Nouveau Dossier'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
           </div>

           {/* CARTE INTELLIGENCE FISCALE */}
           <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-8 flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg"><Sparkles className="w-5 h-5" /></div>
                    <h3 className="text-lg font-black text-slate-900">Régime Détecté</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide ${classification.suggestedId === 'IFU' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                       {classification.suggestedLabel}
                    </span>
                    <p className="text-xs text-slate-500">{classification.description}</p>
                 </div>
              </div>
              <div className="flex-1 space-y-3 border-l border-blue-200 pl-8">
                 <h4 className="text-xs font-black uppercase text-slate-500">Obligations Suggerées</h4>
                 {dynamicObligations.map((obl, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <obl.icon className={`w-4 h-4 ${obl.color}`} />
                       <span className="text-xs font-bold text-slate-700">{obl.label}</span>
                       <span className="text-[10px] text-slate-400">- {obl.text}</span>
                    </div>
                 ))}
              </div>
           </div>
           
           {/* TYPE DE CONTRIBUABLE SELECTEUR (Modifié avec AGRICOLE) */}
           <div className="flex justify-center">
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                 <button onClick={() => setSelectedType('PHYSIQUE')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${selectedType === 'PHYSIQUE' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}>Personne Physique</button>
                 <button onClick={() => setSelectedType('MORALE')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${selectedType === 'MORALE' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}>Personne Morale</button>
                 <button onClick={() => setSelectedType('AGRICOLE')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${selectedType === 'AGRICOLE' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Tractor className="w-3 h-3" /> Exploitation Agricole
                 </button>
              </div>
           </div>

           {/* SECTION 1 : IDENTIFICATION (DYNAMIQUE STUDIO) */}
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Champs dynamiques définis dans le Studio pour la section IDENTIFICATION */}
                 {getFieldsBySection('IDENTIFICATION').map(renderFieldInput)}
              </div>
           </section>

           {/* SECTION SPÉCIALE AGRICOLE (Nouveau) */}
           {selectedType === 'AGRICOLE' && (
              <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                 <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Tractor className="w-4 h-4 text-green-600" /> Détails de l'Exploitation (G15)</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-700 uppercase">Adresse de l'exploitation</label>
                             <input type="text" value={agriInfo.exploitationAddress} onChange={e => setAgriInfo({...agriInfo, exploitationAddress: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Lieu-dit, Douar..." />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-700 uppercase">Date début exploitation</label>
                                 <input type="date" value={agriInfo.dateDebut} onChange={e => setAgriInfo({...agriInfo, dateDebut: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-700 uppercase">Superficie Totale</label>
                                 <div className="relative">
                                    <input type="text" value={agriInfo.surface} onChange={e => setAgriInfo({...agriInfo, surface: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Ha / a / ca" />
                                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                 </div>
                             </div>
                         </div>
                     </div>
                     
                     <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                         <label className="text-xs font-bold text-slate-700 uppercase block mb-2">Lieu de Situation (Zone)</label>
                         <div className="grid grid-cols-1 gap-2">
                             {[
                                 { id: 'SUD', label: 'Le Sud (Sahara)' },
                                 { id: 'HAUTS_PLATEAUX', label: 'Les Hauts Plateaux' },
                                 { id: 'MONTAGNE', label: 'Zone de Montagne' },
                                 { id: 'NORD', label: 'Terre nouvellement mise en valeur' },
                                 { id: 'AUTRE', label: 'Autre région' }
                             ].map((zone) => (
                                 <label key={zone.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${agriInfo.locationType === zone.id ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                     <input 
                                        type="radio" 
                                        name="zoneType" 
                                        checked={agriInfo.locationType === zone.id} 
                                        onChange={() => setAgriInfo({...agriInfo, locationType: zone.id as any})}
                                        className="text-green-600 focus:ring-green-500"
                                     />
                                     <span className={`text-xs font-bold ${agriInfo.locationType === zone.id ? 'text-green-800' : 'text-slate-600'}`}>{zone.label}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                 </div>
              </section>
           )}
           
           {/* SECTION 2 : ÉTAT CIVIL & FAMILLE (SPÉCIFIQUE G1 - HORS STUDIO) - Uniquement Physique */}
           {selectedType === 'PHYSIQUE' && (
             <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Heart className="w-4 h-4" /> État Civil & Situation Familiale (Page 1 G1)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Contribuable</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Date de Naissance</label>
                            <input type="date" value={personalInfo.birthDate} onChange={e => setPersonalInfo({...personalInfo, birthDate: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Lieu de Naissance</label>
                            <input type="text" value={personalInfo.birthPlace} onChange={e => setPersonalInfo({...personalInfo, birthPlace: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Commune / Wilaya" />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Situation Familiale</label>
                            <select value={personalInfo.familyStatus} onChange={e => setPersonalInfo({...personalInfo, familyStatus: e.target.value as any})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold appearance-none">
                               <option value="CELIBATAIRE">Célibataire</option>
                               <option value="MARIE">Marié(e)</option>
                               <option value="DIVORCE">Divorcé(e)</option>
                               <option value="VEUF">Veuf(ve)</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Enfants à charge</label>
                            <input type="number" value={personalInfo.childrenCount} onChange={e => setPersonalInfo({...personalInfo, childrenCount: parseInt(e.target.value) || 0})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                         </div>
                      </div>
                   </div>

                   {personalInfo.familyStatus === 'MARIE' && (
                      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                         <h4 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">Conjoint</h4>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Nom & Prénom (Jeune fille)</label>
                            <input type="text" value={spouseInfo.name} onChange={e => setSpouseInfo({...spouseInfo, name: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-700">Date Naissance</label>
                               <input type="date" value={spouseInfo.birthDate} onChange={e => setSpouseInfo({...spouseInfo, birthDate: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-700">Lieu Naissance</label>
                               <input type="text" value={spouseInfo.birthPlace} onChange={e => setSpouseInfo({...spouseInfo, birthPlace: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-700">NIF Conjoint</label>
                               <input type="text" value={spouseInfo.nif} onChange={e => setSpouseInfo({...spouseInfo, nif: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-700">NIN Conjoint</label>
                               <input type="text" value={spouseInfo.nin} onChange={e => setSpouseInfo({...spouseInfo, nin: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" />
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             </section>
           )}

           {/* SECTION 3 : COMPTES BANCAIRES (Intégration Complète) */}
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2"><Wallet className="w-4 h-4" /> Comptes & Domiciliation (G1 Page 1)</h3>
             </div>
             
             {/* LISTE DES COMPTES EXISTANTS */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 {managedAccounts.map(account => (
                     <div key={account.id} className={`relative p-4 rounded-xl border-2 flex items-start gap-4 transition-all group ${account.type === 'POSTAL' ? 'bg-yellow-50 border-yellow-200' : account.type === 'TRESOR' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                         <div className={`p-2 rounded-lg ${account.type === 'POSTAL' ? 'bg-yellow-200 text-yellow-800' : account.type === 'TRESOR' ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-800'}`}>
                             {account.type === 'POSTAL' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <h4 className="text-xs font-black uppercase text-slate-700">{account.bankName}</h4>
                                 {account.isDefault && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                             </div>
                             <p className="font-mono text-sm font-bold text-slate-900 mt-1 tracking-wider">{account.rib}</p>
                             <p className="text-[10px] text-slate-500 uppercase mt-1">{account.owner}</p>
                         </div>
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setDefaultAccount(account.id)} className="p-1.5 bg-white rounded border border-slate-200 hover:text-yellow-500" title="Par défaut"><Star className="w-3 h-3" /></button>
                             <button onClick={() => removeAccount(account.id)} className="p-1.5 bg-white rounded border border-slate-200 hover:text-red-500" title="Supprimer"><Trash2 className="w-3 h-3" /></button>
                         </div>
                     </div>
                 ))}
                 
                 {managedAccounts.length === 0 && (
                     <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs italic">
                        Aucun compte bancaire enregistré.
                     </div>
                 )}
             </div>

             {/* FORMULAIRE D'AJOUT RAPIDE */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                 <div className="flex-1 w-full space-y-1">
                     <label className="text-[9px] font-bold text-slate-400 uppercase">Type</label>
                     <select 
                        value={newAccount.type} 
                        onChange={e => setNewAccount({...newAccount, type: e.target.value as any})}
                        className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                     >
                        <option value="BANCAIRE">Compte Bancaire</option>
                        <option value="POSTAL">Compte CCP (Poste)</option>
                        <option value="TRESOR">Compte Trésor</option>
                     </select>
                 </div>
                 {newAccount.type === 'BANCAIRE' && (
                     <div className="flex-1 w-full space-y-1">
                         <label className="text-[9px] font-bold text-slate-400 uppercase">Banque</label>
                         <select 
                            value={newAccount.bankName} 
                            onChange={e => setNewAccount({...newAccount, bankName: e.target.value})}
                            className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                         >
                            <option value="BEA">BEA</option><option value="BNA">BNA</option><option value="CPA">CPA</option><option value="BDL">BDL</option><option value="BADR">BADR</option><option value="CNEP">CNEP</option><option value="AGB">AGB</option><option value="SOCIETE GENERALE">Société Générale</option>
                         </select>
                     </div>
                 )}
                 <div className="flex-[2] w-full space-y-1">
                     <label className="text-[9px] font-bold text-slate-400 uppercase">Numéro de Compte / RIB (20 Chiffres)</label>
                     <input 
                        type="text" 
                        value={newAccount.rib} 
                        onChange={e => setNewAccount({...newAccount, rib: e.target.value})}
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-widest"
                        placeholder="00xxxxxxxxxxxxxxxxxx"
                        maxLength={20}
                     />
                 </div>
                 <button onClick={addAccount} className="h-9 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-primary transition-all flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Ajouter
                 </button>
             </div>
           </section>

           {/* NOUVELLE SECTION : DOMICILE & COMPTABILITÉ */}
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
             <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Building className="w-4 h-4" /> Domicile & Comptabilité (G11 Support)</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Domicile Personnel */}
                 <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Adresse du Domicile Personnel</label>
                        <input type="text" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Adresse complète de résidence..." />
                     </div>
                 </div>

                 {/* Comptable */}
                 <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase">Informations Comptable</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={accountant.salaried} onChange={e => setAccountant({...accountant, salaried: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                            <span className="text-xs text-slate-600">Comptable Salarié</span>
                        </label>
                     </div>
                     {!accountant.salaried && (
                         <div className="space-y-3">
                             <input type="text" value={accountant.name} onChange={e => setAccountant({...accountant, name: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Nom du Cabinet / Expert" />
                             <input type="text" value={accountant.address} onChange={e => setAccountant({...accountant, address: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Adresse Cabinet" />
                             <div className="grid grid-cols-2 gap-3">
                                 <input type="text" value={accountant.nif} onChange={e => setAccountant({...accountant, nif: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" placeholder="NIF Cabinet" />
                                 <input type="text" value={accountant.nin} onChange={e => setAccountant({...accountant, nin: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm" placeholder="NIN Expert" />
                             </div>
                         </div>
                     )}
                 </div>
             </div>
           </section>

           {/* NOUVELLE SECTION : ASSOCIÉS (PARTNERS) / EXPLOITANTS */}
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2"><Users className="w-4 h-4" /> {selectedType === 'AGRICOLE' ? 'Co-Exploitants / Membres' : 'Associés / Partenaires'}</h3>
                <button onClick={addPartner} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1">
                   <Plus className="w-3 h-3" /> Ajouter {selectedType === 'AGRICOLE' ? 'Membre' : 'Associé'}
                </button>
             </div>
             
             <div className="space-y-4">
                 {partners.map((partner, index) => (
                     <div key={partner.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative group">
                         <button onClick={() => removePartner(partner.id)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                         </button>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">Nom & Prénom</label>
                                 <input type="text" value={partner.name} onChange={e => updatePartner(partner.id, 'name', e.target.value)} className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-sm font-bold" />
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">{selectedType === 'AGRICOLE' ? "Part Exploitation (%)" : "Part (%)"}</label>
                                 <input type="number" value={partner.share} onChange={e => updatePartner(partner.id, 'share', parseFloat(e.target.value))} className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-sm font-bold" />
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">NIF</label>
                                 <input type="text" value={partner.nif} onChange={e => updatePartner(partner.id, 'nif', e.target.value)} className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-sm font-mono" />
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">NIN</label>
                                 <input type="text" value={partner.nin} onChange={e => updatePartner(partner.id, 'nin', e.target.value)} className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-sm font-mono" />
                             </div>
                             <div className="col-span-full space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">Adresse Domicile</label>
                                 <input type="text" value={partner.address} onChange={e => updatePartner(partner.id, 'address', e.target.value)} className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-sm" />
                             </div>
                         </div>
                     </div>
                 ))}
                 {partners.length === 0 && (
                     <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        Aucun {selectedType === 'AGRICOLE' ? 'membre' : 'associé'} enregistré.
                     </div>
                 )}
             </div>
           </section>

           {/* SECTION 5 : LOCALISATION (CASCADING + DYNAMIQUE) */}
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><MapPin className="w-4 h-4" /> Localisation Fiscale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Direction Régionale (DRI)</label>
                    <select value={selectedDri} onChange={e => { setSelectedDri(e.target.value); setSelectedWilayaCode(''); setSelectedCpiId(''); }} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold">
                       <option value="">Sélectionner...</option>
                       {dris.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Wilaya</label>
                    <select value={selectedWilayaCode} onChange={e => { setSelectedWilayaCode(e.target.value); setSelectedCpiId(''); }} disabled={!selectedDri} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:bg-slate-100">
                       <option value="">Sélectionner...</option>
                       {wilayas.map(w => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Centre des Impôts (CPI)</label>
                    <select value={selectedCpiId} onChange={e => setSelectedCpiId(e.target.value)} disabled={!selectedWilayaCode} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:bg-slate-100">
                       <option value="">Sélectionner...</option>
                       {cpis.map(c => <option key={c.id} value={c.id}>{c.cpi}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Commune</label>
                    <select value={formData['commune'] || ''} onChange={e => setFormData({...formData, commune: e.target.value})} disabled={!selectedCpiId} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:bg-slate-100">
                       <option value="">Sélectionner...</option>
                       {communes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
           </section>

           {/* SECTION 6 : FISCALITÉ (DYNAMIQUE STUDIO + LOGIQUE MÉTIER) */}
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Coins className="w-4 h-4" /> Données Fiscales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Champs dynamiques CA et Article définis dans le Studio */}
                 {getFieldsBySection('FISCAL').map(renderFieldInput)}
                 
                 {/* Champ Nombre de salariés (Spécifique pour la logique G50) */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Nombre de salariés</label>
                    <input type="number" value={formData['employee_count'] || ''} onChange={e => setFormData({...formData, 'employee_count': e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Régime Fiscal (Forcé)</label>
                    <select 
                       value={formData['5'] || ''} 
                       onChange={e => setFormData({...formData, '5': e.target.value})} 
                       className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                    >
                       <option value="">Automatique ({classification.suggestedLabel})</option>
                       {/* DYNAMIQUE : On utilise la regimeConfig pour remplir le select */}
                       {regimeConfig.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                       ))}
                    </select>
                 </div>
              </div>
           </section>

           {/* SECTION 4 : ACTIVITÉ (DYNAMIQUE STUDIO + WIDGET NAA) */}
           {/* Masqué pour AGRICOLE car pas pertinent */}
           {selectedType !== 'AGRICOLE' && (
           <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Activité</h3>
              <div className="space-y-6">
                 
                 {/* Widget de recherche NAA (Spécial) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                       <label className="text-xs font-bold text-slate-700">Recherche Code Activité (NAA)</label>
                       <div className="relative">
                          <input 
                             value={naaSearchTerm}
                             onChange={e => { setNaaSearchTerm(e.target.value); setShowNaaSuggestions(true); }}
                             className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20"
                             placeholder="Ex: 62.01..."
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                       {showNaaSuggestions && filteredNaa.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                             {filteredNaa.map(act => (
                                <div key={act.code} onClick={() => handleSelectNaa(act)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                                   <span className="font-mono font-bold text-xs text-primary mr-2">{act.code}</span>
                                   <span className="text-xs text-slate-700">{act.label}</span>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                    {/* Champs dynamiques définis dans le Studio pour la section ACTIVITE */}
                    {getFieldsBySection('ACTIVITE').filter(f => f.id !== 'code_act').map(renderFieldInput)}
                 </div>
              </div>
           </section>
           )}

           {/* SECTION 7 : CONTACT (DYNAMIQUE STUDIO) */}
           {getFieldsBySection('CONTACT').length > 0 && (
             <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {getFieldsBySection('CONTACT').map(renderFieldInput)}
                </div>
             </section>
           )}

           {/* SECTION 8 : AUTRE (DYNAMIQUE STUDIO) */}
           {getFieldsBySection('AUTRE').length > 0 && (
             <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Layout className="w-4 h-4" /> Autres Informations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {getFieldsBySection('AUTRE').map(renderFieldInput)}
                </div>
             </section>
           )}

           <div className="flex justify-end gap-4 pb-10">
              <button onClick={resetForm} className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={handleSave} className="px-8 py-3 bg-primary text-white rounded-lg text-sm font-bold shadow-lg hover:bg-primary/90">
                 {editingId ? 'Mettre à jour' : 'Sauvegarder'}
              </button>
           </div>
        </div>
      ) : (
        // VUE TABLEAU ( avec bouton d'action corrigé )
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
           
           {/* BARRE DE FILTRES */}
           <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 shadow-sm">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Rechercher par nom, NIF, code..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20"
                 />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                 <select value={filterRegime} onChange={e => setFilterRegime(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 min-w-[140px]">
                    <option value="ALL">Tous Régimes</option>
                    {regimeConfig.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                 </select>
                 <select value={filterWilaya} onChange={e => setFilterWilaya(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 min-w-[140px]">
                    <option value="ALL">Toutes Wilayas</option>
                    {uniqueWilayas.map(w => <option key={w} value={w}>{w}</option>)}
                 </select>
                 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 min-w-[120px]">
                    <option value="ALL">Tous Statuts</option>
                    <option value="ACTIF">Actif</option>
                    <option value="RADIÉ">Radié</option>
                 </select>
              </div>
           </div>

           {/* TABLEAU */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                       <th className="px-6 py-4">Contribuable / NIF</th>
                       <th className="px-6 py-4">Activité & Code</th>
                       <th className="px-6 py-4">Régime Fiscal</th>
                       <th className="px-6 py-4">Localisation (CPI)</th>
                       <th className="px-6 py-4 text-center">Statut</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredTaxpayers.map(tp => (
                       <tr key={tp.id} className="hover:bg-blue-50/20 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-slate-900 uppercase">{tp.dynamicData['1']}</p>
                                    {tp.typeContribuable === 'AGRICOLE' && <Tractor className="w-3 h-3 text-green-600" />}
                                </div>
                                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-500">{tp.dynamicData['2']}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-1 max-w-[200px]">
                                <p className="text-xs font-bold text-slate-700 truncate" title={tp.dynamicData['7']}>{tp.dynamicData['7']}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Code: {tp.dynamicData['code_act']}</p>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getRegimeColor(tp.regimeSelectionne)}`}>
                                {getRegimeLabel(tp.regimeSelectionne)}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-700">{tp.wilaya}</p>
                                <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{tp.cpiRattachement}</p>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${tp.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${tp.status === 'ACTIF' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                {tp.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* BOUTON ANALYSER RÉGIME (Lien explicite) */}
                                <button onClick={() => handleView(tp)} className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 hover:bg-blue-100 hover:border-blue-200 transition-all group/btn" title="Analyser le Régime Fiscal">
                                   <ShieldCheck className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                </button>
                                
                                <button onClick={() => handleEdit(tp)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(tp.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-500 transition-all" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {filteredTaxpayers.length === 0 && (
                       <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">Aucun dossier trouvé.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
           
           <div className="flex justify-between items-center px-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredTaxpayers.length} Résultat(s)</span>
              <button className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"><Download className="w-4 h-4" /> Export CSV</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaxpayerManagement;