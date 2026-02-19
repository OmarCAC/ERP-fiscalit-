
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DeclarationsManagement from './components/DeclarationsManagement';
import { NewDeclarationWizard } from './components/NewDeclarationWizard';
import PaymentsManagement from './components/PaymentsManagement';
import FiscalReports from './components/FiscalReports';
import HelpCenter from './components/HelpCenter';
import UserProfileSettings from './components/UserProfileSettings';
import LandingPage from './components/LandingPage';
import RegimesArchitecture from './components/RegimesArchitecture';
import RegimeDetails from './components/RegimeDetails';
import NAARates from './components/NAARates';
import NotificationsCenter from './components/NotificationsCenter';
import TaxpayerManagement from './components/TaxpayerManagement';
import TaxJurisdictionDirectory from './components/TaxJurisdictionDirectory';
import SystemParameters from './components/SystemParameters';
import FiscalPeriodManager from './components/FiscalPeriodManager';
import FiscalCalendar from './components/FiscalCalendar';
import { NotificationProvider } from './contexts/NotificationContext'; 
import { NotificationToaster } from './components/NotificationToaster'; 
import { ScenarioSimulator } from './components/ScenarioSimulator'; // IMPORT SIMULATOR

// Import Forms
import G1Form from './components/G1Form';
import G11Form from './components/G11Form';
import G13Form from './components/G13Form';
import G15Form from './components/G15Form';
import G17Form from './components/G17Form';
import G17BisForm from './components/G17BisForm';
import G17TerForm from './components/G17TerForm';
import G17UnifiedWizard from './components/G17UnifiedWizard';
import G29TerForm from './components/G29TerForm';
import G50CompletForm from './components/G50CompletForm';
import G50SimplifieForm from './components/G50SimplifieForm';
import G50TerForm from './components/G50TerForm';
import G51Form from './components/G51Form';
import GN12Form from './components/GN12Form';
import GN12BisForm from './components/GN12BisForm';
import CessationForm from './components/CessationForm';
import ExistenceForm from './components/ExistenceForm';
import SubscriptionForm from './components/SubscriptionForm';

