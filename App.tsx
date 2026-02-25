import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  LogOut, 
  Plus, 
  X, 
  Save, 
  CheckCircle, 
  ArrowRight, 
  ShieldAlert, 
  Zap 
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isLogged, setIsLogged] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState([]);
  const [banks, setBanks] = useState([]);

  const loadData = () => {
    fetch('/api/clients').then(res => res.json()).then(setClients);
    fetch('/api/banks').then(res => res.json()).then(setBanks);
  };

  useEffect(() => { if(isLogged) loadData(); }, [isLogged]);

  const handleAddClient = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetch('/api/clients', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(Object.fromEntries(formData))
    }).then(() => { setShowModal(false); loadData(); });
  };

  const openClientDetails = (id: string) => {
    fetch(`/api/clients/${id}`).then(res => res.json()).then(data => {
      setSelectedClient(data);
      setView('details');
    });
  };

  if (!isLogged) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">BG360 Portal</h1>
        <button onClick={() => setIsLogged(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">Entrar al Sistema</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-slate-800">BG360</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => setView('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'clients' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Users size={20}/> Clientes</button>
          <button onClick={() => setView('banks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'banks' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Building2 size={20}/> Bancos</button>
        </nav>
        <button onClick={() => setIsLogged(false)} className="m-4 p-3 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"><LogOut size={20}/> Salir</button>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white h-16 border-b flex items-center justify-between px-8 shadow-sm">
          <span className="font-medium text-slate-500 uppercase tracking-wider text-xs">BG360 / {view}</span>
          <div className="flex items-center gap-2 text-green-600 font-bold text-sm"><CheckCircle size={16}/> SISTEMA ACTIVO</div>
        </header>

        {view === 'dashboard' && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm"><div className="text-slate-500 text-sm">Clientes</div><div className="text-3xl font-bold">{clients.length}</div></div>
            <div className="bg-white p-6 rounded-xl border shadow-sm"><div className="text-slate-500 text-sm">Bancos</div><div className="text-3xl font-bold">{banks.length}</div></div>
            <div className="bg-white p-6 rounded-xl border shadow-sm"><div className="text-slate-500 text-sm">Eficiencia</div><div className="text-3xl font-bold text-green-600">98%</div></div>
          </div>
        )}

        {view === 'clients' && (
          <div className="p-8">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20}/> Nuevo</button>
            </div>
            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">Score</th><th className="px-6 py-4">Acción</th></tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((c:any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{c.firstName} {c.lastName}</td>
                      <td className="px-6 py-4"><span className="font-bold text-blue-600">{c.score || '---'}</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => openClientDetails(c.id)} className="text-blue-600 hover:underline flex items-center gap-1">Ver Plan <ArrowRight size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'details' && selectedClient && (
          <div className="p-8 max-w-4xl mx-auto">
            <button onClick={() => setView('clients')} className="text-slate-500 mb-4 flex items-center gap-2 hover:text-slate-800"><ArrowRight size={16} className="rotate-180"/> Volver a la lista</button>
            <div className="bg-white rounded-2xl border shadow-sm p-8 mb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selectedClient.client.firstName} {selectedClient.client.lastName}</h2>
                  <p className="text-slate-500">{selectedClient.client.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 uppercase font-bold">Credit Score</div>
                  <div className="text-5xl font-black text-blue-600">{selectedClient.snapshot?.score || '---'}</div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="text-yellow-500" fill="currentColor"/> Plan de Stacking Recomendado</h3>
            <div className="space-y-4">
              {banks.filter((b:any) => b.minScore <= (selectedClient.snapshot?.score || 0)).length === 0 ? (
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl text-orange-700 flex items-center gap-4">
                  <ShieldAlert size={32}/>
                  <div>
                    <p className="font-bold">No hay bancos disponibles para este perfil.</p>
                  </div>
                </div>
              ) : (
                banks
                  .filter((b:any) => b.minScore <= (selectedClient.snapshot?.score || 0))
                  .map((b:any, index: number) => (
                    <div key={b.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{index + 1}</div>
                        <div>
                          <h4 className="font-bold text-slate-900">{b.name}</h4>
                          <p className="text-xs text-slate-500 uppercase">{b.type}</p>
                        </div>
                      </div>
                      <a href={b.link} target="_blank" className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition">Aplicar Ahora</a>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {view === 'banks' && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map((b:any) => (
              <div key={b.id} className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold text-lg mb-2">{b.name}</h3>
                <div className="text-sm text-slate-500 mb-4">Mínimo Score: <span className="font-bold text-slate-800">{b.minScore}</span></div>
                <a href={b.link} target="_blank" className="block text-center bg-slate-100 py-2 rounded-lg font-medium hover:bg-slate-200 transition">Ver Requisitos</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nuevo Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            <h2 className="text-2xl font-bold mb-6">Registrar Nuevo Cliente</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="firstName" placeholder="Nombre" className="w-full p-2 border rounded-lg" required />
                <input name="lastName" placeholder="Apellido" className="w-full p-2 border rounded-lg" required />
              </div>
              <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded-lg" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="score" type="number" placeholder="Credit Score" className="w-full p-2 border rounded-lg" required />
                <input name="utilization" type="number" placeholder="% Utilización" className="w-full p-2 border rounded-lg" required />
              </div>
              <input name="income" type="number" placeholder="Ingresos Mensuales ($)" className="w-full p-2 border rounded-lg" required />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={20}/> Guardar y Analizar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
