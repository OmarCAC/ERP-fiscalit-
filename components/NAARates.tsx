
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Database, 
  Building2, 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Filter, 
  X, 
  LayoutGrid, 
  List, 
  AlertCircle, 
  TrendingUp, 
  ShieldAlert, 
  Star, 
  FileText, 
  ArrowUpRight, 
  Activity, 
  Ban,
  Scale
} from 'lucide-react';
import { NAAActivity, detectExclusion } from '../data/naa_data';
import { ExclusionRule } from '../types';

interface NAARatesProps {
  naaData: NAAActivity[];
  naaSections: any[];
  exclusionRules: ExclusionRule[];
}

const NAARates: React.FC<NAARatesProps> = ({ naaData, naaSections, exclusionRules }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedRegime, setSelectedRegime] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<NAAActivity | null>(null);

  const filteredData = useMemo(() => {
    return naaData.filter(item => {
      // CONNEXION DYNAMIQUE : Vérification en temps réel contre les règles d'exclusion
      const exclusion = detectExclusion(item.code, item.label, exclusionRules);
      
      const matchesSearch = 
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSection = selectedSection === 'ALL' || item.section === selectedSection;
      
      const matchesRegime = selectedRegime === 'ALL' || 
        (selectedRegime === 'IFU' && !exclusion.isExcluded) || 
        (selectedRegime === 'REEL' && exclusion.isExcluded);
      
      return matchesSearch && matchesSection && matchesRegime;
    });
  }, [searchQuery, selectedSection, selectedRegime, naaData, exclusionRules]);

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-32">
      
      {/* Hero Header avec Stats Connectées */}
      <div className="bg-[#1e293b] text-white pt-20 pb-32 px-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
           </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 text-primary-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/30 shadow-lg">
             <Database className="w-3.5 h-3.5" /> Référentiel National Rev1 (LF 2025)
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-none uppercase">
                Annuaire <span className="text-primary-400">NAA</span>
              </h1>
              <p className="text-slate-400 text-xl font-medium max-w-xl leading-relaxed">
                Accédez à l'intégralité des <span className="text-white font-bold">{naaData.length} codes d'activité</span>. 
                Synchronisé en temps réel avec vos règles d'exclusion personnalisées.
              </p>
            </div>
            <div className="flex gap-6">
               <div className="flex-1 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Activités IFU</p>
                  <p className="text-3xl font-black text-white">{naaData.filter(a => !detectExclusion(a.code, a.label, exclusionRules).isExcluded).length}</p>
               </div>
               <div className="flex-1 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 rounded-full blur-xl"></div>
                  <p className="text-[10px] font-black text-red-300 uppercase tracking-widest mb-1">Exclues (Réel)</p>
                  <p className="text-3xl font-black text-red-400">{naaData.filter(a => detectExclusion(a.code, a.label, exclusionRules).isExcluded).length}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar flottante */}
      <div className="max-w-[1500px] mx-auto w-full px-10 -mt-16 space-y-8 relative z-20">
        <div className="bg-white rounded-[48px] border border-slate-200 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
           <div className="lg:col-span-5 relative group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher par code, mot-clé ou secteur..." 
                className="w-full h-20 pl-20 pr-10 bg-slate-50 border-none rounded-[32px] text-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
           </div>
           <div className="lg:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Filtrer par Section</label>
              <div className="relative group">
                <select 
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full h-16 pl-6 pr-12 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 shadow-inner"
                >
                  <option value="ALL">Toutes les sections (A-U)</option>
                  {naaSections.map(s => <option key={s.id} value={s.id}>{s.id} - {s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              </div>
           </div>
           <div className="lg:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Régime Fiscal</label>
              <div className="relative">
                <select 
                  value={selectedRegime}
                  onChange={(e) => setSelectedRegime(e.target.value)}
                  className="w-full h-16 pl-6 pr-12 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase appearance-none cursor-pointer shadow-inner"
                >
                  <option value="ALL">Tous les Régimes</option>
                  <option value="IFU">Éligibles IFU</option>
                  <option value="REEL">Exclus (Réel Oblig.)</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              </div>
           </div>
           <div className="lg:col-span-2 flex gap-2 h-16 p-1.5 bg-slate-100 rounded-2xl">
              <button onClick={() => setViewMode('grid')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-md font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
                 <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-md font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
                 <List className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* NAVIGATION PAR TUILLES ILLUSTRÉES */}
        {selectedSection === 'ALL' && !searchQuery && viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
             {naaSections.map(section => (
                <button 
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className="group relative h-56 rounded-[40px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                >
                   <img src={section.img} alt={section.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 grayscale group-hover:grayscale-0" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                   <div className="absolute bottom-8 left-8 right-8 text-left space-y-1">
                      <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em]">Section {section.id}</p>
                      <h4 className="text-xs font-black text-white leading-tight uppercase line-clamp-2">{section.label}</h4>
                   </div>
                </button>
             ))}
          </div>
        )}

        {/* AFFICHAGE DES RÉSULTATS */}
        <div className="space-y-8 animate-in fade-in duration-500">
          {(searchQuery || selectedSection !== 'ALL' || viewMode === 'table') && (
            <div className="bg-white rounded-[56px] border border-slate-200 shadow-xl overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filteredData.length} Activités trouvées</span>
                     <div className="h-4 w-px bg-slate-200"></div>
                     <button onClick={() => {setSearchQuery(''); setSelectedSection('ALL');}} className="text-[10px] font-black uppercase text-primary hover:underline">Réinitialiser les filtres</button>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="p-2 text-slate-300 hover:text-slate-600"><Star className="w-5 h-5" /></button>
                     <button className="p-2 text-slate-300 hover:text-slate-600"><FileText className="w-5 h-5" /></button>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-900 text-white">
                     <tr className="text-[10px] font-black uppercase tracking-[0.3em]">
                       <th className="px-12 py-8">Code NAA</th>
                       <th className="px-12 py-8">Activité Économique</th>
                       <th className="px-12 py-8 text-center">Régime</th>
                       <th className="px-12 py-8 text-center">Taux IFU</th>
                       <th className="px-12 py-8 text-center">TVA</th>
                       <th className="px-12 py-8 text-right">Détails</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredData.slice(0, 50).map((item, i) => {
                       // DÉTECTION DYNAMIQUE DE L'EXCLUSION
                       const exclusion = detectExclusion(item.code, item.label, exclusionRules);
                       return (
                         <tr key={i} className={`transition-all group ${exclusion.isExcluded ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-blue-50/50'}`}>
                           <td className="px-12 py-8 font-mono text-sm font-black text-slate-400 group-hover:text-primary transition-colors">{item.code}</td>
                           <td className="px-12 py-8">
                              <div className="space-y-1 max-w-md">
                                 <p className="text-sm font-black text-slate-900 uppercase leading-tight group-hover:text-primary transition-colors">{item.label}</p>
                                 <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Sec. {item.section}</span>
                                    <span>•</span>
                                    <span>{item.category}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-12 py-8 text-center">
                              {exclusion.isExcluded ? (
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className="px-3 py-1.5 rounded-lg text-[9px] bg-slate-900 text-white border border-slate-700 font-black uppercase tracking-widest flex items-center gap-2">
                                    <Scale className="w-3 h-3 text-red-400" /> RÉEL OBLIGATOIRE
                                  </span>
                                  <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                     <Ban className="w-3 h-3" /> {exclusion.reason}
                                  </span>
                                </div>
                              ) : (
                                <span className="px-3 py-1 rounded-lg text-[9px] bg-blue-50 text-primary border border-blue-100 font-black uppercase tracking-widest flex items-center gap-1 w-fit mx-auto">
                                  <CheckCircle2 className="w-3 h-3" /> FORFAIT IFU
                                </span>
                              )}
                           </td>
                           <td className="px-12 py-8 text-center">
                              <div className="flex flex-col items-center gap-1">
                                 {exclusion.isExcluded ? (
                                    <>
                                       <span className="text-xs font-black text-slate-300 line-through decoration-red-400">{item.ifu}</span>
                                       <span className="text-[10px] font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                          NON ÉLIGIBLE
                                       </span>
                                    </>
                                 ) : (
                                    <span className="text-xl font-black tracking-tighter text-primary">{item.ifu}</span>
                                 )}
                              </div>
                           </td>
                           <td className="px-12 py-8 text-center font-black text-slate-900">{item.tva}</td>
                           <td className="px-12 py-8 text-right">
                              <button 
                                onClick={() => setSelectedActivity(item)}
                                className={`p-4 border rounded-2xl transition-all active:scale-90 ${exclusion.isExcluded ? 'bg-white border-red-200 text-red-400 hover:text-red-600 hover:shadow-lg hover:shadow-red-500/10' : 'bg-white border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 hover:shadow-lg'}`}
                              >
                                 <ArrowUpRight className="w-5 h-5" />
                              </button>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        {/* Détail Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 z-[300] flex items-center justify-end p-8 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white w-full max-w-xl h-full rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
                <div className="p-12 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dossier Technique NAA</h3>
                   <button onClick={() => setSelectedActivity(null)} className="p-4 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 text-white rounded-xl w-fit text-[10px] font-black tracking-[0.3em] uppercase">Code {selectedActivity.code}</div>
                      <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{selectedActivity.label}</h2>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'Impôt Principal</p>
                         <p className="text-2xl font-black text-slate-900">{selectedActivity.type}</p>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie Écon.</p>
                         <p className="text-2xl font-black text-slate-900">{selectedActivity.category}</p>
                      </div>
                   </div>

                   {/* ALERTE EXCLUSION DYNAMIQUE */}
                   {(() => {
                     const exclusion = detectExclusion(selectedActivity.code, selectedActivity.label, exclusionRules);
                     if (exclusion.isExcluded) {
                       return (
                         <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[32px] space-y-6 shadow-xl shadow-red-500/10">
                            <div className="flex items-center gap-4 text-red-700 border-b border-red-200/50 pb-4">
                               <ShieldAlert className="w-8 h-8" />
                               <div>
                                  <h5 className="font-black text-lg uppercase tracking-tight">Régime Forfaitaire Interdit</h5>
                                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Exclusion Système Active</p>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between text-sm text-red-900 font-bold border-b border-red-200/50 pb-2">
                                  <span>Motif de l'exclusion :</span>
                                  <span className="uppercase">{exclusion.reason}</span>
                               </div>
                               <div className="flex justify-between text-sm text-red-900 font-bold border-b border-red-200/50 pb-2">
                                  <span>Référence légale :</span>
                                  <span>{exclusion.ref}</span>
                               </div>
                               <div className="flex justify-between text-sm text-red-900 font-bold">
                                  <span>Régime Imposé :</span>
                                  <span className="bg-white px-2 py-0.5 rounded text-red-600 border border-red-200">{exclusion.regime}</span>
                               </div>
                            </div>
                         </div>
                       );
                     }
                     return null;
                   })()}

                   <section className="space-y-8">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                         <TrendingUp className="w-5 h-5" /> Paramètres de calcul LF 2025
                      </h4>
                      <div className="space-y-4">
                         {[
                           { label: "Assujettissement IFU", val: selectedActivity.ifu, icon: CheckCircle2 },
                           { label: "Taux IBS de référence", val: selectedActivity.ibs, icon: Info },
                           { label: "TVA Applicable", val: selectedActivity.tva, icon: Activity },
                           { label: "Exonérations possibles", val: selectedActivity.exoneration, icon: ShieldAlert }
                         ].map((f, i) => (
                           <div key={i} className="flex items-center justify-between p-6 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                                 <f.icon className="w-5 h-5 text-slate-300" /> {f.label}
                              </div>
                              <span className="text-sm font-black text-slate-900 uppercase">{f.val}</span>
                           </div>
                         ))}
                      </div>
                   </section>
                </div>
                <div className="p-12 bg-slate-50 border-t border-slate-100">
                   <button onClick={() => setSelectedActivity(null)} className="w-full py-6 bg-primary text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">Télécharger la Fiche Technique</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NAARates;
