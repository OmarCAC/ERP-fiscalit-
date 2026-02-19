
import React, { useState } from 'react';
import { 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  UserPlus, 
  CloudUpload, 
  FileText, 
  MousePointer2,
  ChevronRight,
  X,
  User,
  Mail,
  Building,
  Lock,
  LogIn
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext'; // IMPORT CONTEXT

interface Props {
  onStart: () => void; 
  onLogin?: (email: string, pass: string) => boolean; 
  onSignUp: (user: { name: string, email: string, organization: string, password?: string }) => void;
}

const LandingPage: React.FC<Props> = ({ onStart, onLogin, onSignUp }) => {
  const { dispatch } = useNotification(); // HOOK
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // Sign Up State
  const [signUpData, setSignUpData] = useState({
     name: '',
     email: '',
     organization: '',
     password: ''
  });

  // Login State
  const [loginData, setLoginData] = useState({
      email: '',
      password: ''
  });
  const [loginError, setLoginError] = useState(false);

  const handleSignUpSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if(signUpData.name && signUpData.email && signUpData.organization) {
        onSignUp(signUpData);
        // Notif Bienvenue
        dispatch({
            type: 'INFO',
            title: 'Bienvenue sur Jibayatic',
            message: `Compte créé pour ${signUpData.organization}`,
            targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT']
        });
     }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onLogin) {
          const success = onLogin(loginData.email, loginData.password);
          if (success) {
              setLoginError(false);
              // DECLENCHEMENT ALERTE SECURITE
              dispatch({
                  type: 'SECURITY',
                  title: 'Nouvelle Connexion',
                  message: `Connexion détectée depuis un nouvel appareil (Web) pour ${loginData.email}`,
                  targetRoles: ['ADMIN', 'COMPTABLE', 'CLIENT'] // Cibler l'utilisateur lui-même
              });
          } else {
              setLoginError(true);
          }
      } else {
          onStart(); 
      }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans selection:bg-primary selection:text-white">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#f6f7f8]/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Module Fiscal</h2>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Accueil</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsLoginOpen(true)} className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all">
              Se connecter
            </button>
            <button onClick={() => setIsSignUpOpen(true)} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-all">
              S'inscrire
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-48 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                  Simplifiez vos déclarations fiscales en Algérie.
                </h1>
                <p className="text-lg text-slate-500 max-w-xl">
                  Notre module intégré gère les régimes IFU, Réel Simplifié, et Réel Normal avec précision et automatisation.
                </p>
              </div>
              <div className="flex justify-center lg:justify-start">
                <button 
                  onClick={() => setIsSignUpOpen(true)}
                  className="px-8 py-4 bg-primary text-white rounded-lg text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Commencer gratuitement
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200" 
                  className="w-full h-auto object-cover" 
                  alt="Interface fiscale"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Une plateforme, tous vos avantages.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Découvrez comment notre module peut transformer votre processus de déclaration fiscale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Automatisation Intelligente', icon: MousePointer2, desc: 'Réduisez les erreurs manuelles et gagnez du temps.' },
              { title: 'Support Multi-Régimes', icon: Layers, desc: 'Gérez facilement les régimes IFU, Réel Simplifié, et Réel Normal.' },
              { title: 'Calendrier Fiscal', icon: Clock, desc: 'Ne manquez aucune échéance importante grâce aux rappels intégrés.' },
              { title: 'Synchronisation des Données', icon: ShieldCheck, desc: 'Centralisez toutes vos informations fiscales en un seul endroit sécurisé.' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-slate-900 mb-16 tracking-tight">Comment ça marche ?</h2>
          <div className="max-w-2xl mx-auto">
            {[
              { title: 'Inscrivez-vous', icon: UserPlus, desc: 'Créez votre compte en quelques minutes.' },
              { title: 'Importez vos données', icon: CloudUpload, desc: 'Connectez vos sources de données ou importez des fichiers.' },
              { title: 'Générez vos déclarations', icon: FileText, desc: 'Obtenez vos liasses fiscales prêtes à être soumises.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border-2 border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                    <step.icon className="w-5 h-5" />
                  </div>
                  {i !== 2 && <div className="w-0.5 grow bg-slate-200 my-2 group-hover:bg-primary/20 transition-all"></div>}
                </div>
                <div className="pb-12 pt-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="bg-slate-100 rounded-3xl p-10 md:p-20 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Prêt à transformer votre gestion fiscale ?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Rejoignez des centaines d'entreprises qui simplifient leur fiscalité. Inscrivez-vous dès maintenant et bénéficiez d'un essai gratuit.
            </p>
            <button 
              onClick={() => setIsSignUpOpen(true)}
              className="px-10 py-4 bg-primary text-white rounded-lg text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              S'inscrire maintenant
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500">© 2024 Module Fiscal. Tous droits réservés.</p>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Mentions Légales</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Politique de confidentialité</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* SIGN UP MODAL */}
      {isSignUpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-lg font-black text-slate-900">Créer votre compte</h3>
                 <button onClick={() => setIsSignUpOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSignUpSubmit} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 uppercase">Nom Complet</label>
                       <div className="relative">
                          <input type="text" value={signUpData.name} onChange={e => setSignUpData({...signUpData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Votre nom" required />
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 uppercase">Email Professionnel</label>
                       <div className="relative">
                          <input type="email" value={signUpData.email} onChange={e => setSignUpData({...signUpData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="nom@societe.com" required />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 uppercase">Organisation</label>
                       <div className="relative">
                          <input type="text" value={signUpData.organization} onChange={e => setSignUpData({...signUpData, organization: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Nom de votre entreprise" required />
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 uppercase">Mot de passe</label>
                       <div className="relative">
                          <input type="password" value={signUpData.password} onChange={e => setSignUpData({...signUpData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="••••••••" required />
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    S'inscrire & Commencer <ArrowRight className="w-4 h-4" />
                 </button>
                 
                 <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">Déjà un compte ? <button type="button" onClick={() => { setIsSignUpOpen(false); setIsLoginOpen(true); }} className="text-primary font-bold hover:underline">Se connecter</button></p>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-lg font-black text-slate-900">Connexion</h3>
                 <button onClick={() => setIsLoginOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="p-8 space-y-6">
                 {loginError && (
                     <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                         <X className="w-4 h-4" /> Email ou mot de passe incorrect.
                     </div>
                 )}

                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
                       <div className="relative">
                          <input type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="nom@societe.com" required />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 uppercase">Mot de passe</label>
                       <div className="relative">
                          <input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="••••••••" required />
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    Se connecter <LogIn className="w-4 h-4" />
                 </button>
                 
                 <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">Pas encore de compte ? <button type="button" onClick={() => { setIsLoginOpen(false); setIsSignUpOpen(true); }} className="text-primary font-bold hover:underline">S'inscrire</button></p>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
