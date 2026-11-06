import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RotateCcw, Palette, Sparkles, Check, ShoppingBag, Eye, ZoomIn, Info } from 'lucide-react'

// Colores disponibles para uniformes y prendas industriales
const COLOR_PRESETS = [
  { name: 'Azul Marino Escolar', hex: '#1e3a8a', class: 'bg-blue-900' },
  { name: 'Blanco Institucional', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Industrial', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Quirúrgico / Trabajo', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña Escolar', hex: '#881337', class: 'bg-rose-900' },
  { name: 'Negro Ejecutivo', hex: '#0f172a', class: 'bg-slate-900' },
]

// Tipos de tejido textil con textura procedural
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina 65/35', desc: 'Sarga diagonal de alta resistencia para colegios', weight: '240 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón', desc: 'Trama fina y transpirable para camisas', weight: '120 g/m²' },
  { id: 'ripstop', name: 'Ripstop Antidesgarro', desc: 'Cuadrícula técnica antidesgarro industrial', weight: '280 g/m²' },
]

// Generador de texturas procedurales para simular el tejido textil real
function createFabricBumpMap(fabricType) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 128, 128)

  if (fabricType === 'gabardina') {
    // Sarga diagonal
    ctx.strokeStyle = '#a0a0a0'
    ctx.lineWidth = 1.5
    for (let i = -128; i < 256; i += 6) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 128, 128)
      ctx.stroke()
    }
  } else if (fabricType === 'ripstop') {
    // Cuadrícula técnica ripstop
    ctx.strokeStyle = '#505050'
    ctx.lineWidth = 2
    for (let x = 0; x <= 128; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 128)
      ctx.stroke()
    }
    for (let y = 0; y <= 128; y += 16) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(128, y)
      ctx.stroke()
    }
  } else {
    // Popelina micro-trama algodón
    for (let x = 0; x < 128; x += 4) {
      for (let y = 0; y < 128; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = '#9c9c9c'
          ctx.fillRect(x, y, 2, 2)
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(12, 12)
  return texture
}

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const garmentGroupRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [garmentType, setGarmentType] = useState('uniforme') // 'uniforme' | 'overol' | 'camisa'
  const [isRotating, setIsRotating] = useState(true)

  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    // 1. Configurar Escena Three.js
    const width = currentMount.clientWidth
    const height = currentMount.clientHeight
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf1f5f9) // Fondo gris claro de estudio

    // Niebla suave para realismo de estudio
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.08)

    // 2. Cámara fotográfica de producto
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 0.3, 4.4)
    cameraRef.current = camera

    // 3. Renderizador con sombras suaves
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // 4. Sistema de Iluminación de Estudio de Moda (3-Point Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    // Luz principal (Key Light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 6, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0005
    scene.add(keyLight)

    // Luz de relleno lateral (Fill Light azulada suave)
    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 1.0)
    fillLight.position.set(-5, 2, 3)
    scene.add(fillLight)

    // Luz de contra / silueta (Rim Light)
    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.9)
    rimLight.position.set(0, 4, -4)
    scene.add(rimLight)

    // 5. Suelo del showroom con sombra de contacto suave
    const floorGeo = new THREE.PlaneGeometry(16, 16)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.65
    floor.receiveShadow = true
    scene.add(floor)

    // 6. Grupo contenedor de la prenda y el maniquí
    const masterGroup = new THREE.Group()
    scene.add(masterGroup)

    const garmentGroup = new THREE.Group()
    masterGroup.add(garmentGroup)
    garmentGroupRef.current = garmentGroup

    // Construir la prenda inicial
    renderGarment(garmentGroup, garmentType, selectedColor.hex, selectedFabric.id)

    // 7. Controles de Ratón (Arrastrar para rotar en 360°, rueda para zoom)
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
      masterGroup.rotation.x += deltaY * 0.004
      // Limitar inclinación vertical para mantener estética
      masterGroup.rotation.x = Math.max(-0.25, Math.min(0.25, masterGroup.rotation.x))

      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.002
      camera.position.z = Math.max(2.8, Math.min(5.5, camera.position.z))
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })

    // Redimensionamiento
    const handleResize = () => {
      if (!currentMount) return
      const newW = currentMount.clientWidth
      const newH = currentMount.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    // Loop de animación fluido
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (isRotating && !isDragging) {
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
      domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Actualizar la prenda cuando cambien las opciones del usuario
  useEffect(() => {
    if (garmentGroupRef.current) {
      renderGarment(garmentGroupRef.current, garmentType, selectedColor.hex, selectedFabric.id)
    }
  }, [garmentType, selectedColor, selectedFabric])

  // ============================================================================
  // FUNCIÓN CONSTRUCTORA PRINCIPAL DE PRENDAS REALISTAS
  // ============================================================================
  function renderGarment(group, type, hexColor, fabricId) {
    // Limpieza de objetos anteriores
    while (group.children.length > 0) {
      const obj = group.children[0]
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
      group.remove(obj)
    }

    const fabricBump = createFabricBumpMap(fabricId)

    // 1. Material textil principal realista (mate, micro-textura tejida)
    const clothMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: 0.88,
      metalness: 0.04,
      bumpMap: fabricBump,
      bumpScale: 0.04,
    })

    // Material de costuras / contraste
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor).clone().multiplyScalar(0.75),
      roughness: 0.9,
    })

    // Material de camisa interior blanca
    const whiteShirtMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.82,
      metalness: 0.02,
    })

    // Material corbata escolar
    const tieMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x991b1b), // Granate / Borgoña clásico
      roughness: 0.6,
      metalness: 0.1,
    })

    // Material maniquí de sastre (madera oscura y lino)
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x271c19,
      roughness: 0.35,
      metalness: 0.1,
    })

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85,
    })

    const mannequinLinen = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.95,
    })

    // Cinta reflectiva industrial de seguridad (con emisión de brillo suave)
    const reflectiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x475569,
      roughness: 0.2,
      metalness: 0.7,
    })

    const highVisYellow = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.5,
    })

    // ==========================================================================
    // A. BASE Y PEDESTAL DE MANIQUÍ PROFESIONAL DE SASTRE
    // ==========================================================================
    const standGroup = new THREE.Group()

    // Base circular de madera
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.05, 36)
    const baseMesh = new THREE.Mesh(baseGeo, woodMaterial)
    baseMesh.position.y = -1.62
    baseMesh.receiveShadow = true
    standGroup.add(baseMesh)

    // Tubo cromado telescópico central
    const poleGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.8, 24)
    const poleMesh = new THREE.Mesh(poleGeo, metalMaterial)
    poleMesh.position.y = -0.7
    poleMesh.castShadow = true
    standGroup.add(poleMesh)

    // Cuello superior de lino del maniquí
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 24)
    const neckMesh = new THREE.Mesh(neckGeo, mannequinLinen)
    neckMesh.position.y = 0.85
    neckMesh.castShadow = true
    standGroup.add(neckMesh)

    // Remate superior de madera tallada (tapa de cuello de sastre)
    const capGeo = new THREE.CylinderGeometry(0.12, 0.19, 0.08, 24)
    const capMesh = new THREE.Mesh(capGeo, woodMaterial)
    capMesh.position.y = 1.05
    standGroup.add(capMesh)

    const knobGeo = new THREE.SphereGeometry(0.08, 24, 24)
    const knobMesh = new THREE.Mesh(knobGeo, woodMaterial)
    knobMesh.position.y = 1.12
    standGroup.add(knobMesh)

    group.add(standGroup)

    // ==========================================================================
    // B. CONSTRUCCIÓN ESPECÍFICA SEGÚN EL TIPO DE PRENDA
    // ==========================================================================
    if (type === 'uniforme') {
      // ------------------------------------------------------------------------
      // 1. UNIFORME ESCOLAR: BLAZER / CHAQUETA SASTRE CON SOLAPAS Y ESCUDO
      // ------------------------------------------------------------------------

      // Torso entallado anatómico
      const torsoGeo = new THREE.CylinderGeometry(0.58, 0.49, 1.15, 32)
      const torso = new THREE.Mesh(torsoGeo, clothMaterial)
      torso.position.y = 0.22
      torso.castShadow = true
      torso.receiveShadow = true
      group.add(torso)

      // Faldón inferior de la casaca/blazer
      const skirtGeo = new THREE.CylinderGeometry(0.49, 0.54, 0.35, 32)
      const skirt = new THREE.Mesh(skirtGeo, clothMaterial)
      skirt.position.y = -0.42
      skirt.castShadow = true
      group.add(skirt)

      // Camisa blanca interior visible en el escote
      const shirtChestGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.5, 16)
      const shirtChest = new THREE.Mesh(shirtChestGeo, whiteShirtMaterial)
      shirtChest.position.set(0, 0.58, 0.08)
      group.add(shirtChest)

      // Cuello camisero blanco doblado en el escote
      const collarLeftGeo = new THREE.BoxGeometry(0.2, 0.08, 0.02)
      const collarLeft = new THREE.Mesh(collarLeftGeo, whiteShirtMaterial)
      collarLeft.position.set(-0.14, 0.72, 0.22)
      collarLeft.rotation.set(0.2, 0.3, -0.4)
      group.add(collarLeft)

      const collarRight = collarLeft.clone()
      collarRight.position.set(0.14, 0.72, 0.22)
      collarRight.rotation.set(0.2, -0.3, 0.4)
      group.add(collarRight)

      // Corbata escolar institucional
      const tieKnotGeo = new THREE.BoxGeometry(0.09, 0.08, 0.03)
      const tieKnot = new THREE.Mesh(tieKnotGeo, tieMaterial)
      tieKnot.position.set(0, 0.68, 0.24)
      group.add(tieKnot)

      const tieBodyGeo = new THREE.BoxGeometry(0.08, 0.45, 0.02)
      const tieBody = new THREE.Mesh(tieBodyGeo, tieMaterial)
      tieBody.position.set(0, 0.44, 0.23)
      group.add(tieBody)

      // Solapas de sastre elegantes en V (Lapels)
      const lapelLeftGeo = new THREE.BoxGeometry(0.16, 0.6, 0.03)
      const lapelLeft = new THREE.Mesh(lapelLeftGeo, clothMaterial)
      lapelLeft.position.set(-0.24, 0.48, 0.27)
      lapelLeft.rotation.set(0.15, 0.35, -0.28)
      lapelLeft.castShadow = true
      group.add(lapelLeft)

      const lapelRight = lapelLeft.clone()
      lapelRight.position.set(0.24, 0.48, 0.27)
      lapelRight.rotation.set(0.15, -0.35, 0.28)
      lapelRight.castShadow = true
      group.add(lapelRight)

      // Escudo bordado institucional en el bolsillo superior izquierdo
      const badgeBaseGeo = new THREE.BoxGeometry(0.15, 0.17, 0.02)
      const badgeBase = new THREE.Mesh(badgeBaseGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }))
      badgeBase.position.set(-0.3, 0.38, 0.52)
      badgeBase.rotation.y = 0.25
      group.add(badgeBase)

      const badgeInnerGeo = new THREE.BoxGeometry(0.12, 0.14, 0.025)
      const badgeInner = new THREE.Mesh(badgeInnerGeo, new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }))
      badgeInner.position.set(-0.3, 0.38, 0.522)
      badgeInner.rotation.y = 0.25
      group.add(badgeInner)

      // Bolsillos inferiores con cartera/tapa de sastre
      const flapLGeo = new THREE.BoxGeometry(0.22, 0.05, 0.03)
      const flapL = new THREE.Mesh(flapLGeo, clothMaterial)
      flapL.position.set(-0.28, -0.15, 0.46)
      flapL.rotation.y = 0.2
      flapL.castShadow = true
      group.add(flapL)

      const flapR = flapL.clone()
      flapR.position.set(0.28, -0.15, 0.46)
      flapR.rotation.y = -0.2
      group.add(flapR)

      // Botones frontales metálicos dorados/marinos
      for (let i = 0; i < 3; i++) {
        const btnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16)
        const btn = new THREE.Mesh(btnGeo, new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 }))
        btn.rotation.x = Math.PI / 2
        btn.position.set(0, 0.15 - i * 0.22, 0.52)
        group.add(btn)
      }

      // Mangas con caída natural humana hacia abajo
      buildRealisticSleeves(group, clothMaterial, false)

    } else if (type === 'overol') {
      // ------------------------------------------------------------------------
      // 2. OVEROL INDUSTRIAL DE SEGURIDAD (CON CINTAS REFLECTIVAS Y PANTALÓN)
      // ------------------------------------------------------------------------

      // Torso robusto de trabajo
      const torsoGeo = new THREE.CylinderGeometry(0.62, 0.56, 1.15, 32)
      const torso = new THREE.Mesh(torsoGeo, clothMaterial)
      torso.position.y = 0.22
      torso.castShadow = true
      group.add(torso)

      // Cuello alto protector de seguridad (Cuello Mao)
      const collarGeo = new THREE.CylinderGeometry(0.25, 0.27, 0.18, 28, 1, true)
      const collar = new THREE.Mesh(collarGeo, clothMaterial)
      collar.position.y = 0.84
      group.add(collar)

      // Tapeta central cubre-cremallera con pespunte
      const zipperPlacketGeo = new THREE.BoxGeometry(0.08, 1.15, 0.03)
      const zipperPlacket = new THREE.Mesh(zipperPlacketGeo, trimMaterial)
      zipperPlacket.position.set(0, 0.22, 0.57)
      group.add(zipperPlacket)

      // Tirador de cremallera metálico
      const zipPullGeo = new THREE.BoxGeometry(0.03, 0.06, 0.02)
      const zipPull = new THREE.Mesh(zipPullGeo, metalMaterial)
      zipPull.position.set(0, 0.72, 0.6)
      group.add(zipPull)

      // Bolsillos de pecho dobles con fuelle y solapa de velcro
      const chestPocketGeo = new THREE.BoxGeometry(0.18, 0.2, 0.04)
      const pocketL = new THREE.Mesh(chestPocketGeo, clothMaterial)
      pocketL.position.set(-0.28, 0.42, 0.54)
      pocketL.rotation.y = 0.15
      pocketL.castShadow = true
      group.add(pocketL)

      const pocketR = pocketL.clone()
      pocketR.position.set(0.28, 0.42, 0.54)
      pocketR.rotation.y = -0.15
      group.add(pocketR)

      // Bandas reflectivas de alta visibilidad en el pecho (Normativa 3M)
      const stripeHiVisGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.12, 32)
      const stripeHiVis = new THREE.Mesh(stripeHiVisGeo, highVisYellow)
      stripeHiVis.position.y = 0.22
      group.add(stripeHiVis)

      const stripeSilverGeo = new THREE.CylinderGeometry(0.635, 0.635, 0.07, 32)
      const stripeSilver = new THREE.Mesh(stripeSilverGeo, reflectiveMaterial)
      stripeSilver.position.y = 0.22
      group.add(stripeSilver)

      // Cinturón / Pretina elástica de ajuste
      const beltGeo = new THREE.CylinderGeometry(0.57, 0.55, 0.1, 32)
      const belt = new THREE.Mesh(beltGeo, trimMaterial)
      belt.position.y = -0.36
      group.add(belt)

      // Piernas del overol con caída hasta abajo
      const legGeo = new THREE.CylinderGeometry(0.24, 0.2, 1.15, 24)

      const legLeft = new THREE.Mesh(legGeo, clothMaterial)
      legLeft.position.set(-0.26, -0.98, 0)
      legLeft.castShadow = true
      group.add(legLeft)

      const legRight = new THREE.Mesh(legGeo, clothMaterial)
      legRight.position.set(0.26, -0.98, 0)
      legRight.castShadow = true
      group.add(legRight)

      // Rodilleras reforzadas de contraste
      const kneeGeo = new THREE.BoxGeometry(0.22, 0.25, 0.06)
      const kneeL = new THREE.Mesh(kneeGeo, trimMaterial)
      kneeL.position.set(-0.26, -0.95, 0.18)
      kneeL.castShadow = true
      group.add(kneeL)

      const kneeR = kneeL.clone()
      kneeR.position.set(0.26, -0.95, 0.18)
      group.add(kneeR)

      // Bandas reflectivas en las piernas (debajo de las rodillas)
      const legStripeGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.06, 24)
      const legStripeL = new THREE.Mesh(legStripeGeo, reflectiveMaterial)
      legStripeL.position.set(-0.26, -1.22, 0)
      group.add(legStripeL)

      const legStripeR = legStripeL.clone()
      legStripeR.position.set(0.26, -1.22, 0)
      group.add(legStripeR)

      // Mangas de trabajo industrial con bandas reflectivas
      buildRealisticSleeves(group, clothMaterial, true, reflectiveMaterial)

    } else {
      // ------------------------------------------------------------------------
      // 3. CAMISA / BLUSA INSTITUCIONAL (FINA CONFECCIÓN Y BOTONES DE NÁCAR)
      // ------------------------------------------------------------------------

      // Torso entallado de camisa con bajo redondeado
      const torsoGeo = new THREE.CylinderGeometry(0.55, 0.47, 1.25, 32)
      const torso = new THREE.Mesh(torsoGeo, clothMaterial)
      torso.position.y = 0.18
      torso.castShadow = true
      group.add(torso)

      // Cuello camisero estructurado con puntas dobladas (Classic Shirt Collar)
      const collarBandGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.12, 28)
      const collarBand = new THREE.Mesh(collarBandGeo, clothMaterial)
      collarBand.position.y = 0.8
      group.add(collarBand)

      // Puntas del cuello dobladas hacia adelante
      const tipLGeo = new THREE.BoxGeometry(0.18, 0.16, 0.03)
      const tipL = new THREE.Mesh(tipLGeo, clothMaterial)
      tipL.position.set(-0.16, 0.74, 0.24)
      tipL.rotation.set(0.25, 0.35, -0.3)
      tipL.castShadow = true
      group.add(tipL)

      const tipR = tipL.clone()
      tipR.position.set(0.16, 0.74, 0.24)
      tipR.rotation.set(0.25, -0.35, 0.3)
      tipR.castShadow = true
      group.add(tipR)

      // Tapeta central frontal de camisa con doble costura
      const placketGeo = new THREE.BoxGeometry(0.08, 1.25, 0.02)
      const placket = new THREE.Mesh(placketGeo, trimMaterial)
      placket.position.set(0, 0.18, 0.52)
      group.add(placket)

      // Botones de nácar finos (6 botones de arriba abajo)
      for (let i = 0; i < 6; i++) {
        const pearlBtnGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.015, 16)
        const pearlBtn = new THREE.Mesh(pearlBtnGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 }))
        pearlBtn.rotation.x = Math.PI / 2
        pearlBtn.position.set(0, 0.7 - i * 0.19, 0.535)
        group.add(pearlBtn)
      }

      // Bolsillo de camisa en el pecho izquierdo
      const pocketGeo = new THREE.BoxGeometry(0.16, 0.18, 0.02)
      const pocket = new THREE.Mesh(pocketGeo, clothMaterial)
      pocket.position.set(-0.28, 0.35, 0.5)
      pocket.rotation.y = 0.18
      pocket.castShadow = true
      group.add(pocket)

      // Ranura para bolígrafo en el bolsillo
      const penSlotGeo = new THREE.BoxGeometry(0.01, 0.18, 0.025)
      const penSlot = new THREE.Mesh(penSlotGeo, trimMaterial)
      penSlot.position.set(-0.33, 0.35, 0.505)
      penSlot.rotation.y = 0.18
      group.add(penSlot)

      // Mangas de camisa con puños de vestir
      buildRealisticSleeves(group, clothMaterial, false, null, true)
    }
  }

  // ============================================================================
  // GENERADOR DE MANGAS CON CAÍDA NATURAL HUMANA (NO EN BLOQUE ROBÓTICO)
  // ============================================================================
  function buildRealisticSleeves(group, clothMat, isIndustrial = false, reflectiveMat = null, isShirt = false) {
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })

    // Configuración de hombro y brazo izquierdo
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.54, 0.68, 0) // Articulación del hombro

    // Hombrera suave redondeada
    const shoulderGeo = new THREE.SphereGeometry(0.22, 24, 16)
    const shoulderL = new THREE.Mesh(shoulderGeo, clothMat)
    shoulderL.scale.set(1.1, 0.8, 1)
    shoulderL.castShadow = true
    leftArmGroup.add(shoulderL)

    // Brazo superior: cae naturalmente a lo largo del cuerpo (-78° hacia abajo)
    const upperArmGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.65, 24)
    const upperArmL = new THREE.Mesh(upperArmGeo, clothMat)
    upperArmL.position.set(-0.06, -0.32, 0)
    upperArmL.rotation.z = 0.18 // Ligera apertura natural
    upperArmL.castShadow = true
    leftArmGroup.add(upperArmL)

    // Antebrazo: continúa hacia abajo con leve flexión hacia adelante
    const forearmGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.65, 24)
    const forearmL = new THREE.Mesh(forearmGeo, clothMat)
    forearmL.position.set(-0.11, -0.9, 0.05)
    forearmL.rotation.x = -0.12 // Flexión suave hacia adelante
    forearmL.rotation.z = 0.12
    forearmL.castShadow = true
    leftArmGroup.add(forearmL)

    // Puño (Cuff)
    const cuffGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24)
    const cuffL = new THREE.Mesh(cuffGeo, clothMat)
    cuffL.position.set(-0.13, -1.22, 0.08)
    leftArmGroup.add(cuffL)

    // Detalles adicionales en mangas
    if (isIndustrial && reflectiveMat) {
      // Banda reflectiva en el brazo
      const armStripeGeo = new THREE.CylinderGeometry(0.182, 0.178, 0.08, 24)
      const armStripeL = new THREE.Mesh(armStripeGeo, reflectiveMat)
      armStripeL.position.set(-0.06, -0.3, 0)
      armStripeL.rotation.z = 0.18
      leftArmGroup.add(armStripeL)
    }

    if (isShirt) {
      // Botón en el puño de camisa
      const cuffBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12), pearlMat)
      cuffBtn.rotation.z = Math.PI / 2
      cuffBtn.position.set(-0.25, -1.22, 0.08)
      leftArmGroup.add(cuffBtn)
    }

    group.add(leftArmGroup)

    // Brazo derecho (Espejo simétrico del brazo izquierdo)
    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.54, 0.68, 0)

    const shoulderR = shoulderL.clone()
    rightArmGroup.add(shoulderR)

    const upperArmR = new THREE.Mesh(upperArmGeo, clothMat)
    upperArmR.position.set(0.06, -0.32, 0)
    upperArmR.rotation.z = -0.18
    upperArmR.castShadow = true
    rightArmGroup.add(upperArmR)

    const forearmR = new THREE.Mesh(forearmGeo, clothMat)
    forearmR.position.set(0.11, -0.9, 0.05)
    forearmR.rotation.x = -0.12
    forearmR.rotation.z = -0.12
    forearmR.castShadow = true
    rightArmGroup.add(forearmR)

    const cuffR = new THREE.Mesh(cuffGeo, clothMat)
    cuffR.position.set(0.13, -1.22, 0.08)
    rightArmGroup.add(cuffR)

    if (isIndustrial && reflectiveMat) {
      const armStripeR = new THREE.Mesh(new THREE.CylinderGeometry(0.182, 0.178, 0.08, 24), reflectiveMat)
      armStripeR.position.set(0.06, -0.3, 0)
      armStripeR.rotation.z = -0.18
      rightArmGroup.add(armStripeR)
    }

    if (isShirt) {
      const cuffBtnR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12), pearlMat)
      cuffBtnR.rotation.z = -Math.PI / 2
      cuffBtnR.position.set(0.25, -1.22, 0.08)
      rightArmGroup.add(cuffBtnR)
    }

    group.add(rightArmGroup)
  }

  const handleAddToCart = () => {
    const item = {
      name: `${garmentType === 'uniforme' ? 'Uniforme Escolar Institucional' : garmentType === 'overol' ? 'Overol Industrial de Alta Seguridad' : 'Camisa Textil de Vestir'} Personalizado`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: garmentType === 'overol' ? 195.0 : garmentType === 'uniforme' ? 145.0 : 85.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
      {/* Visor 3D Three.js Studio */}
      <div className="lg:col-span-7 relative bg-gradient-to-b from-slate-100 via-slate-200/90 to-slate-300 flex flex-col justify-between p-6">
        {/* Cabecera del visor */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Maniquí de Sastre 3D • Calidad Alta Definición</span>
          </div>

          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all ${
              isRotating
                ? 'bg-blue-600 border-blue-700 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{isRotating ? 'Giro Automático' : 'Pausado'}</span>
          </button>
        </div>

        {/* Canvas de Three.js */}
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Leyenda interactiva */}
        <div className="z-10 flex flex-col sm:flex-row items-center justify-between gap-2 px-2">
          <span className="text-[11px] font-semibold text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Arrastra para girar 360° • Rueda del ratón para Zoom</span>
          </span>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-900/10 px-2.5 py-1 rounded-md">
            Textura: {selectedFabric.name}
          </span>
        </div>
      </div>

      {/* Panel de Configuración Textil */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
              Configurador Textil Maquiser SRL
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Personalizador de Confección</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Selecciona el tipo de prenda, los tejidos técnicos y la paleta de color aprobada según el estándar de confección.
            </p>
          </div>

          {/* 1. Selección de tipo de prenda */}
          <div>
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block mb-2">
              1. Selecciona la Prenda
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'uniforme', label: 'Uniforme Escolar', sub: 'Blazer & Corbata' },
                { id: 'overol', label: 'Overol Industrial', sub: '3M Reflectivo' },
                { id: 'camisa', label: 'Camisa / Blusa', sub: 'Corte Inglés' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGarmentType(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    garmentType === t.id
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-extrabold text-xs block">{t.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Paleta de Color Textil */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                2. Color de Tejido
              </label>
              <span className="text-xs font-bold text-blue-600">{selectedColor.name}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => setSelectedColor(col)}
                  className={`w-10 h-10 rounded-2xl ${col.class} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                    selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : ''
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

          {/* 3. Selección de Tela y Gramaje con textura simulada */}
          <div>
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block mb-2">
              3. Especificación de Tela & Composición
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
                    <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
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
              <span className="text-[11px] text-emerald-600 font-bold">✓ Bordado computarizado incluido</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                Bs. {garmentType === 'overol' ? '195.00' : garmentType === 'uniforme' ? '145.00' : '85.00'}
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-sm shadow-xl active:scale-98 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Agregar Esta Configuración a la Cotización</span>
          </button>
        </div>
      </div>
    </div>
  )
}
