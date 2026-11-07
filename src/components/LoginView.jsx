import React, { useState } from 'react'
import {
  Scissors, Lock, User, ShieldCheck, Eye, EyeOff,
  ArrowRight, Sparkles, Building2, Factory, Package,
  AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react'

// Los 5 usuarios oficiales solicitados con roles y permisos específicos
export const PRECONFIGURED_USERS = [
  {
    id: 1,
    username: 'fabritzio',
    name: 'Fabritzio López',
    email: 'fabritzio@maquiser.bo',
    password: 'Admin2026!',
    role: 'super_admin',
    role_name: 'Administrador General',
    title: 'Director de Operaciones & Sistemas',
    avatar_color: 'bg-blue-600 text-white',
    avatar_initials: 'FL',
    description: 'Control total de la empresa: acceso a todos los módulos y permisos.',
    modules_summary: 'Todos los 7 módulos (Control Total)',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-200',
    allowed_tabs: ['dashboard', 'sales', 'production', 'catalog', 'customizer', 'inventory', 'partners'],
    can_edit_production: true,
    can_edit_inventory: true,
    can_manage_sales: true,
    can_manage_users: true,
  },
  {
    id: 2,
    username: 'milton',
    name: 'Milton López',
    email: 'milton.gerencia@maquiser.bo',
    password: 'Milton2026!',
    role: 'owner_admin',
    role_name: 'Dueño de la Empresa',
    title: 'Propietario / Gerencia General',
    avatar_color: 'bg-purple-600 text-white',
    avatar_initials: 'ML',
    description: 'Propietario de Maquiser SRL: acceso ejecutivo completo a toda la compañía.',
    modules_summary: 'Todos los 7 módulos (Gerencia & Dueño)',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-200',
    allowed_tabs: ['dashboard', 'sales', 'production', 'catalog', 'customizer', 'inventory', 'partners'],
    can_edit_production: true,
    can_edit_inventory: true,
    can_manage_sales: true,
    can_manage_users: true,
  },
  {
    id: 3,
    username: 'jefe.planta',
    name: 'Carlos Mendoza',
    email: 'produccion@maquiser.bo',
    password: 'Planta2026!',
    role: 'plant_manager',
    role_name: 'Jefe de Planta',
    title: 'Jefe de Producción & Confección',
    avatar_color: 'bg-amber-600 text-white',
    avatar_initials: 'CM',
    description: 'Supervisa el taller textil: Dashboard, actualiza etapas en Kanban y modifica inventario.',
    modules_summary: 'Dashboard • Taller MRP (Editar) • Inventario (Modificar)',
    badge_color: 'bg-amber-100 text-amber-800 border-amber-200',
    allowed_tabs: ['dashboard', 'production', 'inventory'],
    can_edit_production: true,
    can_edit_inventory: true,
    can_manage_sales: false,
    can_manage_users: false,
  },
  {
    id: 4,
    username: 'almacen',
    name: 'Roberto Ramos',
    email: 'almacenes@maquiser.bo',
    password: 'Almacen2026!',
    role: 'warehouse_manager',
    role_name: 'Encargado de Almacenes',
    title: 'Jefe de Almacén & Materias Primas',
    avatar_color: 'bg-emerald-600 text-white',
    avatar_initials: 'RR',
    description: 'Encargado de materias primas: gestiona inventario y supervisa producción en solo lectura.',
    modules_summary: 'Taller MRP (Solo Lectura) • Inventario (Modificar & Cargar)',
    badge_color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    allowed_tabs: ['production', 'inventory'],
    can_edit_production: false, // Solo lectura en producción
    can_edit_inventory: true,  // Modificar y cargar insumos
    can_manage_sales: false,
    can_manage_users: false,
  },
  {
    id: 5,
    username: 'operario',
    name: 'Juan Choque',
    email: 'planta.taller@maquiser.bo',
    password: 'Taller2026!',
    role: 'plant_operator',
    role_name: 'Personal de Planta',
    title: 'Operario de Confección & Bordado',
    avatar_color: 'bg-slate-700 text-white',
    avatar_initials: 'JC',
    description: 'Operario de taller: consulta únicamente el Taller MRP para ver el estado de su trabajo.',
    modules_summary: 'Taller MRP (Solo Lectura de Trabajo)',
    badge_color: 'bg-slate-100 text-slate-800 border-slate-300',
    allowed_tabs: ['production'], // Solo puede ver Taller MRP
    can_edit_production: false,
    can_edit_inventory: false,
    can_manage_sales: false,
    can_manage_users: false,
  },
]

export default function LoginView({ apiUrl, onLogin }) {
  const [username, setUsername] = useState('fabritzio')
  const [password, setPassword] = useState('Admin2026!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPresetUser, setSelectedPresetUser] = useState(PRECONFIGURED_USERS[0])

  // Inicio de sesión manual
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (res.ok) {
        const data = await res.json()
        onLogin(data.user)
      } else {
        // Fallback local con los usuarios preconfigurados si backend está offline
        const matched = PRECONFIGURED_USERS.find(
          u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) &&
               u.password === password
        )
        if (matched) {
          onLogin(matched)
        } else {
          setError('Credenciales incorrectas. Verifique su usuario o contraseña.')
        }
      }
    } catch {
      // Fallback local
      const matched = PRECONFIGURED_USERS.find(
        u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) &&
             u.password === password
      )
      if (matched) {
        onLogin(matched)
      } else {
        setError('Credenciales incorrectas o servidor no disponible.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Selección rápida de usuario preconfigurado
  const handleSelectPreset = (u) => {
    setSelectedPresetUser(u)
    setUsername(u.username)
    setPassword(u.password)
    setError('')
  }

  // Acceso directo con un clic
  const handleDirectLogin = (u) => {
    onLogin(u)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* PANEL IZQUIERDO: FORMULARIO DE INICIO DE SESIÓN */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo y Encabezado */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-900 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                  <Scissors className="w-6 h-6 transform -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-black text-2xl tracking-tight text-slate-900">MAQUISER</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">ERP</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Cloud ERP Textil • Bolivia</p>
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900">Iniciar Sesión</h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tus credenciales o selecciona una de las 5 cuentas preconfiguradas.
              </p>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="fabritzio, milton, jefe.planta..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-500 font-medium">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Recordar sesión</span>
                </label>
                <span className="text-[11px] font-bold text-blue-600">TLS 1.3 Seguro</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xl shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Validando Acceso...' : 'Ingresar al ERP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Maquiser SRL © 2026 • Cochabamba, Bolivia</span>
            <span className="flex items-center space-x-1 font-semibold text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Activo</span>
            </span>
          </div>
        </div>

        {/* PANEL DERECHO: SELECTOR RÁPIDO DE LOS 5 USUARIOS */}
        <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Acceso Rápido • 5 Roles
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">Cuentas Preconfiguradas para Pruebas</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">1-Clic Demo</span>
            </div>

            <p className="text-xs text-slate-500">
              Haz clic en cualquier perfil para iniciar sesión al instante con sus permisos específicos:
            </p>

            {/* Lista de Tarjetas de Usuario */}
            <div className="space-y-2.5">
              {PRECONFIGURED_USERS.map((u) => {
                const isSelected = selectedPresetUser.id === u.id
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectPreset(u)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-500/20'
                        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${u.avatar_color} font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        {u.avatar_initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">{u.name}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${u.badge_color}`}>
                            {u.role_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{u.modules_summary}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDirectLogin(u)
                      }}
                      className="ml-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-[10px] whitespace-nowrap transition-all shadow-sm active:scale-95 flex items-center space-x-1"
                      title={`Entrar como ${u.name}`}
                    >
                      <span>Entrar</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ficha Informativa del Usuario Seleccionado */}
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800">{selectedPresetUser.name}</span>
              <span className="text-[10px] font-mono text-slate-400">pass: {selectedPresetUser.password}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {selectedPresetUser.description}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">Módulos permitidos:</span>
              <span className="text-blue-600">{selectedPresetUser.allowed_tabs.length} de 7</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
