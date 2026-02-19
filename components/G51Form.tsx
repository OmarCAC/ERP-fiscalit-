
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Building, 
  Coins, 
  User, 
  MapPin, 
  Calendar,
  CreditCard,
  Download,
  Upload,
  Search,
  LayoutDashboard,
  TrendingUp,
  Plus,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Home,
  Briefcase,
  Tractor,
  Image as ImageIcon,
  Ruler,
  FileKey,
  Crosshair,
  Map,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Declaration, Taxpayer } from '../types';

interface Props {
  taxpayer: Taxpayer | null; 
  initialData?: Declaration | null; 
  onBack: () => void;
  onSubmit?: (declaration: Declaration) => void;
}

// Types pour la gestion de patrimoine
interface Property {
  id: string;
  name: string;
  address: string;
  wilaya: string;
  commune: string;
  article: string;
  type: 'HABITATION' | 'PROFESSIONNEL' | 'AGRICOLE' | 'TERRAIN_IND'; // Ajout TERRAIN_IND
  status: 'LOUÉ' | 'VACANT' | 'OCCUPÉ';
  image: string;
  surface?: string;
  tenant?: string; 
  rentAmount?: number;
  lat?: number;
  lng?: number;
}

const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'P1',
    name: 'Villa El-Bahdja',
    address: '05 Rue des Lilas, Hydra, Alger',
    wilaya: 'Alger',
    commune: 'Hydra',
    article: '1620023412',
    type: 'HABITATION',
    status: 'LOUÉ',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    tenant: 'Karim BENALI',
    rentAmount: 85000,
    surface: '250m²',
    lat: 36.7525,
    lng: 3.04197
  },
  {
    id: 'P2',
    name: 'Cabinet Médical',
    address: 'Cité 200 logts, Dely Brahim, Alger',
    wilaya: 'Alger',
    commune: 'Dely Brahim',
    article: '1620023415',
    type: 'PROFESSIONNEL',
    status: 'OCCUPÉ',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=800',
    surface: '85m²'
  },
  {
    id: 'P3',
    name: 'Terrain El-Falah',
    address: 'Zone Agricole 4, Chéraga, Alger',
    wilaya: 'Alger',
    commune: 'Chéraga',
    article: '1620023501',
    type: 'AGRICOLE',
    status: 'VACANT',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
    surface: '2 Ha'
  }
];

