import * as THREE from 'three';

// Atmospheric firefly / forest-dust layer rendered on a fixed transparent
// canvas (mix-blend: screen) above the whole page.
export function initFireflies(canvas) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particles: positions + per-particle phase/scale packed into attributes
  const COUNT = 140;
  const positions = new Float32Array(COUNT * 3);
  const aPhase = new Float32Array(COUNT);
  const aScale = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 22;      // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;  // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;   // z
    aPhase[i] = Math.random() * Math.PI * 2;
    aScale[i] = 0.4 + Math.random() * 1.1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(aScale, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aPhase;
      attribute float aScale;
      varying float vTwinkle;

      void main() {
        vec3 p = position;
        // slow sinusoidal drift, unique per particle
        p.x += sin(uTime * 0.18 + aPhase) * 0.9;
        p.y += sin(uTime * 0.12 + aPhase * 1.7) * 0.6 + cos(uTime * 0.07 + aPhase) * 0.4;
        p.z += cos(uTime * 0.15 + aPhase * 0.9) * 0.5;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        vTwinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aScale * 0.5) + aPhase * 3.0));
        gl_PointSize = aScale * 42.0 * uPixelRatio * vTwinkle / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTwinkle;

      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        float glow = pow(1.0 - smoothstep(0.0, 0.5, d), 2.2);
        vec3 amber = vec3(1.0, 0.70, 0.25);
        gl_FragColor = vec4(amber, glow * vTwinkle * 0.85);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const clock = new THREE.Clock();
  let rafId;

  function animate() {
    rafId = requestAnimationFrame(animate);
    material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduceMotion.matches) {
    animate();
  } else {
    renderer.render(scene, camera); // one static frame
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  });

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else if (!reduceMotion.matches) {
      clock.getDelta();
      animate();
    }
  });
}
