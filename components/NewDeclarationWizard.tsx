import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarDays, 
  ArrowRight,
  Users,
  Building2,
  Tractor
} from 'lucide-react';
import { Taxpayer, FiscalPeriod, RegimeConfig } from '../types';

interface Props {
  taxpayers: Taxpayer[];
  availablePeriods: FiscalPeriod[];
  onBack: () => void;
  onSelectForm: (id: string, taxpayer: Taxpayer, period?: FiscalPeriod) => void;
  regimeConfig: RegimeConfig[];
}

// Map des formulaires disponibles pour l'affichage dans le select
const FORM_OPTIONS = [
    { id: 'G1', label: 'Série G n°1 (Revenu Global)', group: 'IRG', frequency: 'ANNUAL' },
    { id: 'GN12', label: 'Série G n°12 (Prévisionnelle)', group: 'IFU', frequency: 'ANNUAL' },
    { id: 'GN12_BIS', label: 'Série G n°12 Bis (Définitive)', group: 'IFU', frequency: 'ANNUAL' },
    { id: 'G50_TER', label: 'Série G n°50 TER (IRG Salaires)', group: 'IFU', frequency: 'TRIMESTER' },
    { id: 'G50_MENSUEL', label: 'Série G n°50 (Déclaration Mensuelle)', group: 'RÉEL', frequency: 'MONTH' },
    { id: 'G13', label: 'Série G n°13 (Liasse BNC)', group: 'SIMPLIFIÉ', frequency: 'ANNUAL' },
    { id: 'G17_UNIFIED', label: 'Série G n°17 (Plus-Values Cession)', group: 'SIMPLIFIÉ / NORMAL', frequency: 'ANNUAL' },
    { id: 'G11', label: 'Série G n°11 (Liasse BIC)', group: 'NORMAL', frequency: 'ANNUAL' },
    { id: 'G15', label: 'Série G n°15 (Agricole)', group: 'NORMAL', frequency: 'ANNUAL' },
    { id: 'EXISTENCE', label: 'Série G n°08 (Existence)', group: 'AUTRES', frequency: 'ANNUAL' },
    { id: 'CESSATION', label: 'Série D n°1 Ter (Cessation)', group: 'AUTRES', frequency: 'ANNUAL' },
    { id: 'G51', label: 'Série G n°51 (Foncier)', group: 'AUTRES', frequency: 'ANNUAL' },
    { id: 'G29', label: 'Série G n°29 (Salaires Annuel)', group: 'AUTRES', frequency: 'ANNUAL' },
    { id: 'SUBSCRIPTION', label: 'Souscription Jibayatic', group: 'AUTRES', frequency: 'ANNUAL' },
];

