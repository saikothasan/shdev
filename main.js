import * as THREE from 'three';
import { gsap } from 'gsap';
import './style.css';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased directional light
directionalLight.position.set(2, 3, 4);
scene.add(directionalLight);

// Background Particles (Stars)
const starParticlesGeometry = new THREE.BufferGeometry();
const starParticlesCount = 2000; // Increased star count

const starPosArray = new Float32Array(starParticlesCount * 3);
const starScaleArray = new Float32Array(starParticlesCount);

for (let i = 0; i < starParticlesCount * 3; i++) {
  starPosArray[i] = (Math.random() - 0.5) * 20; // Wider distribution
}

for (let i = 0; i < starParticlesCount; i++) {
  starScaleArray[i] = Math.random() * 1.5; // Slightly larger stars
}

starParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(starPosArray, 3));
starParticlesGeometry.setAttribute('scale', new THREE.BufferAttribute(starScaleArray, 1));

const starParticlesMaterial = new THREE.PointsMaterial({
  size: 0.03, // Smaller individual size for more density
  color: 0xffffff,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.8
});

const starParticlesMesh = new THREE.Points(starParticlesGeometry, starParticlesMaterial);
scene.add(starParticlesMesh);

// Particle Trail System (existing code)
class ParticleTrail {
  constructor(parent, color, scene) {
    this.parent = parent;
    this.color = color;
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 50;
    this.emissionRate = 3; // Particles per frame
    this.frameCounter = 0;
    this.particleLifespan = 60; // Frames
    this.particleSize = 0.03;
    this.lastPosition = new THREE.Vector3().copy(parent.position);
  }

  update() {
    const distanceMoved = this.parent.position.distanceTo(this.lastPosition);
    if (distanceMoved > 0.001) {
      this.frameCounter++;
      if (this.frameCounter % this.emissionRate === 0) this.emitParticle();
      this.lastPosition.copy(this.parent.position);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age++;
      if (particle.age >= this.particleLifespan) {
        this.scene.remove(particle.mesh);
        particle.geometry.dispose();
        particle.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      const lifeRatio = particle.age / this.particleLifespan;
      particle.mesh.material.opacity = 1 - lifeRatio;
      particle.mesh.scale.multiplyScalar(0.98);
    }
  }
  
  emitParticle() {
    const geometry = new THREE.SphereGeometry(this.particleSize, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.parent.position);
    mesh.position.x += (Math.random() - 0.5) * 0.05;
    mesh.position.y += (Math.random() - 0.5) * 0.05;
    mesh.position.z += (Math.random() - 0.5) * 0.05;
    this.scene.add(mesh);
    this.particles.push({ mesh, geometry, material, age: 0 });
    if (this.particles.length > this.maxParticles) {
      const oldestParticle = this.particles.shift();
      this.scene.remove(oldestParticle.mesh);
      oldestParticle.geometry.dispose();
      oldestParticle.material.dispose();
    }
  }
  
  dispose() {
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.geometry.dispose();
      particle.material.dispose();
    }
    this.particles = [];
  }
}

// Interactive 3D Objects
const interactiveObjects = [];
const originalColors = [];
const originalScales = [];
const particleTrails = [];

// Create different geometric shapes
const createInteractiveObjects = () => {
  const objectData = [
    { type: 'cube', geometry: new THREE.BoxGeometry(0.5, 0.5, 0.5), color: 0x00ff88, position: [-2, 1, 2] },
    { type: 'sphere', geometry: new THREE.SphereGeometry(0.3, 32, 32), color: 0xff6b6b, position: [2, -1, 1.5] },
    { type: 'torus', geometry: new THREE.TorusGeometry(0.3, 0.1, 16, 100), color: 0x4ecdc4, position: [0, 2, 1] },
    { type: 'octahedron', geometry: new THREE.OctahedronGeometry(0.4), color: 0xffd93d, position: [-1.5, -2, 2.5] },
    { type: 'cone', geometry: new THREE.ConeGeometry(0.3, 0.8, 8), color: 0xa8e6cf, position: [1.5, 0.5, 3] },
    // New Objects
    { type: 'star', geometry: new THREE.TetrahedronGeometry(0.4), color: 0xf0f0f0, position: [-2.5, 2.5, 0.5] }, // Star-like shape
    { type: 'plant', geometry: new THREE.CylinderGeometry(0.1, 0.2, 0.8, 8), color: 0x2ecc71, position: [2.5, -2, 0.8] }, // Plant-like shape
    { type: 'crystal', geometry: new THREE.IcosahedronGeometry(0.35), color: 0x9b59b6, position: [0, -2.5, 1.2] }, // Crystal-like shape
    { type: 'capsule', geometry: new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), color: 0xe67e22, position: [-1, 0, 3.5] },
    { type: 'ring', geometry: new THREE.TorusKnotGeometry(0.3, 0.05, 100, 16), color: 0x3498db, position: [1, 1.5, 0.2] },
  ];

  objectData.forEach(data => {
    const material = new THREE.MeshLambertMaterial({ color: data.color });
    const mesh = new THREE.Mesh(data.geometry, material);
    mesh.position.set(data.position[0], data.position[1], data.position[2]);
    mesh.userData = { type: data.type, originalColor: data.color, clickCount: 0 };
    scene.add(mesh);
    interactiveObjects.push(mesh);
    originalColors.push(data.color);
    originalScales.push(1);
    particleTrails.push(new ParticleTrail(mesh, data.color, scene));
  });
};

