import React, { useState } from 'react';
import { History as HistoryIcon, Download, Calendar, Search, FileText, ChevronRight } from 'lucide-react';
import { WorkspacePage, WorkspaceHeader, WorkspacePanel } from './ui/Workspace';

export const History: React.FC = () => {
  const [search, setSearch] = useState('');

  // Mock data for history
  const historyItems = [
    { id: 1, date: '2026-03-15', name: 'Contrato Indefinido - Juan Pérez', type: 'Contrato', status: 'Generado' },
    { id: 2, date: '2026-03-12', name: 'Cálculo Liquidación - María Gómez', type: 'Cálculo', status: 'Guardado' },
    { id: 3, date: '2026-03-10', name: 'Acta Administrativa - Retardo', type: 'Acta', status: 'Generado' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-slate-950 px-6 pt-12 pb-8 shadow-md rounded-b-[2rem]">
        <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
          <HistoryIcon size={24} className="text-legal-gold" />
          Historial
        </h1>
        <p className="text-sm text-slate-400 mt-1">Revisa tus documentos generados y cálculos previos.</p>
        
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar documento..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-legal-gold outline-none"
          />
        </div>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto">
        <div className="flex flex-col gap-3">
          {historyItems.map((item) => (
            <div key={item.id} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-transform cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={12} /> {item.date}
                    </span>
                    <span className="text-[10px] font-bold text-legal-gold bg-legal-gold/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                </div>
              </div>
              <button className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-legal-gold transition-colors">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
        
        {historyItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[1.5rem] border border-slate-100 mt-4">
            <HistoryIcon size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-serif font-bold text-xl text-slate-900">Historial Vacío</h3>
            <p className="text-sm text-slate-500 mt-2 px-6">Aún no has generado documentos ni cálculos.</p>
          </div>
        )}
      </div>
    </div>
  );
};