export const NewDeclarationWizard: React.FC<Props> = ({ taxpayers, availablePeriods, onBack, onSelectForm, regimeConfig }) => {
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState('');
  const [currentRegimeConfig, setCurrentRegimeConfig] = useState<RegimeConfig | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  
  // NOUVEAU : État pour le filtre par type
  const [taxpayerTypeFilter, setTaxpayerTypeFilter] = useState<'ALL' | 'PHYSIQUE' | 'MORALE' | 'AGRICOLE'>('ALL');

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const [autoSelectionReason, setAutoSelectionReason] = useState<string | null>(null);

  // Filtrage des contribuables pour la liste déroulante
  const filteredTaxpayers = useMemo(() => {
    if (taxpayerTypeFilter === 'ALL') return taxpayers;
    return taxpayers.filter(t => t.typeContribuable === taxpayerTypeFilter);
  }, [taxpayers, taxpayerTypeFilter]);

  const selectedTaxpayer = useMemo(() => 
    taxpayers.find(t => t.id === selectedTaxpayerId), 
  [selectedTaxpayerId, taxpayers]);

  const selectedFormDef = useMemo(() => 
    FORM_OPTIONS.find(f => f.id === selectedFormId), 
  [selectedFormId]);

  const periodContext = useMemo(() => {
    if (!selectedFormDef) return { years: [], periods: [], label: '...' };

    const years = Array.from(new Set(availablePeriods.map(p => p.year))).sort((a: number, b: number) => b - a);

    const relevantPeriods = availablePeriods.filter(p => {
        const matchYear = p.year === selectedYear;
        let targetType = selectedFormDef.frequency;
        return matchYear && p.type === targetType;
    }).sort((a: FiscalPeriod, b: FiscalPeriod) => a.index - b.index);

    let frequencyLabel = '';
    switch (selectedFormDef.frequency) {
        case 'MONTH': frequencyLabel = 'Sélection du Mois'; break;
        case 'TRIMESTER': frequencyLabel = 'Sélection du Trimestre'; break;
        case 'ANNUAL': frequencyLabel = 'Exercice Complet'; break;
        default: frequencyLabel = 'Sélection Période';
    }

    return { years, periods: relevantPeriods, label: frequencyLabel };
  }, [availablePeriods, selectedYear, selectedFormDef]);

  // Récupérer l'objet période complet
  const selectedPeriod = useMemo(() => 
    availablePeriods.find(p => p.id === selectedPeriodId),
  [selectedPeriodId, availablePeriods]);

  useEffect(() => {
    if (selectedTaxpayer) {
      const config = regimeConfig.find(r => r.id === selectedTaxpayer.regimeSelectionne);
      setCurrentRegimeConfig(config || null);
      
      const empCount = selectedTaxpayer.employeeCount || 0;
      setAutoSelectionReason(null);

      if (config) {
          if (config.employeeThresholdRule && config.employeeThresholdRule.active) {
              const rule = config.employeeThresholdRule;
              if (empCount > rule.threshold) {
                  setSelectedFormId(rule.aboveFormId);
                  setAutoSelectionReason(`Formulaire mensuel imposé (Effectif > ${rule.threshold})`);
              } else {
                  setSelectedFormId(rule.belowFormId);
                  setAutoSelectionReason(`Formulaire par défaut (Effectif ≤ ${rule.threshold})`);
              }
          } 
          else {
              if (config.id === 'IFU' && empCount === 0) setSelectedFormId('GN12');
              else if (config.id === 'NORMAL') setSelectedFormId('G50_MENSUEL');
              else if (config.id === 'SIMPLIFI') setSelectedFormId('G50_MENSUEL'); 
              else setSelectedFormId('');
          }
      } else {
          setSelectedFormId('');
      }

    } else {
      setCurrentRegimeConfig(null);
      setSelectedFormId('');
      setAutoSelectionReason(null);
    }
  }, [selectedTaxpayer, regimeConfig]);

  useEffect(() => {
     setSelectedPeriodId('');
  }, [selectedFormId]);

  const steps = [
    { num: 1, label: 'Contribuable', active: true },
    { num: 2, label: 'Régime & Formulaire', active: !!selectedTaxpayerId },
    { num: 3, label: 'Période', active: !!selectedFormId },
    { num: 4, label: 'Validation', active: false },
  ];

  const isFormAllowed = (formId: string) => {
      // Les formulaires de plus-values et fonciers sont accessibles à tous
      if (['G1', 'G15', 'G51', 'G17_UNIFIED', 'EXISTENCE', 'CESSATION', 'SUBSCRIPTION'].includes(formId)) return true;
      
      if (!currentRegimeConfig) return false;
      return currentRegimeConfig.allowedForms.includes(formId);
  };

  return (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col p-8 md:p-12">
      <div className="max-w-6xl mx-auto w-full space-y-10">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Établir une Déclaration</h1>
          <button onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Annuler</button>
        </div>

        <div className="flex items-center gap-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${s.active ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-200 text-slate-300'}`}>
                  {s.num}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${s.active ? 'text-slate-900' : 'text-slate-300'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-px w-12 ${steps[i+1].active ? 'bg-primary' : 'bg-slate-200'}`}></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            
            {/* ETAPE 1: SELECTION DOSSIER */}
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-8 transition-all">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <User className="w-8 h-8 text-primary" /> 1. Sélection du Dossier
                </h2>
                {selectedTaxpayer && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sélectionné</span>}
              </div>

              {/* NOUVEAU : FILTRE PAR TYPE (ONGLETS) */}
              <div className="flex justify-center">
                  <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                      {[
                          { id: 'ALL', label: 'Tous', icon: Users },
                          { id: 'PHYSIQUE', label: 'Particuliers', icon: User },
                          { id: 'MORALE', label: 'Sociétés', icon: Building2 },
                          { id: 'AGRICOLE', label: 'Agricole', icon: Tractor },
                      ].map(type => (
                          <button 
                              key={type.id}
                              onClick={() => { setTaxpayerTypeFilter(type.id as any); setSelectedTaxpayerId(''); }}
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center ${taxpayerTypeFilter === type.id ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                          >
                              <type.icon className={`w-4 h-4 ${taxpayerTypeFilter === type.id ? 'text-primary' : 'text-slate-400'}`} />
                              {type.label}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <select 
                  value={selectedTaxpayerId}
                  onChange={(e) => setSelectedTaxpayerId(e.target.value)}
                  className="w-full h-16 pl-14 pr-12 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-base font-bold text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">
                      {taxpayerTypeFilter === 'ALL' ? 'Choisir un contribuable...' : 
                       taxpayerTypeFilter === 'MORALE' ? 'Choisir une société...' : 
                       taxpayerTypeFilter === 'AGRICOLE' ? 'Choisir une exploitation...' : 'Choisir une personne physique...'}
                  </option>
                  {filteredTaxpayers.map(t => (
                    <option key={t.id} value={t.id}>{t.dynamicData['1']} — NIF: {t.dynamicData['2']}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center gap-0.5">
                   <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{filteredTaxpayers.length}</span>
                </div>
              </div>
            </div>

            {/* ETAPE 2 & 3 */}
            {selectedTaxpayer && (
              <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-10 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-primary" /> 2. Régime & Formulaires
                  </h2>
                  {currentRegimeConfig && (
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${currentRegimeConfig.color.replace('bg-', 'text-').replace('500', '600')} bg-opacity-10 border border-current`}>
                          {currentRegimeConfig.label}
                      </span>
                  )}
                </div>

                <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Choix du Formulaire</label>
                  <div className="relative group">
                    <select 
                      value={selectedFormId}
                      onChange={(e) => setSelectedFormId(e.target.value)}
                      className="w-full h-18 px-8 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-lg font-black text-slate-800 focus:bg-white focus:border-primary transition-all appearance-none"
                    >
                      <option value="" disabled>Sélectionnez un formulaire...</option>
                      {FORM_OPTIONS.filter(f => isFormAllowed(f.id)).map(form => (
                          <option key={form.id} value={form.id}>{form.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 pointer-events-none group-focus-within:text-primary" />
                  </div>
                  
                  {autoSelectionReason && selectedFormId && (
                      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl text-primary text-xs font-bold animate-in fade-in">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          <span>{autoSelectionReason}</span>
                      </div>
                  )}
                </div>

                {/* ETAPE 3 : PÉRIODE INTELLIGENTE */}
                {selectedFormDef && (
                  <div className="space-y-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                     <div className="flex flex-wrap justify-between items-end gap-4">
                        <div>
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                              3. {periodContext.label}
                           </label>
                           <p className="text-xs text-slate-500 font-medium mt-1">Sélectionnez d'abord l'exercice.</p>
                        </div>
                        
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           {periodContext.years.map(year => (
                              <button
                                 key={year}
                                 onClick={() => setSelectedYear(year)}
                                 className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${selectedYear === year ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                 {year}
                              </button>
                           ))}
                        </div>
                     </div>
                     
                     {periodContext.periods.length > 0 ? (
                        <div className={`grid gap-4 ${selectedFormDef.frequency === 'MONTH' ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                           {periodContext.periods.map(p => {
                              const isSelected = selectedPeriodId === p.id;
                              const isLocked = p.status === 'LOCKED';
                              
                              return (
                                <button
                                   key={p.id}
                                   onClick={() => !isLocked && setSelectedPeriodId(p.id)}
                                   disabled={isLocked}
                                   className={`p-4 rounded-2xl border-2 transition-all text-left group relative ${
                                      isSelected 
                                         ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/10' 
                                         : isLocked
                                            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                                            : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                                   }`}
                                >
                                   <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-black uppercase text-slate-400">{p.year}</span>
                                      {isSelected && <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                                   </div>
                                   <span className={`block text-sm font-bold uppercase ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{p.label}</span>
                                   
                                   {p.status === 'WARNING' && <div className="absolute bottom-2 right-2 text-orange-500"><AlertTriangle className="w-4 h-4" /></div>}
                                </button>
                              );
                           })}
                        </div>
                     ) : (
                        <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-xs italic flex flex-col items-center gap-3">
                           <CalendarDays className="w-8 h-8 text-slate-300" />
                           <p>Aucune période {selectedFormDef.frequency === 'ANNUAL' ? 'annuelle' : selectedFormDef.frequency === 'TRIMESTER' ? 'trimestrielle' : 'mensuelle'} ouverte pour l'exercice {selectedYear}.</p>
                           <button className="text-primary font-bold hover:underline">Gérer les périodes</button>
                        </div>
                     )}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* RÉSUMÉ FLOTTANT */}
          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4"><FileText className="w-6 h-6 text-primary" /> Résumé Décla</h3>
              <div className="space-y-8 relative z-10">
                <div className="space-y-1.5"><p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Contribuable</p><p className="text-sm font-bold uppercase truncate">{selectedTaxpayer?.dynamicData['1'] || 'En attente...'}</p></div>
                <div className="space-y-1.5"><p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Formulaire</p><p className="text-sm font-bold text-primary uppercase">{selectedFormDef?.label || '...'}</p></div>
                <div className="space-y-1.5"><p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Période</p><p className="text-sm font-bold text-green-400 uppercase">{selectedPeriod?.label || '...'}</p></div>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => selectedTaxpayer && selectedPeriodId && onSelectForm(selectedFormId, selectedTaxpayer, selectedPeriod)}
                  disabled={!selectedFormId || !selectedPeriodId}
                  className={`w-full py-6 rounded-[28px] text-[13px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-2xl ${selectedFormId && selectedPeriodId ? 'bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                >
                  Continuer <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
};