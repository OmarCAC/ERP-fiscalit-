
import { Taxpayer, ConfigField, Declaration, BankAccount, FiscalYear, FiscalPeriod, CalendarConfig, AppNotification, NotificationChannels, NotificationPreferences, RegimeConfig, G15Config, User } from '../types';

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Ahmed Benali', 
    role: 'ADMIN', 
    avatar: 'https://picsum.photos/id/64/50/50',
    organization: 'SARL TechSolutions',
    email: 'expert@cabinet.dz',
    password: '123', // Mot de passe pour test
    permissions: ['VIEW', 'EDIT', 'CREATE', 'DELETE', 'VALIDATE', 'PAY', 'SETTINGS', 'RECTIFY'],
    notificationSettings: {
        deadline: { email: true, sms: true, push: true },
        payment: { email: true, sms: true, push: true },
        security: { email: true, sms: true, push: true },
        admin: { email: true, sms: false, push: true }
    }
  },
  { 
    id: 'u2', 
    name: 'Sarah Comptable', 
    role: 'COMPTABLE', 
    avatar: 'https://picsum.photos/id/32/50/50',
    organization: 'SARL TechSolutions',
    email: 'sarah@cabinet.dz',
    password: '123', // Mot de passe pour test
    permissions: ['VIEW', 'EDIT', 'CREATE', 'RECTIFY'], // Pas de validation, ni de paiement
    notificationSettings: {
        deadline: { email: true, sms: false, push: true },
        payment: { email: true, sms: false, push: false },
        security: { email: true, sms: false, push: false },
        admin: { email: false, sms: false, push: false }
    }
  },
  { 
    id: 'u3', 
    name: 'M. Le Gérant', 
    role: 'CLIENT', 
    avatar: 'https://picsum.photos/id/55/50/50',
    organization: 'Client Externe',
    email: 'client@societe.dz',
    password: '123', // Mot de passe pour test
    permissions: ['VIEW', 'PAY', 'VALIDATE'], // Peut payer et valider formellement
    notificationSettings: {
        deadline: { email: false, sms: true, push: true },
        payment: { email: true, sms: true, push: false },
        security: { email: true, sms: true, push: false },
        admin: { email: false, sms: false, push: false }
    }
  }
];

