

export type AppView = 
  | 'landing' 
  | 'dashboard' 
  | 'declarations' 
  | 'form_g1'
  | 'form_g17' 
  | 'form_g17_bis'
  | 'form_g17_ter'
  | 'form_g17_unified'
  | 'form_g11' 
  | 'form_g13'
  | 'form_g15'
  | 'form_g29'
  | 'form_g51'
  | 'form_subscription'
  | 'form_g50_ter'
  | 'form_g50_simplifie'
  | 'form_g50_complet'
  | 'form_gn12'
  | 'form_gn12_bis'
  | 'form_cessation'
  | 'form_existence'
  | 'wizard'
  | 'calendar' 
  | 'payments' 
  | 'reports' 
  | 'help' 
  | 'settings' 
  | 'profile' 
  | 'notifications' 
  | 'taxpayer_management' 
  | 'tax_jurisdiction' 
  | 'naa_rates'
  | 'regimes'
  | 'regime_details'
  | 'system_parameters'
  | 'fiscal_periods';

// --- TYPES UTILISATEURS & PERMISSIONS ---
export interface User {
  id: string;
  name: string;
  role: UserRole;
  organization: string;
  avatar: string;
  email: string;
  password?: string;
  // NOUVEAU : Permissions granulaires
  permissions: Permission[];
  // NOUVEAU : Préférences liées au profil pour le moteur de notif
  notificationSettings?: UserNotificationSettings;
}

export type UserRole = 'ADMIN' | 'COMPTABLE' | 'CLIENT';

// Liste exhaustive des actions possibles dans l'app
export type Permission = 
  | 'VIEW'        // Voir les données
  | 'EDIT'        // Modifier les brouillons
  | 'CREATE'      // Créer de nouvelles déclarations
  | 'DELETE'      // Supprimer des éléments
  | 'VALIDATE'    // Valider fiscalement (Générer PDF final)
  | 'PAY'         // Enregistrer un paiement
  | 'SETTINGS'    // Accéder aux paramètres système
  | 'RECTIFY';    // Créer une déclaration rectificative

// --- TYPES MOTEUR DE NOTIFICATION ---
export type NotificationEventType = 'DEADLINE' | 'PAYMENT' | 'SECURITY' | 'ADMIN' | 'INFO' | 'INSIGHT';

export interface UserNotificationSettings {
  deadline: { email: boolean; sms: boolean; push: boolean };
  payment: { email: boolean; sms: boolean; push: boolean };
  security: { email: boolean; sms: boolean; push: boolean };
  admin?: { email: boolean; sms: boolean; push: boolean };
}

export interface NotificationPayload {
  type: NotificationEventType;
  title: string;
  message: string;
  targetRoles: UserRole[]; // Qui devrait recevoir ça ?
  actionLink?: string;
  metaData?: any; // Données supplémentaires (ex: ID déclaration)
}

// --- TYPES EXISTANTS (Conservés) ---

export interface Taxpayer {
  id: string;
  typeContribuable: 'PHYSIQUE' | 'MORALE' | 'AGRICOLE';
  hasSalaries: boolean;
  employeeCount: number;
  regimeSelectionne: string;
  dynamicData: Record<string, string>;
  
  birthDate?: string;
  birthPlace?: string;
  familyStatus?: 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
  childrenCount?: number;
  spouse?: {
      name: string;
      birthDate: string;
      birthPlace: string;
      nif: string;
      nin: string;
  };
  personalAccounts?: {
      tresor?: string;
      postal?: string;
      bancaire?: string;
  };
  
  homeAddress?: string;
  partners?: Partner[];
  accountant?: AccountantInfo;
  landParcels?: LandParcel[]; 

  exonerations: {
    anade: boolean;
    cnac: boolean;
    angem: boolean;
    artisanat: boolean;
    autres: boolean;
  };
  commune: string;
  wilaya: string;
  wilayaCode: string;
  cpiRattachement: string;
  recetteAffectee: string;
  driRattachement: string;
  status: 'ACTIF' | 'RADIÉ' | 'SUSPENDU';
}

export interface Partner {
    id: string;
    name: string;
    share: number;
    address: string;
    nif: string;
    nin: string;
}

export interface AccountantInfo {
    salaried: boolean;
    name: string;
    address: string;
    nif: string;
    nin: string;
}

export interface LandParcel {
    id: string;
    name: string;
    wilaya: string;
    commune: string;
    area: { ha: number, a: number, ca: number };
    zoneType: string;
    isNew: boolean;
    article: string;
    cropType: string;
}

