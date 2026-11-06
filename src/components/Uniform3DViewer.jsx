import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  RotateCcw, Sparkles, Check, ShoppingBag, Eye,
  Layers, Shield, ZoomIn, Box, Sparkle, Camera
} from 'lucide-react'

// Colores oficiales de confección para uniformes escolares e indumentaria industrial
const COLOR_PRESETS = [
  { name: 'Azul Marino Escolar', hex: '#16284f', class: 'bg-[#16284f]' },
  { name: 'Blanco Institucional', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Industrial', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Quirúrgico / Petróleo', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña Escolar', hex: '#701a2d', class: 'bg-rose-950' },
  { name: 'Negro Ejecutivo', hex: '#090d16', class: 'bg-slate-950' },
]

// Tipos de tejido textil técnico
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina Sarga 65/35', desc: 'Sarga diagonal pesada antiarrugas para colegios', weight: '245 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón Peinado', desc: 'Trama fina mercerizada ultra suave para camisas', weight: '125 g/m²' },
  { id: 'ripstop', name: 'Ripstop Ignífugo / Antidesgarro', desc: 'Cuadrícula técnica antidesgarro con hilos reforzados', weight: '290 g/m²' },
]

// Escudos y emblemas institucionales
const CREST_PRESETS = [
  { id: 'escolar', name: 'Escudo Escolar Tradicional', color: '#f59e0b', text: 'MAQUISER' },
  { id: 'industrial', name: 'Emblema Seguridad Minera/Industrial', color: '#dc2626', text: 'SEGURIDAD' },
  { id: 'corporativo', name: 'Monograma Ejecutivo', color: '#2563eb', text: 'M' },
]

