import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Monitor, User } from 'lucide-react';
import { WorkspacePage, WorkspaceHeader, WorkspacePanel } from './ui/Workspace';
import { useAuth } from './AuthProvider';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);

  const handleHapticsToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setHapticsEnabled(isEnabled);
    if (isEnabled) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (err) {
        // ignore on web
      }
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Mi Cuenta"
        title="Configuración"
        description="Administra tus preferencias de la aplicación y perfil."
        icon={<SettingsIcon size={28} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <WorkspacePanel className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Perfil de Usuario</h3>
                <p className="text-sm text-slate-500">{user?.email || 'Usuario invitado'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Nombre de la Empresa o Despacho</h4>
                  <p className="text-xs text-slate-500 mt-1">Para aparecer en los documentos generados.</p>
                </div>
                <input type="text" placeholder="Mi Despacho S.C." className="mt-3 sm:mt-0 px-4 py-2 border border-slate-200 rounded-xl text-sm w-full sm:w-auto" />
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel className="p-8">
             <h3 className="text-lg font-bold text-slate-900 mb-6">Preferencias de Aplicación</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Monitor size={18} className="text-slate-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Tema Oscuro</h4>
                      <p className="text-xs text-slate-500 mt-1">Activar modo oscuro (próximamente)</p>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle" disabled />
               </div>
               
               <div className="flex justify-between items-center py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-slate-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Notificaciones Push</h4>
                      <p className="text-xs text-slate-500 mt-1">Alertas sobre cambios en tarifas UMA o Salario Mínimo</p>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
               </div>

               <div className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} className="text-slate-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Vibración Háptica</h4>
                      <p className="text-xs text-slate-500 mt-1">Solo disponible en dispositivos móviles</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle" 
                    checked={hapticsEnabled}
                    onChange={handleHapticsToggle}
                  />
               </div>
             </div>
          </WorkspacePanel>
        </div>

        <div className="lg:col-span-4">
          <WorkspacePanel className="p-6 bg-slate-50 border-none">
            <Shield size={24} className="text-legal-gold mb-4" />
            <h4 className="text-sm font-bold text-slate-900 mb-2">Seguridad y Privacidad</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tus documentos y cálculos están encriptados y no se usan para entrenar a los modelos de IA según nuestras políticas de privacidad.
            </p>
            <button className="text-xs font-bold text-legal-gold hover:underline">Leer Política de Privacidad</button>
          </WorkspacePanel>
        </div>
      </div>
    </WorkspacePage>
  );
};
