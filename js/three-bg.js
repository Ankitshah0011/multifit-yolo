// Three.js subtle gym-themed 3D background (hero only)
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.12);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  // Subtle lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));

  const keyLight = new THREE.PointLight(0xffd201, 1.5, 30);
  keyLight.position.set(5, 5, 8);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xffd201, 0.6, 20);
  fillLight.position.set(-5, -3, 6);
  scene.add(fillLight);

  // Dark metallic material — objects are background texture, not focal
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 1.0,
    roughness: 0.25,
    emissive: 0xffd201,
    emissiveIntensity: 0.015,
  });

  const goldEdge = new THREE.MeshStandardMaterial({
    color: 0xffd201,
    metalness: 0.9,
    roughness: 0.2,
    transparent: true,
    opacity: 0.15,
  });

  const objects = [];

  function addObj(geo, x, y, z, s, material) {
    const mesh = new THREE.Mesh(geo, material || mat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(s);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.004,
      ry: (Math.random() - 0.5) * 0.006,
      fs: 0.2 + Math.random() * 0.3,
      fa: 0.08 + Math.random() * 0.12,
      by: y,
    };
    scene.add(mesh);
    objects.push(mesh);
  }

  // Scattered geometric shapes — subtle, in the background
  const torus = new THREE.TorusGeometry(1, 0.3, 16, 32);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const oct = new THREE.OctahedronGeometry(0.7, 0);
  const cyl = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 12);

  addObj(torus, -4, 2, -5, 0.6);
  addObj(torus, 4.5, -1.5, -6, 0.5, goldEdge);
  addObj(box, -3, -2.5, -7, 0.8);
  addObj(box, 5, 3, -8, 0.6);
  addObj(oct, 2, 2.5, -4, 0.5, goldEdge);
  addObj(oct, -2, -1, -6, 0.7);
  addObj(cyl, 3.5, 0, -5, 0.6);
  addObj(cyl, -5, 1, -7, 0.5);
  addObj(torus, 0, -3, -8, 0.4, goldEdge);
  addObj(box, -1, 3.5, -9, 0.5);

  // Very subtle gold particles
  const pc = 50;
  const pp = new Float32Array(pc * 3);
  for (let i = 0; i < pc; i++) {
    pp[i * 3] = (Math.random() - 0.5) * 20;
    pp[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pp[i * 3 + 2] = -3 - Math.random() * 10;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({
    color: 0xffd201, size: 0.02, transparent: true, opacity: 0.25
  })));

  // Interaction
  let tx = 0, ty = 0;
  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    objects.forEach((m) => {
      m.rotation.x += m.userData.rx;
      m.rotation.y += m.userData.ry;
      m.position.y = m.userData.by + Math.sin(t * m.userData.fs) * m.userData.fa;
    });

    camera.position.x += (tx * 0.3 - camera.position.x) * 0.01;
    camera.position.y += (-ty * 0.2 - camera.position.y) * 0.01;
    camera.lookAt(0, 0, 0);

    keyLight.intensity = 1.3 + Math.sin(t * 0.5) * 0.2;

    renderer.render(scene, camera);
  }
  loop();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
