import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, Plus, Edit2, Trash2, X, MapPinned as MapIcon,
  ChevronRight, Landmark, Database, Network, AlertCircle,
  Hash, Layout, Target, Cpu, CheckCircle2,
  FolderPlus, FilePlus, Fingerprint,
  ArrowLeft, Activity, MapPin, Trash, Type, Image as ImageIcon,
  Search, Filter, Save, Globe, Info, Tag, ArrowRight,
  ArrowLeftRight, ArrowUpRight, ShieldAlert,
  ChevronDown, Upload, Download, FileJson, Copy,
  Loader2,
  ShieldCheck,
  Ban,
  Gavel,
  Scale,
  BookOpen,
  PieChart as PieChartIcon,
  Zap,
  Percent,
  Sliders,
  TrendingUp,
  History,
  BarChart4,
  Calculator,
  AlertTriangle,
  Coins,
  Briefcase,
  Lightbulb,
  Users,
  Hammer,
  Wallet,
  Building,
  FileDigit,
  CalendarDays,
  Calendar,
  Clock,
  Flag,
  Bell,
  Repeat,
  Palette,
  ToggleLeft,
  ListFilter,
  FileText,
  RotateCcw,
  RefreshCw,
  PenLine,
  Check,
  Heart,
  LayoutTemplate,
  Tractor,
  Building2,
  User,
  MoreHorizontal,
  Sprout,
  Milk,
  Table,
  Map as LucideMap,
  Truck,
  Scissors,
  Home
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Jurisdiction } from '../data/jurisdictions';
import { NAAActivity, detectExclusion } from '../data/naa_data';
import { ConfigField, LocFieldSetting, ExclusionRule, CalendarConfig, FiscalRule, Holiday, RegimeConfig, G15Config } from '../types';

type MainTab = 'studio' | 'classification' | 'calcul_engine' | 'hierarchy' | 'naa_config' | 'exclusions' | 'calendar_config' | 'form_config' | 'decl_params';
type StudioTab = 'PHYSIQUE' | 'MORALE' | 'AGRICOLE';

interface SystemParametersProps {
  configFields: ConfigField[];
  setConfigFields: React.Dispatch<React.SetStateAction<ConfigField[]>>;
  locFieldSettings: LocFieldSetting[];
  setLocFieldSettings: React.Dispatch<React.SetStateAction<LocFieldSetting[]>>;
  officialDecreeUrl: string;
  setOfficialDecreeUrl: (url: string) => void;
  ifuThreshold: number;
  setIfuThreshold: (v: number) => void;
  minFiscal: number;
  setMinFiscal: (v: number) => void;
  rateVente: number;
  setRateVente: (v: number) => void;
  rateService: number;
  setRateService: (v: number) => void;
  jurisdictions: Jurisdiction[];
  setJurisdictions: React.Dispatch<React.SetStateAction<Jurisdiction[]>>;
  naaData: NAAActivity[];
  setNaaData: React.Dispatch<React.SetStateAction<NAAActivity[]>>;
  naaSections: any[];
  setNaaSections: React.Dispatch<React.SetStateAction<any[]>>;
  exclusionRules: ExclusionRule[];
  setExclusionRules: React.Dispatch<React.SetStateAction<ExclusionRule[]>>;
  calendarConfig: CalendarConfig;
  setCalendarConfig: React.Dispatch<React.SetStateAction<CalendarConfig>>;
  regimeConfig: RegimeConfig[];
  setRegimeConfig: React.Dispatch<React.SetStateAction<RegimeConfig[]>>;
  // Props partagées pour G15
  g15Config: G15Config;
  setG15Config: React.Dispatch<React.SetStateAction<G15Config>>;
}

const AVAILABLE_FORMS = [
  { id: 'GN12', label: 'G12 Prévisionnelle', desc: 'Déclaration annuelle IFU' },
  { id: 'GN12_BIS', label: 'G12 Bis Définitive', desc: 'Complémentaire IFU' },
  { id: 'G50_TER', label: 'G50 Ter (Salaires)', desc: 'IRG Salaires Mensuel/Trim.' },
  // Unification G50 : Seul G50 Mensuel reste (couvre Simplifié et Complet selon config)
  { id: 'G50_MENSUEL', label: 'G50 Mensuel (Unique)', desc: 'Déclaration Mensuelle (Toutes variantes)' },
  
  { id: 'G1', label: 'G1 (Revenu Global)', desc: 'Déclaration Annuelle IRG' },
  { id: 'G11', label: 'Liasse G11 (BIC)', desc: 'Bilan Annuel Réel' },
  { id: 'G13', label: 'Liasse G13 (BNC)', desc: 'Bilan Annuel BNC' },
  { id: 'G15', label: 'G15 (Agricole)', desc: 'Revenus Agricoles' },
  
  // Unification G17
  { id: 'G17_UNIFIED', label: 'Série G n°17 (Plus-Values)', desc: 'Immobilier, Mobilier & IBS' },
  
  { id: 'G51', label: 'G51 Foncier', desc: 'Revenus Locatifs' },
  { id: 'G29', label: 'G29 (Salaires Annuel)', desc: 'État 301 Bis' },
  { id: 'EXISTENCE', label: 'Déclaration d\'Existence', desc: 'G n°08' },
  { id: 'CESSATION', label: 'Cessation d\'Activité', desc: 'D n°1 Ter' },
  { id: 'SUBSCRIPTION', label: 'Abonnement Jibayatic', desc: 'Formulaire Interne' },
];

