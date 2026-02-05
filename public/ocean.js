// marl0 ocean — mar (ocean) + l (level) + 0 (base layer)
// Muted, high-fidelity wave simulation. Camera near water, 45° down, faint overhead light.

(function () {
  const canvas = document.getElementById('ocean-canvas');
  if (!canvas) return;

  // Lazy-load Three.js from CDN
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r170/three.min.js';
  script.onload = init;
  document.head.appendChild(script);

  function init() {
    const THREE = window.THREE;
    if (!THREE) return;

    // --- Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.4;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020208, 0.035);

    // Camera: near the water, looking down at ~45°
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 3.5, 8);
    camera.lookAt(0, 0, -4);

    // --- Light: faint overhead, slightly warm ---
    const light = new THREE.DirectionalLight(0xd4d0ff, 0.25);
    light.position.set(2, 15, -5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x080818, 0.4);
    scene.add(ambient);

    // Faint point light for specular highlight on water
    const pointLight = new THREE.PointLight(0x8888cc, 0.15, 40);
    pointLight.position.set(0, 8, -2);
    scene.add(pointLight);

    // --- Water shader ---
    const waterGeo = new THREE.PlaneGeometry(60, 60, 256, 256);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLightPos: { value: new THREE.Vector3(2, 15, -5) },
        uCameraPos: { value: camera.position },
        uDeepColor: { value: new THREE.Color(0x020210) },
        uShallowColor: { value: new THREE.Color(0x0a0a2a) },
        uSpecColor: { value: new THREE.Color(0x445577) },
        uFogColor: { value: new THREE.Color(0x020208) },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vElevation;

        // Simplex-ish noise via sin combinations (Gerstner-inspired)
        vec3 gerstnerWave(vec3 pos, float t) {
          float e = 0.0;
          vec3 n = vec3(0.0, 1.0, 0.0);

          // Layer 1: broad swell
          float w1 = sin(pos.x * 0.3 + t * 0.4) * cos(pos.z * 0.2 + t * 0.3) * 0.35;
          // Layer 2: medium waves
          float w2 = sin(pos.x * 0.8 + pos.z * 0.6 + t * 0.7) * 0.15;
          // Layer 3: cross waves
          float w3 = sin(pos.x * 0.5 - pos.z * 0.9 + t * 0.5) * 0.12;
          // Layer 4: small detail
          float w4 = sin(pos.x * 2.1 + t * 1.2) * cos(pos.z * 1.8 + t * 0.9) * 0.04;
          // Layer 5: fine ripple
          float w5 = sin(pos.x * 4.0 + pos.z * 3.5 + t * 2.0) * 0.015;
          // Layer 6: very fine
          float w6 = sin(pos.x * 7.0 - pos.z * 5.0 + t * 3.0) * 0.008;

          e = w1 + w2 + w3 + w4 + w5 + w6;

          // Compute normal via finite differences
          float eps = 0.05;
          float ex = 0.0;
          float ez = 0.0;

          // dx
          vec3 px = pos + vec3(eps, 0.0, 0.0);
          ex = sin(px.x*0.3+t*0.4)*cos(px.z*0.2+t*0.3)*0.35
             + sin(px.x*0.8+px.z*0.6+t*0.7)*0.15
             + sin(px.x*0.5-px.z*0.9+t*0.5)*0.12
             + sin(px.x*2.1+t*1.2)*cos(px.z*1.8+t*0.9)*0.04
             + sin(px.x*4.0+px.z*3.5+t*2.0)*0.015
             + sin(px.x*7.0-px.z*5.0+t*3.0)*0.008;

          // dz
          vec3 pz = pos + vec3(0.0, 0.0, eps);
          ez = sin(pz.x*0.3+t*0.4)*cos(pz.z*0.2+t*0.3)*0.35
             + sin(pz.x*0.8+pz.z*0.6+t*0.7)*0.15
             + sin(pz.x*0.5-pz.z*0.9+t*0.5)*0.12
             + sin(pz.x*2.1+t*1.2)*cos(pz.z*1.8+t*0.9)*0.04
             + sin(pz.x*4.0+pz.z*3.5+t*2.0)*0.015
             + sin(pz.x*7.0-pz.z*5.0+t*3.0)*0.008;

          n = normalize(vec3(-(ex - e) / eps, 1.0, -(ez - e) / eps));

          pos.y += e;
          vElevation = e;
          vNormal = n;
          vWorldPos = pos;
          return pos;
        }

        void main() {
          vec3 pos = gerstnerWave(position, uTime);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uLightPos;
        uniform vec3 uCameraPos;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uSpecColor;
        uniform vec3 uFogColor;
        uniform float uTime;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vElevation;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 L = normalize(uLightPos - vWorldPos);
          vec3 V = normalize(uCameraPos - vWorldPos);
          vec3 H = normalize(L + V);

          // Diffuse
          float diff = max(dot(N, L), 0.0) * 0.3;

          // Specular — tight, subtle
          float spec = pow(max(dot(N, H), 0.0), 256.0) * 0.6;

          // Fresnel — more reflection at glancing angles
          float fresnel = pow(1.0 - max(dot(V, N), 0.0), 4.0);

          // Color: mix deep/shallow based on elevation + fresnel
          vec3 waterColor = mix(uDeepColor, uShallowColor, fresnel * 0.5 + vElevation * 0.3 + 0.2);

          // Add diffuse and specular
          vec3 color = waterColor * (0.15 + diff) + uSpecColor * spec * fresnel;

          // Very subtle caustic-like shimmer
          float shimmer = sin(vWorldPos.x * 8.0 + uTime * 1.5) * sin(vWorldPos.z * 6.0 + uTime * 1.1);
          color += vec3(0.01, 0.01, 0.02) * shimmer * shimmer * fresnel;

          // Distance fog
          float dist = length(vWorldPos - uCameraPos);
          float fogFactor = 1.0 - exp(-dist * 0.035 * dist * 0.035);
          color = mix(color, uFogColor, fogFactor);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const water = new THREE.Mesh(waterGeo, waterMat);
    scene.add(water);

    // --- Animation ---
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.008;

      waterMat.uniforms.uTime.value = time;

      // Very subtle camera sway
      camera.position.y = 3.5 + Math.sin(time * 0.3) * 0.08;
      camera.position.x = Math.sin(time * 0.15) * 0.3;

      renderer.render(scene, camera);
    }

    // --- Resize ---
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
  }
})();
