import React, { useEffect, useState } from 'react'
import { Package, AlertTriangle, CheckCircle2, Layers, MapPin, Search } from 'lucide-react'

export default function InventoryView({ apiUrl }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/inventory`)
      .then(res => res.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [apiUrl])

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = filterCat === 'todos' || it.category === filterCat
    return matchesSearch && matchesCat
  })

  const lowStockCount = items.filter(it => Number(it.stock_quantity) < Number(it.min_quantity)).length

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Módulo de Almacén & Abastecimiento
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Inventario de Telas y Materias Primas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Control de rollos de Gabardina, Ripstop, Popelina, cintas reflectivas 3M e insumos de costura.
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{lowStockCount} ítem(s) con stock por debajo del mínimo</span>
          </div>
        )}
      </div>

      {/* Buscador y Categorías */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tela, cinta reflectiva, botón..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'tela_rollo', label: 'Rollos de Tela' },
            { id: 'avio', label: 'Avíos & Cintas 3M' },
            { id: 'insumo', label: 'Hilos e Insumos' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCat(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterCat === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Materias Primas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isLow = Number(item.stock_quantity) < Number(item.min_quantity)
          const pct = Math.min(100, Math.round((Number(item.stock_quantity) / (Number(item.min_quantity) * 2)) * 100))

          return (
            <div
              key={item.id}
              className={`bg-white p-6 rounded-3xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 ${
                isLow ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    item.category === 'tela_rollo' ? 'bg-blue-50 text-blue-700' :
                    item.category === 'avio' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.category === 'tela_rollo' ? 'Rollo Textil' : item.category === 'avio' ? 'Avío / 3M' : 'Insumo'}
                  </span>

                  {isLow ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Stock Crítico</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Disponible</span>
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-sm text-slate-900">{item.name}</h4>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{item.location}</span>
                </p>
              </div>

              {/* Medidor de Stock */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-900">
                    {item.stock_quantity} <span className="text-xs text-slate-500 font-semibold">{item.unit_measure}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Mínimo: {item.min_quantity} {item.unit_measure}</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
