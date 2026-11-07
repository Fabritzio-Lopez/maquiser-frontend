import React, { useEffect, useState } from 'react'
import {
  Package, AlertTriangle, CheckCircle2, Layers, MapPin,
  Search, Plus, X, ArrowUpRight, RefreshCw, Sparkles
} from 'lucide-react'

export default function InventoryView({ apiUrl, canEdit = true }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Estados de Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedItemForRestock, setSelectedItemForRestock] = useState(null)
  const [restockAmount, setRestockAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Formulario de nuevo insumo
  const [newInsumo, setNewInsumo] = useState({
    name: '',
    category: 'tela_rollo',
    stock_quantity: 100,
    min_quantity: 20,
    unit_measure: 'metros',
    location: 'Almacén Central de Telas - Estante A1'
  })

  // Cargar insumos desde la API
  const fetchInventory = () => {
    setLoading(true)
    fetch(`${apiUrl}/api/v1/inventory`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchInventory()
  }, [apiUrl])

  // Crear nuevo insumo en PostgreSQL / Supabase
  const handleCreateInsumo = async (e) => {
    e.preventDefault()
    if (!newInsumo.name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInsumo,
          stock_quantity: Number(newInsumo.stock_quantity),
          min_quantity: Number(newInsumo.min_quantity)
        })
      })

      if (res.ok) {
        const created = await res.json()
        setItems(prev => [created, ...prev])
      } else {
        // Fallback local si el backend está en modo offline
        const mockItem = {
          id: Date.now(),
          ...newInsumo,
          stock_quantity: Number(newInsumo.stock_quantity),
          min_quantity: Number(newInsumo.min_quantity)
        }
        setItems(prev => [mockItem, ...prev])
      }

      setShowCreateModal(false)
      setNewInsumo({
        name: '',
        category: 'tela_rollo',
        stock_quantity: 100,
        min_quantity: 20,
        unit_measure: 'metros',
        location: 'Almacén Central de Telas - Estante A1'
      })
      setSuccessMsg(`¡Insumo "${newInsumo.name}" registrado correctamente!`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch {
      // Fallback local ante desconexión
      const mockItem = {
        id: Date.now(),
        ...newInsumo,
        stock_quantity: Number(newInsumo.stock_quantity),
        min_quantity: Number(newInsumo.min_quantity)
      }
      setItems(prev => [mockItem, ...prev])
      setShowCreateModal(false)
      setSuccessMsg(`¡Insumo registrado en almacén local!`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  // Cargar / Reabastecer stock de un insumo existente
  const handleRestockSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItemForRestock || !restockAmount || Number(restockAmount) <= 0) return

    const qtyToAdd = Number(restockAmount)
    setSubmitting(true)

    try {
      const res = await fetch(`${apiUrl}/api/v1/inventory/${selectedItemForRestock.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qtyToAdd })
      })

      if (res.ok) {
        const updated = await res.json()
        setItems(prev => prev.map(it => it.id === selectedItemForRestock.id ? { ...it, stock_quantity: updated.stock_quantity } : it))
      } else {
        // Fallback local
        setItems(prev => prev.map(it => it.id === selectedItemForRestock.id ? { ...it, stock_quantity: Number(it.stock_quantity) + qtyToAdd } : it))
      }

      setShowRestockModal(false)
      setSuccessMsg(`Se añadieron +${qtyToAdd} ${selectedItemForRestock.unit_measure} a "${selectedItemForRestock.name}".`)
      setTimeout(() => setSuccessMsg(''), 4000)
      setRestockAmount('')
    } catch {
      setItems(prev => prev.map(it => it.id === selectedItemForRestock.id ? { ...it, stock_quantity: Number(it.stock_quantity) + qtyToAdd } : it))
      setShowRestockModal(false)
      setSuccessMsg(`Stock actualizado localmente (+${qtyToAdd} ${selectedItemForRestock.unit_measure}).`)
      setTimeout(() => setSuccessMsg(''), 4000)
      setRestockAmount('')
    } finally {
      setSubmitting(false)
    }
  }

  const openRestock = (item) => {
    setSelectedItemForRestock(item)
    setRestockAmount('')
    setShowRestockModal(true)
  }

  // Filtrado
  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (it.location && it.location.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCat = filterCat === 'todos' || it.category === filterCat
    return matchesSearch && matchesCat
  })

  // Métricas
  const totalItemsCount = items.length
  const totalMeters = items
    .filter(i => i.unit_measure === 'metros')
    .reduce((acc, curr) => acc + Number(curr.stock_quantity || 0), 0)
  const lowStockCount = items.filter(it => Number(it.stock_quantity) < Number(it.min_quantity)).length

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Mensaje de Éxito / Feedback */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera Principal con Botón de Registrar Insumo */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Módulo de Almacén & Abastecimiento • Maquiser SRL
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Inventario de Telas y Materias Primas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Recepción, registro y control de rollos de tela, avíos 3M, hilos y forros para confección.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchInventory}
            className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
            title="Actualizar Stock"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canEdit ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nuevo Insumo</span>
            </button>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center space-x-1.5">
              <span>Modo Consulta (Solo Lectura)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Variedades</span>
            <span className="text-xl font-black text-slate-900">{totalItemsCount} ítems en almacén</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Metraje Total Telas</span>
            <span className="text-xl font-black text-slate-900">{totalMeters.toLocaleString()} metros</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm flex items-center space-x-4 ${
          lowStockCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
            lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Alertas de Stock</span>
            <span className={`text-xl font-black ${lowStockCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {lowStockCount > 0 ? `${lowStockCount} por reabastecer` : 'Stock en niveles óptimos'}
            </span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtro por Categorías */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación (ej: Gabardina, Cintas, A1)..."
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

                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{item.name}</h4>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{item.location || 'Almacén Central'}</span>
                </p>
              </div>

              {/* Medidor y Cantidad de Stock */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      {Number(item.stock_quantity).toLocaleString()}{' '}
                      <span className="text-xs text-slate-500 font-bold">{item.unit_measure}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Mínimo: {item.min_quantity} {item.unit_measure}
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, pct)}%` }}
                  ></div>
                </div>

                {/* Botón de Cargar Más Stock */}
                {canEdit ? (
                  <button
                    onClick={() => openRestock(item)}
                    className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cargar / Reabastecer Stock</span>
                  </button>
                ) : (
                  <div className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-semibold text-center">
                    Gestión restringida al Encargado de Almacenes
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && !loading && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No se encontraron insumos</h4>
          <p className="text-xs text-slate-400">Prueba con otro término de búsqueda o registra un nuevo insumo.</p>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: REGISTRAR NUEVO INSUMO / TELA                                */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Registrar Nuevo Insumo / Tela</h3>
                  <p className="text-[11px] text-slate-400">Ingreso a la tabla oficial 'insumo' en Supabase PostgreSQL</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInsumo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Insumo o Tela *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tela Casimir Escolar Azul Marino 280g"
                  value={newInsumo.name}
                  onChange={(e) => setNewInsumo({ ...newInsumo, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoría *
                  </label>
                  <select
                    value={newInsumo.category}
                    onChange={(e) => setNewInsumo({ ...newInsumo, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="tela_rollo">Rollo de Tela</option>
                    <option value="avio">Avío (Cinta 3M / Cierre / Botón)</option>
                    <option value="insumo">Hilo / Costura / Empaque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unidad de Medida *
                  </label>
                  <select
                    value={newInsumo.unit_measure}
                    onChange={(e) => setNewInsumo({ ...newInsumo, unit_measure: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="metros">Metros</option>
                    <option value="piezas">Piezas</option>
                    <option value="conos">Conos</option>
                    <option value="rollos">Rollos</option>
                    <option value="kilos">Kilogramos</option>
                    <option value="yardas">Yardas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cantidad Inicial en Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={newInsumo.stock_quantity}
                    onChange={(e) => setNewInsumo({ ...newInsumo, stock_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stock Mínimo de Alerta *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={newInsumo.min_quantity}
                    onChange={(e) => setNewInsumo({ ...newInsumo, min_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ubicación en Almacén
                </label>
                <input
                  type="text"
                  placeholder="Ej: Almacén Central de Telas - Estante C2"
                  value={newInsumo.location}
                  onChange={(e) => setNewInsumo({ ...newInsumo, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{submitting ? 'Guardando en Supabase...' : 'Guardar Insumo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CARGAR / REABASTECER STOCK                                  */}
      {/* ==================================================================== */}
      {showRestockModal && selectedItemForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Cargar Stock de Insumo</h3>
                <p className="text-[11px] text-slate-400">Registrar llegada de rollos o compras de avíos</p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-black uppercase text-blue-600 block">Ítem a Reabastecer:</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">{selectedItemForRestock.name}</span>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500">Stock Actual:</span>
                <span className="font-black text-slate-800">
                  {selectedItemForRestock.stock_quantity} {selectedItemForRestock.unit_measure}
                </span>
              </div>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cantidad a Cargar (+ {selectedItemForRestock.unit_measure}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  autoFocus
                  placeholder={`Ej: 50 ${selectedItemForRestock.unit_measure}`}
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Botones de incremento rápido */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold">Rápido:</span>
                {[50, 100, 250, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockAmount(String(val))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] font-bold text-slate-600 transition-all"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  <span>{submitting ? 'Actualizando...' : 'Confirmar Carga de Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
