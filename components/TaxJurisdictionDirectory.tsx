import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Building2, 
  Navigation, 
  Globe, 
  ChevronDown,
  Landmark,
  Layers,
  Info,
  MapPinned
} from 'lucide-react';
import { Jurisdiction } from '../data/jurisdictions';
import { LocFieldSetting } from '../types';

interface Props {
  locFieldSettings: LocFieldSetting[];
  officialDecreeUrl: string;
  jurisdictions: Jurisdiction[]; // Reçoit les données dynamiques de App.tsx
}

const TaxJurisdictionDirectory: React.FC<Props> = ({ locFieldSettings, officialDecreeUrl, jurisdictions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDri, setSelectedDri] = useState<string | null>(null);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);

  const getSetting = (id: string) => locFieldSettings.find(s => s.id === id);

  const driOptions = useMemo(() => Array.from(new Set(jurisdictions.map(j => j.dri))).sort(), [jurisdictions]);
  
  const wilayas = useMemo(() => {
    const list = jurisdictions
      .filter(j => !selectedDri || j.dri === selectedDri)
      .map(j => ({ code: j.wilayaCode, name: j.wilayaName }));
    
    // Explicitly typed Map to avoid 'unknown' issues in Array.from result on line 36
    const uniqueMap = new Map<string, { code: string, name: string }>(
      list.map(item => [item.code, item] as [string, { code: string, name: string }])
    );
    
    return Array.from(uniqueMap.values()).sort((a, b) => Number(a.code) - Number(b.code));
  }, [selectedDri, jurisdictions]);

  const filteredJurisdictions = useMemo(() => {
    return jurisdictions.filter(j => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = j.cpi.toLowerCase().includes(lowerQuery) || 
                          j.communes.some(c => c.toLowerCase().includes(lowerQuery)) || 
                          j.wilayaName.toLowerCase().includes(lowerQuery);
      return matchesSearch && (!selectedDri || j.dri === selectedDri) && (!selectedWilaya || j.wilayaCode === selectedWilaya);
    });
  }, [searchQuery, selectedDri, selectedWilaya, jurisdictions]);

  const formatValue = (id: string, val: string) => {
    const s = getSetting(id);
    if (!s) return val;
    return val.substring(0, s.maxLength);
  };

  const getStyle = (id: string) => {
    const s = getSetting(id);
    return s?.nature === 'numeric' ? 'font-mono tracking-tighter' : '';
  };

  return (
    <div className="p-8 md:p-12 space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest w-fit"><Landmark className="w-3 h-3" /> Direction Générale des Impôts</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-4"><Navigation className="w-10 h-10 text-primary" /> Annuaire des Juridictions</h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl">Référentiel territorial des Centres de Proximité (CPI) - État en temps réel.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Référentiel</p><p className="text-xs font-black text-slate-900 tracking-tight">Version Dynamique</p></div>
           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Layers className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10">
            <div className="lg:col-span-6 space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Search className="w-3 h-3" /> Recherche</label>
               <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input type="text" placeholder="Bab Ezzouar, Kouba, Chlef..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-16 pl-16 pr-8 bg-slate-50 border-2 border-slate-100 rounded-3xl text-lg font-bold text-slate-900 focus:bg-white focus:border-primary transition-all" />
               </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Building2 className="w-3 h-3" /> DRI</label>
               <div className="relative">
                  <select value={selectedDri || ''} onChange={(e) => setSelectedDri(e.target.value || null)} className="w-full h-16 pl-6 pr-12 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black uppercase appearance-none focus:bg-white focus:border-primary shadow-inner">
                    <option value="">Toutes les DRI</option>
                    {driOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
               </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><MapPin className="w-3 h-3" /> Wilaya</label>
               <div className="relative">
                  <select value={selectedWilaya || ''} onChange={(e) => setSelectedWilaya(e.target.value || null)} className="w-full h-16 pl-6 pr-12 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-black uppercase appearance-none focus:bg-white focus:border-primary shadow-inner">
                    <option value="">Toutes les Wilayas</option>
                    {wilayas.map(w => <option key={w.code} value={w.code}>{w.code}. {w.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredJurisdictions.length === 0 ? (
            <div className="col-span-full py-32 text-center space-y-4">
               <MapPinned className="w-16 h-16 text-slate-200 mx-auto" />
               <p className="text-slate-400 font-bold uppercase tracking-widest italic">Aucune juridiction trouvée dans le référentiel actuel</p>
            </div>
         ) : filteredJurisdictions.map((j, idx) => (
            <div key={j.id} className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:border-primary/40 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-300">
               {getSetting('dri')?.visible && (
                  <div className={`absolute top-0 right-0 bg-slate-900 text-white px-6 py-2 rounded-bl-[24px] text-[8px] font-black uppercase tracking-[0.2em] ${getStyle('dri')}`}>
                    {formatValue('dri', j.dri)}
                  </div>
               )}
               <div className="space-y-8 flex-1 pt-2">
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-[10px] font-black tracking-tighter">{j.wilayaCode}</span>
                        {getSetting('wilaya')?.visible && (
                           <p className={`text-[10px] font-black text-primary uppercase tracking-widest ${getStyle('wilaya')}`}>{formatValue('wilaya', j.wilayaName)}</p>
                        )}
                     </div>
                     {getSetting('cpi')?.visible && (
                        <h3 className={`text-2xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors ${getStyle('cpi')}`}>{formatValue('cpi', j.cpi)}</h3>
                     )}
                  </div>
                  
                  {getSetting('commune')?.visible && (
                     <div className="space-y-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Communes rattachées</p>
                        <div className="flex flex-wrap gap-2">
                           {j.communes.map((commune, cidx) => (
                              <span key={cidx} className={`px-3 py-2 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-[10px] font-bold group-hover:bg-white group-hover:border-primary/20 transition-all shadow-sm ${getStyle('commune')}`}>
                                 {formatValue('commune', commune)}
                              </span>
                           ))}
                        </div>
                     </div>
                  )}

                  <div className="pt-8 border-t border-slate-50 space-y-4 mt-auto">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recette d'Affectation</p>
                           <p className="text-sm font-black text-slate-900">{j.recette}</p>
                        </div>
                        <Landmark className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      <div className="bg-slate-900 rounded-[50px] p-12 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
         <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex items-start gap-10">
               <div className="w-24 h-24 bg-primary/20 rounded-[40px] flex items-center justify-center border border-white/10 shrink-0"><Building2 className="w-12 h-12 text-primary" /></div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tight uppercase leading-none">Référentiel des 58 Wilayas</h3>
                  <p className="text-slate-400 text-base font-medium leading-relaxed max-w-2xl">Ce module utilise les données du paramétrage système de l'administration.</p>
               </div>
            </div>
            <a 
               href={officialDecreeUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="px-12 py-5 bg-white text-slate-900 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-4 shadow-2xl group/btn"
            >
               <Globe className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-1000" /> 
               Télécharger l'Arrêté Officiel
            </a>
         </div>
      </div>
    </div>
  );
};

export default TaxJurisdictionDirectory;
