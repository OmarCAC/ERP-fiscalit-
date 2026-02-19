
import { ExclusionRule } from '../types';

export interface NAAActivity {
  code: string;
  label: string;
  section: string;
  type: 'BIC' | 'BNC';
  category: 'Production' | 'Commerce' | 'Services';
  ifu: string;
  ibs: string;
  tva: string;
  exoneration: string;
}

export interface ExclusionResult {
  isExcluded: boolean;
  reason?: string;
  ref?: string;
  regime?: string;
}

export const DEFAULT_EXCLUSION_RULES: ExclusionRule[] = [
  // EXCLUSIONS PAR SECTION (HISTORIQUE + LF 2025)
  { id: 'sec_f', type: 'SECTION', value: 'F', reason: 'Secteur BTP/Hydraulique/Promotion (Volumétrie)', ref: 'Art. 282 ter CIDTA', regime: 'RÉEL NORMAL' },
  { id: 'sec_k', type: 'SECTION', value: 'K', reason: 'Activités Financières & Assurance', ref: 'Art. 282 ter CIDTA', regime: 'RÉEL NORMAL' },
  { id: 'sec_p', type: 'SECTION', value: 'P', reason: 'Enseignement et Formation (Tous cycles)', ref: 'LF 2025 (Art. 22)', regime: 'RÉEL / BNC' },
  
  // EXCLUSIONS PAR CODES SPÉCIFIQUES (LF 2025)
  { id: 'lf25_alcohol', type: 'CODE', value: '56.30', reason: 'Débits de boissons alcoolisées', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_tabac', type: 'CODE', value: '46.35', reason: 'Collecte/Distribution tabac', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_traiteur', type: 'CODE', value: '56.21', reason: 'Traiteur et Catering', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_salles', type: 'CODE', value: '77.39', reason: 'Location de salles', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_hyper', type: 'CODE', value: '47.19', reason: 'Grande Surface (Hypermarché)', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_loc_veh', type: 'CODE', value: '77.11', reason: 'Location Véhicules Tourisme', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_loc_util', type: 'CODE', value: '77.12', reason: 'Location Véhicules Utilitaires', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_loc_engin', type: 'CODE', value: '77.32', reason: 'Location Engins BTP', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_voyage', type: 'CODE', value: '79.11', reason: 'Agences de Voyage', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_tour', type: 'CODE', value: '79.12', reason: 'Voyagistes (Tour Operators)', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_pub', type: 'CODE', value: '73.11', reason: 'Agences de Publicité', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_regie', type: 'CODE', value: '73.12', reason: 'Régie Publicitaire', ref: 'LF 2025', regime: 'RÉEL NORMAL' },
  { id: 'lf25_assur', type: 'CODE', value: '66.22', reason: 'Courtage Assurance', ref: 'LF 2025', regime: 'RÉEL NORMAL' },

  // EXCLUSIONS HISTORIQUES PAR CODES
  { id: 'hist_promo', type: 'CODE', value: '41.10', reason: 'Promotion Immobilière', ref: 'Loi 11-04 / Art 282 ter', regime: 'RÉEL NORMAL' },
  { id: 'hist_clinique', type: 'CODE', value: '86.10', reason: 'Activités Hospitalières (Cliniques)', ref: 'Réglementation Santé', regime: 'RÉEL NORMAL' },

  // EXCLUSIONS PAR MOTS-CLÉS
  { id: 'kw_import', type: 'KEYWORD', value: 'IMPORTATION', reason: 'Importation pour revente en l\'état', ref: 'Art. 282 ter CIDTA', regime: 'RÉEL NORMAL' },
  { id: 'kw_gros', type: 'KEYWORD', value: 'GROS', reason: 'Commerce de Gros', ref: 'Art. 282 ter CIDTA', regime: 'RÉEL NORMAL' },
  { id: 'kw_conc', type: 'KEYWORD', value: 'CONCESSIONNAIRE', reason: 'Concessionnaire Automobile', ref: 'Art. 282 ter CIDTA', regime: 'RÉEL NORMAL' },
  { id: 'kw_or', type: 'KEYWORD', value: 'METAUX PRECIEUX', reason: 'Métaux Précieux / Or', ref: 'Réglementation Spécifique', regime: 'RÉEL NORMAL' },
];

// --- MOTEUR DE DÉTECTION DYNAMIQUE ---
export const detectExclusion = (code: string, label: string, rules: ExclusionRule[] = DEFAULT_EXCLUSION_RULES): ExclusionResult => {
  const codeClean = code.replace(/\./g, '').trim().toUpperCase();
  const labelUpper = label.toUpperCase();

  for (const rule of rules) {
    if (rule.type === 'CODE') {
      // Vérifie si le code commence par la valeur de la règle (ex: 56.30 couvre 56.30A, 56.30Z)
      const ruleCodeClean = rule.value.replace(/\./g, '').trim().toUpperCase();
      if (codeClean.startsWith(ruleCodeClean)) {
        return { isExcluded: true, reason: rule.reason, ref: rule.ref, regime: rule.regime };
      }
    } else if (rule.type === 'SECTION') {
      // Suppose que le code est passé, mais on a besoin de la section. 
      // Si la section n'est pas dispo ici, on peut déduire par le code (ex: F = 41, 42, 43)
      // Simplification : On vérifie les préfixes standards des sections NAA
      const sectionPrefixes: Record<string, string[]> = {
        'F': ['41', '42', '43'],
        'K': ['64', '65', '66'],
        'P': ['85'],
        'Q': ['86', '87', '88']
      };
      if (sectionPrefixes[rule.value] && sectionPrefixes[rule.value].some(p => codeClean.startsWith(p))) {
        return { isExcluded: true, reason: rule.reason, ref: rule.ref, regime: rule.regime };
      }
    } else if (rule.type === 'KEYWORD') {
      if (labelUpper.includes(rule.value.toUpperCase())) {
        return { isExcluded: true, reason: rule.reason, ref: rule.ref, regime: rule.regime };
      }
    }
  }

  return { isExcluded: false };
};

export const NAA_SECTIONS = [
  { id: 'A', label: 'AGRICULTURE, SYLVICULTURE ET PÊCHE', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800' },
  { id: 'B', label: 'INDUSTRIES EXTRACTIVES', img: 'https://images.unsplash.com/photo-1578319439584-104c94d37305?auto=format&fit=crop&q=80&w=800' },
  { id: 'C', label: 'INDUSTRIE MANUFACTURIÈRE', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800' },
  { id: 'D', label: 'PRODUCTION ET DISTRIBUTION D\'ÉLECTRICITÉ, DE GAZ, DE VAPEUR', img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800' },
  { id: 'E', label: 'EAU, ASSAINISSEMENT, GESTION DES DÉCHETS', img: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=800' },
  { id: 'F', label: 'CONSTRUCTION', img: 'https://images.unsplash.com/photo-1503387762-592dea58ef21?auto=format&fit=crop&q=80&w=800' },
  { id: 'G', label: 'COMMERCE; RÉPARATION D\'AUTOMOBILES', img: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=800' },
  { id: 'H', label: 'TRANSPORTS ET ENTREPOSAGE', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800' },
  { id: 'I', label: 'HÉBERGEMENT ET RESTAURATION', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800' },
  { id: 'J', label: 'INFORMATION ET COMMUNICATION', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800' },
  { id: 'K', label: 'ACTIVITÉS FINANCIÈRES ET D\'ASSURANCE', img: 'https://images.unsplash.com/photo-1611974714025-a8a7745f829c?auto=format&fit=crop&q=80&w=800' },
  { id: 'L', label: 'ACTIVITÉS IMMOBILIÈRES', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800' },
  { id: 'M', label: 'ACTIVITÉS SPÉCIALISÉES, SCIENTIFIQUES ET TECHNIQUES', img: 'https://images.unsplash.com/photo-1454165833767-027ff33027ef?auto=format&fit=crop&q=80&w=800' },
  { id: 'N', label: 'ACTIVITÉS DE SERVICES ADMINISTRATIFS ET DE SOUTIEN', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800' },
  { id: 'O', label: 'ADMINISTRATION PUBLIQUE ET DÉFENSE', img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800' },
  { id: 'P', label: 'ENSEIGNEMENT', img: 'https://images.unsplash.com/photo-1523050335191-51ff18679427?auto=format&fit=crop&q=80&w=800' },
  { id: 'Q', label: 'SANTÉ HUMAINE ET ACTION SOCIALE', img: 'https://images.unsplash.com/photo-1505751172107-573957a243b0?auto=format&fit=crop&q=80&w=800' },
  { id: 'R', label: 'ARTS, SPECTACLES ET ACTIVITÉS RÉCRÉATIVES', img: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=800' },
  { id: 'S', label: 'AUTRES ACTIVITÉS DE SERVICES', img: 'https://images.unsplash.com/photo-1521791136064-7986c2923216?auto=format&fit=crop&q=80&w=800' },
  { id: 'T', label: 'ACTIVITÉS DES MÉNAGES', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' },
  { id: 'U', label: 'ACTIVITÉS EXTRA TERRITORIALES', img: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=800' },
];

export const NAA_DATA: NAAActivity[] = [
  // --- SECTION A: AGRICULTURE ---
  { code: '01.11', label: "Culture de céréales (à l'exception du riz), de légumineuses et de graines oléagineuses", section: 'A', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '9%', exoneration: 'Agricole' },
  { code: '01.13', label: "Culture de légumes, de melons, de racines et de tubercules", section: 'A', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '9%', exoneration: 'Agricole' },
  { code: '01.41', label: "Élevage de vaches laitières", section: 'A', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '0%', exoneration: 'Agricole' },
  { code: '01.44', label: "Élevage d'ovins et de caprins", section: 'A', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '9%', exoneration: 'Agricole' },
  
  // --- SECTION C: INDUSTRIE MANUFACTURIÈRE ---
  { code: '10.71', label: "Boulangerie et boulangerie-pâtisserie", section: 'C', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '9%', exoneration: 'Standard' },
  { code: '14.13', label: "Fabrication de vêtements de dessus", section: 'C', type: 'BIC', category: 'Production', ifu: '5%', ibs: '19%', tva: '19%', exoneration: 'Standard' },
  
  // --- SECTION F: CONSTRUCTION (TOUT EXCLU IFU) ---
  { code: '41.10', label: "Promotion immobilière", section: 'F', type: 'BIC', category: 'Commerce', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu Art 282 ter' },
  { code: '41.20', label: "Construction de bâtiments résidentiels et non résidentiels", section: 'F', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'BTP Exclu' },
  { code: '42.11', label: "Construction de routes et autoroutes", section: 'F', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'BTP Exclu' },
  { code: '43.21', label: "Travaux d'installation électrique", section: 'F', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'BTP Exclu' },
  { code: '43.22', label: "Travaux de plomberie et installation de chauffage et de conditionnement d'air", section: 'F', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'BTP Exclu' },

  // --- SECTION G: COMMERCE ---
  // Note: Gros exclu, Détail OK
  { code: '45.20', label: "Entretien et réparation de véhicules automobiles", section: 'G', type: 'BIC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Standard' },
  { code: '46.31', label: "Commerce de gros de fruits et légumes", section: 'G', type: 'BIC', category: 'Commerce', ifu: 'EXCLU', ibs: '26%', tva: '9%', exoneration: 'Gros Exclu' },
  { code: '46.35', label: "Commerce de gros de produits à base de tabac", section: 'G', type: 'BIC', category: 'Commerce', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '47.11', label: "Commerce de détail en magasin non spécialisé à prédominance alimentaire", section: 'G', type: 'BIC', category: 'Commerce', ifu: '5%', ibs: '26%', tva: '19%', exoneration: 'Standard' },
  { code: '47.19', label: "Autre commerce de détail en magasin non spécialisé", section: 'G', type: 'BIC', category: 'Commerce', ifu: '5%', ibs: '26%', tva: '19%', exoneration: 'Standard' },
  { code: '47.71', label: "Commerce de détail d'habillement en magasin spécialisé", section: 'G', type: 'BIC', category: 'Commerce', ifu: '5%', ibs: '26%', tva: '19%', exoneration: 'Standard' },
  
  // --- SECTION I: HÉBERGEMENT ET RESTAURATION ---
  { code: '56.10', label: "Restaurants et services de restauration mobile", section: 'I', type: 'BIC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Standard (Sauf classés)' },
  { code: '56.21', label: "Services des traiteurs", section: 'I', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '56.30', label: "Débits de boissons", section: 'I', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025 (Alcool)' },

  // --- SECTION K: FINANCES & ASSURANCE (TOUT EXCLU) ---
  { code: '64.19', label: "Autres intermédiations monétaires", section: 'K', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Finance Exclue' },
  { code: '66.22', label: "Activités des agents et courtiers d'assurances", section: 'K', type: 'BNC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },

  // --- SECTION M: ACTIVITÉS SPÉCIALISÉES ---
  { code: '69.10', label: "Activités juridiques (Avocats, Notaires)", section: 'M', type: 'BNC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Standard' },
  { code: '69.20', label: "Activités comptables", section: 'M', type: 'BNC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Standard' },
  { code: '73.11', label: "Activités des agences de publicité", section: 'M', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '73.12', label: "Régie publicitaire de médias", section: 'M', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },

  // --- SECTION N: SERVICES DE SOUTIEN ---
  { code: '77.11', label: "Location et location-bail de voitures et de véhicules automobiles légers", section: 'N', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '77.12', label: "Location et location-bail de camions", section: 'N', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '77.32', label: "Location et location-bail de machines et équipements pour la construction", section: 'N', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '77.39', label: "Location et location-bail d'autres machines, équipements et biens matériels n.c.a. (Salles)", section: 'N', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '79.11', label: "Activités des agences de voyage", section: 'N', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '79.12', label: "Activités des voyagistes", section: 'N', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },

  // --- SECTION P: ENSEIGNEMENT (TOUT EXCLU) ---
  { code: '85.10', label: "Enseignement pré-primaire", section: 'P', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '0%', exoneration: 'Exclu LF 2025' },
  { code: '85.53', label: "Enseignement de la conduite (Auto-écoles)", section: 'P', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },
  { code: '85.59', label: "Enseignement divers (Formation continue)", section: 'P', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '19%', exoneration: 'Exclu LF 2025' },

  // --- SECTION Q: SANTÉ (CLINIQUES EXCLUES) ---
  { code: '86.10', label: "Activités hospitalières (Cliniques privées)", section: 'Q', type: 'BIC', category: 'Services', ifu: 'EXCLU', ibs: '26%', tva: '9%', exoneration: 'Exclu Santé' },
  { code: '86.21', label: "Activité des médecins généralistes", section: 'Q', type: 'BNC', category: 'Services', ifu: '12%', ibs: '26%', tva: '9%', exoneration: 'Standard' },
  { code: '86.22', label: "Activité des médecins spécialistes", section: 'Q', type: 'BNC', category: 'Services', ifu: '12%', ibs: '26%', tva: '9%', exoneration: 'Standard' },

  // --- SECTION S: AUTRES SERVICES ---
  { code: '96.02', label: "Coiffure et soins de beauté", section: 'S', type: 'BIC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Artisanat' },
  
  // --- ACTIVITÉS NUMÉRIQUES (SECTION J) ---
  { code: '62.01', label: "Programmation informatique", section: 'J', type: 'BNC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Start-up' },
  { code: '62.02', label: "Conseil en systèmes et logiciels informatiques", section: 'J', type: 'BNC', category: 'Services', ifu: '12%', ibs: '26%', tva: '19%', exoneration: 'Standard' }
];
