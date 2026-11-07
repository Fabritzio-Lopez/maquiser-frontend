import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  Store, Eye, Compass, ShoppingBag, Check, RotateCcw,
  Sparkles, ArrowRight, Layers, ZoomIn, Info, ShieldCheck,
  ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react'

// Colores disponibles para teñir las prendas en los maniquíes de la tienda
const COLOR_PRESETS = [
  { name: 'Azul Marino Escolar', hex: '#16284f', class: 'bg-[#16284f]' },
  { name: 'Blanco Institucional', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Industrial', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Quirúrgico / Petróleo', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña Escolar', hex: '#701a2d', class: 'bg-rose-950' },
  { name: 'Negro Ejecutivo', hex: '#090d16', class: 'bg-slate-950' },
]

// Tipos de tejido textil
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina Sarga 65/35', desc: 'Resistente a lavados continuos para colegios', weight: '245 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón Peinado', desc: 'Trama suave para camisería ejecutiva', weight: '125 g/m²' },
  { id: 'ripstop', name: 'Ripstop Ignífugo / Antidesgarro', desc: 'Tejido reforzado para trabajo en mina', weight: '290 g/m²' },
]

// Secciones de la Tienda Virtual 3D
const STORE_SECTIONS = [
  {
    id: 'overview',
    title: 'Vista Panorámica Tienda',
    subtitle: 'Showroom Principal Maquiser SRL',
    camPos: new THREE.Vector3(0, 1.8, 5.2),
    camLook: new THREE.Vector3(0, 1.1, -1.0),
  },
  {
    id: 'escolar',
    title: 'Isla de Uniformes Escolares',
    subtitle: 'Blazer, Corbata y Ficha Sastre 2026',
    modelKey: 'uniforme',
    modelPath: '/models/jacket.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/faizan8684/PowerAppsMR/master/jacket.glb',
    podiumPos: new THREE.Vector3(-3.2, 0, -1.2),
    camPos: new THREE.Vector3(-3.2, 1.4, 1.0),
    camLook: new THREE.Vector3(-3.2, 1.3, -1.2),
    price: 145.0,
  },
  {
    id: 'industrial',
    title: 'Isla de Seguridad Industrial',
    subtitle: 'Overol con Cintas 3M Scotchlite',
    modelKey: 'overol',
    modelPath: '/models/hoodie.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/utku6161-tr/proplus-3d-hoodie/main/public/hoodie.glb',
    podiumPos: new THREE.Vector3(0, 0, -2.5),
    camPos: new THREE.Vector3(0, 1.5, -0.4),
    camLook: new THREE.Vector3(0, 1.4, -2.5),
    price: 195.0,
  },
  {
    id: 'camiseria',
    title: 'Isla de Camisería Oxford',
    subtitle: 'Confección Fina y Botones de Nácar',
    modelKey: 'camisa',
    modelPath: '/models/shirt.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/adrianhajdin/project_threejs_ai/main/client/public/shirt_baked.glb',
    podiumPos: new THREE.Vector3(3.2, 0, -1.2),
    camPos: new THREE.Vector3(3.2, 1.4, 1.0),
    camLook: new THREE.Vector3(3.2, 1.3, -1.2),
    price: 85.0,
  },
]

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  // Referencias de cámara cinemática
  const targetCamPosRef = useRef(STORE_SECTIONS[0].camPos.clone())
  const targetLookAtRef = useRef(STORE_SECTIONS[0].camLook.clone())
  const currentLookAtRef = useRef(STORE_SECTIONS[0].camLook.clone())

  // Referencias a los modelos 3D en la tienda
  const mannequinMeshesRef = useRef({ uniforme: null, overol: null, camisa: null })

  // Estados de la tienda
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [loading, setLoading] = useState(true)
  const [autoRotateMannequin, setAutoRotateMannequin] = useState(true)
  const autoRotateRef = useRef(true)

  // ============================================================================
  // CONSTRUCCIÓN DE LA TIENDA VIRTUAL 3D (ARQUITECTURA + LUCES + PODIOS)
  // ============================================================================
  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    // 1. Escena
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x0f172a) // Tono oscuro boutique de showroom
    scene.fog = new THREE.FogExp2(0x0f172a, 0.04)

    // 2. Cámara de recorrido en la tienda
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.copy(targetCamPosRef.current)
    cameraRef.current = camera

    // 3. Renderizador con sombras y tone mapping cinematográfico
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // 4. Iluminación Arquitectónica de Boutique
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    // Luz cenital general
    const centerSpot = new THREE.SpotLight(0xffffff, 2.5, 20, Math.PI / 4, 0.5)
    centerSpot.position.set(0, 5, 2)
    centerSpot.castShadow = true
    scene.add(centerSpot)

    // Luces dirigidas individuales a cada maniquí de estante
    function addSpotlight(x, z, color = 0xffffff) {
      const spot = new THREE.SpotLight(color, 3.2, 12, Math.PI / 6, 0.4)
      spot.position.set(x, 4.2, z + 1.2)
      spot.target.position.set(x, 1.2, z)
      spot.castShadow = true
      scene.add(spot)
      scene.add(spot.target)

      // Carcasa del foco en el techo
      const lampGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.22, 16)
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      const lamp = new THREE.Mesh(lampGeo, lampMat)
      lamp.position.set(x, 4.1, z + 1.2)
      lamp.rotation.x = Math.PI / 6
      scene.add(lamp)
    }

    addSpotlight(-3.2, -1.2, 0xbfdbfe) // Foco azul suave sobre escolares
    addSpotlight(0, -2.5, 0xfef08a)    // Foco cálido sobre industriales
    addSpotlight(3.2, -1.2, 0xffffff)  // Foco blanco puro sobre camisería

    // ==========================================================================
    // ARQUITECTURA DE LA BOUTIQUE: SUELO DE MADERA, PAREDES Y LETREROS
    // ==========================================================================
    // Suelo de parquet oscuro pulido con reflejos suaves
    const floorGeo = new THREE.PlaneGeometry(16, 16)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.15,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.add(floor)

    // Líneas de baldosas / juntas de madera en el suelo
    const gridHelper = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b)
    gridHelper.position.y = 0.005
    scene.add(gridHelper)

    // Pared de fondo del showroom con listones arquitectónicos
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(16, 4.5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    )
    backWall.position.set(0, 2.25, -5.5)
    scene.add(backWall)

    // Cartel Neón / Retroiluminado de Maquiser SRL en la pared
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 1.0, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 })
    )
    signBoard.position.set(0, 3.2, -5.35)
    scene.add(signBoard)

    // Texto luminoso del cartel mediante canvas
    const signCanvas = document.createElement('canvas')
    signCanvas.width = 1024
    signCanvas.height = 256
    const sCtx = signCanvas.getContext('2d')
    sCtx.fillStyle = '#0f172a'
    sCtx.fillRect(0, 0, 1024, 256)
    sCtx.strokeStyle = '#3b82f6'
    sCtx.lineWidth = 6
    sCtx.strokeRect(10, 10, 1004, 236)
    sCtx.fillStyle = '#ffffff'
    sCtx.font = 'bold 72px sans-serif'
    sCtx.textAlign = 'center'
    sCtx.fillText('MAQUISER SRL', 512, 110)
    sCtx.fillStyle = '#f59e0b'
    sCtx.font = 'bold 36px sans-serif'
    sCtx.fillText('TIENDA VIRTUAL & CONFECCIÓN TEXTIL 3D', 512, 180)

    const signTexture = new THREE.CanvasTexture(signCanvas)
    const signScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(5.0, 0.95),
      new THREE.MeshBasicMaterial({ map: signTexture })
    )
    signScreen.position.set(0, 3.2, -5.29)
    scene.add(signScreen)

    // Paredes laterales
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 4.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    )
    leftWall.position.set(-8, 2.25, 0)
    scene.add(leftWall)

    const rightWall = leftWall.clone()
    rightWall.position.set(8, 2.25, 0)
    scene.add(rightWall)

    // Techo industrial con vigas metálicas oscuras
    for (let z = -5; z <= 5; z += 2.5) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.15, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
      )
      beam.position.set(0, 4.4, z)
      scene.add(beam)
    }

    // ==========================================================================
    // PODIOS DE EXHIBICIÓN DE MANIQUÍES (3 ESTANTES PRINCIPALES)
    // ==========================================================================
    function createDisplayPodium(x, z, labelText, tagColor) {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      // Base circular iluminada
      const baseGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.18, 36)
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.8 })
      const base = new THREE.Mesh(baseGeo, baseMat)
      base.position.y = 0.09
      base.receiveShadow = true
      group.add(base)

      // Anillo de luz LED en el borde del podio
      const ringGeo = new THREE.TorusGeometry(0.86, 0.025, 16, 40)
      const ringMat = new THREE.MeshBasicMaterial({ color: tagColor })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.18
      group.add(ring)

      // Placa frontal con el nombre de la sección
      const plateGeo = new THREE.BoxGeometry(1.0, 0.18, 0.05)
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      const plate = new THREE.Mesh(plateGeo, plateMat)
      plate.position.set(0, 0.10, 0.92)
      group.add(plate)

      // Poste de maniquí de sastre
      const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.y = 0.7
      pole.castShadow = true
      group.add(pole)

      scene.add(group)
      return group
    }

    createDisplayPodium(-3.2, -1.2, 'LÍNEA ESCOLAR', 0x3b82f6)
    createDisplayPodium(0, -2.5, 'SEGURIDAD INDUSTRIAL', 0xf59e0b)
    createDisplayPodium(3.2, -1.2, 'CAMISERÍA OXFORD', 0x10b981)

    // ==========================================================================
    // DECORACIÓN SHOWROOM: PLANTAS MINIMALISTAS Y MUEBLE CREDENZA
    // ==========================================================================
    function addPlant(x, z) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.18, 0.45, 20),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
      )
      pot.position.set(x, 0.225, z)
      scene.add(pot)

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 })
      )
      stem.position.set(x, 0.7, z)
      scene.add(stem)

      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4 })
        )
        leaf.scale.set(1.4, 0.3, 0.8)
        leaf.position.set(x + Math.sin(i * 1.3) * 0.18, 0.7 + i * 0.14, z + Math.cos(i * 1.3) * 0.18)
        scene.add(leaf)
      }
    }

    addPlant(-6.5, -4.5)
    addPlant(6.5, -4.5)

    // ==========================================================================
    // CARGA DE LOS 3 MODELOS GLB EN SUS RESPECTIVOS ESTANTES
    // ==========================================================================
    const loader = new GLTFLoader()

    function loadGarmentToPodium(sectionKey, posX, posZ, scaleMul, offsetY) {
      const section = STORE_SECTIONS.find(s => s.id === sectionKey)
      if (!section) return

      const holder = new THREE.Group()
      holder.position.set(posX, 0.85 + offsetY, posZ)
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
            const scale = scaleMul / maxDim

            root.scale.setScalar(scale)
            root.position.x = -center.x * scale
            root.position.y = -center.y * scale
            root.position.z = -center.z * scale

            root.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                  child.material = child.material.clone()
                  child.material.color = new THREE.Color(
                    sectionKey === 'escolar' ? '#16284f' :
                    sectionKey === 'industrial' ? '#334155' : '#f8fafc'
                  )
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
            console.warn(`Fallback al modelo CDN de ${sectionKey}...`)
            if (!isFallback && section.fallbackUrl) {
              load(section.fallbackUrl, true)
            }
          }
        )
      }

      load(section.modelPath)
    }

    loadGarmentToPodium('escolar', -3.2, -1.2, 1.85, 0.2)
    loadGarmentToPodium('industrial', 0, -2.5, 1.95, 0.3)
    loadGarmentToPodium('camiseria', 3.2, -1.2, 2.05, 0.25)

    // ==========================================================================
    // CONTROLES DE MOVIMIENTO: ARRASTRE DE RATÓN Y RUEDA DE ZOOM
    // ==========================================================================
    let isDragging = false
    let prevMousePos = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y

      // Si está enfocado en una prenda, gira el maniquí
      if (activeSection !== 'overview') {
        const activeModel = STORE_SECTIONS.find(s => s.id === activeSection)
        if (activeModel) {
          const m = mannequinMeshesRef.current[activeModel.modelKey]
          if (m) m.rotation.y += deltaX * 0.015
        }
      } else {
        // En vista panorámica, gira la vista del usuario
        camera.rotation.y -= deltaX * 0.003
        camera.rotation.x -= deltaY * 0.002
      }

      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => { isDragging = false }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.003
      camera.position.z = Math.max(-1.0, Math.min(6.5, camera.position.z))
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })

    // Controles por teclado: Teclas W, A, S, D para caminar por el suelo
    const onKeyDown = (e) => {
      const step = 0.25
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        camera.position.z -= step
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        camera.position.z += step
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        camera.position.x -= step
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        camera.position.x += step
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
    // LOOP DE ANIMACIÓN Y TRANSICIÓN SUAVE DE CÁMARA (CINEMÁTICA LERP)
    // ==========================================================================
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Transición suave de posición de cámara (desplazamiento cinemático)
      camera.position.lerp(targetCamPosRef.current, 0.05)
      currentLookAtRef.current.lerp(targetLookAtRef.current, 0.05)
      camera.lookAt(currentLookAtRef.current)

      // Giro suave automático de los maniquíes
      if (autoRotateRef.current) {
        Object.values(mannequinMeshesRef.current).forEach((m) => {
          if (m) m.rotation.y += 0.006
        })
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', handleResize)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [])

  // ============================================================================
  // VIAJE DE CÁMARA A UNA SECCIÓN DE LA TIENDA
  // ============================================================================
  const travelToSection = (sectionId) => {
    setActiveSection(sectionId)
    const section = STORE_SECTIONS.find(s => s.id === sectionId)
    if (section) {
      targetCamPosRef.current.copy(section.camPos)
      targetLookAtRef.current.copy(section.camLook)
    }
  }

  // ============================================================================
  // TEÑIDO DE COLOR EN TIEMPO REAL DEL MANIQUÍ EN LA TIENDA
  // ============================================================================
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

  const toggleAutoRotate = () => {
    const next = !autoRotateMannequin
    setAutoRotateMannequin(next)
    autoRotateRef.current = next
  }

  const handleAddToCart = () => {
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || section.id === 'overview') return

    const item = {
      name: `${section.title} (Seleccionado en Tienda 3D)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: section.price || 145.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  const currentSectionData = STORE_SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
      {/* LADO IZQUIERDO: SHOWROOM VIRTUAL 3D (ESPACIO ARQUITECTÓNICO) */}
      <div className="lg:col-span-8 relative bg-slate-950 flex flex-col justify-between p-6 select-none overflow-hidden min-h-[500px]">
        {/* Barra Superior de la Tienda */}
        <div className="flex justify-between items-center z-20 gap-2 flex-wrap">
          <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700 shadow-sm text-xs font-black text-white">
            <Store className="w-4 h-4 text-blue-400" />
            <span>Tienda Virtual 3D • Flagship Store Maquiser SRL</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoRotate}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-all ${
                autoRotateMannequin
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotateMannequin ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span>{autoRotateMannequin ? 'Giro de Maniquíes: Activo' : 'Giro: Pausado'}</span>
            </button>
          </div>
        </div>

        {/* Canvas de Three.js */}
        <div className="relative flex-1 flex items-center justify-center my-2">
          <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <span className="text-xs font-black text-white">Abriendo Tienda Virtual 3D...</span>
              <span className="text-[11px] text-slate-400 mt-1">Cargando escaparates, iluminación y maniquíes</span>
            </div>
          )}
        </div>

        {/* Selector Rápido de Estantes / Teletransporte en la Tienda */}
        <div className="z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl overflow-x-auto max-w-full">
            {STORE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => travelToSection(sec.id)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
                  activeSection === sec.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-semibold text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Usa <strong>WASD</strong> o arrastra con el ratón para caminar</span>
          </div>
        </div>
      </div>

      {/* LADO DERECHO: PANEL DE DETALLE DE LA PRENDA SELECCIONADA */}
      <div className="lg:col-span-4 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          {/* Título de la sección activa */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {activeSection === 'overview' ? 'Vista Panorámica' : 'Prenda en Escaparate'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Calidad Showroom HD
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-2">{currentSectionData.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{currentSectionData.subtitle}</p>
          </div>

          {activeSection === 'overview' ? (
            /* Vista General: Guía de la Tienda */
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Bienvenido a la Tienda Virtual de Maquiser
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Navega libremente por nuestro showroom virtual. Haz clic en los botones de abajo o acércate a los maniquíes para inspeccionar cada línea de confección textil:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => travelToSection('escolar')}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">1. Estante Escolar</span>
                    <span className="text-[11px] text-slate-500">Uniformes colegiales, blazers y corbatas</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>

                <button
                  onClick={() => travelToSection('industrial')}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">2. Estante Industrial</span>
                    <span className="text-[11px] text-slate-500">Overoles ignífugos con reflectivos 3M</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>

                <button
                  onClick={() => travelToSection('camiseria')}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">3. Estante Camisería</span>
                    <span className="text-[11px] text-slate-500">Camisas Oxford para instituciones</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Prenda Específica: Selector de Color y Tela */
            <div className="space-y-5">
              {/* Selector de Color en Tiempo Real en la Tienda */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Color de la Prenda en Tienda
                  </label>
                  <span className="text-xs font-bold text-blue-600">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => handleColorChange(col)}
                      className={`w-9 h-9 rounded-xl ${col.class} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                        selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : ''
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
                  Tejido Técnico Disponible
                </label>
                <div className="space-y-2">
                  {FABRIC_TYPES.map((fab) => (
                    <div
                      key={fab.id}
                      onClick={() => setSelectedFabric(fab)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedFabric.id === fab.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm'
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

        {/* Pie de Panel: Precio y Cotizar */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          {activeSection !== 'overview' ? (
            <>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Precio por Unidad:</span>
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Confección a medida garantizada</span>
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
                  title="Volver a ver toda la tienda"
                >
                  <Store className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir a Cotización</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => travelToSection('escolar')}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
            >
              <span>Explorar Estante de Uniformes Escolares</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