export const INITIAL_TAXPAYERS: Taxpayer[] = [
  {
    id: '1',
    typeContribuable: 'MORALE',
    hasSalaries: true,
    employeeCount: 12,
    regimeSelectionne: 'NORMAL',
    dynamicData: {
      '1': 'SARL TECH SOLUTIONS',
      '2': '000111222333444',
      'nin': '123456789012345',
      'article_imp': '123456789',
      '7': 'Développement de logiciels et conseil informatique',
      'code_act': '62.01',
      'adresse': '12 Rue de la Liberté, Alger Centre',
      'commune': 'Alger Centre',
      'wilaya': 'Alger',
      'wilaya_code': '16',
      'rc': '16/00-1234567B12',
      'tel': '0550 12 34 56',
      'ca_estim': '12000000'
    },
    // Données par défaut pour Morale (Souvent non applicable mais nécessaire pour le type)
    birthDate: '', 
    birthPlace: '',
    familyStatus: undefined,
    childrenCount: 0,
    
    // G11 SUPPORT
    homeAddress: 'Cité des Asphodèles, Villa 45, Ben Aknoun, Alger',
    partners: [
        { id: 'p1', name: 'BENALI Ahmed', share: 60, address: 'Cité des Asphodèles, Villa 45, Ben Aknoun', nif: '19801600001', nin: '1801600001' },
        { id: 'p2', name: 'KADRI Samir', share: 40, address: 'Rue Didouche Mourad, Alger', nif: '19821600002', nin: '1821600002' }
    ],
    accountant: {
        salaried: false,
        name: 'Cabinet Expert COMPTA-PRO',
        address: 'Hydra, Alger',
        nif: '0998160000333',
        nin: '1661600033'
    },

    exonerations: { anade: false, cnac: false, angem: false, artisanat: false, autres: false },
    commune: 'Alger Centre',
    wilaya: 'Alger',
    wilayaCode: '16',
    cpiRattachement: 'CPI Alger Centre',
    recetteAffectee: 'Recette Principale',
    driRattachement: 'ALGER',
    status: 'ACTIF'
  },
  {
    id: '2',
    typeContribuable: 'PHYSIQUE',
    hasSalaries: false,
    employeeCount: 1,
    regimeSelectionne: 'IFU',
    dynamicData: {
      '1': 'AHMED BENALI (EPICERIE EL BARAKA)',
      '2': '198016000000001',
      'nin': '1801600000',
      'article_imp': '987654321',
      '7': 'Commerce de détail alimentation générale',
      'code_act': '47.11',
      'adresse': 'Cité des Palmiers, Biskra',
      'commune': 'Biskra',
      'wilaya': 'Biskra',
      'wilaya_code': '07',
      'rc': '07/00-9876543A12',
      'tel': '0661 98 76 54',
      'ca_estim': '5000000'
    },
    // NOUVELLES DONNÉES G1
    birthDate: '1980-05-15',
    birthPlace: 'Biskra',
    familyStatus: 'MARIE',
    spouse: {
        name: 'Fatima Zohra KADRI',
        birthDate: '1985-02-20',
        birthPlace: 'Oran',
        nif: '',
        nin: ''
    },
    childrenCount: 3,
    personalAccounts: {
        postal: '12345678 99',
        bancaire: '002 00012 1234567890 22'
    },
    
    // G11 SUPPORT (Même pour physique, parfois utile pour domicile)
    homeAddress: 'Cité des Palmiers, Bloc A, Apt 4, Biskra',
    partners: [],
    accountant: {
        salaried: false,
        name: 'Bureau Comptable EL AMANE',
        address: 'Centre Ville, Biskra',
        nif: '0990070000111',
        nin: ''
    },

    exonerations: { anade: false, cnac: false, angem: true, artisanat: false, autres: false },
    commune: 'Biskra',
    wilaya: 'Biskra',
    wilayaCode: '07',
    cpiRattachement: 'CPI de Biskra Est',
    recetteAffectee: 'Recette de Biskra Est',
    driRattachement: 'CONSTANTINE',
    status: 'ACTIF'
  },
  {
    id: '3',
    typeContribuable: 'PHYSIQUE',
    hasSalaries: true,
    employeeCount: 2,
    regimeSelectionne: 'SIMPLIFI',
    dynamicData: {
      '1': 'CABINET MEDICAL DR. MOURAD',
      '2': '197516000000002',
      'nin': '1751600000',
      'article_imp': '456123789',
      '7': 'Activité des médecins généralistes',
      'code_act': '86.21',
      'adresse': 'Boulevard de la Soummam, Oran',
      'commune': 'Oran',
      'wilaya': 'Oran',
      'wilaya_code': '31',
      'agrement': 'DSP-31/2010',
      'tel': '041 33 22 11',
      'ca_estim': '9500000'
    },
    birthDate: '1975-11-03',
    birthPlace: 'Alger',
    familyStatus: 'MARIE',
    childrenCount: 2,
    
    homeAddress: 'Résidence Oran Ouest, Oran',
    
    exonerations: { anade: false, cnac: false, angem: false, artisanat: false, autres: false },
    commune: 'Oran',
    wilaya: 'Oran',
    wilayaCode: '31',
    cpiRattachement: 'CPI d\'Oran Est à Bir El Djir',
    recetteAffectee: 'Recette d\'Oran Est',
    driRattachement: 'ORAN',
    status: 'ACTIF'
  },
  // NOUVEAU CONTRIBUABLE : EXPLOITATION AGRICOLE (COLLECTIVE)
  {
    id: '4',
    typeContribuable: 'PHYSIQUE', // Considéré comme physique pour le régime, mais gestion collective
    hasSalaries: true,
    employeeCount: 5,
    regimeSelectionne: 'NORMAL', // Souvent normal pour l'agricole important
    dynamicData: {
      '1': 'EXPLOITATION AGRICOLE HÉRITIERS ZIANI',
      '2': '199007000055555',
      'nin': '1900700005',
      'article_imp': '998877665',
      '7': 'Cultures céréalières et élevage',
      'code_act': '01.11', // Céréales
      'adresse': 'Lieu-dit El-Maader, Commune El-Outaya',
      'commune': 'El Outaya',
      'wilaya': 'Biskra',
      'wilaya_code': '07',
      'carte_fellah': '07/2020/54321',
      'tel': '0660 11 22 33',
      'ca_estim': '15000000'
    },
    homeAddress: 'Lieu-dit El-Maader',
    
    // PARTENAIRES (INDIVISION)
    partners: [
        { id: 'z1', name: 'ZIANI Mohamed (Gérant)', share: 40, address: 'Cité 500 Logts, Biskra', nif: '19700700001', nin: '170070001' },
        { id: 'z2', name: 'ZIANI Ali', share: 30, address: 'El Outaya Centre', nif: '19750700002', nin: '175070002' },
        { id: 'z3', name: 'ZIANI Youssef', share: 30, address: 'Alger (Résident hors wilaya)', nif: '19801600003', nin: '180160003' }
    ],

    // PATRIMOINE FONCIER PERSISTANT
    landParcels: [
        { 
            id: 'lp1', name: 'Parcelle El-Maader Nord', wilaya: 'Biskra', commune: 'El Outaya', 
            area: { ha: 25, a: 0, ca: 0 }, zoneType: 'SUD', isNew: false, article: '998877665', cropType: 'Céréales' 
        },
        { 
            id: 'lp2', name: 'Verger des Oliviers', wilaya: 'Biskra', commune: 'El Outaya', 
            area: { ha: 5, a: 50, ca: 0 }, zoneType: 'SUD', isNew: true, article: '998877665', cropType: 'Arboriculture' 
        }
    ],

    exonerations: { anade: false, cnac: false, angem: false, artisanat: false, autres: false },
    commune: 'El Outaya',
    wilaya: 'Biskra',
    wilayaCode: '07',
    cpiRattachement: 'CPI de Biskra Ouest',
    recetteAffectee: 'Recette de Biskra Ouest',
    driRattachement: 'CONSTANTINE',
    status: 'ACTIF'
  }
];

