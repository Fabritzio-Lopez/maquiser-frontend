import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Store, Compass, ShoppingBag, Check, RotateCcw,
  Sparkles, ArrowRight, Layers, ZoomIn, ZoomOut,
  Move, Info, ShieldCheck, Eye
} from 'lucide-react'

// Paleta oficial de colores textiles para teñir en vivo
const COLOR_PRESETS = [
  { name: 'Azul Marino Clásico', hex: '#16284f', class: 'bg-[#16284f]' },
  { name: 'Blanco Oxford', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Urbano', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Botella / Militar', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña / Guindo', hex: '#701a2d', class: 'bg-rose-950' },
  { name: 'Negro Azabache', hex: '#090d16', class: 'bg-slate-950' },
]

// Tipos de tejido textil
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina Sarga 65/35', desc: 'Resistente y durable para chaquetas escolares', weight: '245 g/m²' },
  { id: 'algodon_fleece', name: 'Algodón Fleece Frisado', desc: 'Tacto suave y abrigado para canguros', weight: '290 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón Peinado', desc: 'Trama fresca y sedosa para camisería', weight: '125 g/m²' },
]

// Secciones de la Tienda Virtual 3D
const STORE_SECTIONS = [
  {
    id: 'overview',
    title: 'Vista Panorámica',
    subtitle: 'Showroom Principal Maquiser SRL • Cochabamba',
    camPos: new THREE.Vector3(0, 1.9, 5.6),
    camLook: new THREE.Vector3(0, 1.2, -1.0),
  },
  {
    id: 'chaqueta',
    title: 'Chaqueta',
    displayName: 'Chaqueta Escolar / Institucional',
    subtitle: 'Chaqueta sastre con solapas, corte anatómico y forro interno',
    modelKey: 'chaqueta',
    modelPath: '/models/jacket.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/faizan8684/PowerAppsMR/master/jacket.glb',
    podiumPos: new THREE.Vector3(-3.2, 0, -1.2),
    camPos: new THREE.Vector3(-3.2, 1.35, 0.9),
    camLook: new THREE.Vector3(-3.2, 1.25, -1.2),
    price: 180.0,
    scaleMul: 2.05,
    offsetY: 0.25,
    tagColor: 0x2563eb,
  },
  {
    id: 'canguro',
    title: 'Canguro',
    displayName: 'Canguro Deportivo & Urbano',
    subtitle: 'Buzo con capucha, bolsillo canguro frontal y rib elástico reforzado',
    modelKey: 'canguro',
    modelPath: '/models/hoodie.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/utku6161-tr/proplus-3d-hoodie/main/public/hoodie.glb',
    podiumPos: new THREE.Vector3(0, 0, -2.2),
    camPos: new THREE.Vector3(0, 1.35, -0.3),
    camLook: new THREE.Vector3(0, 1.2, -2.2),
    price: 145.0,
    scaleMul: 2.15,
    offsetY: 0.35,
    tagColor: 0xf59e0b,
  },
  {
    id: 'camisa',
    title: 'Camisa',
    displayName: 'Camisa Oxford Clásica',
    subtitle: 'Camisa formal con cuello sastre estructurado y botones de nácar',
    modelKey: 'camisa',
    modelPath: '/models/shirt.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/adrianhajdin/project_threejs_ai/main/client/public/shirt_baked.glb',
    podiumPos: new THREE.Vector3(3.2, 0, -1.2),
    camPos: new THREE.Vector3(3.2, 1.35, 0.9),
    camLook: new THREE.Vector3(3.2, 1.25, -1.2),
    price: 65.0,
    scaleMul: 2.15,
    offsetY: 0.25,
    tagColor: 0x10b981,
  },
]

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)

  // Referencias para transición suave de cámara hacia prendas
  const targetCamPosRef = useRef(STORE_SECTIONS[0].camPos.clone())
  const targetLookAtRef = useRef(STORE_SECTIONS[0].camLook.clone())
  const isTransitioningRef = useRef(false)

  // Referencias a los modelos 3D en los podios
  const mannequinMeshesRef = useRef({ chaqueta: null, canguro: null, camisa: null })

  // Estados de la tienda
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [loading, setLoading] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const autoRotateRef = useRef(true)

  // ============================================================================
  // INICIALIZACIÓN DE LA ESCENA 3D, ORBITCONTROLS Y MODELOS GLB REALES
  // ============================================================================
  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    // 1. Escena limpia, luminosa y moderna (Ambiente Nórdico / Galería Boutique)
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf8fafc)

    // 2. Cámara con profundidad amplia
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.copy(targetCamPosRef.current)
    cameraRef.current = camera

    // 3. Renderizador fotográfico WebGL con Tone Mapping ACESFilmic
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // 4. OrbitControls: Movimiento libre en cualquier ángulo, paneo y zoom infinito
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.copy(targetLookAtRef.current)
    controls.minDistance = 0.5 // Acercamiento máximo para ver texturas de tela
    controls.maxDistance = 14.0 // Alejamiento para ver todo el showroom
    controls.enablePan = true // Clic derecho para desplazar la prenda a gusto
    controls.panSpeed = 0.8
    controls.screenSpacePanning = true
    controls.maxPolarAngle = Math.PI // Permite rotar verticalmente incluso desde arriba o abajo
    controls.minPolarAngle = 0.05
    controlsRef.current = controls

    // Si el usuario empieza a interactuar con el mouse, ceder el control inmediato
    controls.addEventListener('start', () => {
      isTransitioningRef.current = false
    })

    // ==========================================================================
    // ILUMINACIÓN FOTOGRÁFICA NEUTRA 5500K (COLORES REALES SIN DISTORSIÓN)
    // ==========================================================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 8, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0003
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2)
    fillLight.position.set(-5, 6, 3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0)
    rimLight.position.set(0, 5, -5)
    scene.add(rimLight)

    // Focos de techo dirigidos sobre cada podio
    function addSpotlight(x, z) {
      const spot = new THREE.SpotLight(0xffffff, 2.8, 12, Math.PI / 5, 0.4)
      spot.position.set(x, 4.3, z + 1.2)
      spot.target.position.set(x, 1.2, z)
      spot.castShadow = true
      scene.add(spot)
      scene.add(spot.target)

      const lampGeo = new THREE.CylinderGeometry(0.09, 0.14, 0.22, 16)
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      const lamp = new THREE.Mesh(lampGeo, lampMat)
      lamp.position.set(x, 4.25, z + 1.2)
      lamp.rotation.x = Math.PI / 6
      scene.add(lamp)
    }

    addSpotlight(-3.2, -1.2)
    addSpotlight(0, -2.2)
    addSpotlight(3.2, -1.2)

    // ==========================================================================
    // ARQUITECTURA DEL SHOWROOM: SUELO DE ROBLE CLARO Y PAREDES DE GALERÍA
    // ==========================================================================
    const floorGeo = new THREE.PlaneGeometry(18, 18)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdfd7cc, // Tono roble natural escandinavo
      roughness: 0.45,
      metalness: 0.08,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.add(floor)

    const gridHelper = new THREE.GridHelper(18, 18, 0xc8bea8, 0xd0c5b0)
    gridHelper.position.y = 0.005
    scene.add(gridHelper)

    // Pared de fondo con panel arquitectónico
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 4.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 })
    )
    backWall.position.set(0, 2.4, -5.5)
    scene.add(backWall)

    // Listones de madera decorativos
    for (let x = -7.5; x <= 7.5; x += 0.35) {
      if (Math.abs(x) > 3.2) {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 4.6, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.6 })
        )
        slat.position.set(x, 2.4, -5.35)
        scene.add(slat)
      }
    }

    // Letrero Institucional Maquiser SRL
    const signCanvas = document.createElement('canvas')
    signCanvas.width = 1024
    signCanvas.height = 256
    const sCtx = signCanvas.getContext('2d')
    sCtx.fillStyle = '#0f172a'
    sCtx.fillRect(0, 0, 1024, 256)
    sCtx.strokeStyle = '#2563eb'
    sCtx.lineWidth = 6
    sCtx.strokeRect(10, 10, 1004, 236)
    sCtx.fillStyle = '#ffffff'
    sCtx.font = 'bold 74px sans-serif'
    sCtx.textAlign = 'center'
    sCtx.fillText('MAQUISER SRL', 512, 105)
    sCtx.fillStyle = '#f59e0b'
    sCtx.font = 'bold 36px sans-serif'
    sCtx.fillText('SHOWROOM & CONFECCIÓN TEXTIL BOLIVIA', 512, 175)

    const signTexture = new THREE.CanvasTexture(signCanvas)
    const signScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.05),
      new THREE.MeshBasicMaterial({ map: signTexture })
    )
    signScreen.position.set(0, 3.4, -5.31)
    scene.add(signScreen)

    // Podios de exhibición de mármol blanco
    function createMarblePodium(x, z, labelText, tagColor) {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      const baseGeo = new THREE.CylinderGeometry(0.9, 0.98, 0.18, 40)
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
      const base = new THREE.Mesh(baseGeo, baseMat)
      base.position.y = 0.09
      base.receiveShadow = true
      group.add(base)

      const ringGeo = new THREE.TorusGeometry(0.91, 0.02, 16, 40)
      const ringMat = new THREE.MeshStandardMaterial({ color: tagColor || 0xd97706, metalness: 0.8, roughness: 0.2 })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.18
      group.add(ring)

      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.16, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      )
      plate.position.set(0, 0.10, 0.95)
      group.add(plate)

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 })
      )
      pole.position.y = 0.7
      pole.castShadow = true
      group.add(pole)

      scene.add(group)
      return group
    }

    createMarblePodium(-3.2, -1.2, 'CHAQUETA', 0x2563eb)
    createMarblePodium(0, -2.2, 'CANGURO', 0xf59e0b)
    createMarblePodium(3.2, -1.2, 'CAMISA', 0x10b981)

    // ==========================================================================
    // CARGA DE MODELOS 3D GLB REALES EN CADA PODIO
    // ==========================================================================
    const loader = new GLTFLoader()

    function loadModelToPodium(sectionKey) {
      const section = STORE_SECTIONS.find(s => s.id === sectionKey)
      if (!section) return

      const holder = new THREE.Group()
      holder.position.set(section.podiumPos.x, 0.85 + section.offsetY, section.podiumPos.z)
      scene.add(holder)
      mannequinMeshesRef.current[section.modelKey] = holder

      const load = (url, isFallback = false) => {
        loader.load(
          url,
          (gltf) => {
            const root = gltf.scene
            const box = new THREE.Box3().setFromObject(root)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = section.scaleMul / maxDim

            root.scale.setScalar(scale)
            root.position.x = -center.x * scale
            root.position.y = -center.y * scale
            root.position.z = -center.z * scale

            const defaultColor = sectionKey === 'chaqueta' ? '#16284f' :
                                 sectionKey === 'canguro' ? '#334155' : '#f8fafc'

            root.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                  child.material = child.material.clone()
                  child.material.color = new THREE.Color(defaultColor)
                  child.material.roughness = 0.82
                  child.material.metalness = 0.04
                  child.material.needsUpdate = true
                }
              }
            })

            holder.add(root)
            setLoading(false)
          },
          undefined,
          (err) => {
            console.warn(`Fallback al modelo CDN de ${sectionKey}...`, err)
            if (!isFallback && section.fallbackUrl) {
              load(section.fallbackUrl, true)
            }
          }
        )
      }

      load(section.modelPath)
    }

    loadModelToPodium('chaqueta')
    loadModelToPodium('canguro')
    loadModelToPodium('camisa')

    // ==========================================================================
    // CONTROLES DE TECLADO WASD (CAMINAR LIBREMENTE POR LA TIENDA)
    // ==========================================================================
    const onKeyDown = (e) => {
      const step = 0.35
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        camera.position.z -= step
        controls.target.z -= step
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        camera.position.z += step
        controls.target.z += step
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        camera.position.x -= step
        controls.target.x -= step
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        camera.position.x += step
        controls.target.x += step
      }
    }
    window.addEventListener('keydown', onKeyDown)

    const handleResize = () => {
      if (!currentMount) return
      const newW = currentMount.clientWidth
      const newH = currentMount.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    // ==========================================================================
    // LOOP DE ANIMACIÓN FLUIDO CON ORBITCONTROLS + TRANSICIONES SUAVES
    // ==========================================================================
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Transición cinemática cuando el usuario salta a una prenda específica
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08)
        controls.target.lerp(targetLookAtRef.current, 0.08)

        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.02 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.02
        ) {
          camera.position.copy(targetCamPosRef.current)
          controls.target.copy(targetLookAtRef.current)
          isTransitioningRef.current = false
        }
      }

      // Giro suave automático de las prendas
      if (autoRotateRef.current) {
        Object.values(mannequinMeshesRef.current).forEach((m) => {
          if (m) m.rotation.y += 0.006
        })
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // ============================================================================
  // ACCIONES DE CÁMARA Y NAVEGACIÓN
  // ============================================================================
  const travelToSection = (sectionId) => {
    setActiveSection(sectionId)
    const section = STORE_SECTIONS.find(s => s.id === sectionId)
    if (section) {
      targetCamPosRef.current.copy(section.camPos)
      targetLookAtRef.current.copy(section.camLook)
      isTransitioningRef.current = true
    }
  }

  // Controles directos de Zoom In / Zoom Out
  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return
    isTransitioningRef.current = false
    const cam = cameraRef.current
    const target = controlsRef.current.target
    const dir = new THREE.Vector3().subVectors(cam.position, target).normalize()
    const dist = cam.position.distanceTo(target)
    const newDist = Math.max(0.6, Math.min(14.0, dist + delta))
    cam.position.copy(target).addScaledVector(dir, newDist)
    controlsRef.current.update()
  }

  // Vistas preestablecidas para inspeccionar la prenda a gusto
  const setPresetView = (viewType) => {
    if (!cameraRef.current || !controlsRef.current) return
    isTransitioningRef.current = false
    const target = controlsRef.current.target.clone()

    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    const dist = section && section.id !== 'overview' ? 1.6 : 5.0

    if (viewType === 'frente') {
      cameraRef.current.position.set(target.x, target.y + 0.1, target.z + dist)
    } else if (viewType === 'espalda') {
      cameraRef.current.position.set(target.x, target.y + 0.1, target.z - dist)
    } else if (viewType === 'perfil') {
      cameraRef.current.position.set(target.x + dist, target.y + 0.1, target.z)
    } else if (viewType === 'arriba') {
      cameraRef.current.position.set(target.x, target.y + dist, target.z + 0.05)
    } else if (viewType === 'reset') {
      travelToSection(activeSection)
      return
    }

    controlsRef.current.target.copy(target)
    controlsRef.current.update()
  }

  // Cambio de color en vivo sobre la prenda activa
  const handleColorChange = (col) => {
    setSelectedColor(col)
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || !section.modelKey) return

    const holder = mannequinMeshesRef.current[section.modelKey]
    if (holder) {
      holder.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.set(col.hex)
          child.material.needsUpdate = true
        }
      })
    }
  }

  // Toggle del giro automático
  const toggleAutoRotate = () => {
    const next = !autoRotate
    setAutoRotate(next)
    autoRotateRef.current = next
  }

  const handleAddToCart = () => {
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || section.id === 'overview') return

    const item = {
      name: `${section.displayName || section.title} (Personalizado en Showroom 3D)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: section.price || 145.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  const currentSectionData = STORE_SECTIONS.find(s => s.id === activeSection) || STORE_SECTIONS[0]

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
      {/* VISOR 3D INTERACTIVO: GIRAR, MOVER, ACERCAR Y ALEJAR LIBREMENTE */}
      <div className="lg:col-span-8 relative bg-slate-100 flex flex-col justify-between p-5 select-none overflow-hidden min-h-[540px]">
        
        {/* Barra Superior con Selector de Prendas y Auto-Giro */}
        <div className="flex justify-between items-center z-20 gap-2 flex-wrap">
          <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
            {STORE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => travelToSection(sec.id)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${
                  activeSection === sec.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          <button
            onClick={toggleAutoRotate}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-black border shadow-sm transition-all ${
              autoRotate
                ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoRotate ? 'Giro: Activo' : 'Giro: Pausado'}</span>
          </button>
        </div>

        {/* Canvas de Three.js */}
        <div className="relative flex-1 flex items-center justify-center my-2">
          <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <span className="text-xs font-black text-slate-800">Cargando Chaqueta, Canguro y Camisa 3D...</span>
              <span className="text-[11px] text-slate-500 mt-1">Texturas HD de confección e iluminación neutra</span>
            </div>
          )}

          {/* BOTONES FLOTANTES DE CONTROL DE CÁMARA (ZOOM Y ÁNGULOS) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1.5">
            <button
              onClick={() => handleZoom(-0.5)}
              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Acercar Prenda (Zoom +)"
            >
              <ZoomIn className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => handleZoom(0.5)}
              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Alejar Prenda (Zoom -)"
            >
              <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPresetView('reset')}
              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Centrar y Resetear Vista"
            >
              <Move className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* VISTAS PREESTABLECIDAS DE INSPECCIÓN TEXTIL */}
          {activeSection !== 'overview' && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Vistas:</span>
              <button
                onClick={() => setPresetView('frente')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Frente
              </button>
              <button
                onClick={() => setPresetView('espalda')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Espalda
              </button>
              <button
                onClick={() => setPresetView('perfil')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Perfil
              </button>
              <button
                onClick={() => setPresetView('arriba')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Cenital
              </button>
            </div>
          )}
        </div>

        {/* Guía Rápida de Interacción Libre */}
        <div className="z-20 flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] font-semibold text-slate-600 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span><strong>Clic Izquierdo:</strong> Rotar en cualquier ángulo</span>
          </div>
          <div className="flex items-center space-x-2">
            <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
            <span><strong>Rueda:</strong> Acercar / Alejar</span>
          </div>
          <div className="flex items-center space-x-2">
            <Move className="w-3.5 h-3.5 text-blue-600" />
            <span><strong>Clic Derecho:</strong> Mover a gusto</span>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL: SELECCIÓN DE PRENDA, TINTURA EN VIVO Y COTIZACIÓN */}
      <div className="lg:col-span-4 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {activeSection === 'overview' ? 'Showroom General' : currentSectionData.title}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Luz Neutra 5500K
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              {currentSectionData.displayName || currentSectionData.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{currentSectionData.subtitle}</p>
          </div>

          {activeSection === 'overview' ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Prendas en Exhibición Maquiser SRL
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Selecciona una prenda para hacer zoom, moverla en cualquier dirección e inspeccionar los detalles de confección:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => travelToSection('chaqueta')}
                  className="w-full text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center group"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors block">
                      1. Chaqueta Escolar Sastre
                    </span>
                    <span className="text-[11px] text-slate-500">Chaqueta estructurada con solapas</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => travelToSection('canguro')}
                  className="w-full text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-sm transition-all flex justify-between items-center group"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors block">
                      2. Canguro Deportivo & Urbano
                    </span>
                    <span className="text-[11px] text-slate-500">Buzo abrigado con capucha y bolsillo canguro</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => travelToSection('camisa')}
                  className="w-full text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all flex justify-between items-center group"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors block">
                      3. Camisa Oxford Clásica
                    </span>
                    <span className="text-[11px] text-slate-500">Camisería institucional con botones de nácar</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Paleta de Tintura en Vivo */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Color de la Prenda
                  </label>
                  <span className="text-xs font-black text-blue-600">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => handleColorChange(col)}
                      className={`w-9 h-9 rounded-xl ${col.class} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                        selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-md' : ''
                      }`}
                      title={col.name}
                    >
                      {selectedColor.hex === col.hex && (
                        <Check className={`w-3.5 h-3.5 ${col.hex === '#f8fafc' ? 'text-slate-800' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Tejido */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
                  Tejido Técnico Recomendado
                </label>
                <div className="space-y-2">
                  {FABRIC_TYPES.map((fab) => (
                    <div
                      key={fab.id}
                      onClick={() => setSelectedFabric(fab)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedFabric.id === fab.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900">{fab.name}</span>
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {fab.weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fab.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Precio y Añadir a Cotización */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          {activeSection !== 'overview' ? (
            <>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Precio por Unidad:</span>
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Confección y bordado incluido</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    Bs. {Number(currentSectionData.price || 145).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => travelToSection('overview')}
                  className="px-3.5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
                  title="Ver todo el Showroom"
                >
                  <Store className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir {currentSectionData.title} a Cotización</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => travelToSection('canguro')}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
            >
              <span>Inspeccionar Canguro Deportivo 3D</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