createInteractiveObjects();

// Raycaster for mouse interaction (existing code)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;

// Mouse interaction handlers (existing code)
const onMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects);
  if (hoveredObject && !intersects.find(intersect => intersect.object === hoveredObject)) {
    const index = interactiveObjects.indexOf(hoveredObject);
    hoveredObject.material.color.setHex(originalColors[index]);
    gsap.to(hoveredObject.scale, { x: originalScales[index], y: originalScales[index], z: originalScales[index], duration: 0.3 });
    document.body.style.cursor = 'default';
    hoveredObject = null;
  }
  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object !== hoveredObject) {
      hoveredObject = object;
      object.material.color.setHex(0xffffff);
      gsap.to(object.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.3 });
      document.body.style.cursor = 'pointer';
    }
  }
};

const onMouseClick = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects);
  if (intersects.length > 0) {
    const object = intersects[0].object;
    object.userData.clickCount++;
    
    // Animations (simplified for brevity, can be expanded like before)
    gsap.to(object.rotation, { 
      x: object.rotation.x + Math.PI * (Math.random() > 0.5 ? 1 : -1), 
      y: object.rotation.y + Math.PI * (Math.random() > 0.5 ? 1 : -1), 
      duration: 1, 
      ease: 'elastic.out(1, 0.5)' 
    });
    
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    const newColor = colors[object.userData.clickCount % colors.length];
    gsap.to(object.material.color, { 
      r: ((newColor >> 16) & 255) / 255,
      g: ((newColor >> 8) & 255) / 255,
      b: (newColor & 255) / 255,
      duration: 0.5 
    });
    const index = interactiveObjects.indexOf(object);
    originalColors[index] = newColor;
    particleTrails[index].color = newColor;
    createClickEffect(intersects[0].point);
    createParticleBurst(intersects[0].point, newColor);
  }
};

// Create visual click effect (existing code)
const createClickEffect = (position) => {
  const effectGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const effectMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  const effect = new THREE.Mesh(effectGeometry, effectMaterial);
  effect.position.copy(position);
  scene.add(effect);
  gsap.to(effect.scale, { x: 3, y: 3, z: 3, duration: 0.5 });
  gsap.to(effect.material, { 
    opacity: 0, 
    duration: 0.5, 
    onComplete: () => {
      scene.remove(effect);
      effectGeometry.dispose();
      effectMaterial.dispose();
    }
  });
};

// Create particle burst on click (existing code)
const createParticleBurst = (position, color) => {
  const particleCount = 20;
  const burstParticles = [];
  for (let i = 0; i < particleCount; i++) {
    const size = Math.random() * 0.05 + 0.02;
    const geometry = new THREE.SphereGeometry(size, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1);
    scene.add(particle);
    burstParticles.push({ mesh: particle, geometry: geometry, material: material, lifespan: 60, age: 0 });
  }
  const animateBurst = () => {
    if (burstParticles.length === 0) return;
    requestAnimationFrame(animateBurst);
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const particle = burstParticles[i];
      particle.age++;
      if (particle.age >= particle.lifespan) {
        scene.remove(particle.mesh);
        particle.geometry.dispose();
        particle.material.dispose();
        burstParticles.splice(i, 1);
        continue;
      }
      particle.mesh.position.add(particle.velocity);
      particle.velocity.multiplyScalar(0.95);
      const lifeRatio = particle.age / particle.lifespan;
      particle.material.opacity = 1 - lifeRatio;
    }
  };
  animateBurst();
};

