'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function LandingThreeBackground() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.dataset.engine = `three.js r${THREE.REVISION}`;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(18, 10, 150, 90);
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const basePositions = new Float32Array(positionAttr.array as Float32Array);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#2a2f37'),
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMaterial);
    scene.add(wireMesh);

    const glowGeometry = new THREE.PlaneGeometry(18, 10, 1, 1);
    const glowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#4d5e77') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          float pulse = 0.5 + 0.5 * sin(uTime * 0.4);
          float vignette = smoothstep(1.0, 0.18, distance(vUv, vec2(0.5)));
          float stripe = 0.5 + 0.5 * sin((vUv.x + vUv.y * 0.4) * 18.0 + uTime * 0.8);
          float alpha = vignette * (0.05 + stripe * 0.05 + pulse * 0.03);
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.z = -0.3;
    scene.add(glowMesh);

    const resize = () => {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();
      const array = positionAttr.array as Float32Array;

      for (let i = 0; i < positionAttr.count; i += 1) {
        const idx = i * 3;
        const x = basePositions[idx];
        const y = basePositions[idx + 1];
        array[idx + 2] =
          Math.sin(x * 1.35 + t * 0.9) * 0.16 +
          Math.cos(y * 1.8 + t * 0.65) * 0.12;
      }

      positionAttr.needsUpdate = true;
      wireMesh.rotation.z = Math.sin(t * 0.12) * 0.08;
      glowMaterial.uniforms.uTime.value = t;
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      wireMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className="landing-three-bg" aria-hidden="true" />;
}
