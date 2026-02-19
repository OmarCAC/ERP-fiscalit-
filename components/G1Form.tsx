
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Printer, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Tractor, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft, 
  Coins, 
  Globe,
  LayoutGrid,
  Building2,
  User,
  Calculator,
  MapPin,
  CreditCard,
  Home,
  Percent
} from 'lucide-react';
import { Taxpayer, Declaration } from '../types';

interface Props {
  taxpayer: Taxpayer | null;
  initialData?: Declaration | null; 
  onBack: () => void;
  onSubmit: (dec: Declaration) => void;
}

// --- TYPES & HELPERS ---

const toNum = (val: string | number | undefined): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleanVal = val.replace(/,/g, '.').replace(/\s/g, '');
  const num = parseFloat(cleanVal);
  return isNaN(num) ? 0 : num;
};

const handleNumChange = (val: string, setter: (v: string) => void) => {
  // Accepte chiffres, point, virgule
  if (/^[\d]*[.,]?[\d]*$/.test(val)) setter(val);
};

const formatMoney = (amount: number) => {
    if (amount === 0) return '-';
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Barème IRG 2022
const calculateIrgScale = (income: number): number => {
  let tax = 0;
  if (income <= 240000) return 0;
  if (income > 240000) tax += (Math.min(income, 480000) - 240000) * 0.23;
  if (income > 480000) tax += (Math.min(income, 960000) - 480000) * 0.27;
  if (income > 960000) tax += (Math.min(income, 1920000) - 960000) * 0.30;
  if (income > 1920000) tax += (Math.min(income, 3840000) - 1920000) * 0.33;
  if (income > 3840000) tax += (income - 3840000) * 0.35;
  return Math.floor(tax);
};

interface FamilyMatrix { vous: string; conjoint: string; enfants: string; }
const sumMatrix = (m: FamilyMatrix) => toNum(m.vous) + toNum(m.conjoint) + toNum(m.enfants);

interface ActivityDetails {
  vous: { activite: string; adresse: string };
  conjoint: { activite: string; adresse: string };
  enfants: { activite: string; adresse: string };
}
interface SalaryDetails {
  vous: { profession: string; employeur: string };
  conjoint: { profession: string; employeur: string };
  enfants: { profession: string; employeur: string };
}

const initialMatrix: FamilyMatrix = { vous: '', conjoint: '', enfants: '' };
const initialActivityDetails = {
  vous: { activite: '', adresse: '' },
  conjoint: { activite: '', adresse: '' },
  enfants: { activite: '', adresse: '' }
};
const initialSalaryDetails = {
  vous: { profession: '', employeur: '' },
  conjoint: { profession: '', employeur: '' },
  enfants: { profession: '', employeur: '' }
};

// --- SUB-COMPONENTS UI ---

const SelectionCard = ({ 
  title, icon: Icon, description, selected, onClick 
}: { title: string, icon: any, description: string, selected: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${selected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
  >
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-xl ${selected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className={`text-sm font-black uppercase tracking-tight ${selected ? 'text-primary' : 'text-slate-700'}`}>{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-snug">{description}</p>
      </div>
    </div>
    {selected && (
      <div className="absolute top-4 right-4 text-primary">
        <CheckCircle2 className="w-5 h-5 fill-primary/20" />
      </div>
    )}
  </div>
);

const MatrixInputGroup = ({ title, state, setter, color = 'blue' }: { title: string, state: FamilyMatrix, setter: any, color?: string }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800' },
        green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800' },
        red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-800' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-800' },
        slate: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-800' },
    };
    const c = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
      <div className={`border ${c.border} rounded-xl overflow-hidden mb-4 shadow-sm`}>
         <div className={`${c.bg} px-4 py-3 border-b ${c.border} flex justify-between items-center`}>
            <span className={`text-xs font-black uppercase ${c.text}`}>{title}</span>
            <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
               Total: {sumMatrix(state).toLocaleString('fr-FR')} DA
            </span>
         </div>
         <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
            {['vous', 'conjoint', 'enfants'].map((key) => (
              <div key={key} className={`p-3 ${key === 'conjoint' ? 'bg-slate-50/30' : ''}`}>
                 <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">{key}</label>
                 <input 
                    type="text" 
                    inputMode="decimal"
                    value={(state as any)[key]} 
                    onChange={e => handleNumChange(e.target.value, v => setter({...state, [key]: v}))} 
                    className="w-full text-sm font-bold border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 h-10 px-3 text-right" 
                    placeholder="0" 
                 />
              </div>
            ))}
         </div>
      </div>
    );
};

const ActivityDetailsInputs = ({ 
  titleActivity, 
  titleAddress, 
  state, 
  setter 
}: { 
  titleActivity: string; 
  titleAddress: string; 
  state: ActivityDetails; 
  setter: (val: ActivityDetails) => void; 
}) => (
  <div className="space-y-3">
     <div className="flex gap-4 text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">
        <span className="w-16">Membre</span>
        <span className="flex-1">{titleActivity}</span>
        <span className="flex-1">{titleAddress}</span>
     </div>
     {['vous', 'conjoint', 'enfants'].map((key) => {
        const k = key as keyof ActivityDetails;
        return (
          <div key={key} className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
             <span className="w-16 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-center">{key}</span>
             <input 
                type="text" 
                value={state[k].activite} 
                onChange={e => setter({...state, [k]: {...state[k], activite: e.target.value}})}
                className="flex-1 w-full text-xs border-slate-200 rounded-lg h-9 px-3 font-medium focus:ring-2 focus:ring-primary/20"
                placeholder={titleActivity}
             />
             <input 
                type="text" 
                value={state[k].adresse} 
                onChange={e => setter({...state, [k]: {...state[k], adresse: e.target.value}})}
                className="flex-1 w-full text-xs border-slate-200 rounded-lg h-9 px-3 font-medium focus:ring-2 focus:ring-primary/20"
                placeholder={titleAddress}
             />
          </div>
        );
     })}
  </div>
);

const SalaryDetailsInputs = ({ 
  state, 
  setter 
}: { 
  state: SalaryDetails; 
  setter: (val: SalaryDetails) => void; 
}) => (
  <div className="space-y-3">
     <div className="flex gap-4 text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">
        <span className="w-16">Membre</span>
        <span className="flex-1">Profession</span>
        <span className="flex-1">Employeur</span>
     </div>
     {['vous', 'conjoint', 'enfants'].map((key) => {
        const k = key as keyof SalaryDetails;
        return (
          <div key={key} className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
             <span className="w-16 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-center">{key}</span>
             <input 
                type="text" 
                value={state[k].profession} 
                onChange={e => setter({...state, [k]: {...state[k], profession: e.target.value}})}
                className="flex-1 w-full text-xs border-slate-200 rounded-lg h-9 px-3 font-medium focus:ring-2 focus:ring-primary/20"
                placeholder="Fonction..."
             />
             <input 
                type="text" 
                value={state[k].employeur} 
                onChange={e => setter({...state, [k]: {...state[k], employeur: e.target.value}})}
                className="flex-1 w-full text-xs border-slate-200 rounded-lg h-9 px-3 font-medium focus:ring-2 focus:ring-primary/20"
                placeholder="Employeur..."
             />
          </div>
        );
     })}
  </div>
);

// --- COMPOSANT PRINCIPAL ---

const G1Form: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  
  // --- ÉTATS DE NAVIGATION DU WIZARD ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const [selectedCategories, setSelectedCategories] = useState<{
    bic: boolean;
    bnc: boolean;
    agri: boolean;
    foncier: boolean;
    rcm: boolean;
    salaires: boolean;
    etranger: boolean;
  }>({
    bic: false, bnc: false, agri: false, foncier: false, rcm: false, salaires: false, etranger: false
  });

  // --- ÉTATS DONNÉES ---
  const [previousAddress, setPreviousAddress] = useState('');
  const [impositionCommune, setImpositionCommune] = useState(false);

  // BIC
  const [bicDetails, setBicDetails] = useState<ActivityDetails>({...initialActivityDetails});
  const [bicImp, setBicImp] = useState<FamilyMatrix>({...initialMatrix});
  const [bicExo, setBicExo] = useState<FamilyMatrix>({...initialMatrix});
  const [bicDef, setBicDef] = useState<FamilyMatrix>({...initialMatrix});

  // BNC
  const [bncDetails, setBncDetails] = useState<ActivityDetails>({...initialActivityDetails});
  const [bncImp, setBncImp] = useState<FamilyMatrix>({...initialMatrix});
  const [bncExo, setBncExo] = useState<FamilyMatrix>({...initialMatrix});
  const [bncDef, setBncDef] = useState<FamilyMatrix>({...initialMatrix});

  // AGRI
  const [agriImp, setAgriImp] = useState<FamilyMatrix>({...initialMatrix});
  const [agriExo, setAgriExo] = useState<FamilyMatrix>({...initialMatrix});
  const [agriAddr, setAgriAddr] = useState('');

  // FONCIER
  const [foncierAddr, setFoncierAddr] = useState('');
  const [foncierLib, setFoncierLib] = useState<FamilyMatrix>({...initialMatrix});
  const [foncierProvBrut, setFoncierProvBrut] = useState<FamilyMatrix>({...initialMatrix});

  // RCM
  const [rcmLib, setRcmLib] = useState({ a: '', b: '', c: '', d: '', e: '', f: '' });
  const [rcmCred, setRcmCred] = useState({ a: '', b: '' });

  // SALAIRES
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetails>({...initialSalaryDetails});
  const [salairesEspeces, setSalairesEspeces] = useState<FamilyMatrix>({...initialMatrix});
  const [salairesNature, setSalairesNature] = useState<FamilyMatrix>({...initialMatrix});

  // CHARGES & PV
  const [pvImmoBrut, setPvImmoBrut] = useState(''); 
  const [pvImmoNet, setPvImmoNet] = useState('');
  const [pvActions, setPvActions] = useState('');
  const [revenusEtranger, setRevenusEtranger] = useState('');
  const [charges, setCharges] = useState({
    interets: { organisme: '', date: '', nature: '', montant: '' },
    pensions: { beneficiaire: '', jugement: '', montant: '' },
    assurance: '', cotisations: '', mourabaha: ''
  });

  const [credits, setCredits] = useState({
    bic: '', bnc: '', agri: '', foncier: '', rcm: '', salaires: ''
  });

  // --- CALCUL DYNAMIQUE DES ÉTAPES ---
  const wizardSteps = useMemo(() => {
    const steps = [
      { id: 'selection', label: 'Sources', icon: LayoutGrid },
      { id: 'ident', label: 'Identité', icon: User }
    ];

    if (selectedCategories.bic) steps.push({ id: 'bic', label: 'BIC', icon: Briefcase });
    if (selectedCategories.bnc) steps.push({ id: 'bnc', label: 'BNC', icon: Briefcase });
    if (selectedCategories.agri) steps.push({ id: 'agri', label: 'Agricole', icon: Tractor });
    if (selectedCategories.foncier) steps.push({ id: 'foncier', label: 'Foncier', icon: Home });
    if (selectedCategories.rcm || selectedCategories.salaires) steps.push({ id: 'rcm_sal', label: 'RCM & Salaires', icon: Coins });
    
    // On met toujours les charges à la fin avant le récap
    steps.push({ id: 'charges', label: 'Charges', icon: TrendingUp });
    steps.push({ id: 'recap', label: 'Calcul', icon: Calculator });

    return steps;
  }, [selectedCategories]);

  const activeStepId = wizardSteps[currentStepIndex]?.id;

  // --- IDENTIFICATION ---
  const ident = useMemo(() => ({
    nom: taxpayer?.dynamicData['1']?.split(' ')[0] || '',
    prenom: taxpayer?.dynamicData['1']?.split(' ').slice(1).join(' ') || '',
    adresse: taxpayer?.dynamicData['adresse'] || '',
    nif: taxpayer?.dynamicData['2'] || '',
    commune: taxpayer?.commune || '',
    wilaya: taxpayer?.wilaya || '',
    wilayaCode: taxpayer?.wilayaCode || '',
    birthDate: taxpayer?.birthDate || '',
    birthPlace: taxpayer?.birthPlace || '',
    profession: taxpayer?.dynamicData['7'] || '',
    article: taxpayer?.dynamicData['article_imp'] || '',
    nin: taxpayer?.dynamicData['nin'] || '',
    familyStatus: taxpayer?.familyStatus || 'CELIBATAIRE',
    spouseName: taxpayer?.spouse?.name || '',
    spouseBirthDate: taxpayer?.spouse?.birthDate || '',
    spouseBirthPlace: taxpayer?.spouse?.birthPlace || '',
    spouseNif: taxpayer?.spouse?.nif || '',
    spouseNin: taxpayer?.spouse?.nin || '',
    childrenCount: taxpayer?.childrenCount || 0,
    tel: taxpayer?.dynamicData['tel'] || '',
    accounts: taxpayer?.personalAccounts || {}
  }), [taxpayer]);

  // --- PRE-SELECTION INTELLIGENTE ---
  useEffect(() => {
     if (taxpayer) {
         setBicDetails(prev => ({
             ...prev,
             vous: { activite: taxpayer.dynamicData['7'] || '', adresse: taxpayer.dynamicData['adresse'] || '' }
         }));
         
         const newCats = { ...selectedCategories };
         if (taxpayer.regimeSelectionne.includes('NORMAL')) newCats.bic = true;
         if (taxpayer.typeContribuable === 'PHYSIQUE' && taxpayer.hasSalaries === false) newCats.salaires = false; 
         // Initialisation
     }
  }, [taxpayer]);

  // --- MOTEUR DE CALCUL ---
  const totals = useMemo(() => {
    const totalBicImp = sumMatrix(bicImp);
    const totalBncImp = sumMatrix(bncImp);
    const totalAgriImp = sumMatrix(agriImp);
    const totalFoncierBrut = sumMatrix(foncierProvBrut);
    const totalFoncierNet = totalFoncierBrut * 0.75; 
    const totalFoncierLib = sumMatrix(foncierLib);
    const totalRcmLib = toNum(rcmLib.a) + toNum(rcmLib.b) + toNum(rcmLib.c) + toNum(rcmLib.d) + toNum(rcmLib.e) + toNum(rcmLib.f);
    const totalRcmCredit = toNum(rcmCred.a) + toNum(rcmCred.b);
    const totalSalaires = sumMatrix(salairesEspeces) + sumMatrix(salairesNature);
    const totalEtranger = toNum(revenusEtranger);

    const totalRevenus = totalBicImp + totalBncImp + totalAgriImp + totalFoncierNet + totalRcmCredit + totalSalaires + totalEtranger;
    const totalCharges = toNum(charges.interets.montant) + toNum(charges.pensions.montant) + toNum(charges.assurance) + toNum(charges.cotisations) + toNum(charges.mourabaha);
    
    const revenuNet = Math.max(0, totalRevenus - totalCharges);
    const irgDu = calculateIrgScale(revenuNet);

    const totalCredits = 
        toNum(credits.bic) + toNum(credits.bnc) + toNum(credits.agri) + 
        toNum(credits.foncier) + toNum(credits.rcm) + toNum(credits.salaires);

    const solde = irgDu - totalCredits;
    return {
      totalBicImp, totalBncImp, totalAgriImp, totalFoncierNet, totalFoncierLib,
      totalRcmLib, totalRcmCredit, totalSalaires, totalEtranger,
      totalRevenus, totalCharges, revenuNet, irgDu, totalCredits,
      aPayer: solde > 0 ? solde : 0,
      aRestituer: solde < 0 ? Math.abs(solde) : 0
    };
  }, [bicImp, bncImp, agriImp, foncierProvBrut, foncierLib, rcmLib, rcmCred, salairesEspeces, salairesNature, revenusEtranger, charges, credits]);

  const handleNext = () => setCurrentStepIndex(prev => Math.min(prev + 1, wizardSteps.length - 1));
  const handlePrev = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  
  const toggleCategory = (key: keyof typeof selectedCategories) => {
      setSelectedCategories(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    onSubmit({
      id: initialData?.id || `G1-${Math.floor(Math.random() * 10000)}`,
      type: 'Série G n°1 (Annuelle)',
      period: 'Exercice 2024',
      regime: 'IRG',
      submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
      status: status,
      amount: totals.aPayer,
      taxpayerName: `${ident.nom} ${ident.prenom}`
    });
  };

  // --- VUE WIZARD ---
  const renderWizard = () => (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col pb-32 relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
             <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Déclaration G1</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeStepId === 'selection' ? 'Initialisation' : `Étape ${currentStepIndex + 1} / ${wizardSteps.length} : ${wizardSteps[currentStepIndex].label}`}</p>
             </div>
         </div>
         <div className="flex gap-3">
             <button onClick={() => setViewMode('OFFICIAL')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2"><Printer className="w-4 h-4" /> Aperçu</button>
             <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"><Save className="w-4 h-4" /> Sauvegarder</button>
         </div>
      </div>

      {/* PROGRESS BAR */}
      {activeStepId !== 'selection' && (
         <div className="bg-white border-b border-slate-100 px-8 py-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
               {wizardSteps.slice(1).map((step, idx) => {
                  const realIndex = idx + 1; 
                  const isActive = currentStepIndex === realIndex;
                  const isDone = currentStepIndex > realIndex;
                  return (
                     <div key={step.id} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isActive ? 'bg-primary/10 border-primary text-primary' : isDone ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                           <step.icon className="w-3.5 h-3.5" />
                           <span className="text-[10px] font-black uppercase tracking-wider">{step.label}</span>
                        </div>
                        {idx < wizardSteps.length - 2 && <div className="w-4 h-px bg-slate-200"></div>}
                     </div>
                  );
               })}
            </div>
         </div>
      )}

      {/* CONTENU WIZARD */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 mt-4">
          
          {/* STEP 0: SÉLECTION */}
          {activeStepId === 'selection' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-black text-slate-900">Que souhaitez-vous déclarer ?</h2>
                   <p className="text-slate-500 text-sm">Sélectionnez uniquement les catégories de revenus qui vous concernent.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <SelectionCard title="Commerce (BIC)" icon={Building2} selected={selectedCategories.bic} description="Activités commerciales/industrielles." onClick={() => toggleCategory('bic')} />
                   <SelectionCard title="Professions (BNC)" icon={Briefcase} selected={selectedCategories.bnc} description="Professions libérales." onClick={() => toggleCategory('bnc')} />
                   <SelectionCard title="Agricole" icon={Tractor} selected={selectedCategories.agri} description="Agriculture/Élevage." onClick={() => toggleCategory('agri')} />
                   <SelectionCard title="Foncier" icon={Building2} selected={selectedCategories.foncier} description="Locations immobilières." onClick={() => toggleCategory('foncier')} />
                   <SelectionCard title="Salaires & RCM" icon={User} selected={selectedCategories.salaires} description="Salaires, Retraites, Capitaux." onClick={() => toggleCategory('salaires')} />
                   <SelectionCard title="Revenus Étranger" icon={Globe} selected={selectedCategories.etranger} description="Revenus hors Algérie." onClick={() => toggleCategory('etranger')} />
                </div>
                <div className="flex justify-center pt-8">
                   <button onClick={handleNext} className="bg-primary text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
                      Commencer la saisie <ArrowRight className="w-5 h-5" />
                   </button>
                </div>
             </div>
          )}

          {/* STEP 1: IDENTITÉ */}
          {activeStepId === 'ident' && (
             <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><User className="w-6 h-6 text-primary" /> Identification Fiscale</h2>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">Contribuable</p><p className="font-bold text-slate-800">{ident.nom} {ident.prenom}</p></div>
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">NIF</p><p className="font-mono font-bold text-slate-800">{ident.nif}</p></div>
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">Adresse</p><p className="font-bold text-slate-800 text-xs">{ident.adresse}</p></div>
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">Wilaya</p><p className="font-bold text-slate-800">{ident.wilaya} ({ident.wilayaCode})</p></div>
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-black text-slate-600">Situation Familiale</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">État</p><p className="font-bold text-slate-800">{ident.familyStatus}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Conjoint</p><p className="font-bold text-slate-800">{ident.spouseName || 'Néant'}</p></div>
                    </div>
                </div>
             </div>
          )}

          {/* STEP BIC */}
          {activeStepId === 'bic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><Building2 className="w-6 h-6 text-primary" /> Bénéfices Industriels et Commerciaux</h2>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <ActivityDetailsInputs titleActivity="Activité Exercée" titleAddress="Lieu d'exercice" state={bicDetails} setter={setBicDetails} />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <MatrixInputGroup title="Bénéfice Imposable" state={bicImp} setter={setBicImp} color="blue" />
                    <MatrixInputGroup title="Bénéfice Exonéré" state={bicExo} setter={setBicExo} color="green" />
                    <MatrixInputGroup title="Déficit de l'exercice" state={bicDef} setter={setBicDef} color="red" />
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-500 uppercase w-32">Crédit d'Impôt BIC</label>
                    <input type="text" value={credits.bic} onChange={e => handleNumChange(e.target.value, v => setCredits({...credits, bic: v}))} className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-right font-bold text-sm focus:ring-2 focus:ring-primary/20" placeholder="0.00" />
                </div>
            </div>
          )}

          {/* STEP BNC */}
          {activeStepId === 'bnc' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><Briefcase className="w-6 h-6 text-primary" /> Bénéfices Non Commerciaux</h2>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <ActivityDetailsInputs titleActivity="Profession Exercée" titleAddress="Lieu d'exercice" state={bncDetails} setter={setBncDetails} />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <MatrixInputGroup title="Bénéfice Imposable" state={bncImp} setter={setBncImp} color="blue" />
                    <MatrixInputGroup title="Bénéfice Exonéré" state={bncExo} setter={setBncExo} color="green" />
                    <MatrixInputGroup title="Déficit de l'exercice" state={bncDef} setter={setBncDef} color="red" />
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-500 uppercase w-32">Crédit d'Impôt BNC</label>
                    <input type="text" value={credits.bnc} onChange={e => handleNumChange(e.target.value, v => setCredits({...credits, bnc: v}))} className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-right font-bold text-sm focus:ring-2 focus:ring-primary/20" placeholder="0.00" />
                </div>
            </div>
          )}

          {/* STEP AGRICOLE */}
          {activeStepId === 'agri' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><Tractor className="w-6 h-6 text-primary" /> Revenus Agricoles</h2>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Adresse de l'exploitation</label>
                    <input type="text" value={agriAddr} onChange={e => setAgriAddr(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" placeholder="Lieu-dit, Commune..." />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <MatrixInputGroup title="Revenu Imposable" state={agriImp} setter={setAgriImp} color="blue" />
                    <MatrixInputGroup title="Revenu Exonéré" state={agriExo} setter={setAgriExo} color="green" />
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-500 uppercase w-32">Crédit d'Impôt</label>
                    <input type="text" value={credits.agri} onChange={e => handleNumChange(e.target.value, v => setCredits({...credits, agri: v}))} className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-right font-bold text-sm focus:ring-2 focus:ring-primary/20" placeholder="0.00" />
                </div>
            </div>
          )}

          {/* STEP FONCIER */}
          {activeStepId === 'foncier' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><Home className="w-6 h-6 text-primary" /> Revenus Fonciers</h2>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Adresse du bien loué</label>
                    <input type="text" value={foncierAddr} onChange={e => setFoncierAddr(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm" placeholder="Adresse complète..." />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <MatrixInputGroup title="Revenus soumis à l'imposition Libératoire" state={foncierLib} setter={setFoncierLib} color="green" />
                    <MatrixInputGroup title="Revenus soumis au Barème (Brut)" state={foncierProvBrut} setter={setFoncierProvBrut} color="blue" />
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-800 text-xs font-bold">
                        <Percent className="w-4 h-4" /> Un abattement automatique de 25% sera appliqué sur le montant brut.
                    </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-500 uppercase w-32">Crédit d'Impôt</label>
                    <input type="text" value={credits.foncier} onChange={e => handleNumChange(e.target.value, v => setCredits({...credits, foncier: v}))} className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-right font-bold text-sm focus:ring-2 focus:ring-primary/20" placeholder="0.00" />
                </div>
            </div>
          )}

          {/* STEP RCM & SALAIRES */}
          {activeStepId === 'rcm_sal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                {selectedCategories.rcm && (
                   <div className="space-y-4">
                       <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><Coins className="w-6 h-6 text-primary" /> Capitaux Mobiliers (RCM)</h2>
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h3 className="text-xs font-black uppercase text-slate-400 border-b border-slate-100 pb-2">Revenus Imposition Libératoire</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {['a', 'b', 'c', 'd', 'e', 'f'].map((k) => (
                                <div key={k} className="flex items-center gap-2">
                                   <label className="text-[10px] font-bold uppercase w-8 bg-slate-100 text-center rounded">{k.toUpperCase()}</label>
                                   <input type="text" value={(rcmLib as any)[k]} onChange={e => handleNumChange(e.target.value, v => setRcmLib({...rcmLib, [k]: v}))} className="flex-1 h-9 px-3 border border-slate-200 rounded text-right text-sm font-bold" placeholder="0" />
                                </div>
                             ))}
                          </div>
                          <h3 className="text-xs font-black uppercase text-slate-400 border-b border-slate-100 pb-2 pt-2">Revenus soumis au Barème (Crédit d'impôt)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {['a', 'b'].map((k) => (
                                <div key={k} className="flex items-center gap-2">
                                   <label className="text-[10px] font-bold uppercase w-8 bg-slate-100 text-center rounded">{k.toUpperCase()}</label>
                                   <input type="text" value={(rcmCred as any)[k]} onChange={e => handleNumChange(e.target.value, v => setRcmCred({...rcmCred, [k]: v}))} className="flex-1 h-9 px-3 border border-slate-200 rounded text-right text-sm font-bold" placeholder="0" />
                                </div>
                             ))}
                          </div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
                          <label className="text-xs font-bold text-slate-500 uppercase w-32">Crédit d'Impôt RCM</label>
                          <input type="text" value={credits.rcm} onChange={e => handleNumChange(e.target.value, v => setCredits({...credits, rcm: v}))} className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-right font-bold text-sm" placeholder="0.00" />
                       </div>
                   </div>
                )}
                
                {selectedCategories.salaires && (
                   <div className="space-y-4 pt-4 border-t border-slate-200">
                       <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><User className="w-6 h-6 text-primary" /> Traitements et Salaires</h2>
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           <SalaryDetailsInputs state={salaryDetails} setter={setSalaryDetails} />
                       </div>
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                           <MatrixInputGroup title="Revenus perçus en Espèces" state={salairesEspeces} setter={setSalairesEspeces} color="blue" />
                           <MatrixInputGroup title="Avantages en Nature" state={salairesNature} setter={setSalairesNature} color="orange" />
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
                          <label className="text-xs font-bold text-slate-500 uppercase w-32">Crédit d'Impôt</label>
                          <input type="text" value={credits.salaires} onChange={e => handleNumChange(e.target.value, v => setCredits({...credits, salaires: v}))} className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-right font-bold text-sm" placeholder="0.00" />
                       </div>
                   </div>
                )}
            </div>
          )}

          {/* STEP CHARGES */}
          {activeStepId === 'charges' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-primary" /> Charges Déductibles & Autres</h2>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                   <h3 className="text-xs font-black uppercase text-slate-400 border-b border-slate-100 pb-2">Plus-Values de Cession</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Immobilier (Brut)</label><input type="text" value={pvImmoBrut} onChange={e => handleNumChange(e.target.value, setPvImmoBrut)} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" placeholder="0" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Immobilier (Net)</label><input type="text" value={pvImmoNet} onChange={e => handleNumChange(e.target.value, setPvImmoNet)} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" placeholder="0" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Actions/Titres (Net)</label><input type="text" value={pvActions} onChange={e => handleNumChange(e.target.value, setPvActions)} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" placeholder="0" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-blue-600">Revenus Étranger</label><input type="text" value={revenusEtranger} onChange={e => handleNumChange(e.target.value, setRevenusEtranger)} className="w-full h-9 px-3 border border-blue-200 rounded text-right text-sm" placeholder="0" /></div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                   <h3 className="text-xs font-black uppercase text-slate-400 border-b border-slate-100 pb-2">Charges Déductibles</h3>
                   <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <label className="text-xs font-bold block mb-2">Intérêts des emprunts</label>
                         <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="Organisme" value={charges.interets.organisme} onChange={e => setCharges({...charges, interets: {...charges.interets, organisme: e.target.value}})} className="h-8 px-2 border rounded text-xs" />
                            <input type="text" placeholder="Date/Nature" value={charges.interets.nature} onChange={e => setCharges({...charges, interets: {...charges.interets, nature: e.target.value}})} className="h-8 px-2 border rounded text-xs" />
                            <input type="text" placeholder="Montant" value={charges.interets.montant} onChange={e => handleNumChange(e.target.value, v => setCharges({...charges, interets: {...charges.interets, montant: v}}))} className="h-8 px-2 border rounded text-xs text-right font-bold" />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Pension Alimentaire</label><input type="text" value={charges.pensions.montant} onChange={e => handleNumChange(e.target.value, v => setCharges({...charges, pensions: {...charges.pensions, montant: v}}))} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" /></div>
                         <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Police Assurance</label><input type="text" value={charges.assurance} onChange={e => handleNumChange(e.target.value, v => setCharges({...charges, assurance: v}))} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" /></div>
                         <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Cotisations Retraite</label><input type="text" value={charges.cotisations} onChange={e => handleNumChange(e.target.value, v => setCharges({...charges, cotisations: v}))} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" /></div>
                         <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Mourabaha</label><input type="text" value={charges.mourabaha} onChange={e => handleNumChange(e.target.value, v => setCharges({...charges, mourabaha: v}))} className="w-full h-9 px-3 border border-slate-200 rounded text-right text-sm" /></div>
                      </div>
                   </div>
                </div>
            </div>
          )}

          {/* STEP RECAP */}
          {activeStepId === 'recap' && (
             <div className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl animate-in fade-in slide-in-from-right-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-8 relative z-10">Synthèse de l'imposition</h2>
                
                <div className="space-y-6 relative z-10">
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-sm font-bold text-slate-400">Revenu Global Imposable</span>
                      <span className="text-xl font-black">{formatMoney(totals.revenuNet)} DA</span>
                   </div>
                   
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-sm font-bold text-slate-400">IRG Calculé (Barème)</span>
                      <span className="text-xl font-black text-primary-300">{formatMoney(totals.irgDu)} DA</span>
                   </div>
                   
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-sm font-bold text-slate-400">Total Crédits d'Impôt</span>
                      <span className="text-xl font-black text-green-400">- {formatMoney(totals.totalCredits)} DA</span>
                   </div>

                   <div className="pt-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Net à Payer</p>
                      <p className="text-5xl font-black text-white tracking-tighter">{formatMoney(totals.aPayer)} <span className="text-lg text-slate-500">DA</span></p>
                      {totals.aRestituer > 0 && (
                         <p className="text-sm font-bold text-orange-400 mt-2">Montant à restituer : {formatMoney(totals.aRestituer)} DA</p>
                      )}
                   </div>
                </div>
             </div>
          )}

      </div>

      {/* FOOTER NAVIGATION */}
      {activeStepId !== 'selection' && (
         <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:px-8 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={handlePrev} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
               <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <div className="hidden md:flex gap-6">
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-400">Revenu Net</p>
                  <p className="text-sm font-black text-slate-900">{formatMoney(totals.revenuNet)}</p>
               </div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-400">Impôt Dû</p>
                  <p className="text-sm font-black text-primary">{formatMoney(totals.irgDu)}</p>
               </div>
            </div>
            {currentStepIndex < wizardSteps.length - 1 ? (
               <button onClick={handleNext} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">
                  Suivant <ChevronRight className="w-4 h-4" />
               </button>
            ) : (
               <button onClick={() => handleSave('VALIDÉ')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/30">
                  <CheckCircle2 className="w-4 h-4" /> Valider G1
               </button>
            )}
         </div>
      )}
    </div>
  );

  // --- VUE OFFICIELLE (PAPIER) - MISE À JOUR COMPLETE ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-8 font-serif print:p-0 print:bg-white">
      {/* HEADER ACTIONS */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour à l'assistant
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg font-sans">
            <Printer className="w-4 h-4" /> Imprimer
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] min-h-[297mm] text-black font-sans box-border text-[9px] leading-tight print:shadow-none print:m-0">
         
         {/* HEADER G1 */}
         {/* ... (Header et Identité inchangés) ... */}
         
         {/* ... PAGE 1 (Identité) est déjà présente et correcte ... */}
         {/* Je recopie le bloc d'entete ici pour cohérence du fichier final */}
         <div className="text-center mb-6">
            <h1 className="text-lg font-bold font-serif leading-tight">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
            <h2 className="text-sm font-bold uppercase tracking-widest leading-tight">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h2>
            <div className="flex justify-between items-start mt-4 px-2">
                <div className="text-left w-1/3">
                    <p className="font-bold">MINISTERE DES FINANCES</p>
                    <p className="font-bold">Direction Générale des Impôts</p>
                    <p>DIW de ................................................................</p>
                    <p>Structure .............................................................</p>
                </div>
                <div className="text-right w-1/3">
                    <p className="font-bold font-serif text-[11px]">وزارة المالية</p>
                    <p className="font-bold font-serif text-[10px]">المديرية العامة للضرائب</p>
                    <p className="font-serif text-[10px]">مديرية الضرائب لولاية .....................................</p>
                    <p className="font-serif text-[10px]">مصلحة ...........................................................</p>
                </div>
            </div>
         </div>

         {/* ... PAGE 2 : BIC & BNC ... */}
         <div className="break-before-page mt-4">
             <div className="flex border-2 border-black">
                 <div className="flex-1">
                     <div className="bg-gray-100 border-b border-black p-1 pl-2 font-bold uppercase text-[10px]">IV- DETAIL PAR CATEGORIES DES REVENUS IMPOSABLES</div>
                     <div className="bg-gray-50 border-b border-black p-1 pl-2 font-bold text-[9px]">A- REVENUS ENCAISSES EN ALGERIE</div>
                     
                     {/* 1) BIC */}
                     <div className="p-2 border-b border-black">
                         <h4 className="font-bold underline mb-2 text-[9px]">1) BENEFICES INDUSTRIELS ET COMMERCIAUX</h4>
                         <div className="flex justify-between text-[8px] mb-1 font-bold underline">
                             <span className="w-1/3">Activité exercée</span>
                             <span className="w-1/2">Adresse du lieu d’exercice de l’activité</span>
                         </div>
                         <div className="flex justify-between text-[8px] mb-2">
                             <div className="w-1/3">
                                 <div className="flex"><span className="w-12">Vous :</span> <span className="border-b border-dotted border-black flex-1">{bicDetails.vous.activite}</span></div>
                                 <div className="flex"><span className="w-12">Conjoint :</span> <span className="border-b border-dotted border-black flex-1">{bicDetails.conjoint.activite}</span></div>
                                 <div className="flex"><span className="w-12">Enfants :</span> <span className="border-b border-dotted border-black flex-1">{bicDetails.enfants.activite}</span></div>
                             </div>
                             <div className="w-1/2">
                                 <div className="border-b border-dotted border-black w-full h-3 mb-1">{bicDetails.vous.adresse}</div>
                                 <div className="border-b border-dotted border-black w-full h-3 mb-1">{bicDetails.conjoint.adresse}</div>
                                 <div className="border-b border-dotted border-black w-full h-3">{bicDetails.enfants.adresse}</div>
                             </div>
                         </div>
                         
                         <table className="w-full border-collapse border border-black text-[8px]">
                             <thead className="bg-gray-100">
                                 <tr>
                                     <th className="border border-black p-1"></th>
                                     <th className="border border-black p-1">Vous (1)</th>
                                     <th className="border border-black p-1">Conjoint (2)</th>
                                     <th className="border border-black p-1">Enfants à charge (3)</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr>
                                     <td className="border border-black p-1 font-bold">Bénefice imposable .....</td>
                                     <td className="border border-black p-1 text-right">{bicImp.vous}</td>
                                     <td className="border border-black p-1 text-right">{bicImp.conjoint}</td>
                                     <td className="border border-black p-1 text-right">{bicImp.enfants}</td>
                                 </tr>
                                 <tr>
                                     <td className="border border-black p-1 font-bold">Bénéfice exonéré.........</td>
                                     <td className="border border-black p-1 text-right">{bicExo.vous}</td>
                                     <td className="border border-black p-1 text-right">{bicExo.conjoint}</td>
                                     <td className="border border-black p-1 text-right">{bicExo.enfants}</td>
                                 </tr>
                                 <tr>
                                     <td className="border border-black p-1 font-bold">Déficit de l’exercice .....</td>
                                     <td className="border border-black p-1 text-right">{bicDef.vous}</td>
                                     <td className="border border-black p-1 text-right">{bicDef.conjoint}</td>
                                     <td className="border border-black p-1 text-right">{bicDef.enfants}</td>
                                 </tr>
                                 <tr className="bg-gray-100">
                                     <td colSpan={2} className="border border-black p-1 font-bold">Total des bénéfices imposables (1+2+3) (*) (total à reporter à la partie VI, point 2.a)</td>
                                     <td colSpan={2} className="border border-black p-1 text-right font-bold font-mono">{formatMoney(totals.totalBicImp)}</td>
                                 </tr>
                             </tbody>
                         </table>
                     </div>

                     {/* 2) BNC (CORRECTION ICI : STRUCTURE IDENTIQUE AU BIC) */}
                     <div className="p-2">
                         <h4 className="font-bold underline mb-2 text-[9px]">2) BENEFICES DES PROFESSIONS NON COMMERCIALES</h4>
                         <div className="flex justify-between text-[8px] mb-1 font-bold underline">
                             <span className="w-1/3">Profession exercée</span>
                             <span className="w-1/2">Adresse du lieu d’execice de la profession</span>
                         </div>
                         <div className="flex justify-between text-[8px] mb-2">
                             <div className="w-1/3">
                                 <div className="flex"><span className="w-12">Vous :</span> <span className="border-b border-dotted border-black flex-1">{bncDetails.vous.activite}</span></div>
                                 <div className="flex"><span className="w-12">Conjoint :</span> <span className="border-b border-dotted border-black flex-1">{bncDetails.conjoint.activite}</span></div>
                                 <div className="flex"><span className="w-12">Enfants :</span> <span className="border-b border-dotted border-black flex-1">{bncDetails.enfants.activite}</span></div>
                             </div>
                             <div className="w-1/2">
                                 <div className="border-b border-dotted border-black w-full h-3 mb-1">{bncDetails.vous.adresse}</div>
                                 <div className="border-b border-dotted border-black w-full h-3 mb-1">{bncDetails.conjoint.adresse}</div>
                                 <div className="border-b border-dotted border-black w-full h-3">{bncDetails.enfants.adresse}</div>
                             </div>
                         </div>

                         <table className="w-full border-collapse border border-black text-[8px]">
                             <thead className="bg-gray-100">
                                 <tr>
                                     <th className="border border-black p-1"></th>
                                     <th className="border border-black p-1">Vous (1)</th>
                                     <th className="border border-black p-1">Conjoint (2)</th>
                                     <th className="border border-black p-1">Enfants à charge (3)</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr>
                                     <td className="border border-black p-1 font-bold">Bénefice imposable ....</td>
                                     <td className="border border-black p-1 text-right">{bncImp.vous}</td>
                                     <td className="border border-black p-1 text-right">{bncImp.conjoint}</td>
                                     <td className="border border-black p-1 text-right">{bncImp.enfants}</td>
                                 </tr>
                                 <tr>
                                     <td className="border border-black p-1 font-bold">Bénefice exonéré .......</td>
                                     <td className="border border-black p-1 text-right">{bncExo.vous}</td>
                                     <td className="border border-black p-1 text-right">{bncExo.conjoint}</td>
                                     <td className="border border-black p-1 text-right">{bncExo.enfants}</td>
                                 </tr>
                                 <tr>
                                     <td className="border border-black p-1 font-bold">Déficit de l’exercice ....</td>
                                     <td className="border border-black p-1 text-right">{bncDef.vous}</td>
                                     <td className="border border-black p-1 text-right">{bncDef.conjoint}</td>
                                     <td className="border border-black p-1 text-right">{bncDef.enfants}</td>
                                 </tr>
                                 <tr className="bg-gray-100">
                                     <td colSpan={2} className="border border-black p-1 font-bold">Total des bénéfices imposables (1+2+3) (*) (total à reporter à la partie VI, point 2.b)</td>
                                     <td colSpan={2} className="border border-black p-1 text-right font-bold font-mono">{formatMoney(totals.totalBncImp)}</td>
                                 </tr>
                             </tbody>
                         </table>
                     </div>

                 </div>
                 {/* Sidebar Cadre réservé */}
                 <div className="w-1/4 border-l border-black p-2 text-center text-[10px] bg-blue-50/20">
                     <p className="font-bold underline mt-4">Cadre réservé au service</p>
                 </div>
             </div>
         </div>

         {/* --- PAGE 3 : AGRICOLE & FONCIER --- */}
         <div className="break-before-page flex border-2 border-black min-h-[280mm]">
             <div className="flex-1 p-2">
                 {/* 3) AGRICOLE (CORRECTION) */}
                 <div className="mb-4">
                     <h4 className="font-bold underline mb-2 text-[9px]">3) REVENUS AGRICOLES</h4>
                     <p className="text-[8px] mb-1">Adresse de l’exploitation : <span className="border-b border-dotted border-black">{agriAddr}</span></p>
                     
                     <table className="w-full border-collapse border border-black text-[8px] mb-2">
                         <thead className="bg-gray-100">
                             <tr>
                                 <th className="border border-black p-1"></th>
                                 <th className="border border-black p-1">Vous (1)</th>
                                 <th className="border border-black p-1">Conjoint (2)</th>
                                 <th className="border border-black p-1">Enfants (3)</th>
                             </tr>
                         </thead>
                         <tbody>
                             <tr><td className="border border-black p-1 font-bold">Revenu imposable......</td><td className="border border-black p-1 text-right">{agriImp.vous}</td><td className="border border-black p-1 text-right">{agriImp.conjoint}</td><td className="border border-black p-1 text-right">{agriImp.enfants}</td></tr>
                             <tr><td className="border border-black p-1 font-bold">Revenu exonéré .........</td><td className="border border-black p-1 text-right">{agriExo.vous}</td><td className="border border-black p-1 text-right">{agriExo.conjoint}</td><td className="border border-black p-1 text-right">{agriExo.enfants}</td></tr>
                             <tr className="bg-gray-100">
                                 <td colSpan={2} className="border border-black p-1 font-bold">Total des revenus (1+2+3)(*) (à reporter VI 2.c)</td>
                                 <td colSpan={2} className="border border-black p-1 text-right font-bold">{formatMoney(totals.totalAgriImp)}</td>
                             </tr>
                         </tbody>
                     </table>
                 </div>

                 {/* 4) FONCIER (CORRECTION) */}
                 <div>
                     <h4 className="font-bold underline mb-2 text-[9px]">4) REVENUS FONCIERS PROVENANT DES PROPRIETES BATIES ET NON BATIES LOUEES</h4>
                     <p className="text-[8px] mb-2">Adresse du bien loué : <span className="border-b border-dotted border-black">{foncierAddr}</span></p>
                     
                     <p className="text-[8px] font-bold mt-2">4-1. Revenus fonciers ayant donné lieu à une imposition libératoire (revenus n’intégrant pas la base imposable)</p>
                     <table className="w-full border-collapse border border-black text-[8px] mb-2">
                         <thead><tr className="bg-gray-100"><th className="border border-black p-1">Vous (1)</th><th className="border border-black p-1">Conjoint (2)</th><th className="border border-black p-1">Enfants (3)</th></tr></thead>
                         <tbody>
                             <tr><td className="border border-black p-1 text-right">{foncierLib.vous}</td><td className="border border-black p-1 text-right">{foncierLib.conjoint}</td><td className="border border-black p-1 text-right">{foncierLib.enfants}</td></tr>
                             <tr className="bg-gray-100"><td colSpan={2} className="border border-black p-1 font-bold">Total des revenus (1+2+3)(*) (à reporter VI 1.a)</td><td className="border border-black p-1 text-right font-bold">{formatMoney(totals.totalFoncierLib)}</td></tr>
                         </tbody>
                     </table>

                     <p className="text-[8px] font-bold mt-2">4-2. Revenus fonciers ayant donné lieu à une imposition provisoire (Revenus intégrant la base imposable)</p>
                     <table className="w-full border-collapse border border-black text-[8px]">
                         <thead><tr className="bg-gray-100"><th className="border border-black p-1">Vous (1)</th><th className="border border-black p-1">Conjoint (2)</th><th className="border border-black p-1">Enfants (3)</th></tr></thead>
                         <tbody>
                             <tr><td className="border border-black p-1 text-right">{foncierProvBrut.vous}</td><td className="border border-black p-1 text-right">{foncierProvBrut.conjoint}</td><td className="border border-black p-1 text-right">{foncierProvBrut.enfants}</td></tr>
                             <tr className="bg-gray-100"><td colSpan={2} className="border border-black p-1 font-bold">Total des revenus bruts (1+2+3)(*) (à reporter VI 2.d)</td><td className="border border-black p-1 text-right font-bold">{formatMoney(totals.totalFoncierNet / 0.75)}</td></tr>
                             <tr><td colSpan={2} className="border border-black p-1 font-bold">Abattement de 25% (pour la location à usage d’habitation)</td><td className="border border-black p-1 text-right italic">Auto</td></tr>
                             <tr><td colSpan={2} className="border border-black p-1 font-bold">Revenu imposable</td><td className="border border-black p-1 text-right font-bold">{formatMoney(totals.totalFoncierNet)}</td></tr>
                         </tbody>
                     </table>
                 </div>
             </div>
             {/* Sidebar Cadre réservé */}
             <div className="w-1/4 border-l border-black p-2 text-center text-[10px] bg-blue-50/20">
                 <p className="font-bold underline mt-4">Cadre réservé au service</p>
             </div>
         </div>

         {/* --- PAGE 4 : RCM & SALAIRES --- */}
         <div className="break-before-page flex border-2 border-black min-h-[280mm]">
             <div className="flex-1 p-2">
                 {/* 5) RCM (CORRECTION) */}
                 <div className="mb-4">
                     <h4 className="font-bold underline mb-2 text-[9px]">5) REVENUS DES CAPITAUX MOBILIERS</h4>
                     
                     <p className="text-[8px] font-bold mt-1">5-1. Revenus donnant lieu à une imposition libératoire</p>
                     <div className="border border-black p-1 text-[8px] mb-2 space-y-1">
                         <div className="flex justify-between border-b border-dotted border-black"><span>a) Produits des valeurs mobilières...</span> <span className="font-mono">{rcmLib.a}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>b) Tantièmes et jetons...</span> <span className="font-mono">{rcmLib.b}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>c) Parts resp. limitée...</span> <span className="font-mono">{rcmLib.c}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>d) Parts d'intérêts...</span> <span className="font-mono">{rcmLib.d}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>e) Produits des titres anonymes...</span> <span className="font-mono">{rcmLib.e}</span></div>
                         <div className="flex justify-between"><span>f) Intérêts livrets...</span> <span className="font-mono">{rcmLib.f}</span></div>
                         <div className="bg-gray-100 font-bold flex justify-between border-t border-black mt-1 p-1"><span>Total des revenus n’intégrant pas la base imposable (Total Net à reporter VI 1.c)</span> <span>{formatMoney(totals.totalRcmLib)}</span></div>
                     </div>

                     <p className="text-[8px] font-bold mt-1">5-2. Revenus donnant lieu à un crédit d'impôt</p>
                     <div className="border border-black p-1 text-[8px] space-y-1">
                         <div className="flex justify-between border-b border-dotted border-black"><span>a) Revenus des créances...</span> <span className="font-mono">{rcmCred.a}</span></div>
                         <div className="flex justify-between"><span>b) Intérêts > 50.000 DA...</span> <span className="font-mono">{rcmCred.b}</span></div>
                         <div className="bg-gray-100 font-bold flex justify-between border-t border-black mt-1 p-1"><span>TOTAL des revenus intégrant la base imposable (Total Net à reporter VI 2.e)</span> <span>{formatMoney(totals.totalRcmCredit)}</span></div>
                     </div>
                 </div>

                 {/* 6) SALAIRES (CORRECTION) */}
                 <div>
                     <h4 className="font-bold underline mb-2 text-[9px]">6) TRAITEMENTS, SALAIRES, PENSIONS ET RENTES VIAGERES</h4>
                     <div className="text-[8px] mb-2 font-bold underline flex justify-between">
                         <span className="w-1/3">Professions exercées</span>
                         <span className="w-1/2">Noms et adresses des employeurs</span>
                     </div>
                     <div className="text-[8px] mb-2 flex justify-between">
                         <div className="w-1/3 space-y-1">
                             <div>V: {salaryDetails.vous.profession}</div>
                             <div>C: {salaryDetails.conjoint.profession}</div>
                             <div>E: {salaryDetails.enfants.profession}</div>
                         </div>
                         <div className="w-1/2 space-y-1">
                             <div>{salaryDetails.vous.employeur}</div>
                             <div>{salaryDetails.conjoint.employeur}</div>
                             <div>{salaryDetails.enfants.employeur}</div>
                         </div>
                     </div>
                     
                     <table className="w-full border-collapse border border-black text-[8px]">
                         <thead className="bg-gray-100">
                             <tr><th className="border border-black p-1"></th><th className="border border-black p-1">Vous (1)</th><th className="border border-black p-1">Conjoint (2)</th><th className="border border-black p-1">Enfants (3)</th></tr>
                         </thead>
                         <tbody>
                             <tr><td className="border border-black p-1 font-bold">- Revenus perçus en espèces (Montant brut)</td><td className="border border-black p-1 text-right">{salairesEspeces.vous}</td><td className="border border-black p-1 text-right">{salairesEspeces.conjoint}</td><td className="border border-black p-1 text-right">{salairesEspeces.enfants}</td></tr>
                             <tr><td className="border border-black p-1 font-bold">- Avantages en nature (Montant brut)</td><td className="border border-black p-1 text-right">{salairesNature.vous}</td><td className="border border-black p-1 text-right">{salairesNature.conjoint}</td><td className="border border-black p-1 text-right">{salairesNature.enfants}</td></tr>
                             <tr className="bg-gray-100"><td colSpan={2} className="border border-black p-1 font-bold">Total des revenus imposables (1+2+3) (*) (total à reporter VI 2.f)</td><td colSpan={2} className="border border-black p-1 text-right font-bold">{formatMoney(totals.totalSalaires)}</td></tr>
                         </tbody>
                     </table>
                 </div>
             </div>
             {/* Sidebar Cadre réservé */}
             <div className="w-1/4 border-l border-black p-2 text-center text-[10px] bg-blue-50/20">
                 <p className="font-bold underline mt-4">Cadre réservé au service</p>
             </div>
         </div>

         {/* --- PAGE 5 : PVC & CHARGES --- */}
         <div className="break-before-page flex border-2 border-black min-h-[280mm]">
             <div className="flex-1 p-2">
                 {/* 7) PLUS VALUES */}
                 <div className="mb-4 text-[8px]">
                     <h4 className="font-bold underline mb-2 text-[9px]">7) PLUS-VALUES DE CESSION (IMMOBILIER & ACTIONS)</h4>
                     
                     <p className="font-bold">7-1. Plus-values de cession à titre onéreux des immeubles...</p>
                     <div className="border border-black p-1 mb-2">
                         <div className="flex justify-between"><span>Montant brut des PVC</span> <span className="font-mono">{formatMoney(toNum(pvImmoBrut))}</span></div>
                         <div className="flex justify-between font-bold"><span>Montant net (après abattement)</span> <span className="font-mono">{formatMoney(toNum(pvImmoNet))}</span></div>
                     </div>

                     <p className="font-bold">7-2. Plus-values de cession d’actions...</p>
                     <div className="border border-black p-1">
                         <div className="flex justify-between font-bold"><span>Montant net des PVC</span> <span className="font-mono">{formatMoney(toNum(pvActions))}</span></div>
                     </div>
                 </div>

                 {/* B- ETRANGER */}
                 <div className="mb-4 text-[8px]">
                     <h4 className="font-bold underline mb-2 text-[9px]">B- REVENUS ENCAISSES HORS D’ALGERIE</h4>
                     <div className="border border-black p-1 flex justify-between bg-gray-100">
                         <span className="font-bold">TOTAL (à reporter VI 2.g)</span>
                         <span className="font-bold font-mono">{formatMoney(totals.totalEtranger)}</span>
                     </div>
                 </div>

                 {/* V- CHARGES (CORRECTION) */}
                 <div className="text-[8px]">
                     <h4 className="font-bold underline mb-2 text-[9px]">V- CHARGES A DEDUIRE SUR LE REVENU GLOBAL (Art 85 du CIDTA)</h4>
                     
                     <p className="font-bold mb-1">1- INTERETS DES EMPRUNTS ET DETTES CONTRACTEES...</p>
                     <table className="w-full border-collapse border border-black mb-2">
                         <thead><tr className="bg-gray-100 text-center"><th className="border border-black p-1">Organisme ou personne en bénéficiant</th><th className="border border-black p-1">Date et nature des contrats</th><th className="border border-black p-1">Intérêts payés</th></tr></thead>
                         <tbody>
                             <tr>
                                 <td className="border border-black p-1">{charges.interets.organisme}</td>
                                 <td className="border border-black p-1">{charges.interets.date} {charges.interets.nature}</td>
                                 <td className="border border-black p-1 text-right">{formatMoney(toNum(charges.interets.montant))}</td>
                             </tr>
                             <tr className="bg-gray-100"><td colSpan={2} className="border border-black p-1 font-bold text-right">Total des déductions (à reporter VI 3.a)</td><td className="border border-black p-1 text-right font-bold">{formatMoney(toNum(charges.interets.montant))}</td></tr>
                         </tbody>
                     </table>
                 </div>
             </div>
             <div className="w-1/4 border-l border-black p-2 text-center text-[10px] bg-blue-50/20">
                 <p className="font-bold underline mt-4">Cadre réservé au service</p>
             </div>
         </div>

         {/* --- PAGE 6 : RECAP & LIQUIDATION --- */}
         <div className="break-before-page flex border-2 border-black min-h-[280mm]">
             <div className="flex-1 p-2 text-[8px]">
                 {/* SUITE CHARGES */}
                 <div className="mb-4">
                     <p className="font-bold underline mb-2">2- AUTRES DEDUCTIONS AUTORISEES PAR LA LOI</p>
                     <div className="border border-black p-1 space-y-1">
                         <div className="flex justify-between border-b border-dotted border-black"><span>- Pensions alimentaires ({charges.pensions.beneficiaire})</span> <span className="font-mono">{formatMoney(toNum(charges.pensions.montant))}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>- Police d’assurance (bailleur)...</span> <span>{formatMoney(toNum(charges.assurance))}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>- Cotisations assurances vieillesse...</span> <span className="font-mono">{formatMoney(toNum(charges.cotisations))}</span></div>
                         <div className="flex justify-between border-b border-dotted border-black"><span>- Mourabaha...</span> <span className="font-mono">{formatMoney(toNum(charges.mourabaha))}</span></div>
                         <div className="bg-gray-100 font-bold flex justify-between pt-1"><span>TOTAL (à reporter VI 3.b)</span> <span>{formatMoney(totals.totalCharges - toNum(charges.interets.montant))}</span></div>
                     </div>
                 </div>

                 {/* VI - RECAPITULATION (CORRECTION STRUCTURE) */}
                 <div className="border border-black">
                     <div className="bg-gray-200 border-b border-black p-1 font-bold text-center text-[9px]">VI- RECAPITULATION DES REVENUS ET DES CHARGES</div>
                     
                     <div className="p-1 space-y-1">
                         <p className="font-bold underline">1- Revenus n’intégrant pas la base imposable :</p>
                         <div className="flex justify-between pl-4"><span>1.a) Revenus fonciers soumis à une imposition libératoire</span> <span>{formatMoney(totals.totalFoncierLib)}</span></div>
                         <div className="flex justify-between pl-4"><span>1.b) Plus-values de cession à titre onéreux</span> <span>{formatMoney(toNum(pvImmoNet) + toNum(pvActions))}</span></div>
                         <div className="flex justify-between pl-4 border-b border-black pb-1"><span>1.c) Revenus des capitaux mobiliers soumis à une imposition libératoire</span> <span>{formatMoney(totals.totalRcmLib)}</span></div>

                         <p className="font-bold underline mt-2">2- Revenus intégrant la base imposable :</p>
                         <div className="pl-4 space-y-1">
                             <div className="flex justify-between"><span>2.a) Bénefices industriels et commerciaux</span> <span>{formatMoney(totals.totalBicImp)}</span></div>
                             <div className="flex justify-between"><span>2.b) Bénefices des professions non commerciales</span> <span>{formatMoney(totals.totalBncImp)}</span></div>
                             <div className="flex justify-between"><span>2.c) Revenus agricoles</span> <span>{formatMoney(totals.totalAgriImp)}</span></div>
                             <div className="flex justify-between"><span>2.d) Revenus fonciers soumis à une imposition provisoire</span> <span>{formatMoney(totals.totalFoncierNet)}</span></div>
                             <div className="flex justify-between"><span>2.e) Revenus des capitaux mobiliers (crédit d'impôt)</span> <span>{formatMoney(totals.totalRcmCredit)}</span></div>
                             <div className="flex justify-between"><span>2.f) Traitements, salaires, pensions</span> <span>{formatMoney(totals.totalSalaires)}</span></div>
                             <div className="flex justify-between border-b border-black pb-1"><span>2.g) Revenus encaissés hors d’Algérie</span> <span>{formatMoney(totals.totalEtranger)}</span></div>
                         </div>
                         <div className="bg-gray-100 font-bold flex justify-between border-b border-black"><span>Total des revenus intégrant la base imposable</span> <span>{formatMoney(totals.totalRevenus)}</span></div>

                         <p className="font-bold underline mt-2">3- Charges déductibles :</p>
                         <div className="pl-4 space-y-1 border-b border-black pb-1">
                             <div className="flex justify-between"><span>3.a) Intérêts des emprunts</span> <span>{formatMoney(toNum(charges.interets.montant))}</span></div>
                             <div className="flex justify-between"><span>3.b) Déductions autorisées</span> <span>{formatMoney(totals.totalCharges - toNum(charges.interets.montant))}</span></div>
                         </div>
                         
                         <div className="bg-gray-200 font-bold flex justify-between border-b border-black pt-1"><span>REVENU NET GLOBAL</span> <span>{formatMoney(totals.revenuNet)}</span></div>
                         
                         <div className="flex justify-between border-b border-black pb-1 pt-1"><span>Abattement de 10% (Imposition commune)</span> <span>...................</span></div>
                         
                         <div className="bg-black text-white font-bold flex justify-between p-1"><span>REVENU NET GLOBAL IMPOSABLE</span> <span>{formatMoney(totals.revenuNet)}</span></div>
                     </div>
                 </div>

                 {/* SIGNATURE */}
                 <div className="flex justify-between mt-4">
                     <div>
                         <p>A ....................................., Le .........................</p>
                         <p className="font-bold mt-2">Signature du contribuable</p>
                     </div>
                     <div className="text-right">
                         <p className="font-bold">Cachet et signature du responsable du service concerné</p>
                     </div>
                 </div>
             </div>
             <div className="w-1/4 border-l border-black p-2 text-center text-[10px] bg-blue-50/20">
                 <p className="font-bold underline mt-4">Cadre réservé au service</p>
             </div>
         </div>

         {/* --- PAGE 7 : CREDITS --- */}
         <div className="break-before-page border-2 border-black min-h-[280mm] p-4">
             <div className="bg-gray-200 border-b-2 border-black p-2 text-center font-bold uppercase mb-4">VOLET RELATIF AUX CREDITS D’IMPOTS</div>
             
             <table className="w-full border-collapse border border-black text-[9px] mb-4">
                 <thead className="bg-gray-100">
                     <tr>
                         <th className="border border-black p-2 text-left w-2/3">Catégorie de Revenu</th>
                         <th className="border border-black p-2 text-right">Montant Crédit d'Impôt</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr>
                         <td className="border border-black p-2 font-bold">1- BENEFICES INDUSTRIELS ET COMMERCIAUX (BIC)</td>
                         <td className="border border-black p-2 text-right font-mono">{formatMoney(toNum(credits.bic))}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-2 font-bold">2- BENEFICES DES PROFESSIONS NON COMMERCIALES (BNC)</td>
                         <td className="border border-black p-2 text-right font-mono">{formatMoney(toNum(credits.bnc))}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-2 font-bold">3- REVENUS AGRICOLES</td>
                         <td className="border border-black p-2 text-right font-mono">{formatMoney(toNum(credits.agri))}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-2 font-bold">4- REVENUS FONCIERS</td>
                         <td className="border border-black p-2 text-right font-mono">{formatMoney(toNum(credits.foncier))}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-2 font-bold">5- REVENUS CAPITAUX MOBILIERS (RCM)</td>
                         <td className="border border-black p-2 text-right font-mono">{formatMoney(toNum(credits.rcm))}</td>
                     </tr>
                     <tr>
                         <td className="border border-black p-2 font-bold">6- TRAITEMENTS, SALAIRES, PENSIONS</td>
                         <td className="border border-black p-2 text-right font-mono">{formatMoney(toNum(credits.salaires))}</td>
                     </tr>
                     <tr className="bg-gray-200">
                         <td className="border border-black p-2 font-bold text-right uppercase">Total des Crédits</td>
                         <td className="border border-black p-2 text-right font-black font-mono">{formatMoney(totals.totalCredits)}</td>
                     </tr>
                 </tbody>
             </table>

             <p className="text-[8px] italic font-bold">
                 Important : Il y a lieu de joindre à la présente déclaration, copies des quittances ou pièces justificatives des paiements constitutifs de crédits d’impôts.
             </p>
         </div>

      </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G1Form;
