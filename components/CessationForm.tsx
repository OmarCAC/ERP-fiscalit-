
import React, { useState, useEffect } from 'react';
import { User, Info, FileText, ArrowLeft, Save, CheckCircle2, Printer, MapPin, Calendar, FileCheck, Building2 } from 'lucide-react';
import { Taxpayer } from '../types';

interface Props {
  taxpayer: Taxpayer | null;
  onBack: () => void;
}

const CessationForm: React.FC<Props> = ({ taxpayer, onBack }) => {
  const [viewMode, setViewMode] = useState<'WIZARD' | 'OFFICIAL'>('WIZARD');
  
  // États du formulaire
  const [formData, setFormData] = useState({
    // Identification
    nomRaison: '',
    activite: '',
    // Dates
    dateDebut: '',
    dateCessation: '',
    // Adresses
    adresseExercice: '',
    adresseDomicile: '',
    // Fiscal & Légal
    nif: '',
    article: '',
    registreCommerce: '', // RC, Carte Artisan ou Agrément
    // Signature
    lieu: '',
    date: new Date().toISOString().split('T')[0]
  });

  // SYNCHRONISATION AVEC LE MODULE CONTRIBUABLE
  useEffect(() => {
    if (taxpayer) {
      setFormData(prev => ({
        ...prev,
        nomRaison: taxpayer.dynamicData['1'] || prev.nomRaison,
        activite: taxpayer.dynamicData['7'] || prev.activite,
        nif: taxpayer.dynamicData['2'] || prev.nif,
        article: taxpayer.dynamicData['article_imp'] || prev.article,
        adresseExercice: taxpayer.dynamicData['adresse'] || prev.adresseExercice,
        // On essaie de récupérer le RC s'il existe dans les données dynamiques
        registreCommerce: taxpayer.dynamicData['rc'] || taxpayer.dynamicData['agrement'] || prev.registreCommerce,
        dateDebut: taxpayer.dynamicData['11'] || prev.dateDebut,
        lieu: taxpayer.commune || prev.lieu,
      }));
    }
  }, [taxpayer]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  // --- VUE WIZARD (SAISIE) ---
  const renderWizard = () => (
    <div className="min-h-full bg-[#f6f7f8] flex flex-col pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-10 py-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                 <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cessation d'Activité (IFU)</h1>
                 <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Série D n°1 ter</p>
              </div>
           </div>
           <div className="flex gap-3">
             <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> Brouillon
             </button>
             <button onClick={() => setViewMode('OFFICIAL')} className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                <FileText className="w-4 h-4" /> Aperçu Officiel
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Section 1 : Identification */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
             <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <User className="w-5 h-5 text-primary" /> Identification du Contribuable
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nom, Prénom / Raison Sociale</label>
                   <input 
                      type="text" 
                      value={formData.nomRaison}
                      onChange={(e) => handleChange('nomRaison', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Ex: Entreprise ABC"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Activité(s) exercée(s)</label>
                   <input 
                      type="text" 
                      value={formData.activite}
                      onChange={(e) => handleChange('activite', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Ex: Commerce de détail"
                   />
                </div>
             </div>
          </div>

          {/* Section 2 : Dates */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
             <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-500" /> Période d'Activité
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date du début d'activité</label>
                   <input 
                      type="date" 
                      value={formData.dateDebut}
                      onChange={(e) => handleChange('dateDebut', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date de la cessation</label>
                   <input 
                      type="date" 
                      value={formData.dateCessation}
                      onChange={(e) => handleChange('dateCessation', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                   />
                </div>
             </div>
          </div>

          {/* Section 3 : Localisation */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
             <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" /> Adresses
             </h2>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Adresse du lieu d'exercice</label>
                   <input 
                      type="text" 
                      value={formData.adresseExercice}
                      onChange={(e) => handleChange('adresseExercice', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Adresse du local commercial/professionnel"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Adresse du domicile de l'exploitant</label>
                   <input 
                      type="text" 
                      value={formData.adresseDomicile}
                      onChange={(e) => handleChange('adresseDomicile', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Adresse personnelle"
                   />
                </div>
             </div>
          </div>

          {/* Section 4 : Identifiants */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
             <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-600" /> Identifiants Administratifs
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">NIF (Matricule Fiscal)</label>
                   <input 
                      type="text" 
                      value={formData.nif}
                      onChange={(e) => handleChange('nif', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all font-mono tracking-wider"
                      maxLength={15}
                      placeholder="000000000000000"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Article d'imposition</label>
                   <input 
                      type="text" 
                      value={formData.article}
                      onChange={(e) => handleChange('article', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all font-mono tracking-wider"
                      maxLength={11}
                      placeholder="00000000000"
                   />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">N° RC / Carte Artisan / Agrément</label>
                   <input 
                      type="text" 
                      value={formData.registreCommerce}
                      onChange={(e) => handleChange('registreCommerce', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Numéro du document légal"
                   />
                </div>
             </div>
          </div>

          {/* Signature */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
             <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-slate-600" /> Validation
             </h2>
             <div className="flex gap-6">
                <div className="flex-1 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fait à</label>
                   <input 
                      type="text" 
                      value={formData.lieu}
                      onChange={(e) => handleChange('lieu', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Ville"
                   />
                </div>
                <div className="flex-1 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Le</label>
                   <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                   />
                </div>
             </div>
             <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-xs font-medium text-yellow-800 flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Attention : La clôture effective du dossier fiscal n'interviendra qu'à compter de la présentation d'une copie de l'attestation de radiation du registre du commerce.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );

  // --- VUE OFFICIELLE (PDF REPLICA) ---
  const renderOfficial = () => (
    <div className="min-h-full bg-[#525659] p-4 md:p-8 font-serif print:p-0 print:bg-white">
      {/* Header Actions */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => setViewMode('WIZARD')} className="flex items-center gap-2 text-white hover:text-slate-200 font-sans font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Modifier les données
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 font-sans">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 font-sans">
            <CheckCircle2 className="w-4 h-4" /> Valider
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all font-sans">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* DOCUMENT A4 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[10mm] min-h-[297mm] relative text-black font-sans box-border border-0">
        
        {/* EN-TETE */}
        <div className="flex justify-between items-start border-2 border-black p-1 mb-2">
           <div className="flex-1"></div>
           <div className="flex-1 text-center space-y-1">
              <h1 className="text-sm font-bold font-serif leading-none">الجمهورية الجزائرية الديمقراطية الشعبية</h1>
              <h2 className="text-[10px] font-bold uppercase tracking-widest leading-none">République Algérienne Démocratique et Populaire</h2>
           </div>
           <div className="flex-1 text-right">
              <div className="border border-black px-2 py-1 text-center inline-block">
                 <p className="text-[10px] font-bold">Série D n° 1 ter</p>
              </div>
           </div>
        </div>

        {/* Administration Info */}
        <div className="flex justify-between items-start text-[10px] font-bold mb-4 px-2">
           <div className="space-y-1">
              <p>DIRECTION GENERALE DES IMPOTS</p>
              <p>DIRECTION DES IMPOTS DE LA WILAYA</p>
              <p>DE : ..........................................................................</p>
              <p>SERVICE D'ASSIETTE DE : ....................................</p>
              <p>COMMUNE DE : .......................................................</p>
           </div>
           <div className="text-right space-y-1" dir="rtl">
              <p>المديرية العامة للضرائب</p>
              <p>مديرية الضرائب لوالية .................................................</p>
              <p>مصلحة الوعاء : .........................................................</p>
              <p>بلدية : .....................................................................</p>
           </div>
        </div>

        {/* TITRE DU FORMULAIRE */}
        <div className="text-center space-y-1 mb-2">
           <h2 className="text-lg font-bold" dir="rtl">- تصريح إنهاء النشاط -</h2>
           <h2 className="text-lg font-bold" dir="rtl">- نظام الضريبة الجزافية الوحيدة -</h2>
           <h3 className="text-sm font-bold">- Déclaration de cessation d'activité -</h3>
           <h3 className="text-sm font-bold">- Régime de l'Impôt Forfaitaire Unique -</h3>
           <p className="text-[10px] font-bold">(Article 88 de la Loi de Finances pour l'année 2021)</p>
        </div>

        {/* INSTRUCTION */}
        <div className="border-2 border-black rounded-xl p-2 text-center mb-6 bg-gray-50">
           <p className="text-[10px] font-bold" dir="rtl">ترسل إلى المصالح المكلفة بتسيير الملف الجبائي.</p>
           <p className="text-[9px] font-bold">A faire parvenir aux services gestionnaires du dossier fiscal.</p>
        </div>

        {/* CADRE PRINCIPAL */}
        <div className="border-2 border-black">
           
           {/* Header Cadre */}
           <div className="border-b border-black bg-gray-100 p-1 text-center">
              <h4 className="text-[10px] font-bold" dir="rtl">معلومات خاصة بالمكلف بالضريبة</h4>
              <h4 className="text-[10px] font-bold uppercase">IDENTIFICATION DU CONTRIBUABLE</h4>
           </div>

           {/* Champs */}
           <div className="p-4 space-y-3 text-[10px]">
              
              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Nom, Prénom / Raison sociale :</span>
                 <span className="font-bold uppercase flex-1">{formData.nomRaison}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- الاسم و اللقب/ اسم المؤسسة:</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Activité (s) exercée (s) :</span>
                 <span className="font-bold uppercase flex-1">{formData.activite}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- النشاط أو النشاطات الممارسة :</span>
              </div>

              <div className="h-4"></div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Date du début d'activité :</span>
                 <span className="font-bold uppercase flex-1">{formData.dateDebut}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- تاريخ بداية النشاط :</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Date de la cessation d'activité :</span>
                 <span className="font-bold uppercase flex-1">{formData.dateCessation}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- تاريخ انهاء النشاط :</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Adresse du lieu d'exercice de l'activité :</span>
                 <span className="font-bold uppercase flex-1">{formData.adresseExercice}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- عنوان النشاط :</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Adresse du domicile de l'exploitant :</span>
                 <span className="font-bold uppercase flex-1">{formData.adresseDomicile}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- عنوان إقامة المكلف بالضريبة:</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Numéro d'Identification Fiscale (NIF) :</span>
                 <span className="font-bold font-mono tracking-widest text-sm flex-1 bg-gray-50 px-2">{formData.nif}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- رقم التعريف الجبائي :</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Numéro d'article d'imposition :</span>
                 <span className="font-bold font-mono tracking-widest text-sm flex-1 bg-gray-50 px-2">{formData.article}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- رقم المادة :</span>
              </div>

              <div className="flex justify-between items-end border-b border-black pb-1">
                 <span className="font-bold whitespace-nowrap mr-2">- Numéro du RC, de la carte d'artisan ou de l'agrément :</span>
                 <span className="font-bold uppercase flex-1">{formData.registreCommerce}</span>
                 <span className="font-bold whitespace-nowrap ml-2" dir="rtl">- رقم السجل التجاري أو بطاقة الحرفي أو الاعتماد :</span>
              </div>

              {/* ATTESTATION */}
              <div className="mt-8 border-2 border-black p-4 text-center bg-gray-50">
                 <p className="font-bold mb-1" dir="rtl">أشهد بأن النشاط الذي امارسه متوقف تماما</p>
                 <p className="font-bold uppercase">J'atteste que l'activité que j'exerce est cessée définitivement</p>
              </div>

              {/* SIGNATURE */}
              <div className="flex justify-between mt-8 min-h-[40mm]">
                 <div className="flex-1"></div>
                 <div className="flex-1 text-center">
                    <p className="mb-4 font-bold" dir="rtl">....................................... في .......................................</p>
                    <p className="mb-8 font-bold">A {formData.lieu || '.......................................'}, le {formData.date || '.......................................'}</p>
                    <div className="relative">
                       <p className="font-bold mb-1" dir="rtl">ختم و إمضاء المكلف بالضريبة</p>
                       <p className="font-bold uppercase">Cachet et signature du contribuable</p>
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* RAPPEL */}
        <div className="mt-4 border-2 border-black p-2 bg-white">
           <p className="font-bold text-[10px] text-right mb-1" dir="rtl"><span className="underline">تذكير:</span> لا يتم الإغلاق الفعلي للملف الضريبي إلا عند تقديم نسخة من شهادة الشطب من السجل التجاري.</p>
           <p className="font-bold text-[9px]"><span className="underline">Rappel:</span> La clôture effective du dossier fiscal n'interviendra qu'à compter de la présentation d'une copie de l'attestation de radiation du registre du commerce.</p>
        </div>

      </div>
    </div>
  );

  return viewMode === 'WIZARD' ? renderWizard() : renderOfficial();
};

export default CessationForm;