export const DEFAULT_CONFIG_FIELDS: ConfigField[] = [
  // IDENTIFICATION (Commun)
  { id: '1', label: 'Raison Sociale / Nom', nature: 'alphanumeric', maxLength: 100, inputType: 'free', required: true, section: 'IDENTIFICATION', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },
  { id: '2', label: 'NIF (Matricule Fiscal)', nature: 'nif', maxLength: 15, inputType: 'free', required: true, section: 'IDENTIFICATION', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },
  { id: 'nin', label: 'NIN', nature: 'nin', maxLength: 18, inputType: 'free', required: false, section: 'IDENTIFICATION', targetTypes: ['PHYSIQUE', 'AGRICOLE'] },
  { id: 'rc', label: 'Registre de Commerce', nature: 'alphanumeric', maxLength: 20, inputType: 'free', required: true, section: 'IDENTIFICATION', targetTypes: ['PHYSIQUE', 'MORALE'] },
  { id: 'carte_fellah', label: 'Carte Fellah', nature: 'alphanumeric', maxLength: 20, inputType: 'free', required: true, section: 'IDENTIFICATION', targetTypes: ['AGRICOLE'] },
  
  // FAMILLE (Physique uniquement)
  { id: 'prenom_pere', label: 'Prénom du Père', nature: 'alphanumeric', maxLength: 50, inputType: 'free', required: true, section: 'FAMILLE', targetTypes: ['PHYSIQUE', 'AGRICOLE'] },
  { id: 'nom_mere', label: 'Nom de jeune fille de la Mère', nature: 'alphanumeric', maxLength: 50, inputType: 'free', required: true, section: 'FAMILLE', targetTypes: ['PHYSIQUE', 'AGRICOLE'] },
  { id: 'prenom_mere', label: 'Prénom de la Mère', nature: 'alphanumeric', maxLength: 50, inputType: 'free', required: true, section: 'FAMILLE', targetTypes: ['PHYSIQUE', 'AGRICOLE'] },

  // BANQUE (Commun)
  { id: 'swift_code', label: 'Code SWIFT/BIC', nature: 'alphanumeric', maxLength: 11, inputType: 'free', required: false, section: 'BANQUE', targetTypes: ['PHYSIQUE', 'MORALE'] },
  { id: 'devise_compte', label: 'Devise Principale', nature: 'alphanumeric', maxLength: 3, inputType: 'specified', options: 'DZD,EUR,USD', required: true, section: 'BANQUE', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },

  // FISCAL & ACTIVITE (Commun)
  { id: 'article_imp', label: 'Article d\'Imposition', nature: 'article', maxLength: 11, inputType: 'free', required: true, section: 'FISCAL', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },
  { id: '7', label: 'Libellé Activité', nature: 'alphanumeric', maxLength: 200, inputType: 'free', required: true, section: 'ACTIVITE', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },
  { id: 'code_act', label: 'Code Activité (NAA)', nature: 'alphanumeric', maxLength: 10, inputType: 'free', required: true, section: 'ACTIVITE', targetTypes: ['PHYSIQUE', 'MORALE'] },
  { id: 'ca_estim', label: 'Chiffre d\'Affaires Estimé', nature: 'numeric', maxLength: 20, inputType: 'free', required: false, section: 'FISCAL', targetTypes: ['PHYSIQUE', 'MORALE'] },
  
  // SPECIFIQUE MORALE
  { id: 'capital_social', label: 'Capital Social', nature: 'numeric', maxLength: 20, inputType: 'free', required: true, section: 'IDENTIFICATION', targetTypes: ['MORALE'] },

  // SPECIFIQUE AGRICOLE
  { id: 'agri_surface', label: 'Superficie Totale (Ha)', nature: 'numeric', maxLength: 10, inputType: 'free', required: false, section: 'ACTIVITE', targetTypes: ['AGRICOLE'] },

  // CONTACT (Commun)
  { id: 'adresse', label: 'Adresse du Siège', nature: 'alphanumeric', maxLength: 200, inputType: 'free', required: true, section: 'CONTACT', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },
  { id: 'tel', label: 'Téléphone', nature: 'alphanumeric', maxLength: 15, inputType: 'free', required: false, section: 'CONTACT', targetTypes: ['PHYSIQUE', 'MORALE', 'AGRICOLE'] },
];

