import React, { useState } from 'react';
import { History as HistoryIcon, Download, Calendar, Search } from 'lucide-react';
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
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Mi Espacio"
        title="Historial"
        description="Revisa tus documentos generados, cálculos previos y chats analizados."
        icon={<HistoryIcon size={28} />}
      />

      <div className="grid grid-cols-1 gap-10">
        <WorkspacePanel className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-sm font-bold text-slate-950">Documentos Recientes</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar en el historial..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-legal-gold/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm text-slate-500 font-medium flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {item.date}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-legal-950 hover:text-legal-gold transition-colors flex items-center gap-1 text-sm font-bold">
                        <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WorkspacePanel>
      </div>
    </WorkspacePage>
  );
};
