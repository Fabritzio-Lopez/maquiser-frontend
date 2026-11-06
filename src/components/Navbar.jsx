import React from 'react'
import { Scissors, Box, Layers, ShieldCheck, Database } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, backendStatus, cartCount, onOpenCart }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-maquiser-800 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">MAQUISER</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">SRL</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Textil ERP & Modelado 3D</p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-maquiser-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Catálogo Textil</span>
            </button>

            <button
              onClick={() => setActiveTab('customizer')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'customizer'
                  ? 'bg-white text-maquiser-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4 text-blue-600" />
              <span>Personalizador 3D</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Three.js</span>
            </button>
          </nav>

          {/* Estado de Supabase & Botón Cotización */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600">Supabase:</span>
              <span className={`inline-block w-2 h-2 rounded-full ${backendStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-semibold text-slate-800">{backendStatus ? 'En línea' : 'Verificando'}</span>
            </div>

            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-4 py-2 rounded-xl bg-maquiser-800 hover:bg-maquiser-900 text-white text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Solicitar Cotización</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
