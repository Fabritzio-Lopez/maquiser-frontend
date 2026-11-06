import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, CheckCircle2, Clock, Truck, FileText, DollarSign } from 'lucide-react'

export default function SalesView({ apiUrl }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [newOrder, setNewOrder] = useState({ partner_name: '', amount_total: '', notes: '', state: 'confirmado' })

  const fetchOrders = () => {
    setLoading(true)
    fetch(`${apiUrl}/api/v1/sales`)
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [apiUrl])

  const handleCreateOrder = (e) => {
    e.preventDefault()
    fetch(`${apiUrl}/api/v1/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_name: newOrder.partner_name,
        amount_total: parseFloat(newOrder.amount_total) || 0,
        notes: newOrder.notes,
        state: newOrder.state
      })
    })
      .then(res => res.json())
      .then(created => {
        setOrders([created, ...orders])
        setShowModal(false)
        setNewOrder({ partner_name: '', amount_total: '', notes: '', state: 'confirmado' })
      })
      .catch(err => alert('Error al crear pedido: ' + err.message))
  }

  const handleUpdateStatus = (orderId, newState) => {
    fetch(`${apiUrl}/api/v1/sales/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState })
    })
      .then(() => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, state: newState } : o))
      })
      .catch(() => {})
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterState === 'todos' || o.state === filterState
    return matchesSearch && matchesFilter
  })

  const totalAmount = orders.reduce((acc, o) => acc + (Number(o.amount_total) || 0), 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Módulo de Ventas & Cotizaciones
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Gestión de Pedidos a Instituciones</h2>
          <p className="text-xs text-slate-500 mt-1">
            Contratos de provisión de uniformes escolares y ropa industrial para colegios y empresas.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="text-right hidden sm:block mr-2">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Facturado</span>
            <span className="text-xl font-black text-slate-900">
              Bs. {totalAmount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido Institucional</span>
          </button>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colegio o código (PED-)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Pestañas de Estado */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'confirmado', label: 'Confirmados' },
            { id: 'en_produccion', label: 'En Taller' },
            { id: 'entregado', label: 'Entregados' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterState(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterState === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Cargando pedidos de Supabase...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
          No se encontraron pedidos con ese filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    {order.name}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">{order.partner_name}</h4>
                </div>
                <p className="text-xs text-slate-500">{order.notes || 'Sin observaciones de confección'}</p>
              </div>

              <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Monto Contrato</span>
                  <span className="text-base font-black text-slate-900">
                    Bs. {Number(order.amount_total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Badge de estado con acción de avance */}
                <div>
                  {order.state === 'confirmado' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'en_produccion')}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all flex items-center space-x-1.5"
                      title="Enviar a confección"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Confirmado → Enviar a Taller</span>
                    </button>
                  )}

                  {order.state === 'en_produccion' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'entregado')}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all flex items-center space-x-1.5"
                      title="Marcar como entregado al colegio"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>En Taller → Despachar</span>
                    </button>
                  )}

                  {order.state === 'entregado' && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Entregado / Conforme</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear Nuevo Pedido */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900">Registrar Contrato de Venta</h3>
            <p className="text-xs text-slate-500 mt-1">Genera un nuevo pedido institucional en Supabase.</p>

            <form onSubmit={handleCreateOrder} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Institución / Colegio / Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Colegio Anglo Americano"
                  value={newOrder.partner_name}
                  onChange={(e) => setNewOrder({ ...newOrder, partner_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monto Total del Contrato (Bs.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="15000.00"
                  value={newOrder.amount_total}
                  onChange={(e) => setNewOrder({ ...newOrder, amount_total: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detalle de Prendas & Bordado</label>
                <textarea
                  rows="2"
                  placeholder="100 chompas escolares, 100 faldas con tablas, bordado computarizado de escudo..."
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Registrar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