export const INITIAL_DECLARATIONS: Declaration[] = [
  { id: 'G50-MAR-24', taxpayerName: 'SARL TECH SOLUTIONS', type: 'G50 Mensuel', period: 'Mars 2024', regime: 'Réel Normal', amount: 412000, status: 'PAYÉE', submissionDate: '2024-04-15' },
  { id: 'G12-2023', taxpayerName: 'SARL TECH SOLUTIONS', type: 'G12 Annuelle', period: '2023', regime: 'IFU', amount: 30000, status: 'EN RETARD', submissionDate: '2023-06-30' }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'bk_1', taxpayerId: '1', type: 'BANCAIRE', bankName: 'BEA', rib: '00200012123456789018', owner: 'SARL TECH SOLUTIONS', isDefault: true, logoColor: 'text-slate-800' }
];

export const INITIAL_FISCAL_YEARS: FiscalYear[] = [
  // 2026 Ajouté et OUVERT par défaut
  { year: 2026, status: 'OPEN', progress: 0, declarationsCount: 0, isDefault: true },
  { year: 2025, status: 'OPEN', progress: 15, declarationsCount: 0, isDefault: false },
  { year: 2024, status: 'OPEN', progress: 35, declarationsCount: 3, isDefault: false },
  { year: 2023, status: 'CLOSED', progress: 100, declarationsCount: 12, isDefault: false },
  { year: 2022, status: 'ARCHIVED', progress: 100, declarationsCount: 12, isDefault: false },
  { year: 2021, status: 'ARCHIVED', progress: 100, declarationsCount: 12, isDefault: false },
];

