// ... (Dentro de la vista 'details' de App.tsx, busca el mapeo de bancos y reemplázalo por esto)
banks
  .filter((b:any) => b.minScore <= (selectedClient.snapshot?.score || 0))
  .map((b:any, index: number) => (
    <div key={b.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-400 transition-all hover:shadow-lg group">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg italic">
          {index + 1}
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors">{b.name}</h4>
          <div className="flex gap-3 mt-2">
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">{b.type}</span>
            {/* ETIQUETA DE BURÓ */}
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
  ))
