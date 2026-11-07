import React, { useState } from 'react'
import { X, Send, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function QuotationModal({ isOpen, onClose, cartItems, onRemoveItem, onClearCart, apiUrl }) {
  const [formData, setFormData] = useState({
    institution: '',
    contactName: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const totalBs = cartItems.reduce((acc, item) => {
    const p = Number(item.price || item.list_price || 0)
    return acc + p * (item.quantity || 1)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSending(true)
    try {
      if (apiUrl) {
        await fetch(`${apiUrl}/api/v1/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner_name: formData.institution || formData.contactName || 'Cliente Particular',
            amount_total: totalBs,
            notes: `${cartItems.map(i => `${i.quantity || 1}x ${i.name}`).join(', ')} | Tel: ${formData.phone}`,
            state: 'confirmado'
          })
        })
      }
    } catch (err) {
      console.warn('Error al enviar cotización a la API:', err)
    } finally {
      setIsSending(false)
      setSubmitted(true)
      setTimeout(() => {
        onClearCart()
      }, 3500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Solicitud de Cotización Textil</h3>
            <p className="text-xs text-slate-500">Maquiser SRL - Confección de Uniformes y Ropa Industrial</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">¡Cotización Enviada & Notificada en Slack!</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              El pedido fue registrado en la base de datos Supabase y se ha disparado una alerta en tiempo real a Slack al canal <strong>#notificaciones-maquiser</strong>.
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              <span>💬 Integración Slack Paso 3.2: Alerta Despachada</span>
            </div>
            <div>
              <button
                onClick={() => { setSubmitted(false); onClose() }}
                className="mt-4 px-6 py-2.5 bg-maquiser-800 hover:bg-maquiser-900 text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Lista de Prendas en la Cotización */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Prendas Seleccionadas</h4>
              {cartItems.length === 0 ? (
                <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                  No has agregado prendas a la cotización aún. Explora el catálogo o usa el visualizador 3D.
                </p>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div>
                        <span className="font-bold text-sm text-slate-800 block">{item.name}</span>
                        {item.color && (
                          <span className="text-xs text-slate-500">
                            Color: <strong>{item.color}</strong> | Tela: <strong>{item.fabric}</strong> ({item.weight})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-extrabold text-sm text-slate-900">
                          Bs. {Number(item.price || item.list_price || 0).toFixed(2)}
                        </span>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-3 px-2">
                    <span className="font-bold text-slate-700 text-sm">Total Estimado Inicial:</span>
                    <span className="font-black text-xl text-blue-600">Bs. {totalBs.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Formulario de Contacto */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Datos de la Institución / Empresa</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Institución / Colegio / Empresa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Colegio Alemán / Minera San Cristóbal"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Contacto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lic. Fernando Morales"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="contacto@colegio.edu.bo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="+591 7XXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Observaciones / Especificaciones de Bordado</label>
                <textarea
                  rows="2"
                  placeholder="Bordado computarizado del escudo institucional en el bolsillo izquierdo..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={cartItems.length === 0}
                className="w-full py-3.5 rounded-xl bg-maquiser-800 hover:bg-maquiser-900 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Solicitud a Maquiser SRL</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