import { AppView, Taxpayer, Declaration, FiscalPeriod, FiscalYear, BankAccount, G15Config, User, UserRole, Permission } from './types';
import { 
  INITIAL_TAXPAYERS, 
  INITIAL_DECLARATIONS, 
  INITIAL_FISCAL_YEARS, 
  INITIAL_FISCAL_PERIODS, 
  INITIAL_BANK_ACCOUNTS,
  DEFAULT_CONFIG_FIELDS,
  DEFAULT_CALENDAR_CONFIG,
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  INITIAL_NOTIFICATIONS,
  INITIAL_REGIME_CONFIG,
  INITIAL_G15_CONFIG,
  MOCK_USERS
} from './data/initial_data';
import { JURISDICTIONS } from './data/jurisdictions';
import { NAA_DATA, NAA_SECTIONS, DEFAULT_EXCLUSION_RULES } from './data/naa_data';

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // --- GESTION UTILISATEURS CENTRALISÉE ---
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); 

  // Data States
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>(INITIAL_TAXPAYERS);
  const [declarations, setDeclarations] = useState<Declaration[]>(INITIAL_DECLARATIONS);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(INITIAL_FISCAL_YEARS);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>(INITIAL_FISCAL_PERIODS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  
  // Context for Forms
  const [activeTaxpayerForForm, setActiveTaxpayerForForm] = useState<Taxpayer | null>(null);
  const [initialDecl, setInitialDecl] = useState<Declaration | null>(null);
  const [selectedPeriodForForm, setSelectedPeriodForForm] = useState<FiscalPeriod | undefined>(undefined);

  // System Config States
  const [configFields, setConfigFields] = useState(DEFAULT_CONFIG_FIELDS);
  const [calendarConfig, setCalendarConfig] = useState(DEFAULT_CALENDAR_CONFIG);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notificationChannels, setNotificationChannels] = useState(DEFAULT_NOTIFICATION_CHANNELS);
  const [notificationPreferences, setNotificationPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [regimeConfig, setRegimeConfig] = useState(INITIAL_REGIME_CONFIG);
  const [jurisdictions, setJurisdictions] = useState(JURISDICTIONS);
  const [naaData, setNaaData] = useState(NAA_DATA);
  const [naaSections, setNaaSections] = useState(NAA_SECTIONS);
  const [exclusionRules, setExclusionRules] = useState(DEFAULT_EXCLUSION_RULES);
  
  // NOUVEAU : État partagé pour la configuration G15
  const [g15Config, setG15Config] = useState<G15Config>(INITIAL_G15_CONFIG);
  
  // Settings
  const [locFieldSettings, setLocFieldSettings] = useState<any[]>([]);
  const [officialDecreeUrl, setOfficialDecreeUrl] = useState('https://www.mfdgi.gov.dz/');
  const [ifuThreshold, setIfuThreshold] = useState(8000000);
  const [minFiscal, setMinFiscal] = useState(30000);
  const [rateVente, setRateVente] = useState(5);
  const [rateService, setRateService] = useState(12);

  // Regime Details Context
  const [regimeDetailsContext, setRegimeDetailsContext] = useState({ 
    name: '', 
    activity: '', 
    activityCode: '', 
    estimatedCA: 0, 
    category: 'BIC' as 'BIC'|'BNC',
    typeContribuable: 'PHYSIQUE' as 'PHYSIQUE' | 'MORALE' | 'AGRICOLE'
  });

  const handleStart = () => setView('dashboard');

  // --- LOGIQUE AUTHENTIFICATION ---
  const handleLogin = (email: string, pass: string) => {
     const foundUser = users.find(u => u.email === email && (u.password === pass || !u.password)); 
     if (foundUser) {
        setCurrentUser(foundUser);
        setView('dashboard');
        return true;
     }
     return false;
  };

  const handleSignUp = (newUser: { name: string, email: string, organization: string, password?: string }) => {
     const user: User = {
        id: `u_${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password, 
        role: 'ADMIN',
        organization: newUser.organization,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=1173d4&color=fff`,
        permissions: ['VIEW', 'EDIT', 'CREATE', 'DELETE', 'VALIDATE', 'PAY', 'SETTINGS', 'RECTIFY']
     };

     setUsers(prev => [...prev, user]);
     setCurrentUser(user);
     setView('dashboard');
  };
  
  const handleDeclarationSubmit = (newDecl: Declaration) => {
    if (initialDecl) {
       setDeclarations(prev => prev.map(d => d.id === newDecl.id ? newDecl : d));
    } else {
       setDeclarations(prev => [newDecl, ...prev]);
    }
    setInitialDecl(null);
    setActiveTaxpayerForForm(null);
    setView('declarations');
  };

  const handleNewDeclaration = () => {
    setInitialDecl(null);
    setActiveTaxpayerForForm(null);
    setView('wizard');
  };

  const handleEditDeclaration = (id: string) => {
    const decl = declarations.find(d => d.id === id);
    if (decl) {
       setInitialDecl(decl);
       const taxpayer = taxpayers.find(t => t.dynamicData['1'] === decl.taxpayerName);
       setActiveTaxpayerForForm(taxpayer || null);

       const typeMap: Record<string, AppView> = {
         'G50 Mensuel': 'form_g50_complet',
         'G50 Simplifié': 'form_g50_simplifie',
         'G50 Ter (Salaires)': 'form_g50_ter',
         'Série G n°12 (Prévisionnelle)': 'form_gn12',
         'Série G n°12 Bis (Définitive)': 'form_gn12_bis',
         'Série G n°11 (Liasse BIC)': 'form_g11',
         'Série G n°13 (Liasse BNC)': 'form_g13',
         'Série G n°51 (Foncier)': 'form_g51',
         'Série G n°1 (Revenu Global)': 'form_g1',
         'Série G n°15 (Agricole)': 'form_g15',
         'Série G n°29 (Salaires Annuel)': 'form_g29',
         'Série G n°17 (Plus-Values Cession)': 'form_g17',
         'Série G n°17 Bis (Plus-Values Actions)': 'form_g17_bis',
         'Série G n°17 Ter (Plus-Values IBS)': 'form_g17_ter',
         'Existence (G n°08)': 'form_existence',
         'Cessation (D n°1 ter)': 'form_cessation',
       };

       const targetView = Object.entries(typeMap).find(([key]) => decl.type.includes(key))?.[1];
       if (targetView) setView(targetView);
       else alert("Formulaire non trouvé pour ce type de déclaration");
    }
  };

  const handleDeleteDeclaration = (id: string) => {
    if (confirm("Supprimer cette déclaration ?")) {
      setDeclarations(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleValidateDeclaration = (id: string) => {
    setDeclarations(prev => prev.map(d => d.id === id ? { ...d, status: 'VALIDÉ' } : d));
  };

  const handleFormSelectFromWizard = (formId: string, taxpayer: Taxpayer, period?: FiscalPeriod) => {
    setActiveTaxpayerForForm(taxpayer);
    setSelectedPeriodForForm(period);
    
    const mapping: Record<string, AppView> = {
      'G50_MENSUEL': 'form_g50_complet',
      'G50_SIMPLIFIE': 'form_g50_simplifie',
      'G50_TER': 'form_g50_ter',
      'G1': 'form_g1',
      'G11': 'form_g11',
      'G13': 'form_g13',
      'GN12': 'form_gn12',
      'GN12_BIS': 'form_gn12_bis',
      'G51': 'form_g51',
      'G15': 'form_g15',
      'G29': 'form_g29',
      'G17_UNIFIED': 'form_g17_unified',
      'EXISTENCE': 'form_existence',
      'CESSATION': 'form_cessation',
      'SUBSCRIPTION': 'form_subscription'
    };

    if (mapping[formId]) {
      setView(mapping[formId]);
    } else {
      console.error("Form ID unknown:", formId);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onStart={handleStart} onLogin={handleLogin} onSignUp={handleSignUp} />;
      case 'dashboard':
        return <Dashboard onViewChange={setView} taxpayers={taxpayers} declarations={declarations} />;
      
      // FORMULAIRES FISCAUX
      case 'form_g1':
        return <G1Form taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g11':
        return <G11Form taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g13':
        return <G13Form taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g15':
        return <G15Form taxpayer={activeTaxpayerForForm} g15Config={g15Config} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g17_unified':
        return <G17UnifiedWizard taxpayer={activeTaxpayerForForm} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g17':
        return <G17Form taxpayer={activeTaxpayerForForm} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g17_bis':
        return <G17BisForm taxpayer={activeTaxpayerForForm} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g17_ter':
        return <G17TerForm taxpayer={activeTaxpayerForForm} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g29':
        return <G29TerForm taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g50_complet':
        return <G50CompletForm onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g50_simplifie':
        return <G50SimplifieForm onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g50_ter':
        return <G50TerForm taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_g51':
        return <G51Form taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_gn12':
        return <GN12Form taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_gn12_bis':
        return <GN12BisForm taxpayer={activeTaxpayerForForm} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_cessation':
        return <CessationForm taxpayer={activeTaxpayerForForm} onBack={() => setView('declarations')} />;
      case 'form_existence':
        return <ExistenceForm taxpayer={activeTaxpayerForForm} initialData={initialDecl} onBack={() => setView('declarations')} onSubmit={handleDeclarationSubmit} />;
      case 'form_subscription':
        return <SubscriptionForm onBack={() => setView('dashboard')} />;
      
      // MODULES DE GESTION
      case 'wizard':
        return (
          <NewDeclarationWizard 
            taxpayers={taxpayers} 
            availablePeriods={fiscalPeriods} 
            onBack={() => setView('declarations')} 
            onSelectForm={handleFormSelectFromWizard}
            regimeConfig={regimeConfig}
          />
        );
      case 'declarations':
        return (
          <DeclarationsManagement 
            declarations={declarations} 
            taxpayers={taxpayers}
            fiscalYears={fiscalYears}
            currentUser={currentUser} 
            onNew={handleNewDeclaration} 
            onEdit={handleEditDeclaration}
            onDelete={handleDeleteDeclaration}
            onValidate={handleValidateDeclaration}
            onFillOfficial={handleEditDeclaration} 
          />
        );
      case 'payments':
        return <PaymentsManagement declarations={declarations} bankAccounts={bankAccounts} setBankAccounts={setBankAccounts} taxpayers={taxpayers} />;
      case 'reports':
        return <FiscalReports declarations={declarations} />;
      
      case 'calendar':
        return (
           <FiscalCalendar
              calendarConfig={calendarConfig}
              declarations={declarations}
              onAddReminder={(t, d) => alert(`Rappel ajouté pour : ${t}`)}
           />
        );
      case 'fiscal_periods':
        return (
          <FiscalPeriodManager 
             years={fiscalYears} 
             setYears={setFiscalYears} 
             periods={fiscalPeriods} 
             setPeriods={setFiscalPeriods}
             onDeclareNeant={(p) => alert(`Déclaration Néant générée pour ${p.label}`)}
          />
        );

      case 'notifications':
        return (
           <NotificationsCenter 
              channels={notificationChannels}
              setChannels={setNotificationChannels}
              preferences={notificationPreferences}
              setPreferences={setNotificationPreferences}
           />
        );
      case 'taxpayer_management':
        return (
          <TaxpayerManagement 
            taxpayers={taxpayers} 
            setTaxpayers={setTaxpayers} 
            onViewChange={setView}
            configFields={configFields}
            onContextUpdate={setRegimeDetailsContext}
            ifuThreshold={ifuThreshold}
            jurisdictions={jurisdictions}
            naaData={naaData}
            exclusionRules={exclusionRules}
            regimeConfig={regimeConfig}
          />
        );
      case 'regimes':
        return <RegimesArchitecture />;
      case 'regime_details':
        return <RegimeDetails onBack={() => setView('taxpayer_management')} context={regimeDetailsContext} />;
      case 'naa_rates':
        return <NAARates naaData={naaData} naaSections={naaSections} exclusionRules={exclusionRules} />;
      case 'tax_jurisdiction':
        return <TaxJurisdictionDirectory locFieldSettings={locFieldSettings} officialDecreeUrl={officialDecreeUrl} jurisdictions={jurisdictions} />;
      
      case 'system_parameters':
        return (
          <SystemParameters 
            configFields={configFields} setConfigFields={setConfigFields}
            locFieldSettings={locFieldSettings} setLocFieldSettings={setLocFieldSettings}
            officialDecreeUrl={officialDecreeUrl} setOfficialDecreeUrl={setOfficialDecreeUrl}
            ifuThreshold={ifuThreshold} setIfuThreshold={setIfuThreshold}
            minFiscal={minFiscal} setMinFiscal={setMinFiscal}
            rateVente={rateVente} setRateVente={setRateVente}
            rateService={rateService} setRateService={setRateService}
            jurisdictions={jurisdictions} setJurisdictions={setJurisdictions}
            naaData={naaData} setNaaData={setNaaData}
            naaSections={naaSections} setNaaSections={setNaaSections}
            exclusionRules={exclusionRules} setExclusionRules={setExclusionRules}
            calendarConfig={calendarConfig} setCalendarConfig={setCalendarConfig}
            regimeConfig={regimeConfig} setRegimeConfig={setRegimeConfig}
            g15Config={g15Config} setG15Config={setG15Config}
          />
        );
      
      case 'help':
        return <HelpCenter />;
      case 'profile':
      case 'settings':
        return <UserProfileSettings users={users} setUsers={setUsers} taxpayers={taxpayers} />;
      
      default:
        return <Dashboard onViewChange={setView} taxpayers={taxpayers} declarations={declarations} />;
    }
  };

  // Envelopper l'application avec le NotificationProvider pour tout le monde, y compris LandingPage
  return (
    <NotificationProvider currentUser={currentUser}>
      <div className="flex h-screen bg-[#f6f7f8] overflow-hidden">
        {view === 'landing' ? (
           <LandingPage onStart={handleStart} onLogin={handleLogin} onSignUp={handleSignUp} />
        ) : (
           <>
              <Sidebar currentView={view} onViewChange={setView} isOpen={isSidebarOpen} />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Navbar 
                  onViewChange={setView} 
                  currentView={view} 
                  toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  currentUser={currentUser} 
                  onSwitchUser={setCurrentUser} 
                />
                <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                  {renderContent()}
                </main>
              </div>
           </>
        )}
        {/* TOASTER DE NOTIFICATION GLOBAL */}
        <NotificationToaster />
        
        {/* SIMULATEUR DE SCENARIOS (PHASE 5) */}
        {currentUser.permissions.includes('SETTINGS') && (
           <ScenarioSimulator 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              declarations={declarations} 
              setDeclarations={setDeclarations} 
           />
        )}
      </div>
    </NotificationProvider>
  );
};
