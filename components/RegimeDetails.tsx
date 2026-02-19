
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Target, 
  Building2, 
  Briefcase, 
  FileText, 
  BookOpen, 
  Coins, 
  Scale, 
  Zap, 
  History, 
  TrendingUp, 
  Landmark, 
  Ban, 
  ArrowRight, 
  Check, 
  X, 
  Layout, 
  Network, 
  Users, 
  Calendar, 
  ChevronDown, 
  Printer, 
  Tractor, 
  Sprout, 
  QrCode
} from 'lucide-react';
import { DEFAULT_EXCLUSION_RULES, detectExclusion } from '../data/naa_data';

interface Props {
  onBack: () => void;
  context: { name: string, activity: string, activityCode: string, estimatedCA: number, category: 'BIC' | 'BNC', typeContribuable?: 'PHYSIQUE' | 'MORALE' | 'AGRICOLE' };
}

const RegimeDetails: React.FC<Props> = ({ onBack, context }) => {
  // --- ÉTATS ---
  const [activeCategory, setActiveCategory] = useState<'BIC' | 'BNC'>(context.category);
  const [simulatedCA, setSimulatedCA] = useState<number>(context.estimatedCA || 0);
  
  // Toggles de simulation (Obligations Complémentaires)
  const [hasEmployees, setHasEmployees] = useState(false);      // -> G29, G50 Salaires
  const [hasRentals, setHasRentals] = useState(false);          // -> G51
  const [hasHighPatrimoine, setHasHighPatrimoine] = useState(false); // -> G37
  
  // NOUVEAUX TOGGLES
  const [hasAgriculture, setHasAgriculture] = useState(false);  // -> G15
  const [hasCession, setHasCession] = useState(false);          // -> G17 ou G17 Ter

  const [isConfirmed, setIsConfirmed] = useState(false);

  // --- ANALYSE AUTOMATIQUE (INTELLIGENCE FISCALE) ---
  const analysis = useMemo(() => {
    const isMorale = context.typeContribuable === 'MORALE';
    const exclusion = detectExclusion(context.activityCode, context.activity, DEFAULT_EXCLUSION_RULES);
    const thresholdReached = simulatedCA > 8000000;
    
    // 1. Détermination du Régime Principal
    let recommendedRegime = 'IFU';
    let forceReason = '';
    let isForced = false;

    if (isMorale) {
        recommendedRegime = 'IBS';
        forceReason = 'Les personnes morales (Sociétés) sont soumises à l\'IBS.';
        isForced = true;
    } else if (exclusion.isExcluded) {
        recommendedRegime = 'REEL_NORMAL';
        forceReason = `Activité exclue de l'IFU (Art 282 ter) : ${exclusion.reason}`;
        isForced = true;
    } else if (thresholdReached) {
        recommendedRegime = activeCategory === 'BNC' ? 'REEL_SIMPLIFIE' : 'REEL_NORMAL';
        forceReason = 'Dépassement du seuil de 8.000.000 DA.';
        isForced = true;
    }

    // 2. Génération de la Liste des Formulaires (Liasse Fiscale Complète)
    const forms = [];
    
    // -- A. Obligations Principales (Régime de base) --
    if (recommendedRegime === 'IFU') {
        forms.push({ code: 'G12', label: 'Déclaration Prévisionnelle', freq: 'Annuelle', deadline: '30 Juin', type: 'base' });
        forms.push({ code: 'G12 Bis', label: 'Déclaration Définitive', freq: 'Annuelle', deadline: '20 Janvier (N+1)', type: 'base' });
    } else if (recommendedRegime === 'IBS') {
        forms.push({ code: 'G50', label: 'Déclaration Mensuelle', freq: 'Mensuelle', deadline: 'Le 20 du mois', type: 'base' });
        forms.push({ code: 'G4', label: 'Bilan Fiscal (Liasse)', freq: 'Annuelle', deadline: '30 Avril', type: 'base' });
        forms.push({ code: 'G50-A', label: 'Acomptes IBS', freq: 'Trimestrielle', deadline: '20 Mars/Juin/Nov', type: 'base' });
    } else { // RÉEL IRG (Normal ou Simplifié)
        forms.push({ code: 'G50', label: 'Déclaration Mensuelle', freq: 'Mensuelle', deadline: 'Le 20 du mois', type: 'base' });
        forms.push({ code: 'G1', label: 'Revenu Global', freq: 'Annuelle', deadline: '30 Avril', type: 'base' });
        if (activeCategory === 'BNC') {
            forms.push({ code: 'G13', label: 'Liasse BNC', freq: 'Annuelle', deadline: '30 Avril', type: 'base' });
        } else {
            forms.push({ code: 'G11', label: 'Liasse BIC', freq: 'Annuelle', deadline: '30 Avril', type: 'base' });
        }
    }

    // -- B. Obligations Sociales & Salariales --
    if (hasEmployees) {
        if (recommendedRegime === 'IFU') {
            forms.push({ code: 'G50 Ter', label: 'IRG Salaires', freq: 'Trimestrielle', deadline: 'Le 20', type: 'supp' });
        }
        // G29 obligatoire pour tout employeur
        forms.push({ code: 'G29', label: 'État des Salaires', freq: 'Annuelle', deadline: '30 Avril', type: 'supp' });
    }

    // -- C. Obligations Patrimoniales & Agricoles --
    
    // G15 : Revenus Agricoles
    if (hasAgriculture) {
        forms.push({ code: 'G15', label: 'Revenus Agricoles', freq: 'Annuelle', deadline: '30 Avril', type: 'supp' });
    }

    // G51 : Revenus Fonciers (Pour les individus, les sociétés intègrent ça dans leur résultat)
    if (hasRentals && !isMorale) {
        forms.push({ code: 'G51', label: 'Revenus Fonciers', freq: 'Ponctuelle', deadline: 'J+30', type: 'supp' });
    }

    // G37 : Impôt sur la fortune
    if (hasHighPatrimoine && !isMorale) {
        forms.push({ code: 'G37', label: 'Impôt Patrimoine', freq: 'Annuelle', deadline: '30 Juin', type: 'supp' });
    }

    // -- D. Obligations Occasionnelles (Cession) --
    if (hasCession) {
        if (isMorale) {
            // Pour les sociétés (souvent non résidentes ou cas particuliers IBS)
            forms.push({ code: 'G17 Ter', label: 'Plus-Values IBS', freq: 'Ponctuelle', deadline: 'J+30', type: 'supp' });
        } else {
            // Pour les particuliers
            forms.push({ code: 'G17', label: 'Plus-Values Cession', freq: 'Ponctuelle', deadline: 'J+30', type: 'supp' });
        }
    }

    return { isMorale, exclusion, thresholdReached, recommendedRegime, forceReason, isForced, forms };
  }, [context, simulatedCA, activeCategory, hasEmployees, hasRentals, hasHighPatrimoine, hasAgriculture, hasCession]);

  // --- SOUS-COMPOSANT : NOEUD DE L'ARBRE ---
  const TreeNode = ({ title, sub, icon: Icon, color, isRoot = false }: any) => (
    <div className={`flex flex-col items-center relative z-10 ${isRoot ? 'mb-8' : ''}`}>
      <div className={`p-4 rounded-2xl border-2 shadow-sm flex flex-col items-center gap-2 min-w-[140px] transition-all hover:scale-105 bg-white ${color}`}>
         <Icon className="w-6 h-6" />
         <div className="text-center">
            <p className="text-xs font-black uppercase tracking-tight">{title}</p>
            {sub && <p className="text-[9px] font-medium opacity-80">{sub}</p>}
         </div>
      </div>
      {/* Ligne verticale pour les enfants */}
      {!isRoot && <div className="h-6 w-px bg-slate-300 absolute -top-6"></div>}
    </div>
  );

  // --- COMPOSANT ARBRE VISUEL (NOUVEAU DESIGN) ---
  const FiscalTree = () => {
    const annualForms = analysis.forms.filter(f => f.freq === 'Annuelle');
    const periodicForms = analysis.forms.filter(f => f.freq === 'Mensuelle' || f.freq === 'Trimestrielle');
    const otherForms = analysis.forms.filter(f => f.freq === 'Ponctuelle');

    return (
      <div className="relative flex flex-col items-center mt-6 w-full max-w-4xl mx-auto">
         
         {/* NIVEAU 1 : IDENTITÉ & RÉGIME */}
         <div className="relative flex flex-col items-center">
             <div className="px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-3 z-20">
                {analysis.isMorale ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {context.name}
                <div className="w-px h-4 bg-white/20"></div>
                <span className={analysis.recommendedRegime === 'IFU' ? 'text-blue-300' : 'text-emerald-300'}>
                    {analysis.recommendedRegime.replace('_', ' ')}
                </span>
             </div>
             <div className="h-8 w-px bg-slate-300"></div>
         </div>

         {/* NIVEAU 2 : BRANCHES (ANNUEL / PERIODIQUE) */}
         <div className="grid grid-cols-2 gap-16 w-full relative">
             {/* Connecteur Horizontal */}
             <div className="absolute top-0 left-1/4 right-1/4 h-px bg-slate-300 border-t-2 border-slate-200"></div>

             {/* BRANCHE GAUCHE : OBLIGATIONS ANNUELLES */}
             <div className="flex flex-col items-center">
                 <div className="h-6 w-px bg-slate-300"></div>
                 <div className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 mb-4 border border-slate-200">
                    Bilan & Déclarations Annuelles
                 </div>
                 <div className="flex flex-wrap justify-center gap-4">
                    {annualForms.map((f, i) => (
                        <TreeNode key={i} title={f.code} sub={f.label} icon={f.code === 'G15' ? Tractor : FileText} color="border-emerald-200 text-emerald-800" />
                    ))}
                 </div>
             </div>

             {/* BRANCHE DROITE : OBLIGATIONS PÉRIODIQUES & PONCTUELLES */}
             <div className="flex flex-col items-center">
                 <div className="h-6 w-px bg-slate-300"></div>
                 <div className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 mb-4 border border-slate-200">
                    Paiements Courants & Ponctuels
                 </div>
                 <div className="flex flex-wrap justify-center gap-4">
                    {periodicForms.map((f, i) => (
                        <TreeNode key={i} title={f.code} sub={f.freq} icon={Coins} color="border-blue-200 text-blue-800" />
                    ))}
                    {otherForms.map((f, i) => (
                        <TreeNode key={`other_${i}`} title={f.code} sub="Ponctuel" icon={TrendingUp} color="border-orange-200 text-orange-800" />
                    ))}
                 </div>
             </div>
         </div>

         {/* ALERTE EXCLUSION SI PRÉSENTE */}
         {analysis.exclusion.isExcluded && (
            <div className="mt-12 w-full max-w-2xl bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-2">
                <Ban className="w-8 h-8 text-red-500" />
                <div>
                    <p className="text-sm font-black text-red-800 uppercase">Accès IFU Bloqué</p>
                    <p className="text-xs text-red-700">{analysis.forceReason}</p>
                </div>
            </div>
         )}
      </div>
    );
  };

  return (
    <>
    {/* --- VUE ÉCRAN (INTERACTIVE) --- */}
    <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-700 pb-48 print:hidden">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 hover:bg-white border border-slate-100 rounded-3xl text-slate-400 transition-all shadow-sm active:scale-95"><ArrowLeft className="w-6 h-6" /></button>
          <div>
            <div className="flex items-center gap-2 mb-2">
               <ShieldCheck className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence Fiscale Jibayatic</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Diagnostic & Obligations</h1>
          </div>
        </div>
        
        {/* BOUTON D'IMPRESSION DU DIAGNOSTIC */}
        <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 shadow-sm">
           <Printer className="w-4 h-4" /> IMPRIMER CERTIFICAT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         <div className="lg:col-span-4 space-y-8">
            
            {/* 1. PANNEAU DE SIMULATION (INPUTS) */}
            <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm space-y-8 sticky top-8">
               <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" /> Paramètres du Dossier
               </h3>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires (DA)</label>
                     <div className="relative">
                        <input 
                           type="number" 
                           value={simulatedCA} 
                           onChange={(e) => setSimulatedCA(parseFloat(e.target.value) || 0)} 
                           className="w-full h-12 pl-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-black text-slate-900 focus:border-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">DZD</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</label>
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setActiveCategory('BIC')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeCategory === 'BIC' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>BIC (Commerce)</button>
                        <button onClick={() => setActiveCategory('BNC')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeCategory === 'BNC' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>BNC (Libéral)</button>
                     </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full"></div>
                  
                  {/* TOGGLES AVANCÉS */}
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase text-slate-400">Paramètres Complémentaires</p>
                     
                     <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-bold text-slate-700">Employeur (Salariés)</span>
                        <div className="relative">
                           <input type="checkbox" className="sr-only peer" checked={hasEmployees} onChange={e => setHasEmployees(e.target.checked)} />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                     </label>

                     <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><Tractor className="w-3 h-3 text-green-600" /> Activité Agricole / Élevage</span>
                        <div className="relative">
                           <input type="checkbox" className="sr-only peer" checked={hasAgriculture} onChange={e => setHasAgriculture(e.target.checked)} />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </div>
                     </label>

                     <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-indigo-600" /> Cession d'actifs (Plus-values)</span>
                        <div className="relative">
                           <input type="checkbox" className="sr-only peer" checked={hasCession} onChange={e => setHasCession(e.target.checked)} />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                     </label>

                     {!analysis.isMorale && (
                        <>
                           <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-xs font-bold text-slate-700">Revenus Locatifs (Foncier)</span>
                              <div className="relative">
                                 <input type="checkbox" className="sr-only peer" checked={hasRentals} onChange={e => setHasRentals(e.target.checked)} />
                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              </div>
                           </label>

                           <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-xs font-bold text-slate-700">Patrimoine > 100M DA</span>
                              <div className="relative">
                                 <input type="checkbox" className="sr-only peer" checked={hasHighPatrimoine} onChange={e => setHasHighPatrimoine(e.target.checked)} />
                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                              </div>
                           </label>
                        </>
                     )}
                  </div>
               </div>
            </div>

         </div>

         <div className="lg:col-span-8 space-y-10">
            
            {/* 2. ARBRE DE CONFORMITÉ (VISUALISATION DYNAMIQUE) */}
            <div className="bg-slate-50 rounded-[48px] border border-slate-200 p-10 shadow-inner min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-emerald-400"></div>
               <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-3 mb-8 absolute top-8 left-10">
                  <Network className="w-6 h-6 text-slate-400" /> Cartographie des Obligations
               </h3>
               
               <FiscalTree />
            </div>

            {/* 3. CALENDRIER DES ÉCHÉANCES (TIMELINE) */}
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-3">
                   <Calendar className="w-6 h-6 text-primary" /> Calendrier Fiscal Type
                </h3>
                
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
                    {analysis.forms.sort((a, b) => a.deadline.localeCompare(b.deadline)).map((form, idx) => (
                        <div key={idx} className="relative pl-8 group">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${form.type === 'base' ? 'bg-primary' : 'bg-orange-400'}`}></div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-primary/30 transition-all">
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400 mb-1">{form.deadline}</p>
                                    <h4 className="text-sm font-black text-slate-900">{form.code} - {form.label}</h4>
                                </div>
                                <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${form.freq === 'Mensuelle' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                    {form.freq}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

         </div>

      </div>

      {/* PIED DE PAGE ACTIONS */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-50">
         <div className="bg-white/95 backdrop-blur-2xl border-2 border-white rounded-[48px] p-6 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-8 pl-6">
               <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dossier Analysé</p>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{context.name}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={onBack} className="px-10 py-5 bg-slate-100 text-slate-600 rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Retour</button>
               <button onClick={() => setIsConfirmed(true)} className="px-12 py-5 bg-primary text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">
                  {isConfirmed ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                  {isConfirmed ? 'Configuration Appliquée' : 'Valider ce Diagnostic'}
               </button>
            </div>
         </div>
      </div>
    </div>

    {/* --- VUE IMPRESSION (CERTIFICAT OFFICIEL) --- */}
    <div className="hidden print:block p-8 bg-white text-black font-serif w-full h-full">
        {/* EN-TÊTE RÉPUBLIQUE */}
        <div className="text-center mb-8 border-b-2 border-black pb-6">
            <h1 className="text-xl font-bold uppercase tracking-widest">République Algérienne Démocratique et Populaire</h1>
            <h2 className="text-lg font-bold">Ministère des Finances</h2>
            <h3 className="text-base font-bold">Direction Générale des Impôts</h3>
        </div>

        {/* TITRE CERTIFICAT */}
        <div className="text-center mb-10">
            <div className="inline-block border-2 border-black px-8 py-4">
                <h1 className="text-2xl font-black uppercase">Certificat de Position Fiscale Prévisionnelle</h1>
                <p className="text-xs font-bold italic mt-1">Simulation effectuée via Jibayatic</p>
            </div>
        </div>

        {/* INFO CONTRIBUABLE */}
        <div className="mb-8 p-4 border border-black">
            <h3 className="font-black uppercase border-b border-black pb-2 mb-4 text-sm">I. Identification du Contribuable</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-bold">Nom / Raison Sociale :</span> {context.name}</p>
                <p><span className="font-bold">Activité :</span> {context.activity}</p>
                <p><span className="font-bold">Code Activité :</span> {context.activityCode}</p>
                <p><span className="font-bold">Chiffre d'Affaires Estimé :</span> {simulatedCA.toLocaleString()} DA</p>
                <p><span className="font-bold">Forme Juridique :</span> {analysis.isMorale ? 'Personne Morale' : 'Personne Physique'}</p>
                <p><span className="font-bold">Catégorie :</span> {activeCategory}</p>
            </div>
        </div>

        {/* RESULTAT ANALYSE */}
        <div className="mb-8 p-4 border border-black bg-gray-50">
            <h3 className="font-black uppercase border-b border-black pb-2 mb-4 text-sm">II. Régime Fiscal Applicable</h3>
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-lg font-bold">Régime Déterminé : <span className="uppercase">{analysis.recommendedRegime.replace('_', ' ')}</span></p>
                    <p className="text-xs italic mt-1">Motif : {analysis.forceReason || "Respect des seuils légaux"}</p>
                </div>
                {analysis.exclusion.isExcluded && (
                    <div className="border border-black px-2 py-1 text-xs font-bold">
                        EXCLUSION SYSTÈME
                    </div>
                )}
            </div>
        </div>

        {/* TABLEAU DES OBLIGATIONS */}
        <div className="mb-8">
            <h3 className="font-black uppercase mb-4 text-sm underline">III. Calendrier des Obligations Fiscales</h3>
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left">Code Formulaire</th>
                        <th className="border border-black p-2 text-left">Intitulé</th>
                        <th className="border border-black p-2 text-center">Périodicité</th>
                        <th className="border border-black p-2 text-center">Échéance</th>
                    </tr>
                </thead>
                <tbody>
                    {analysis.forms.map((form, idx) => (
                        <tr key={idx}>
                            <td className="border border-black p-2 font-bold">{form.code}</td>
                            <td className="border border-black p-2">{form.label}</td>
                            <td className="border border-black p-2 text-center">{form.freq}</td>
                            <td className="border border-black p-2 text-center">{form.deadline}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* PIED DE PAGE */}
        <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-black">
            <div className="text-xs">
                <p>Fait le : {new Date().toLocaleDateString('fr-FR')}</p>
                <p className="mt-2 text-[10px] italic">Ce document est généré à titre indicatif sur la base des données saisies.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="border border-black p-1">
                    <QrCode className="w-16 h-16" />
                </div>
                <p className="text-[10px] font-bold">Authenticité Numérique</p>
            </div>
        </div>
    </div>
    </>
  );
};

function User(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}

export default RegimeDetails;
