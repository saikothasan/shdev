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

// Interactive 3D Objects
const interactiveObjects = [];
const originalColors = [];
const originalScales = [];

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

    // Update original color
    const index = interactiveObjects.indexOf(object);
    originalColors[index] = newColor;

    // Create click effect
    createClickEffect(intersects[0].point);
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

// Add event listeners
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);

// Camera positioning
camera.position.z = 5;

// DOM elements for scrolling content (existing code)
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
    instructionsEl.textContent = 'Click and hover on the floating objects around you!';
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

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  
  // Rotate particles slowly
  particlesMesh.rotation.x += 0.0005;
  particlesMesh.rotation.y += 0.0003;
  
  // Animate interactive objects
  interactiveObjects.forEach((object, index) => {
    object.rotation.x += 0.01;
    object.rotation.y += 0.005;
    
    // Floating animation
    object.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
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

animate();