const SystemParameters: React.FC<SystemParametersProps> = ({ 
  configFields, setConfigFields, locFieldSettings, setLocFieldSettings,
  ifuThreshold, setIfuThreshold, minFiscal, setMinFiscal,
  rateVente, setRateVente, rateService, setRateService,
  jurisdictions, setJurisdictions, naaData, setNaaData,
  naaSections, setNaaSections, exclusionRules, setExclusionRules,
  calendarConfig, setCalendarConfig,
  regimeConfig, setRegimeConfig,
  g15Config, setG15Config
}) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('studio');
  const [studioTab, setStudioTab] = useState<StudioTab>('PHYSIQUE'); 
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- STATES ---
  const [calSubTab, setCalSubTab] = useState<'RULES' | 'HOLIDAYS' | 'SETTINGS'>('RULES');
  const [editingRule, setEditingRule] = useState<FiscalRule | null>(null);
  const [newRule, setNewRule] = useState<FiscalRule>({ id: '', title: '', categoryId: 'FISCAL', frequency: 'MENSUEL', dayDeadline: 20, description: '' });
  const [newHoliday, setNewHoliday] = useState({ date: '', label: '' });
  const [showRuleModal, setShowRuleModal] = useState(false);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<ConfigField>({
    id: '', label: '', nature: 'alphanumeric', maxLength: 50, inputType: 'free', required: false, section: 'AUTRE', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE']
  });

  const [editingRegimeId, setEditingRegimeId] = useState<string | null>(null);
  const [tempRegimeConfig, setTempRegimeConfig] = useState<RegimeConfig | null>(null);

  const [simCa, setSimCa] = useState(12000000);
  const [simCharges, setSimCharges] = useState(7500000); 
  const [simType, setSimType] = useState<'vente' | 'service'>('vente');
  const [riskFlags, setRiskFlags] = useState({ incoherentMargin: false, cashPayment: false, lateDeclaration: false, frequentAmendments: false, sectorRisk: false });

  // --- GESTION PARAMETRES DECLARATIONS ---
  const [selectedDeclConfig, setSelectedDeclConfig] = useState<string>('G15');
  const [declParamsTab, setDeclParamsTab] = useState<'BAREMES' | 'ZONES' | 'IRG' | 'ACOMPTE'>('BAREMES');
  
  // --- G50 CONFIGURATION STATE ---
  const [g50ParamsTab, setG50ParamsTab] = useState<'TVA' | 'TLS' | 'IBS' | 'IRG_SAL'>('TVA');
  const [g50Config, setG50Config] = useState({
      tvaRates: [
          { id: 'normal', label: 'Taux Normal', value: 19 },
          { id: 'reduit', label: 'Taux Réduit', value: 9 },
      ],
      tlsRates: [
          { id: 'prod_btph', label: 'Production / BTPH', value: 1.5 },
          { id: 'autres', label: 'Autres Activités', value: 1.5 }, // Ex: Services, Commerce (1.5% unifié LF 2024)
          { id: 'hydro', label: 'Hydrocarbures', value: 3 },
      ],
      ibsRates: [
          { id: 'prod', label: 'Production de Biens', value: 19 },
          { id: 'btph', label: 'BTPH / Tourisme', value: 23 },
          { id: 'services', label: 'Services / Commerce', value: 26 },
      ],
      irgSalaires: [
          { min: 0, max: 20000, rate: 0 },
          { min: 20001, max: 40000, rate: 23 },
          { min: 40001, max: 80000, rate: 27 },
          { min: 80001, max: 160000, rate: 30 },
          { min: 160001, max: 320000, rate: 33 },
          { min: 320001, max: 999999999, rate: 35 },
      ]
  });

  // --- G1 CONFIGURATION STATE ---
  const [g1ParamsTab, setG1ParamsTab] = useState<'BAREME' | 'ABATTEMENTS'>('BAREME');
  const [g1Config, setG1Config] = useState({
      irgScale: [
          { min: 0, max: 240000, rate: 0 },
          { min: 240001, max: 480000, rate: 23 },
          { min: 480001, max: 960000, rate: 27 },
          { min: 960001, max: 1920000, rate: 30 },
          { min: 1920001, max: 3840000, rate: 33 },
          { min: 3840001, max: 99999999999, rate: 35 },
      ],
      abatements: [
          { id: 'FONCIER', label: 'Abattement Revenus Fonciers', value: 25, unit: '%' },
          { id: 'MARGE', label: 'Abattement Résultat (Optionnel)', value: 0, unit: '%' },
          { id: 'IMPOSITION_COMMUNE', label: 'Abattement Imposition Commune', value: 10, unit: '%' },
      ]
  });

  // --- G51 CONFIGURATION STATE ---
  const [g51ParamsTab, setG51ParamsTab] = useState<'TAUX' | 'SEUILS'>('TAUX');
  const [g51Config, setG51Config] = useState({
      rates: [
          { id: 'HABITATION', label: 'Usage Habitation (Libératoire)', value: 7 },
          { id: 'COMMERCIAL', label: 'Usage Commercial / Professionnel', value: 15 },
          { id: 'AGRICOLE', label: 'Terrain Agricole', value: 10 },
          { id: 'TERRAIN_IND', label: 'Terrain Industriel / Nu', value: 15 },
          { id: 'ETUDIANT', label: 'Location aux Étudiants (Exonéré)', value: 0 },
          { id: 'ORGANISME', label: 'Location à Organisme Public (Exonéré)', value: 0 },
      ],
      thresholds: [
          { id: 'GLOBAL', label: 'Seuil Imposition Provisoire (Annuel)', value: 1800000 },
      ]
  });

  // --- G11 CONFIGURATION STATE ---
  const [g11ParamsTab, setG11ParamsTab] = useState<'GENERAL' | 'TLS'>('GENERAL');
  const [g11Config, setG11Config] = useState({
      general: [
          { id: 'MIN_IMPOT', label: 'Minimum d\'Imposition (BIC)', value: 10000, unit: 'DA' },
          { id: 'ACOMPTE_TAUX', label: 'Taux Acomptes Provisionnels', value: 30, unit: '%' },
      ],
      tlsRates: [
          { id: 'STD', label: 'Taux Standard (Commerce/Services)', value: 1.5 },
          { id: 'PROD', label: 'Taux Production / BTPH', value: 1.5 },
          { id: 'HYDRO', label: 'Taux Hydrocarbures', value: 3 },
      ]
  });

  // --- G13 CONFIGURATION STATE ---
  const [g13ParamsTab, setG13ParamsTab] = useState<'GENERAL' | 'PLAFONDS'>('GENERAL');
  const [g13Config, setG13Config] = useState({
      general: [
          { id: 'MIN_IMPOT_BNC', label: 'Minimum d\'Imposition (BNC)', value: 10000, unit: 'DA' },
          { id: 'ACOMPTE_TAUX_BNC', label: 'Taux Acomptes Provisionnels', value: 30, unit: '%' },
      ],
      deductions: [
          { id: 'CADEAUX', label: 'Plafond Cadeaux Publicitaires (Unité)', value: 1000, unit: 'DA' },
          { id: 'VEHICULE_TOUR', label: 'Plafond Amortissement Véhicule Tourisme', value: 3000000, unit: 'DA' },
          { id: 'COTISATIONS', label: 'Plafond Cotisations Facultatives', value: 10, unit: '%' }, // % du revenu
      ]
  });

  // --- G17 CONFIGURATION STATE (NOUVEAU) ---
  const [g17ParamsTab, setG17ParamsTab] = useState<'IMMOBILIER' | 'MOBILIER' | 'IBS'>('IMMOBILIER');
  const [g17Config, setG17Config] = useState({
      immobilier: [
          { id: 'TAUX_IRG', label: 'Taux Imposition (G17)', value: 15, unit: '%' },
          { id: 'ABATT_AN', label: 'Abattement par an (dès 3 ans)', value: 5, unit: '%' },
          { id: 'ABATT_MAX', label: 'Plafond Abattement Durée', value: 50, unit: '%' },
          { id: 'FORFAIT_FRAIS', label: 'Forfait Frais Acquisition', value: 30, unit: '%' },
          { id: 'RED_RESID', label: 'Réduction Résidence Principale', value: 50, unit: '%' },
      ],
      mobilier: [
          { id: 'TAUX_RES', label: 'Taux Résident (G17 Bis)', value: 15, unit: '%' },
          { id: 'TAUX_NON_RES', label: 'Taux Non-Résident (G17 Bis)', value: 20, unit: '%' },
          { id: 'TAUX_REINV', label: 'Taux Réinvestissement', value: 5, unit: '%' },
      ],
      ibs: [
          { id: 'TAUX_IBS', label: 'Taux Retenue IBS (G17 Ter)', value: 20, unit: '%' },
      ]
  });

  // --- NAA & HIERARCHY MODALS STATE ---
  const [naaSubSearch, setNaaSubSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'dri' | 'wilaya' | 'cpi' | 'commune' | 'naa_activity' | 'exclusion_rule' | null>(null);
  
  // FORM STATES
  const [naaForm, setNaaForm] = useState<NAAActivity>({ code: '', label: '', section: 'A', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '9%', exoneration: 'Aucune' });
  const [exclusionForm, setExclusionForm] = useState<ExclusionRule>({ id: '', type: 'CODE', value: '', reason: '', ref: '', regime: 'RÉEL NORMAL' });
  
  // JURISDICTION FORMS
  const [targetCpiId, setTargetCpiId] = useState<string | null>(null); // For adding commune
  const [cpiForm, setCpiForm] = useState({ id: '', dri: '', wilayaCode: '', cpi: '', recette: '' });
  const [communeForm, setCommuneForm] = useState('');

  // --- HELPERS ---
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({msg, type});
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);

  // Derived Structure for Hierarchy
  const hierarchy = useMemo(() => {
      const struct: Record<string, Record<string, { name: string, cpis: Jurisdiction[] }>> = {};
      
      jurisdictions.forEach(j => {
          if (!struct[j.dri]) struct[j.dri] = {};
          if (!struct[j.dri][j.wilayaCode]) {
              struct[j.dri][j.wilayaCode] = { name: j.wilayaName, cpis: [] };
          }
          struct[j.dri][j.wilayaCode].cpis.push(j);
      });
      return struct;
  }, [jurisdictions]);

  const uniqueWilayas = useMemo(() => {
      const map = new Map();
      jurisdictions.forEach(j => map.set(j.wilayaCode, j.wilayaName));
      return Array.from(map.entries()).map(([code, name]) => ({code, name})).sort((a,b) => Number(a.code) - Number(b.code));
  }, [jurisdictions]);
  
  const uniqueDris = useMemo(() => Array.from(new Set(jurisdictions.map(j => j.dri))).sort(), [jurisdictions]);


  // --- HANDLERS ---
  
  // NAA
  const handleSaveNaa = () => {
    if(!naaForm.code) return;
    setNaaData(prev => {
        const exists = prev.find(n => n.code === naaForm.code);
        if(exists) return prev.map(n => n.code === naaForm.code ? naaForm : n);
        return [naaForm, ...prev];
    });
    setActiveModal(null);
    showToast("Activité NAA enregistrée");
  };

  const deleteNaa = (code: string) => {
      if(confirm("Supprimer cette activité ?")) setNaaData(prev => prev.filter(n => n.code !== code));
  };

  // EXCLUSIONS
  const openExclusionModal = () => {
      setExclusionForm({ id: '', type: 'CODE', value: '', reason: '', ref: '', regime: 'RÉEL NORMAL' });
      setActiveModal('exclusion_rule');
  };

  const handleSaveExclusion = () => {
    if(!exclusionForm.value) return;
    const newRule = { ...exclusionForm, id: exclusionForm.id || `excl_${Date.now()}` };
    setExclusionRules(prev => {
        const exists = prev.find(r => r.id === newRule.id);
        if(exists) return prev.map(r => r.id === newRule.id ? newRule : r);
        return [newRule, ...prev];
    });
    setActiveModal(null);
    showToast("Règle d'exclusion enregistrée");
  };
  const handleDeleteExclusion = (id: string) => setExclusionRules(prev => prev.filter(r => r.id !== id));

  // JURISDICTION HANDLERS
  const openCpiModal = () => {
      setCpiForm({ id: '', dri: '', wilayaCode: '', cpi: '', recette: '' });
      setActiveModal('cpi');
  };

  const handleSaveCpi = () => {
      if(!cpiForm.cpi || !cpiForm.wilayaCode) return;
      const wilayaName = uniqueWilayas.find(w => w.code === cpiForm.wilayaCode)?.name || '';
      
      const newCpi: Jurisdiction = {
          id: cpiForm.id || `cpi_${Date.now()}`,
          dri: cpiForm.dri,
          wilayaCode: cpiForm.wilayaCode,
          wilayaName: wilayaName,
          cpi: cpiForm.cpi,
          recette: cpiForm.recette,
          communes: []
      };

      setJurisdictions(prev => {
          if(cpiForm.id) return prev.map(j => j.id === cpiForm.id ? { ...j, ...newCpi, communes: j.communes } : j);
          return [...prev, newCpi];
      });
      setActiveModal(null);
      showToast("CPI enregistré");
  };

  const openCommuneModal = (cpiId: string) => {
      setTargetCpiId(cpiId);
      setCommuneForm('');
      setActiveModal('commune');
  };

  const handleSaveCommune = () => {
      if(!targetCpiId || !communeForm) return;
      setJurisdictions(prev => prev.map(j => {
          if(j.id === targetCpiId) {
              return { ...j, communes: [...j.communes, communeForm] };
          }
          return j;
      }));
      setActiveModal(null);
      showToast("Commune ajoutée");
  };

  const deleteCommune = (cpiId: string, communeName: string) => {
      setJurisdictions(prev => prev.map(j => {
          if(j.id === cpiId) return { ...j, communes: j.communes.filter(c => c !== communeName) };
          return j;
      }));
  };

  // --- STUDIO FIELD HANDLERS ---
  const toggleTargetType = (type: 'PHYSIQUE' | 'MORALE' | 'AGRICOLE') => {
      setCurrentField(prev => {
          const types = prev.targetTypes || [];
          if (types.includes(type)) {
              return { ...prev, targetTypes: types.filter(t => t !== type) };
          } else {
              return { ...prev, targetTypes: [...types, type] };
          }
      });
  };

  const saveField = () => {
      if (!currentField.label) return;
      
      setConfigFields(prev => {
          const newField = { ...currentField, id: currentField.id || `field_${Date.now()}` };
          const exists = prev.find(f => f.id === newField.id);
          if (exists) {
              return prev.map(f => f.id === newField.id ? newField : f);
          }
          return [...prev, newField];
      });
      setFieldModalOpen(false);
      showToast("Champ configuré avec succès");
  };

  // --- HANDLER G15 PARAMETRES ---
  const updateG15Value = (category: 'cultures' | 'elevage', id: string, val: string) => {
      const numVal = parseInt(val) || 0;
      setG15Config(prev => ({
          ...prev,
          [category]: prev[category].map(item => item.id === id ? { ...item, value: numVal } : item)
      }));
  };

  const updateG15Zone = (id: string, val: string) => {
      const numVal = parseInt(val) || 0;
      setG15Config(prev => ({
          ...prev,
          zones: prev.zones.map(z => z.id === id ? { ...z, rate: numVal } : z)
      }));
  };

  const updateIrgScale = (index: number, field: 'min' | 'max' | 'rate', val: string) => {
      const numVal = parseInt(val) || 0;
      setG15Config(prev => {
          const newScale = [...prev.irgScale];
          newScale[index] = { ...newScale[index], [field]: numVal };
          return { ...prev, irgScale: newScale };
      });
  };

  // --- HANDLER G50 PARAMETRES ---
  const updateG50Rate = (category: 'tvaRates' | 'tlsRates' | 'ibsRates', id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG50Config(prev => ({
          ...prev,
          [category]: prev[category].map(item => item.id === id ? { ...item, value: numVal } : item)
      }));
  };

  const updateG50Irg = (index: number, field: 'min' | 'max' | 'rate', val: string) => {
      const numVal = parseInt(val) || 0;
      setG50Config(prev => {
          const newScale = [...prev.irgSalaires];
          newScale[index] = { ...newScale[index], [field]: numVal };
          return { ...prev, irgSalaires: newScale };
      });
  };

  // --- HANDLER G1 PARAMETRES ---
  const updateG1Irg = (index: number, field: 'min' | 'max' | 'rate', val: string) => {
      const numVal = parseInt(val) || 0;
      setG1Config(prev => {
          const newScale = [...prev.irgScale];
          newScale[index] = { ...newScale[index], [field]: numVal };
          return { ...prev, irgScale: newScale };
      });
  };

  const updateG1Abatement = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG1Config(prev => ({
          ...prev,
          abatements: prev.abatements.map(a => a.id === id ? { ...a, value: numVal } : a)
      }));
  };

  // --- HANDLER G51 PARAMETRES ---
  const updateG51Rate = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG51Config(prev => ({
          ...prev,
          rates: prev.rates.map(r => r.id === id ? { ...r, value: numVal } : r)
      }));
  };

  const updateG51Threshold = (id: string, val: string) => {
      const numVal = parseInt(val) || 0;
      setG51Config(prev => ({
          ...prev,
          thresholds: prev.thresholds.map(t => t.id === id ? { ...t, value: numVal } : t)
      }));
  };

  // --- HANDLER G11 PARAMETRES ---
  const updateG11General = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG11Config(prev => ({
          ...prev,
          general: prev.general.map(g => g.id === id ? { ...g, value: numVal } : g)
      }));
  };

  const updateG11Tls = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG11Config(prev => ({
          ...prev,
          tlsRates: prev.tlsRates.map(t => t.id === id ? { ...t, value: numVal } : t)
      }));
  };

  // --- HANDLER G13 PARAMETRES ---
  const updateG13General = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG13Config(prev => ({
          ...prev,
          general: prev.general.map(g => g.id === id ? { ...g, value: numVal } : g)
      }));
  };

  const updateG13Deduction = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG13Config(prev => ({
          ...prev,
          deductions: prev.deductions.map(d => d.id === id ? { ...d, value: numVal } : d)
      }));
  };

  // --- HANDLER G17 PARAMETRES (NOUVEAU) ---
  const updateG17Immo = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG17Config(prev => ({
          ...prev,
          immobilier: prev.immobilier.map(i => i.id === id ? { ...i, value: numVal } : i)
      }));
  };

  const updateG17Mob = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG17Config(prev => ({
          ...prev,
          mobilier: prev.mobilier.map(m => m.id === id ? { ...m, value: numVal } : m)
      }));
  };

  const updateG17Ibs = (id: string, val: string) => {
      const numVal = parseFloat(val) || 0;
      setG17Config(prev => ({
          ...prev,
          ibs: prev.ibs.map(i => i.id === id ? { ...i, value: numVal } : i)
      }));
  };

  // --- RENDERERS ---

  const renderDeclarationParams = () => (
      <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase">Paramétrage des Déclarations</h2>
              
              <div className="relative">
                 <select 
                    value={selectedDeclConfig} 
                    onChange={e => setSelectedDeclConfig(e.target.value)} 
                    className="h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm cursor-pointer"
                 >
                    <option value="G15">Série G n°15 (Agricole)</option>
                    <option value="G50">Série G n°50 (Mensuel)</option>
                    <option value="G1">Série G n°1 (Annuelle)</option>
                    <option value="G51">Série G n°51 (Foncier)</option>
                    <option value="G11">Série G n°11 (Liasse BIC)</option>
                    <option value="G13">Série G n°13 (Liasse BNC)</option>
                    <option value="G17">Série G n°17 (Plus-Values)</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
          </div>

          {selectedDeclConfig === 'G15' && (
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-green-50 rounded-xl text-green-700 border border-green-100">
                          <Tractor className="w-8 h-8" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase">Configuration G15 (Agricole)</h3>
                          <p className="text-xs text-slate-500">Définissez les barèmes, zones et taux applicables.</p>
                      </div>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                      {[
                          { id: 'BAREMES', label: 'Rendements & Barèmes', icon: Sprout },
                          { id: 'ZONES', label: 'Zones & Abattements', icon: LucideMap },
                          { id: 'IRG', label: 'Barème IRG', icon: Table },
                          { id: 'ACOMPTE', label: 'Taux Acompte', icon: Percent },
                      ].map(tab => (
                          <button
                              key={tab.id}
                              onClick={() => setDeclParamsTab(tab.id as any)}
                              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${declParamsTab === tab.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <tab.icon className="w-4 h-4" /> {tab.label}
                          </button>
                      ))}
                  </div>

                  {declParamsTab === 'BAREMES' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4">
                          <div className="space-y-4">
                              <h4 className="text-sm font-black text-slate-600 uppercase flex items-center gap-2"><Sprout className="w-4 h-4" /> Cultures (DA / Hectare)</h4>
                              <div className="space-y-2">
                                  {g15Config.cultures.map(c => (
                                      <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                          <span className="text-xs font-bold text-slate-700">{c.label}</span>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="number" 
                                                  value={c.value} 
                                                  onChange={e => updateG15Value('cultures', c.id, e.target.value)}
                                                  className="w-28 h-8 px-2 bg-white border border-slate-200 rounded text-right text-sm font-mono font-bold"
                                              />
                                              <span className="text-[10px] text-slate-400 font-bold">DA</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="space-y-4">
                              <h4 className="text-sm font-black text-slate-600 uppercase flex items-center gap-2"><Milk className="w-4 h-4" /> Élevage (DA / Tête)</h4>
                              <div className="space-y-2">
                                  {g15Config.elevage.map(e => (
                                      <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                          <span className="text-xs font-bold text-slate-700">{e.label}</span>
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="number" 
                                                  value={e.value} 
                                                  onChange={ev => updateG15Value('elevage', e.id, ev.target.value)}
                                                  className="w-28 h-8 px-2 bg-white border border-slate-200 rounded text-right text-sm font-mono font-bold"
                                              />
                                              <span className="text-[10px] text-slate-400 font-bold">DA</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}

                  {declParamsTab === 'ZONES' && (
                      <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                          <h4 className="text-sm font-black text-slate-600 uppercase mb-4 flex items-center gap-2"><LucideMap className="w-4 h-4" /> Taux d'abattement par Zone</h4>
                          <div className="space-y-2">
                              {g15Config.zones.map(z => (
                                  <div key={z.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${z.rate > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                                              {z.rate}%
                                          </div>
                                          <span className="text-sm font-bold text-slate-700">{z.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="number" 
                                              value={z.rate} 
                                              onChange={e => updateG15Zone(z.id, e.target.value)}
                                              className="w-20 h-10 px-3 bg-white border border-slate-200 rounded-lg text-center font-black text-sm"
                                          />
                                          <span className="text-xs font-bold text-slate-400">%</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {declParamsTab === 'IRG' && (
                      <div className="animate-in fade-in slide-in-from-right-4">
                          <h4 className="text-sm font-black text-slate-600 uppercase mb-4 flex items-center gap-2"><Table className="w-4 h-4" /> Barème Progressif IRG</h4>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                      <tr>
                                          <th className="px-6 py-3">Tranche Min (DA)</th>
                                          <th className="px-6 py-3">Tranche Max (DA)</th>
                                          <th className="px-6 py-3 text-center">Taux (%)</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {g15Config.irgScale.map((row, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50">
                                              <td className="px-6 py-3">
                                                  <input type="number" value={row.min} onChange={e => updateIrgScale(idx, 'min', e.target.value)} className="w-full h-8 px-2 border border-slate-200 rounded text-sm font-mono" />
                                              </td>
                                              <td className="px-6 py-3">
                                                  <input type="number" value={row.max} onChange={e => updateIrgScale(idx, 'max', e.target.value)} className="w-full h-8 px-2 border border-slate-200 rounded text-sm font-mono" />
                                              </td>
                                              <td className="px-6 py-3 text-center">
                                                  <input type="number" value={row.rate} onChange={e => updateIrgScale(idx, 'rate', e.target.value)} className="w-16 h-8 px-2 border border-slate-200 rounded text-center text-sm font-bold" />
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {declParamsTab === 'ACOMPTE' && (
                      <div className="animate-in fade-in slide-in-from-right-4 max-w-xl">
                          <h4 className="text-sm font-black text-slate-600 uppercase mb-4 flex items-center gap-2"><Percent className="w-4 h-4" /> Taux de l'Acompte Prévisionnel</h4>
                          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                              <div>
                                  <p className="text-xs font-bold text-blue-800 uppercase mb-1">Acompte sur IRG Agricole</p>
                                  <p className="text-[10px] text-blue-600">Calculé sur le revenu net imposable</p>
                              </div>
                              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
                                  <input 
                                      type="number" 
                                      value={g15Config.acompteRate} 
                                      onChange={e => setG15Config({...g15Config, acompteRate: parseInt(e.target.value)||0})} 
                                      className="w-16 text-center text-xl font-black text-slate-900 border-none focus:ring-0 p-0"
                                  />
                                  <span className="text-lg font-black text-slate-400">%</span>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button onClick={() => showToast('Paramètres G15 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2">
                          <Save className="w-4 h-4" /> Enregistrer la configuration
                      </button>
                  </div>
              </div>
          )}

          {/* G50 CONFIGURATION */}
          {selectedDeclConfig === 'G50' && (
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-700 border border-blue-100">
                          <Calculator className="w-8 h-8" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase">Configuration G50 (Mensuel)</h3>
                          <p className="text-xs text-slate-500">Taux TVA, TLS, IBS et barème IRG Salaires.</p>
                      </div>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                      {[{ id: 'TVA', label: 'TVA', icon: Percent }, { id: 'TLS', label: 'TLS (TAP)', icon: Coins }, { id: 'IBS', label: 'IBS', icon: Briefcase }, { id: 'IRG_SAL', label: 'IRG Salaires', icon: Users }].map(tab => (
                          <button key={tab.id} onClick={() => setG50ParamsTab(tab.id as any)} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${g50ParamsTab === tab.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                              <tab.icon className="w-4 h-4" /> {tab.label}
                          </button>
                      ))}
                  </div>

                  {g50ParamsTab === 'TVA' && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                        {g50Config.tvaRates.map(r => (
                           <div key={r.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{r.label}</span><div className="flex items-center gap-2"><input type="number" value={r.value} onChange={e => updateG50Rate('tvaRates', r.id, e.target.value)} className="w-20 h-9 px-2 text-center font-black rounded border" /><span>%</span></div></div>
                        ))}
                     </div>
                  )}

                  {g50ParamsTab === 'TLS' && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                        {g50Config.tlsRates.map(r => (
                           <div key={r.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{r.label}</span><div className="flex items-center gap-2"><input type="number" value={r.value} onChange={e => updateG50Rate('tlsRates', r.id, e.target.value)} className="w-20 h-9 px-2 text-center font-black rounded border" /><span>%</span></div></div>
                        ))}
                     </div>
                  )}

                   {g50ParamsTab === 'IBS' && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                        {g50Config.ibsRates.map(r => (
                           <div key={r.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{r.label}</span><div className="flex items-center gap-2"><input type="number" value={r.value} onChange={e => updateG50Rate('ibsRates', r.id, e.target.value)} className="w-20 h-9 px-2 text-center font-black rounded border" /><span>%</span></div></div>
                        ))}
                     </div>
                  )}

                  {g50ParamsTab === 'IRG_SAL' && (
                      <div className="animate-in fade-in slide-in-from-right-4">
                          <table className="w-full text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="px-4 py-2">Min</th><th className="px-4 py-2">Max</th><th className="px-4 py-2">Taux</th></tr></thead>
                          <tbody>{g50Config.irgSalaires.map((row, i) => (<tr key={i}><td className="p-2"><input type="number" value={row.min} onChange={e => updateG50Irg(i, 'min', e.target.value)} className="w-full border rounded px-2 h-8" /></td><td className="p-2"><input type="number" value={row.max} onChange={e => updateG50Irg(i, 'max', e.target.value)} className="w-full border rounded px-2 h-8" /></td><td className="p-2 text-center"><input type="number" value={row.rate} onChange={e => updateG50Irg(i, 'rate', e.target.value)} className="w-16 border rounded px-2 h-8 text-center" /></td></tr>))}</tbody></table>
                      </div>
                  )}

                   <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button onClick={() => showToast('Paramètres G50 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2">
                          <Save className="w-4 h-4" /> Enregistrer la configuration
                      </button>
                  </div>
              </div>
          )}

          {/* G1 CONFIGURATION */}
          {selectedDeclConfig === 'G1' && (
             <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                 <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-purple-50 rounded-xl text-purple-700 border border-purple-100"><User className="w-8 h-8" /></div><div><h3 className="text-lg font-black text-slate-900 uppercase">Configuration G1 (Annuelle)</h3><p className="text-xs text-slate-500">Barème progressif IRG et abattements.</p></div></div>
                 <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                     <button onClick={() => setG1ParamsTab('BAREME')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g1ParamsTab === 'BAREME' ? 'bg-white shadow' : 'text-slate-500'}`}>Barème IRG</button>
                     <button onClick={() => setG1ParamsTab('ABATTEMENTS')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g1ParamsTab === 'ABATTEMENTS' ? 'bg-white shadow' : 'text-slate-500'}`}>Abattements</button>
                 </div>
                 {g1ParamsTab === 'BAREME' && (
                     <table className="w-full text-sm animate-in fade-in"><thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="px-4 py-2">Min</th><th className="px-4 py-2">Max</th><th className="px-4 py-2">Taux</th></tr></thead><tbody>{g1Config.irgScale.map((row, i) => (<tr key={i}><td className="p-2"><input value={row.min} onChange={e => updateG1Irg(i, 'min', e.target.value)} className="w-full border rounded px-2 h-8" /></td><td className="p-2"><input value={row.max} onChange={e => updateG1Irg(i, 'max', e.target.value)} className="w-full border rounded px-2 h-8" /></td><td className="p-2 text-center"><input value={row.rate} onChange={e => updateG1Irg(i, 'rate', e.target.value)} className="w-16 border rounded px-2 h-8 text-center" /></td></tr>))}</tbody></table>
                 )}
                 {g1ParamsTab === 'ABATTEMENTS' && (
                     <div className="space-y-2 animate-in fade-in">{g1Config.abatements.map(a => (<div key={a.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{a.label}</span><div className="flex items-center gap-2"><input type="number" value={a.value} onChange={e => updateG1Abatement(a.id, e.target.value)} className="w-20 h-9 px-2 text-center font-black rounded border" /><span>%</span></div></div>))}</div>
                 )}
                 <div className="pt-6 border-t border-slate-100 flex justify-end"><button onClick={() => showToast('Paramètres G1 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button></div>
             </div>
          )}

          {/* G51 CONFIGURATION */}
          {selectedDeclConfig === 'G51' && (
             <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                 <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-orange-50 rounded-xl text-orange-700 border border-orange-100"><Home className="w-8 h-8" /></div><div><h3 className="text-lg font-black text-slate-900 uppercase">Configuration G51 (Foncier)</h3><p className="text-xs text-slate-500">Taux IRG Foncier et seuils.</p></div></div>
                 <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                     <button onClick={() => setG51ParamsTab('TAUX')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g51ParamsTab === 'TAUX' ? 'bg-white shadow' : 'text-slate-500'}`}>Taux</button>
                     <button onClick={() => setG51ParamsTab('SEUILS')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g51ParamsTab === 'SEUILS' ? 'bg-white shadow' : 'text-slate-500'}`}>Seuils</button>
                 </div>
                 {g51ParamsTab === 'TAUX' && (
                     <div className="space-y-2 animate-in fade-in">{g51Config.rates.map(r => (<div key={r.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{r.label}</span><div className="flex items-center gap-2"><input type="number" value={r.value} onChange={e => updateG51Rate(r.id, e.target.value)} className="w-20 h-9 px-2 text-center font-black rounded border" /><span>%</span></div></div>))}</div>
                 )}
                 {g51ParamsTab === 'SEUILS' && (
                     <div className="space-y-2 animate-in fade-in">{g51Config.thresholds.map(t => (<div key={t.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{t.label}</span><div className="flex items-center gap-2"><input type="number" value={t.value} onChange={e => updateG51Threshold(t.id, e.target.value)} className="w-32 h-9 px-2 text-right font-black rounded border" /><span>DA</span></div></div>))}</div>
                 )}
                 <div className="pt-6 border-t border-slate-100 flex justify-end"><button onClick={() => showToast('Paramètres G51 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button></div>
             </div>
          )}

          {/* G11 CONFIGURATION */}
          {selectedDeclConfig === 'G11' && (
             <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                 <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-indigo-50 rounded-xl text-indigo-700 border border-indigo-100"><Building2 className="w-8 h-8" /></div><div><h3 className="text-lg font-black text-slate-900 uppercase">Configuration G11 (BIC)</h3><p className="text-xs text-slate-500">Paramètres pour la liasse fiscale BIC.</p></div></div>
                 <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                     <button onClick={() => setG11ParamsTab('GENERAL')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g11ParamsTab === 'GENERAL' ? 'bg-white shadow' : 'text-slate-500'}`}>Général</button>
                     <button onClick={() => setG11ParamsTab('TLS')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g11ParamsTab === 'TLS' ? 'bg-white shadow' : 'text-slate-500'}`}>TLS (TAP)</button>
                 </div>
                 {g11ParamsTab === 'GENERAL' && (
                     <div className="space-y-2 animate-in fade-in">{g11Config.general.map(g => (<div key={g.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{g.label}</span><div className="flex items-center gap-2"><input type="number" value={g.value} onChange={e => updateG11General(g.id, e.target.value)} className="w-24 h-9 px-2 text-right font-black rounded border" /><span>{g.unit}</span></div></div>))}</div>
                 )}
                 {g11ParamsTab === 'TLS' && (
                     <div className="space-y-2 animate-in fade-in">{g11Config.tlsRates.map(r => (<div key={r.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{r.label}</span><div className="flex items-center gap-2"><input type="number" value={r.value} onChange={e => updateG11Tls(r.id, e.target.value)} className="w-20 h-9 px-2 text-center font-black rounded border" /><span>%</span></div></div>))}</div>
                 )}
                 <div className="pt-6 border-t border-slate-100 flex justify-end"><button onClick={() => showToast('Paramètres G11 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button></div>
             </div>
          )}

          {/* G13 CONFIGURATION */}
          {selectedDeclConfig === 'G13' && (
             <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                 <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-teal-50 rounded-xl text-teal-700 border border-teal-100"><Briefcase className="w-8 h-8" /></div><div><h3 className="text-lg font-black text-slate-900 uppercase">Configuration G13 (BNC)</h3><p className="text-xs text-slate-500">Paramètres pour la liasse fiscale BNC.</p></div></div>
                 <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                     <button onClick={() => setG13ParamsTab('GENERAL')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g13ParamsTab === 'GENERAL' ? 'bg-white shadow' : 'text-slate-500'}`}>Général</button>
                     <button onClick={() => setG13ParamsTab('PLAFONDS')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${g13ParamsTab === 'PLAFONDS' ? 'bg-white shadow' : 'text-slate-500'}`}>Plafonds</button>
                 </div>
                 {g13ParamsTab === 'GENERAL' && (
                     <div className="space-y-2 animate-in fade-in">{g13Config.general.map(g => (<div key={g.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{g.label}</span><div className="flex items-center gap-2"><input type="number" value={g.value} onChange={e => updateG13General(g.id, e.target.value)} className="w-24 h-9 px-2 text-right font-black rounded border" /><span>{g.unit}</span></div></div>))}</div>
                 )}
                 {g13ParamsTab === 'PLAFONDS' && (
                     <div className="space-y-2 animate-in fade-in">{g13Config.deductions.map(d => (<div key={d.id} className="flex justify-between items-center p-3 border rounded-xl"><span className="text-sm font-bold">{d.label}</span><div className="flex items-center gap-2"><input type="number" value={d.value} onChange={e => updateG13Deduction(d.id, e.target.value)} className="w-32 h-9 px-2 text-right font-black rounded border" /><span>{d.unit}</span></div></div>))}</div>
                 )}
                 <div className="pt-6 border-t border-slate-100 flex justify-end"><button onClick={() => showToast('Paramètres G13 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button></div>
             </div>
          )}

          {/* G17 CONFIGURATION (NOUVEAU) */}
          {selectedDeclConfig === 'G17' && (
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-50 rounded-xl text-orange-700 border border-orange-100">
                          <Home className="w-8 h-8" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase">Configuration G17 (Plus-Values)</h3>
                          <p className="text-xs text-slate-500">Paramètres pour les séries G17 (Immobilier), G17 Bis (Actions) et G17 Ter (IBS).</p>
                      </div>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                      {[
                          { id: 'IMMOBILIER', label: 'Immobilier (G17)', icon: Building },
                          { id: 'MOBILIER', label: 'Mobilier (G17 Bis)', icon: Coins },
                          { id: 'IBS', label: 'Cession IBS (G17 Ter)', icon: Briefcase },
                      ].map(tab => (
                          <button
                              key={tab.id}
                              onClick={() => setG17ParamsTab(tab.id as any)}
                              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${g17ParamsTab === tab.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <tab.icon className="w-4 h-4" /> {tab.label}
                          </button>
                      ))}
                  </div>

                  {g17ParamsTab === 'IMMOBILIER' && (
                      <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                          <h4 className="text-sm font-black text-slate-600 uppercase mb-4 flex items-center gap-2"><Building className="w-4 h-4" /> Règles Cession Immobilière</h4>
                          <div className="space-y-2">
                              {g17Config.immobilier.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                          <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="number" 
                                              value={item.value} 
                                              onChange={e => updateG17Immo(item.id, e.target.value)}
                                              className="w-20 h-10 px-3 bg-white border border-slate-200 rounded-lg text-center font-black text-sm"
                                          />
                                          <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-800 font-medium">
                              <Info className="w-4 h-4 inline mr-2" />
                              L'abattement pour durée de détention s'applique à partir de la 3ème année (5% par an) jusqu'à un maximum de 50%.
                          </div>
                      </div>
                  )}

                  {g17ParamsTab === 'MOBILIER' && (
                      <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                          <h4 className="text-sm font-black text-slate-600 uppercase mb-4 flex items-center gap-2"><Coins className="w-4 h-4" /> Taux Cession Valeurs Mobilières</h4>
                          <div className="space-y-2">
                              {g17Config.mobilier.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${item.value < 10 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                              {item.value}%
                                          </div>
                                          <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="number" 
                                              value={item.value} 
                                              onChange={e => updateG17Mob(item.id, e.target.value)}
                                              className="w-20 h-10 px-3 bg-white border border-slate-200 rounded-lg text-center font-black text-sm"
                                          />
                                          <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {g17ParamsTab === 'IBS' && (
                      <div className="animate-in fade-in slide-in-from-right-4 max-w-3xl">
                          <h4 className="text-sm font-black text-slate-600 uppercase mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Retenue à la source IBS (Non-Résidents)</h4>
                          <div className="space-y-2">
                              {g17Config.ibs.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-indigo-100 text-indigo-600">
                                              {item.value}%
                                          </div>
                                          <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="number" 
                                              value={item.value} 
                                              onChange={e => updateG17Ibs(item.id, e.target.value)}
                                              className="w-20 h-10 px-3 bg-white border border-slate-200 rounded-lg text-center font-black text-sm"
                                          />
                                          <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                                      </div>
                                  </div>
                              ))}
                              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-medium">
                                  <Info className="w-4 h-4 inline mr-2" />
                                  Ce taux libératoire s'applique aux plus-values de cession réalisées par des sociétés n'ayant pas d'installation professionnelle permanente en Algérie.
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button onClick={() => showToast('Paramètres G17 sauvegardés')} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 flex items-center gap-2">
                          <Save className="w-4 h-4" /> Enregistrer la configuration
                      </button>
                  </div>
              </div>
          )}
      </div>
  );

  const renderStudio = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase">Studio Dossier</h2>
          <p className="text-slate-500 text-sm">Personnalisez les champs du dossier contribuable.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           {(['PHYSIQUE', 'MORALE', 'AGRICOLE'] as const).map(type => (
              <button key={type} onClick={() => setStudioTab(type)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${studioTab === type ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>
                 {type}
              </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Add New Card */}
         <button onClick={() => { setCurrentField({ id: '', label: '', nature: 'alphanumeric', maxLength: 50, inputType: 'free', required: false, section: 'IDENTIFICATION', targetTypes: [studioTab] }); setFieldModalOpen(true); }} className="border-2 border-dashed border-slate-300 rounded-[32px] flex flex-col items-center justify-center p-8 gap-4 text-slate-400 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all"><Plus className="w-6 h-6" /></div>
            <span className="text-xs font-black uppercase tracking-widest">Ajouter un champ</span>
         </button>

         {configFields.filter(f => !f.targetTypes || f.targetTypes.includes(studioTab)).map(field => (
            <div key={field.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${field.required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                     {field.required ? <ShieldAlert className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setCurrentField(field); setFieldModalOpen(true); }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                     <button onClick={() => setConfigFields(prev => prev.filter(f => f.id !== field.id))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               <h4 className="text-sm font-black text-slate-900 mb-1">{field.label}</h4>
               <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase">{field.nature}</span>
                  <span className="px-2 py-1 bg-slate-50 rounded text-[10px] font-bold text-slate-500 uppercase">{field.section}</span>
               </div>
            </div>
         ))}
      </div>
    </div>
  );

  const renderCalculEngine = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <h2 className="text-3xl font-black text-slate-900 uppercase">Moteur de Calcul</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
             <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Cpu className="w-6 h-6 text-primary" /> Seuils & Taux Globaux</h3>
             <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Seuil IFU (DA)</label><input type="number" value={ifuThreshold} onChange={e => setIfuThreshold(Number(e.target.value))} className="w-full h-12 px-4 border rounded-xl font-bold" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Minimum Fiscal (DA)</label><input type="number" value={minFiscal} onChange={e => setMinFiscal(Number(e.target.value))} className="w-full h-12 px-4 border rounded-xl font-bold" /></div>
             </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
             <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Percent className="w-6 h-6 text-orange-500" /> Taux IFU</h3>
             <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Taux Vente (%)</label><input type="number" value={rateVente} onChange={e => setRateVente(Number(e.target.value))} className="w-full h-12 px-4 border rounded-xl font-bold" /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Taux Prestation (%)</label><input type="number" value={rateService} onChange={e => setRateService(Number(e.target.value))} className="w-full h-12 px-4 border rounded-xl font-bold" /></div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderHierarchy = () => (
     <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-black text-slate-900 uppercase">Territoire DGI</h2>
           <button onClick={openCpiModal} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Nouveau CPI</button>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
           {Object.entries(hierarchy).map(([driName, wilayasMap]) => (
              <div key={driName} className="border-b border-slate-100 last:border-0">
                 <div className="p-4 bg-slate-50 flex items-center gap-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleNode(driName)}>
                    {expandedNodes.includes(driName) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <h3 className="text-sm font-black text-slate-800 uppercase">DRI {driName}</h3>
                 </div>
                 {expandedNodes.includes(driName) && (
                    <div className="p-4 space-y-4">
                       {Object.entries(wilayasMap).map(([wCode, wData]) => (
                          <div key={wCode} className="ml-4 border-l-2 border-slate-200 pl-4">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold bg-white border px-2 py-0.5 rounded text-slate-600">{wCode}</span>
                                <h4 className="text-sm font-bold text-slate-700">{wData.name}</h4>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wData.cpis.map(cpi => (
                                   <div key={cpi.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary/50 transition-all group">
                                      <div className="flex justify-between items-start mb-2">
                                         <span className="text-xs font-black text-primary uppercase">{cpi.cpi}</span>
                                         <button className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                      <p className="text-[10px] text-slate-500 mb-2">{cpi.recette}</p>
                                      <div className="flex flex-wrap gap-1">
                                         {cpi.communes.map(c => <span key={c} className="px-1.5 py-0.5 bg-slate-50 text-[9px] rounded text-slate-600 border border-slate-100">{c}</span>)}
                                         <button onClick={() => openCommuneModal(cpi.id)} className="px-1.5 py-0.5 bg-primary/10 text-[9px] rounded text-primary hover:bg-primary/20"><Plus className="w-3 h-3" /></button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           ))}
        </div>
     </div>
  );

  const renderNaaConfig = () => (
     <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-black text-slate-900 uppercase">Référentiel NAA</h2>
           <button onClick={() => { setNaaForm({ code: '', label: '', section: 'A', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '9%', exoneration: 'Aucune' }); setActiveModal('naa_activity'); }} className="bg-primary text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter Code</button>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-100"><input type="text" placeholder="Rechercher..." value={naaSubSearch} onChange={e => setNaaSubSearch(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold px-4 py-3" /></div>
           <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-xs font-black text-slate-500 uppercase sticky top-0"><tr><th className="px-6 py-4">Code</th><th className="px-6 py-4">Libellé</th><th className="px-6 py-4">Catégorie</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                    {naaData.filter(n => n.code.includes(naaSubSearch) || n.label.toLowerCase().includes(naaSubSearch.toLowerCase())).slice(0, 50).map(n => (
                       <tr key={n.code} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono font-bold text-slate-600">{n.code}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{n.label}</td>
                          <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase text-slate-500">{n.category}</span></td>
                          <td className="px-6 py-4 text-right"><button onClick={() => deleteNaa(n.code)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
     </div>
  );

  const renderExclusions = () => (
     <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-black text-slate-900 uppercase">Règles d'Exclusion</h2>
           <button onClick={openExclusionModal} className="bg-red-500 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-red-600 flex items-center gap-2"><Ban className="w-4 h-4" /> Nouvelle Règle</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {exclusionRules.map(rule => (
              <div key={rule.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative group">
                 <button onClick={() => handleDeleteExclusion(rule.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                 <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${rule.type === 'CODE' ? 'bg-blue-50 text-blue-600' : rule.type === 'SECTION' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>{rule.type}</span>
                    <span className="text-lg font-black text-slate-900">{rule.value}</span>
                 </div>
                 <p className="text-sm font-medium text-slate-600 mb-2">{rule.reason}</p>
                 <div className="flex items-center justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase">
                    <span>{rule.ref}</span>
                    <span className="text-red-500">{rule.regime}</span>
                 </div>
              </div>
           ))}
        </div>
     </div>
  );

  const renderCalendarConfig = () => (
     <div className="space-y-8 animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-slate-900 uppercase">Moteur Calendrier</h2>
        <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
           <div className="flex gap-4 mb-6 border-b border-slate-100 pb-4">
              <button onClick={() => setCalSubTab('RULES')} className={`text-sm font-bold ${calSubTab === 'RULES' ? 'text-primary' : 'text-slate-400'}`}>Règles Fiscales</button>
              <button onClick={() => setCalSubTab('HOLIDAYS')} className={`text-sm font-bold ${calSubTab === 'HOLIDAYS' ? 'text-primary' : 'text-slate-400'}`}>Jours Fériés</button>
           </div>
           {calSubTab === 'RULES' && (
              <div className="space-y-4">
                 <button onClick={() => { setEditingRule(null); setNewRule({ id: '', title: '', categoryId: 'FISCAL', frequency: 'MENSUEL', dayDeadline: 20, description: '' }); setShowRuleModal(true); }} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-primary hover:text-primary transition-all">+ Ajouter une règle</button>
                 {calendarConfig.rules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <div><h4 className="text-sm font-bold text-slate-900">{rule.title}</h4><p className="text-xs text-slate-500">{rule.description} • {rule.frequency} • J-{rule.dayDeadline}</p></div>
                       <button onClick={() => setCalendarConfig(prev => ({...prev, rules: prev.rules.filter(r => r.id !== rule.id)}))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 ))}
              </div>
           )}
           {calSubTab === 'HOLIDAYS' && (
              <div className="space-y-4">
                 <div className="flex gap-2">
                    <input type="text" placeholder="MM-DD (ex: 01-01)" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="w-32 px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                    <input type="text" placeholder="Libellé" value={newHoliday.label} onChange={e => setNewHoliday({...newHoliday, label: e.target.value})} className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                    <button onClick={() => { if(newHoliday.date && newHoliday.label) { setCalendarConfig(prev => ({...prev, holidays: [...prev.holidays, {id: `h_${Date.now()}`, ...newHoliday}]})); setNewHoliday({date:'', label:''}); } }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Ajouter</button>
                 </div>
                 {calendarConfig.holidays.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                       <span className="text-sm font-bold text-slate-700"><span className="text-slate-400 mr-2">{h.date}</span> {h.label}</span>
                       <button onClick={() => setCalendarConfig(prev => ({...prev, holidays: prev.holidays.filter(x => x.id !== h.id)}))} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                 ))}
              </div>
           )}
        </div>
     </div>
  );

  const renderFormConfig = () => (
     <div className="space-y-8 animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-slate-900 uppercase">Affectation Formulaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {regimeConfig.map(regime => (
              <div key={regime.id} className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm flex flex-col h-full">
                 <div className={`h-2 w-12 rounded-full mb-4 ${regime.color.replace('bg-', 'bg-')}`}></div> {/* Fix color class usage if needed */}
                 <h3 className="text-lg font-black text-slate-900 mb-1">{regime.label}</h3>
                 <p className="text-xs text-slate-500 mb-6 font-medium">Configuration des formulaires autorisés</p>
                 
                 <div className="space-y-2 flex-1">
                    {AVAILABLE_FORMS.map(form => {
                       const isAllowed = regime.allowedForms.includes(form.id);
                       return (
                          <label key={form.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isAllowed ? 'border-green-100 bg-green-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                             <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isAllowed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}>
                                {isAllowed && <Check className="w-3 h-3" />}
                             </div>
                             <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isAllowed} 
                                onChange={() => {
                                   const newAllowed = isAllowed 
                                      ? regime.allowedForms.filter(f => f !== form.id)
                                      : [...regime.allowedForms, form.id];
                                   setRegimeConfig(prev => prev.map(r => r.id === regime.id ? { ...r, allowedForms: newAllowed } : r));
                                }} 
                             />
                             <div>
                                <p className={`text-xs font-bold ${isAllowed ? 'text-green-900' : 'text-slate-600'}`}>{form.id}</p>
                                <p className="text-[9px] text-slate-400">{form.label}</p>
                             </div>
                          </label>
                       );
                    })}
                 </div>
              </div>
           ))}
        </div>
     </div>
  );

  const renderClassification = () => {
    // Basic logic for demonstration
    const margin = simCa - simCharges;
    const marginRate = simCa > 0 ? (margin / simCa) * 100 : 0;
    
    // Auto-detection of risks based on flags and data
    const detectedRisks = [];
    if (marginRate < 5) detectedRisks.push("Marge faible (< 5%)");
    if (riskFlags.cashPayment) detectedRisks.push("Paiement Espèces > Seuil");
    if (riskFlags.lateDeclaration) detectedRisks.push("Historique de retards");

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <h2 className="text-3xl font-black text-slate-900 uppercase">Intelligence Fiscale & Risques</h2>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Simulation Panel */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
               <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><Calculator className="w-6 h-6 text-primary" /> Simulateur de Risque</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Chiffre d'Affaires (DA)</label>
                     <input type="number" value={simCa} onChange={e => setSimCa(Number(e.target.value))} className="w-full h-12 px-4 border rounded-xl font-bold" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Charges (DA)</label>
                     <input type="number" value={simCharges} onChange={e => setSimCharges(Number(e.target.value))} className="w-full h-12 px-4 border rounded-xl font-bold" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Type Activité</label>
                     <div className="flex bg-slate-100 p-1 rounded-xl mt-1">
                        <button onClick={() => setSimType('vente')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${simType === 'vente' ? 'bg-white shadow' : 'text-slate-500'}`}>Vente</button>
                        <button onClick={() => setSimType('service')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${simType === 'service' ? 'bg-white shadow' : 'text-slate-500'}`}>Prestation</button>
                     </div>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase">Indicateurs de Risque (DGI)</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={riskFlags.cashPayment} onChange={e => setRiskFlags({...riskFlags, cashPayment: e.target.checked})} className="rounded text-red-500 focus:ring-red-500" />
                     <span className="text-sm font-medium text-slate-700">Paiements en espèces prédominants</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={riskFlags.lateDeclaration} onChange={e => setRiskFlags({...riskFlags, lateDeclaration: e.target.checked})} className="rounded text-red-500 focus:ring-red-500" />
                     <span className="text-sm font-medium text-slate-700">Dépôts tardifs récurrents</span>
                  </label>
               </div>
            </div>

            {/* Analysis Result */}
            <div className="space-y-6">
               <div className={`bg-white rounded-[32px] border p-8 shadow-sm ${detectedRisks.length > 0 ? 'border-red-200' : 'border-green-200'}`}>
                  <h3 className="text-lg font-black text-slate-900 mb-4">Diagnostic Système</h3>
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Marge Commerciale</p>
                        <p className={`text-2xl font-black ${marginRate < 10 ? 'text-red-500' : 'text-green-600'}`}>{marginRate.toFixed(1)}%</p>
                     </div>
                     <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${detectedRisks.length > 0 ? 'border-red-100 text-red-500 bg-red-50' : 'border-green-100 text-green-500 bg-green-50'}`}>
                        {detectedRisks.length > 0 ? <AlertTriangle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                     </div>
                  </div>
                  
                  {detectedRisks.length > 0 ? (
                     <div className="space-y-2">
                        <p className="text-xs font-bold text-red-700 uppercase">Points d'attention :</p>
                        {detectedRisks.map((risk, i) => (
                           <div key={i} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                              <X className="w-4 h-4" /> {risk}
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                        <Check className="w-4 h-4" /> Aucun risque majeur détecté.
                     </div>
                  )}
               </div>

               <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl">
                  <h4 className="text-sm font-black uppercase text-slate-400 mb-4">Recommandation Régime</h4>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-3xl font-black">{simCa > ifuThreshold ? 'RÉEL' : 'IFU'}</p>
                        <p className="text-xs text-slate-400 mt-1">{simCa > ifuThreshold ? 'Dépassement seuil > 8M' : 'Éligible au forfait'}</p>
                     </div>
                     <div className="p-3 bg-white/10 rounded-xl">
                        <Target className="w-8 h-8 text-primary" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const sidebarItems = [
    { id: 'studio', label: 'Studio Dossier', icon: Layout }, 
    { id: 'form_config', label: 'Affectation Formulaires', icon: ListFilter }, 
    { id: 'decl_params', label: 'Paramètres Déclarations', icon: Sliders }, 
    { id: 'classification', label: 'Intelligence Fiscale', icon: Target }, 
    { id: 'exclusions', label: 'Gestion Exclusions', icon: Ban },
    { id: 'calcul_engine', label: 'Moteur de Calcul', icon: Cpu },
    { id: 'calendar_config', label: 'Moteur Calendrier', icon: Calendar },
    { id: 'hierarchy', label: 'Territoire DGI', icon: Network }, 
    { id: 'naa_config', label: 'Référentiel NAA', icon: Database },
  ];

  return (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col lg:flex-row relative">
      
      {/* FIELD CONFIG MODAL */}
      {fieldModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden p-12 space-y-8 animate-in zoom-in-95 border border-white/20">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {currentField.id ? 'Modifier Champ' : 'Nouveau Champ'}
                 </h3>
                 <button onClick={() => setFieldModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
              </div>
              
              <div className="space-y-6">
                 {/* TARGET TYPES SELECTION */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Applicable pour</label>
                    <div className="flex flex-col gap-3">
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${currentField.targetTypes?.includes('PHYSIQUE') ? 'border-primary bg-primary/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" checked={currentField.targetTypes?.includes('PHYSIQUE')} onChange={() => toggleTargetType('PHYSIQUE')} />
                            <span className="text-xs font-bold text-slate-700 uppercase">Personne Physique</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${currentField.targetTypes?.includes('MORALE') ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={currentField.targetTypes?.includes('MORALE')} onChange={() => toggleTargetType('MORALE')} />
                            <span className="text-xs font-bold text-slate-700 uppercase">Personne Morale (Société)</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${currentField.targetTypes?.includes('AGRICOLE') ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500" checked={currentField.targetTypes?.includes('AGRICOLE')} onChange={() => toggleTargetType('AGRICOLE')} />
                            <span className="text-xs font-bold text-slate-700 uppercase">Exploitation Agricole</span>
                        </label>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Libellé du champ</label>
                    <input type="text" value={currentField.label} onChange={e => setCurrentField({...currentField, label: e.target.value})} className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:bg-white focus:border-primary transition-all" placeholder="Ex: Matricule CNAS" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type de donnée</label>
                       <select value={currentField.nature} onChange={e => setCurrentField({...currentField, nature: e.target.value as any})} className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:bg-white focus:border-primary transition-all appearance-none">
                          <option value="alphanumeric">Texte</option>
                          <option value="numeric">Numérique</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="nif">NIF</option>
                          <option value="nin">NIN</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section</label>
                       <select value={currentField.section} onChange={e => setCurrentField({...currentField, section: e.target.value as any})} className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:bg-white focus:border-primary transition-all appearance-none">
                          <option value="IDENTIFICATION">Identification</option>
                          <option value="ACTIVITE">Activité</option>
                          <option value="FISCAL">Fiscalité</option>
                          <option value="FAMILLE">Famille</option>
                          <option value="BANQUE">Banque</option>
                          <option value="CONTACT">Contact</option>
                          <option value="AUTRE">Autre</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Longueur Max.</label>
                       <input type="number" value={currentField.maxLength} onChange={e => setCurrentField({...currentField, maxLength: Number(e.target.value)})} className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:bg-white focus:border-primary transition-all" placeholder="Ex: 15" />
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-3 p-4 border-2 border-slate-100 rounded-xl cursor-pointer w-full hover:bg-slate-50 transition-all">
                           <input type="checkbox" checked={currentField.required} onChange={e => setCurrentField({...currentField, required: e.target.checked})} className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary" />
                           <span className="text-xs font-black uppercase text-slate-600">Obligatoire</span>
                        </label>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                 <button onClick={() => setFieldModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Annuler</button>
                 <button onClick={saveField} className="flex-1 py-4 bg-primary text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Enregistrer</button>
              </div>
           </div>
        </div>
      )}

      {/* ADDING MODALS FOR NAA/HIERARCHY */}
        {activeModal === 'naa_activity' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-white w-full max-w-lg rounded-[32px] p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase">Nouvelle Activité NAA</h3>
                    <div className="space-y-3">
                        <input type="text" placeholder="Code (ex: 01.11)" value={naaForm.code} onChange={e => setNaaForm({...naaForm, code: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                        <input type="text" placeholder="Libellé" value={naaForm.label} onChange={e => setNaaForm({...naaForm, label: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <select value={naaForm.type} onChange={e => setNaaForm({...naaForm, type: e.target.value as any})} className="px-4 py-3 bg-slate-50 border rounded-xl"><option value="BIC">BIC</option><option value="BNC">BNC</option></select>
                            <select value={naaForm.section} onChange={e => setNaaForm({...naaForm, section: e.target.value})} className="px-4 py-3 bg-slate-50 border rounded-xl">{naaSections.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}</select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4"><button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button><button onClick={handleSaveNaa} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Enregistrer</button></div>
                </div>
            </div>
        )}

        {activeModal === 'cpi' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-white w-full max-w-lg rounded-[32px] p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase">Nouveau CPI</h3>
                    <div className="space-y-3">
                        <select value={cpiForm.dri} onChange={e => setCpiForm({...cpiForm, dri: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl"><option value="">Sélectionner DRI</option>{uniqueDris.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        <select value={cpiForm.wilayaCode} onChange={e => setCpiForm({...cpiForm, wilayaCode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl"><option value="">Sélectionner Wilaya</option>{uniqueWilayas.map(w => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}</select>
                        <input type="text" placeholder="Nom du CPI" value={cpiForm.cpi} onChange={e => setCpiForm({...cpiForm, cpi: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                        <input type="text" placeholder="Recette" value={cpiForm.recette} onChange={e => setCpiForm({...cpiForm, recette: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="flex gap-3 pt-4"><button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button><button onClick={handleSaveCpi} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Enregistrer</button></div>
                </div>
            </div>
        )}

        {activeModal === 'commune' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase">Nouvelle Commune</h3>
                    <input type="text" placeholder="Nom de la commune" value={communeForm} onChange={e => setCommuneForm(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                    <div className="flex gap-3 pt-4"><button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button><button onClick={handleSaveCommune} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Ajouter</button></div>
                </div>
            </div>
        )}

        {activeModal === 'exclusion_rule' && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-white w-full max-w-lg rounded-[32px] p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase">Nouvelle Règle d'Exclusion</h3>
                    <div className="space-y-3">
                        <select value={exclusionForm.type} onChange={e => setExclusionForm({...exclusionForm, type: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl"><option value="CODE">Par Code Activité</option><option value="SECTION">Par Section</option><option value="KEYWORD">Par Mot-Clé</option></select>
                        <input type="text" placeholder="Valeur (ex: 56.30)" value={exclusionForm.value} onChange={e => setExclusionForm({...exclusionForm, value: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                        <input type="text" placeholder="Motif" value={exclusionForm.reason} onChange={e => setExclusionForm({...exclusionForm, reason: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                        <input type="text" placeholder="Référence Légale" value={exclusionForm.ref} onChange={e => setExclusionForm({...exclusionForm, ref: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="flex gap-3 pt-4"><button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button><button onClick={handleSaveExclusion} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Enregistrer</button></div>
                </div>
            </div>
        )}

      {/* SIDEBAR PARAMETRES */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 shrink-0 sticky top-16 h-fit lg:h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-8"><div className="w-14 h-14 bg-primary rounded-[20px] flex items-center justify-center text-white shadow-2xl"><Settings className="w-8 h-8" /></div><h1 className="text-2xl font-black text-slate-900 uppercase leading-none">Console<br/>Admin</h1></div>
        <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {sidebarItems.map((tab) => (
            <button key={tab.id} onClick={() => setActiveMainTab(tab.id as MainTab)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[28px] text-left transition-all ${activeMainTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon className="w-6 h-6" />
              <span className="text-[13px] font-black uppercase">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar">
        {activeMainTab === 'naa_config' && renderNaaConfig()}
        {activeMainTab === 'hierarchy' && renderHierarchy()}
        {activeMainTab === 'exclusions' && renderExclusions()}
        {activeMainTab === 'calendar_config' && renderCalendarConfig()}
        {activeMainTab === 'form_config' && renderFormConfig()}
        {activeMainTab === 'decl_params' && renderDeclarationParams()}
        {activeMainTab === 'studio' && renderStudio()}
        {activeMainTab === 'calcul_engine' && renderCalculEngine()}
        {activeMainTab === 'classification' && renderClassification()}
      </main>
    </div>
  );
};

export default SystemParameters;