// Helper pour générer rapidement les données initiales
const generatePeriods = () => {
    const periods: FiscalPeriod[] = [];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    // Années à générer (2026 inclus)
    [2023, 2024, 2025, 2026].forEach(year => {
        // Détermine le statut par défaut de l'année
        let periodStatus: 'OPEN' | 'CLOSED' | 'LOCKED' = 'LOCKED';
        if (year < 2024) periodStatus = 'CLOSED';
        else if (year >= 2024) periodStatus = 'OPEN'; // Ouvre 2024, 2025 et 2026 par défaut

        // Mois
        months.forEach((m, i) => {
            periods.push({
                id: `m_${i+1}_${year}`, 
                label: m, 
                type: 'MONTH', 
                year: year, 
                index: i+1,
                deadline: `20 ${months[Math.min(11, i+1)]} ${year}`, 
                status: periodStatus, 
                declarationsLinked: 0
            });
        });
        // Trimestres
        [1, 2, 3, 4].forEach(t => {
            const deadlineMonth = t === 4 ? 'Janvier' : months[t*3];
            const deadlineYear = t === 4 ? year + 1 : year;
            periods.push({
                id: `t_${t}_${year}`, 
                label: `${t}e Trimestre`, 
                type: 'TRIMESTER', 
                year: year, 
                index: t,
                deadline: `20 ${deadlineMonth} ${deadlineYear}`, 
                status: periodStatus, 
                declarationsLinked: 0
            });
        });
        // Annuel
        periods.push({
            id: `y_${year}`, 
            label: `Exercice ${year}`, 
            type: 'ANNUAL', 
            year: year, 
            index: 1,
            deadline: `30 Avril ${year + 1}`, 
            status: periodStatus, 
            declarationsLinked: 0
        });
    });
    return periods;
};

export const INITIAL_FISCAL_PERIODS: FiscalPeriod[] = generatePeriods();

export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  general: { weekends: [5, 6], fiscalStartMonth: 0, dateFormat: 'DD/MM/YYYY' },
  categories: [
    { id: 'FISCAL', label: 'Fiscalité', color: 'bg-blue-500' },
    { id: 'SOCIAL', label: 'Social', color: 'bg-green-500' }
  ],
  alerts: { warningDays: 5, criticalDays: 2 },
  holidays: [{ id: 'h1', date: '01-01', label: 'Nouvel An' }, { id: 'h2', date: '05-01', label: 'Fête du Travail' }, { id: 'h3', date: '05-07', label: 'Fête de l\'Indépendance' }],
  rules: [
    { id: 'r1', title: 'G50 Mensuel', categoryId: 'FISCAL', frequency: 'MENSUEL', dayDeadline: 20, description: 'Déclaration mensuelle des impôts' }
  ]
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'DEADLINE', title: 'Échéance G50 Avril', desc: 'Déclaration mensuelle à soumettre avant le 20 Mai.', date: 'J-5', priority: 'medium', status: 'unread', regime: 'ALL' }
];

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannels = {
  email: { enabled: true, address: '', notifyOn: ['DEADLINE', 'STATUS'] },
  whatsapp: { enabled: false, number: '', notifyOn: [] },
  sms: { enabled: false, number: '', notifyOn: ['DEADLINE'] }
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  general: { doNotDisturb: false, dndStart: '22:00', dndEnd: '07:00', weekendPause: true },
  deadlines: { reminderDays: [7, 3, 1], alertCritical: true },
  matrix: {
    deadline: { email: true, push: true, sms: false, whatsapp: false, targetRole: 'ALL' },
    payment: { email: true, push: true, sms: false, whatsapp: false, targetRole: 'ACCOUNTANT' },
    admin: { email: true, push: false, sms: false, whatsapp: false, targetRole: 'MANAGER' },
    security: { email: true, push: true, sms: true, whatsapp: false, targetRole: 'ALL' }
  }
};

