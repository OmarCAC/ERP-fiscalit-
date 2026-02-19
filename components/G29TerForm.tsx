
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Printer, 
  FileText, 
  FileCheck, 
  Users, 
  ClipboardList, 
  Files,
  ArrowRight
} from 'lucide-react';
import { Declaration, Taxpayer } from '../types';

interface Props {
  taxpayer?: Taxpayer | null;
  initialData?: Declaration | null;
  onBack: () => void;
  onSubmit?: (declaration: Declaration) => void;
}

const G29TerForm: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  const [activeTab, setActiveTab] = useState('recap');

  const [identData, setIdentData] = useState({
      nif: '',
      nom: '',
      adresse: '',
      activite: '',
      effectif: 0
  });

  const tabs = [
    { id: 'identification', label: 'Identification Employeur', icon: FileText },
    { id: 'recap', label: 'Récapitulatif Mensuel', icon: ClipboardList },
    { id: 'nominatif', label: 'Détail Nominatif', icon: Users },
    { id: 'droits', label: 'Droits Dus', icon: FileCheck },
    { id: 'pieces', label: 'Pièces', icon: Files },
  ];

  const monthlyData = [
    { month: 'Janvier', versee: 1200000, retenue: 120000 },
    { month: 'Février', versee: 1210000, retenue: 121000 },
    { month: 'Mars', versee: 1205000, retenue: 120500 },
    { month: 'Avril', versee: 1200000, retenue: 120000 },
    { month: 'Mai', versee: 1220000, retenue: 122000 },
    { month: 'Juin', versee: 1215000, retenue: 121500 },
    { month: 'Juillet', versee: 1230000, retenue: 123000 },
    { month: 'Août', versee: 1200000, retenue: 120000 },
    { month: 'Septembre', versee: 1210000, retenue: 121000 },
    { month: 'Octobre', versee: 1240000, retenue: 124000 },
    { month: 'Novembre', versee: 1250000, retenue: 125000 },
    { month: 'Décembre', versee: 1250000, retenue: 125000 },
  ];

  const totalVersee = monthlyData.reduce((acc, curr) => acc + curr.versee, 0);
  const totalRetenue = monthlyData.reduce((acc, curr) => acc + curr.retenue, 0);

  useEffect(() => {
     if (taxpayer) {
         setIdentData({
             nif: taxpayer.dynamicData['2'] || '',
             nom: taxpayer.dynamicData['1'] || '',
             adresse: taxpayer.dynamicData['adresse'] || '',
             activite: taxpayer.dynamicData['7'] || '',
             effectif: taxpayer.employeeCount || 0
         });
     }
     if (initialData && initialData.status !== 'BROUILLON') {
         setViewMode('OFFICIAL');
     }
  }, [taxpayer, initialData]);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
      const newDec: Declaration = {
        id: initialData?.id || `G29-${Math.floor(Math.random() * 10000)}`,
        type: 'Série G n°29 (Salaires Annuel)',
        period: 'Exercice 2023',
        regime: 'RÉEL',
        submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
        status: status,
        amount: totalRetenue,
        taxpayerName: identData.nom
      };
      if (onSubmit) onSubmit(newDec);
  };

  // --- WIZARD VIEW ---
  const renderWizard = () => (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><ArrowLeft className="w-6 h-6" /></button>
             <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                Déclaration Annuelle des Salaires (G29 Ter)
                </h1>
                <p className="text-slate-500 text-base font-medium">Exercice 2023 • Régime Réel</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSave('BROUILLON')} className="px-5 py-2.5 bg-[#eff6ff] text-primary rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition-all border border-blue-100">
              <Save className="w-4 h-4" /> Sauvegarder Brouillon
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 overflow-x-auto shadow-sm">
        <div className="max-w-6xl mx-auto flex px-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'border-primary text-slate-900' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Section: Identification */}
          {activeTab === 'identification' && (
             <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="p-8 pb-4 border-b border-slate-100">
                   <h2 className="text-xl font-black text-slate-900">Identification de l'Employeur</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 p-8 gap-x-12 gap-y-8">
                  {[
                    { label: 'Nom / Raison sociale', value: identData.nom },
                    { label: 'Activité', value: identData.activite },
                    { label: 'Adresse', value: identData.adresse },
                    { label: 'NIF', value: identData.nif },
                    { label: 'Effectif', value: identData.effectif },
                  ].map((field, i) => (
                    <div key={i} className="space-y-2 group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800 group-hover:bg-slate-100/80 transition-all">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
             </section>
          )}

          {/* Section: Récapitulatif Table */}
          {(activeTab === 'recap' || activeTab === 'droits') && (
             <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="p-8 flex items-center justify-between border-b border-slate-100">
                   <h2 className="text-xl font-black text-slate-900">Récapitulatif Mensuel (Volet I)</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Mois</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Sommes Versées (DA)</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Retenues IRG (DA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyData.map((data, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4 text-sm font-bold text-slate-700">{data.month}</td>
                          <td className="px-8 py-4 text-right text-sm font-medium text-slate-600">
                            {data.versee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-8 py-4 text-right text-sm font-medium text-slate-600">
                            {data.retenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white">
                      <tr>
                        <td className="px-8 py-6 text-sm font-black uppercase tracking-widest">Total Annuel</td>
                        <td className="px-8 py-6 text-right text-xl font-black">{totalVersee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-8 py-6 text-right text-xl font-black">{totalRetenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
             </section>
          )}

          {/* Section: Nominatif (Placeholder) */}
          {activeTab === 'nominatif' && (
             <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                   <Users className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">État Nominatif des Salariés (Volet II)</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                   L'importation du fichier Excel des salariés est requise pour générer cette section automatiquement.
                </p>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                   Importer le fichier G29_Salaries.xlsx
                </button>
             </section>
          )}

        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:px-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IRG ANNUEL DÛ :</span>
               <span className="text-2xl font-black text-slate-900 tracking-tighter">{totalRetenue.toLocaleString()} DZD</span>
            </div>
            <button onClick={() => setViewMode('OFFICIAL')} className="px-10 py-3.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-3">
               <FileText className="w-4 h-4" /> GÉNÉRER LE FORMULAIRE G29 TER
            </button>
         </div>
      </div>
    </div>
  );

  // --- OFFICIAL VIEW ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-4 md:p-8 font-serif print:bg-white print:p-0">
      
      {/* Header Actions */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Modifier les données
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 font-sans">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 font-sans">
            <CheckCircle2 className="w-4 h-4" /> Valider la Déclaration
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* A4 Paper */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] min-h-[297mm] text-black font-sans box-border print:w-full print:shadow-none">
         
         <div className="flex border-2 border-black mb-4">
            <div className="w-1/3 p-2 border-r-2 border-black text-center text-[10px] font-bold">
               <p>RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
               <p>MINISTÈRE DES FINANCES</p>
               <p>DIRECTION GÉNÉRALE DES IMPÔTS</p>
            </div>
            <div className="flex-1 p-2 text-center flex flex-col justify-center">
               <h1 className="text-xl font-black uppercase">DÉCLARATION ANNUELLE DES SALAIRES</h1>
               <h2 className="text-sm font-bold uppercase">(SÉRIE G N° 29 TER)</h2>
               <p className="text-xs font-bold mt-2">EXERCICE : 2023</p>
            </div>
            <div className="w-[15%] p-2 flex items-center justify-center border-l-2 border-black">
               <div className="text-center">
                  <p className="text-[10px] font-bold">TIMBRE</p>
                  <p className="text-[10px] font-bold">A DATE</p>
               </div>
            </div>
         </div>

         <div className="border-2 border-black p-4 mb-4">
            <h3 className="text-xs font-black uppercase border-b border-black pb-1 mb-2">I - IDENTIFICATION DE L'EMPLOYEUR OU DÉBRENTIER</h3>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
               <p><span className="font-bold">NIF :</span> {identData.nif}</p>
               <p><span className="font-bold">Nom / Raison Sociale :</span> {identData.nom}</p>
               <p className="col-span-2"><span className="font-bold">Adresse :</span> {identData.adresse}</p>
               <p><span className="font-bold">Activité :</span> {identData.activite}</p>
               <p><span className="font-bold">Effectif au 31/12 :</span> {identData.effectif}</p>
            </div>
         </div>

         <div className="border-2 border-black mb-4">
            <div className="bg-slate-100 border-b border-black p-2 text-center">
               <h3 className="text-xs font-black uppercase">II - RÉCAPITULATIF DES VERSEMENTS EFFECTUÉS AU TITRE DE L'IRG/SALAIRES</h3>
            </div>
            <table className="w-full text-[9px] border-collapse">
               <thead>
                  <tr>
                     <th className="border-r border-b border-black p-1 w-1/4">MOIS</th>
                     <th className="border-r border-b border-black p-1 text-center">DATE QUITTANCE</th>
                     <th className="border-r border-b border-black p-1 text-center">N° QUITTANCE</th>
                     <th className="border-r border-b border-black p-1 text-right">MASSE SALARIALE (DA)</th>
                     <th className="border-b border-black p-1 text-right">IRG VERSÉ (DA)</th>
                  </tr>
               </thead>
               <tbody>
                  {monthlyData.map((d, i) => (
                     <tr key={i}>
                        <td className="border-r border-b border-black p-1 font-bold">{d.month}</td>
                        <td className="border-r border-b border-black p-1 text-center">20/{i+1 < 10 ? '0'+(i+1) : i+1}/2023</td>
                        <td className="border-r border-b border-black p-1 text-center">Q-{10000+i}</td>
                        <td className="border-r border-b border-black p-1 text-right font-mono">{d.versee.toLocaleString()}</td>
                        <td className="border-b border-black p-1 text-right font-mono font-bold">{d.retenue.toLocaleString()}</td>
                     </tr>
                  ))}
                  <tr className="bg-slate-200">
                     <td colSpan={3} className="border-r border-black p-2 text-right font-black uppercase">TOTAUX GÉNÉRAUX</td>
                     <td className="border-r border-black p-2 text-right font-black font-mono">{totalVersee.toLocaleString()}</td>
                     <td className="border-black p-2 text-right font-black font-mono">{totalRetenue.toLocaleString()}</td>
                  </tr>
               </tbody>
            </table>
         </div>

         <div className="flex border-2 border-black min-h-[40mm]">
            <div className="w-1/2 p-2 border-r-2 border-black text-[9px]">
               <p className="font-bold mb-2">CADRE RÉSERVÉ À L'ADMINISTRATION</p>
               <p>Vérifié le : ...............................</p>
               <p>Par : .........................................</p>
               <p>Observation : ...........................</p>
            </div>
            <div className="w-1/2 p-2 text-[9px] relative">
               <p className="font-bold mb-8">A .............................., le .........................................</p>
               <p className="text-center font-bold">Signature et Cachet de l'Employeur</p>
            </div>
         </div>

      </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G29TerForm;
