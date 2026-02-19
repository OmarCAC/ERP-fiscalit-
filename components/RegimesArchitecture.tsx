
import React, { useState } from 'react';
import { 
  Search, 
  Printer, 
  Download, 
  FileText, 
  Building2, 
  Briefcase, 
  Ban, 
  TableProperties, 
  RefreshCw,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
  Gavel,
  Scale,
  ShieldAlert,
  ArrowRight,
  Calculator,
  ChevronDown,
  BookOpen,
  PieChart,
  HelpCircle
} from 'lucide-react';

const RegimesArchitecture: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const internalNav = [
    { id: 'overview', label: "Vue d'ensemble & MAJ", icon: Layers },
    { id: 'bic', label: 'Régimes BIC', icon: Building2 },
    { id: 'bnc', label: 'Régimes BNC', icon: Briefcase },
    { id: 'exclusions', label: 'Exclusions IFU (LF 2025)', icon: Ban },
    { id: 'recap', label: 'Tableaux de Synthèse', icon: TableProperties },
    { id: 'rules', label: 'Règles de Basculement', icon: RefreshCw },
    { id: 'examples', label: 'Exemples & Sanctions', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-8 space-y-4">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-lg font-black uppercase tracking-tight">Mise à jour importante (Novembre 2025)</h2>
              </div>
              <p className="text-sm text-amber-800 font-medium leading-relaxed">
                Ce document intègre la législation algérienne en vigueur. Principaux points : Seuil IFU unifié à 8.000.000 DA, 
                minimum fiscal à 30.000 DA (LF 2025), remplacement de la TAP par la TLS (LF 2024), et nouvelles exclusions 
                sectorielles (Cliniques, Santé, Restauration classée).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <span className="text-xs font-bold text-amber-900">Abrogation du Régime Simplifié BIC</span>
                </div>
                <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <span className="text-xs font-bold text-amber-900">Création du Régime Simplifié BNC</span>
                </div>
              </div>
            </div>

            <section className="space-y-6">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vue d'ensemble du système</h2>
               <p className="text-slate-600 leading-relaxed max-w-4xl">
                  Le système fiscal algérien distingue les bénéfices selon la nature de l'activité : 
                  <span className="font-bold text-slate-900"> BIC</span> pour le commerce/industrie et 
                  <span className="font-bold text-slate-900"> BNC</span> pour les professions libérales. 
                  L'orientation vers un régime dépend du CA annuel, de la forme juridique et des exclusions légales (Art. 282 ter CIDTA).
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-primary/5 border border-primary/10 rounded-[32px] space-y-4">
                     <h3 className="text-lg font-black text-primary tracking-tight">Structure BIC</h3>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                           <CheckCircle2 className="w-4 h-4 text-primary" /> Régime Forfaitaire (IFU)
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                           <CheckCircle2 className="w-4 h-4 text-primary" /> Régime du Réel Normal
                        </li>
                     </ul>
                  </div>
                  <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px] space-y-4">
                     <h3 className="text-lg font-black text-indigo-700 tracking-tight">Structure BNC</h3>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                           <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Régime Forfaitaire (IFU)
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                           <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Régime Simplifié BNC
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                           <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Régime du Réel (Optionnel)
                        </li>
                     </ul>
                  </div>
               </div>
            </section>
          </div>
        );

      case 'bic':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Régimes BIC (Commerce & Industrie)</h2>
               <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Série G n°11 / G12</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Calculator className="w-6 h-6" />
                     </div>
                     <h3 className="text-lg font-black text-slate-900">Régime Forfaitaire (IFU)</h3>
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Seuil éligibilité</span>
                        <span className="text-sm font-black text-slate-900">≤ 8.000.000 DA</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Minimum fiscal</span>
                        <span className="text-sm font-black text-red-600">30.000 DA / an</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Déclarations</span>
                        <span className="text-sm font-black text-slate-900">G12 / G12 Bis</span>
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">Comptabilité : Registre Recettes/Dépenses paraphé.</p>
               </div>

               <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                        <Scale className="w-6 h-6" />
                     </div>
                     <h3 className="text-lg font-black text-slate-900">Régime du Réel Normal</h3>
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Application</span>
                        <span className="text-sm font-black text-slate-900">> 8.000.000 DA</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Comptabilité</span>
                        <span className="text-sm font-black text-slate-900">SCF Complet</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl flex justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Minimum fiscal</span>
                        <span className="text-sm font-black text-slate-900">10.000 DA</span>
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">Déclarations : G11 annuelle + G50 périodique (Mensuelle/Trim).</p>
               </div>
            </div>
          </div>
        );

      case 'bnc':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex items-center justify-between border-b border-slate-100 pb-6">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Professions BNC (Non Commerciales)</h2>
               <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Série G n°13 / G12</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { 
                   title: "IFU BNC", 
                   desc: "Optionnel si CA ≤ 8M DA. Taux unique de 12%. Libératoire.", 
                   forms: "G12 / G12 Bis", 
                   color: "border-slate-200" 
                 },
                 { 
                   title: "Régime Simplifié", 
                   desc: "Obligatoire si CA > 8M DA. Barème progressif IRG.", 
                   forms: "G13 + G50 Trimestrielle", 
                   color: "border-indigo-200 bg-indigo-50/30" 
                 },
                 { 
                   title: "Réel (SCF)", 
                   desc: "Sur option. Comptabilité complète selon le SCF.", 
                   forms: "G13 + G50 Trimestrielle", 
                   color: "border-slate-200" 
                 }
               ].map((item, i) => (
                 <div key={i} className={`p-8 rounded-[32px] border-2 space-y-6 ${item.color}`}>
                    <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                    <div className="pt-4 border-t border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Formulaires</p>
                       <p className="text-sm font-bold text-slate-800">{item.forms}</p>
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 flex gap-6 items-start">
               <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
               <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  <span className="font-black">Note LFC 2022 :</span> Le régime simplifié BNC a été introduit pour offrir une transition 
                  douce entre le forfait (IFU) et le régime du réel, permettant un livre-journal allégé.
               </p>
            </div>
          </div>
        );

      case 'exclusions':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Exclusions Exhaustives de l'IFU</h2>
                <p className="text-sm text-slate-500">Activités soumises d'office au régime du réel (Art. 282 ter CIDTA / LF 2025).</p>
             </div>

             <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                         <th className="px-10 py-6">Activité Exclue</th>
                         <th className="px-10 py-6">Référence Légale</th>
                         <th className="px-10 py-6">Loi / Millésime</th>
                         <th className="px-10 py-6">Note DGI</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[
                        { act: "Promotion immobilière & Lotissement", ref: "Art. 282 ter", loi: "LF 2022", note: "Opérations spéculatives" },
                        { act: "Importation pour revente en l'état", ref: "Art. 282 ter", loi: "LF 2022+", note: "Code import actif" },
                        { act: "Achat-revente en gros", ref: "Circulaires DGI", loi: "Permanent", note: "Intermédiation commerciale" },
                        { act: "Travaux publics & Bâtiment (BTP)", ref: "Art. 282 ter", loi: "LF 2022+", note: "Secteur structuré réel" },
                        { act: "Santé, Cliniques & Laboratoires", ref: "Art. 282 ter mod.", loi: "LF 2025", note: "Nouvel ajout majeur" },
                        { act: "Hôtellerie & Restauration classées", ref: "Art. 282 ter mod.", loi: "LF 2024", note: "Prestations haut de gamme" },
                        { act: "Marchés publics (Haute volumétrie)", ref: "Pratiques DGI", loi: "Consolidé", note: "Selon nature du contrat" },
                        { act: "Professions réglementées", ref: "Textes spécifiques", loi: "Ordres prof.", note: "Ex: Audit, Conseil Juridique" },
                      ].map((ex, i) => (
                        <tr key={i} className="hover:bg-red-50/30 transition-colors group">
                           <td className="px-10 py-6 text-sm font-black text-slate-800">{ex.act}</td>
                           <td className="px-10 py-6 text-xs font-bold text-slate-500 font-mono">{ex.ref}</td>
                           <td className="px-10 py-6">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{ex.loi}</span>
                           </td>
                           <td className="px-10 py-6 text-xs italic text-slate-400">{ex.note}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        );

      case 'recap':
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
             <section className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tableau Synthétique : Régimes BIC</h3>
                <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                   <table className="w-full text-left text-sm font-medium">
                      <thead className="bg-slate-900 text-white">
                         <tr className="text-[10px] font-black uppercase tracking-widest">
                            <th className="px-8 py-5">Critère</th>
                            <th className="px-8 py-5">Régime Forfaitaire (IFU)</th>
                            <th className="px-8 py-5">Régime Réel Normal</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">CA (toutes act.)</td>
                            <td className="px-8 py-5 text-slate-700">≤ 8.000.000 DA</td>
                            <td className="px-8 py-5 text-slate-700">> 8.000.000 DA</td>
                         </tr>
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">Comptabilité</td>
                            <td className="px-8 py-5 text-slate-700">Registre R/D</td>
                            <td className="px-8 py-5 text-slate-700">SCF + Bilan détaillé</td>
                         </tr>
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">Déclarations</td>
                            <td className="px-8 py-5 text-slate-700">G12, G12 Bis</td>
                            <td className="px-8 py-5 text-slate-700">G11, G50</td>
                         </tr>
                         <tr className="bg-slate-50/50">
                            <td className="px-8 py-5 font-black text-slate-400">Impôt Minimum</td>
                            <td className="px-8 py-5 font-black text-red-600">30.000 DA (LF 2025)</td>
                            <td className="px-8 py-5 font-black text-slate-900">10.000 DA</td>
                         </tr>
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">Acomptes (2x30%)</td>
                            <td className="px-8 py-5 text-slate-700">NON</td>
                            <td className="px-8 py-5 text-green-600 font-bold">OUI</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </section>

             <section className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tableau Synthétique : Régimes BNC</h3>
                <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                   <table className="w-full text-left text-sm font-medium">
                      <thead className="bg-indigo-900 text-white">
                         <tr className="text-[10px] font-black uppercase tracking-widest">
                            <th className="px-8 py-5">Critère</th>
                            <th className="px-8 py-5">IFU BNC</th>
                            <th className="px-8 py-5">Régime Simplifié</th>
                            <th className="px-8 py-5">Régime Réel</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">Seuil CA</td>
                            <td className="px-8 py-5 text-slate-700">≤ 8M DA (Option)</td>
                            <td className="px-8 py-5 text-slate-700">> 8M DA ou Option</td>
                            <td className="px-8 py-5 text-slate-700">Option libre</td>
                         </tr>
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">Calcul Impôt</td>
                            <td className="px-8 py-5 text-slate-900 font-bold">12% Fixe</td>
                            <td className="px-8 py-5 text-slate-700">Barème 0-35%</td>
                            <td className="px-8 py-5 text-slate-700">Barème 0-35%</td>
                         </tr>
                         <tr>
                            <td className="px-8 py-5 font-black text-slate-400">Échéance</td>
                            <td className="px-8 py-5 text-slate-700">30 Juin / 20 Janv.</td>
                            <td className="px-8 py-5 text-slate-700">30 Avril</td>
                            <td className="px-8 py-5 text-slate-700">30 Avril</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </section>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Règles de Basculement Automatique</h2>
                <p className="text-sm text-slate-500">Art. 282 quater CIDTA : Modalités de passage au régime réel.</p>
             </div>

             <div className="bg-white rounded-[40px] border border-slate-200 p-10 space-y-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex flex-col md:flex-row gap-12 items-center">
                   <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black">1</div>
                         <p className="text-base font-bold text-slate-800">Dépassement du seuil de 8.000.000 DA.</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black">2</div>
                         <p className="text-base font-bold text-slate-800">Confirmation du dépassement sur 2 années consécutives.</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black">3</div>
                         <p className="text-base font-black text-primary">Passage OBLIGATOIRE au réel dès la 3ème année.</p>
                      </div>
                   </div>
                   <div className="w-full md:w-80 bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Exemple Pratique</h4>
                      <div className="space-y-2">
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Année N:</span> <span className="font-bold">10M DA</span></div>
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Année N+1:</span> <span className="font-bold">9.5M DA</span></div>
                         <div className="h-px bg-slate-200 my-2"></div>
                         <div className="flex justify-between text-sm"><span className="text-primary font-black uppercase">Année N+2:</span> <span className="font-black text-primary uppercase">RÉEL NORMAL</span></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 text-white rounded-[32px] p-8 space-y-6">
                   <h3 className="text-lg font-black tracking-tight">Option volontaire</h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Tout contribuable IFU peut opter pour le régime du réel à tout moment par simple déclaration, 
                      sous réserve du respect des obligations comptables (SCF) dès le 1er Janvier de l'exercice.
                   </p>
                   <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-transform">
                      Demander changement <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
                <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8 space-y-6">
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Régime TLS (Taxe Locale)</h3>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      La TAP a été remplacée par la TLS (Taxe Locale de Solidarité) en 2024. 
                      Les contribuables IFU ne sont plus soumis à cette taxe séparément, l'IFU étant libératoire.
                   </p>
                   <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase">Neutralité Fiscale</span>
                </div>
             </div>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sanctions & Exemples</h2>
                <p className="text-sm text-slate-500">Barème des sanctions pour dépôt tardif (Art. 192 CIDTA).</p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Barème Sanctions (Dépôt Tardif)</h3>
                   <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[10px] font-black uppercase">
                               <th className="px-6 py-4">Retard</th>
                               <th className="px-6 py-4">Si Bénéfice</th>
                               <th className="px-6 py-4">Si Déficit</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50 font-medium">
                            <tr><td className="px-6 py-4 text-slate-600">≤ 1 mois</td> <td className="px-6 py-4 text-red-600 font-bold">10%</td> <td className="px-6 py-4 text-slate-800">2.500 DA</td></tr>
                            <tr><td className="px-6 py-4 text-slate-600">1 à 2 mois</td> <td className="px-6 py-4 text-red-600 font-bold">20%</td> <td className="px-6 py-4 text-slate-800">5.000 DA</td></tr>
                            <tr><td className="px-6 py-4 text-slate-600">> 2 mois</td> <td className="px-6 py-4 text-red-600 font-bold">25%</td> <td className="px-6 py-4 text-slate-800">10.000 DA</td></tr>
                            <tr className="bg-red-50"><td className="px-6 py-4 text-red-800 font-black">Non-dépôt</td> <td className="px-6 py-4 text-red-800 font-black">35%</td> <td className="px-6 py-4 text-red-800 font-black">Majoré</td></tr>
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Cas Pratiques de Classification</h3>
                   <div className="space-y-4">
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-2">
                         <p className="text-[10px] font-black text-primary uppercase">Cas 1: Épicerie</p>
                         <p className="text-sm font-black text-slate-900 leading-tight">CA = 12.000.000 DA (Achat-revente)</p>
                         <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" /> Régime: RÉEL NORMAL (Dépassement 8M)
                         </p>
                      </div>
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-2">
                         <p className="text-[10px] font-black text-indigo-600 uppercase">Cas 2: Cabinet d'Architecte</p>
                         <p className="text-sm font-black text-slate-900 leading-tight">CA = 10.000.000 DA (Services)</p>
                         <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" /> Régime: SIMPLIFIÉ BNC (Obligatoire > 8M)
                         </p>
                      </div>
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-2">
                         <p className="text-[10px] font-black text-red-600 uppercase">Cas 3: Entreprise BTP</p>
                         <p className="text-sm font-black text-slate-900 leading-tight">CA = 5.000.000 DA (Pourtant éligible CA)</p>
                         <p className="text-xs text-red-600 font-bold flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" /> Régime: RÉEL NORMAL (Activité Exclue IFU)
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sub-navigation panel */}
      <aside className="w-80 border-r border-slate-200 bg-white/70 backdrop-blur-md p-8 space-y-10 hidden xl:flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-4 px-2">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">Architecture Fiscale</h1>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Édition 2025</p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4">Module Réglementaire</p>
          {internalNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all group ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-100'
              }`}
            >
              <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
              <span className="text-[13px] font-black tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
           <div className="flex items-center gap-2 text-slate-800">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Besoin d'aide ?</span>
           </div>
           <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Nos consultants fiscaux sont disponibles pour valider votre régime.
           </p>
           <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
              Prendre RDV
           </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Main Title Area */}
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-slate-200 pb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                 <ShieldAlert className="w-3 h-3" /> Référence DGI Certifiée
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                {activeTab === 'overview' ? 'Architecture des Régimes Fiscaux' : internalNav.find(n => n.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl">
                 Guide complet sur l'imposition IRG BIC/BNC selon le Code des Impôts Directs (CIDTA) mis à jour en Novembre 2025.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary shadow-sm transition-all active:scale-95 group">
                <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary shadow-sm transition-all active:scale-95 group">
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              </button>
              <div className="h-10 w-px bg-slate-200 mx-2"></div>
              <button className="px-8 py-3.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                 Simuler mon régime
              </button>
            </div>
          </div>

          {/* Dynamic Content Switching */}
          {renderContent()}

          {/* Persistent Legal Footer */}
          <div className="pt-16 pb-12 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Références Légales Validées</h4>
                <div className="flex flex-wrap gap-4">
                   {['Art. 282 ter CIDTA', 'Art. 31 bis CIDTA', 'LF 2022', 'LFC 2022', 'LF 2024', 'LF 2025'].map((ref, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500">{ref}</span>
                   ))}
                </div>
             </div>
             <div className="text-right flex flex-col justify-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernière mise à jour</p>
                <p className="text-sm font-black text-slate-900">03 Novembre 2025</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegimesArchitecture;
