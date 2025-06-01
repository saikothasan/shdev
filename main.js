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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;

const posArray = new Float32Array(particlesCount * 3);
const scaleArray = new Float32Array(particlesCount);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}

for (let i = 0; i < particlesCount; i++) {
  scaleArray[i] = Math.random();
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.05,
  color: 0xffffff,
  sizeAttenuation: true,
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Particle Trail System
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
    // Only emit particles if the object has moved
    const distanceMoved = this.parent.position.distanceTo(this.lastPosition);
    
    if (distanceMoved > 0.001) {
      this.frameCounter++;
      
      // Emit new particles based on emission rate
      if (this.frameCounter % this.emissionRate === 0) {
        this.emitParticle();
      }
      
      // Update last position
      this.lastPosition.copy(this.parent.position);
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age++;
      
      // Remove old particles
      if (particle.age >= this.particleLifespan) {
        this.scene.remove(particle.mesh);
        particle.geometry.dispose();
        particle.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update particle properties based on age
      const lifeRatio = particle.age / this.particleLifespan;
      particle.mesh.material.opacity = 1 - lifeRatio;
      particle.mesh.scale.multiplyScalar(0.98); // Shrink over time
    }
  }
  
  emitParticle() {
    // Create particle geometry
    const geometry = new THREE.SphereGeometry(this.particleSize, 4, 4);
    
    // Create particle material with parent's color
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 1,
    });
    
    // Create mesh and position it at parent's position
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.parent.position);
    
    // Add small random offset for more natural look
    mesh.position.x += (Math.random() - 0.5) * 0.05;
    mesh.position.y += (Math.random() - 0.5) * 0.05;
    mesh.position.z += (Math.random() - 0.5) * 0.05;
    
    // Add to scene
    this.scene.add(mesh);
    
    // Store particle data
    this.particles.push({
      mesh,
      geometry,
      material,
      age: 0
    });
    
    // Limit number of particles
    if (this.particles.length > this.maxParticles) {
      const oldestParticle = this.particles.shift();
      this.scene.remove(oldestParticle.mesh);
      oldestParticle.geometry.dispose();
      oldestParticle.material.dispose();
    }
  }
  
  // Clean up all particles
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
  // Cube
  const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(-2, 1, 2);
  cube.userData = { type: 'cube', originalColor: 0x00ff88, clickCount: 0 };
  scene.add(cube);
  interactiveObjects.push(cube);
  originalColors.push(0x00ff88);
  originalScales.push(1);
  particleTrails.push(new ParticleTrail(cube, 0x00ff88, scene));

  // Sphere
  const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(2, -1, 1.5);
  sphere.userData = { type: 'sphere', originalColor: 0xff6b6b, clickCount: 0 };
  scene.add(sphere);
  interactiveObjects.push(sphere);
  originalColors.push(0xff6b6b);
  originalScales.push(1);
  particleTrails.push(new ParticleTrail(sphere, 0xff6b6b, scene));

  // Torus
  const torusGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100);
  const torusMaterial = new THREE.MeshLambertMaterial({ color: 0x4ecdc4 });
  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.position.set(0, 2, 1);
  torus.userData = { type: 'torus', originalColor: 0x4ecdc4, clickCount: 0 };
  scene.add(torus);
  interactiveObjects.push(torus);
  originalColors.push(0x4ecdc4);
  originalScales.push(1);
  particleTrails.push(new ParticleTrail(torus, 0x4ecdc4, scene));

  // Octahedron
  const octaGeometry = new THREE.OctahedronGeometry(0.4);
  const octaMaterial = new THREE.MeshLambertMaterial({ color: 0xffd93d });
  const octahedron = new THREE.Mesh(octaGeometry, octaMaterial);
  octahedron.position.set(-1.5, -2, 2.5);
  octahedron.userData = { type: 'octahedron', originalColor: 0xffd93d, clickCount: 0 };
  scene.add(octahedron);
  interactiveObjects.push(octahedron);
  originalColors.push(0xffd93d);
  originalScales.push(1);
  particleTrails.push(new ParticleTrail(octahedron, 0xffd93d, scene));

  // Cone
  const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
  const coneMaterial = new THREE.MeshLambertMaterial({ color: 0xa8e6cf });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.position.set(1.5, 0.5, 3);
  cone.userData = { type: 'cone', originalColor: 0xa8e6cf, clickCount: 0 };
  scene.add(cone);
  interactiveObjects.push(cone);
  originalColors.push(0xa8e6cf);
  originalScales.push(1);
  particleTrails.push(new ParticleTrail(cone, 0xa8e6cf, scene));
};

createInteractiveObjects();

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;

