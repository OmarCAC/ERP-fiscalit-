
import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  PieChart, 
  Building2, 
  Truck, 
  Calculator,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  CheckSquare,
  Square,
  Search,
  Fuel,
  Stamp,
  LayoutList,
  Coins,
  FileCheck,
  Info,
  Edit,
  Save,
  Send,
  CheckCircle2,
  FileText,
  LayoutGrid,
  ArrowRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Declaration } from '../types';

interface Props {
  onBack: () => void;
  onSubmit?: (declaration: Declaration) => void;
}

// --- COMPOSANT UI : SelectionCard (Style G1) ---
const SelectionCard = ({ 
  title, icon: Icon, description, selected, onClick 
}: { title: string, icon: any, description: string, selected: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`relative p-6 rounded-[28px] border-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selected ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg'}`}
  >
    <div className="flex items-start gap-5">
      <div className={`p-4 rounded-2xl transition-colors ${selected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="flex-1">
        <h3 className={`text-base font-black uppercase tracking-tight mb-2 ${selected ? 'text-primary' : 'text-slate-700'}`}>{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
    {selected && (
      <div className="absolute top-4 right-4 text-primary bg-white rounded-full p-1 shadow-sm">
        <CheckCircle2 className="w-5 h-5 fill-primary/10" />
      </div>
    )}
  </div>
);

// Définition des types de lignes pour la configuration
type TaxRowConfig = {
  code: string;
  label: string;
  rate: number | 'VAR' | 'BAREME' | 'NONE'; 
  section: 'E1' | 'E2' | 'E1L' | 'SAL' | 'E3' | 'IBS_LIQ' | 'IBS_RS' | 'TLS' | 'DTI' | 'TIMBRE' | 'AUTRES' | 'TVA';
  description?: string;
  isDeduction?: boolean; 
  isRefaction?: boolean; 
  isSpecificRate?: boolean; 
  unit?: string;
  group?: 'A' | 'B' | '9' | '19' | 'NON_IMP' | 'EXO' | 'DED' | 'REGUL' | 'AUTOLIQ'; // Groupes pour TVA
};

const TAX_DEFINITIONS: TaxRowConfig[] = [
  // --- SECTION 1: PRESTATIONS ÉTRANGÈRES (E1) ---
  { code: 'E1M10', section: 'E1', rate: 24, label: 'Prestations de services (Entreprises étrangères)', description: 'Sommes payées en rémunération des prestations de Services réalisées par des entreprises étrangères' },
  { code: 'E1M20', section: 'E1', rate: 24, label: 'Produits perçus par les inventeurs', description: 'Concession de licence, brevets, marques, procédés' },
  { code: 'E1M30', section: 'E1', rate: 15, label: 'Sommes versées aux artistes', description: 'Cachets ou droits d’auteurs aux artistes (domicile fiscal hors d’Algérie)' },

  // --- SECTION 2: CAPITAUX MOBILIERS (E2) ---
  { code: 'E2M10', section: 'E2', rate: 10, label: 'Revenus distribués résidents', description: 'Revenus distribués aux personnes physiques résidentes (Retenue libératoire)' },
  { code: 'E2M20', section: 'E2', rate: 50, label: 'Produits de bons de caisse anonyme', description: 'Produits de bons de caisse anonyme' },
  { code: 'E2M30', section: 'E2', rate: 10, label: 'Revenus des créances, dépôts et cautionnements', description: 'Intérêts et revenus assimilés' },
  { code: 'E2M50', section: 'E2', rate: 1, label: 'Intérêts livrets épargne ≤ 50.000 DA', description: 'Fraction des intérêts inférieure ou égale à 50.000 DA' },
  { code: 'E2M60', section: 'E2', rate: 10, label: 'Intérêts livrets épargne > 50.000 DA', description: 'Fraction du revenu supérieure à 50.000 DA' },
  { code: 'E2M70', section: 'E2', rate: 15, label: 'Bénéfices répartis (Non Résidents)', description: 'Au profit de personnes physiques/morales non résidentes' },
  { code: 'E2M80', section: 'E2', rate: 15, label: 'Plus-values cession actions (Résidents)', description: 'Par personnes physiques résidentes' },
  { code: 'E2M90', section: 'E2', rate: 20, label: 'Plus-values cession actions (Non Résidents)', description: 'Par personnes physiques non résidentes' },
  { code: 'E2M95', section: 'E2', rate: 'VAR', label: 'Plus-values cession actions (Non Résidents Conventionnés)', description: 'Pays conventionnés (Taux variable)' },
  { code: 'E2M100', section: 'E2', rate: 15, label: 'Bénéfices sociétés étrangères (Succursales)', description: 'Installation professionnelle permanente' },

  // --- SECTION 3: REVENUS LOCATIFS (E1L) ---
  { code: 'E1L10', section: 'E1L', rate: 7, label: 'Habitation collective', description: 'Location à titre civil de biens immobiliers collectif à usage d’habitation' },
  { code: 'E1L20', section: 'E1L', rate: 10, label: 'Habitation individuelle', description: 'Revenus de location à titre civil de biens immobiliers individuel' },
  { code: 'E1L30', section: 'E1L', rate: 15, label: 'Locaux commerciaux/professionnels', description: 'Location de locaux à usage commercial ou professionnel' },
  { code: 'E1L40', section: 'E1L', rate: 15, label: 'Salles des fêtes, foraines, cirques', description: 'Revenus issus de la location de salles des fêtes, fêtes foraines et de cirques' },

  // --- SECTION 4: TRAITEMENTS ET SALAIRES (SAL) ---
  { code: 'E2L30', section: 'SAL', rate: 'BAREME', label: 'Personnel résident', description: 'Traitements et salaires versés par les employeurs' },
  { code: 'E2L40', section: 'SAL', rate: 'BAREME', label: 'Personnel non résident', description: 'Traitements et salaires versés par les employeurs' },
  { code: 'E2L50', section: 'SAL', rate: 10, label: 'Primes de rendement, gratification', description: 'Périodicité autre que mensuelle' },
  { code: 'E2L60', section: 'SAL', rate: 10, label: 'Vacataires / Activité occasionnelle', description: 'Enseignement, recherche (Max 2.000.000 DA)' },

  // --- SECTION 5: SOLDE DE LIQUIDATION IRG (E3) ---
  { code: 'E3L10', section: 'E3', rate: 'BAREME', label: 'Résultat taxable', description: 'Bénéfice net soumis à l\'IRG (Base de calcul)' }, 
  { code: 'E3L20', section: 'E3', rate: 'NONE', label: 'Montant du 1er acompte (1)', description: 'Acompte provisionnel versé', isDeduction: true, group: 'B' },
  { code: 'E3L30', section: 'E3', rate: 'NONE', label: 'Montant du 2ème acompte (2)', description: 'Acompte provisionnel versé', isDeduction: true, group: 'B' },
  { code: 'E3L40', section: 'E3', rate: 'NONE', label: 'Acomptes entreprises non résidentes (3)', description: 'Acomptes versés', isDeduction: true, group: 'B' },
  { code: 'E3L50', section: 'E3', rate: 'NONE', label: 'Crédit d’impôt (4)', description: 'Crédit d’impôt sur bénéfice', isDeduction: true, group: 'B' },
  { code: 'E3L90', section: 'E3', rate: 'NONE', label: 'Minimum d’Imposition', description: 'Montant minimum dû si déficit ou impôt faible' },

  // --- SECTION 6 & 7: IBS (IMPOT SUR LES BENEFICES DES SOCIETES) ---
  { code: 'E1B40', section: 'IBS_LIQ', rate: 'NONE', label: 'Résultat taxable', description: 'Résultat soumis à l\'IBS' },
  { code: 'E1B60', section: 'IBS_LIQ', rate: 5, label: 'Montant du capital social appelé', description: 'Soumis à 5%' },
  { code: 'E1B10', section: 'IBS_LIQ', rate: 19, label: 'Activités de production de biens', description: 'Taux 19%', group: 'A' },
  { code: 'E1B20', section: 'IBS_LIQ', rate: 23, label: 'Activité de bâtiment, TP, hydraulique, tourisme', description: 'Taux 23%', group: 'A' },
  { code: 'E1B30', section: 'IBS_LIQ', rate: 26, label: 'Les activités de commerce et de services', description: 'Taux 26%', group: 'A' },
  { code: 'E1B70', section: 'IBS_LIQ', rate: 'NONE', label: 'Excédent de versement antérieur à déduire (1)', description: 'Report', isDeduction: true, group: 'B' },
  { code: 'E1B80', section: 'IBS_LIQ', rate: 'NONE', label: 'Montant du 1er acompte (2)', description: 'Acompte', isDeduction: true, group: 'B' },
  { code: 'E1B81', section: 'IBS_LIQ', rate: 'NONE', label: 'Montant du 2ème acompte (3)', description: 'Acompte', isDeduction: true, group: 'B' },
  { code: 'E1B82', section: 'IBS_LIQ', rate: 'NONE', label: 'Montant du 3ème acompte (4)', description: 'Acompte', isDeduction: true, group: 'B' },
  { code: 'E1B83', section: 'IBS_LIQ', rate: 0.5, label: 'Acomptes versés par les sociétés non résidentes (5)', description: '0.5%', isDeduction: true, group: 'B' },
  { code: 'E1B84', section: 'IBS_LIQ', rate: 'NONE', label: 'Crédit d’impôt (6)', description: 'Crédit', isDeduction: true, group: 'B' },
  { code: 'E1B91', section: 'IBS_LIQ', rate: 'NONE', label: 'Minimum d’Imposition', description: 'Montant minimum' },

  { code: 'E1B100', section: 'IBS_RS', rate: 10, label: 'Revenus des créances, dépôts et cautionnement', description: '10%' },
  { code: 'E1B110', section: 'IBS_RS', rate: 50, label: 'Revenus provenant de bons de caisses anonymes', description: '50%' },
  { code: 'E1B120', section: 'IBS_RS', rate: 20, label: 'Revenus perçus dans le cadre d’un contrat de management', description: '20%' },
  { code: 'E1B130', section: 'IBS_RS', rate: 24, label: 'Produits versés à des inventeurs résidents à l’étranger', description: 'Brevets, marques... (24%)' },
  { code: 'E1B140', section: 'IBS_RS', rate: 10, label: 'Revenus des entreprises étrangères de transport maritime', description: '10%' },
  { code: 'E1B150', section: 'IBS_RS', rate: 20, label: 'Plus values de cession d’actions (non résidents, non conventionné)', description: '20% (1)' },
  { code: 'E1B160', section: 'IBS_RS', rate: 'VAR', label: 'Plus values de cession d’actions (non résidents, conventionnés)', description: 'Pays conventionnés' },
  { code: 'E1B170', section: 'IBS_RS', rate: 'VAR', label: 'Sommes payées à des sociétés sans installation permanente (Prestations)', description: 'Taux variable' },

  // --- TAXE LOCALE DE SOLIDARITÉ (TLS) ---
  { code: 'E4_M_HYDRO', section: 'TLS', rate: 3, label: 'Activité transport hydrocarbures', description: 'Taux 3%' },
  { code: 'E4_M_MINIER', section: 'TLS', rate: 1.5, label: 'Activités minières (sans réfaction)', description: 'Taux 1.5%' },
  { code: 'E4_M_MINIER_REF', section: 'TLS', rate: 1.5, label: 'Activités minières (avec réfaction 30%)', description: 'Taux 1.5% sur 70%', isRefaction: true },
  { code: 'E4_A_HYDRO_AC', section: 'TLS', rate: 3, label: 'Hydrocarbures : Acompte', description: '3% (Acompte)' },
  { code: 'E4_A_HYDRO_SOL', section: 'TLS', rate: 3, label: 'Hydrocarbures : Solde', description: '3% (Solde)' },
  { code: 'E4_A_MINIER_AC', section: 'TLS', rate: 1.5, label: 'Activités minières : Acompte', description: '1.5% (Acompte)' },
  { code: 'E4_A_MINIER_SOL', section: 'TLS', rate: 1.5, label: 'Activités minières : Solde', description: '1.5% (Solde)' },

  // --- TVA (TAXE SUR LE CHIFFRE D'AFFAIRES) - SECTION 11 COMPLÈTE ---
  { code: 'E3B1', section: 'TVA', rate: 9, label: 'Biens, produits et denrées (Art 23 CTCA)', group: '9' },
  { code: 'E3B2', section: 'TVA', rate: 9, label: 'Prestations de services (Art 23 CTCA)', group: '9' },
  { code: 'E3B3', section: 'TVA', rate: 9, label: 'Opérations immobilières (Art 23 CTCA)', group: '9' },
  { code: 'E3B4', section: 'TVA', rate: 9, label: 'Actes médicaux', group: '9' },
  { code: 'E3B5', section: 'TVA', rate: 9, label: 'Commissionnaires et courtiers', group: '9' },
  { code: 'E3B6', section: 'TVA', rate: 9, label: 'Fourniture d’énergie (Réduit)', group: '9' },
  { code: 'E3B7', section: 'TVA', rate: 9, label: 'Autres opérations à taux réduit', group: '9' },

  { code: 'E3B8', section: 'TVA', rate: 19, label: 'Productions : biens/produits (Art 21 CTCA)', group: '19' },
  { code: 'E3B9', section: 'TVA', rate: 19, label: 'Revente en l’état (Art 21 CTCA)', group: '19' },
  { code: 'E3B10', section: 'TVA', rate: 19, label: 'Travaux immobiliers (Autres)', group: '19' },
  { code: 'E3B11', section: 'TVA', rate: 19, label: 'Professions libérales', group: '19' },
  { code: 'E3B12', section: 'TVA', rate: 19, label: 'Opérations téléphones et internet', group: '19' },
  { code: 'E3B13', section: 'TVA', rate: 19, label: 'Tabacs et allumettes', group: '19' },
  { code: 'E3B14', section: 'TVA', rate: 19, label: 'Spectacles, jeux et divertissements', group: '19' },
  { code: 'E3B15', section: 'TVA', rate: 19, label: 'TVA produits pétroliers', group: '19' },
  { code: 'E3B16', section: 'TVA', rate: 19, label: 'Concessionnaires autos', group: '19' },
  { code: 'E3B17', section: 'TVA', rate: 19, label: 'Producteurs de médicaments', group: '19' },
  { code: 'E3B18', section: 'TVA', rate: 19, label: 'Importateurs de médicaments', group: '19' },
  { code: 'E3B19', section: 'TVA', rate: 19, label: 'Banques et établissements financiers', group: '19' },
  { code: 'E3B20', section: 'TVA', rate: 19, label: 'Assurances', group: '19' },
  { code: 'E3B21', section: 'TVA', rate: 19, label: 'Fourniture d’énergie (Normal)', group: '19' },
  { code: 'E3B_AUTRE', section: 'TVA', rate: 19, label: 'Autres opérations à taux normal', group: '19' },
  { code: 'E3B22', section: 'TVA', rate: 19, label: 'Régime des acomptes TVA (19%)', group: '19' },
  { code: 'E3B23', section: 'TVA', rate: 9, label: 'Régime des acomptes TVA (9%)', group: '19' }, 

  { code: 'E3B24', section: 'TVA', rate: 0, label: 'Secteur pétrolier (art 9/9)', group: 'NON_IMP' },
  { code: 'E3B25', section: 'TVA', rate: 0, label: 'Produits de première nécessité (Art 9/2)', group: 'NON_IMP' },
  { code: 'E3B26', section: 'TVA', rate: 0, label: 'Opérations de crédit Bail', group: 'NON_IMP' },
  { code: 'E3B27', section: 'TVA', rate: 0, label: 'Opération de réassurance', group: 'NON_IMP' },
  { code: 'E3B28', section: 'TVA', rate: 0, label: 'Opération d’assurances des personnes', group: 'NON_IMP' },
  { code: 'E3B29', section: 'TVA', rate: 0, label: 'Opérations Intra-groupe (*)', group: 'NON_IMP' },
  { code: 'E3B30', section: 'TVA', rate: 0, label: 'Exportation', group: 'NON_IMP' },
  { code: 'E3B31', section: 'TVA', rate: 0, label: 'Médicament', group: 'NON_IMP' },
  { code: 'E3B32', section: 'TVA', rate: 0, label: 'Autres non-imposables', group: 'NON_IMP' },

  { code: 'E3B33', section: 'TVA', rate: 0, label: 'Secteur pétrolier', group: 'EXO' },
  { code: 'E3B34', section: 'TVA', rate: 0, label: 'Andi', group: 'EXO' },
  { code: 'E3B35', section: 'TVA', rate: 0, label: 'Ansej', group: 'EXO' },
  { code: 'E3B35_ANGEM', section: 'TVA', rate: 0, label: 'Angem', group: 'EXO' },
  { code: 'E3B35_CNAC', section: 'TVA', rate: 0, label: 'Cnac', group: 'EXO' },
  { code: 'E3B35_EXPORT', section: 'TVA', rate: 0, label: 'Exportation (Exonéré)', group: 'EXO' },

  { code: 'E3B90', section: 'TVA', rate: 'NONE', label: 'Précompte antérieur', isDeduction: true, group: 'DED' },
  { code: 'E3B91', section: 'TVA', rate: 'NONE', label: 'T.V.A sur achat de biens, matières et services (art.29C/T.C.A)', isDeduction: true, group: 'DED' },
  { code: 'E3B92', section: 'TVA', rate: 'NONE', label: 'T.V.A sur achat de biens (art.38C/T.C.A)', isDeduction: true, group: 'DED' },
  { code: 'E3B93', section: 'TVA', rate: 'NONE', label: 'Régularisation du prorata (déduction complémentaire) (art.40C/T.C.A)', isDeduction: true, group: 'DED' },
  { code: 'E3B94', section: 'TVA', rate: 'NONE', label: 'T.V.A à récupérer sur factures annulées ou impayées (art.18 C/T.C.A)', isDeduction: true, group: 'DED' },
  { code: 'E3B95', section: 'TVA', rate: 'NONE', label: 'Autres déductions (Notification de précompte,etc.)', isDeduction: true, group: 'DED' },

  { code: 'E3B97', section: 'TVA', rate: 'NONE', label: 'Régularisation du prorata (art.40C) (+)', group: 'REGUL' },
  { code: 'E3B98', section: 'TVA', rate: 'NONE', label: 'Régularisation (régime des acomptes)', group: 'REGUL' },
  { code: 'E3B99', section: 'TVA', rate: 'NONE', label: 'Reversement de la déduction (art.38C)', group: 'REGUL' },
  { code: 'E3B140', section: 'TVA', rate: 'NONE', label: 'TVA auto-liquidée à payer (art. 83)', group: 'AUTOLIQ' },

  // --- DROITS ET TAXES INDIRECTS (DTI) ---
  { code: 'E2E01', section: 'DTI', rate: 8800, label: 'Droit de circulation sur les alcools', description: 'A) Impôts sur le produit', isSpecificRate: true, unit: 'HL' },
  { code: 'E2E02', section: 'DTI', rate: 5, label: 'Taxe additionnelle sur les alcools', description: 'A) Impôts sur le produit', unit: 'DCA' },
  { code: 'E2E03', section: 'DTI', rate: 140, label: 'Taxe sucres (vins/apéritifs)', description: 'A) Impôts sur le produit', isSpecificRate: true, unit: '100KG' },
  { code: 'E2E04', section: 'DTI', rate: 8000, label: 'Droits de circulation sur les vins', description: 'A) Impôts sur le produit', isSpecificRate: true, unit: 'HL' },
  { code: 'E2E05', section: 'DTI', rate: 'VAR', label: 'TIC Tabacs (Spécifique)', description: 'B) TIC', isSpecificRate: true, unit: 'KG' },
  { code: 'E2E06', section: 'DTI', rate: 10, label: 'TIC Tabacs (Ad Valorem)', description: 'B) TIC', unit: 'Valeur' },
  { code: 'E2E07', section: 'DTI', rate: 11, label: 'Taxe add. produits tabagiques', description: 'B) TIC', isSpecificRate: true, unit: 'P-B-B' },
  { code: 'E2E08', section: 'DTI', rate: 3610, label: 'TIC Bières', description: 'B) TIC', isSpecificRate: true, unit: 'HL' },
  { code: 'E2E09', section: 'DTI', rate: 'VAR', label: 'Taxe sur les produits pétroliers (TPP)', description: 'B) TIC', isSpecificRate: true, unit: 'HL' },
  { code: 'E2E10', section: 'DTI', rate: 'VAR', label: 'TIC (Autres produits)', description: 'B) TIC', isSpecificRate: false, unit: 'Valeur' },
  { code: 'E2E11', section: 'DTI', rate: 7, label: 'Taxe sur les recharges téléphoniques', description: 'C) Autres', unit: 'Recharge' },
  { code: 'E2E12', section: 'DTI', rate: 'VAR', label: 'Taxe appareils récepteurs (Radio/TV)', description: 'C) Autres', isSpecificRate: true, unit: 'DA' },

  // --- DROITS DE TIMBRE (TIMBRE) ---
  { code: 'E2E12_TIMBRE', section: 'TIMBRE', rate: 'VAR', label: 'Droit de Timbre sur Etat', description: 'Opérations imposables' },

  // --- AUTRES TAXES (AUTRES) ---
  { code: 'E2E13', section: 'AUTRES', rate: 'VAR', label: 'TAXE SUR L’ACTIVITE PROFESSIONNELLE (Antérieur 2024)', description: 'Opérations antérieures au 01/01/2024' },
  { code: 'E2E14', section: 'AUTRES', rate: 1, label: 'Taxe de formation', description: '1%' },
  { code: 'E2E15', section: 'AUTRES', rate: 1, label: 'Taxe d’apprentissage', description: '1%' },
  { code: 'E2E16', section: 'AUTRES', rate: 'BAREME', label: 'Taxe sur les véhicules neufs', description: 'Barème' },
  { code: 'E2E17', section: 'AUTRES', rate: 1, label: 'Contribution des concessionnaires', description: '1%' },
  { code: 'E2E18', section: 'AUTRES', rate: 'BAREME', label: 'Taxe d’habitation', description: 'Barème' },
  { code: 'E2E19', section: 'AUTRES', rate: 'VAR', label: 'Taxe sur les pneus neufs ou importés', description: '10 DA ou 5 DA / unité' },
  { code: 'E2E20', section: 'AUTRES', rate: 40, label: 'Prélèvement sur les recettes des jeux', description: '40%' },
  { code: 'E2E21', section: 'AUTRES', rate: 12500, label: 'Taxe sur les huiles, lubrifiants', description: '12500 DA/T', isSpecificRate: true, unit: 'Tonne' },
  { code: 'E2E22', section: 'AUTRES', rate: 1, label: 'Taxe CA téléphonie mobile', description: '1%' },
  { code: 'E2E23', section: 'AUTRES', rate: 5, label: 'Taxe bénéfices import/distrib. médicaments', description: '5%' },
  { code: 'E2E24', section: 'AUTRES', rate: 1, label: 'Taxe de publicité', description: '1%' },
  { code: 'E2E25', section: 'AUTRES', rate: 0.5, label: 'Taxe CA boissons gazeuses', description: '0.5%' },
  { code: 'E2E26', section: 'AUTRES', rate: 'VAR', label: 'Autres', description: 'Variable' },
  { code: 'E2E27', section: 'AUTRES', rate: 'BAREME', label: 'Taxe véhicules sociétés (VP < 5 ans)', description: 'Barème' },
  { code: 'E2E28', section: 'AUTRES', rate: 'BAREME', label: 'Taxe sur le carburant', description: 'Barème' },
  { code: 'E2E29', section: 'AUTRES', rate: 'BAREME', label: 'Taxe sur la vente d’Electricité et du gaz', description: 'Barème' },
  { code: 'E2E30', section: 'AUTRES', rate: 'VAR', label: 'Taxe annuelle opérateurs économiques', description: '200 / 500 / 1000 DA' },
  { code: 'E2E31', section: 'AUTRES', rate: 'BAREME', label: 'Redevance sur les céréales', description: 'Barème' },
  { code: 'E2E32', section: 'AUTRES', rate: 0.5, label: 'Taxe appui investissement touristique', description: '0.5%' },
  { code: 'E2E33', section: 'AUTRES', rate: 25, label: 'Taxe d’efficacité énergétique (sans class.)', description: '25% (LF 2017)' },
  { code: 'E2E34', section: 'AUTRES', rate: 'VAR', label: 'Taxe d’efficacité énergétique (avec class.)', description: 'Variable (LF 2017)' },
  { code: 'E2E35', section: 'AUTRES', rate: 10, label: 'Taxe contrats production/diffusion pub.', description: '10% (LF 2017)' },
];

const calculateIrgScale = (income: number): number => {
  let tax = 0;
  if (income <= 240000) return 0;
  if (income > 240000) { tax += (Math.min(income, 480000) - 240000) * 0.23; }
  if (income > 480000) { tax += (Math.min(income, 960000) - 480000) * 0.27; }
  if (income > 960000) { tax += (Math.min(income, 1920000) - 960000) * 0.30; }
  if (income > 1920000) { tax += (Math.min(income, 3840000) - 1920000) * 0.33; }
  if (income > 3840000) { tax += (income - 3840000) * 0.35; }
  return Math.floor(tax);
};

// Composant Modal de sélection
interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  group?: string | null;
  activeRows: string[];
  onAdd: (codes: string[]) => void;
}

const RubricSelectionModal: React.FC<RubricModalProps> = ({ isOpen, onClose, section, group, activeRows, onAdd }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const availableDefs = TAX_DEFINITIONS.filter(
    d => d.section === section && 
    (!group || d.group === group) && 
    !activeRows.includes(d.code)
  ).filter(d => 
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (code: string) => {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const handleConfirm = () => {
    onAdd(selected);
    setSelected([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Ajouter une rubrique</h3>
            {group && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Groupe : {group}</span>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-slate-100">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Rechercher un code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {availableDefs.length > 0 ? availableDefs.map(def => {
            const isChecked = selected.includes(def.code);
            return (
              <div key={def.code} onClick={() => toggleSelect(def.code)} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                <div className={`mt-1 ${isChecked ? 'text-primary' : 'text-slate-300'}`}>{isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}</div>
                <div className="flex-1">
                   <div className="flex justify-between items-center mb-1"><span className="text-sm font-black text-slate-900">{def.code}</span><span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{def.rate === 'VAR' ? 'Taux Variable' : def.rate === 'BAREME' ? 'Barème' : def.rate === 'NONE' ? 'Montant' : def.isSpecificRate ? `${def.rate} DA` : `${def.rate}%`}</span></div>
                   <p className="text-xs font-bold text-slate-700">{def.label}</p>
                   <p className="text-[10px] text-slate-500 mt-1 leading-tight">{def.description}</p>
                </div>
              </div>
            );
          }) : <div className="py-12 text-center text-slate-400 text-sm italic">Aucune rubrique disponible pour ce groupe.</div>}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">Annuler</button>
           <button disabled={selected.length === 0} onClick={handleConfirm} className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter {selected.length > 0 ? `(${selected.length})` : ''}</button>
        </div>
      </div>
    </div>
  );
};

const G50CompletForm: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  
  // --- NOUVEAU ETAT WIZARD ---
  const [wizardStep, setWizardStep] = useState<'SELECTION' | 'INPUT'>('SELECTION');
  const [enabledModules, setEnabledModules] = useState({
      irg: true, // Sections 1-3 + Salaires + Liquidation
      ibs: false,
      tva: true,
      tls: false,
      dti: false,
      timbre: true,
      autres: false
  });

  const [activeTab, setActiveTab] = useState('sections_1_3');
  
  // --- SUB SECTIONS TVA STATE ---
  const [tvaSubSections, setTvaSubSections] = useState({
    s9: true,
    s19: true,
    nonImp: true,
    exo: true,
    ded: true
  });
  
  const toggleTvaSub = (key: keyof typeof tvaSubSections) => setTvaSubSections(prev => ({...prev, [key]: !prev[key]}));

  const [sectionsVisibility, setSectionsVisibility] = useState({
    s1: true,
    s2: true,
    s3: true,
    sal: true,
    liq: true,
    ibs_liq: true,
    ibs_rs: true,
    tls: true,
    tva: true,
    dti: true,
    timbre: true,
    autres: true
  });

  // Fonction intelligente pour naviguer depuis le récapitulatif
  const handleEditSection = (tab: string, sectionKey: keyof typeof sectionsVisibility) => {
    setActiveTab(tab);
    setSectionsVisibility(prev => ({ ...prev, [sectionKey]: true }));
  };

  const [activeRows, setActiveRows] = useState<string[]>([
    'E1M10', 'E2M10', 'E1L30', 'E2L30', 'E3L10', // IRG
    'E1B40', 'E1B60', 'E1B10', 'E1B20', 'E1B30', 'E1B80', 'E1B100', // IBS
    'E4_M_HYDRO', 'E4_M_MINIER', // TLS
    'E3B1', 'E3B8', 'E3B91', // TVA INITIALE
    'E2E12_TIMBRE' // TIMBRE (Ajouté pour calcul total)
  ]);

  const [tlsOptionAcomptes, setTlsOptionAcomptes] = useState(false);
  const [tlsAdditionalData, setTlsAdditionalData] = useState<{
     hydroRef: string, hydroNotif: string,
     minierRef: string, minierNotif: string
  }>({ hydroRef: '', hydroNotif: '', minierRef: '', minierNotif: '' });
  
  const [tlsExonerations, setTlsExonerations] = useState<Record<string, number>>({});

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean, 
    section: 'E1' | 'E2' | 'E1L' | 'SAL' | 'E3' | 'IBS_LIQ' | 'IBS_RS' | 'TLS' | 'DTI' | 'TIMBRE' | 'AUTRES' | 'TVA' | null,
    group?: string | null // Group filter support
  }>({
    isOpen: false,
    section: null,
    group: null
  });

  const [values, setValues] = useState<Record<string, number>>({});
  const [exemptValues, setExemptValues] = useState<Record<string, number>>({});
  const [customRates, setCustomRates] = useState<Record<string, number>>({}); 
  const [manualTaxes, setManualTaxes] = useState<Record<string, number>>({}); 

  const identification = {
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    nif: "000111222333444",
    nom: "SARL EXEMPLE",
    adresse: "123 Rue de la Liberté, Alger",
    activite: "Services Informatiques"
  };

  const totals = useMemo(() => {
    let t_s1 = 0, t_s2 = 0, t_s3 = 0, t_sal = 0, t_liq = 0, t_ibs = 0, t_tls = 0, t_dti = 0, t_timbre = 0, t_autres = 0, t_tva = 0;
    let e3_tax_A = 0, e3_deductions_B = 0, e3_minimum = 0;
    let ibs_tax_A = 0, ibs_deductions_B = 0, ibs_minimum = 0, ibs_rs_total = 0;
    let tva_collectee = 0, tva_deductible = 0, tva_autoliq = 0;

    // TVA REGUL VARS
    let tva_regul_plus = 0;

    activeRows.forEach(code => {
      const def = TAX_DEFINITIONS.find(d => d.code === code);
      if (!def || def.section === 'TLS') return;

      const base = values[code] || 0;
      let tax = 0;

      if (['E1', 'E2', 'E1L', 'SAL', 'IBS_RS'].includes(def.section)) {
        if (def.rate === 'BAREME') {
          tax = manualTaxes[code] || 0;
        } else if (def.rate === 'VAR') {
          const rate = customRates[code] || 0;
          tax = base * (rate / 100);
        } else {
          tax = base * ((def.rate as number) / 100);
        }
      } 
      else if (def.section === 'IBS_LIQ') {
         if (def.group === 'A') {
            tax = base * ((def.rate as number) / 100);
            ibs_tax_A += tax;
         } else if (def.group === 'B') {
            if (code === 'E1B83') {
               const val = base * 0.005; 
               ibs_deductions_B += val;
            } else {
               ibs_deductions_B += base;
            }
         } else if (code === 'E1B91') {
            ibs_minimum = base;
         }
      }
      else if (def.section === 'E3') {
        if (code === 'E3L10') e3_tax_A = manualTaxes['E3L10'] || 0;
        else if (def.group === 'B') e3_deductions_B += base;
        else if (code === 'E3L90') e3_minimum = base;
      }
      else if (def.section === 'TVA') {
         if (def.isDeduction) {
            tva_deductible += base;
         } else if (def.group === 'REGUL') {
            tva_regul_plus += base;
         } else if (def.group === 'AUTOLIQ') {
            tva_autoliq += base;
         } else {
            tax = base * ((def.rate as number) / 100);
            tva_collectee += tax;
         }
      }
      else if (def.section === 'DTI') {
         if (def.rate === 'VAR') {
            const r = customRates[code] || 0;
            tax = def.isSpecificRate ? base * r : base * (r / 100);
         } else if (def.isSpecificRate) {
            tax = base * (def.rate as number);
         } else {
            tax = base * ((def.rate as number) / 100);
         }
         t_dti += tax;
      }
      else if (def.section === 'TIMBRE') {
         const rate = def.rate === 'VAR' ? (customRates[code] || 0) : def.rate as number;
         tax = base * (rate / 100);
         t_timbre += tax;
      }
      else if (def.section === 'AUTRES') {
         if (def.rate === 'BAREME') {
            tax = manualTaxes[code] || 0;
         } else if (def.rate === 'VAR') {
             // Cas spécial TAP ou Taux Variable
            const rate = customRates[code] || 0;
            tax = def.isSpecificRate ? base * rate : base * (rate / 100);
         } else if (def.isSpecificRate) {
            tax = base * (def.rate as number);
         } else {
            tax = base * ((def.rate as number) / 100);
         }
         t_autres += tax;
      }

      if (def.section === 'E1') t_s1 += tax;
      if (def.section === 'E2') t_s2 += tax;
      if (def.section === 'E1L') t_s3 += tax;
      if (def.section === 'SAL') t_sal += tax;
      if (def.section === 'IBS_RS') ibs_rs_total += tax;
    });

    // TVA CALCUL FINAL
    const total_C = tva_collectee + tva_regul_plus;
    const solde_tva = total_C - tva_deductible;
    const a_payer_mois = solde_tva > 0 ? solde_tva : 0;
    const credit_report = solde_tva < 0 ? Math.abs(solde_tva) : 0;
    
    // Total TVA à payer incluant l'auto-liquidée
    t_tva = a_payer_mois + tva_autoliq;

    // TLS Calculation
    if (tlsOptionAcomptes) {
        const part2Codes = TAX_DEFINITIONS.filter(d => d.section === 'TLS' && d.code.startsWith('E4_A_'));
        part2Codes.forEach(def => {
            const val = values[def.code] || 0;
            t_tls += val;
        });
    } else {
        const part1Codes = TAX_DEFINITIONS.filter(d => d.section === 'TLS' && (d.code === 'E4_M_HYDRO' || d.code.startsWith('E4_M_MINIER')));
        part1Codes.forEach(def => {
            const base = values[def.code] || 0;
            const exempt = exemptValues[def.code] || 0;
            const taxableBase = Math.max(0, base - exempt);
            
            let tax = 0;
            if (def.isRefaction) {
               const baseRefaite = taxableBase * 0.70;
               tax = baseRefaite * ((def.rate as number) / 100);
            } else {
               tax = taxableBase * ((def.rate as number) / 100);
            }
            t_tls += tax;
        });
    }

    const e3_solde_brut = e3_tax_A - e3_deductions_B;
    const e3_solde_a_payer = Math.max(0, e3_solde_brut);
    t_liq = Math.max(e3_solde_a_payer, e3_minimum);

    const ibs_solde_brut = ibs_tax_A - ibs_deductions_B;
    const ibs_solde_a_payer = Math.max(0, ibs_solde_brut);
    const ibs_liquidation_final = Math.max(ibs_solde_a_payer, ibs_minimum);
    t_ibs = ibs_liquidation_final + ibs_rs_total;

    return { 
      s1: t_s1, s2: t_s2, s3: t_s3, sal: t_sal, liq: t_liq, ibs: t_ibs, tls: t_tls, tva: t_tva, dti: t_dti, timbre: t_timbre, autres: t_autres,
      total: t_s1 + t_s2 + t_s3 + t_sal + t_liq + t_ibs + t_tls + t_tva + t_dti + t_timbre + t_autres,
      e3: { totalA: e3_tax_A, totalB: e3_deductions_B, solde: e3_solde_brut > 0 ? e3_solde_brut : 0, excedent: e3_solde_brut < 0 ? Math.abs(e3_solde_brut) : 0 },
      ibsData: { 
          totalA: ibs_tax_A, 
          totalB: ibs_deductions_B, 
          solde: ibs_solde_brut > 0 ? ibs_solde_brut : 0, 
          excedent: ibs_solde_brut < 0 ? Math.abs(ibs_solde_brut) : 0, 
          rsTotal: ibs_rs_total,
          finalPayable: ibs_liquidation_final
      },
      tvaData: { 
          collectee: tva_collectee, 
          deductible: tva_deductible, 
          regulPlus: tva_regul_plus,
          totalC: total_C,
          aPayerMois: a_payer_mois,
          creditReport: credit_report,
          autoLiq: tva_autoliq,
          totalAPayer: t_tva
      }
    };
  }, [values, exemptValues, activeRows, customRates, manualTaxes, tlsOptionAcomptes]);

  const handleValueChange = (code: string, val: string) => {
    const numVal = parseFloat(val) || 0;
    setValues(prev => ({ ...prev, [code]: numVal }));
    if (code === 'E3L10') {
      setManualTaxes(prev => ({ ...prev, [code]: calculateIrgScale(numVal) }));
    }
  };

  const handleExemptChange = (code: string, val: string) => {
    const numVal = parseFloat(val) || 0;
    setExemptValues(prev => ({ ...prev, [code]: numVal }));
  };

  const handleTlsExoChange = (key: string, val: string) => {
     const numVal = parseFloat(val) || 0;
     setTlsExonerations(prev => ({ ...prev, [key]: numVal }));
  };

  const handleRateChange = (code: string, val: string) => setCustomRates(prev => ({ ...prev, [code]: parseFloat(val) || 0 }));
  const handleManualTaxChange = (code: string, val: string) => setManualTaxes(prev => ({ ...prev, [code]: parseFloat(val) || 0 }));
  const handleAddRubrics = (codes: string[]) => setActiveRows(prev => [...prev, ...codes]);
  
  const removeRow = (code: string) => {
    setActiveRows(prev => prev.filter(c => c !== code));
    const newVals = { ...values }; delete newVals[code]; setValues(newVals);
    const newExempts = { ...exemptValues }; delete newExempts[code]; setExemptValues(newExempts);
    const newTaxes = { ...manualTaxes }; delete newTaxes[code]; setManualTaxes(newTaxes);
  };

  const toggleSection = (sec: string) => setSectionsVisibility(prev => ({ ...prev, [sec]: !prev[sec as keyof typeof sectionsVisibility] }));
  const openRubricModal = (section: any, group: string | null = null) => setModalConfig({ isOpen: true, section, group });
  const formatMoney = (amount: number) => amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Fonctions de sauvegarde et d'impression
  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    const newDec: Declaration = {
        id: `G50-${Math.floor(Math.random() * 10000)}`,
        type: 'G50 Mensuel', // CORRECTION TYPE
        period: `${identification.periodMonth}/${identification.periodYear}`,
        regime: 'Réel', 
        submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
        status: status,
        amount: totals.total,
        taxpayerName: identification.nom
    };
    if (onSubmit) {
        onSubmit(newDec);
    } else {
        console.log("No onSubmit prop provided", newDec);
        alert(`Déclaration ${status === 'VALIDÉ' ? 'Validée' : 'Sauvegardée'} ! Montant: ${totals.total.toLocaleString()} DA`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleModule = (key: keyof typeof enabledModules) => {
      setEnabledModules(prev => ({...prev, [key]: !prev[key]}));
  };

  // --- RENDER WIZARD ---
  const renderWizard = () => (
    <div className="max-w-[1920px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 pb-32">
      {/* Modal */}
      {modalConfig.section && (
        <RubricSelectionModal 
          isOpen={modalConfig.isOpen}
          section={modalConfig.section}
          group={modalConfig.group}
          activeRows={activeRows}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onAdd={handleAddRubrics}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm sticky top-0 z-20">
        <div>
            {/* CORRECTION TITRE */}
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">G50 Mensuel</h1>
            <p className="text-slate-500 font-bold text-sm">Déclaration Mensuelle des Impôts</p>
        </div>
        <div className="flex items-center gap-4">
           {wizardStep === 'INPUT' && (
               <div className="text-right mr-4">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total à Payer</p>
                  <p className="text-2xl font-black text-slate-900">{formatMoney(totals.total)} <span className="text-sm text-slate-500">DA</span></p>
               </div>
           )}
           <button onClick={() => setViewMode('OFFICIAL')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
              <Printer className="w-4 h-4" /> Aperçu G50
           </button>
        </div>
      </div>
      
      {/* STEP 1: CONFIGURATION (CARTE A CARTE) */}
      {wizardStep === 'SELECTION' && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
               <h2 className="text-2xl font-black text-slate-900">Que souhaitez-vous déclarer ce mois-ci ?</h2>
               <p className="text-slate-500 text-sm">Sélectionnez uniquement les impôts et taxes qui vous concernent.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
               <SelectionCard title="IRG / Revenus" icon={PieChart} selected={enabledModules.irg} description="Salaires, RCM, Revenus Fonciers..." onClick={() => toggleModule('irg')} />
               <SelectionCard title="IBS (Sociétés)" icon={Building2} selected={enabledModules.ibs} description="Impôt sur les Bénéfices des Sociétés." onClick={() => toggleModule('ibs')} />
               <SelectionCard title="TVA" icon={Calculator} selected={enabledModules.tva} description="Taxe sur la Valeur Ajoutée." onClick={() => toggleModule('tva')} />
               <SelectionCard title="TLS (Taxe Locale)" icon={Truck} selected={enabledModules.tls} description="Taxe de Solidarité (Ex-TAP)." onClick={() => toggleModule('tls')} />
               <SelectionCard title="Droits & Taxes (DTI)" icon={Fuel} selected={enabledModules.dti} description="Taxes indirectes, produits pétroliers..." onClick={() => toggleModule('dti')} />
               <SelectionCard title="Droits de Timbre" icon={Stamp} selected={enabledModules.timbre} description="Timbre sur état, etc." onClick={() => toggleModule('timbre')} />
               <SelectionCard title="Autres Taxes" icon={LayoutList} selected={enabledModules.autres} description="Formation, Apprentissage, etc." onClick={() => toggleModule('autres')} />
            </div>
            <div className="flex justify-center pt-8">
               <button onClick={() => setWizardStep('INPUT')} className="bg-primary text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
                  Commencer la saisie <ArrowRight className="w-5 h-5" />
               </button>
            </div>
         </div>
      )}

      {/* STEP 2: SAISIE (AVEC NAVIGATION FILTRÉE) */}
      {wizardStep === 'INPUT' && (
      <div className="grid grid-cols-12 gap-8 h-full">
        {/* Navigation - Sidebar Gauche */}
        <div className="col-span-12 lg:col-span-2 space-y-2 sticky top-28 h-fit">
           <button onClick={() => setWizardStep('SELECTION')} className="w-full text-left px-4 py-3 mb-4 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Modifier la sélection
           </button>
           
           {[
             { id: 'sections_1_3', label: 'IRG / Revenus (Sec 1-4)', icon: PieChart, show: enabledModules.irg },
             { id: 'ibs', label: 'IBS (Sociétés)', icon: Building2, show: enabledModules.ibs },
             { id: 'tva', label: 'TVA', icon: Calculator, show: enabledModules.tva },
             { id: 'tls', label: 'Taxe Locale (TLS)', icon: Truck, show: enabledModules.tls },
             { id: 'dti', label: 'Droits & Taxes (DTI)', icon: Fuel, show: enabledModules.dti },
             { id: 'timbre', label: 'Droits de Timbre', icon: Stamp, show: enabledModules.timbre },
             { id: 'autres_taxes', label: 'Autres Taxes', icon: LayoutList, show: enabledModules.autres },
             { id: 'recap', label: 'Récapitulatif & Paiement', icon: FileCheck, show: true },
           ].filter(item => item.show).map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full text-left px-4 py-4 rounded-xl text-xs font-bold transition-all uppercase tracking-tight flex items-center justify-between ${activeTab === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
             >
               <span className="flex items-center gap-3">
                  {tab.icon && <tab.icon className="w-4 h-4 opacity-70" />}
                  {tab.label}
               </span>
               {tab.id === activeTab && <div className="w-2 h-2 bg-white rounded-full"></div>}
             </button>
           ))}
        </div>

        {/* Content - Centre */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
           
           {/* SECTIONS IRG */}
           {activeTab === 'sections_1_3' && (
             <>
               {/* SECTION 1 */}
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('s1')}>
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black">1</div>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Prestations de services (Entreprises étrangères)</h3>
                           <p className="text-[10px] text-slate-500 font-bold">Total: {formatMoney(totals.s1)} DA</p>
                        </div>
                     </div>
                     {sectionsVisibility.s1 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {sectionsVisibility.s1 && (
                    <div className="p-6 space-y-4">
                       {TAX_DEFINITIONS.filter(d => d.section === 'E1' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-blue-200 transition-all">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-black">{def.code}</span>
                                   <span className="text-xs font-bold text-slate-800">{def.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{def.description}</p>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center min-w-[60px]">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Taux</p>
                                   <p className="text-sm font-black text-slate-900">{def.rate}%</p>
                                </div>
                                <div className="flex-1 md:w-48">
                                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Imposable</p>
                                   <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="0.00" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm focus:ring-primary focus:border-primary" />
                                </div>
                                <button onClick={() => removeRow(def.code)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       ))}
                       <div className="mt-4"><button onClick={() => openRubricModal('E1')} className="flex items-center gap-2 text-xs font-black text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"><Plus className="w-4 h-4" /> Ajouter une rubrique (E1)</button></div>
                       
                       {/* Bouton Valider Section */}
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('s1')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                  )}
               </div>

               {/* SECTION 2 (E2) */}
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('s2')}>
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">2</div>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Revenus des Capitaux Mobiliers</h3>
                           <p className="text-[10px] text-slate-500 font-bold">Total: {formatMoney(totals.s2)} DA</p>
                        </div>
                     </div>
                     {sectionsVisibility.s2 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {sectionsVisibility.s2 && (
                    <div className="p-6 space-y-4">
                       {TAX_DEFINITIONS.filter(d => d.section === 'E2' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-indigo-200 transition-all">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-black">{def.code}</span>
                                   <span className="text-xs font-bold text-slate-800">{def.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{def.description}</p>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center min-w-[60px]">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Taux</p>
                                   <p className="text-sm font-black text-slate-900">{def.rate === 'VAR' ? 'Var' : def.rate + '%'}</p>
                                </div>
                                <div className="flex-1 md:w-48">
                                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Imposable</p>
                                   <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="0.00" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm focus:ring-primary focus:border-primary" />
                                </div>
                                <button onClick={() => removeRow(def.code)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       ))}
                       <div className="mt-4"><button onClick={() => openRubricModal('E2')} className="flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /> Ajouter une rubrique (E2)</button></div>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('s2')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                  )}
               </div>

               {/* SECTION 3 (E1L) */}
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('s3')}>
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black">3</div>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Revenus Fonciers</h3>
                           <p className="text-[10px] text-slate-500 font-bold">Total: {formatMoney(totals.s3)} DA</p>
                        </div>
                     </div>
                     {sectionsVisibility.s3 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {sectionsVisibility.s3 && (
                    <div className="p-6 space-y-4">
                       {TAX_DEFINITIONS.filter(d => d.section === 'E1L' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-black">{def.code}</span>
                                   <span className="text-xs font-bold text-slate-800">{def.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{def.description}</p>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center min-w-[60px]">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Taux</p>
                                   <p className="text-sm font-black text-slate-900">{def.rate}%</p>
                                </div>
                                <div className="flex-1 md:w-48">
                                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Imposable</p>
                                   <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="0.00" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm focus:ring-primary focus:border-primary" />
                                </div>
                                <button onClick={() => removeRow(def.code)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       ))}
                       <div className="mt-4"><button onClick={() => openRubricModal('E1L')} className="flex items-center gap-2 text-xs font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"><Plus className="w-4 h-4" /> Ajouter une rubrique (E1L)</button></div>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('s3')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                  )}
               </div>

               {/* SECTION 4 (SAL) */}
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('sal')}>
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-black">4</div>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Traitements et Salaires</h3>
                           <p className="text-[10px] text-slate-500 font-bold">Total: {formatMoney(totals.sal)} DA</p>
                        </div>
                     </div>
                     {sectionsVisibility.sal ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {sectionsVisibility.sal && (
                    <div className="p-6 space-y-4">
                       {TAX_DEFINITIONS.filter(d => d.section === 'SAL' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-black">{def.code}</span>
                                   <span className="text-xs font-bold text-slate-800">{def.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{def.description}</p>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center min-w-[60px]">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Taux</p>
                                   <p className="text-xs font-black text-slate-900">{def.rate === 'BAREME' ? 'Barème' : def.rate + '%'}</p>
                                </div>
                                <div className="flex-1 md:w-48">
                                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Imposable</p>
                                   <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="0.00" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm focus:ring-primary focus:border-primary" />
                                </div>
                                {def.rate === 'BAREME' && (
                                   <div className="flex-1 md:w-32">
                                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Montant IRG</p>
                                      <input type="number" value={manualTaxes[def.code] || ''} onChange={e => handleManualTaxChange(def.code, e.target.value)} placeholder="0.00" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm focus:ring-primary focus:border-primary text-purple-600" />
                                   </div>
                                )}
                                <button onClick={() => removeRow(def.code)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       ))}
                       <div className="mt-4"><button onClick={() => openRubricModal('SAL')} className="flex items-center gap-2 text-xs font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100 transition-colors"><Plus className="w-4 h-4" /> Ajouter une rubrique (SAL)</button></div>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('sal')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                  )}
               </div>
               
               {/* SECTION 5 (LIQUIDATION IRG) */}
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('liq')}>
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-black">5</div>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Solde de Liquidation IRG</h3>
                           <p className="text-[10px] text-slate-500 font-bold">Total: {formatMoney(totals.liq)} DA</p>
                        </div>
                     </div>
                     {sectionsVisibility.liq ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {sectionsVisibility.liq && (
                    <div className="p-6 space-y-4">
                       <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-black text-green-800 uppercase">Résultat Taxable (E3L10)</label>
                             <input type="number" value={values['E3L10'] || ''} onChange={e => handleValueChange('E3L10', e.target.value)} className="w-40 h-10 px-3 bg-white border border-green-200 rounded-xl text-right font-bold" />
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-green-700">Impôt dû (Barème)</span>
                             <span className="text-sm font-black text-green-900">{formatMoney(manualTaxes['E3L10'] || 0)} DA</span>
                          </div>
                       </div>
                       {/* Deductions E3 (Group B) */}
                       {TAX_DEFINITIONS.filter(d => d.section === 'E3' && d.group === 'B' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <span className="text-xs font-bold flex-1">{def.label}</span>
                             <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} className="w-32 h-8 px-2 border border-slate-200 rounded text-right text-sm" placeholder="Montant" />
                             <button onClick={() => removeRow(def.code)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       ))}
                       <button onClick={() => openRubricModal('E3')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-2"><Plus className="w-3 h-3" /> Ajouter déduction</button>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('liq')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                  )}
               </div>
             </>
           )}

           {/* IBS TAB */}
           {/* ... (Existing IBS Section Code is correct) ... */}
           {activeTab === 'ibs' && (
             <>
                {/* LIQUIDATION IBS */}
               <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('ibs_liq')}>
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">A</div>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Liquidation IBS (E1B)</h3>
                           <p className="text-[10px] text-slate-500 font-bold">Solde IBS: {formatMoney(Math.max(totals.ibsData.solde, values['E1B91'] || 0))} DA</p>
                        </div>
                     </div>
                     {sectionsVisibility.ibs_liq ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  {sectionsVisibility.ibs_liq && (
                    <div className="p-6 space-y-6">
                        {/* GROUPE A : IBS AU TAUX DE */}
                       <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-indigo-800 tracking-wider border-b border-indigo-100 pb-2">A) IBS au taux de :</h4>
                          {TAX_DEFINITIONS.filter(d => d.section === 'IBS_LIQ' && d.group === 'A').map(def => (
                             <div key={def.code} className="flex items-center gap-4">
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold rounded text-slate-600">{def.code}</span>
                                      <span className="text-xs font-bold text-slate-700">{def.label}</span>
                                   </div>
                                </div>
                                <div className="w-32 bg-white px-2 py-1 rounded border border-slate-200 text-center text-xs font-bold">{def.rate}%</div>
                                <div className="w-40">
                                   <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="Base (DA)" className="w-full h-9 px-3 border border-slate-200 rounded-lg text-right text-sm font-medium" />
                                </div>
                                <div className="w-32 text-right font-black text-sm text-slate-900">{formatMoney((values[def.code] || 0) * (def.rate as number / 100))}</div>
                             </div>
                          ))}
                       </div>
                       {/* GROUPE B : DEDUCTIONS */}
                       <div className="space-y-3 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider border-b border-slate-100 pb-2">B) Déductions & Acomptes</h4>
                          {TAX_DEFINITIONS.filter(d => d.section === 'IBS_LIQ' && d.group === 'B').map(def => (
                             <div key={def.code} className="flex items-center gap-4">
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold rounded text-slate-600">{def.code}</span>
                                      <span className="text-xs font-bold text-slate-700">{def.label}</span>
                                   </div>
                                </div>
                                <div className="w-40">
                                   <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="Montant" className="w-full h-9 px-3 border border-slate-200 rounded-lg text-right text-sm font-medium" />
                                </div>
                             </div>
                          ))}
                       </div>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('ibs_liq')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                  )}
               </div>
             </>
           )}

           {/* TVA TAB - MODIFIED */}
           {/* ... (Existing TVA Section Code is correct) ... */}
           {activeTab === 'tva' && (
             <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('tva')}>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-black">TVA</div>
                       <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">Taxe sur la Valeur Ajoutée</h3>
                          <p className="text-sm font-black text-slate-900">{formatMoney(totals.tva)} DA</p>
                       </div>
                    </div>
                    {sectionsVisibility.tva ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                 </div>
                 
                 {sectionsVisibility.tva && (
                    <div className="p-6 space-y-8">
                       
                       {/* A. 9% */}
                       <div className="space-y-3">
                          <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleTvaSub('s9')}>
                             <div className="flex items-center gap-2">
                                {tvaSubSections.s9 ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />}
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider group-hover:text-primary transition-colors">A) CA Imposable (Taux Réduit 9%)</h4>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); openRubricModal('TVA', '9'); }} className="flex items-center gap-1 text-primary hover:bg-primary/5 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors">
                                <Plus className="w-3 h-3" /> Ajouter
                             </button>
                          </div>
                          {tvaSubSections.s9 && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === '9' && activeRows.includes(d.code)).map(def => (
                                 <div key={def.code} className="flex items-center gap-4 p-2 bg-slate-50 rounded-xl">
                                    <div className="flex-1 text-xs font-bold text-slate-700">{def.code} - {def.label}</div>
                                    <div className="w-32"><input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="Base Imposable" className="w-full h-8 px-2 border border-slate-200 rounded text-right text-sm" /></div>
                                    <div className="w-24 text-right font-black text-xs">{formatMoney((values[def.code]||0)*0.09)}</div>
                                    <button onClick={() => removeRow(def.code)}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                 </div>
                              ))}
                            </div>
                          )}
                       </div>

                       {/* A. 19% */}
                       <div className="space-y-3 border-t border-slate-100 pt-4">
                          <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleTvaSub('s19')}>
                             <div className="flex items-center gap-2">
                                {tvaSubSections.s19 ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />}
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider group-hover:text-primary transition-colors">A) CA Imposable (Taux Normal 19%)</h4>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); openRubricModal('TVA', '19'); }} className="flex items-center gap-1 text-primary hover:bg-primary/5 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors">
                                <Plus className="w-3 h-3" /> Ajouter
                             </button>
                          </div>
                          {tvaSubSections.s19 && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === '19' && activeRows.includes(d.code)).map(def => (
                                 <div key={def.code} className="flex items-center gap-4 p-2 bg-slate-50 rounded-xl">
                                    <div className="flex-1 text-xs font-bold text-slate-700">{def.code} - {def.label}</div>
                                    <div className="w-32"><input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="Base Imposable" className="w-full h-8 px-2 border border-slate-200 rounded text-right text-sm" /></div>
                                    <div className="w-24 text-right font-black text-xs">{formatMoney((values[def.code]||0)*(def.rate as number/100))}</div>
                                    <button onClick={() => removeRow(def.code)}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                 </div>
                              ))}
                            </div>
                          )}
                       </div>

                       {/* NON IMPOSABLE */}
                       <div className="space-y-3 border-t border-slate-100 pt-4">
                          <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleTvaSub('nonImp')}>
                             <div className="flex items-center gap-2">
                                {tvaSubSections.nonImp ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />}
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider group-hover:text-primary transition-colors">3) CA Non-Imposable (Art 9)</h4>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); openRubricModal('TVA', 'NON_IMP'); }} className="flex items-center gap-1 text-primary hover:bg-primary/5 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors">
                                <Plus className="w-3 h-3" /> Ajouter
                             </button>
                          </div>
                          {tvaSubSections.nonImp && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === 'NON_IMP' && activeRows.includes(d.code)).map(def => (
                                 <div key={def.code} className="flex items-center gap-4 p-2 bg-white border border-slate-100 rounded-xl">
                                    <div className="flex-1 text-xs font-bold text-slate-600">{def.code} - {def.label}</div>
                                    <div className="w-32"><input type="number" value={exemptValues[def.code] || ''} onChange={e => handleExemptChange(def.code, e.target.value)} placeholder="Montant" className="w-full h-8 px-2 border border-slate-200 rounded text-right text-sm" /></div>
                                    <button onClick={() => removeRow(def.code)}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                 </div>
                              ))}
                            </div>
                          )}
                       </div>

                       {/* EXONERE */}
                       <div className="space-y-3 border-t border-slate-100 pt-4">
                          <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleTvaSub('exo')}>
                             <div className="flex items-center gap-2">
                                {tvaSubSections.exo ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />}
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider group-hover:text-primary transition-colors">4) CA Exonéré</h4>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); openRubricModal('TVA', 'EXO'); }} className="flex items-center gap-1 text-primary hover:bg-primary/5 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors">
                                <Plus className="w-3 h-3" /> Ajouter
                             </button>
                          </div>
                          {tvaSubSections.exo && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === 'EXO' && activeRows.includes(d.code)).map(def => (
                                 <div key={def.code} className="flex items-center gap-4 p-2 bg-white border border-slate-100 rounded-xl">
                                    <div className="flex-1 text-xs font-bold text-slate-600">{def.code} - {def.label}</div>
                                    <div className="w-32"><input type="number" value={exemptValues[def.code] || ''} onChange={e => handleExemptChange(def.code, e.target.value)} placeholder="Montant" className="w-full h-8 px-2 border border-slate-200 rounded text-right text-sm" /></div>
                                    <button onClick={() => removeRow(def.code)}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                 </div>
                              ))}
                            </div>
                          )}
                       </div>

                       {/* DEDUCTIONS */}
                       <div className="space-y-3 border-t border-slate-100 pt-4 bg-red-50/30 p-4 rounded-xl">
                          <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleTvaSub('ded')}>
                             <div className="flex items-center gap-2">
                                {tvaSubSections.ded ? <ChevronUp className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" /> : <ChevronDown className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />}
                                <h4 className="text-xs font-black uppercase text-red-800 tracking-wider group-hover:text-red-600 transition-colors">B) Déductions à Opérer</h4>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); openRubricModal('TVA', 'DED'); }} className="flex items-center gap-1 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors">
                                <Plus className="w-3 h-3" /> Ajouter
                             </button>
                          </div>
                          {tvaSubSections.ded && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === 'DED' && activeRows.includes(d.code)).map(def => (
                                 <div key={def.code} className="flex items-center gap-4 p-2 rounded-xl hover:bg-red-50 transition-colors">
                                    <div className="flex-1 text-xs font-bold text-slate-700">{def.code} - {def.label}</div>
                                    <div className="w-32"><input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="TVA Déductible" className="w-full h-8 px-2 border border-red-200 rounded text-right text-sm text-red-700 font-bold focus:ring-red-200 focus:border-red-400" /></div>
                                    <button onClick={() => removeRow(def.code)}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                 </div>
                              ))}
                            </div>
                          )}
                       </div>

                       {/* REGULARISATIONS & SOLDE (NOUVEAU) */}
                       <div className="space-y-3 border-t border-slate-100 pt-4 p-4 rounded-xl bg-indigo-50/30">
                          <h4 className="text-xs font-black uppercase text-indigo-800 tracking-wider">C) Régularisations & Solde</h4>
                          {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && (d.group === 'REGUL' || d.group === 'AUTOLIQ')).map(def => (
                             <div key={def.code} className="flex items-center gap-4">
                                <div className="flex-1 text-xs font-bold text-slate-700">{def.code} - {def.label}</div>
                                <div className="w-32"><input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder="Montant" className="w-full h-8 px-2 border border-slate-200 rounded text-right text-sm font-bold" /></div>
                             </div>
                          ))}
                       </div>

                       <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center">
                          <div className="space-y-1">
                             <p className="text-xs font-black uppercase opacity-60">TVA à Payer (Total)</p>
                             <p className="text-[10px] opacity-40">(Collectée + Régul) - Déductible + Autoliq</p>
                          </div>
                          <div className="text-right">
                             <p className="text-2xl font-black">{formatMoney(totals.tvaData.totalAPayer)} DA</p>
                             {totals.tvaData.creditReport > 0 && <p className="text-xs text-green-400 font-bold">Crédit Reportable : {formatMoney(totals.tvaData.creditReport)}</p>}
                          </div>
                       </div>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('tva')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                 )}
             </div>
           )}

           {/* TLS, DTI, AUTRES SECTIONS (Code existant conservé) */}
           {/* ... (Sections TLS, DTI, Autres, Timbre inchangées) ... */}
           {activeTab === 'tls' && (
             <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                 {/* ... Code TLS complet ... */}
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('tls')}>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">TLS</div>
                       <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">Taxe Locale de Solidarité</h3>
                          <p className="text-sm font-black text-slate-900">{formatMoney(totals.tls)} DA</p>
                       </div>
                    </div>
                    {sectionsVisibility.tls ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                 </div>
                 {sectionsVisibility.tls && (
                    <div className="p-6 space-y-8">
                       <div className="flex items-center gap-4 p-1 bg-slate-100 rounded-xl">
                          <button onClick={() => setTlsOptionAcomptes(false)} className={`flex-1 py-3 text-xs font-black uppercase rounded-lg transition-all ${!tlsOptionAcomptes ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>I - Régime Paiement Mensuel</button>
                          <button onClick={() => setTlsOptionAcomptes(true)} className={`flex-1 py-3 text-xs font-black uppercase rounded-lg transition-all ${tlsOptionAcomptes ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>II - Régime des Acomptes</button>
                       </div>
                       {!tlsOptionAcomptes ? (
                          <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                             {/* HYDRO */}
                             <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100">
                                <h4 className="text-xs font-black text-emerald-800 uppercase mb-4 flex items-center gap-2"><Fuel className="w-4 h-4" /> 1) Transport Hydrocarbures (3%)</h4>
                                <div className="flex gap-4 items-center">
                                   <div className="flex-1"><input type="number" value={values['E4_M_HYDRO'] || ''} onChange={e => handleValueChange('E4_M_HYDRO', e.target.value)} placeholder="Base Imposable" className="w-full h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm bg-white" /></div>
                                   <div className="w-32 text-right font-black text-sm text-emerald-900">{formatMoney((values['E4_M_HYDRO'] || 0) * 0.03)} DA</div>
                                </div>
                             </div>
                             {/* MINES */}
                             <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100">
                                <h4 className="text-xs font-black text-emerald-800 uppercase mb-4 flex items-center gap-2"><PickaxeIcon className="w-4 h-4" /> 2) Activités Minières (1.5%)</h4>
                                <div className="space-y-4">
                                   <div className="flex gap-4 items-center"><span className="text-xs font-bold w-40">Sans réfaction</span><input type="number" value={values['E4_M_MINIER'] || ''} onChange={e => handleValueChange('E4_M_MINIER', e.target.value)} className="flex-1 h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm bg-white" /><div className="w-32 text-right font-black text-sm text-emerald-900">{formatMoney((values['E4_M_MINIER'] || 0) * 0.015)} DA</div></div>
                                   <div className="flex gap-4 items-center"><span className="text-xs font-bold w-40">Avec réfaction 30%</span><input type="number" onChange={e => handleValueChange('E4_M_MINIER_REF', ((parseFloat(e.target.value)||0) * 0.7).toString())} placeholder="Montant Brut" className="flex-1 h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm bg-white" /><div className="w-32 text-right font-black text-sm text-emerald-900">{formatMoney((values['E4_M_MINIER_REF'] || 0) * 0.015)} DA</div></div>
                                </div>
                             </div>
                             {/* EXONERATIONS */}
                             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <h4 className="text-xs font-black text-slate-600 uppercase mb-4">Opérations Exonérées (Déductibles)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                   {['AAPI', 'ANDI', 'ANADE', 'ANGEM', 'CNAC', 'Intra-groupe', 'Inter-unités', 'Autres'].map(label => (
                                      <div key={label} className="space-y-1">
                                         <label className="text-[9px] font-bold text-slate-400 uppercase truncate block" title={label}>{label}</label>
                                         <input 
                                            type="number" 
                                            value={tlsExonerations[label] || ''}
                                            onChange={e => handleTlsExoChange(label, e.target.value)}
                                            className="w-full h-8 px-2 border border-slate-200 rounded-lg text-xs font-medium text-right focus:border-emerald-500" 
                                            placeholder="0.00"
                                         />
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       ) : (
                          /* REGIME ACOMPTES RESTAURÉ */
                          <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                             {/* HYDRO ACOMPTES */}
                             <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100 space-y-4">
                                <div className="flex justify-between items-center">
                                   <h4 className="text-xs font-black text-emerald-800 uppercase flex items-center gap-2">
                                      <Fuel className="w-4 h-4" /> 1) Transport Hydrocarbures (Acomptes)
                                   </h4>
                                   <div className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-emerald-100 text-emerald-600">Taux: 3%</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <input 
                                      type="text" 
                                      placeholder="Période de référence / Date notif." 
                                      value={tlsAdditionalData.hydroRef}
                                      onChange={e => setTlsAdditionalData({...tlsAdditionalData, hydroRef: e.target.value})}
                                      className="col-span-2 w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"
                                   />
                                   <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Montant Acompte</label>
                                      <input 
                                         type="number" 
                                         value={values['E4_A_HYDRO_AC'] || ''} 
                                         onChange={e => handleValueChange('E4_A_HYDRO_AC', e.target.value)} 
                                         className="w-full h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm text-right"
                                      />
                                   </div>
                                   <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Solde Liquidation</label>
                                      <input 
                                         type="number" 
                                         value={values['E4_A_HYDRO_SOL'] || ''} 
                                         onChange={e => handleValueChange('E4_A_HYDRO_SOL', e.target.value)} 
                                         className="w-full h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm text-right"
                                      />
                                   </div>
                                </div>
                             </div>
                             {/* MINES ACOMPTES */}
                             <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100 space-y-4">
                                <div className="flex justify-between items-center">
                                   <h4 className="text-xs font-black text-emerald-800 uppercase flex items-center gap-2">
                                      <PickaxeIcon className="w-4 h-4" /> 2) Activités Minières (Acomptes)
                                   </h4>
                                   <div className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-emerald-100 text-emerald-600">Taux: 1.5%</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <input 
                                      type="text" 
                                      placeholder="Période de référence / Date notif." 
                                      value={tlsAdditionalData.minierRef}
                                      onChange={e => setTlsAdditionalData({...tlsAdditionalData, minierRef: e.target.value})}
                                      className="col-span-2 w-full h-10 px-3 border border-slate-200 rounded-xl text-sm"
                                   />
                                   <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Montant Acompte</label>
                                      <input 
                                         type="number" 
                                         value={values['E4_A_MINIER_AC'] || ''} 
                                         onChange={e => handleValueChange('E4_A_MINIER_AC', e.target.value)} 
                                         className="w-full h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm text-right"
                                      />
                                   </div>
                                   <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Solde Liquidation</label>
                                      <input 
                                         type="number" 
                                         value={values['E4_A_MINIER_SOL'] || ''} 
                                         onChange={e => handleValueChange('E4_A_MINIER_SOL', e.target.value)} 
                                         className="w-full h-10 px-3 border border-emerald-200 rounded-xl font-bold text-sm text-right"
                                      />
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('tls')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                 )}
             </div>
           )}

           {activeTab === 'dti' && (
             <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                 {/* ... Code DTI ... */}
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('dti')}>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black">DTI</div>
                       <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">Droits et Taxes Indirects</h3>
                          <p className="text-sm font-black text-slate-900">{formatMoney(totals.dti)} DA</p>
                       </div>
                    </div>
                    {sectionsVisibility.dti ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                 </div>
                 {sectionsVisibility.dti && (
                    <div className="p-6 space-y-6">
                       {TAX_DEFINITIONS.filter(d => d.section === 'DTI' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <div className="flex-1">
                                <span className="text-xs font-bold text-slate-800">{def.label}</span>
                                <p className="text-[10px] text-slate-500 italic">{def.description}</p>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center min-w-[80px]">
                                   {def.rate === 'VAR' ? <input type="number" value={customRates[def.code] || ''} onChange={e => handleRateChange(def.code, e.target.value)} className="w-full text-center border-none p-0 text-xs font-bold bg-transparent" placeholder="Tarif" /> : <p className="text-xs font-black text-slate-900">{def.isSpecificRate ? `${def.rate} DA` : `${def.rate}%`}</p>}
                                </div>
                                <div className="flex-1 md:w-40"><input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder={`Base (${def.unit || 'Val'})`} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm" /></div>
                                <button onClick={() => removeRow(def.code)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       ))}
                       <button onClick={() => openRubricModal('DTI')} className="flex items-center gap-2 text-xs font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors"><Plus className="w-4 h-4" /> Ajouter Droit/Taxe</button>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('dti')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                 )}
             </div>
           )}

           {/* SECTION AUTRES TAXES - MODIFIED FOR WIZARD */}
           {activeTab === 'autres_taxes' && (
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => toggleSection('autres')}>
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-black">AUT</div>
                       <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">Autres Taxes Diverses</h3>
                          <p className="text-sm font-black text-slate-900">{formatMoney(totals.autres)} DA</p>
                       </div>
                    </div>
                    {sectionsVisibility.autres ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                 </div>
                 
                 {sectionsVisibility.autres && (
                    <div className="p-6 space-y-6">
                       {TAX_DEFINITIONS.filter(d => d.section === 'AUTRES' && activeRows.includes(d.code)).map(def => (
                          <div key={def.code} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-white text-[9px] font-bold rounded border border-slate-200 text-slate-600">{def.code}</span>
                                  <span className="text-xs font-bold text-slate-800">{def.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 italic mt-1">{def.description}</p>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center min-w-[80px]">
                                   {def.rate === 'VAR' ? (
                                      <input type="number" value={customRates[def.code] || ''} onChange={e => handleRateChange(def.code, e.target.value)} className="w-full text-center border-none p-0 text-xs font-bold bg-transparent placeholder:text-slate-400" placeholder="Taux %" />
                                   ) : def.rate === 'BAREME' ? (
                                      <span className="text-[10px] font-black text-slate-500 uppercase">Barème</span>
                                   ) : (
                                      <p className="text-xs font-black text-slate-900">{def.isSpecificRate ? `${def.rate} DA` : `${def.rate}%`}</p>
                                   )}
                                </div>

                                {def.rate === 'BAREME' ? (
                                   <div className="flex-1 md:w-40">
                                      <input type="number" value={manualTaxes[def.code] || ''} onChange={e => handleManualTaxChange(def.code, e.target.value)} placeholder="Montant à Payer" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm text-pink-600 focus:ring-pink-500 focus:border-pink-500" />
                                   </div>
                                ) : (
                                   <div className="flex-1 md:w-40">
                                      <input type="number" value={values[def.code] || ''} onChange={e => handleValueChange(def.code, e.target.value)} placeholder={`Base (${def.unit || 'Imposable'})`} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-right font-bold text-sm" />
                                   </div>
                                )}
                                
                                <button onClick={() => removeRow(def.code)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       ))}
                       <button onClick={() => openRubricModal('AUTRES')} className="flex items-center gap-2 text-xs font-black text-pink-600 bg-pink-50 px-4 py-2 rounded-xl hover:bg-pink-100 transition-colors"><Plus className="w-4 h-4" /> Ajouter une Autre Taxe</button>
                       
                       <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                          <button onClick={() => toggleSection('autres')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                             <CheckCircle2 className="w-4 h-4" /> Valider la section
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           )}

           {/* AUTRES SECTIONS - TIMBRE (Keep simple view here if not in main loop) */}
           {activeTab === 'timbre' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                 <h3 className="font-bold text-slate-900 mb-4">Droits de Timbre</h3>
                 <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold w-40">Droit de Timbre sur Etat</span>
                    {/* Base Imposable Input */}
                    <input 
                      type="number" 
                      value={values['E2E12_TIMBRE'] || ''} 
                      onChange={e => handleValueChange('E2E12_TIMBRE', e.target.value)} 
                      placeholder="Base Imposable" 
                      className="h-10 px-3 border border-slate-200 rounded-xl w-40 text-right" 
                    />
                    {/* Taux Variable Input */}
                    <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={customRates['E2E12_TIMBRE'] || ''} 
                          onChange={e => handleRateChange('E2E12_TIMBRE', e.target.value)} 
                          placeholder="Taux" 
                          className="h-10 px-3 border border-slate-200 rounded-xl w-24 text-center" 
                        />
                        <span className="text-xs font-bold">%</span>
                    </div>
                    {/* Calculated Amount */}
                    <div className="text-sm font-black ml-4">
                        {formatMoney((values['E2E12_TIMBRE'] || 0) * ((customRates['E2E12_TIMBRE'] || 0) / 100))} DA
                    </div>
                 </div>
              </div>
           )}
           
           {/* --- NOUVEL ONGLET : RECAPITULATIF & PAIEMENT (SECTION 10) --- */}
            {activeTab === 'recap' && (
               <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
                  
                  {/* Header Section */}
                  <div className="flex items-center gap-3 mb-2 px-2">
                     <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                        <FileCheck className="w-5 h-5" />
                     </div>
                     <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">SECTION 10 : RÉCAPITULATIF & PAIEMENT</h2>
                  </div>

                  {/* Main Card */}
                  <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-10 -mt-10"></div>
                     
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">DÉTAIL DES DROITS DUS</h3>
                     
                     <div className="space-y-0">
                        {[
                           { label: "1. Retenues Prestations Etrangères", val: totals.s1, section: 'sections_1_3', key: 's1' },
                           { label: "2. Retenues RCM", val: totals.s2, section: 'sections_1_3', key: 's2' },
                           { label: "3. Retenues Loyers", val: totals.s3, section: 'sections_1_3', key: 's3' },
                           { label: "4. Retenues Salaires", val: totals.sal, section: 'sections_1_3', key: 'sal' },
                           { label: "5. IRG / IBS (Solde de liquidation)", val: Math.max(totals.liq, totals.ibs), section: totals.ibs > 0 ? 'ibs' : 'sections_1_3', key: totals.ibs > 0 ? 'ibs_liq' : 'liq' },
                           { label: "7. Taxe Locale de Solidarité (TLS)", val: totals.tls, section: 'tls', key: 'tls' },
                           { label: "8. Droits et Taxes Indirects", val: totals.dti, section: 'dti', key: 'dti' },
                           { label: "9. Droits de Timbre", val: totals.timbre, section: 'timbre', key: 'timbre' },
                           { label: "10. Autres Taxes", val: totals.autres, section: 'autres_taxes', key: 'autres' },
                           { label: "11. TVA à payer", val: totals.tvaData.totalAPayer, section: 'tva', key: 'tva' },
                        ].map((row, i) => (
                           <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                              <span className="text-sm font-bold text-slate-600">{row.label}</span>
                              <div className="flex items-center gap-4">
                                 <span className="text-sm font-black text-slate-900">{formatMoney(row.val)} DA</span>
                                 <button 
                                    onClick={() => handleEditSection(row.section, row.key as keyof typeof sectionsVisibility)} 
                                    className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2"
                                    title="Modifier cette section"
                                 >
                                    <span className="text-[10px] font-bold uppercase hidden md:inline">Modifier</span>
                                    <Edit className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Total Général */}
                     <div className="flex justify-between items-center pt-8 mt-4 border-t-2 border-slate-100">
                        <span className="text-lg font-black text-slate-900 uppercase tracking-tight">TOTAL GÉNÉRAL</span>
                        <span className="text-3xl font-black text-blue-600 tracking-tighter">{formatMoney(totals.total)} DA</span>
                     </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
                     <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                     <p className="text-xs font-bold text-blue-800 leading-relaxed">
                        En validant, vous certifiez l'exactitude des montants déclarés. Le paiement peut être effectué par virement (recommandé) ou chèque bancaire.
                     </p>
                  </div>
               </div>
            )}
        </div>

        {/* SIDEBAR DROITE : RÉSUMÉ LIVE (STICKY) */}
        <div className="col-span-12 lg:col-span-3 space-y-6 hidden lg:block sticky top-28 h-fit">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg"><Coins className="w-5 h-5 text-primary" /></div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Total Estimé</h3>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-4xl font-black tracking-tighter">{formatMoney(totals.total)}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dinars Algériens</p>
                    </div>

                    <div className="h-px bg-white/10 w-full"></div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>TVA</span>
                            <span className="text-white font-bold">{formatMoney(totals.tva)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>IRG/IBS</span>
                            <span className="text-white font-bold">{formatMoney(totals.liq + totals.ibs)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>TLS (TAP)</span>
                            <span className="text-white font-bold">{formatMoney(totals.tls)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>Salaires</span>
                            <span className="text-white font-bold">{formatMoney(totals.sal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Statut Décla.</h4>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-slate-700">En cours de saisie...</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">Dernière sauvegarde auto : il y a 2 min.</p>
            </div>
        </div>

      </div>
      )}
      
      {/* Sticky Action Bar Footer (Visible on all tabs now) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:px-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-4">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL G50 CALCULÉ :</span>
               <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatMoney(totals.total)} DZD</span>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
               <button onClick={() => handleSave('BROUILLON')} className="flex-1 md:flex-none px-6 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> SAUVEGARDER BROUILLON
               </button>
               {/* BOUTON GÉNÉRER (Mène à l'Aperçu Officiel) */}
               <button onClick={() => setViewMode('OFFICIAL')} className="flex-1 md:flex-none px-8 py-3.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> GÉNÉRER LE FORMULAIRE G50
               </button>
            </div>
         </div>
      </div>

    </div>
  );

  // --- RENDER OFFICIAL VIEW ---
  // ... (Code ViewMode 'OFFICIAL' inchangé) ...
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

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] text-black font-sans text-[10px] leading-tight box-border print:w-full print:shadow-none">
        
        {/* HEADER */}
        <div className="flex border-2 border-black mb-2">
           <div className="w-1/3 p-2 border-r border-black text-center"><p>المديرية العامة للضرائب</p><p className="font-bold">DIRECTION GENERALE DES IMPOTS</p><p className="mt-2 text-left">Service .....................................</p></div>
           <div className="flex-1 p-2 text-center"><h1 className="font-bold text-sm">G50 : DECLARATION MENSUELLE</h1><p className="font-bold border border-black inline-block px-2 mt-1">IMPOTS ET TAXES PERCUS AU COMPTANT</p></div>
           <div className="w-1/4 p-2 border-l border-black text-center"><p className="font-bold">Série G n°50</p></div>
        </div>

        {/* IDENTIFICATION */}
        <div className="border-2 border-black rounded-lg p-2 mb-2">
           <div className="flex gap-4 mb-2"><span className="font-bold">NIF :</span><span className="font-mono">{identification.nif}</span></div>
           <p><span className="font-bold">Nom/Raison :</span> {identification.nom}</p>
        </div>

        {/* SECTIONS 1-4 (IRG) */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead><tr className="bg-gray-100"><th colSpan={5} className="border border-black p-1 text-left font-bold">REVENUS ET SALAIRES (Sections 1 à 4)</th></tr></thead>
           <tbody>
              {/* E1, E2, E1L, SAL rows... */}
              {TAX_DEFINITIONS.filter(d => ['E1', 'E2', 'E1L', 'SAL'].includes(d.section)).map(def => (
                 <tr key={def.code}><td className="border border-black p-1 w-12 text-center font-bold">{def.code}</td><td className="border border-black p-1">{def.label}</td><td className="border border-black p-1 text-right">{values[def.code] ? formatMoney(values[def.code]) : ''}</td><td className="border border-black p-1 text-center">{def.rate === 'BAREME' ? 'Barème' : def.rate + '%'}</td><td className="border border-black p-1 text-right font-bold">{values[def.code] ? formatMoney(def.rate === 'BAREME' ? (manualTaxes[def.code] || 0) : values[def.code] * (def.rate as number / 100)) : ''}</td></tr>
              ))}
              <tr className="bg-gray-50"><td colSpan={4} className="border border-black p-1 text-right font-bold">Sous-Total IRG</td><td className="border border-black p-1 text-right font-black">{formatMoney(totals.s1 + totals.s2 + totals.s3 + totals.sal)}</td></tr>
           </tbody>
        </table>

        {/* SECTION 5 (LIQ IRG) */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead><tr className="bg-gray-100"><th colSpan={5} className="border border-black p-1 text-left font-bold">LIQUIDATION IRG (Section 5)</th></tr></thead>
           <tbody>
              <tr><td className="border border-black p-1 w-12 font-bold text-center">E3L10</td><td className="border border-black p-1">Résultat Taxable</td><td className="border border-black p-1 text-right">{values['E3L10'] ? formatMoney(values['E3L10']) : ''}</td><td className="border border-black p-1 text-center">Barème</td><td className="border border-black p-1 text-right font-bold">{manualTaxes['E3L10'] ? formatMoney(manualTaxes['E3L10']) : ''}</td></tr>
              <tr className="bg-gray-50"><td colSpan={4} className="border border-black p-1 text-right font-bold">Solde Liquidation</td><td className="border border-black p-1 text-right font-black">{formatMoney(totals.liq)}</td></tr>
           </tbody>
        </table>

        {/* SECTION 6-7 (IBS) */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead><tr className="bg-gray-100"><th colSpan={5} className="border border-black p-1 text-left font-bold">IBS (Sections 6 & 7)</th></tr></thead>
           <tbody>
              {/* Liquidation rows */}
              {TAX_DEFINITIONS.filter(d => d.section === 'IBS_LIQ' && d.group === 'A').map(def => (
                 <tr key={def.code}><td className="border border-black p-1 font-bold text-center">{def.code}</td><td className="border border-black p-1">{def.label}</td><td className="border border-black p-1 text-right">{values[def.code] ? formatMoney(values[def.code]) : ''}</td><td className="border border-black p-1 text-center">{def.rate}%</td><td className="border border-black p-1 text-right font-bold">{values[def.code] ? formatMoney(values[def.code] * (def.rate as number / 100)) : ''}</td></tr>
              ))}
              {/* RS rows */}
              {TAX_DEFINITIONS.filter(d => d.section === 'IBS_RS').map(def => (
                 <tr key={def.code}><td className="border border-black p-1 font-bold text-center">{def.code}</td><td className="border border-black p-1 italic">{def.label} (RS)</td><td className="border border-black p-1 text-right">{values[def.code] ? formatMoney(values[def.code]) : ''}</td><td className="border border-black p-1 text-center">{def.rate === 'VAR' ? '...' : def.rate + '%'}</td><td className="border border-black p-1 text-right font-bold">{values[def.code] ? formatMoney(values[def.code] * ((customRates[def.code] || (def.rate as number)) / 100)) : ''}</td></tr>
              ))}
              <tr className="bg-gray-50"><td colSpan={4} className="border border-black p-1 text-right font-bold">Sous-Total IBS</td><td className="border border-black p-1 text-right font-black">{formatMoney(totals.ibs)}</td></tr>
           </tbody>
        </table>

        {/* SECTION 11 (TVA) - TABLEAU SPÉCIFIQUE */}
        <div className="mb-4">
          <div className="bg-gray-100 border border-black p-1 text-left font-bold text-sm">TAXE SUR LE CHIFFRE D’AFFAIRES</div>
          <div className="bg-gray-50 border-x border-b border-black p-1 text-left font-bold text-xs pl-4">I°-TAXE SUR LA VALEUR AJOUTEE:</div>
          <table className="w-full border-collapse border border-black">
             <thead>
                <tr className="bg-gray-50 text-[9px] text-center font-bold">
                   <td className="border border-black p-1 w-12">Code</td>
                   <td className="border border-black p-1">Désignation</td>
                   <td className="border border-black p-1 w-20">Chiffre d'Affaires Global</td>
                   <td className="border border-black p-1 w-20">Chiffre d'Affaires imposable</td>
                   <td className="border border-black p-1 w-20">Chiffre d'Affaires Exonéré</td>
                   <td className="border border-black p-1 w-10">Taux</td>
                   <td className="border border-black p-1 w-20">TVA à payer (en DA)</td>
                </tr>
             </thead>
             <tbody className="text-[9px]">
                {/* A/ CA Imposables 9% */}
                <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50">A/ Chiffres d’affaires Imposables (9%) : 1) Opérations assujettis à la TVA</td></tr>
                {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === '9').map(def => (
                   <tr key={def.code}>
                      <td className="border border-black p-1 text-center font-bold">{def.code}</td>
                      <td className="border border-black p-1">- {def.label}</td>
                      <td className="border border-black p-1 text-right">...................</td>
                      <td className="border border-black p-1 text-right">{values[def.code] ? formatMoney(values[def.code]) : '...................'}</td>
                      <td className="border border-black p-1 text-right">...................</td>
                      <td className="border border-black p-1 text-center">9%</td>
                      <td className="border border-black p-1 text-right font-bold">{values[def.code] ? formatMoney(values[def.code] * 0.09) : '...................'}</td>
                   </tr>
                ))}
                
                {/* A/ CA Imposables 19% */}
                <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50">2) Opérations assujettis à la TVA (19%)</td></tr>
                {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === '19').map(def => (
                   <tr key={def.code}>
                      <td className="border border-black p-1 text-center font-bold">{def.code}</td>
                      <td className="border border-black p-1">- {def.label}</td>
                      <td className="border border-black p-1 text-right">...................</td>
                      <td className="border border-black p-1 text-right">{values[def.code] ? formatMoney(values[def.code]) : '...................'}</td>
                      <td className="border border-black p-1 text-right">...................</td>
                      <td className="border border-black p-1 text-center">{def.rate}%</td>
                      <td className="border border-black p-1 text-right font-bold">{values[def.code] ? formatMoney(values[def.code] * (def.rate as number/100)) : '...................'}</td>
                   </tr>
                ))}

                <tr className="bg-gray-100">
                   <td className="border border-black p-1 font-bold text-center">11-1</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-bold">Sous total TVA Collectée (C)</td>
                   <td className="border border-black p-1 text-right font-black">{formatMoney(totals.tvaData.collectee)}</td>
                </tr>

                {/* 3) Non Imposables */}
                <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50">3) Chiffre d’affaires non-imposables (Article 9 du CTCA)</td></tr>
                {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === 'NON_IMP').map(def => (
                   <tr key={def.code}>
                      <td className="border border-black p-1 text-center font-bold">{def.code}</td>
                      <td className="border border-black p-1">- {def.label}</td>
                      <td className="border border-black p-1 text-right">{exemptValues[def.code] ? formatMoney(exemptValues[def.code]) : '...................'}</td>
                      <td className="border border-black p-1 text-center">-</td>
                      <td className="border border-black p-1 text-center">-</td>
                      <td className="border border-black p-1 text-center">-</td>
                      <td className="border border-black p-1 text-center">-</td>
                   </tr>
                ))}

                {/* 4) Exonéré */}
                <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50">4) Chiffre d’affaires Exonéré</td></tr>
                {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === 'EXO').map(def => (
                   <tr key={def.code}>
                      <td className="border border-black p-1 text-center font-bold">{def.code}</td>
                      <td className="border border-black p-1">- {def.label}</td>
                      <td className="border border-black p-1 text-right">{exemptValues[def.code] ? formatMoney(exemptValues[def.code]) : '...................'}</td>
                      <td className="border border-black p-1 text-center">-</td>
                      <td className="border border-black p-1 text-center">-</td>
                      <td className="border border-black p-1 text-center">-</td>
                      <td className="border border-black p-1 text-center">-</td>
                   </tr>
                ))}

                <tr className="bg-gray-100">
                   <td className="border border-black p-1 font-bold text-center">11-2</td>
                   <td colSpan={6} className="border border-black p-1 text-center font-bold italic">(*) Consolidation TVA Groupe (Art 138 bis CID) - Case à cocher</td>
                </tr>

                {/* B/ Déductions */}
                <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50">B/ Déductions à Opérer</td></tr>
                {TAX_DEFINITIONS.filter(d => d.section === 'TVA' && d.group === 'DED').map(def => (
                   <tr key={def.code}>
                      <td className="border border-black p-1 text-center font-bold">{def.code}</td>
                      <td className="border border-black p-1">- {def.label}</td>
                      <td colSpan={4} className="border border-black p-1 text-right bg-gray-50"></td>
                      <td className="border border-black p-1 text-right font-bold">{values[def.code] ? formatMoney(values[def.code]) : '...................'}</td>
                   </tr>
                ))}

                <tr className="bg-gray-100">
                   <td className="border border-black p-1 font-bold text-center">E3B110</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-bold">Total des déductions à opérer (B)</td>
                   <td className="border border-black p-1 text-right font-black">{formatMoney(totals.tvaData.deductible)}</td>
                </tr>
                
                {/* TVA A PAYER / REGULARISATIONS */}
                <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50">TVA à Payer & Régularisations</td></tr>
                
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B96</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-bold">Total des droits dus (Report Sous-Total 11-1)</td>
                   <td className="border border-black p-1 text-right font-bold">{formatMoney(totals.tvaData.collectee)}</td>
                </tr>
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B97</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-medium">Régularisation du prorata (art.40C) (+) (Déduction excédentaire)</td>
                   <td className="border border-black p-1 text-right font-bold">{values['E3B97'] ? formatMoney(values['E3B97']) : '...................'}</td>
                </tr>
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B98</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-medium">Régularisation (régime des acomptes)</td>
                   <td className="border border-black p-1 text-right font-bold">{values['E3B98'] ? formatMoney(values['E3B98']) : '...................'}</td>
                </tr>
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B99</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-medium">Reversement de la déduction (art.38C/T.C.A.)</td>
                   <td className="border border-black p-1 text-right font-bold">{values['E3B99'] ? formatMoney(values['E3B99']) : '...................'}</td>
                </tr>
                
                <tr className="bg-gray-50">
                   <td className="border border-black p-1 text-center font-bold">E3B100</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-bold">(+) Total à rappeler (C) = [E3B96 + E3B97 + E3B98 + E3B99]</td>
                   <td className="border border-black p-1 text-right font-black">{formatMoney(totals.tvaData.totalC)}</td>
                </tr>
                
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B120</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-bold">(-) TVA à payer au titre du mois (C - B) (Si positif)</td>
                   <td className="border border-black p-1 text-right font-black">{formatMoney(totals.tvaData.aPayerMois)}</td>
                </tr>
                
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B130</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-bold">- Précompte à reporter sur le mois suivant (B - C) (Si négatif)</td>
                   <td className="border border-black p-1 text-right font-black">{totals.tvaData.creditReport > 0 ? formatMoney(totals.tvaData.creditReport) : '...................'}</td>
                </tr>
                
                <tr>
                   <td className="border border-black p-1 text-center font-bold">E3B140</td>
                   <td colSpan={5} className="border border-black p-1 text-right font-medium">- TVA auto-liquidée à payer (article 83 du CTCA)</td>
                   <td className="border border-black p-1 text-right font-bold">{values['E3B140'] ? formatMoney(values['E3B140']) : '...................'}</td>
                </tr>

                {/* Resultat Final (Total global section TVA) */}
                <tr className="bg-gray-200 border-t-2 border-black">
                   <td colSpan={6} className="border border-black p-2 text-right font-black uppercase text-sm">TOTAL TVA A VERSER (E3B120 + E3B140)</td>
                   <td className="border border-black p-2 text-right font-black text-sm">{formatMoney(totals.tvaData.totalAPayer)}</td>
                </tr>
             </tbody>
          </table>
        </div>

        {/* SECTION TLS (OFFICIAL RESTORED) */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead><tr className="bg-emerald-50"><th colSpan={7} className="border border-black p-1 text-left font-bold bg-gray-100 uppercase">TAXE LOCALE DE SOLIDARITE :</th></tr></thead>
           <tbody>
              {/* I - Régime paiement mensuel */}
              <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50 text-[9px]">I- Régime paiement mensuel :</td></tr>
              <tr className="text-[9px] font-bold text-center bg-gray-50">
                 <td className="border border-black p-1">Code</td>
                 <td className="border border-black p-1">Désignation</td>
                 <td className="border border-black p-1">CA Global</td>
                 <td className="border border-black p-1">Base Imposable</td>
                 <td className="border border-black p-1">CA Exonéré</td>
                 <td className="border border-black p-1">Taux</td>
                 <td className="border border-black p-1">Montant à payer</td>
              </tr>
              {/* Hydro */}
              <tr>
                 <td className="border border-black p-1 text-center">...</td>
                 <td className="border border-black p-1 text-[9px] pl-2">1) Activité de transport par canalisation des hydrocarbures</td>
                 <td className="border border-black p-1 text-center">-</td>
                 <td className="border border-black p-1 text-right">{values['E4_M_HYDRO'] ? formatMoney(values['E4_M_HYDRO']) : ''}</td>
                 <td className="border border-black p-1 text-center">-</td>
                 <td className="border border-black p-1 text-center">3%</td>
                 <td className="border border-black p-1 text-right font-bold">{values['E4_M_HYDRO'] ? formatMoney(values['E4_M_HYDRO'] * 0.03) : ''}</td>
              </tr>
              {/* Mines - Sans refaction */}
              <tr>
                 <td className="border border-black p-1 text-center">...</td>
                 <td className="border border-black p-1 text-[9px] pl-2">2) Activités minières : Opérations sans réfaction</td>
                 <td className="border border-black p-1 text-center">-</td>
                 <td className="border border-black p-1 text-right">{values['E4_M_MINIER'] ? formatMoney(values['E4_M_MINIER']) : ''}</td>
                 <td className="border border-black p-1 text-center">-</td>
                 <td className="border border-black p-1 text-center">1,5%</td>
                 <td className="border border-black p-1 text-right font-bold">{values['E4_M_MINIER'] ? formatMoney(values['E4_M_MINIER'] * 0.015) : ''}</td>
              </tr>
              {/* Exonerations List */}
              <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50 text-[9px]">Opérations exonérées ou non imposables :</td></tr>
              {Object.entries(tlsExonerations).filter(([_, val]) => (val as number) > 0).map(([label, val], i) => (
                 <tr key={i}>
                    <td className="border border-black p-1 text-center">...</td>
                    <td className="border border-black p-1 text-[9px] pl-2">- {label}</td>
                    <td className="border border-black p-1 text-center">-</td>
                    <td className="border border-black p-1 text-center">-</td>
                    <td className="border border-black p-1 text-right">{formatMoney(val as number)}</td>
                    <td className="border border-black p-1 text-center">-</td>
                    <td className="border border-black p-1 text-center">-</td>
                 </tr>
              ))}
              {Object.keys(tlsExonerations).length === 0 && (
                 <tr><td colSpan={7} className="border border-black p-1 text-center italic text-[8px]">Néant</td></tr>
              )}

              {/* II - Régime Acomptes */}
              <tr><td colSpan={7} className="border border-black p-1 font-bold pl-2 bg-gray-50 text-[9px]">II- Régime des acomptes provisionnels (Option) :</td></tr>
              <tr className="text-[9px] font-bold text-center bg-gray-50">
                 <td colSpan={2} className="border border-black p-1">Activité / Période</td>
                 <td colSpan={2} className="border border-black p-1">Référence / Date Notif</td>
                 <td className="border border-black p-1">Montant Acompte</td>
                 <td className="border border-black p-1">Taux</td>
                 <td className="border border-black p-1">Solde Liquidation</td>
              </tr>
              {/* Hydro Acomptes */}
              <tr>
                 <td colSpan={2} className="border border-black p-1 text-[9px] pl-2">1) Transport Hydrocarbures</td>
                 <td colSpan={2} className="border border-black p-1 text-center">{tlsAdditionalData.hydroRef || '-'}</td>
                 <td className="border border-black p-1 text-right">{values['E4_A_HYDRO_AC'] ? formatMoney(values['E4_A_HYDRO_AC']) : ''}</td>
                 <td className="border border-black p-1 text-center">3%</td>
                 <td className="border border-black p-1 text-right">{values['E4_A_HYDRO_SOL'] ? formatMoney(values['E4_A_HYDRO_SOL']) : ''}</td>
              </tr>
              {/* Mines Acomptes */}
              <tr>
                 <td colSpan={2} className="border border-black p-1 text-[9px] pl-2">2) Activités Minières</td>
                 <td colSpan={2} className="border border-black p-1 text-center">{tlsAdditionalData.minierRef || '-'}</td>
                 <td className="border border-black p-1 text-right">{values['E4_A_MINIER_AC'] ? formatMoney(values['E4_A_MINIER_AC']) : ''}</td>
                 <td className="border border-black p-1 text-center">1,5%</td>
                 <td className="border border-black p-1 text-right">{values['E4_A_MINIER_SOL'] ? formatMoney(values['E4_A_MINIER_SOL']) : ''}</td>
              </tr>

              <tr className="bg-gray-50">
                 <td className="border border-black p-1 font-bold text-center">7</td>
                 <td colSpan={5} className="border border-black p-1 text-right font-bold">Sous Total TLS</td>
                 <td className="border border-black p-1 text-right font-black">{formatMoney(totals.tls)}</td>
              </tr>
           </tbody>
        </table>

        {/* SECTION E2 (DTI) TABLE */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead><tr className="bg-gray-100"><th colSpan={5} className="border border-black p-1 text-left font-bold">DROITS ET TAXES INDIRECTS (DTI)</th></tr></thead>
           <tbody>
              <tr><td className="border border-black p-1 w-12 font-bold text-center">DTI</td><td className="border border-black p-1" colSpan={3}>Droits et Taxes Indirects (Alcools, Tabacs...)</td><td className="border border-black p-1 text-right font-bold">{formatMoney(totals.dti)}</td></tr>
           </tbody>
        </table>

        {/* AUTRES TAXES - TABLEAU DÉTAILLÉ */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead>
              <tr className="bg-gray-50 text-[9px] font-bold text-center">
                 <td className="border border-black p-1 w-12">Code</td>
                 <td className="border border-black p-1">Autres Taxes</td>
                 <td className="border border-black p-1 w-24">Base d’Imposition</td>
                 <td className="border border-black p-1 w-16">Tarif/Taux</td>
                 <td className="border border-black p-1 w-24">Montant à payer (en DA)</td>
              </tr>
           </thead>
           <tbody>
              {/* E2 E13 - TAP */}
              <tr>
                 <td className="border border-black p-1 text-center font-bold">E2 E13</td>
                 <td className="border border-black p-1 text-[8px]">
                    <span className="font-bold block">TAXE SUR L’ACTIVITE PROFESSIONNELLE*</span>
                    (Opérations réalisées antérieurement au 1er janvier 2024).
                 </td>
                 <td className="border-black border p-1 text-right">{values['E2E13'] ? formatMoney(values['E2E13']) : '..................'}</td>
                 <td className="border-black border p-1 text-center">{customRates['E2E13'] ? customRates['E2E13'] + '%' : '....%'}</td>
                 <td className="border-black border p-1 text-right font-bold">{values['E2E13'] ? formatMoney(values['E2E13'] * ((customRates['E2E13']||0)/100)) : '..................'}</td>
              </tr>
              {/* BOUCLE AUTRES TAXES (Standard) */}
              {TAX_DEFINITIONS.filter(d => d.section === 'AUTRES' && d.code !== 'E2E13').map(def => {
                 // Logic d'affichage du montant
                 let displayAmount = '..................';
                 let displayBase = '..................';
                 
                 if (def.rate === 'BAREME') {
                    if (manualTaxes[def.code]) displayAmount = formatMoney(manualTaxes[def.code]);
                    displayBase = 'Barème';
                 } else if (values[def.code]) {
                    displayBase = formatMoney(values[def.code]);
                    if (def.isSpecificRate) displayAmount = formatMoney(values[def.code] * (def.rate as number));
                    else if (typeof def.rate === 'number') displayAmount = formatMoney(values[def.code] * (def.rate / 100));
                 }

                 return (
                    <tr key={def.code}>
                       <td className="border border-black p-1 text-center font-bold">{def.code}</td>
                       <td className="border border-black p-1 text-[9px]">- {def.label}</td>
                       <td className="border border-black p-1 text-right">{displayBase}</td>
                       <td className="border border-black p-1 text-center text-[8px]">{def.rate === 'BAREME' ? 'Barème' : def.rate === 'VAR' ? 'Var' : def.isSpecificRate ? `${def.rate} DA` : `${def.rate}%`}</td>
                       <td className="border border-black p-1 text-right font-bold">{displayAmount}</td>
                    </tr>
                 );
              })}
              {/* SOUS TOTAL */}
              <tr className="bg-gray-50">
                 <td className="border border-black p-1 font-bold text-center">10</td>
                 <td colSpan={3} className="border border-black p-1 text-right font-bold">Sous total</td>
                 <td className="border border-black p-1 text-right font-black">{formatMoney(totals.autres)}</td>
              </tr>
           </tbody>
        </table>

        {/* DROIT DE TIMBRE - SPECIFIC TABLE RESTORED */}
        <table className="w-full border-collapse border border-black mb-4">
           <thead>
              <tr className="bg-gray-50 text-[9px] font-bold text-center">
                 <td className="border border-black p-1 w-12">Code</td>
                 <td className="border border-black p-1">Opérations imposables</td>
                 <td className="border border-black p-1 w-24">Chiffre d’Affaires Imposable</td>
                 <td className="border border-black p-1 w-16">Taux</td>
                 <td className="border border-black p-1 w-24">Montant à payer (en DA)</td>
              </tr>
           </thead>
           <tbody>
              <tr>
                 <td className="border border-black p-1 text-center font-bold">E2 E12</td>
                 <td className="border border-black p-1 text-[9px]">Droit de Timbre sur Etat</td>
                 <td className="border border-black p-1 text-right">{values['E2E12_TIMBRE'] ? formatMoney(values['E2E12_TIMBRE']) : '-'}</td>
                 <td className="border border-black p-1 text-center">{customRates['E2E12_TIMBRE'] ? customRates['E2E12_TIMBRE'] + '%' : '-'}</td>
                 <td className="border border-black p-1 text-right font-bold">{formatMoney(totals.timbre)}</td>
              </tr>
              <tr className="bg-gray-50">
                 <td className="border border-black p-1 font-bold text-center">9</td>
                 <td colSpan={3} className="border border-black p-1 text-right font-bold">Sous total</td>
                 <td className="border border-black p-1 text-right font-black">{formatMoney(totals.timbre)}</td>
              </tr>
           </tbody>
        </table>

        {/* RECAPITULATION - PARTIE FINALE */}
        <div className="border-2 border-black mt-2 page-break-inside-avoid">
           
           {/* En-têtes Colonnes */}
           <div className="flex border-b-2 border-black">
              <div className="w-1/2 border-r-2 border-black p-2 text-center">
                 <p className="font-bold text-[10px] uppercase">Cadre réservé au contribuable</p>
                 <p className="font-bold text-[10px] font-serif">إطار مخصص للمكلف بالضريبة</p>
              </div>
              <div className="w-1/2 p-2 text-center">
                 <p className="font-bold text-[10px] uppercase">Cadre réservé à la recette des impôts</p>
                 <p className="font-bold text-[10px] font-serif">إطار خاص بقباضة الضرائب</p>
              </div>
           </div>

           <div className="flex">
              {/* Colonne Gauche : Détail des taxes */}
              <div className="w-1/2 border-r-2 border-black p-2 text-[9px] font-medium space-y-1">
                 
                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>1-IRG/Retenue à la Sources C/201001/L1 à L8</span>
                    <span className="font-bold">{totals.s1 > 0 ? formatMoney(totals.s1) : '................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>2-Revenus Capitaux Mobiliers C/201001/L1 à L8</span>
                    <span className="font-bold">{totals.s2 > 0 ? formatMoney(totals.s2) : '................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>3-Revenus Locatifs C/201001/L1 à L8</span>
                    <span className="font-bold">{totals.s3 > 0 ? formatMoney(totals.s3) : '................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>4-IRG/ traitements et Salaires C/201001/L1 à L8</span>
                    <span className="font-bold">{totals.sal > 0 ? formatMoney(totals.sal) : '................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>5-IRG/ Professionnel C/201001/L1 à L8</span>
                    <span className="font-bold">{totals.liq > 0 ? formatMoney(totals.liq) : '................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>6-IBS C/201001 /M1 à M3</span>
                    <span className="font-bold">{totals.ibs > 0 ? formatMoney(totals.ibs) : '................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>7- Taxe Locale de Solidarité à payer C/………….…..</span>
                    <span className="font-bold">{totals.tls > 0 ? formatMoney(totals.tls) : '....................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>8- Droits et Taxes Indirects C/500020</span>
                    <span className="font-bold">{totals.dti > 0 ? formatMoney(totals.dti) : '....................................................'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5">
                    <span>9- Droit de Timbre C/201002</span>
                    <span className="font-bold">{totals.timbre > 0 ? formatMoney(totals.timbre) : '...................................................'}</span>
                 </div>

                 <div className="space-y-1">
                    <span>10- Nature des Autres Taxes :</span>
                    {/* Génération de lignes vides ou remplies si montant autres > 0 */}
                    <div className="flex justify-between pl-4 border-b border-dotted border-gray-400">
                       <span>-. C/........................................................</span>
                       <span className="font-bold">{totals.autres > 0 ? formatMoney(totals.autres) : '...................................................'}</span>
                    </div>
                    <div className="flex justify-between pl-4 border-b border-dotted border-gray-400">
                       <span>-. C/........................................................</span>
                       <span>...................................................</span>
                    </div>
                    <div className="flex justify-between pl-4 border-b border-dotted border-gray-400">
                       <span>-. C/........................................................</span>
                       <span>...................................................</span>
                    </div>
                 </div>

                 <div className="flex justify-between items-end border-b border-dotted border-gray-400 pb-0.5 font-bold">
                    <span>11- TVA à payer C/500020</span>
                    <span>{totals.tvaData.totalAPayer > 0 ? formatMoney(totals.tvaData.totalAPayer) : '...................................................'}</span>
                 </div>

                 {/* TOTAL À PAYER */}
                 <div className="mt-4 border-2 border-black p-2 bg-slate-100">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase">
                       <span>Montant Total à Payer</span>
                       <span>{formatMoney(totals.total)} DA</span>
                    </div>
                 </div>

                 {/* CERTIFICATION */}
                 <div className="mt-4 space-y-1 text-center">
                    <p className="font-serif font-bold text-[10px]">يشهد بصحة وا صدقا محتوى هذاا التصريح وتطابقهامع الوثائقاالمحاسبية.ا</p>
                    <p className="font-bold text-[9px] leading-tight">
                       Certifié sincère et véritable le contenu de la présente déclaration et conforme aux documents comptables.
                    </p>
                    <div className="mt-4 text-left pl-2">
                       <p>A ........................................ le ........................................</p>
                       <p className="mt-2 text-center font-bold">Cachet et Signature</p>
                    </div>
                 </div>

              </div>

              {/* Colonne Droite : Recette */}
              <div className="w-1/2 p-2 text-[9px] space-y-4">
                 <p className="leading-loose">
                    Reçu ce jour, la présente déclaration enregistrée sous le numéro <br/>
                    ........................................................................................................................
                 </p>
                 
                 <div className="space-y-3 pt-2">
                    <p>Payée par chèque bancaire (s) N°: .....................................................................</p>
                    <p>Du ...........................................................................................................................</p>
                    <p>Tiré sur l’agence : ......................................................................................................</p>
                    <p>Par chèque postal N°: ...............................................................................................</p>
                    <p>En numéraire : ..............................................................................................................</p>
                 </div>

                 <div className="pt-4 space-y-2">
                    <p>Prise en recette par quittance N°: ...........................................................................</p>
                    <p>De ce jour.</p>
                 </div>

                 <div className="mt-8">
                    <p>A ........................................ le ........................................</p>
                    <p className="mt-4 text-center font-bold text-[10px]">Le receveur des impôts</p>
                    <p className="text-center font-bold text-[10px]">Cachet et Signature</p>
                 </div>
              </div>
           </div>
        </div>

        {/* TOTAL GENERAL (HORS CADRE) */}
        <div className="flex justify-end mt-4">
           <div className="border-2 border-black p-2 bg-slate-200">
              <span className="font-black text-sm uppercase mr-4">TOTAL GÉNÉRAL À PAYER :</span>
              <span className="font-black text-xl">{formatMoney(totals.total)} DA</span>
           </div>
        </div>

      </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G50CompletForm;

// Icon component that might be missing in older Lucide versions
function PickaxeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 5.5l-4 4" />
      <path d="M12 2l-7 7 4 4 8 8 2.5-2.5-8-8 4-4 7 7 2-2-7-7z" />
    </svg>
  )
}