export interface Declaration {
  id: string;
  taxpayerName?: string; 
  type: string;
  period: string;
  regime: string;
  submissionDate: string;
  status: 'BROUILLON' | 'EN COURS' | 'VALIDÉ' | 'TRANSMIS' | 'REÇUE' | 'ACCEPTÉE' | 'REJETÉE' | 'EN RETARD' | 'PAYÉE' | 'À Payer' | 'ARCHIVÉE';
  amount: number;
  paymentDate?: string;
  paymentDetails?: {
      method: string;
      reference: string;
  };
}

export interface BankAccount {
  id: string;
  taxpayerId: string;
  type: 'BANCAIRE' | 'POSTAL' | 'TRESOR';
  bankName: string;
  rib: string;
  owner: string;
  isDefault: boolean;
  logoColor: string;
}

export interface FiscalYear {
  year: number;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  progress: number;
  declarationsCount: number;
  isDefault: boolean;
}

export interface FiscalPeriod {
    id: string;
    label: string;
    type: 'MONTH' | 'TRIMESTER' | 'ANNUAL';
    year: number;
    index: number; 
    deadline: string;
    status: PeriodStatus;
    declarationsLinked: number;
}

export type PeriodStatus = 'LOCKED' | 'OPEN' | 'CLOSED' | 'WARNING';

export interface CalendarConfig {
  general: {
    weekends: number[]; 
    fiscalStartMonth: number;
    dateFormat: string;
  };
  categories: { id: string, label: string, color: string }[];
  alerts: { warningDays: number, criticalDays: number };
  holidays: Holiday[];
  rules: FiscalRule[];
}

export interface Holiday {
    id: string;
    date: string; // MM-DD
    label: string;
}

export interface FiscalRule {
    id: string;
    title: string;
    categoryId: string;
    frequency: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';
    dayDeadline: number | string; // Jour du mois ou date spécifique (MM-DD)
    description: string;
}

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  desc: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'read' | 'unread';
  regime?: string;
  icon?: any;
  color?: string;
  insightData?: {
     trend: 'UP' | 'DOWN';
     value: string;
     benchmark: string;
  };
  action?: string;
  snoozedUntil?: number;
}

export interface NotificationChannels {
    email: ChannelConfig;
    whatsapp: ChannelConfig;
    sms: ChannelConfig;
}

export interface ChannelConfig {
    enabled: boolean;
    address?: string; // email ou numéro
    number?: string;
    notifyOn: string[]; // Types d'événements
}

export interface NotificationPreferences {
    general: {
        doNotDisturb: boolean;
        dndStart: string;
        dndEnd: string;
        weekendPause: boolean;
    };
    deadlines: {
        reminderDays: number[]; // ex: [7, 3, 1, 0]
        alertCritical: boolean;
    };
    matrix: Record<string, { email?: boolean, push?: boolean, sms?: boolean, whatsapp?: boolean, targetRole?: string }>;
}

export interface NotificationLog {
    id: string;
    date: string;
    channel: string;
    recipient: string;
    event: string;
    status: 'SENT' | 'DELIVERED' | 'OPENED' | 'FAILED';
}

export interface ConfigField {
  id: string;
  label: string;
  nature: 'alphanumeric' | 'numeric' | 'date' | 'email' | 'nif' | 'nin' | 'article';
  maxLength: number;
  inputType: 'free' | 'specified';
  options?: string; 
  required: boolean;
  section: 'IDENTIFICATION' | 'ACTIVITE' | 'FISCAL' | 'CONTACT' | 'AUTRE' | 'FAMILLE' | 'BANQUE'; 
  targetTypes?: ('PHYSIQUE' | 'MORALE' | 'AGRICOLE')[];
}

export interface LocFieldSetting {
  id: 'wilaya' | 'dri' | 'cpi' | 'commune';
  label: string;
  visible: boolean;
  required: boolean;
  nature: 'alphanumeric' | 'numeric'; 
  maxLength: number;
}

export interface ExclusionRule {
  id: string;
  type: 'CODE' | 'SECTION' | 'KEYWORD';
  value: string;
  reason: string;
  ref: string;
  regime: string;
}

export interface RegimeConfig {
    id: string;
    label: string;
    color: string;
    allowedForms: string[];
    employeeThresholdRule?: {
        active: boolean;
        threshold: number;
        belowFormId: string;
        aboveFormId: string;
    };
}

export interface G15Config {
    cultures: { id: string, label: string, value: number }[];
    elevage: { id: string, label: string, value: number }[];
    zones: { id: string, label: string, rate: number }[];
    irgScale: { min: number, max: number, rate: number }[];
    acompteRate: number;
}