// Mouse interaction handlers
const onMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects);

  // Reset previously hovered object
  if (hoveredObject && !intersects.find(intersect => intersect.object === hoveredObject)) {
    const index = interactiveObjects.indexOf(hoveredObject);
    hoveredObject.material.color.setHex(originalColors[index]);
    gsap.to(hoveredObject.scale, { x: originalScales[index], y: originalScales[index], z: originalScales[index], duration: 0.3 });
    document.body.style.cursor = 'default';
    hoveredObject = null;
  }

  // Handle new hover
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
    
    // Different animations based on object type
    switch (object.userData.type) {
      case 'cube':
        gsap.to(object.rotation, { 
          x: object.rotation.x + Math.PI, 
          y: object.rotation.y + Math.PI, 
          duration: 1, 
          ease: 'bounce.out' 
        });
        // Increase particle emission during animation
        const cubeTrail = particleTrails[interactiveObjects.indexOf(object)];
        cubeTrail.emissionRate = 1; // Emit more particles
        setTimeout(() => { cubeTrail.emissionRate = 3; }, 1000); // Reset after animation
        break;
      case 'sphere':
        gsap.to(object.position, { 
          y: object.position.y + 0.5, 
          duration: 0.5, 
          yoyo: true, 
          repeat: 1, 
          ease: 'power2.out' 
        });
        break;
      case 'torus':
        gsap.to(object.rotation, { 
          z: object.rotation.z + Math.PI * 2, 
          duration: 1, 
          ease: 'power2.inOut' 
        });
        break;
      case 'octahedron':
        gsap.to(object.scale, { 
          x: 1.5, y: 1.5, z: 1.5, 
          duration: 0.3, 
          yoyo: true, 
          repeat: 1, 
          ease: 'elastic.out' 
        });
        break;
      case 'cone':
        gsap.to(object.rotation, { 
          x: object.rotation.x + Math.PI * 2, 
          duration: 1.5, 
          ease: 'power1.inOut' 
        });
        break;
    }

    // Color change based on click count
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    const newColor = colors[object.userData.clickCount % colors.length];
    gsap.to(object.material.color, { 
      r: ((newColor >> 16) & 255) / 255,
      g: ((newColor >> 8) & 255) / 255,
      b: (newColor & 255) / 255,
      duration: 0.5 
    });

    // Update original color and particle trail color
    const index = interactiveObjects.indexOf(object);
    originalColors[index] = newColor;
    particleTrails[index].color = newColor;

    // Create click effect
    createClickEffect(intersects[0].point);
    
    // Create burst of particles
    createParticleBurst(intersects[0].point, newColor);
  }
};

// Create visual click effect
const createClickEffect = (position) => {
  const effectGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const effectMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 1 
  });
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

// Create burst of particles on click
const createParticleBurst = (position, color) => {
  const particleCount = 20;
  const burstParticles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const size = Math.random() * 0.05 + 0.02;
    const geometry = new THREE.SphereGeometry(size, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    });
    
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    
    // Random velocity
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    
    scene.add(particle);
    burstParticles.push({
      mesh: particle,
      geometry: geometry,
      material: material,
      lifespan: 60,
      age: 0
    });
  }
  
  // Animation loop for burst particles
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
      
      // Update position based on velocity
      particle.mesh.position.add(particle.velocity);
      
      // Slow down over time
      particle.velocity.multiplyScalar(0.95);
      
      // Fade out
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
    contentEl.innerHTML = content;
    card.appendChild(contentEl);
    
    // Add instructions for interactive objects
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
  'Jeff Delaney',
  '🚀 Welcome to my interactive website!',
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

// Scroll animation
let scrollY = window.scrollY;
let currentSection = 0;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / window.innerHeight);
  
  if (newSection !== currentSection) {
    currentSection = newSection;
    
    // Animate camera based on scroll position
    gsap.to(camera.position, {
      z: 5 - currentSection * 0.5,
      duration: 1.5,
      ease: 'power2.inOut'
    });
    
    gsap.to(particlesMesh.rotation, {
      x: particlesMesh.rotation.x + 0.2,
      y: particlesMesh.rotation.y + 0.3,
      duration: 1.5,
      ease: 'power2.inOut'
    });

    // Move interactive objects based on scroll
    interactiveObjects.forEach((object, index) => {
      gsap.to(object.position, {
        z: object.position.z + (newSection > currentSection ? -0.5 : 0.5),
        duration: 1.5,
        ease: 'power2.inOut'
      });
    });
  }
});

// Mouse movement effect
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Performance monitoring
let frameCount = 0;
let lastTime = performance.now();
const fpsElement = document.createElement('div');
fpsElement.className = 'fps-counter';
document.body.appendChild(fpsElement);

// Toggle for particle trails
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
  
  // FPS counter
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime > 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    fpsElement.textContent = `${fps} FPS`;
    frameCount = 0;
    lastTime = currentTime;
  }
  
  // Rotate particles slowly
  particlesMesh.rotation.x += 0.0005;
  particlesMesh.rotation.y += 0.0003;
  
  // Animate interactive objects
  interactiveObjects.forEach((object, index) => {
    object.rotation.x += 0.01;
    object.rotation.y += 0.005;
    
    // Floating animation
    object.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
    
    // Update particle trails
    if (trailsEnabled) {
      particleTrails[index].update();
    }
  });
  
  // Subtle camera movement based on mouse position
  camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.1;
  camera.position.y += (mouseY * 0.05 - camera.position.y) * 0.1;
  
  renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Clean up function for when the component unmounts
const cleanup = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('click', onMouseClick);
  
  // Dispose of all particle trails
  particleTrails.forEach(trail => trail.dispose());
};

animate();
