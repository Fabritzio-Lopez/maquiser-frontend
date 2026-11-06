import React, { useState } from 'react'
import {
  Scissors, Box, Layers, ShieldCheck, Database,
  TrendingUp, Factory, Package, Users, BarChart3, Menu, X
} from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, backendStatus, cartCount, onOpenCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'sales', label: 'Ventas', icon: TrendingUp },
    { id: 'production', label: 'Taller MRP', icon: Factory },
    { id: 'catalog', label: 'Catálogo', icon: Layers },
    { id: 'customizer', label: 'Visor 3D', icon: Box, badge: 'GLB' },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'partners', label: 'Colegios', icon: Users },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-900 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900">MAQUISER</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">ERP</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cloud ERP Textil</p>
            </div>
          </div>

          {/* Navegación de Escritorio */}
          <nav className="hidden xl:flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Estado de Supabase & Botón Cotización */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500 font-medium">Supabase:</span>
              <span className={`inline-block w-2 h-2 rounded-full ${backendStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-bold text-slate-800">{backendStatus ? 'Conectado' : 'Local'}</span>
            </div>

            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Cotizador</span>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Botón de Menú Móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
