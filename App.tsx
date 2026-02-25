import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building2, LogOut, Plus, X, Save, 
  CheckCircle, ArrowRight, ShieldAlert, Zap, TrendingUp, Search 
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isLogged, setIsLogged] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
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
    const data = Object.fromEntries(new FormData(e.target));
    fetch('/api/clients', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(() => { setShowClientModal(false); loadData(); });
  };

  const openClientDetails = (id: string) => {
    fetch(`/api/clients/${id}`).then(res => res.json()).then(data => {
      setSelectedClient(data);
      setView('details');
    });
  };

  if (!isLogged) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Zap size={40} fill="currentColor"/>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">BG360 PORTAL</h1>
        <p className="text-slate-500 mb-8">Sistema de Stacking de Crédito</p>
        <button onClick={() => setIsLogged(true)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
          Entrar al Panel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-8 text-2xl font-black tracking-tighter border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm"><Zap size={16} fill="currentColor"/></div>
          BG360 <span className="text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">PRO</span>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard size={22}/> <span className="font-bold">Dashboard</span>
          </button>
          <button onClick={() => setView('clients')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'clients' || view === 'details' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Users size={22}/> <span className="font-bold">Clientes</span>
          </button>
          <button onClick={() => setView('banks')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'banks' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Building2 size={22}/> <span className="font-bold">Bancos</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={() => setIsLogged(false)} className="w-full flex items-center justify-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-bold">
            <LogOut size={20}/> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">{view}</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> SISTEMA ACTIVO
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-widest">Total Clientes</div>
              <div className="text-5xl font-black text-slate-900">{clients.length}</div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-widest">Bancos Activos</div>
              <div className="text-5xl font-black text-slate-900">{banks.length}</div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-widest">Eficiencia</div>
              <div className="text-5xl font-black text-green-600">94%</div>
            </div>
          </div>
        )}

        {view === 'clients' && (
          <div className="p-10">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-black text-slate-900">Directorio</h2>
              <button onClick={() => setShowClientModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                <Plus size={22}/> Nuevo Cliente
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Score</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((c:any) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900 text-lg">{c.firstName} {c.lastName}</div>
                        <div className="text-slate-400 text-sm">{c.email}</div>
                      </td>
                      <td className="px-8 py-6"><div className="text-2xl font-black text-blue-600">{c.score || '---'}</div></td>
                      <td className="px-8 py-6">
                        <button onClick={() => openClientDetails(c.id)} className="bg-slate-100 text-slate-700 px-5 py-2 rounded-xl font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-2">
                          Analizar Perfil <ArrowRight size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'details' && selectedClient && (
          <div className="p-10 max-w-5xl mx-auto">
            <button onClick={() => setView('clients')} className="text-slate-400 font-bold mb-6 flex items-center gap-2 hover:text-slate-900 transition-colors">
              <ArrowRight size={20} className="rotate-180"/> VOLVER AL LISTADO
            </button>
            
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl p-12 mb-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{selectedClient.client.firstName} {selectedClient.client.lastName}</h2>
                  <p className="text-xl text-slate-400 font-medium">{selectedClient.client.email}</p>
                </div>
                <div className="bg-slate-900 text-white p-6 rounded-3xl text-center min-w-[160px] shadow-2xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Credit Score</div>
                  <div className="text-5xl font-black">{selectedClient.snapshot?.score || '---'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-100">
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <div className="text-xs font-black text-slate-400 uppercase mb-2">Utilización</div>
                  <div className="text-3xl font-black text-blue-600">{selectedClient.snapshot?.utilization}%</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <div className="text-xs font-black text-slate-400 uppercase mb-2">Ingresos</div>
                  <div className="text-3xl font-black text-slate-900">${selectedClient.snapshot?.income}</div>
                </div>
                <div className="bg-blue-600 p-6 rounded-2xl text-white text-center shadow-lg shadow-blue-200">
                  <div className="text-xs font-black text-blue-200 uppercase mb-2">Estado</div>
                  <div className="text-2xl font-black uppercase italic">Calificado</div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-yellow-400 rounded-lg"><Zap size={20} fill="black"/></div>
              PLAN DE STACKING RECOMENDADO
            </h3>
            
            <div className="space-y-4">
              {banks.filter((b:any) => b.minScore <= (selectedClient.snapshot?.score || 0)).map((b:any, index: number) => (
                <div key={b.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-400 transition-all hover:shadow-lg group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg italic">{index + 1}</div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors">{b.name}</h4>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">{b.type}</span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter ${
                          b.bureau === 'Experian' ? 'bg-purple-100 text-purple-600' : 
                          b.bureau === 'Equifax' ? 'bg-red-100 text-red-600' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          PULL: {b.bureau}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a href={b.link} target="_blank" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200">
                    APLICAR AHORA
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'banks' && (
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {banks.map((b:any) => (
              <div key={b.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-black text-xl text-slate-900 leading-tight">{b.name}</h3>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${b.type === 'Business' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {b.type}
                  </span>
                </div>
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase">Min Score</span>
                    <span className="font-black text-slate-900">{b.minScore}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase">Buró</span>
                    <span className="font-black text-slate-900">{b.bureau}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: NUEVO CLIENTE */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[40px] p-12 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowClientModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={32}/></button>
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Nuevo Cliente</h2>
            <p className="text-slate-400 mb-10 font-medium">Ingresa los datos del reporte de crédito</p>
            <form onSubmit={handleAddClient} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input name="firstName" placeholder="Nombre" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" required />
                <input name="lastName" placeholder="Apellido" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" required />
              </div>
              <input name="email" type="email" placeholder="Correo Electrónico" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" required />
              <div className="grid grid-cols-2 gap-6">
                <input name="score" type="number" placeholder="Credit Score" className="w-full p-4 bg-blue-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-blue-600 text-xl" required />
                <input name="utilization" type="number" placeholder="Utilización %" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" required />
              </div>
              <input name="income" type="number" placeholder="Ingresos Mensuales ($)" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" required />
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 mt-4">
                <Save size={24}/> GUARDAR Y ANALIZAR
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
