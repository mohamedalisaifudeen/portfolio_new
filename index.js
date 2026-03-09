const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = -100, my = -100, rx = -100, ry = -100;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
(function animateRing(){
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(animateRing);
})();

/* =============================================
   NAVBAR SCROLL EFFECT
============================================= */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

/* =============================================
   SCROLL REVEAL
============================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =============================================
   THREE.JS HERO SCENE
   — Procedural floating particles + 
     glowing wire-frame icosahedron
============================================= */
(function initThree(){
  const canvas   = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  /* — Particles — */
  const PARTICLE_COUNT = 1800;
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const colors     = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = [];

  for(let i = 0; i < PARTICLE_COUNT; i++){
    const spread = 14;
    positions[i*3+0] = (Math.random() - 0.5) * spread;
    positions[i*3+1] = (Math.random() - 0.5) * spread;
    positions[i*3+2] = (Math.random() - 0.5) * spread;
    velocities.push(
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.004,
      (Math.random() - 0.5) * 0.003
    );
    // Red-to-white color range
    const t = Math.random();
    colors[i*3+0] = 0.7 + t * 0.3;         // R
    colors[i*3+1] = t * 0.1;               // G
    colors[i*3+2] = t * 0.08;              // B
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

  const pMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* — Glowing wire-frame icosahedron — */
  const icoGeo = new THREE.IcosahedronGeometry(1.8, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0xe8223a,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);

  /* — Outer shell — */
  const outerGeo = new THREE.IcosahedronGeometry(2.6, 1);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0xff3050,
    wireframe: true,
    transparent: true,
    opacity: 0.06
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  scene.add(outer);

  /* — Mouse parallax — */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* — Animation loop — */
  let t = 0;
  function animate(){
    requestAnimationFrame(animate);
    t += 0.007;

    // Rotate geometry
    ico.rotation.x   = t * 0.3;
    ico.rotation.y   = t * 0.18;
    outer.rotation.x = -t * 0.12;
    outer.rotation.y =  t * 0.22;

    // Parallax camera
    camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // Drift particles
    const pos = pGeo.attributes.position;
    for(let i = 0; i < PARTICLE_COUNT; i++){
      pos.array[i*3+0] += velocities[i*3+0];
      pos.array[i*3+1] += velocities[i*3+1];
      pos.array[i*3+2] += velocities[i*3+2];

      // Wrap around boundary
      for(let d = 0; d < 3; d++){
        if(pos.array[i*3+d] >  7) pos.array[i*3+d] = -7;
        if(pos.array[i*3+d] < -7) pos.array[i*3+d] =  7;
      }
    }
    pos.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  /* — Resize — */
  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
})();