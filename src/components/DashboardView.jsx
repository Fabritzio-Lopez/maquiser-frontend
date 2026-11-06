import React, { useEffect, useState } from 'react'
import {
  TrendingUp, Factory, Package, Users, AlertTriangle,
  ArrowUpRight, Clock, CheckCircle2, DollarSign, Scissors
} from 'lucide-react'

export default function DashboardView({ apiUrl, setActiveTab }) {
  const [kpis, setKpis] = useState({
    total_sales_bs: 76800.0,
    active_production_orders: 3,
    low_stock_alerts: 1,
    total_partners: 5,
    total_products_stock: 317,
  })

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/dashboard/kpis`)
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(() => {})
  }, [apiUrl])

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Panel de Control Ejecutivo • Maquiser SRL
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Visión General del Negocio Textil</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoreo en tiempo real de ventas a colegios, producción en taller y stock de materias primas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ver Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Factory className="w-4 h-4" />
            <span>Taller Textil</span>
          </button>
        </div>
      </div>

      {/* 4 Tarjetas de Métricas Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Ventas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
              +18.4% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Ventas Contratadas</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            Bs. {Number(kpis.total_sales_bs).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Colegios y empresas industriales</p>
        </div>

        {/* KPI 2: Órdenes en Confección */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Factory className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              En Taller
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Órdenes en Producción</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{kpis.active_production_orders} Lotes</h3>
          <p className="text-[11px] text-slate-500 mt-1">Corte, costura y bordado activo</p>
        </div>

        {/* KPI 3: Alertas de Stock */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Atención
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Alerta Materia Prima</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{kpis.low_stock_alerts} Telas Críticas</h3>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Popelina Oxford por debajo del mín.</p>
        </div>

        {/* KPI 4: Clientes e Instituciones */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Activos
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Instituciones Aliadas</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{kpis.total_partners} Clientes</h3>
          <p className="text-[11px] text-slate-500 mt-1">Colegios y mineras en convenio</p>
        </div>
      </div>

      {/* Resumen Operativo: Producción y Ventas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estado del Taller Textil */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Avance de Lotes en Confección</h3>
              <p className="text-xs text-slate-500">Etapas del flujo textil de Maquiser SRL</p>
            </div>
            <button onClick={() => setActiveTab('production')} className="text-xs font-bold text-blue-600 hover:underline">
              Ver Tablero Kanban →
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { code: 'OP-2026-101', product: '120 Uniformes Colegio Alemán', stage: 'Corte de Tela', pct: 25, color: 'bg-blue-600' },
              { code: 'OP-2026-102', product: '200 Overoles Minera San Cristóbal', stage: 'Confección y Costura', pct: 60, color: 'bg-amber-500' },
              { code: 'OP-2026-103', product: '150 Camisas Colegio San Agustín', stage: 'Bordado Computarizado', pct: 85, color: 'bg-purple-600' },
              { code: 'OP-2026-104', product: '90 Chalecos Constructora Boliviana', stage: 'Control Calidad / Listo', pct: 100, color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-900">{item.code}</span>
                    <span className="text-xs font-medium text-slate-600">• {item.product}</span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600">{item.stage}</span>
                </div>
                {/* Barra de progreso */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Almacén y Suministros */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Estado de Telas e Insumos</h3>
              <button onClick={() => setActiveTab('inventory')} className="text-xs font-bold text-blue-600 hover:underline">
                Inventario →
              </button>
            </div>
            <p className="text-xs text-slate-500">Disponibilidad en almacén de Quillacollo</p>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Gabardina Sarga 65/35 (Azul Marino)</span>
                  <span className="text-[11px] text-emerald-700">850 metros disponibles • Stock óptimo</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Ripstop Ignífugo 290g (Naranja)</span>
                  <span className="text-[11px] text-emerald-700">420 metros disponibles • Para overoles</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Popelina Oxford Blanca 125g</span>
                  <span className="text-[11px] text-amber-700 font-semibold">95 metros restantes • Requiere compra</span>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 mt-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Automatización Cloud ERP</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sincronización activa con PostgreSQL en Supabase. Los pedidos confirmados reservan rollos de tela y generan la orden de corte automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
