import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Coins, 
  Globe, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { Declaration, Taxpayer } from '../types';
import G17Form from './G17Form';
import G17BisForm from './G17BisForm';
import G17TerForm from './G17TerForm';

interface Props {
  taxpayer?: Taxpayer | null;
  onBack: () => void;
  onSubmit: (dec: Declaration) => void;
}

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

const G17UnifiedWizard: React.FC<Props> = ({ taxpayer, onBack, onSubmit }) => {
  const [selectedType, setSelectedType] = useState<'G17' | 'G17_BIS' | 'G17_TER' | null>(null);

  // Si un sous-formulaire est sélectionné, on l'affiche
  if (selectedType === 'G17') {
    return <G17Form taxpayer={taxpayer} onBack={() => setSelectedType(null)} onSubmit={onSubmit} />;
  }
  if (selectedType === 'G17_BIS') {
    return <G17BisForm taxpayer={taxpayer} onBack={() => setSelectedType(null)} onSubmit={onSubmit} />;
  }
  if (selectedType === 'G17_TER') {
    return <G17TerForm taxpayer={taxpayer} onBack={() => setSelectedType(null)} onSubmit={onSubmit} />;
  }

  // Sinon, on affiche l'écran de sélection unifié
  return (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col p-8 md:p-12 font-sans">
        <div className="max-w-5xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 hover:bg-white rounded-full text-slate-400 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Plus-Values de Cession</h1>
                    <p className="text-slate-500 font-medium">Sélectionnez le type de plus-value à déclarer (Série G17).</p>
                </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectionCard 
                    title="Immobilier (G17)" 
                    icon={Building2} 
                    description="Cession de biens immeubles bâtis ou non bâtis et droits réels immobiliers." 
                    selected={false} 
                    onClick={() => setSelectedType('G17')} 
                />
                <SelectionCard 
                    title="Valeurs Mobilières (G17 Bis)" 
                    icon={Coins} 
                    description="Cession d'actions, de parts sociales ou titres assimilés (Résidents)." 
                    selected={false} 
                    onClick={() => setSelectedType('G17_BIS')} 
                />
                <SelectionCard 
                    title="Non-Résidents / IBS (G17 Ter)" 
                    icon={Globe} 
                    description="Plus-values réalisées par des sociétés n'ayant pas d'installation professionnelle en Algérie." 
                    selected={false} 
                    onClick={() => setSelectedType('G17_TER')} 
                />
            </div>

            {/* Helper Info */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex items-start gap-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <ChevronRight className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Note Importante</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        Les déclarations de plus-values doivent être souscrites dans un délai de 30 jours suivant la transaction. 
                        Pour les cessions immobilières (G17), la déclaration est déposée auprès de la recette des impôts du lieu de situation du bien.
                    </p>
                </div>
            </div>

        </div>
    </div>
  );
};

export default G17UnifiedWizard;