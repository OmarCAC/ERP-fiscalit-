
import React from 'react';
import { CloudUpload, Lock, Trash2, Plus, FileDown } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const SubscriptionForm: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col">
      {/* Custom Navbar */}
      <header className="flex items-center justify-between bg-white border-b border-slate-200 px-10 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4 text-slate-900">
           <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
              </svg>
           </div>
           <h2 className="text-lg font-bold tracking-tight">Jibayatic</h2>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-10 space-y-10">
        <div className="space-y-4">
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Formulaire de Souscription Jibayatic</h1>
           <p className="text-slate-500 text-base font-medium">Veuillez remplir les informations ci-dessous pour finaliser votre souscription.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Section 1 */}
          <div className="p-8 border-b border-slate-100 space-y-8">
             <h2 className="text-xl font-black text-slate-900 tracking-tight">Informations du Contribuable</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-800">Raison sociale</label>
                   <input readOnly value="SARL Tech Solutions" className="w-full h-14 rounded-xl border-none bg-slate-100 px-5 text-base font-medium text-slate-400 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-800">NIF (Numéro d'Identification Fiscale)</label>
                   <input readOnly value="001234567890123" className="w-full h-14 rounded-xl border-none bg-slate-100 px-5 text-base font-medium text-slate-400 cursor-not-allowed" />
                </div>
             </div>
          </div>

          {/* Section 2 */}
          <div className="p-8 border-b border-slate-100 space-y-8">
             <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">Coordonnées</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-800">Adresse</label>
                   <input defaultValue="123 Rue de l'Innovation, Alger" className="w-full h-14 rounded-xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-900 focus:ring-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-800">Email</label>
                   <input type="email" defaultValue="contact@techsolutions.dz" className="w-full h-14 rounded-xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-900 focus:ring-primary shadow-sm" />
                </div>
             </div>
          </div>

          {/* Section 3 (RIB) */}
          <div className="p-8 border-b border-slate-100 space-y-8">
             <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">Coordonnées Bancaires (RIB)</h2>
             <div className="space-y-6">
                {[1, 2].map((n) => (
                  <div key={n} className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">RIB {n === 2 ? '2 (Optionnel)' : n}</p>
                    <div className="flex w-full items-stretch rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
                       <div className="px-5 bg-slate-50 flex items-center justify-center border-r border-slate-100 text-slate-300">
                          <Lock className="w-4 h-4" />
                       </div>
                       <input placeholder="Entrez votre RIB" className="flex-1 border-none h-14 px-4 text-base font-medium focus:ring-0" />
                       <button className="px-5 bg-white hover:text-red-500 text-slate-400 transition-colors border-l border-slate-100">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-4">
                   <p className="text-xs text-slate-400 font-medium italic">Format RIB: 00799999000123456789. Les doublons ne sont pas autorisés. Vos données sont sécurisées.</p>
                   <button className="flex items-center gap-2 self-start bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-xs font-black hover:bg-primary/20 transition-all">
                      <Plus className="w-4 h-4" /> Ajouter un RIB
                   </button>
                </div>
             </div>
          </div>

          {/* Section 4 */}
          <div className="p-8 border-b border-slate-100 space-y-8">
             <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">Informations du Signataire</h2>
             <div className="space-y-8">
                <div className="space-y-4">
                   <p className="text-sm font-bold text-slate-800">Qualité du signataire</p>
                   <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 border-2 border-primary bg-primary/5 rounded-2xl cursor-pointer">
                         <input type="radio" defaultChecked name="qualite" className="w-5 h-5 text-primary focus:ring-primary" />
                         <span className="text-sm font-black text-primary uppercase tracking-widest">Représentant légal</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                         <input type="radio" name="qualite" className="w-5 h-5 border-slate-300 text-primary focus:ring-primary" />
                         <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Mandataire habilité</span>
                      </label>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">Lieu</label>
                      <input placeholder="Ex: Alger" className="w-full h-14 rounded-xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-900 focus:ring-primary shadow-sm" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">Date</label>
                      <input type="date" defaultValue="2023-10-27" className="w-full h-14 rounded-xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-900 focus:ring-primary shadow-sm" />
                   </div>
                </div>
             </div>
          </div>

          {/* Section 5 */}
          <div className="p-8 border-b border-slate-100 space-y-8">
             <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">Pièce Jointe</h2>
             <div className="w-full p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:bg-slate-100/50 hover:border-primary/30 transition-all">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-primary group-hover:scale-110 transition-transform">
                   <CloudUpload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-base font-black text-slate-900">Joindre le scan officiel</h3>
                   <p className="text-sm text-slate-500 font-medium">Glissez-déposez ou cliquez pour parcourir</p>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Format attendu : JIBAYATIC-SOUSCRIPTION-&#123;ANNEE&#125;-&#123;NIF&#125;.pdf</p>
             </div>
          </div>

          {/* Footer Card */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
             <button className="px-10 py-3.5 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:bg-primary/90 flex items-center gap-3 transition-all">
                <FileDown className="w-5 h-5" /> Exporter PDF
             </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionForm;
