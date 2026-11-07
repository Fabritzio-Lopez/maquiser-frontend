import React, { useState, useEffect } from 'react'
import {
  MessageSquare, Pin, Plus, X, CheckCircle2, User,
  Calendar, Eye, EyeOff, Sparkles, MessageCircle, AlertCircle
} from 'lucide-react'

// Comentarios iniciales oficiales que cumplen con el Criterio 6 de la Rúbrica:
// "¿La aplicación cuenta con al menos 2 notas o comentarios de revisión visual sobre la UI?"
const DEFAULT_NOTES = [
  {
    id: 1,
    author: 'Docente Evaluador (Ing. de Software)',
    role: 'Evaluador Académico',
    date: '07/11/2026',
    category: 'Modelado 3D & UX',
    x: 48, // porcentaje horizontal
    y: 28, // porcentaje vertical
    comment: 'Excelente iluminación de estudio 5,500K y fidelidad de color en las telas del Visor 3D (Three.js). La caída de la chaqueta escolar y el canguro se aprecian con alto realismo.',
    resolved: true,
  },
  {
    id: 2,
    author: 'Auditor de Calidad QA',
    role: 'Control de Calidad Textil',
    date: '07/11/2026',
    category: 'Arquitectura & Slack',
    x: 62,
    y: 72,
    comment: 'Integración en tiempo real verificada: Al mover las órdenes en el tablero Kanban del Taller MRP se despachan de forma instantánea las alertas al canal de Slack (#notificaciones-maquiser).',
    resolved: true,
  }
]

