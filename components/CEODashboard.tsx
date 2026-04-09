import React, { useEffect, useState } from 'react';
import { 
  Users, Crown, FileText, Calculator, RefreshCw, 
  TrendingUp, Shield, AlertTriangle, Clock, Activity
} from 'lucide-react';
import { useAuth } from './AuthProvider';

interface CEOStats {
  overview: {
    totalUsers: number;
    premiumUsers: number;
    documentsThisMonth: number;
    calculatorsThisMonth: number;
    oneTimeDocumentsAvailable: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    is_premium: boolean;
    license_type: string | null;
    access_until: string | null;
    created_at: string;
    isPremiumActive: boolean;
  }>;
  generatedAt: string;
}

export const CEODashboard: React.FC = () => {
  const { user, session } = useAuth();
  const [stats, setStats] = useState<CEOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/ceo/stats`, {
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
      });

      // Leer el cuerpo como texto primero para evitar crashes con respuestas no-JSON
      const text = await res.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Vercel a veces devuelve errores como texto plano (ej: "A server error has occurred")
        throw new Error(text.slice(0, 200) || `Error del servidor (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Error del servidor (${res.status})`);
      }

      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, session]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-300/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cargando Métricas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, recentUsers } = stats;
  const conversionRate = overview.totalUsers > 0 
    ? ((overview.premiumUsers / overview.totalUsers) * 100).toFixed(1) 
    : '0';

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                Panel de Administración
              </h1>
            </div>
            <p className="text-sm text-slate-400 ml-[52px]">
              Métricas en tiempo real de Lex Laboral
            </p>
          </div>
          <button 
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold shadow-sm"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Usuarios"
            value={overview.totalUsers}
            icon={<Users size={20} />}
            color="blue"
            subtitle="Registrados"
          />
          <KPICard
            title="Usuarios Premium"
            value={overview.premiumUsers}
            icon={<Crown size={20} />}
            color="amber"
            subtitle={`${conversionRate}% conversión`}
          />
          <KPICard
            title="Documentos (Mes)"
            value={overview.documentsThisMonth}
            icon={<FileText size={20} />}
            color="emerald"
            subtitle="Generados este mes"
          />
          <KPICard
            title="Cálculos (Mes)"
            value={overview.calculatorsThisMonth}
            icon={<Calculator size={20} />}
            color="purple"
            subtitle="Calculados este mes"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documentos sueltos pendientes</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{overview.oneTimeDocumentsAvailable}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasa de conversión</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{conversionRate}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Última actualización</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {new Date(stats.generatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Usuarios Recientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimos 20 usuarios registrados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registro</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acceso hasta</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-slate-700">{u.email || '—'}</span>
                    </td>
                    <td className="px-6 py-3">
                      {u.isPremiumActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold">
                          <Crown size={12} />
                          Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[11px] font-bold">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-500">{u.license_type || '—'}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-sm ${u.access_until && new Date(u.access_until) > new Date() ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                        {u.access_until ? new Date(u.access_until).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      No hay usuarios registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
};

// ===== KPI Card Component =====
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
  subtitle: string;
}

const colorMap = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    iconBg: 'bg-blue-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   iconBg: 'bg-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  iconBg: 'bg-purple-100' },
};

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subtitle }) => {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.iconBg} ${c.text} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value.toLocaleString('es-MX')}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{title}</p>
      <p className="text-[11px] text-slate-300 mt-0.5">{subtitle}</p>
    </div>
  );
};
