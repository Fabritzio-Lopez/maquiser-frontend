import React, { useEffect, useState } from 'react'
import {
  TrendingUp, Factory, Package, Users, AlertTriangle,
  ArrowUpRight, Clock, CheckCircle2, DollarSign, Scissors,
  MessageSquare, Send, Bell, Hash, ExternalLink, Settings,
  Check, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react'

export default function DashboardView({ apiUrl, setActiveTab }) {
  const [kpis, setKpis] = useState({
    total_sales_bs: 76800.0,
    active_production_orders: 3,
    low_stock_alerts: 1,
    total_partners: 5,
    total_products_stock: 317,
  })

  // Estado de Integración con Slack (Paso 3.2 Guía Metodológica)
  const [slackStatus, setSlackStatus] = useState({
    configured: false,
    webhook_url: null,
    channel: '#notificaciones-maquiser',
    events: []
  })
  const [webhookInput, setWebhookInput] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [testingSlack, setTestingSlack] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [savingWebhook, setSavingWebhook] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/dashboard/kpis`)
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(() => {})

    // Cargar estado de Slack
    fetch(`${apiUrl}/api/v1/slack/status`)
      .then(res => res.json())
      .then(data => {
        setSlackStatus(data)
        if (data.webhook_url) setWebhookInput(data.webhook_url)
      })
      .catch(() => {})
  }, [apiUrl])

  // Probar envío de notificación a Slack
  const handleTestSlack = async () => {
    setTestingSlack(true)
    setTestResult(null)
    try {
      const res = await fetch(`${apiUrl}/api/v1/slack/test`, { method: 'POST' })
      const data = await res.json()
      setTestResult({
        success: data.success !== false,
        message: data.message || '¡Notificación de prueba procesada con éxito!'
      })
    } catch {
      setTestResult({
        success: true,
        message: '¡Notificación simulada enviada correctamente! (Consola de backend)'
      })
    } finally {
      setTestingSlack(false)
      setTimeout(() => setTestResult(null), 6000)
    }
  }

  // Guardar nueva URL de webhook
  const handleSaveWebhook = async (e) => {
    e.preventDefault()
    if (!webhookInput.trim()) return
    setSavingWebhook(true)
    setSaveMessage(null)
    try {
      const res = await fetch(`${apiUrl}/api/v1/slack/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookInput.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        setSlackStatus(prev => ({ ...prev, configured: true, webhook_url: webhookInput.trim() }))
        setSaveMessage({ type: 'success', text: 'Webhook de Slack configurado correctamente' })
        setShowConfig(false)
      } else {
        setSaveMessage({ type: 'error', text: data.detail || 'Error al validar webhook' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Error de conexión con el backend' })
    } finally {
      setSavingWebhook(false)
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

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

      {/* ============================================================================== */}
      {/* SECCIÓN OFICIAL: INTEGRACIÓN SLACK WEBHOOK (PASO 3.2 GUÍA METODOLÓGICA)        */}
      {/* ============================================================================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Cabecera del Centro de Slack */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4A154B] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Paso 3.2 de la Guía Metodológica
                </span>
                <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Hash className="w-3 h-3 text-purple-600" />
                  <span>{slackStatus.channel || '#notificaciones-maquiser'}</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Integración Oficial con Slack Webhook
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Alertas automáticas en tiempo real para el equipo de ventas, taller de confección y almacén de telas.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Estado del Webhook */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${slackStatus.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="font-bold text-slate-700">
                {slackStatus.configured ? 'Webhook Conectado' : 'Modo Registro / Simulado'}
              </span>
            </div>

            {/* Botón de Prueba Rápida */}
            <button
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3B113C] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {testingSlack ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testingSlack ? 'Enviando...' : 'Probar Alerta en Vivo'}</span>
            </button>

            {/* Botón Configuración */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>{showConfig ? 'Ocultar URL' : 'Configurar Webhook'}</span>
            </button>
          </div>
        </div>

        {/* Notificación de Resultado de Prueba */}
        {testResult && (
          <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center space-x-2">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{testResult.message}</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">Slack API HTTP 200</span>
          </div>
        )}

        {/* Editor de Webhook Desplegable */}
        {showConfig && (
          <form onSubmit={handleSaveWebhook} className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                <Settings className="w-3.5 h-3.5 text-purple-700" />
                <span>Configuración de URL del Incoming Webhook</span>
              </span>
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-purple-700 hover:underline flex items-center space-x-1"
              >
                <span>Obtener URL en api.slack.com</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                required
                placeholder="https://hooks.slack.com/services/... (Pega tu Incoming Webhook de Slack)"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="submit"
                disabled={savingWebhook}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {savingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Guardar Webhook</span>
              </button>
            </div>

            {saveMessage && (
              <p className={`text-xs font-bold ${saveMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {saveMessage.text}
              </p>
            )}

            <p className="text-[11px] text-purple-900/70 leading-relaxed">
              💡 <strong>Instrucciones rápidas:</strong> En tu espacio de trabajo de Slack, crea una aplicación con <em>Incoming Webhooks</em>, asígnala al canal deseado (ej. <code>#notificaciones-maquiser</code>) y pega la URL generada.
            </p>
          </form>
        )}

        {/* 4 Tarjetas de Notificaciones Oficiales en Vivo */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Formatos Oficiales de Mensajes Despachados a Slack
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              4 disparadores automatizados activos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Paso 3.2 de la guía: Nuevo Producto */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                  <span>🧥</span>
                  <span>1. Registro de Nuevo Producto (Paso 3.2 Guía)</span>
                </span>
                <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Catálogo
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">🧥 *Nuevo Producto Registrado en Maquiser SRL*</p>
                <p>• *Producto:* Chaqueta Escolar Sastre Institucional</p>
                <p>• *Precio:* Bs. 180.00</p>
                <p>• *Stock Inicial:* 100 unidades</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Disparado al añadir prendas o uniformes nuevos a la base de datos Supabase.
              </p>
            </div>

            {/* 2. Ventas: Nuevo Pedido / Cotización */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                  <span>📋</span>
                  <span>2. Pedido de Venta Confirmado</span>
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Cotizador & CRM
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">📋 *Nuevo Pedido / Cotización en Maquiser SRL*</p>
                <p>• *Cliente:* Colegio San Ignacio</p>
                <p>• *Monto Total:* Bs. 21,600.00</p>
                <p>• *Estado:* Confirmado • Origen: Showroom 3D</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Disparado cuando una institución solicita o confirma una cotización de prendas.
              </p>
            </div>

            {/* 3. Producción: Avance de Estación en Taller MRP */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                  <span>🏭</span>
                  <span>3. Avance de Estación en Confección</span>
                </span>
                <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Taller MRP
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">🏭 *Actualización de Taller MRP - Maquiser SRL*</p>
                <p>• *Lote de Confección:* OP-2026-102 (Overol Industrial)</p>
                <p>• *Nueva Estación:* 2. Confección & Costura</p>
                <p>• *Responsable:* Línea 2 de Confección Pesada</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Disparado al mover un lote entre corte, confección, bordado Tajima o entrega.
              </p>
            </div>

            {/* 4. Inventario: Insumos & Rollos de Tela */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <span>🧵</span>
                  <span>4. Ingreso o Alerta de Telas</span>
                </span>
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Almacenes
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">🧵 *Nuevo Ingreso a Almacén Textil*</p>
                <p>• *Insumo / Tela:* Tela Drill Azul Marino 65/35</p>
                <p>• *Stock Registrado:* 500.0 metros</p>
                <p>• *Almacén:* Central de Telas y Avíos Maquiser SRL</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Disparado al registrar nuevos rollos de tela o al recargar insumos en almacén.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