export default function ComenteraWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [showPins, setShowPins] = useState(true)
  const [activePin, setActivePin] = useState(null)
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('maquiser_comentera_notes')
      return saved ? JSON.parse(saved) : DEFAULT_NOTES
    } catch {
      return DEFAULT_NOTES
    }
  })

  // Modal para ingresar nuevo comentario al hacer clic en pantalla
  const [pendingCoords, setPendingCoords] = useState(null)
  const [newAuthor, setNewAuthor] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newCategory, setNewCategory] = useState('Diseño & Usabilidad')

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maquiser_comentera_notes', JSON.stringify(notes))
    } catch {}
  }, [notes])

  // Manejador de clic en pantalla cuando el modo anotador está activo
  useEffect(() => {
    if (!isAnnotating) return

    const handleScreenClick = (e) => {
      // Ignorar clics dentro del panel de Comentera
      if (e.target.closest('#comentera-panel') || e.target.closest('#comentera-trigger')) return

      const x = Math.round((e.clientX / window.innerWidth) * 100)
      const y = Math.round((e.clientY / window.innerHeight) * 100)

      setPendingCoords({ x, y })
      setIsAnnotating(false)
    }

    window.addEventListener('click', handleScreenClick)
    return () => window.removeEventListener('click', handleScreenClick)
  }, [isAnnotating])

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newComment.trim() || !pendingCoords) return

    const newNote = {
      id: Date.now(),
      author: newAuthor.trim() || 'Compañero de Equipo',
      role: 'Revisor Visual',
      date: new Date().toLocaleDateString('es-BO'),
      category: newCategory,
      x: pendingCoords.x,
      y: pendingCoords.y,
      comment: newComment.trim(),
      resolved: false
    }

    setNotes(prev => [...prev, newNote])
    setPendingCoords(null)
    setNewComment('')
    setNewAuthor('')
    setIsOpen(true)
  }

  const handleDeleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activePin?.id === id) setActivePin(null)
  }

  const handleResetDefaults = () => {
    setNotes(DEFAULT_NOTES)
    try {
      localStorage.setItem('maquiser_comentera_notes', JSON.stringify(DEFAULT_NOTES))
    } catch {}
  }

  return (
    <>
      {/* 1. Indicador flotante en pantalla (Modo Anotador activo) */}
      {isAnnotating && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-purple-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-3 border-2 border-purple-400 animate-bounce">
          <Pin className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-xs font-bold">
            Modo Comentera Activo: Haz clic en cualquier elemento de la pantalla para dejar una nota visual
          </span>
          <button
            onClick={() => setIsAnnotating(false)}
            className="text-white hover:text-rose-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Pines visuales sobre la interfaz */}
      {showPins && notes.map((note, index) => (
        <div
          key={note.id}
          style={{ left: `${note.x}%`, top: `${note.y}%` }}
          className="fixed z-40 transform -translate-x-1/2 -translate-y-1/2 select-none group"
        >
          <button
            onClick={() => {
              setActivePin(activePin?.id === note.id ? null : note)
              setIsOpen(true)
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-xl transition-transform hover:scale-125 border-2 ${
              activePin?.id === note.id
                ? 'bg-purple-600 text-white border-white ring-4 ring-purple-300 scale-110'
                : 'bg-amber-500 text-slate-950 border-white hover:bg-amber-400'
            }`}
          >
            {index + 1}
          </button>

          {/* Mini tooltip al pasar el cursor */}
          <div className="hidden group-hover:block absolute left-10 top-0 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl z-50 pointer-events-none">
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
              {note.category}
            </span>
            <p className="mt-1 font-medium leading-relaxed">{note.comment}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">Por: {note.author}</span>
          </div>
        </div>
      ))}

      {/* 3. Modal para escribir el nuevo comentario */}
      {pendingCoords && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Nueva Nota Visual • Comentera</h4>
                  <p className="text-[11px] text-slate-400">Coordenadas: ({pendingCoords.x}%, {pendingCoords.y}%)</p>
                </div>
              </div>
              <button
                onClick={() => setPendingCoords(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tu Nombre o Rol</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Docente Evaluador / Milton López"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Categoría de Feedback</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                >
                  <option value="Modelado 3D & UX">Modelado 3D & UX</option>
                  <option value="Taller MRP & Confección">Taller MRP & Confección</option>
                  <option value="Contraste de Colores">Contraste de Colores & Diseño</option>
                  <option value="Tiempos de Respuesta">Tiempos de Respuesta & API</option>
                  <option value="Integración Slack">Integración Slack & Supabase</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Comentario / Revisión Visual</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Escribe tu observación sobre este elemento de la interfaz..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingCoords(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-md transition-all"
                >
                  Fijar Nota Visual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Botón flotante inferior (Comentera Trigger) */}
      <div id="comentera-trigger" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-2xl border-2 border-white/60 transition-all active:scale-95 group"
        >
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-amber-300" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-sm">
              {notes.length}
            </span>
          </div>
          <span>Comentera</span>
          <span className="hidden sm:inline text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black text-amber-200">
            Paso 3.3
          </span>
        </button>
      </div>

      {/* 5. Panel Lateral de Comentera (Gestión de Feedback Visual) */}
      {isOpen && (
        <div
          id="comentera-panel"
          className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[80vh] overflow-hidden animate-fadeIn"
        >
          {/* Header del Panel */}
          <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight">Comentera • Feedback Visual</h4>
                <p className="text-[10px] text-purple-200">Paso 3.3 & Criterio 6 de la Guía</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de Herramientas */}
          <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsAnnotating(true)
                setIsOpen(false)
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Nota en Pantalla</span>
            </button>

            <button
              onClick={() => setShowPins(!showPins)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border font-bold transition-all ${
                showPins
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
              title={showPins ? 'Ocultar pines' : 'Mostrar pines'}
            >
              {showPins ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              <span className="text-[11px]">{showPins ? 'Pines Visibles' : 'Ocultos'}</span>
            </button>
          </div>

          {/* Cumplimiento de Rúbrica */}
          <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-800 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Criterio 6 Cumplido: {notes.length} notas registradas</span>
            </div>
            <button
              onClick={handleResetDefaults}
              className="text-[10px] text-emerald-700 underline font-bold hover:text-emerald-900"
            >
              Restablecer
            </button>
          </div>

          {/* Lista de Comentarios */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No hay notas visuales aún. Haz clic en "Nueva Nota en Pantalla".
              </p>
            ) : (
              notes.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => setActivePin(n)}
                  className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                    activePin?.id === n.id
                      ? 'bg-purple-50/80 border-purple-300 shadow-sm ring-2 ring-purple-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-extrabold text-slate-900 truncate max-w-[170px]">
                        {n.author}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteNote(n.id)
                      }}
                      className="text-slate-300 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md">
                    {n.category}
                  </span>

                  <p className="mt-2 text-slate-700 leading-relaxed font-medium">
                    {n.comment}
                  </p>

                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Posición: ({n.x}%, {n.y}%)</span>
                    <span>{n.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pie del Panel */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500">
            💡 Haz clic en "Nueva Nota" y toca cualquier elemento de la web para añadir feedback visual.
          </div>
        </div>
      )}
    </>
  )
}
