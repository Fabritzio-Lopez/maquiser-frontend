import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  RotateCcw, Sparkles, Check, ShoppingBag, Eye,
  Maximize2, Camera, Upload, Layers, Shield, Sparkle
} from 'lucide-react'

// Colores disponibles oficiales para uniformes escolares y ropa industrial
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

// Insignias / Escudos de bordado predefinidos
const CREST_PRESETS = [
  { id: 'escolar', name: 'Escudo Escolar Dorado', color: '#f59e0b', text: 'MAQUISER' },
  { id: 'industrial', name: 'Emblema Seguridad Industrial', color: '#dc2626', text: 'SAFETY' },
  { id: 'corporativo', name: 'Monograma Ejecutivo', color: '#2563eb', text: 'M' },
]

// Generador de mapa de normales y arrugas textiles realistas
function generateRealisticFabricMaps(fabricType) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Fondo neutro para bump/normal
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 512, 512)

  // 1. Arrugas orgánicas y pliegues naturales de confección
  ctx.strokeStyle = '#686868'
  ctx.lineWidth = 4
  ctx.filter = 'blur(6px)'

  // Pliegues horizontales sutiles en la cintura y codos
  for (let y = 140; y < 400; y += 45) {
    ctx.beginPath()
    ctx.moveTo(80, y)
    ctx.bezierCurveTo(200, y + 12, 320, y - 10, 440, y + 6)
    ctx.stroke()
  }

  // Pliegues verticales de caída de tela
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(170, 80)
  ctx.bezierCurveTo(160, 220, 180, 360, 165, 480)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(340, 80)
  ctx.bezierCurveTo(350, 220, 330, 360, 345, 480)
  ctx.stroke()
  ctx.filter = 'none'

  // 2. Micro-trama del tejido textil específico
  if (fabricType === 'gabardina') {
    // Sarga diagonal característica (twill weave)
    ctx.strokeStyle = '#999999'
    ctx.lineWidth = 1.2
    for (let i = -512; i < 1024; i += 8) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 512, 512)
      ctx.stroke()
    }
  } else if (fabricType === 'ripstop') {
    // Cuadrícula técnica reforzada
    ctx.strokeStyle = '#555555'
    ctx.lineWidth = 2
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 512)
      ctx.stroke()
    }
    for (let y = 0; y <= 512; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }
  } else {
    // Popelina de algodón peinado (trama fina cruzada)
    for (let x = 0; x < 512; x += 6) {
      for (let y = 0; y < 512; y += 6) {
        if ((x + y) % 12 === 0) {
          ctx.fillStyle = '#9c9c9c'
          ctx.fillRect(x, y, 3, 3)
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

// Generador de textura del escudo bordado
function createEmbroideredBadgeTexture(crest) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Fondo transparente
  ctx.clearRect(0, 0, 256, 256)

  // Silueta de escudo heráldico / institucional
  ctx.beginPath()
  ctx.moveTo(128, 20)
  ctx.lineTo(210, 50)
  ctx.lineTo(210, 150)
  ctx.quadraticCurveTo(210, 220, 128, 245)
  ctx.quadraticCurveTo(46, 220, 46, 150)
  ctx.lineTo(46, 50)
  ctx.closePath()

  // Relleno del escudo con degradado
  const grad = ctx.createLinearGradient(0, 20, 0, 240)
  grad.addColorStop(0, '#1e293b')
  grad.addColorStop(1, '#0f172a')
  ctx.fillStyle = grad
  ctx.fill()

  // Borde bordado dorado de alta densidad
  ctx.strokeStyle = crest.color || '#f59e0b'
  ctx.lineWidth = 10
  ctx.stroke()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  // Laureles / Corona bordada
  ctx.fillStyle = crest.color || '#f59e0b'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('★ ★ ★', 128, 90)

  // Nombre bordado institucional
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px sans-serif'
  ctx.fillText(crest.text || 'MAQUISER', 128, 140)

  ctx.fillStyle = '#94a3b8'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText('BOLIVIA', 128, 175)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  return texture
}

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const masterGroupRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [garmentType, setGarmentType] = useState('uniforme') // 'uniforme' | 'overol' | 'camisa'
  const [selectedCrest, setSelectedCrest] = useState(CREST_PRESETS[0])
  const [customLogoUrl, setCustomLogoUrl] = useState(null)
  const [isRotating, setIsRotating] = useState(true)
  const [cameraView, setCameraView] = useState('front') // 'front' | 'back' | 'profile' | 'detail'

  // Inicialización de Three.js con Iluminación Fotográfica de Estudio
  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    // 1. Escena con fondo neutro de estudio textil
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf1f5f9)
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.05)

    // 2. Cámara fotográfica de producto
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100)
    camera.position.set(0, 0.15, 4.2)
    cameraRef.current = camera

    // 3. Renderizador WebGL con Antialiasing y Tone Mapping Cinemático
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // 4. Iluminación Fotográfica de Alta Gama (3-Point Studio + Rim Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    // Key Light (Luz frontal superior con sombras suaves)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(4, 7, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0004
    scene.add(keyLight)

    // Fill Light (Luz de relleno suave azulada)
    const fillLight = new THREE.DirectionalLight(0xc7d2fe, 1.1)
    fillLight.position.set(-5, 3, 3)
    scene.add(fillLight)

    // Rim Light (Luz de silueta dorada para despegar la prenda del fondo)
    const rimLight = new THREE.DirectionalLight(0xfef3c7, 1.3)
    rimLight.position.set(0, 5, -4)
    scene.add(rimLight)

    // Luz de realce inferior
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5)
    bottomLight.position.set(0, -4, 2)
    scene.add(bottomLight)

    // 5. Suelo del Showroom con sombra de contacto suave
    const floorGeo = new THREE.PlaneGeometry(16, 16)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.16 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.65
    floor.receiveShadow = true
    scene.add(floor)

    // 6. Grupo Principal
    const masterGroup = new THREE.Group()
    scene.add(masterGroup)
    masterGroupRef.current = masterGroup

    // Construir la prenda inicial
    buildSculptedGarment(masterGroup, garmentType, selectedColor.hex, selectedFabric.id, selectedCrest, customLogoUrl)

    // 7. Controles de Órbita de Ratón Fluido
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

      masterGroup.rotation.y += deltaX * 0.007
      masterGroup.rotation.x += deltaY * 0.003
      masterGroup.rotation.x = Math.max(-0.25, Math.min(0.25, masterGroup.rotation.x))

      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.002
      camera.position.z = Math.max(2.5, Math.min(5.2, camera.position.z))
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })

    const handleResize = () => {
      if (!currentMount) return
      const newW = currentMount.clientWidth
      const newH = currentMount.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    // Loop de renderizado
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (isRotating && !isDragging && masterGroup) {
        masterGroup.rotation.y += 0.004
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
      window.removeEventListener('resize', handleResize)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Actualizar la prenda al cambiar opciones
  useEffect(() => {
    if (masterGroupRef.current) {
      buildSculptedGarment(masterGroupRef.current, garmentType, selectedColor.hex, selectedFabric.id, selectedCrest, customLogoUrl)
    }
  }, [garmentType, selectedColor, selectedFabric, selectedCrest, customLogoUrl])

  // Cambiar vista de cámara predefinida
  const setCameraAngle = (view) => {
    setCameraView(view)
    if (!masterGroupRef.current || !cameraRef.current) return

    setIsRotating(false)
    const camera = cameraRef.current
    const group = masterGroupRef.current

    if (view === 'front') {
      group.rotation.set(0, 0, 0)
      camera.position.set(0, 0.15, 4.2)
    } else if (view === 'back') {
      group.rotation.set(0, Math.PI, 0)
      camera.position.set(0, 0.15, 4.2)
    } else if (view === 'profile') {
      group.rotation.set(0, Math.PI / 4, 0)
      camera.position.set(0, 0.15, 4.2)
    } else if (view === 'detail') {
      group.rotation.set(0, 0.15, 0)
      camera.position.set(-0.25, 0.35, 2.7) // Zoom al bordado del pecho
    }
  }

  // ============================================================================
  // ESCULTOR DE PRENDAS TEXTILES ORGÁNICAS (Lathes, Splines & Curvas Reales)
  // ============================================================================
  function buildSculptedGarment(group, type, hexColor, fabricId, crest, customLogo) {
    while (group.children.length > 0) {
      const obj = group.children[0]
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
      group.remove(obj)
    }

    const fabricTexture = generateRealisticFabricMaps(fabricId)

    // 1. Material Textil PBR de Alta Definición
    const clothMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: 0.86,
      metalness: 0.03,
      bumpMap: fabricTexture,
      bumpScale: 0.045,
    })

    const clothDarkTrimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor).clone().multiplyScalar(0.7),
      roughness: 0.88,
      bumpMap: fabricTexture,
      bumpScale: 0.03,
    })

    // Material de lino/algodón interior
    const innerLinenMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.95,
    })

    // Material de bordes reflectivos de alta visibilidad (3M)
    const hiVisYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Amarillo flúor
      roughness: 0.4,
    })

    const reflectiveSilverMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      emissive: 0x475569, // Brillo reflectivo cuando recibe luz
      roughness: 0.15,
      metalness: 0.85,
    })

    const metalButtonMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85,
    })

    const pearlButtonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.2,
    })

    // ==========================================================================
    // MANIQUÍ FANTASMA ELEGANTE (GHOST MANNEQUIN CON SOPORTE NEGRO MATE)
    // ==========================================================================
    const standGroup = new THREE.Group()

    // Base circular de pedestal de showroom
    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.55, 0.04, 40),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.2 })
    )
    baseMesh.position.y = -1.63
    baseMesh.receiveShadow = true
    standGroup.add(baseMesh)

    // Columna central telescópica
    const poleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.8, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.9 })
    )
    poleMesh.position.y = -0.72
    poleMesh.castShadow = true
    standGroup.add(poleMesh)

    // Cuello interior del maniquí fantasma (hueco con etiqueta de marca)
    const neckInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.22, 0.3, 24, 1, true),
      innerLinenMat
    )
    neckInner.position.y = 0.82
    standGroup.add(neckInner)

    // Tapa interior con la etiqueta MAQUISER SRL
    const neckLabel = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    )
    neckLabel.rotation.x = -Math.PI / 2
    neckLabel.position.y = 0.76
    standGroup.add(neckLabel)

    group.add(standGroup)

    // ==========================================================================
    // 1. ESCULTURA DEL TORSO ANATÓMICO (LatheGeometry con curvas sastre)
    // ==========================================================================
    const torsoPoints = [
      new THREE.Vector2(0.24, 0.86), // Cuello base
      new THREE.Vector2(0.38, 0.82), // Clavícula
      new THREE.Vector2(0.56, 0.72), // Caída del hombro sastre
      new THREE.Vector2(0.55, 0.45), // Pectoral / Busto
      new THREE.Vector2(0.50, 0.15), // Costado
      new THREE.Vector2(0.46, -0.15), // Cintura entallada
      new THREE.Vector2(0.50, -0.38), // Cadera
      new THREE.Vector2(0.48, -0.44), // Bajo / Dobladillo
    ]

    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 40)
    torsoGeo.computeVertexNormals()
    const torsoMesh = new THREE.Mesh(torsoGeo, clothMat)
    // Escalar en Z para darle el perfil ovalado humano (ancho de frente, aplanado de perfil)
    torsoMesh.scale.set(1.0, 1.0, 0.62)
    torsoMesh.position.y = 0.15
    torsoMesh.castShadow = true
    torsoMesh.receiveShadow = true
    group.add(torsoMesh)

    // ==========================================================================
    // 2. MANGAS CON CAÍDA ORGÁNICA CONTINUA (TubeGeometry sobre Spline 3D)
    // ==========================================================================
    function createOrganicSleeve(isRight = false) {
      const sign = isRight ? 1 : -1
      // Curva 3D suave desde el hombro hasta el puño
      const sleeveCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.54, 0.82, 0),       // Inicio de hombro
        new THREE.Vector3(sign * 0.62, 0.52, 0.02),    // Brazo superior
        new THREE.Vector3(sign * 0.60, 0.18, 0.06),    // Codo levemente flexionado
        new THREE.Vector3(sign * 0.54, -0.18, 0.10),   // Antebrazo
        new THREE.Vector3(sign * 0.48, -0.48, 0.12),   // Muñeca / Puño
      ])

      const tubeGeo = new THREE.TubeGeometry(sleeveCurve, 32, 0.145, 20, false)
      tubeGeo.computeVertexNormals()
      const sleeveMesh = new THREE.Mesh(tubeGeo, clothMat)
      sleeveMesh.castShadow = true
      group.add(sleeveMesh)

      // Dobladillo / Puño de manga reforzado
      const cuffRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.145, 0.02, 16, 24),
        clothDarkTrimMat
      )
      cuffRing.position.set(sign * 0.48, -0.48, 0.12)
      cuffRing.rotation.x = Math.PI / 2
      group.add(cuffRing)

      return sleeveCurve
    }

    createOrganicSleeve(false) // Manga izquierda
    createOrganicSleeve(true)  // Manga derecha

    // ==========================================================================
    // 3. DETALLES Y ACCESORIOS SEGÚN EL TIPO DE PRENDA
    // ==========================================================================

    if (type === 'uniforme') {
      // ------------------------------------------------------------------------
      // A. UNIFORME ESCOLAR: BLAZER SASTRE CON SOLAPAS NOTCH, CAMISA Y CORBATA
      // ------------------------------------------------------------------------

      // Pechera de camisa blanca interior
      const shirtBibGeo = new THREE.PlaneGeometry(0.32, 0.55)
      const shirtBib = new THREE.Mesh(
        shirtBibGeo,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
      )
      shirtBib.position.set(0, 0.62, 0.28)
      group.add(shirtBib)

      // Cuello de camisa blanca plegado
      const collarL = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
      )
      collarL.position.set(-0.12, 0.76, 0.32)
      collarL.rotation.set(0.2, 0.25, -0.4)
      group.add(collarL)

      const collarR = collarL.clone()
      collarR.position.set(0.12, 0.76, 0.32)
      collarR.rotation.set(0.2, -0.25, 0.4)
      group.add(collarR)

      // Corbata escolar institucional en V
      const tieKnot = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.09, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 })
      )
      tieKnot.position.set(0, 0.72, 0.34)
      group.add(tieKnot)

      const tieBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.45, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 })
      )
      tieBody.position.set(0, 0.46, 0.33)
      group.add(tieBody)

      // Solapas de sastre elegantes dobladas en V (Notched Lapels)
      const lapelL = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.62, 0.03),
        clothMat
      )
      lapelL.position.set(-0.21, 0.50, 0.33)
      lapelL.rotation.set(0.15, 0.30, -0.25)
      lapelL.castShadow = true
      group.add(lapelL)

      const lapelR = lapelL.clone()
      lapelR.position.set(0.21, 0.50, 0.33)
      lapelR.rotation.set(0.15, -0.30, 0.25)
      lapelR.castShadow = true
      group.add(lapelR)

      // Bolsillo de pecho superior con escudo bordado
      const pocketChest = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 0.02),
        clothDarkTrimMat
      )
      pocketChest.position.set(-0.28, 0.46, 0.32)
      pocketChest.rotation.y = 0.25
      group.add(pocketChest)

      // Escudo bordado institucional en relieve
      const badgeTexture = createEmbroideredBadgeTexture(crest)
      const badgeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.18),
        new THREE.MeshStandardMaterial({
          map: badgeTexture,
          transparent: true,
          roughness: 0.4,
          metalness: 0.2,
        })
      )
      badgeMesh.position.set(-0.28, 0.36, 0.33)
      badgeMesh.rotation.y = 0.25
      group.add(badgeMesh)

      // Bolsillos inferiores con tapas de sastre (Flap pockets)
      const flapL = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.05, 0.04),
        clothDarkTrimMat
      )
      flapL.position.set(-0.26, -0.16, 0.33)
      flapL.rotation.y = 0.2
      flapL.castShadow = true
      group.add(flapL)

      const flapR = flapL.clone()
      flapR.position.set(0.26, -0.16, 0.33)
      flapR.rotation.y = -0.2
      flapR.castShadow = true
      group.add(flapR)

      // Botones frontales de latón dorado
      for (let i = 0; i < 2; i++) {
        const btn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.028, 0.02, 20),
          metalButtonMat
        )
        btn.rotation.x = Math.PI / 2
        btn.position.set(0, 0.12 - i * 0.24, 0.34)
        btn.castShadow = true
        group.add(btn)
      }

    } else if (type === 'overol') {
      // ------------------------------------------------------------------------
      // B. OVEROL INDUSTRIAL DE SEGURIDAD (CON CINTAS 3M Y PANTALONES INTEGRADOS)
      // ------------------------------------------------------------------------

      // Cuello alto de seguridad tipo Mao
      const safetyCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.16, 32, 1, true),
        clothMat
      )
      safetyCollar.position.y = 0.88
      group.add(safetyCollar)

      // Tapeta central cubre-cremallera con doble pespunte
      const placket = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.25, 0.03),
        clothDarkTrimMat
      )
      placket.position.set(0, 0.25, 0.33)
      group.add(placket)

      // Tirador metálico de cremallera
      const zipPull = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.07, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
      )
      zipPull.position.set(0, 0.82, 0.36)
      group.add(zipPull)

      // Bolsillos dobles de pecho con fuelle
      const chestPocketL = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.19, 0.05),
        clothMat
      )
      chestPocketL.position.set(-0.24, 0.44, 0.33)
      chestPocketL.rotation.y = 0.2
      chestPocketL.castShadow = true
      group.add(chestPocketL)

      const chestPocketR = chestPocketL.clone()
      chestPocketR.position.set(0.24, 0.44, 0.33)
      chestPocketR.rotation.y = -0.2
      chestPocketR.castShadow = true
      group.add(chestPocketR)

      // CINTAS REFLECTIVAS DE SEGURIDAD 3M EN EL PECHO
      const chestBandHiVis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.53, 0.51, 0.10, 36),
        hiVisYellowMat
      )
      chestBandHiVis.scale.set(1.02, 1.0, 0.65)
      chestBandHiVis.position.y = 0.24
      group.add(chestBandHiVis)

      const chestBandSilver = new THREE.Mesh(
        new THREE.CylinderGeometry(0.535, 0.515, 0.06, 36),
        reflectiveSilverMat
      )
      chestBandSilver.scale.set(1.02, 1.0, 0.65)
      chestBandSilver.position.y = 0.24
      group.add(chestBandSilver)

      // Cintas reflectivas en las mangas
      const armBandL = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.035, 16, 24),
        reflectiveSilverMat
      )
      armBandL.position.set(-0.61, 0.35, 0.04)
      armBandL.rotation.x = Math.PI / 2
      group.add(armBandL)

      const armBandR = armBandL.clone()
      armBandR.position.set(0.61, 0.35, 0.04)
      group.add(armBandR)

      // Cinturón elástico de cintura
      const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 0.08, 36),
        clothDarkTrimMat
      )
      belt.scale.set(1.02, 1.0, 0.64)
      belt.position.y = -0.14
      group.add(belt)

      // PIERNAS DEL OVEROL CONTINUAS HASTA EL SUELO
      const legPoints = [
        new THREE.Vector2(0.23, 0.0),
        new THREE.Vector2(0.22, -0.45), // Rodilla
        new THREE.Vector2(0.19, -0.95), // Bota
      ]
      const legGeo = new THREE.LatheGeometry(legPoints, 24)

      const legL = new THREE.Mesh(legGeo, clothMat)
      legL.position.set(-0.25, -0.44, 0)
      legL.castShadow = true
      group.add(legL)

      const legR = legL.clone()
      legR.position.set(0.25, -0.44, 0)
      legR.castShadow = true
      group.add(legR)

      // Rodilleras industriales acolchadas reforzadas
      const kneePadL = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.24, 0.06),
        clothDarkTrimMat
      )
      kneePadL.position.set(-0.25, -0.9, 0.17)
      kneePadL.castShadow = true
      group.add(kneePadL)

      const kneePadR = kneePadL.clone()
      kneePadR.position.set(0.25, -0.9, 0.17)
      kneePadR.castShadow = true
      group.add(kneePadR)

      // Cintas reflectivas inferiores en las piernas
      const legBandL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.205, 0.205, 0.06, 24),
        reflectiveSilverMat
      )
      legBandL.position.set(-0.25, -1.18, 0)
      group.add(legBandL)

      const legBandR = legBandL.clone()
      legBandR.position.set(0.25, -1.18, 0)
      group.add(legBandR)

    } else {
      // ------------------------------------------------------------------------
      // C. CAMISA / BLUSA INSTITUCIONAL (FINA CONFECCIÓN CON BOTONES DE NÁCAR)
      // ------------------------------------------------------------------------

      // Cuello camisero estructurado clásico (pie de cuello y puntas dobladas)
      const collarBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.23, 0.08, 32),
        clothMat
      )
      collarBand.position.y = 0.84
      group.add(collarBand)

      // Puntas afiladas del cuello camisero cayendo sobre el pecho
      const collarPointL = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.15, 0.03),
        clothMat
      )
      collarPointL.position.set(-0.14, 0.76, 0.28)
      collarPointL.rotation.set(0.22, 0.32, -0.32)
      collarPointL.castShadow = true
      group.add(collarPointL)

      const collarPointR = collarPointL.clone()
      collarPointR.position.set(0.14, 0.76, 0.28)
      collarPointR.rotation.set(0.22, -0.32, 0.32)
      collarPointR.castShadow = true
      group.add(collarPointR)

      // Tapeta central de 3.5cm con botones de nácar
      const shirtPlacket = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.25, 0.025),
        clothDarkTrimMat
      )
      shirtPlacket.position.set(0, 0.22, 0.32)
      group.add(shirtPlacket)

      // 6 botones finos de nácar de 4 orificios
      for (let i = 0; i < 6; i++) {
        const pearlBtn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16),
          pearlButtonMat
        )
        pearlBtn.rotation.x = Math.PI / 2
        pearlBtn.position.set(0, 0.72 - i * 0.18, 0.34)
        group.add(pearlBtn)
      }

      // Bolsillo de pecho con corte en V y división de lapicero
      const shirtPocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.20, 0.02),
        clothMat
      )
      shirtPocket.position.set(-0.25, 0.38, 0.31)
      shirtPocket.rotation.y = 0.2
      shirtPocket.castShadow = true
      group.add(shirtPocket)

      const penDivider = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.20, 0.025),
        clothDarkTrimMat
      )
      penDivider.position.set(-0.31, 0.38, 0.315)
      penDivider.rotation.y = 0.2
      group.add(penDivider)
    }
  }

  // Manejador de subida de logotipo propio del cliente (colegio o empresa)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomLogoUrl(url)
    }
  }

  const handleAddToCart = () => {
    const item = {
      name: `${garmentType === 'uniforme' ? 'Uniforme Escolar Completo' : garmentType === 'overol' ? 'Overol de Seguridad Industrial 3M' : 'Camisa Institucional de Vestir'} (Diseño 3D Personalizado)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      crest: selectedCrest.name,
      price: garmentType === 'overol' ? 195.0 : garmentType === 'uniforme' ? 145.0 : 85.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
      {/* Visor 3D Three.js Studio */}
      <div className="lg:col-span-7 relative bg-gradient-to-b from-slate-100 via-slate-200/90 to-slate-300 flex flex-col justify-between p-6 select-none">
        {/* Cabecera del visor: Modos e Indicador */}
        <div className="flex justify-between items-center z-10 gap-2 flex-wrap">
          <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Showroom 3D Textil • Maniquí Fantasma PBR</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all ${
                isRotating
                  ? 'bg-blue-600 border-blue-700 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span>{isRotating ? 'Giro Activo' : 'Giro Pausado'}</span>
            </button>
          </div>
        </div>

        {/* Canvas de Three.js */}
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Controles de Cámara Rápida (Frente, Espalda, Perfil, Detalle) */}
        <div className="z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <div className="flex items-center space-x-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: 'front', label: 'Frente' },
              { id: 'back', label: 'Espalda' },
              { id: 'profile', label: 'Perfil 45°' },
              { id: 'detail', label: 'Zoom Bordado' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setCameraAngle(btn.id)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                  cameraView === btn.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-semibold text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Arrastra para rotar • Rueda para Zoom</span>
          </div>
        </div>
      </div>

      {/* Panel de Configuración Textil Maquiser */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Maquiser SRL • Confección 3D
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                PBR Textil V2.0
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Configurador de Prendas</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Selecciona el tipo de confección, la paleta cromática y el escudo bordado con previsualización en tiempo real.
            </p>
          </div>

          {/* 1. Selección de tipo de prenda */}
          <div>
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block mb-2">
              1. Tipo de Prenda Textil
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'uniforme', label: 'Uniforme Escolar', sub: 'Blazer, Corbata & Solapas' },
                { id: 'overol', label: 'Overol Industrial', sub: '3M Reflectivo & Rodilleras' },
                { id: 'camisa', label: 'Camisa / Blusa', sub: 'Tapeta & Botones Nácar' },
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
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color de tela */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
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

          {/* 3. Selección de Escudo o Bordado */}
          {garmentType === 'uniforme' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
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
                        ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {crest.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Especificación de Tela y Gramaje */}
          <div>
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block mb-2">
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
              <span className="text-xs font-semibold text-slate-500 block">Cotización Base Unitaria:</span>
              <span className="text-[11px] text-emerald-600 font-bold">✓ Incluye bordado y personalización</span>
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
            <span>Añadir Esta Prenda 3D a la Cotización</span>
          </button>
        </div>
      </div>
    </div>
  )
}
