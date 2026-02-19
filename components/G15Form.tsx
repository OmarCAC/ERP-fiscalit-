
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tractor, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Leaf, 
  Sprout, 
  Coins, 
  FileText, 
  Users, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Save, 
  ArrowLeft, 
  Download,
  Printer, 
  X, 
  Wheat, 
  Trees, 
  Flower2, 
  Info,
  AlertCircle,
  Milk,
  FileCheck,
  CheckCircle2,
  Ruler,
  FileKey,
  Landmark,
  CreditCard,
  Banknote,
  Wallet,
  Calendar,
  Building,
  ArrowRight,
  Mountain,
  Sun,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Declaration, Taxpayer, Partner, G15Config } from '../types';

interface Props {
  onBack: () => void;
  onSubmit?: (dec: Declaration) => void;
  taxpayer?: Taxpayer | null;
  g15Config: G15Config;
}

// Structure des Catégories de Cultures (G15 Officiel)
const CATEGORIES_CULTURES = [
    { id: 'fourrageres', label: 'I. CULTURES FOURRAGÈRES', icon: Sprout, items: ['Trèfle - Luzerne', 'Autres fourrages'] },
    { id: 'industrielles', label: 'II. CULTURES INDUSTRIELLES', icon: Building, items: ['Tabacs', 'Tomates industrielles', 'Betteraves à sucre', 'Tournesol', 'Coton irrigué', 'Coton sec', 'Divers'] },
    { id: 'maraicheres', label: 'III. CULTURES MARAÎCHÈRES', icon: Flower2, items: ['Pommes de terre', 'Tomates', 'Artichauts', 'Haricots', 'Petit-pois', 'Carottes', 'Navets', 'Aubergines', 'Courgettes', 'Oignons', 'Aulx', 'Piments', 'Poivrons', 'Melon', 'Pastèque', 'Divers'] },
    { id: 'arboriculture', label: 'IV. ARBORICULTURE', icon: Trees, items: ['Agrumes', 'Olives de conserve', 'Olives à huile', 'Figuiers', 'Arbres à noyaux', 'Arbres à pépins', 'Amandiers'] },
    { id: 'cereales', label: 'V. CÉRÉALES', icon: Wheat, items: ['Blé dur', 'Blé tendre', 'Orge', 'Avoine', 'Terre en jachère', 'Divers'] },
    { id: 'legumes_secs', label: 'VI. LÉGUMES SECS', icon: Leaf, items: ['Pois-chiches', 'Pois-secs', 'Haricots secs', 'Lentilles', 'Fèves'] },
    { id: 'vignes', label: 'VII. VIGNES', icon: Leaf, items: ['Vignes de cuve', 'Vignes de table'] },
    { id: 'palmiers', label: 'VIII. PALMIERS DATTIERS', icon: Trees, items: ['Deglet Ennour', 'Dattes communes'] },
    { id: 'autres', label: 'IX. AUTRES', icon: Leaf, items: ['Autre culture 1', 'Autre culture 2'] }
];

// Structure des Espèces d'Élevage
const ESPECES_ELEVAGE = [
    { id: 'bovins', label: 'I. ESPÈCE BOVINE', items: ['Vache laitière', 'Vache allaitante', 'Taureau', 'Génisse', 'Veau', 'Bœuf'] },
    { id: 'ovins', label: 'II. ESPÈCE OVINE', items: ['Brebis', 'Bélier reproducteur', 'Agneau', 'Mouton'] },
    { id: 'caprins', label: 'III. ESPÈCE CAPRINE', items: ['Chèvre', 'Bouc', 'Chevreau'] },
    { id: 'volaille', label: 'IV. ESPÈCE VOLAILLE', items: ['Poule pondeuse', 'Poulet de chair', 'Dinde', 'Canard'] },
    { id: 'lapins', label: 'V. ESPÈCE LAPINE', items: ['Lapin reproducteur', 'Lapine', 'Lapereau'] },
    { id: 'camelins', label: 'VI. ESPÈCE CAMELINE', items: ['Dromadaire', 'Chameau', 'Chamelle'] }
];

// --- COMPOSANT PRINCIPAL ---

