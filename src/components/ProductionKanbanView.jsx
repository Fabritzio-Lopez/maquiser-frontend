import React, { useEffect, useState } from 'react'
import { Scissors, Factory, CheckCircle2, ArrowRight, ShieldCheck, Clock, Users, Eye } from 'lucide-react'

const STAGES = [
  { id: 'corte', title: '1. Corte de Tela', icon: Scissors, color: 'border-blue-500 bg-blue-50 text-blue-700' },
  { id: 'confeccion', title: '2. Confección & Costura', icon: Factory, color: 'border-amber-500 bg-amber-50 text-amber-700' },
  { id: 'bordado', title: '3. Bordado Computarizado', icon: ShieldCheck, color: 'border-purple-500 bg-purple-50 text-purple-700' },
  { id: 'control_calidad', title: '4. Control de Calidad', icon: Clock, color: 'border-rose-500 bg-rose-50 text-rose-700' },
  { id: 'terminado', title: '5. Listo para Entrega', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
]

export default function ProductionKanbanView({ apiUrl, canEdit = true }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProduction = () => {
    setLoading(true)
    fetch(`${apiUrl}/api/v1/production`)
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchProduction()
  }, [apiUrl])

  const handleAdvanceStage = (orderId, currentStage) => {
    if (!canEdit) return
    const stageFlow = ['corte', 'confeccion', 'bordado', 'control_calidad', 'terminado']
    const nextIdx = stageFlow.indexOf(currentStage) + 1
    if (nextIdx < stageFlow.length) {
      const nextStage = stageFlow[nextIdx]
      fetch(`${apiUrl}/api/v1/production/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextStage })
      })
        .then(() => {
          setOrders(orders.map(o => o.id === orderId ? { ...o, state: nextStage } : o))
        })
        .catch(() => {})
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Módulo MRP • Taller de Confección Textil
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Flujo de Producción en Taller</h2>
          <p className="text-xs text-slate-500 mt-1">
            Control de lotes en estaciones de tendido, corte, costura y bordadora Tajima computarizada.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!canEdit && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Modo Consulta (Solo Lectura)</span>
            </div>
          )}
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            Lotes Activos: <strong>{orders.filter(o => o.state !== 'terminado').length}</strong>
          </span>
        </div>
      </div>

      {/* Tablero Kanban de 5 Columnas de Confección */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const StageIcon = stage.icon
          const stageOrders = orders.filter(o => o.state === stage.id)

          return (
            <div key={stage.id} className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 flex flex-col min-h-[500px]">
              {/* Título de Columna */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center space-x-2">
                  <StageIcon className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-black text-slate-900">{stage.title}</h4>
                </div>
                <span className="text-[11px] font-black bg-white px-2 py-0.5 rounded-full text-slate-700 shadow-sm">
                  {stageOrders.length}
                </span>
              </div>

              {/* Tarjetas de Órdenes */}
              <div className="space-y-3 flex-1">
                {stageOrders.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center p-3 text-[11px] text-slate-400 italic border-2 border-dashed border-slate-200 rounded-2xl">
                    Estación disponible
                  </div>
                ) : (
                  stageOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {ord.name}
                          </span>
                          <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            {ord.quantity} unid.
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-2">{ord.product_name}</h5>
                        <p className="text-[11px] text-slate-500 font-medium">{ord.partner_name}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 block mb-2">{ord.responsible}</p>

                        {stage.id !== 'terminado' ? (
                          canEdit ? (
                            <button
                              onClick={() => handleAdvanceStage(ord.id, ord.state)}
                              className="w-full flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-[11px] font-bold transition-all active:scale-95"
                            >
                              <span>Avanzar Etapa</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="w-full py-1.5 px-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-[10px] text-center flex items-center justify-center space-x-1">
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>En estación (Supervisión)</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-center space-x-1 py-1 text-emerald-600 font-black text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completado / Listo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
