
import React, { useState } from 'react';
import { MoreHorizontal, ArrowLeft, RefreshCw, Printer, Save, CheckCircle2, FileText, Send } from 'lucide-react';
import { Declaration } from '../types';

interface Props {
  onBack: () => void;
  onSubmit?: (declaration: Declaration) => void;
}

const G50SimplifieForm: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  
  // États simulés pour la démonstration
  const [formData, setFormData] = useState({
    masseSalariale: 50000,
    irgSalaires: 50000,
    nbSalaries: 4,
    beneficeNet: 120000,
    irgPro: 60000,
    caImposable: 140000,
    tvaCollectee: 50000,
    tvaDeductible: 20000
  });

  const totalAPayer = formData.irgSalaires + formData.irgPro + (formData.tvaCollectee - formData.tvaDeductible);

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
      const newDec: Declaration = {
        id: `G50S-${Math.floor(Math.random() * 10000)}`,
        type: 'G50 Simplifié (Réel Simplifié)',
        period: 'Trimestre 2 2024',
        regime: 'RÉEL SIMPLIFIÉ',
        submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
        status: status,
        amount: totalAPayer,
        taxpayerName: 'SARL EXEMPLE'
      };
      if (onSubmit) onSubmit(newDec);
  };

  const handlePrint = () => window.print();

  // --- VUE ASSISTANT DE SAISIE ---
  const renderWizard = () => (
    <div className="min-h-full bg-[#f6f7f8] p-8 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-full text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">G50 Simplifié (Saisie)</h1>
        </div>
        <div className="flex gap-3">
             <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <Save className="w-4 h-4" /> Sauvegarder
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Colonne Gauche */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 relative">
            <MoreHorizontal className="absolute top-6 right-6 w-4 h-4 text-slate-300 cursor-pointer" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Identification</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">N° Identification Fiscale</label>
                <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700">123456789</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raison Sociale</label>
                <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700">SARL EXEMPLE</div>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse</label>
                <div className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700">10 Rue de la Liberté, Alger</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Période</label>
                <div className="relative">
                  <select className="w-full bg-white border-2 border-slate-100 rounded-xl text-sm font-bold py-3 px-3 appearance-none focus:ring-primary focus:border-primary">
                    <option>Trimestre 2 2024</option>
                  </select>
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 relative">
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Section 4: IRG Salaires</h2>
                <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-lg">
                  <RefreshCw className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase">Synchronisé</span>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">Masse salariale imposable</span>
                   <div className="p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 text-right min-w-[140px]">{formData.masseSalariale.toLocaleString()} DZD</div>
                </div>
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">IRG/Salaires dû</span>
                   <div className="p-3 bg-slate-50 rounded-xl text-sm font-black text-primary text-right min-w-[140px]">{formData.irgSalaires.toLocaleString()} DZD</div>
                </div>
             </div>
          </div>
        </div>

        {/* Colonne Droite */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 relative">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Section 5: IRG/Professionnel</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">Bénéfice net (provisoire)</span>
                   <input type="number" value={formData.beneficeNet} onChange={e => setFormData({...formData, beneficeNet: Number(e.target.value)})} className="w-[140px] p-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-right focus:border-primary focus:ring-0" />
                </div>
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">Acompte IRG dû (50%)</span>
                   <div className="p-3 bg-slate-50 rounded-xl text-sm font-black text-primary text-right min-w-[140px]">{formData.irgPro.toLocaleString()} DZD</div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 relative">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Section 11: TVA</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">CA imposable</span>
                   <input type="number" value={formData.caImposable} onChange={e => setFormData({...formData, caImposable: Number(e.target.value)})} className="w-[140px] p-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-right focus:border-primary focus:ring-0" />
                </div>
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">TVA collectée</span>
                   <div className="p-3 bg-slate-50 rounded-xl text-sm font-black text-slate-900 text-right min-w-[140px]">{formData.tvaCollectee.toLocaleString()} DZD</div>
                </div>
                <div className="flex items-center justify-between gap-8">
                   <span className="text-xs font-bold text-slate-600">TVA déductible</span>
                   <input type="number" value={formData.tvaDeductible} onChange={e => setFormData({...formData, tvaDeductible: Number(e.target.value)})} className="w-[140px] p-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-right focus:border-primary focus:ring-0" />
                </div>
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-8">
                   <span className="text-xs font-black text-slate-900 uppercase">TVA à payer</span>
                   <div className="text-lg font-black text-primary text-right">{(formData.tvaCollectee - formData.tvaDeductible).toLocaleString()} DZD</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:px-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL À PAYER :</span>
               <span className="text-2xl font-black text-slate-900 tracking-tighter">{totalAPayer.toLocaleString()} DZD</span>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
               <button onClick={() => setViewMode('OFFICIAL')} className="flex-1 md:flex-none px-8 py-3.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> GÉNÉRER LE FORMULAIRE G50
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  // --- VUE OFFICIELLE ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-8 font-serif">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm"><ArrowLeft className="w-4 h-4" /> Modifier les données</button>
        <div className="flex gap-3">
          <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 font-sans">
            <Save className="w-4 h-4" /> Sauvegarder Brouillon
          </button>
          <button onClick={() => handleSave('VALIDÉ')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 font-sans">
            <CheckCircle2 className="w-4 h-4" /> Valider la Déclaration
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] text-black font-sans text-[10px] leading-tight box-border print:w-full print:shadow-none min-h-[297mm]">
        
        {/* HEADER */}
        <div className="flex border-2 border-black mb-2">
           <div className="w-1/3 p-2 border-r border-black text-center"><p>المديرية العامة للضرائب</p><p className="font-bold">DIRECTION GENERALE DES IMPOTS</p></div>
           <div className="flex-1 p-2 text-center"><h1 className="font-bold text-sm">G50 : DECLARATION (RÉGIME SIMPLIFIÉ)</h1><p className="font-bold border border-black inline-block px-2 mt-1">SÉRIE G N°50</p></div>
           <div className="w-1/4 p-2 border-l border-black text-center"><p className="font-bold">TRIMESTRIELLE</p></div>
        </div>

        {/* IDENTIFICATION */}
        <div className="border-2 border-black rounded-lg p-2 mb-4">
           <div className="flex gap-4 mb-2"><span className="font-bold">NIF :</span><span className="font-mono font-bold text-lg tracking-widest">123456789012345</span></div>
           <p><span className="font-bold">Nom/Raison :</span> SARL EXEMPLE</p>
           <p><span className="font-bold">Période :</span> 2ème Trimestre 2024</p>
        </div>

        {/* TABLEAU RÉCAP */}
        <table className="w-full border-collapse border border-black mb-8">
           <thead>
             <tr className="bg-gray-100">
               <th className="border border-black p-2 text-left font-bold w-[60%]">NATURE DE L'IMPÔT</th>
               <th className="border border-black p-2 text-center font-bold">MONTANT À PAYER</th>
             </tr>
           </thead>
           <tbody>
             <tr>
               <td className="border border-black p-2 font-bold">IRG / Salaires (Section 4)</td>
               <td className="border border-black p-2 text-right font-mono font-bold text-sm">{formData.irgSalaires.toLocaleString()}</td>
             </tr>
             <tr>
               <td className="border border-black p-2 font-bold">IRG / Professionnel - Acompte (Section 5)</td>
               <td className="border border-black p-2 text-right font-mono font-bold text-sm">{formData.irgPro.toLocaleString()}</td>
             </tr>
             <tr>
               <td className="border border-black p-2 font-bold">TVA à Payer (Section 11)</td>
               <td className="border border-black p-2 text-right font-mono font-bold text-sm">{(formData.tvaCollectee - formData.tvaDeductible).toLocaleString()}</td>
             </tr>
             <tr>
               <td className="border border-black p-2 font-bold">Taxe de Formation (1%)</td>
               <td className="border border-black p-2 text-right font-mono font-bold text-sm">{(formData.masseSalariale * 0.01).toLocaleString()}</td>
             </tr>
             <tr>
               <td className="border border-black p-2 font-bold">Taxe d'Apprentissage (1%)</td>
               <td className="border border-black p-2 text-right font-mono font-bold text-sm">{(formData.masseSalariale * 0.01).toLocaleString()}</td>
             </tr>
           </tbody>
           <tfoot>
             <tr className="bg-slate-100">
               <td className="border border-black p-2 text-right font-black uppercase">Total Général</td>
               <td className="border border-black p-2 text-right font-black text-lg">{(totalAPayer + (formData.masseSalariale * 0.02)).toLocaleString()}</td>
             </tr>
           </tfoot>
        </table>

        {/* CADRE PAIEMENT */}
        <div className="border-2 border-black p-4 mt-8">
           <h3 className="font-bold underline mb-4">CADRE RÉSERVÉ AU PAIEMENT</h3>
           <p className="mb-2">Mode de paiement : ________________________________________</p>
           <p className="mb-2">Numéro de chèque / Virement : _______________________________</p>
           <div className="flex justify-between mt-8">
              <div className="text-center w-1/2">
                 <p className="font-bold">Cachet et Signature du Contribuable</p>
              </div>
              <div className="text-center w-1/2">
                 <p className="font-bold">Cachet de la Recette</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G50SimplifieForm;
