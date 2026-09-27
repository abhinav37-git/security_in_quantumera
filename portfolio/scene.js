import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene-canvas');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && !reduce) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0.2, 0.35, 6.2);

  scene.add(new THREE.AmbientLight(0xc5d0d4, 0.85));
  const key = new THREE.DirectionalLight(0xf7f4ee, 2.4);
  key.position.set(3.2, 4.2, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ebe8a, 0.9);
  rim.position.set(-3, 1.2, -2);
  scene.add(rim);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x5dba7a,
    transparent: true,
    opacity: 0.35
  });
  const rings = [2.15, 2.7].map((radius, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.006, 8, 96), ringMat);
    ring.rotation.x = Math.PI / (2.2 + i * 0.4);
    ring.rotation.y = i * 0.4;
    scene.add(ring);
    return ring;
  });

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const pivots = [];
  const loader = new GLTFLoader();
  const mount = (url, yOffset) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        root.position.sub(center);
        root.scale.setScalar(2.15 / Math.max(size.x, size.y, size.z));
        const pivot = new THREE.Group();
        pivot.userData.yOffset = yOffset;
        pivot.add(root);
        scene.add(pivot);
        pivots.push(pivot);
      },
      undefined,
      (error) => {
        console.warn(`[scene] 3D model could not be loaded from ${url}:`, error.message || error);
      }
    );
  };
  mount('assets/velith-node.glb', 0);

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const frame = () => {
    const t = clock.getElapsedTime();
    const span = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scroll = window.scrollY / span;
    const hero = document.querySelector('.hero');
    if (hero) {
      const bottom = hero.getBoundingClientRect().bottom;
      canvas.style.opacity = window.scrollY < 24
        ? '1'
        : String(Math.min(1, Math.max(0, (bottom - 64) / 240)));
    }
    pivots.forEach((pivot) => {
      pivot.rotation.y = t * 0.28 + pointer.x * 0.35;
      pivot.rotation.x = pointer.y * -0.12;
      pivot.position.x = 1.55 + pointer.x * 0.18;
      pivot.position.y = 0.55 - scroll * 5.5 + pointer.y * 0.12 + pivot.userData.yOffset;
    });
    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.08 + i * 0.03);
    });
    camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.05;
    camera.lookAt(0.4, 0.1, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

document.querySelectorAll('.product-card, .tech-card, .compare-col, .eco-card').forEach((card) => {
  if (reduce) return;
  let rafId = null;
  card.style.transition = 'transform 0.15s ease-out';
  card.style.willChange = 'transform';

  card.addEventListener('pointermove', (event) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-3px)`;
    });
  });

  card.addEventListener('pointerleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    card.style.transform = '';
  });
});