// Add event listeners
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);

// Camera positioning
camera.position.z = 5;

// DOM elements for scrolling content
const createTextSection = (title, content, position) => {
  const section = document.createElement('div');
  section.className = 'section';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  if (position === 0) {
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    card.appendChild(titleEl);
    
    const contentEl = document.createElement('p');
    contentEl.innerHTML = content; // Use innerHTML to render links
    card.appendChild(contentEl);
    
    // Add social links
    const socialLinksEl = document.createElement('div');
    socialLinksEl.className = 'social-links';
    socialLinksEl.innerHTML = `
      <a href="https://github.com/saikothasan" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="https://t.me/drkingbd" target="_blank" rel="noopener noreferrer">Telegram</a>
    `;
    card.appendChild(socialLinksEl);
    
    const instructionsEl = document.createElement('p');
    instructionsEl.className = 'instructions';
    instructionsEl.textContent = 'Click and hover on the floating objects to see particle trails!';
    card.appendChild(instructionsEl);
  } else {
    const contentEl = document.createElement('div');
    contentEl.className = 'highlight-text';
    contentEl.textContent = content;
    section.appendChild(contentEl);
    return section;
  }
  
  section.appendChild(card);
  return section;
};

const contentWrapper = document.createElement('div');
contentWrapper.className = 'content';

const section1 = createTextSection(
  'Saikot Hasan', // Updated name
  '🚀 Welcome to my interactive portfolio!', // Updated welcome message
  0
);

const section2 = createTextSection(
  '',
  'I like making stuff and putting it on the internet',
  1
);

contentWrapper.appendChild(section1);
contentWrapper.appendChild(section2);
document.body.appendChild(contentWrapper);

// Scroll animation (existing code)
let scrollY = window.scrollY;
let currentSection = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / window.innerHeight);
  if (newSection !== currentSection) {
    currentSection = newSection;
    gsap.to(camera.position, { z: 5 - currentSection * 0.5, duration: 1.5, ease: 'power2.inOut' });
    gsap.to(starParticlesMesh.rotation, { x: starParticlesMesh.rotation.x + 0.2, y: starParticlesMesh.rotation.y + 0.3, duration: 1.5, ease: 'power2.inOut' });
    interactiveObjects.forEach((object) => {
      gsap.to(object.position, { z: object.position.z + (newSection > currentSection ? -0.5 : 0.5), duration: 1.5, ease: 'power2.inOut' });
    });
  }
});

// Mouse movement effect (existing code)
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Performance monitoring (existing code)
let frameCount = 0;
let lastTime = performance.now();
const fpsElement = document.createElement('div');
fpsElement.className = 'fps-counter';
document.body.appendChild(fpsElement);

// Toggle for particle trails (existing code)
let trailsEnabled = true;
const toggleTrailsButton = document.createElement('button');
toggleTrailsButton.className = 'toggle-trails';
toggleTrailsButton.textContent = 'Disable Trails';
toggleTrailsButton.addEventListener('click', () => {
  trailsEnabled = !trailsEnabled;
  toggleTrailsButton.textContent = trailsEnabled ? 'Disable Trails' : 'Enable Trails';
});
document.body.appendChild(toggleTrailsButton);

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime > 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    fpsElement.textContent = `${fps} FPS`;
    frameCount = 0;
    lastTime = currentTime;
  }
  
  starParticlesMesh.rotation.x += 0.0001; // Slower rotation for background stars
  starParticlesMesh.rotation.y += 0.00005;
  
  interactiveObjects.forEach((object, index) => {
    object.rotation.x += 0.005 + index * 0.0001; // Vary rotation speed
    object.rotation.y += 0.003 + index * 0.0001;
    object.position.y += Math.sin(Date.now() * 0.0005 + index) * 0.001; // Slower, varied floating
    if (trailsEnabled) particleTrails[index].update();
  });
  
  camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.1;
  camera.position.y += (mouseY * 0.05 - camera.position.y) * 0.1;
  
  renderer.render(scene, camera);
};

// Handle window resize (existing code)
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

animate();