export default function Uniform3DViewer({ onAddCustomToCart }) {
  // Estado de personalización textil
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [garmentType, setGarmentType] = useState('uniforme') // 'uniforme' | 'overol' | 'camisa'
  const [selectedCrest, setSelectedCrest] = useState(CREST_PRESETS[0])

  // Modos de visualización: 'photoreal' (Showroom HD ultra-realista) | 'three' (Malla 3D WebGL)
  const [visualMode, setVisualMode] = useState('photoreal')

  // Ángulo de visión y rotación
  const [angleIndex, setAngleIndex] = useState(0) // 0: frente, 1: 45° perfil, 2: espalda, 3: zoom bordado
  const [isRotating, setIsRotating] = useState(false)
  const isRotatingRef = useRef(false)

  // Referencias Three.js
  const mountRef = useRef(null)
  const masterGroupRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  // Ángulos disponibles
  const angles = [
    { id: 'front', label: 'Frente' },
    { id: 'profile', label: 'Perfil 45°' },
    { id: 'back', label: 'Espalda' },
    { id: 'detail', label: 'Detalle Confección' },
  ]

  // ============================================================================
  // CONTROL DE GIRO AUTOMÁTICO (FUNCIONAL Y SIN CIERRES ROTOS)
  // ============================================================================
  const toggleRotation = () => {
    const nextState = !isRotating
    setIsRotating(nextState)
    isRotatingRef.current = nextState
  }

  // Auto-rotación en modo Foto-realista HD
  useEffect(() => {
    if (!isRotating || visualMode !== 'photoreal') return

    const timer = setInterval(() => {
      setAngleIndex((prev) => (prev + 1) % 3) // Alterna entre frente, 45° y espalda
    }, 2800)

    return () => clearInterval(timer)
  }, [isRotating, visualMode])

  // ============================================================================
  // MOTOR THREE.JS (MODO 3D WEBGL)
  // ============================================================================
  useEffect(() => {
    if (visualMode !== 'three') return
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100)
    camera.position.set(0, 0.1, 4.2)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // Luces de estudio
    scene.add(new THREE.AmbientLight(0xffffff, 1.4))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 7, 5)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 1.0)
    fillLight.position.set(-5, 2, 3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xfef08a, 1.2)
    rimLight.position.set(0, 5, -4)
    scene.add(rimLight)

    // Grupo contenedor 3D
    const masterGroup = new THREE.Group()
    scene.add(masterGroup)
    masterGroupRef.current = masterGroup

    buildThreeJSMesh(masterGroup, garmentType, selectedColor.hex, selectedFabric.id)

    // Arrastre con ratón en 3D
    let isDragging = false
    let prevMousePos = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }
    const onMouseMove = (e) => {
      if (!isDragging || !masterGroup) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y
      masterGroup.rotation.y += deltaX * 0.008
      masterGroup.rotation.x += deltaY * 0.003
      masterGroup.rotation.x = Math.max(-0.25, Math.min(0.25, masterGroup.rotation.x))
      prevMousePos = { x: e.clientX, y: e.clientY }
    }
    const onMouseUp = () => { isDragging = false }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Loop de animación con referencia actualizada
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (isRotatingRef.current && !isDragging && masterGroup) {
        masterGroup.rotation.y += 0.005
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [visualMode])

  // Actualizar malla Three.js al cambiar selecciones
  useEffect(() => {
    if (visualMode === 'three' && masterGroupRef.current) {
      buildThreeJSMesh(masterGroupRef.current, garmentType, selectedColor.hex, selectedFabric.id)
    }
  }, [visualMode, garmentType, selectedColor, selectedFabric])

  // Construcción de la malla Three.js
  function buildThreeJSMesh(group, type, hexColor, fabricId) {
    while (group.children.length > 0) {
      const obj = group.children[0]
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
      group.remove(obj)
    }

    const clothMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: 0.82,
      metalness: 0.04,
    })

    const trimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor).clone().multiplyScalar(0.7),
      roughness: 0.85,
    })

    // Torso continuo con caída sastre
    const torsoPoints = [
      new THREE.Vector2(0.22, 0.88),
      new THREE.Vector2(0.38, 0.84),
      new THREE.Vector2(0.56, 0.72),
      new THREE.Vector2(0.54, 0.45),
      new THREE.Vector2(0.48, 0.12),
      new THREE.Vector2(0.45, -0.15),
      new THREE.Vector2(0.50, -0.42),
    ]
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 36)
    const torso = new THREE.Mesh(torsoGeo, clothMat)
    torso.scale.set(1.0, 1.0, 0.62)
    torso.castShadow = true
    group.add(torso)

    // Mangas suaves continuas
    function addSleeve(isRight) {
      const sign = isRight ? 1 : -1
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.54, 0.76, 0),
        new THREE.Vector3(sign * 0.60, 0.42, 0.02),
        new THREE.Vector3(sign * 0.56, 0.10, 0.05),
        new THREE.Vector3(sign * 0.50, -0.22, 0.08),
        new THREE.Vector3(sign * 0.46, -0.46, 0.10),
      ])
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.14, 18, false), clothMat)
      tube.castShadow = true
      group.add(tube)
    }
    addSleeve(false)
    addSleeve(true)

    // Cuello y solapas
    if (type === 'uniforme') {
      const shirtBib = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.55),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
      )
      shirtBib.position.set(0, 0.58, 0.29)
      group.add(shirtBib)

      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.45, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 })
      )
      tie.position.set(0, 0.46, 0.32)
      group.add(tie)
    }
  }

  const handleAddToCart = () => {
    const item = {
      name: `${garmentType === 'uniforme' ? 'Uniforme Escolar Completo' : garmentType === 'overol' ? 'Overol de Seguridad Industrial 3M' : 'Camisa Institucional de Vestir'} (Confección Maquiser)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      crest: selectedCrest.name,
      price: garmentType === 'overol' ? 195.0 : garmentType === 'uniforme' ? 145.0 : 85.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  // ============================================================================
  // RENDERIZADO VISUAL
  // ============================================================================
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
      {/* LADO IZQUIERDO: VISUALIZADOR DE ALTA DEFINICIÓN */}
      <div className="lg:col-span-7 relative bg-gradient-to-b from-slate-100 via-slate-200/80 to-slate-300 flex flex-col justify-between p-6 select-none overflow-hidden">
        {/* Barra superior de controles del visor */}
        <div className="flex justify-between items-center z-20 gap-2 flex-wrap">
          {/* Selector de Motor */}
          <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setVisualMode('photoreal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                visualMode === 'photoreal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confección HD Realista</span>
            </button>

            <button
              onClick={() => setVisualMode('three')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                visualMode === 'three'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Malla 3D WebGL</span>
            </button>
          </div>

          {/* BOTÓN GIRO AUTOMÁTICO (TOTALMENTE FUNCIONAL) */}
          <button
            onClick={toggleRotation}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-all ${
              isRotating
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isRotating ? 'Giro Automático: ACTIVO' : 'Giro: PAUSADO'}</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* ÁREA DE VISUALIZACIÓN PRINCIPAL */}
        {/* ==================================================================== */}
        <div className="relative flex-1 flex items-center justify-center my-4 min-h-[460px]">
          {visualMode === 'photoreal' ? (
            /* VISOR DE CONFECCIÓN FOTOREALISTA DE ALTA COSTURA */
            <div className="relative w-full max-w-[480px] h-full flex items-center justify-center">
              {/* Sombra de estudio en el suelo */}
              <div className="absolute bottom-4 w-72 h-8 bg-slate-900/20 rounded-full blur-xl transform scale-y-50"></div>

              {/* RENDERIZADO VECTORIAL HD DE LA PRENDA REAL CON TEXTURA Y LUCES */}
              <div
                className="relative z-10 w-full transition-transform duration-700 ease-out flex items-center justify-center"
                style={{
                  transform:
                    angleIndex === 1 ? 'perspective(800px) rotateY(-22deg) scale(0.98)' :
                    angleIndex === 2 ? 'perspective(800px) rotateY(180deg) scale(0.98)' :
                    angleIndex === 3 ? 'scale(1.4) translateY(-40px)' : 'scale(1)',
                }}
              >
                {/* SVG PRENDA SEGÚN TIPO */}
                {garmentType === 'uniforme' && (
                  <UniformeEscolarSVG
                    colorHex={selectedColor.hex}
                    fabric={selectedFabric.id}
                    crest={selectedCrest}
                    isBack={angleIndex === 2}
                  />
                )}

                {garmentType === 'overol' && (
                  <OverolIndustrialSVG
                    colorHex={selectedColor.hex}
                    fabric={selectedFabric.id}
                    crest={selectedCrest}
                    isBack={angleIndex === 2}
                  />
                )}

                {garmentType === 'camisa' && (
                  <CamisaInstitucionalSVG
                    colorHex={selectedColor.hex}
                    fabric={selectedFabric.id}
                    crest={selectedCrest}
                    isBack={angleIndex === 2}
                  />
                )}
              </div>
            </div>
          ) : (
            /* CANVAS THREE.JS WEBGL */
            <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
          )}
        </div>

        {/* Barra inferior: Selectores de Ángulo de Estudio */}
        <div className="z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {angles.map((ang, idx) => (
              <button
                key={ang.id}
                onClick={() => {
                  setAngleIndex(idx)
                  setIsRotating(false)
                  isRotatingRef.current = false
                }}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
                  angleIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {ang.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-bold text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Haz clic en los botones para girar la prenda</span>
          </div>
        </div>
      </div>

      {/* LADO DERECHO: PANEL DE CONFIGURACIÓN TEXTIL */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Maquiser SRL • Confección Textil
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Modelo Oficial
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Configurador de Prendas</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Selecciona el tipo de prenda, los tejidos técnicos y el escudo bordado con acabados sastre garantizados.
            </p>
          </div>

          {/* 1. Selección de Prenda */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
              1. Tipo de Prenda
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'uniforme', label: 'Uniforme Escolar', sub: 'Blazer & Corbata' },
                { id: 'overol', label: 'Overol Industrial', sub: '3M Reflectivo' },
                { id: 'camisa', label: 'Camisa / Blusa', sub: 'Cuello & Nácar' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGarmentType(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    garmentType === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-black text-xs block">{t.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Paleta de Color */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                2. Color de Tejido
              </label>
              <span className="text-xs font-black text-blue-600">{selectedColor.name}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => setSelectedColor(col)}
                  className={`w-10 h-10 rounded-2xl ${col.class} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                    selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-md' : ''
                  }`}
                  title={col.name}
                >
                  {selectedColor.hex === col.hex && (
                    <Check className={`w-4 h-4 ${col.hex === '#f8fafc' ? 'text-slate-800' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Escudo Bordado (Solo si es uniforme) */}
          {garmentType === 'uniforme' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  3. Escudo / Bordado Institucional
                </label>
                <span className="text-[11px] font-bold text-amber-600">Bordado Computarizado</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CREST_PRESETS.map((crest) => (
                  <button
                    key={crest.id}
                    onClick={() => setSelectedCrest(crest)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      selectedCrest.id === crest.id
                        ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {crest.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Tejido Técnico */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
              {garmentType === 'uniforme' ? '4.' : '3.'} Tejido Técnico & Gramaje
            </label>
            <div className="space-y-2">
              {FABRIC_TYPES.map((fab) => (
                <div
                  key={fab.id}
                  onClick={() => setSelectedFabric(fab)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedFabric.id === fab.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">{fab.name}</span>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      {fab.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{fab.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de Precio y Botón Cotizar */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Cotización Unitaria:</span>
              <span className="text-[11px] text-emerald-600 font-bold">✓ Incluye bordado institucional</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                Bs. {garmentType === 'overol' ? '195.00' : garmentType === 'uniforme' ? '145.00' : '85.00'}
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-sm shadow-xl active:scale-98 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Añadir Esta Prenda a la Cotización</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// COMPONENTES VECTORIALES HD DE PRENDAS REALES (SOMBRAS, PLIEGUES Y BORDADOS)
// ==============================================================================

function UniformeEscolarSVG({ colorHex, fabric, crest, isBack }) {
  return (
    <svg viewBox="0 0 400 480" className="w-full h-auto max-h-[460px] drop-shadow-2xl">
      <defs>
        {/* Degradado de luz cenital de estudio */}
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>

        {/* Sombra de solapas */}
        <filter id="shadowFilter" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
        </filter>

        {/* Textura sarga gabardina */}
        <pattern id="twillPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#000000" strokeWidth="0.8" opacity="0.12" />
        </pattern>
      </defs>

      {/* CUELLO DE MANIQUÍ INTERIOR */}
      <path d="M 160 50 Q 200 65 240 50 L 240 75 Q 200 90 160 75 Z" fill="#1e293b" />
      <text x="200" y="70" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">MAQUISER SRL</text>

      {!isBack ? (
        /* VISTA FRONTAL COMPLETA DE BLAZER SASTRE ESCOLAR */
        <g>
          {/* CAMISA BLANCA INTERIOR CON CUELLO */}
          <polygon points="165,70 235,70 200,165" fill="#f8fafc" />
          {/* Cuello de camisa plegado */}
          <polygon points="160,70 185,100 200,75" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <polygon points="240,70 215,100 200,75" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

          {/* CORBATA ESCOLAR INSTITUCIONAL */}
          <polygon points="194,76 206,76 208,94 192,94" fill="#701a2d" stroke="#4c0519" strokeWidth="0.5" />
          <polygon points="192,94 208,94 212,185 200,205 188,185" fill="#881337" />
          {/* Rayas doradas finas en la corbata */}
          <line x1="192" y1="120" x2="208" y2="130" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="190" y1="150" x2="210" y2="160" stroke="#f59e0b" strokeWidth="2.5" />

          {/* CUERPO DEL BLAZER / CHAQUETA */}
          {/* Torso entallado */}
          <path
            d="M 130 90 C 85 105 75 140 68 200 C 60 270 55 350 75 370 C 85 380 100 375 105 345 C 115 285 125 220 135 180 L 135 390 C 135 410 265 410 265 390 L 265 180 C 275 220 285 285 295 345 C 300 375 315 380 325 370 C 345 350 340 270 332 200 C 325 140 315 105 270 90 C 245 80 230 75 200 85 C 170 75 155 80 130 90 Z"
            fill={colorHex}
          />
          {/* Capa de textura de tejido */}
          <path
            d="M 130 90 C 85 105 75 140 68 200 C 60 270 55 350 75 370 C 85 380 100 375 105 345 C 115 285 125 220 135 180 L 135 390 C 135 410 265 410 265 390 L 265 180 C 275 220 285 285 295 345 C 300 375 315 380 325 370 C 345 350 340 270 332 200 C 325 140 315 105 270 90 C 245 80 230 75 200 85 C 170 75 155 80 130 90 Z"
            fill="url(#twillPattern)"
          />
          {/* Capa de degradado y sombras */}
          <path
            d="M 130 90 C 85 105 75 140 68 200 C 60 270 55 350 75 370 C 85 380 100 375 105 345 C 115 285 125 220 135 180 L 135 390 C 135 410 265 410 265 390 L 265 180 C 275 220 285 285 295 345 C 300 375 315 380 325 370 C 345 350 340 270 332 200 C 325 140 315 105 270 90 C 245 80 230 75 200 85 C 170 75 155 80 130 90 Z"
            fill="url(#bodyGrad)"
          />

          {/* SOLAPAS DE SASTRE EN V CON CAÍDA REAL (LAPELS) */}
          {/* Solapa izquierda */}
          <path
            d="M 155 85 L 142 165 L 175 185 L 160 255 L 200 285 L 200 235 L 180 155 Z"
            fill={colorHex}
            filter="url(#shadowFilter)"
          />
          <path
            d="M 155 85 L 142 165 L 175 185 L 160 255 L 200 285 L 200 235 L 180 155 Z"
            fill="url(#bodyGrad)"
          />
          {/* Pespunte sastre en solapa */}
          <path
            d="M 153 88 L 140 165 L 172 183 L 158 253 L 198 282"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeDasharray="2,2"
            opacity="0.5"
          />

          {/* Solapa derecha */}
          <path
            d="M 245 85 L 258 165 L 225 185 L 240 255 L 200 285 L 200 235 L 220 155 Z"
            fill={colorHex}
            filter="url(#shadowFilter)"
          />
          <path
            d="M 245 85 L 258 165 L 225 185 L 240 255 L 200 285 L 200 235 L 220 155 Z"
            fill="url(#bodyGrad)"
          />
          <path
            d="M 247 88 L 260 165 L 228 183 L 242 253 L 202 282"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeDasharray="2,2"
            opacity="0.5"
          />

          {/* BOLSILLO SUPERIOR IZQUIERDO CON CARTERA */}
          <rect x="145" y="180" width="36" height="5" rx="1.5" fill="#0f172a" opacity="0.4" />

          {/* ESCUDO BORDADO INSTITUCIONAL REALISTA */}
          <g transform="translate(145, 192)">
            {/* Silueta de escudo con borde bordado dorado */}
            <path d="M 0 0 L 36 0 L 36 24 C 36 38 18 46 18 46 C 18 46 0 38 0 24 Z" fill="#0f172a" />
            <path d="M 2 2 L 34 2 L 34 23 C 34 35 18 43 18 43 C 18 43 2 35 2 23 Z" fill={crest.color || '#f59e0b'} />
            <path d="M 4 4 L 32 4 L 32 22 C 32 33 18 40 18 40 C 18 43 4 33 4 22 Z" fill="#1e293b" />
            <text x="18" y="16" fill="#f59e0b" fontSize="6.5" fontWeight="black" textAnchor="middle">★ M ★</text>
            <text x="18" y="27" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle">{crest.text || 'COLEGIO'}</text>
          </g>

          {/* BOLSILLOS INFERIORES DE CARTERA */}
          <rect x="140" y="315" width="45" height="12" rx="3" fill="#0f172a" opacity="0.3" />
          <rect x="140" y="313" width="45" height="10" rx="2" fill={colorHex} filter="url(#shadowFilter)" />
          <rect x="140" y="313" width="45" height="10" rx="2" fill="url(#bodyGrad)" />

          <rect x="215" y="315" width="45" height="12" rx="3" fill="#0f172a" opacity="0.3" />
          <rect x="215" y="313" width="45" height="10" rx="2" fill={colorHex} filter="url(#shadowFilter)" />
          <rect x="215" y="313" width="45" height="10" rx="2" fill="url(#bodyGrad)" />

          {/* LÍNEA DE CRUCE CENTRAL Y BOTONES METÁLICOS */}
          <line x1="200" y1="285" x2="200" y2="400" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
          {/* Botones de latón dorados de 4 orificios */}
          {[300, 345].map((y, i) => (
            <g key={i}>
              <circle cx="200" cy={y} r="5" fill="#f59e0b" filter="url(#shadowFilter)" />
              <circle cx="200" cy={y} r="4" fill="#d97706" />
              <circle cx="198.5" cy={y - 1.5} r="0.7" fill="#000000" />
              <circle cx="201.5" cy={y - 1.5} r="0.7" fill="#000000" />
              <circle cx="198.5" cy={y + 1.5} r="0.7" fill="#000000" />
              <circle cx="201.5" cy={y + 1.5} r="0.7" fill="#000000" />
            </g>
          ))}

          {/* BOTONES EN LOS PUÑOS DE MANGA */}
          {[345, 352, 359].map((y, i) => (
            <g key={i}>
              <circle cx="95" cy={y} r="2" fill="#d97706" />
              <circle cx="305" cy={y} r="2" fill="#d97706" />
            </g>
          ))}
        </g>
      ) : (
        /* VISTA POSTERIOR (ESPALDA SASTRE CON COSTURAS FRANCESAS) */
        <g>
          <path
            d="M 130 90 C 85 105 75 140 68 200 C 60 270 55 350 75 370 C 85 380 100 375 105 345 C 115 285 125 220 135 180 L 135 390 C 135 410 265 410 265 390 L 265 180 C 275 220 285 285 295 345 C 300 375 315 380 325 370 C 345 350 340 270 332 200 C 325 140 315 105 270 90 Z"
            fill={colorHex}
          />
          <path
            d="M 130 90 C 85 105 75 140 68 200 C 60 270 55 350 75 370 C 85 380 100 375 105 345 C 115 285 125 220 135 180 L 135 390 C 135 410 265 410 265 390 L 265 180 C 275 220 285 285 295 345 C 300 375 315 380 325 370 C 345 350 340 270 332 200 C 325 140 315 105 270 90 Z"
            fill="url(#bodyGrad)"
          />
          {/* Canesú y costura central de espalda */}
          <line x1="140" y1="140" x2="260" y2="140" stroke="#000000" strokeWidth="1" opacity="0.3" />
          <line x1="200" y1="140" x2="200" y2="380" stroke="#000000" strokeWidth="1.5" opacity="0.35" />
          {/* Abertura central inferior sastre */}
          <polygon points="198,360 202,360 205,405 195,405" fill="#0f172a" opacity="0.4" />
        </g>
      )}
    </svg>
  )
}

function OverolIndustrialSVG({ colorHex, fabric, crest, isBack }) {
  return (
    <svg viewBox="0 0 400 480" className="w-full h-auto max-h-[460px] drop-shadow-2xl">
      <defs>
        <linearGradient id="bodyGradOverol" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>

        {/* Cinta reflectiva microprismática 3M plata */}
        <linearGradient id="reflective3M" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <pattern id="ripstopPattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="none" stroke="#000000" strokeWidth="0.6" opacity="0.15" />
        </pattern>
      </defs>

      {/* CUELLO DE MANIQUÍ INTERIOR */}
      <path d="M 160 30 Q 200 45 240 30 L 240 55 Q 200 70 160 55 Z" fill="#0f172a" />

      {/* CUERPO COMPLETO DEL OVEROL INDUSTRIAL CON PERNERAS */}
      <path
        d="M 140 60 L 75 140 C 65 200 60 270 70 330 C 78 350 92 350 98 325 L 125 210 L 130 310 L 130 460 C 130 470 185 470 185 460 L 195 320 L 205 320 L 215 460 C 215 470 270 470 270 460 L 270 310 L 275 210 L 302 325 C 308 350 322 350 330 330 C 340 270 335 200 325 140 L 260 60 C 235 50 215 48 200 50 C 185 48 165 50 140 60 Z"
        fill={colorHex}
      />
      <path
        d="M 140 60 L 75 140 C 65 200 60 270 70 330 C 78 350 92 350 98 325 L 125 210 L 130 310 L 130 460 C 130 470 185 470 185 460 L 195 320 L 205 320 L 215 460 C 215 470 270 470 270 460 L 270 310 L 275 210 L 302 325 C 308 350 322 350 330 330 C 340 270 335 200 325 140 L 260 60 C 235 50 215 48 200 50 C 185 48 165 50 140 60 Z"
        fill="url(#ripstopPattern)"
      />
      <path
        d="M 140 60 L 75 140 C 65 200 60 270 70 330 C 78 350 92 350 98 325 L 125 210 L 130 310 L 130 460 C 130 470 185 470 185 460 L 195 320 L 205 320 L 215 460 C 215 470 270 470 270 460 L 270 310 L 275 210 L 302 325 C 308 350 322 350 330 330 C 340 270 335 200 325 140 L 260 60 C 235 50 215 48 200 50 C 185 48 165 50 140 60 Z"
        fill="url(#bodyGradOverol)"
      />

      {/* CUELLO ALTO MAO DE SEGURIDAD */}
      <path d="M 160 50 Q 200 65 240 50 L 240 75 Q 200 90 160 75 Z" fill={colorHex} stroke="#000000" strokeWidth="1" />
      <path d="M 160 50 Q 200 65 240 50 L 240 75 Q 200 90 160 75 Z" fill="url(#bodyGradOverol)" />

      {/* CINTAS REFLECTIVAS DE ALTA VISIBILIDAD 3M EN EL PECHO */}
      {/* Base amarilla flúor */}
      <rect x="127" y="160" width="146" height="16" fill="#eab308" />
      {/* Cinta reflectiva plata central */}
      <rect x="127" y="163" width="146" height="10" fill="url(#reflective3M)" stroke="#94a3b8" strokeWidth="0.5" />

      {/* CINTAS REFLECTIVAS EN LOS BRAZOS */}
      <rect x="68" y="220" width="35" height="14" fill="#eab308" transform="rotate(18, 68, 220)" />
      <rect x="68" y="222" width="35" height="9" fill="url(#reflective3M)" transform="rotate(18, 68, 220)" />

      <rect x="296" y="230" width="35" height="14" fill="#eab308" transform="rotate(-18, 296, 230)" />
      <rect x="296" y="232" width="35" height="9" fill="url(#reflective3M)" transform="rotate(-18, 296, 230)" />

      {/* CINTURÓN ELÁSTICO CON HEBILLA O VELCRO */}
      <rect x="128" y="250" width="144" height="15" fill="#0f172a" opacity="0.35" />
      <rect x="190" y="247" width="20" height="21" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

      {!isBack && (
        <g>
          {/* CREMALLERA FRONTAL REFORZADA CON TAPETA */}
          <line x1="200" y1="75" x2="200" y2="250" stroke="#000000" strokeWidth="6" opacity="0.3" />
          <line x1="200" y1="75" x2="200" y2="250" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="2,1" />
          {/* Tirador metálico YKK */}
          <rect x="197" y="80" width="6" height="14" rx="1.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />

          {/* BOLSILLOS DE PECHO CARGO INDUSTRIAL */}
          <rect x="140" y="105" width="42" height="40" rx="3" fill="#0f172a" opacity="0.25" />
          <rect x="140" y="105" width="42" height="12" rx="2" fill="#0f172a" opacity="0.4" />
          <rect x="218" y="105" width="42" height="40" rx="3" fill="#0f172a" opacity="0.25" />
          <rect x="218" y="105" width="42" height="12" rx="2" fill="#0f172a" opacity="0.4" />

          {/* LOGO DE SEGURIDAD INDUSTRIAL EN EL PECHO */}
          <g transform="translate(144, 118)">
            <rect x="0" y="0" width="34" height="22" rx="2" fill="#0f172a" />
            <text x="17" y="11" fill="#eab308" fontSize="7" fontWeight="black" textAnchor="middle">SAFETY</text>
            <text x="17" y="18" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">MAQUISER</text>
          </g>

          {/* RODILLERAS REFORZADAS DE DOBLE TEJIDO */}
          <rect x="135" y="340" width="45" height="45" rx="5" fill="#0f172a" opacity="0.3" />
          <rect x="137" y="342" width="41" height="41" rx="4" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.4" />

          <rect x="220" y="340" width="45" height="45" rx="5" fill="#0f172a" opacity="0.3" />
          <rect x="222" y="342" width="41" height="41" rx="4" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.4" />

          {/* CINTAS REFLECTIVAS EN LAS PERNERAS */}
          <rect x="130" y="410" width="55" height="14" fill="#eab308" />
          <rect x="130" y="412" width="55" height="9" fill="url(#reflective3M)" />

          <rect x="215" y="410" width="55" height="14" fill="#eab308" />
          <rect x="215" y="412" width="55" height="9" fill="url(#reflective3M)" />
        </g>
      )}
    </svg>
  )
}

function CamisaInstitucionalSVG({ colorHex, fabric, crest, isBack }) {
  return (
    <svg viewBox="0 0 400 480" className="w-full h-auto max-h-[460px] drop-shadow-2xl">
      <defs>
        <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>

        <pattern id="poplinPattern" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="none" stroke="#000000" strokeWidth="0.4" opacity="0.08" />
        </pattern>
      </defs>

      {/* CUELLO INTERIOR */}
      <path d="M 160 50 Q 200 65 240 50 L 240 75 Q 200 90 160 75 Z" fill="#1e293b" />
      <text x="200" y="70" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">MAQUISER POPELINA</text>

      {/* CUERPO DE LA CAMISA CON CORTE ENTALLADO */}
      <path
        d="M 130 85 C 80 100 75 140 68 200 C 60 270 55 345 75 365 C 85 375 98 370 105 345 C 115 285 125 215 135 175 L 135 390 C 135 410 170 415 200 415 C 230 415 265 410 265 390 L 265 175 C 275 215 285 285 295 345 C 300 370 315 375 325 365 C 345 345 340 270 332 200 C 325 140 320 100 270 85 C 245 75 225 72 200 75 C 175 72 155 75 130 85 Z"
        fill={colorHex}
      />
      <path
        d="M 130 85 C 80 100 75 140 68 200 C 60 270 55 345 75 365 C 85 375 98 370 105 345 C 115 285 125 215 135 175 L 135 390 C 135 410 170 415 200 415 C 230 415 265 410 265 390 L 265 175 C 275 215 285 285 295 345 C 300 370 315 375 325 365 C 345 345 340 270 332 200 C 325 140 320 100 270 85 C 245 75 225 72 200 75 C 175 72 155 75 130 85 Z"
        fill="url(#poplinPattern)"
      />
      <path
        d="M 130 85 C 80 100 75 140 68 200 C 60 270 55 345 75 365 C 85 375 98 370 105 345 C 115 285 125 215 135 175 L 135 390 C 135 410 170 415 200 415 C 230 415 265 410 265 390 L 265 175 C 275 215 285 285 295 345 C 300 370 315 375 325 365 C 345 345 340 270 332 200 C 325 140 320 100 270 85 C 245 75 225 72 200 75 C 175 72 155 75 130 85 Z"
        fill="url(#shirtGrad)"
      />

      {!isBack && (
        <g>
          {/* TAPETA CENTRAL FRANCESA DE 3.5CM */}
          <rect x="192" y="75" width="16" height="340" fill={colorHex} filter="url(#shadowFilter)" />
          <rect x="192" y="75" width="16" height="340" fill="url(#shirtGrad)" />
          {/* Doble pespunte fino de camisa */}
          <line x1="194" y1="75" x2="194" y2="415" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,1" opacity="0.4" />
          <line x1="206" y1="75" x2="206" y2="415" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,1" opacity="0.4" />

          {/* 6 BOTONES DE NÁCAR FINOS CON OJALES */}
          {[100, 150, 200, 250, 300, 350].map((y, i) => (
            <g key={i}>
              <ellipse cx="200" cy={y} rx="4.5" ry="4.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
              <circle cx="198.5" cy={y} r="0.6" fill="#64748b" />
              <circle cx="201.5" cy={y} r="0.6" fill="#64748b" />
            </g>
          ))}

          {/* CUELLO CAMISERO CLÁSICO ESTRUCTURADO CON PUNTAS DOBLADAS */}
          <polygon points="160,70 190,118 200,82 170,72" fill={colorHex} filter="url(#shadowFilter)" />
          <polygon points="160,70 190,118 200,82 170,72" fill="url(#shirtGrad)" />

          <polygon points="240,70 210,118 200,82 230,72" fill={colorHex} filter="url(#shadowFilter)" />
          <polygon points="240,70 210,118 200,82 230,72" fill="url(#shirtGrad)" />

          {/* BOLSILLO DE CAMISA CON RANURA DE BOLÍGRAFO */}
          <path d="M 145 160 L 180 160 L 180 200 L 162 212 L 145 200 Z" fill="#0f172a" opacity="0.15" />
          <path d="M 145 158 L 180 158 L 180 198 L 162 210 L 145 198 Z" fill={colorHex} stroke="#cbd5e1" strokeWidth="0.5" />
          <path d="M 145 158 L 180 158 L 180 198 L 162 210 L 145 198 Z" fill="url(#shirtGrad)" />
          <line x1="154" y1="158" x2="154" y2="198" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="2,1" opacity="0.4" />

          {/* PUÑOS CAMISEROS CON BOTÓN */}
          <rect x="70" y="340" width="22" height="14" rx="2" fill={colorHex} stroke="#000000" strokeWidth="0.5" />
          <circle cx="81" cy="347" r="2.5" fill="#f8fafc" />

          <rect x="308" y="340" width="22" height="14" rx="2" fill={colorHex} stroke="#000000" strokeWidth="0.5" />
          <circle cx="319" cy="347" r="2.5" fill="#f8fafc" />
        </g>
      )}
    </svg>
  )
}
