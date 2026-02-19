import React from 'react';
import { 
  Search, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  Book, 
  HelpCircle, 
  Wrench, 
  Printer, 
  FileJson, 
  ThumbsUp, 
  ThumbsDown,
  History,
  TrendingUp,
  FileText,
  Clock,
  ArrowUpCircle,
  AlertCircle,
  SlidersHorizontal,
  Info,
  BookOpen,
  LifeBuoy
} from 'lucide-react';

const HelpCenter: React.FC = () => {
  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col pb-32">
      {/* Header avec Recherche Massive */}
      <div className="bg-[#1e293b] text-white pt-24 pb-32 px-10 relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <img src="https://images.unsplash.com/photo-1454165833767-027ff33027ef?auto=format&fit=crop&q=80&w=2000" alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 space-y-10">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30 mx-auto">
                <LifeBuoy className="w-3 h-3" /> Support Contribuable Certifié
             </div>
             <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none uppercase">Comment pouvons-nous <span className="text-primary-400">aider ?</span></h1>
          </div>
          
          <div className="relative group max-w-2xl mx-auto">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher une déclaration, un régime, une loi..." 
              className="w-full h-24 pl-20 pr-12 bg-white border-none rounded-[32px] text-xl font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 shadow-2xl transition-all"
            />
            <button className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-100 p-4 rounded-2xl text-slate-400 hover:bg-primary hover:text-white transition-all">
               <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
             {['Guides G50', 'Seuil IFU', 'TVA 2025', 'Pénalités de retard'].map(tag => (
                <button key={tag} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border-b border-transparent hover:border-primary pb-1">#{tag}</button>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-10 -mt-16 space-y-16">
        {/* Catégories de Savoir */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { title: 'Base Légale', icon: BookOpen, color: 'bg-blue-50 text-blue-600', desc: 'Consultez le CIDTA et les Lois de Finances consolidées.' },
             { title: 'Tutoriels Vidéo', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600', desc: 'Apprenez à remplir vos déclarations pas à pas.' },
             { title: 'FAQ Régimes', icon: Info, color: 'bg-amber-50 text-amber-600', desc: 'Tout savoir sur le passage IFU vers Réel.' },
             { title: 'Assistance Tech', icon: Wrench, color: 'bg-red-50 text-red-600', desc: 'Problèmes de connexion ou de signature e-Paiement.' },
           ].map((cat, i) => (
             <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer">
                <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center shadow-inner mb-8 group-hover:scale-110 transition-transform`}>
                   <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">{cat.title}</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{cat.desc}</p>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           {/* Flux de la Base de Connaissances */}
           <div className="lg:col-span-8 space-y-10">
              <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm p-12 space-y-10">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4"><FileText className="w-8 h-8 text-primary" /> Articles Populaires</h2>
                 <div className="divide-y divide-slate-100">
                    {[
                      'Comment déclarer le G50 TER via Jibayatic ?',
                      'Régime Forfaitaire : Calcul du minimum de 30.000 DA',
                      'Liste des activités exclues de l\'IFU (Art. 282 ter)',
                      'Acompte provisionnel IBS : Calendrier et calculs',
                      'Comment modifier une déclaration après soumission ?'
                    ].map((art, i) => (
                       <button key={i} className="w-full flex items-center justify-between py-6 group hover:translate-x-2 transition-transform">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{art}</span>
                          <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary transition-colors" />
                       </button>
                    ))}
                 </div>
                 <button className="w-full py-5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Afficher tous les articles</button>
              </div>

              {/* Feedback Section */}
              <div className="bg-primary/5 rounded-[40px] p-10 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-lg font-black text-slate-900 uppercase">Avez-vous trouvé l'information ?</h4>
                    <p className="text-xs font-medium text-slate-500 italic">Votre retour nous aide à améliorer le support DGI.</p>
                 </div>
                 <div className="flex gap-4">
                    <button className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-green-600 flex items-center gap-3 hover:bg-green-50 transition-all shadow-sm"><ThumbsUp className="w-4 h-4" /> Utile</button>
                    <button className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-red-500 flex items-center gap-3 hover:bg-red-50 transition-all shadow-sm"><ThumbsDown className="w-4 h-4" /> Inutile</button>
                 </div>
              </div>
           </div>

           {/* Support Direct */}
           <div className="lg:col-span-4 space-y-8 sticky top-24">
              <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                 <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4"><MessageSquare className="w-7 h-7 text-primary" /> Chat en Direct</h3>
                 <p className="text-xs font-medium text-slate-400 leading-relaxed">Discutez en temps réel avec un inspecteur ou un consultant fiscal certifié.</p>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Inspecteurs Disponibles</span>
                 </div>
                 <button className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all">Lancer la conversation</button>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Besoin d'un Ticket ?</h3>
                 <div className="space-y-4">
                    <div className="flex items-start gap-5">
                       <Mail className="w-6 h-6 text-primary mt-1" />
                       <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900 uppercase">Support Email</p>
                          <p className="text-[10px] text-slate-400 font-medium">Réponse garantie sous 24h ouvrables.</p>
                       </div>
                    </div>
                    <button className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary/20 hover:bg-primary/5 transition-all">Soumettre une demande</button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
