import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  LogOut, 
  Plus, 
  Search,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Clock
} from 'lucide-react';

// --- COMPONENTES DEL PORTAL ---

const Dashboard = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Panel de Control</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={24} /></div>
          <span className="text-sm font-medium text-green-600">+12%</span>
        </div>
        <div className="text-2xl font-bold">128</div>
        <div className="text-gray-500 text-sm">Clientes Totales</div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp size={24} /></div>
          <span className="text-sm font-medium text-green-600">+5%</span>
        </div>
        <div className="text-2xl font-bold">$1.2M</div>
        <div className="text-gray-500 text-sm">Capital Solicitado</div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><ShieldCheck size={24} /></div>
          <span className="text-sm font-medium text-orange-600">85%</span>
        </div>
        <div className="text-2xl font-bold">42</div>
        <div className="text-gray-500 text-sm">Planes Activos</div>
      </div>
    </div>
  </div>
);

const Clients = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(data => setClients(data));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-bottom border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Score</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium">{client.firstName} {client.lastName}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                    {client.stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{client.score || '---'}</td>
                <td className="px-6 py-4 text-blue-600 cursor-pointer hover:underline">Ver Detalles</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- ESTRUCTURA PRINCIPAL ---

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isLogged, setIsLogged] = useState(false);

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">BG360 Portal</h1>
            <p className="text-slate-500 mt-2">Ingresa tus credenciales de administrador</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" defaultValue="admin@bg360.com" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input type="password" defaultValue="admin123" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button 
              onClick={() => setIsLogged(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-slate-800">BG360</div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setView('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'clients' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            <Users size={20} /> Clientes
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition">
            <Building2 size={20} /> Bancos
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsLogged(false)} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8">
          <div className="text-gray-500">Bienvenido, Administrador</div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">A</div>
          </div>
        </header>
        {view === 'dashboard' ? <Dashboard /> : <Clients />}
      </div>
    </div>
  );
}