const G15Form: React.FC<Props> = ({ onBack, onSubmit, taxpayer, g15Config }) => {
  // SUPPRESSION DE L'ONGLET PATRIMOINE ET PAIEMENT
  const [activeTab, setActiveTab] = useState<'IDENTIFICATION' | 'CULTURES' | 'ELEVAGE' | 'SYNTHESE'>('IDENTIFICATION');
  
  // --- ÉTATS ---

  // 1. Identification & Zone
  const [identData, setIdentData] = useState({
     address: taxpayer?.dynamicData['adresse'] || '',
     dateDebut: taxpayer?.dynamicData['11'] || '',
     nif: taxpayer?.dynamicData['2'] || '',
     nin: taxpayer?.dynamicData['nin'] || '',
     article: taxpayer?.dynamicData['article_imp'] || '',
     // La zone détermine l'abattement !
     zone: 'NORD' as 'SUD' | 'HAUTS_PLATEAUX' | 'MONTAGNE' | 'NORD' | 'TERRE_NOUVELLE' | 'AUTRE',
     diw: taxpayer?.wilaya || '',
     structure: taxpayer?.cpiRattachement || '',
     periodeDu: `${new Date().getFullYear()}-01-01`,
     periodeAu: `${new Date().getFullYear()}-12-31`
  });

  const [partners, setPartners] = useState<Partner[]>([]);

  // 3. Cultures (Structure détaillée Ha/a/ca)
  // Stockage: { 'fourrageres_0': { ha: 0, a: 0, ca: 0 }, 'fourrageres_1': ... }
  const [cropInputs, setCropInputs] = useState<Record<string, { ha: number, a: number, ca: number }>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({'cereales': true});

  // 4. Élevage
  // Stockage: { 'bovins_0': 12, 'bovins_1': 5 }
  const [livestockInputs, setLivestockInputs] = useState<Record<string, number>>({});

  // --- INITIALISATION AVEC MODULE CONTRIBUABLE ---
  useEffect(() => {
    if (taxpayer) {
        setPartners(taxpayer.partners || [{ id: '1', name: taxpayer.dynamicData['1'] || 'Exploitant Principal', share: 100, nif: taxpayer.dynamicData['2'] || '', address: taxpayer.homeAddress || '', nin: '' }]);
        
        // Initialiser la zone si présente dans les données dynamiques
        // Correspondance avec le module TaxpayerManagement
        if (taxpayer.dynamicData['agri_zone']) {
            setIdentData(prev => ({...prev, zone: taxpayer.dynamicData['agri_zone'] as any}));
        }
        
        // Initialiser les adresses spécifiques agricole si dispo
        if (taxpayer.dynamicData['agri_address']) {
            setIdentData(prev => ({...prev, address: taxpayer.dynamicData['agri_address']}));
        }
    }
  }, [taxpayer]);

  // --- MOTEUR DE CALCUL CENTRALISÉ ---
  const calculations = useMemo(() => {
      let totalRevenuCultures = 0;
      let totalRevenuElevage = 0;
      let totalSurfaceHa = 0;

      // 1. Calcul Revenus Cultures (Basé sur la config dynamique)
      CATEGORIES_CULTURES.forEach(cat => {
          // Trouver le barème correspondant dans la config
          const configItem = g15Config.cultures.find(c => c.id === cat.id);
          const bareme = configItem ? configItem.value : 0;

          let surfaceCat = 0;
          cat.items.forEach((_, idx) => {
              const key = `${cat.id}_${idx}`;
              const input = cropInputs[key] || { ha: 0, a: 0, ca: 0 };
              const surface = input.ha + (input.a / 100) + (input.ca / 10000);
              surfaceCat += surface;
          });
          
          if (surfaceCat > 0) {
              const revenu = surfaceCat * bareme;
              totalRevenuCultures += revenu;
              totalSurfaceHa += surfaceCat;
          }
      });

      // 2. Calcul Revenus Élevage (Basé sur la config dynamique)
      ESPECES_ELEVAGE.forEach(esp => {
          // Trouver le barème correspondant dans la config
          const configItem = g15Config.elevage.find(e => e.id === esp.id);
          const bareme = configItem ? configItem.value : 0;

          let têtesEsp = 0;
          esp.items.forEach((_, idx) => {
              const key = `${esp.id}_${idx}`;
              const count = livestockInputs[key] || 0;
              têtesEsp += count;
          });

          if (têtesEsp > 0) {
              const revenu = têtesEsp * bareme;
              totalRevenuElevage += revenu;
          }
      });

      // 3. Totaux & Abattements (Basé sur la config dynamique)
      const revenuBrut = totalRevenuCultures + totalRevenuElevage;
      
      const zoneConfig = g15Config.zones.find(z => z.id === identData.zone);
      const tauxAbattement = zoneConfig ? zoneConfig.rate / 100 : 0;
      const labelAbattement = zoneConfig ? `${zoneConfig.rate}% (${zoneConfig.label})` : 'Aucun';

      const montantAbattement = revenuBrut * tauxAbattement;
      const revenuNet = Math.max(0, revenuBrut - montantAbattement);
      
      // 4. Calcul IRG (Basé sur le barème dynamique)
      let irgDu = 0;
      if (revenuNet > 0) {
          // Logique de calcul progressive simple basée sur les tranches
          // On suppose que les tranches sont triées
          let remainingRevenu = revenuNet;
          let previousMax = 0;
          
          for (const tranche of g15Config.irgScale) {
              if (revenuNet > tranche.min) {
                  const taxableAmountInTranche = Math.min(revenuNet, tranche.max) - Math.max(previousMax, tranche.min);
                  // La première tranche min est 0, max 240000. Si revenu > 0, on prend min(revenu, 240000) - 0.
                  // Attention à la logique exacte des tranches (min inclus/exclus).
                  // Simplification robuste :
                  const effectiveMin = tranche.min === 0 ? 0 : tranche.min - 1; // Ajustement si min est 240001
                  const amount = Math.min(revenuNet, tranche.max) - effectiveMin;
                  
                  if (amount > 0) {
                      irgDu += amount * (tranche.rate / 100);
                  }
                  previousMax = tranche.max;
              }
          }
      }
      
      irgDu = Math.floor(irgDu);
      const acompte = Math.floor(irgDu * (g15Config.acompteRate / 100));

      return {
          totalSurfaceHa,
          totalRevenuCultures,
          totalRevenuElevage,
          revenuBrut,
          tauxAbattement,
          labelAbattement,
          montantAbattement,
          revenuNet,
          irgDu,
          acompte
      };

  }, [cropInputs, livestockInputs, identData.zone, g15Config]);

  // --- HANDLERS ---
  const handleCropChange = (key: string, field: 'ha' | 'a' | 'ca', val: number) => {
      setCropInputs(prev => ({
          ...prev,
          [key]: { ...prev[key] || { ha: 0, a: 0, ca: 0 }, [field]: Math.max(0, val) }
      }));
  };

  const handleLivestockChange = (key: string, val: number) => {
      setLivestockInputs(prev => ({
          ...prev,
          [key]: Math.max(0, val)
      }));
  };

  const toggleCategory = (id: string) => {
      setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ' | 'TRANSMIS') => {
      if (onSubmit) {
          onSubmit({
              id: `G15-${Date.now()}`,
              type: 'Série G n°15 (Agricole)',
              period: `Exercice ${identData.periodeDu.substring(0,4)}`,
              regime: 'AGRICOLE',
              status: status === 'TRANSMIS' ? 'TRANSMIS' : status, 
              submissionDate: status === 'VALIDÉ' || status === 'TRANSMIS' ? new Date().toLocaleDateString('fr-FR') : '-',
              amount: calculations.acompte, // C'est l'acompte qu'on paie
              taxpayerName: taxpayer?.dynamicData['1']
          });
      }
  };

  // Helper pour afficher le barème actuel d'une catégorie
  const getBaremeDisplay = (catId: string) => {
      const val = g15Config.cultures.find(c => c.id === catId)?.value || 0;
      return `${val.toLocaleString()} DA/Ha`;
  };
  
  const getBaremeElevageDisplay = (espId: string) => {
      const val = g15Config.elevage.find(e => e.id === espId)?.value || 0;
      return `${val.toLocaleString()} DA/tête`;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-full sticky top-0">
         <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">G15 Navigation</h2>
            <p className="text-xs text-slate-500 font-medium">IRG Agricole</p>
         </div>
         <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {[
                { id: 'IDENTIFICATION', label: '1. Identification', icon: Users },
                { id: 'CULTURES', label: '2. Cultures', icon: Leaf },
                { id: 'ELEVAGE', label: '3. Élevage', icon: Milk },
                { id: 'SYNTHESE', label: '4. Synthèse', icon: FileCheck },
            ].map(item => (
              <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-[#15803d] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
         </nav>
         <div className="p-4 border-t border-slate-100">
            <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50">
               <ArrowLeft className="w-4 h-4" /> Quitter
            </button>
         </div>
      </div>
      
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
         
         {/* HEADER AVEC ACTIONS */}
         <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">G15 - IRG Agricole</h1>
               <div className="flex items-center gap-3 mt-1">
                   <p className="text-slate-500 text-sm font-medium">
                      Calculateur fiscal des revenus agricoles (Système Réel/Forfaitaire)
                   </p>
               </div>
            </div>
            {taxpayer && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2 animate-in fade-in">
                    <RefreshCw className="w-4 h-4 text-green-600 animate-spin-slow" />
                    <span className="text-xs font-bold text-green-800">Dossier lié : {taxpayer.dynamicData['1']}</span>
                </div>
            )}
            <div className="flex gap-3">
              <button onClick={handlePrint} className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                 <Printer className="w-4 h-4" /> Aperçu
              </button>
              <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                 <Save className="w-4 h-4" /> Sauvegarder
              </button>
              <button onClick={() => handleSave('VALIDÉ')} className="px-6 py-2.5 bg-[#1173d4] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" /> Valider
              </button>
            </div>
         </div>

         {/* --- CONTENU IDENTIFICATION --- */}
         {activeTab === 'IDENTIFICATION' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                
                {/* 1. ADMINISTRATION */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                        <Landmark className="w-5 h-5 text-slate-500" />
                        <h3 className="text-sm font-black text-slate-900 uppercase">Administration Fiscale</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">DIW</label>
                                   <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 uppercase">{identData.diw || '---'}</div>
                               </div>
                               <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Structure</label>
                                   <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800">{identData.structure || '---'}</div>
                               </div>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-end gap-3">
                               <div className="flex-1 space-y-1">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Exercice Du</label>
                                   <input type="date" value={identData.periodeDu} onChange={e => setIdentData({...identData, periodeDu: e.target.value})} className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-medium" />
                               </div>
                               <div className="flex-1 space-y-1">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Au</label>
                                   <input type="date" value={identData.periodeAu} onChange={e => setIdentData({...identData, periodeAu: e.target.value})} className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-medium" />
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* 2. EXPLOITATION & ZONE (CRITIQUE POUR ABATTEMENT) */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-4 mb-6">Identification de l'Exploitation & Zone</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Adresse de l'exploitation</label>
                            <input type="text" value={identData.address} onChange={e => setIdentData({...identData, address: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500">NIF</label>
                               <input type="text" value={identData.nif} readOnly className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-500" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500">NIN</label>
                               <input type="text" value={identData.nin} readOnly className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-500" />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* SELECTEUR DE ZONE (DÉTERMINE L'ABATTEMENT) */}
                   <div className="space-y-3 pt-4 border-t border-slate-100 bg-orange-50/50 p-4 rounded-xl">
                      <div className="flex justify-between items-center">
                          <h3 className="text-sm font-black text-orange-900 uppercase">Lieu de situation (Détermine l'abattement)</h3>
                          <span className="text-[10px] font-bold bg-white px-2 py-1 rounded text-orange-600 border border-orange-200">Impact Fiscal Direct</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {g15Config.zones.map(z => (
                           <button 
                              key={z.id} 
                              onClick={() => setIdentData({...identData, zone: z.id as any})}
                              className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-left flex flex-col gap-1 ${identData.zone === z.id ? 'bg-orange-100 border-orange-400 text-orange-900' : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200'}`}
                           >
                              <div className="flex justify-between w-full">
                                  {/* Icones statiques pour l'instant */}
                                  <span className="text-xl">
                                      {z.id === 'SUD' ? <Sun className="w-5 h-5"/> : z.id === 'HAUTS_PLATEAUX' ? <Wheat className="w-5 h-5"/> : z.id === 'MONTAGNE' ? <Mountain className="w-5 h-5"/> : z.id === 'TERRE_NOUVELLE' ? <Sprout className="w-5 h-5"/> : <MapPin className="w-5 h-5"/>}
                                  </span>
                                  {identData.zone === z.id && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                              </div>
                              <span className="text-xs font-black">{z.label}</span>
                              <span className="text-[9px] opacity-80">Taux: {z.rate}%</span>
                           </button>
                        ))}
                      </div>
                   </div>
                </div>

                {/* 3. EXPLOITANTS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-black text-slate-900 uppercase">Exploitants / Associés</h3>
                    </div>
                    <div className="p-4">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-xs text-slate-500 font-bold border-b border-slate-200">
                                <tr><th className="px-4 py-2">Nom</th><th className="px-4 py-2">Part (%)</th><th className="px-4 py-2">NIF</th></tr>
                            </thead>
                            <tbody>
                                {partners.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-2 font-medium">{p.name}</td>
                                        <td className="px-4 py-2">{p.share}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{p.nif}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
         )}
         
         {/* --- CONTENU CULTURES (MOTEUR DE CALCUL) --- */}
         {activeTab === 'CULTURES' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                       <h3 className="text-sm font-black text-slate-900 uppercase">Volet I : Cultures - Saisie Détaillée</h3>
                       <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded border border-slate-200">
                          Total Surface : {calculations.totalSurfaceHa.toFixed(4)} Ha
                       </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                       {CATEGORIES_CULTURES.map(cat => (
                          <div key={cat.id} className="bg-white">
                             <button 
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                             >
                                <div className="flex items-center gap-3">
                                   {openCategories[cat.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                   <cat.icon className="w-5 h-5 text-green-600" />
                                   <span className="text-sm font-bold text-slate-700">{cat.label}</span>
                                </div>
                                <div className="text-xs font-mono font-medium text-slate-400">
                                    Barème : {getBaremeDisplay(cat.id)}
                                </div>
                             </button>
                             
                             {openCategories[cat.id] && (
                                <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                                   <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                      <table className="w-full text-left text-sm">
                                         <thead className="bg-slate-100 text-xs font-bold text-slate-500 border-b border-slate-200">
                                            <tr>
                                               <th className="px-4 py-2 w-1/3">Type de Culture</th>
                                               <th className="px-4 py-2 text-center w-24">Hectares</th>
                                               <th className="px-4 py-2 text-center w-24">Ares</th>
                                               <th className="px-4 py-2 text-center w-24">Centiares</th>
                                               <th className="px-4 py-2 text-right">Revenu Calculé</th>
                                            </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-200">
                                            {cat.items.map((item, idx) => {
                                               const key = `${cat.id}_${idx}`;
                                               const val = cropInputs[key] || { ha: 0, a: 0, ca: 0 };
                                               const surface = val.ha + (val.a / 100) + (val.ca / 10000);
                                               const bareme = g15Config.cultures.find(c => c.id === cat.id)?.value || 0;
                                               const revenue = surface * bareme;
                                               
                                               return (
                                               <tr key={idx}>
                                                  <td className="px-4 py-2 font-medium text-slate-700">{item}</td>
                                                  <td className="px-4 py-2"><input type="number" min="0" value={val.ha || ''} onChange={e => handleCropChange(key, 'ha', parseInt(e.target.value)||0)} className="w-full h-8 text-center border border-slate-300 rounded text-sm font-mono" placeholder="0" /></td>
                                                  <td className="px-4 py-2"><input type="number" min="0" max="99" value={val.a || ''} onChange={e => handleCropChange(key, 'a', parseInt(e.target.value)||0)} className="w-full h-8 text-center border border-slate-300 rounded text-sm font-mono" placeholder="0" /></td>
                                                  <td className="px-4 py-2"><input type="number" min="0" max="99" value={val.ca || ''} onChange={e => handleCropChange(key, 'ca', parseInt(e.target.value)||0)} className="w-full h-8 text-center border border-slate-300 rounded text-sm font-mono" placeholder="0" /></td>
                                                  <td className="px-4 py-2 text-right font-bold text-slate-900">{revenue > 0 ? revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' DA' : '-'}</td>
                                               </tr>
                                            )})}
                                         </tbody>
                                      </table>
                                   </div>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                </div>
                
                <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Revenus Cultures</span>
                    <span className="text-2xl font-black">{calculations.totalRevenuCultures.toLocaleString()} DA</span>
                </div>
            </div>
         )}
         
         {/* --- CONTENU ELEVAGE --- */}
         {activeTab === 'ELEVAGE' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                   <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6"><Milk className="w-5 h-5 text-amber-600" /> Élevage</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {ESPECES_ELEVAGE.map(esp => (
                           <div key={esp.id} className="bg-amber-50/30 rounded-xl border border-amber-100 overflow-hidden">
                               <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-200 flex justify-between items-center">
                                   <h4 className="font-bold text-sm text-amber-900">{esp.label}</h4>
                                   <span className="text-[10px] font-mono text-amber-700">{getBaremeElevageDisplay(esp.id)}</span>
                               </div>
                               <div className="p-4 space-y-3">
                                   {esp.items.map((item, idx) => {
                                       const key = `${esp.id}_${idx}`;
                                       return (
                                           <div key={idx} className="flex items-center justify-between">
                                               <span className="text-xs font-medium text-slate-700">{item}</span>
                                               <input 
                                                  type="number" 
                                                  min="0"
                                                  value={livestockInputs[key] || ''}
                                                  onChange={e => handleLivestockChange(key, parseInt(e.target.value)||0)}
                                                  className="w-24 h-8 px-2 border border-slate-300 rounded text-right text-sm font-bold"
                                                  placeholder="0"
                                               />
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Revenus Élevage</span>
                    <span className="text-2xl font-black">{calculations.totalRevenuElevage.toLocaleString()} DA</span>
                </div>
             </div>
         )}
         
         {/* --- CONTENU SYNTHESE --- */}
         {activeTab === 'SYNTHESE' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                
                {/* 1. Résumé des Revenus */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400">Revenus Cultures</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{calculations.totalRevenuCultures.toLocaleString()} DA</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400">Revenus Élevage</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{calculations.totalRevenuElevage.toLocaleString()} DA</p>
                    </div>
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 shadow-inner">
                        <p className="text-[10px] font-black uppercase text-slate-500">Revenu Brut Global</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{calculations.revenuBrut.toLocaleString()} DA</p>
                    </div>
                </div>

                {/* 2. Calcul de l'impôt avec Abattement */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <h3 className="text-lg font-black text-slate-900">Détermination du Revenu Net & IRG</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm font-bold text-slate-600">Revenu Brut</span>
                            <span className="text-base font-mono font-bold">{calculations.revenuBrut.toLocaleString()} DA</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-slate-50 bg-orange-50/50 px-2 -mx-2 rounded">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-orange-800">Abattement Zone ({calculations.labelAbattement})</span>
                                <span className="text-[10px] text-orange-600">Zone sélectionnée : {identData.zone}</span>
                            </div>
                            <span className="text-base font-mono font-bold text-orange-700">- {calculations.montantAbattement.toLocaleString()} DA</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-sm font-black text-slate-800 uppercase">Revenu Net Imposable</span>
                            <span className="text-xl font-mono font-black text-slate-900">{calculations.revenuNet.toLocaleString()} DA</span>
                        </div>

                        <div className="flex justify-between items-center py-4 bg-slate-900 text-white px-6 rounded-xl shadow-md mt-4">
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">IRG Dû (Barème 2025)</span>
                                <p className="text-[10px] text-slate-500">Calculé sur le revenu net</p>
                            </div>
                            <span className="text-3xl font-black tracking-tighter">{calculations.irgDu.toLocaleString()} DA</span>
                        </div>
                    </div>
                </div>

                {/* 3. Acompte */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                        <h4 className="text-sm font-black text-blue-900 uppercase">Acompte Provisionnel ({g15Config.acompteRate}%)</h4>
                        <p className="text-xs text-blue-700 mt-1">À payer avant le 20 Octobre</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-blue-800">{calculations.acompte.toLocaleString()} DA</p>
                    </div>
                </div>

             </div>
         )}
         
         {/* Footer... */}
         <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200 pb-20">
            {activeTab !== 'IDENTIFICATION' && (
               <button onClick={() => setActiveTab(prev => {
                  if (prev === 'SYNTHESE') return 'ELEVAGE';
                  if (prev === 'ELEVAGE') return 'CULTURES';
                  if (prev === 'CULTURES') return 'IDENTIFICATION';
                  return 'IDENTIFICATION';
               })} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Précédent</button>
            )}
            
            {activeTab !== 'SYNTHESE' ? (
               <button onClick={() => setActiveTab(prev => {
                  if (prev === 'IDENTIFICATION') return 'CULTURES';
                  if (prev === 'CULTURES') return 'ELEVAGE';
                  if (prev === 'ELEVAGE') return 'SYNTHESE';
                  return 'SYNTHESE';
               })} className="px-8 py-3 bg-[#1e40af] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-lg">Suivant</button>
            ) : null}
         </div>

    </main>
    </div>
  );
};

export default G15Form;