export const INITIAL_REGIME_CONFIG: RegimeConfig[] = [
  { 
    id: 'IFU', 
    label: 'Impôt Forfaitaire Unique', 
    color: 'bg-blue-500', 
    // G50_MENSUEL remplace les anciens simplifiés/complets
    allowedForms: ['GN12', 'GN12_BIS', 'G50_TER', 'G50_MENSUEL', 'G15', 'EXISTENCE', 'CESSATION'],
    employeeThresholdRule: { active: true, threshold: 9, belowFormId: 'G50_TER', aboveFormId: 'G50_MENSUEL' }
  },
  { 
    id: 'SIMPLIFI', 
    label: 'Régime Simplifié', 
    color: 'bg-orange-500', 
    // G17_UNIFIED remplace G17
    allowedForms: ['G1', 'G50_MENSUEL', 'G50_TER', 'G13', 'G17_UNIFIED', 'G15', 'EXISTENCE', 'CESSATION'],
    employeeThresholdRule: { active: true, threshold: 9, belowFormId: 'G50_TER', aboveFormId: 'G50_MENSUEL' }
  },
  { 
    id: 'NORMAL', 
    label: 'Régime Réel Normal', 
    color: 'bg-emerald-500', 
    // G17_UNIFIED remplace G17_TER
    allowedForms: ['G1', 'G50_MENSUEL', 'G50_TER', 'G11', 'G17_UNIFIED', 'G15', 'EXISTENCE', 'CESSATION'],
    employeeThresholdRule: { active: true, threshold: 9, belowFormId: 'G50_TER', aboveFormId: 'G50_MENSUEL' }
  }
];

// --- G15 DEFAULT CONFIG ---
export const INITIAL_G15_CONFIG: G15Config = {
  cultures: [
      { id: 'fourrageres', label: 'Cultures Fourragères', value: 40000 },
      { id: 'industrielles', label: 'Cultures Industrielles', value: 80000 },
      { id: 'maraicheres', label: 'Cultures Maraîchères', value: 150000 },
      { id: 'arboriculture', label: 'Arboriculture', value: 100000 },
      { id: 'cereales', label: 'Céréales', value: 50000 },
      { id: 'legumes_secs', label: 'Légumes Secs', value: 60000 },
      { id: 'vignes', label: 'Vignes', value: 100000 },
      { id: 'palmiers', label: 'Palmiers Dattiers', value: 200000 },
      { id: 'autres', label: 'Autres', value: 50000 },
  ],
  elevage: [
      { id: 'bovins', label: 'Bovins (Vache/Taureau)', value: 15000 },
      { id: 'ovins', label: 'Ovins (Brebis/Mouton)', value: 3000 },
      { id: 'caprins', label: 'Caprins (Chèvre)', value: 2500 },
      { id: 'camelins', label: 'Camelins (Chameau)', value: 20000 },
      { id: 'volaille', label: 'Volaille', value: 100 },
      { id: 'lapins', label: 'Lapins', value: 1000 },
  ],
  zones: [
      { id: 'SUD', label: 'Sud (Sahara)', rate: 50 },
      { id: 'HAUTS_PLATEAUX', label: 'Hauts Plateaux', rate: 25 },
      { id: 'MONTAGNE', label: 'Zone de Montagne', rate: 25 },
      { id: 'TERRE_NOUVELLE', label: 'Mise en valeur', rate: 100 },
      { id: 'NORD', label: 'Nord (Standard)', rate: 0 },
      { id: 'AUTRE', label: 'Autre région', rate: 0 },
  ],
  irgScale: [
      { min: 0, max: 240000, rate: 0 },
      { min: 240001, max: 480000, rate: 23 },
      { min: 480001, max: 960000, rate: 27 },
      { min: 960001, max: 1920000, rate: 30 },
      { min: 1920001, max: 3840000, rate: 33 },
      { min: 3840001, max: 99999999999, rate: 35 },
  ],
  acompteRate: 30
};
