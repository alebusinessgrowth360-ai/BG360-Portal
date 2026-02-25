import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, LogOut, Plus, ExternalLink } from 'lucide-react';

// --- VISTA DE BANCOS ---
const BanksView = () => {
  const [banks, setBanks] = useState([]);
  useEffect(() => {
    fetch('/api/banks').then(res => res.json()).then(data => setBanks(data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Catálogo de Bancos y Productos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map((bank: any) => (
          <div key={bank.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">{bank.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${bank.type === 'Business' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {bank.type}
              </span>
            </div>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex justify-between"><span>Min Score:</span> <span className="font-semibold">{bank.minScore}</span></div>
              <div className="flex justify-between"><span>Max Utilización:</span> <span className="font-semibold">{bank.maxUtilization}%</span></div>
            </div>
            <a href={bank.link} target="_blank" className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-2 rounded-lg hover:bg-slate-100 transition font-medium">
              Ver Producto <ExternalLink size={16} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- VISTA DE CLIENTES ---
const ClientsView = () => {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(data => setClients(data));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Clientes</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nombre</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No hay clientes registrados aún.</td></tr>
            ) : (
              clients.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.firstName} {c.lastName}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-bold">{c.stage}</span></td>
                  <td className="px-6 py-4 text-blue-600 cursor-pointer hover:underline">Ver Detalles</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('dashboard');
  const [isLogged, setIsLogged] = useState(false);

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-8">BG360 Portal</h1>
          <button onClick={() => setIsLogged(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Entrar como Administrador
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 tracking-tight">BG360 PORTAL</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setView('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'clients' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <Users size={20} /> Clientes
          </button>
          <button onClick={() => setView('banks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'banks' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <Building2 size={20} /> Bancos
          </button>
        </nav>
        <button onClick={() => setIsLogged(false)} className="m-4 flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition">
          <LogOut size={20} /> Salir
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center px-8 text-slate-500 font-medium">
          Panel de Administración / {view.toUpperCase()}
        </header>
        {view === 'dashboard' && (
          <div className="p-8 text-center mt-20">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Bienvenido al Sistema de Stacking</h2>
            <p className="text-slate-500 max-w-md mx-auto text-lg">Usa el menú lateral para gestionar tus clientes y ver los productos bancarios disponibles.</p>
          </div>
        )}
        {view === 'clients' && <ClientsView />}
        {view === 'banks' && <BanksView />}
      </div>
    </div>
  );
}
