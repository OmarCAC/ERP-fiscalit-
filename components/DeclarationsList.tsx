
import React from 'react';
import { Plus, Filter, Search, Download, Eye, Edit2, Trash2 } from 'lucide-react';
import { Declaration } from '../types';

const mockDeclarations: Declaration[] = [
  // Fixed: Added required 'regime' property to each declaration
  { id: '#G50-10452', type: 'G50', period: 'Mai 2024', regime: 'Réel Simplifié', submissionDate: '15/06/2024', status: 'ACCEPTÉE', amount: 450000 },
  { id: '#GN12-9834', type: 'GN°12', period: 'Avril 2024', regime: 'IFU', submissionDate: '14/05/2024', status: 'REJETÉE', amount: 0 },
  { id: '#G50-10113', type: 'G50', period: 'Avril 2024', regime: 'Réel Simplifié', submissionDate: '15/05/2024', status: 'EN COURS', amount: 420000 },
  { id: '#IRG-8874', type: 'IRG Salariés', period: 'Mai 2024', regime: 'Réel Normal', submissionDate: '15/06/2024', status: 'REÇUE', amount: 150000 },
  { id: '#G50-9556', type: 'G50', period: 'Mars 2024', regime: 'Réel Simplifié', submissionDate: '15/04/2024', status: 'ACCEPTÉE', amount: 1200000 },
];

const statusStyles = {
  'ACCEPTÉE': 'bg-green-100 text-green-700 border-green-200',
  'REJETÉE': 'bg-red-100 text-red-700 border-red-200',
  'EN COURS': 'bg-orange-100 text-orange-700 border-orange-200',
  'REÇUE': 'bg-blue-100 text-blue-700 border-blue-200',
  'BROUILLON': 'bg-slate-100 text-slate-700 border-slate-200',
};

interface Props {
  onNew: () => void;
}

const DeclarationsList: React.FC<Props> = ({ onNew }) => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Suivi Télé-Déclarations</h1>
          <p className="text-slate-500 mt-1">Gérez vos déclarations fiscales déposées et en cours.</p>
        </div>
        <button 
          onClick={onNew}
          className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-primary-600 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nouvelle Déclaration
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Statut: Tous
            </button>
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Période
            </button>
          </div>
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher par ID..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary focus:ring-0 rounded-lg text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identifiant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Période</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date de Soumission</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockDeclarations.map((dec) => (
                <tr key={dec.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{dec.id}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{dec.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{dec.period}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">{dec.submissionDate}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{dec.amount.toLocaleString()} DZD</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${statusStyles[dec.status as keyof typeof statusStyles]}`}>
                      {dec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Voir" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button title="Télécharger" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button title="Éditer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button title="Supprimer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <span className="text-sm text-slate-500">Affichage de 1 à 5 sur 24 déclarations</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 disabled:opacity-50" disabled>&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclarationsList;