const G51Form: React.FC<Props> = ({ taxpayer, initialData, onBack, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'PROPERTY_FORM' | 'WIZARD' | 'OFFICIAL'>('LIST');
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Formulaire Nouveau Bien / Édition
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPropertyData, setNewPropertyData] = useState<Partial<Property>>({
    type: 'HABITATION',
    status: 'VACANT',
    wilaya: 'Alger',
    image: ''
  });

  // Filtres Patrimoine
  const [propertyFilter, setPropertyFilter] = useState('');
  
  // États du formulaire G51 (Initialisation vide ou avec données taxpayer si dispo)
  const [formData, setFormData] = useState({
    // Bailleur (Synchronisé avec le Module Contribuable)
    bailleurNom: taxpayer?.dynamicData['1'] || '',
    bailleurNif: taxpayer?.dynamicData['2'] || '',
    bailleurNin: taxpayer?.dynamicData['nin'] || '',
    bailleurAdresse: taxpayer?.dynamicData['adresse'] || '',
    bailleurCommune: taxpayer?.commune || '',
    bailleurWilaya: taxpayer?.wilaya || '',
    bailleurCodePostal: '', 
    
    // Preneur (Locataire)
    preneurNom: '',
    preneurAdresse: '',
    preneurNif: '',
    preneurNin: '',
    preneurCodePostal: '',
    preneurCommune: '',
    preneurWilaya: '',
    
    // Bien
    natureBien: 'HABITATION', // Code interne pour calcul
    articleImposition: 'Ex: 16200234',
    periodicite: 'Mensuelle',
    dateDebut: '',
    dateFin: '',
    lieuSituation: '',
    adresseBien: '',
    communeBien: '',
    wilayaBien: '',
    cpBien: '',

    // Calculs
    loyerAnnuelBrut: 0,
    
    // Paiement
    modePaiement: 'NUMERAIRE' as 'NUMERAIRE' | 'CHEQUE',
    numCheque: '',
    banque: ''
  });

  // Année et Mois
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('Janvier');

  // Synchronisation stricte si le taxpayer change
  useEffect(() => {
    if (taxpayer) {
      setFormData(prev => ({
        ...prev,
        bailleurNom: taxpayer.dynamicData['1'] || prev.bailleurNom,
        bailleurNif: taxpayer.dynamicData['2'] || prev.bailleurNif,
        bailleurNin: taxpayer.dynamicData['nin'] || prev.bailleurNin,
        bailleurAdresse: taxpayer.dynamicData['adresse'] || prev.bailleurAdresse,
        bailleurCommune: taxpayer.commune || prev.bailleurCommune,
        bailleurWilaya: taxpayer.wilaya || prev.bailleurWilaya,
      }));
    }
  }, [taxpayer]);

  // CHARGEMENT DONNÉES INITIALES (Synchronisation Période)
  useEffect(() => {
    if (initialData) {
      // Si une déclaration existe déjà et n'est pas un brouillon, on passe en mode officiel
      if (initialData.status !== 'BROUILLON') {
        setViewMode('OFFICIAL');
      } else {
         // Si c'est un brouillon (venant du wizard ou autre), on passe en mode wizard
         setViewMode('WIZARD');
      }

      // Synchronisation de la période depuis les données initiales (ex: "Exercice 2025" ou "Janvier 2025")
      if (initialData.period) {
          // Extraction de l'année
          const yearMatch = initialData.period.match(/\d{4}/);
          if (yearMatch) {
              setSelectedYear(parseInt(yearMatch[0]));
          }
          
          // Extraction du mois (si présent)
          const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const foundMonth = months.find(m => initialData.period.includes(m));
          if (foundMonth) {
              setSelectedMonth(foundMonth);
          }
      }
    }
  }, [initialData]);

  // --- LOGIQUE METIER G51 MISE A JOUR ---
  const seuil = 1800000;
  const isSuperieurSeuil = formData.loyerAnnuelBrut > seuil;

  // Détermination du taux selon la nature et le seuil
  const getTauxApplicable = () => {
    if (isSuperieurSeuil) return 7; // Imposition provisoire unique
    switch (formData.natureBien) {
        case 'HABITATION': return 7;
        case 'PROFESSIONNEL': return 15;
        case 'TERRAIN_IND': return 15;
        case 'AGRICOLE': return 10;
        default: return 7;
    }
  };

  const taux = getTauxApplicable();
  const irgDu = Math.round(formData.loyerAnnuelBrut * (taux / 100));
  const totalNet = irgDu; // + Pénalités éventuelles

  const handleSave = (status: 'BROUILLON' | 'VALIDÉ') => {
    if (onSubmit) {
      onSubmit({
        id: initialData?.id || `G51-${Math.floor(Math.random() * 10000)}`, // Conserver l'ID si édition
        type: 'Série G n°51 (Foncier)',
        period: `${selectedMonth} ${selectedYear}`,
        regime: 'FONCIER',
        submissionDate: status === 'VALIDÉ' ? new Date().toLocaleDateString('fr-FR') : '-',
        status: status,
        amount: totalNet,
        taxpayerName: formData.bailleurNom
      });
    }
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setFormData(prev => ({
        ...prev,
        natureBien: property.type, // Map direct du type de propriété
        articleImposition: property.article,
        lieuSituation: `${property.commune}, ${property.wilaya}`,
        adresseBien: property.address,
        communeBien: property.commune,
        wilayaBien: property.wilaya,
        preneurNom: property.tenant || '',
        loyerAnnuelBrut: (property.rentAmount || 0) * 12
    }));
    setViewMode('WIZARD');
  };

  const handlePrint = () => {
    window.print();
  };

  // --- LOGIQUE GESTION PATRIMOINE ---

  // 1. Ouvrir le formulaire en mode création
  const handleOpenCreate = () => {
    setNewPropertyData({ type: 'HABITATION', status: 'VACANT', wilaya: 'Alger', image: '' });
    setIsEditing(false);
    setViewMode('PROPERTY_FORM');
  };

  // 2. Ouvrir le formulaire en mode édition
  const handleEditProperty = (e: React.MouseEvent, property: Property) => {
    e.stopPropagation(); 
    setNewPropertyData(property);
    setIsEditing(true);
    setViewMode('PROPERTY_FORM');
  };

  // 3. Supprimer un bien
  const handleDeleteProperty = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (confirm("Êtes-vous sûr de vouloir supprimer ce bien de votre patrimoine ? Cette action est irréversible.")) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  // 4. Sauvegarder (Création ou Mise à jour)
  const handleSaveNewProperty = () => {
     if (!newPropertyData.name || !newPropertyData.article) {
         alert("Veuillez remplir les champs obligatoires (Nom, N° Article)");
         return;
     }

     const defaultImages = {
         'HABITATION': 'https://images.unsplash.com/photo-1600596542815-e32cb5313d5b?auto=format&fit=crop&q=80&w=800',
         'PROFESSIONNEL': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
         'AGRICOLE': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
         'TERRAIN_IND': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'
     };

     if (isEditing && newPropertyData.id) {
       // MISE A JOUR
       setProperties(prev => prev.map(p => p.id === newPropertyData.id ? { ...newPropertyData, image: newPropertyData.image || p.image } as Property : p));
     } else {
       // CREATION
       const newProp: Property = {
           id: `P${Date.now()}`,
           name: newPropertyData.name!,
           address: newPropertyData.address || '',
           wilaya: newPropertyData.wilaya || 'Alger',
           commune: newPropertyData.commune || '',
           article: newPropertyData.article!,
           type: newPropertyData.type as any,
           status: newPropertyData.status as any,
           surface: newPropertyData.surface,
           image: newPropertyData.image || defaultImages[newPropertyData.type as 'HABITATION' | 'PROFESSIONNEL' | 'AGRICOLE'],
           tenant: newPropertyData.tenant,
           rentAmount: newPropertyData.rentAmount,
           lat: newPropertyData.lat,
           lng: newPropertyData.lng
       };
       setProperties([...properties, newProp]);
     }

     setViewMode('LIST');
     setNewPropertyData({ type: 'HABITATION', status: 'VACANT', wilaya: 'Alger' }); // Reset
     setIsEditing(false);
  };

  // 5. Gestion Upload Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPropertyData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 6. Gestion Géolocalisation
  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewPropertyData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          alert("Impossible de récupérer votre position. Vérifiez vos autorisations.");
          console.error(error);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  };

  // 7. Impression Inventaire
  const handlePrintInventory = () => {
    window.print();
  };

  // 8. Vérification G51
  const handleVerifyG51 = () => {
    const missingDeclarations = properties.filter(p => p.status === 'LOUÉ'); // Simulation logic
    const count = missingDeclarations.length;
    alert(`Analyse terminée : ${count} biens loués détectés nécessitant une G51. Le système est à jour.`);
  };

  // --- VUE 1: GESTION PATRIMOINE (LISTE) ---
  const renderPropertyList = () => {
    const filteredProperties = properties.filter(p => 
        p.name.toLowerCase().includes(propertyFilter.toLowerCase()) || 
        p.address.toLowerCase().includes(propertyFilter.toLowerCase()) ||
        p.article.includes(propertyFilter)
    );

    return (
        <div className="min-h-full bg-[#f8fafc] p-8 font-sans text-slate-600 pb-32 print:bg-white print:p-0">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                
                {/* Header (Masqué à l'impression) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mon Patrimoine Immobilier</h1>
                        </div>
                        {/* INDICATEUR DE CONNEXION MODULE CONTRIBUABLE */}
                        <div className="flex items-center gap-2">
                           <span className="text-slate-500 font-medium">Propriétaire :</span>
                           <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1">
                              <User className="w-3 h-3" /> {taxpayer?.dynamicData['1'] || 'Non Connecté'}
                           </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Total Biens</p>
                                <p className="text-lg font-black text-slate-900 leading-none">{properties.length.toString().padStart(2, '0')}</p>
                            </div>
                        </div>
                        <button onClick={handleOpenCreate} className="px-6 py-3 bg-[#1e40af] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Ajouter un nouveau bien
                        </button>
                    </div>
                </div>

                {/* Filters (Masqué à l'impression) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 print:hidden">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom, adresse ou article..." 
                            value={propertyFilter}
                            onChange={(e) => setPropertyFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 min-w-[140px] focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option>Toutes les Wilayas</option>
                            <option>Alger</option>
                            <option>Oran</option>
                        </select>
                        <select className="px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 min-w-[140px] focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option>Tous les Types</option>
                            <option>Habitation</option>
                            <option>Commercial</option>
                            <option>Agricole</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4">
                    {filteredProperties.map(property => (
                        <div key={property.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group print:shadow-none print:border-slate-400 print:rounded-xl">
                            {/* Image Header */}
                            <div className="h-48 relative overflow-hidden print:h-32">
                                <img src={property.image} alt={property.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${
                                        property.type === 'HABITATION' ? 'bg-blue-500/80 text-white' : 
                                        property.type === 'PROFESSIONNEL' ? 'bg-purple-500/80 text-white' : 
                                        'bg-emerald-500/80 text-white'
                                    }`}>
                                        {property.type}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${
                                        property.status === 'LOUÉ' ? 'bg-green-400/90 text-white' : 
                                        property.status === 'OCCUPÉ' ? 'bg-blue-400/90 text-white' : 
                                        'bg-slate-400/90 text-white'
                                    }`}>
                                        {property.status === 'LOUÉ' ? 'Loué' : property.status === 'OCCUPÉ' ? 'Occupé' : 'Vacant'}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <h3 className="text-xl font-black leading-tight mb-1">{property.name}</h3>
                                    <p className="text-xs font-medium opacity-90 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {property.commune}, {property.wilaya}
                                    </p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 print:p-4 print:space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">N° Article</p>
                                        <p className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg w-fit print:border">{property.article}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                                        <p className="text-xs font-bold text-slate-700">{property.type === 'HABITATION' ? 'Résidentiel' : property.type === 'AGRICOLE' ? 'Agricole' : 'Commercial'}</p>
                                    </div>
                                </div>
                                
                                {property.status === 'LOUÉ' && (
                                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between print:border-black print:bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm font-bold text-xs print:border">
                                                {property.tenant?.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Locataire</p>
                                                <p className="text-xs font-bold text-green-900">{property.tenant}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Loyer</p>
                                            <p className="text-sm font-black text-green-900">{property.rentAmount?.toLocaleString()} DA</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions (Masqué à l'impression) */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 print:hidden">
                                {property.status === 'LOUÉ' ? (
                                    <button 
                                        onClick={() => handleSelectProperty(property)}
                                        className="flex-1 py-3 bg-[#1e40af] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Accéder à la G51
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleEditProperty({} as any, property)} // CORRECTION: Passer l'event dummy si appel direct mais le bouton edit a son propre handler
                                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Mettre en location
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => handleEditProperty(e, property)} 
                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary transition-all"
                                    title="Modifier le bien"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteProperty(e, property.id)} 
                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-500 transition-all"
                                    title="Supprimer le bien"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add New Card Placeholder (Masqué à l'impression) */}
                    <button onClick={handleOpenCreate} className="rounded-[32px] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-8 gap-4 text-slate-400 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group min-h-[400px] print:hidden">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase">Ajouter un bien</h3>
                            <p className="text-xs font-medium max-w-[200px] mx-auto mt-2 opacity-70">Enrichissez votre patrimoine immobilier pour faciliter vos déclarations G51.</p>
                        </div>
                    </button>
                </div>

                {/* Footer Stats (Masqué à l'impression) */}
                <div className="bg-slate-100 rounded-[32px] p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8 print:hidden">
                    <div className="flex gap-12">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total des Biens</p>
                            <p className="text-3xl font-black text-slate-900">{properties.length.toString().padStart(2, '0')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">En Location</p>
                            <p className="text-3xl font-black text-green-600">{properties.filter(p => p.status === 'LOUÉ').length.toString().padStart(2, '0')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Revenu Mensuel Est.</p>
                            <p className="text-3xl font-black text-primary">
                                {properties.reduce((acc, curr) => acc + (curr.rentAmount || 0), 0).toLocaleString()} DA
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={handlePrintInventory}
                            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Imprimer l'inventaire
                        </button>
                        <button 
                            onClick={handleVerifyG51}
                            className="px-6 py-3 bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-lg hover:bg-blue-800 transition-all"
                        >
                            Vérifier mes G51
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
  };

  // --- VUE NOUVEAU BIEN / ÉDITION ---
  const renderPropertyForm = () => (
    <div className="min-h-full bg-[#f8fafc] flex flex-col font-sans text-slate-600 pb-32">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{isEditing ? 'Modifier le Bien' : 'Nouveau Bien Immobilier'}</h1>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => setViewMode('LIST')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Annuler</button>
                 <button onClick={handleSaveNewProperty} className="px-6 py-2 bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-lg hover:bg-blue-800 transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isEditing ? 'Mettre à jour' : 'Enregistrer le bien'}
                 </button>
            </div>
        </div>

        <div className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ... Reste du formulaire de propriété inchangé ... */}
             {/* Colonne Gauche : Formulaire */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Carte 1 : Info Générale */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Home className="w-4 h-4 text-primary" /> Informations Générales
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Désignation du bien (Nom)</label>
                            <input 
                                type="text" 
                                value={newPropertyData.name || ''} 
                                onChange={e => setNewPropertyData({...newPropertyData, name: e.target.value})}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" 
                                placeholder="Ex: Appartement F4 Centre Ville"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Type de Bien</label>
                                <select 
                                    value={newPropertyData.type} 
                                    onChange={e => setNewPropertyData({...newPropertyData, type: e.target.value as any})}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="HABITATION">Habitation (Résidentiel)</option>
                                    <option value="PROFESSIONNEL">Commercial / Pro</option>
                                    <option value="AGRICOLE">Terrain Agricole</option>
                                    <option value="TERRAIN_IND">Terrain Industriel/Nu</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Surface (m² / Ha)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={newPropertyData.surface || ''} 
                                        onChange={e => setNewPropertyData({...newPropertyData, surface: e.target.value})}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" 
                                        placeholder="Ex: 120m²"
                                    />
                                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                             </div>
                        </div>
                        
                        {/* Zone Upload Image */}
                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-slate-700">Photo du Bien</label>
                            <input 
                               type="file" 
                               ref={fileInputRef} 
                               className="hidden" 
                               accept="image/*"
                               onChange={handleImageUpload}
                            />
                            <div 
                               onClick={triggerFileInput}
                               className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden"
                            >
                               {newPropertyData.image ? (
                                 <>
                                   <img src={newPropertyData.image} alt="Preview" className="h-32 object-cover rounded-lg mb-2" />
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <p className="text-white font-bold text-xs">Changer l'image</p>
                                   </div>
                                 </>
                               ) : (
                                 <>
                                   <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                                   <p className="text-xs font-bold text-slate-500">Cliquez pour ajouter une photo</p>
                                 </>
                               )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carte 2 : Localisation Fiscale & Géo */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" /> Localisation Fiscale & Géographique
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Adresse Complète</label>
                            <input 
                                type="text" 
                                value={newPropertyData.address || ''} 
                                onChange={e => setNewPropertyData({...newPropertyData, address: e.target.value})}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20" 
                                placeholder="Numéro, Rue, Bâtiment..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Wilaya</label>
                                <select 
                                    value={newPropertyData.wilaya} 
                                    onChange={e => setNewPropertyData({...newPropertyData, wilaya: e.target.value})}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="Alger">Alger</option>
                                    <option value="Oran">Oran</option>
                                    <option value="Constantine">Constantine</option>
                                    <option value="Blida">Blida</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Commune</label>
                                <input 
                                    type="text" 
                                    value={newPropertyData.commune || ''} 
                                    onChange={e => setNewPropertyData({...newPropertyData, commune: e.target.value})}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" 
                                    placeholder="Commune"
                                />
                             </div>
                        </div>

                        {/* GEOLOCALISATION */}
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mt-2 space-y-3">
                           <div className="flex justify-between items-center">
                              <label className="text-xs font-black text-blue-800 uppercase flex items-center gap-2">
                                 <Crosshair className="w-4 h-4" /> Coordonnées GPS
                              </label>
                              <button onClick={handleGeolocate} className="text-[10px] font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all flex items-center gap-1">
                                 <Map className="w-3 h-3" /> Me géolocaliser
                              </button>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-blue-400">Latitude</label>
                                 <input type="number" value={newPropertyData.lat || ''} onChange={e => setNewPropertyData({...newPropertyData, lat: parseFloat(e.target.value)})} className="w-full h-10 px-3 bg-white border border-blue-200 rounded-lg text-xs font-mono" placeholder="36.000" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-blue-400">Longitude</label>
                                 <input type="number" value={newPropertyData.lng || ''} onChange={e => setNewPropertyData({...newPropertyData, lng: parseFloat(e.target.value)})} className="w-full h-10 px-3 bg-white border border-blue-200 rounded-lg text-xs font-mono" placeholder="3.000" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">Numéro d'Article d'Imposition <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={newPropertyData.article || ''} 
                                    onChange={e => setNewPropertyData({...newPropertyData, article: e.target.value})}
                                    className="w-full h-14 pl-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-mono font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all tracking-widest" 
                                    placeholder="0000000000"
                                />
                                <FileKey className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium ml-1">Ce numéro est indispensable pour la déclaration G51.</p>
                        </div>
                    </div>
                </div>

                {/* Carte 3 : État Locatif */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Coins className="w-4 h-4 text-green-600" /> État Locatif Actuel
                    </h2>
                    
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        {['VACANT', 'LOUÉ', 'OCCUPÉ'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setNewPropertyData({...newPropertyData, status: status as any})}
                                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${newPropertyData.status === status ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {newPropertyData.status === 'LOUÉ' && (
                        <div className="space-y-4 pt-4 animate-in slide-in-from-top-2">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Nom du Locataire</label>
                                <input 
                                    type="text" 
                                    value={newPropertyData.tenant || ''} 
                                    onChange={e => setNewPropertyData({...newPropertyData, tenant: e.target.value})}
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" 
                                    placeholder="Nom complet ou Raison Sociale"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Montant du Loyer Mensuel (DA)</label>
                                <input 
                                    type="number" 
                                    value={newPropertyData.rentAmount || ''} 
                                    onChange={e => setNewPropertyData({...newPropertyData, rentAmount: parseFloat(e.target.value) || 0})}
                                    className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-right focus:ring-2 focus:ring-primary/20" 
                                    placeholder="0.00"
                                />
                             </div>
                        </div>
                    )}
                </div>

            </div>
             {/* Colonne Droite : Preview */}
            <div className="lg:col-span-1 space-y-6">
                <div className="sticky top-28 space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Aperçu de la fiche</p>
                    
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden relative group">
                        <div className="h-48 relative bg-slate-200">
                             {newPropertyData.image ? (
                                <img src={newPropertyData.image} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                     <ImageIcon className="w-10 h-10 opacity-50" />
                                </div>
                             )}
                             {/* Overlay type */}
                             <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                                <div className="inline-block px-3 py-1 bg-black/50 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-widest mb-2">
                                    {newPropertyData.type}
                                </div>
                                <h3 className="text-xl font-black leading-tight drop-shadow-md">{newPropertyData.name || 'Nom du bien'}</h3>
                             </div>
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{newPropertyData.address || 'Adresse...'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{newPropertyData.commune}, {newPropertyData.wilaya}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                <FileKey className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{newPropertyData.article || 'N° Article'}</span>
                            </div>
                            {newPropertyData.lat && (
                               <div className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                  <Crosshair className="w-3 h-3" /> GPS: {newPropertyData.lat.toFixed(4)}, {newPropertyData.lng?.toFixed(4)}
                                </div>
                            )}
                            {newPropertyData.status === 'LOUÉ' && (
                                <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Revenu Mensuel</p>
                                    <p className="text-2xl font-black text-green-800">{newPropertyData.rentAmount?.toLocaleString() || 0} DA</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-[24px] text-xs font-medium text-blue-800 leading-relaxed">
                        L'ajout de ce bien permettra de pré-remplir automatiquement vos déclarations G51 et de calculer l'impôt foncier dû.
                    </div>
                </div>
            </div>

        </div>
    </div>
  );

  // --- VUE 2: WIZARD G51 (DESIGN PORTAIL FISCAL) ---
  const renderWizard = () => (
    <div className="min-h-full bg-[#f8fafc] flex flex-col font-sans text-slate-600">
      
      {/* HEADER BAR (Bleu Foncé comme sur la maquette) */}
      <div className="bg-[#1e40af] text-white px-8 py-4 shadow-md sticky top-0 z-30">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-all" onClick={() => setViewMode('LIST')}>
                  <ArrowLeft className="w-5 h-5 text-white" />
               </div>
               <div>
                  <h1 className="text-lg font-bold flex items-center gap-2">
                     <Building className="w-5 h-5" /> Portail Fiscal G51
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">République Algérienne Démocratique et Populaire</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                  <p className="text-xs font-bold">Inspecteur Admin</p>
                  <p className="text-[10px] opacity-70">Direction Générale des Impôts</p>
               </div>
               <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                  <User className="w-5 h-5" />
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* COLONNE GAUCHE (FORMULAIRE) */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* 0. ALERTE DELAI */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3 items-start">
               <Info className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
               <div className="text-xs text-yellow-800 font-medium">
                  <p className="font-bold mb-1">Rappel des Délais</p>
                  Conformément à la réglementation, la déclaration G51 doit être souscrite et payée avant le <span className="font-bold">20 du mois suivant</span> la perception des loyers.
                  <br/>Lieu de dépôt : Recette des impôts du <span className="font-bold">lieu de situation de l'immeuble</span>.
               </div>
            </div>

            {/* 1. SÉLECTEUR PÉRIODE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex flex-wrap items-end gap-6">
                  <div className="space-y-1.5 flex-1 min-w-[140px]">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année</label>
                     <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                     >
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                        <option value={2023}>2023</option>
                     </select>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-[140px]">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mois de la perception</label>
                     <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                     >
                        {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (
                           <option key={m} value={m}>{m}</option>
                        ))}
                     </select>
                  </div>
                  <button className="px-6 py-3 bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center gap-2">
                     <Upload className="w-4 h-4" /> Importer du Module Contribuable
                  </button>
               </div>
            </div>

            {/* 2. SECTION I - BAILLEUR & PRENEUR */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h2 className="text-base font-bold text-slate-800">I - Renseignements concernant le Bailleur et le Preneur</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* BAILLEUR (READ ONLY) */}
                  <div className="space-y-3">
                     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                        <User className="w-4 h-4" /> Bailleur (Propriétaire)
                     </div>
                     <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Nom et Prénom</p>
                           <p className="text-sm font-black text-slate-900">{formData.bailleurNom}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">NIF / NIN</p>
                           <p className="text-xs font-mono font-medium text-slate-700">{formData.bailleurNif} / {formData.bailleurNin}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Adresse</p>
                           <p className="text-xs font-medium text-slate-700">{formData.bailleurAdresse}</p>
                        </div>
                     </div>
                  </div>

                  {/* PRENEUR (INPUTS) */}
                  <div className="space-y-3">
                     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                        <Building className="w-4 h-4" /> Preneur (Locataire)
                     </div>
                     <div className="space-y-3">
                        <input 
                           type="text" 
                           placeholder="Nom, Prénom ou Raison Sociale" 
                           value={formData.preneurNom}
                           onChange={e => setFormData({...formData, preneurNom: e.target.value})}
                           className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <input 
                           type="text" 
                           placeholder="Adresse complète" 
                           value={formData.preneurAdresse}
                           onChange={e => setFormData({...formData, preneurAdresse: e.target.value})}
                           className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <div className="grid grid-cols-2 gap-3">
                           <input 
                              type="text" 
                              placeholder="NIF" 
                              value={formData.preneurNif}
                              onChange={e => setFormData({...formData, preneurNif: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                           />
                           <input 
                              type="text" 
                              placeholder="Code Postal" 
                              value={formData.preneurCodePostal}
                              onChange={e => setFormData({...formData, preneurCodePostal: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. SECTION II - BIEN LOUÉ */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h2 className="text-base font-bold text-slate-800">II - Renseignements concernant le bien loué</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Nature du bien</label>
                     <div className="relative">
                        <select 
                           value={formData.natureBien}
                           onChange={e => setFormData({...formData, natureBien: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 appearance-none"
                        >
                           <option value="HABITATION">Usage d'habitation (Bâti)</option>
                           <option value="PROFESSIONNEL">Usage commercial / professionnel</option>
                           <option value="TERRAIN_IND">Terrain Industriel (Non Bâti)</option>
                           <option value="AGRICOLE">Terrain agricole</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">N° Article d'Imposition</label>
                     <input 
                        type="text" 
                        value={formData.articleImposition}
                        onChange={e => setFormData({...formData, articleImposition: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Périodicité de versement</label>
                     <div className="relative">
                        <select 
                           value={formData.periodicite}
                           onChange={e => setFormData({...formData, periodicite: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 appearance-none"
                        >
                           <option>Mensuelle</option>
                           <option>Trimestrielle</option>
                           <option>Annuelle</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                     </div>
                  </div>

                  {/* Empty col for spacing or specific styling from mockup */}
                  <div className="hidden md:block"></div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Période du contrat</label>
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           placeholder="mm/jj/aaaa"
                           className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-center"
                        />
                        <span className="self-center text-slate-400 text-sm">au</span>
                        <input 
                           type="text" 
                           placeholder="mm/jj/aaaa"
                           className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-center"
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Lieu de situation</label>
                     <input 
                        type="text" 
                        placeholder="Commune, Wilaya"
                        value={formData.lieuSituation}
                        onChange={e => setFormData({...formData, lieuSituation: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700"
                     />
                  </div>
               </div>
            </div>

            {/* 4. SECTION III - CALCULS */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-slate-800">III - Montant de l'impôt à payer</h2>
                  <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-lg hover:bg-blue-100 transition-all">Calcul en temps réel</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-blue-700">Montant annuel brut des loyers (DA)</label>
                        <input 
                           type="number" 
                           value={formData.loyerAnnuelBrut || ''} 
                           onChange={e => setFormData({...formData, loyerAnnuelBrut: parseFloat(e.target.value) || 0})}
                           className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:border-blue-500 focus:ring-0 transition-all"
                           placeholder="0.00"
                        />
                     </div>
                     <div className={`flex items-center gap-2 text-[10px] font-bold ${isSuperieurSeuil ? 'text-orange-600' : 'text-green-600'}`}>
                        {isSuperieurSeuil ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {isSuperieurSeuil ? 'Montant > 1.8M DA : Imposition provisoire (7%)' : 'Application du taux selon la nature du bien'}
                     </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                        <span className="text-xs font-bold text-slate-800">Désignation</span>
                        <div className="text-right space-x-8">
                           <span className="text-xs font-bold text-slate-800">Taux</span>
                           <span className="text-xs font-bold text-slate-800">Montant IRG</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 font-medium">
                            {isSuperieurSeuil ? 'Imposition Provisoire (Global)' : formData.natureBien === 'HABITATION' ? 'Habitation' : formData.natureBien === 'PROFESSIONNEL' ? 'Usage Pro' : formData.natureBien === 'TERRAIN_IND' ? 'Terrain Ind.' : 'Agricole'}
                        </span>
                        <div className="text-right space-x-12">
                           <span className="text-sm font-bold text-blue-600">{taux}%</span>
                           <span className="text-sm font-black text-slate-900">{irgDu.toLocaleString('fr-FR', {minimumFractionDigits: 2})} DA</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 5. PAIEMENT */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode de paiement</h2>
               
               <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                     <input 
                        type="radio" 
                        name="payment" 
                        checked={formData.modePaiement === 'NUMERAIRE'}
                        onChange={() => setFormData({...formData, modePaiement: 'NUMERAIRE'})}
                        className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500" 
                     />
                     <span className="text-sm font-bold text-slate-700">Numéraire</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                     <input 
                        type="radio" 
                        name="payment" 
                        checked={formData.modePaiement === 'CHEQUE'}
                        onChange={() => setFormData({...formData, modePaiement: 'CHEQUE'})}
                        className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500" 
                     />
                     <span className="text-sm font-bold text-slate-700">Chèque Bancaire</span>
                  </label>

                  {formData.modePaiement === 'CHEQUE' && (
                     <div className="pl-8 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <input 
                           type="text" 
                           placeholder="N° Chèque" 
                           value={formData.numCheque}
                           onChange={e => setFormData({...formData, numCheque: e.target.value})}
                           className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                        <input 
                           type="text" 
                           placeholder="Banque" 
                           value={formData.banque}
                           onChange={e => setFormData({...formData, banque: e.target.value})}
                           className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                     </div>
                  )}

                  <div className="p-4 mt-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 italic leading-relaxed">
                     *Si le montant brut annuel dépasse 1.800.000 DA, une déclaration annuelle G N°1 sera nécessaire avant le 30 avril de l'année suivante pour régularisation.
                  </div>
               </div>
            </div>

         </div>

         {/* SIDEBAR RÉSUMÉ (STICKY) */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sticky top-28">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-600 rounded text-white">
                     <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Résumé G51</h3>
               </div>

               <div className="space-y-6">
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Montant Brut</p>
                     <p className="text-2xl font-black text-slate-900">{formData.loyerAnnuelBrut.toLocaleString('fr-FR', {minimumFractionDigits: 2})} DA</p>
                  </div>

                  <div className="border-t border-slate-100 my-4"></div>

                  <div className="space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Taux applicable</span>
                        <span className="font-bold text-slate-900">{taux}%</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">IRG dû</span>
                        <span className="font-bold text-slate-900">{irgDu.toLocaleString()} DA</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pénalités (0%)</span>
                        <span className="font-bold text-green-600">0.00 DA</span>
                     </div>
                  </div>

                  <div className="bg-[#f0f5ff] rounded-xl p-6 text-center space-y-1 mt-6 border border-blue-100">
                     <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Total Net à Payer</p>
                     <p className="text-3xl font-black text-blue-700">{totalNet.toLocaleString('fr-FR', {minimumFractionDigits: 2})} <span className="text-sm">DA</span></p>
                  </div>

                  <div className="space-y-3 pt-4">
                     <button onClick={() => handleSave('VALIDÉ')} className="w-full py-3.5 bg-[#1e40af] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Valider la déclaration
                     </button>
                     <button onClick={() => setViewMode('OFFICIAL')} className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" /> Générer PDF G51
                     </button>
                  </div>

                  <p className="text-[9px] text-center text-slate-400 mt-4 leading-tight">
                     Cette déclaration doit être souscrite au plus tard le 20 du mois suivant celui de la perception.
                  </p>
               </div>
            </div>
         </div>

      </div>
    </div>
  );

  // --- VUE OFFICIELLE ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-8 font-serif print:p-0 print:bg-white">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Modifier les données
        </button>
        <div className="flex gap-3">
          <button onClick={() => handleSave('BROUILLON')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 font-sans">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
          <button onClick={() => handleSave('VALIDÉ')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 font-sans">
            <CheckCircle2 className="w-4 h-4" /> Valider
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] min-h-[297mm] text-black font-sans box-border">
         <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-black uppercase">DÉCLARATION DES REVENUS FONCIERS (IRG)</h1>
            <h2 className="text-lg font-bold uppercase">(SÉRIE G N° 51)</h2>
            <p className="text-xs font-bold mt-2">Revenus provenant de la location de propriétés bâties et non bâties</p>
         </div>

         <div className="border-2 border-black p-4 mb-6">
            <h3 className="font-black uppercase border-b border-black pb-1 mb-2 text-[10px]">IDENTIFICATION DU BAILLEUR</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
                <p><span className="font-bold">Nom et Prénom :</span> {formData.bailleurNom}</p>
                <p><span className="font-bold">NIF :</span> {formData.bailleurNif}</p>
                <p className="col-span-2"><span className="font-bold">Adresse :</span> {formData.bailleurAdresse}</p>
            </div>
         </div>

         <div className="border-2 border-black p-4 mb-6">
            <h3 className="font-black uppercase border-b border-black pb-1 mb-2 text-[10px]">IDENTIFICATION DU PRENEUR</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
                <p><span className="font-bold">Nom et Prénom :</span> {formData.preneurNom}</p>
                <p><span className="font-bold">Adresse :</span> {formData.preneurAdresse}</p>
            </div>
         </div>

         <div className="border-2 border-black p-4 mb-6">
            <h3 className="font-black uppercase border-b border-black pb-1 mb-2 text-[10px]">DÉTAILS DU BIEN LOUÉ</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
                <p><span className="font-bold">Nature du bien :</span> {formData.natureBien}</p>
                <p><span className="font-bold">Situation :</span> {formData.lieuSituation}</p>
                <p><span className="font-bold">Période de location :</span> {formData.dateDebut || '...'} au {formData.dateFin || '...'}</p>
            </div>
         </div>

         <table className="w-full border-collapse border border-black mb-6 text-xs">
            <thead>
               <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-left">Désignation</th>
                  <th className="border border-black p-2 text-right">Montant (DA)</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td className="border border-black p-2">Montant annuel brut des loyers</td>
                  <td className="border border-black p-2 text-right font-mono">{formData.loyerAnnuelBrut.toLocaleString()}</td>
               </tr>
               <tr>
                  <td className="border border-black p-2">Taux d'imposition</td>
                  <td className="border border-black p-2 text-right font-bold">{taux} %</td>
               </tr>
               <tr className="bg-slate-100">
                  <td className="border border-black p-2 font-black uppercase">Montant de l'IRG à payer</td>
                  <td className="border border-black p-2 text-right font-black font-mono text-sm">{irgDu.toLocaleString()}</td>
               </tr>
            </tbody>
         </table>

         <div className="mt-8 pt-4 border-t-2 border-black flex justify-between text-xs">
            <div className="w-1/2">
               <p className="font-bold">Cadre réservé à l'administration</p>
            </div>
            <div className="w-1/2 text-center">
               <p className="mb-8">A {formData.lieuSituation ? formData.lieuSituation.split(',')[0] : '...'}, le .....................</p>
               <p className="font-bold">Signature du bailleur</p>
            </div>
         </div>
      </div>
    </div>
  );

  return viewMode === 'LIST' ? renderPropertyList() : viewMode === 'PROPERTY_FORM' ? renderPropertyForm() : viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default G51Form;
