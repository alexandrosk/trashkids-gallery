import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

class SprayPaintSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isSpraySpraying = false;
    this.sprayables = []; // walls and other surfaces that can be painted
    this.decals = [];
    this.particles = [];

    // Spray paint settings
    this.currentColor = new THREE.Color(0xff0000); // Default red
    this.spraySize = 0.5;
    this.sprayOpacity = 0.7;
    this.sprayInterval = 50; // ms between sprays when holding
    this.lastSprayTime = 0;
    this.enabled = true;

    // Create decal material
    this.decalMaterial = new THREE.MeshStandardMaterial({
      color: this.currentColor,
      transparent: true,
      opacity: this.sprayOpacity,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      wireframe: false,
    });

    // Create spray particle system
    this.setupParticleSystem();

    // Bind methods
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    // Add event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
  }

  setupParticleSystem() {
    // Create particle geometry for spray effect
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const lifetimes = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3());
      lifetimes.push(0);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: this.currentColor,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.particleVelocities = velocities;
    this.particleLifetimes = lifetimes;
    this.particleSystem.visible = false;
    this.scene.add(this.particleSystem);
  }

  addSprayable(object) {
    this.sprayables.push(object);
  }

  addSprayableGroup(group) {
    group.children.forEach(child => {
      this.sprayables.push(child);
    });
  }

  onMouseDown(event) {
    if (event.button === 0 && this.enabled) { // Left click
      this.isSpraySpraying = true;
      this.spray();
    }
  }

  onMouseUp(event) {
    if (event.button === 0) {
      this.isSpraySpraying = false;
      this.particleSystem.visible = false;
    }
  }

  onMouseMove(event) {
    // Update mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  spray() {
    if (!this.enabled) return;

    const currentTime = Date.now();

    // Check if enough time has passed since last spray
    if (currentTime - this.lastSprayTime < this.sprayInterval) {
      return;
    }

    this.lastSprayTime = currentTime;

    // Cast ray from camera
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.sprayables);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const { point, face, object } = intersection;

      // Create spray decal at intersection point
      this.createDecal(point, face.normal, object);

      // Emit particles
      this.emitParticles(point, face.normal);
    }
  }

  createDecal(position, normal, targetObject) {
    // Random rotation for natural spray pattern
    const rotation = Math.random() * Math.PI * 2;

    // Slightly randomize size for organic look
    const size = this.spraySize * (0.8 + Math.random() * 0.4);

    // Create orientation from normal
    const orientation = new THREE.Euler();
    orientation.set(0, 0, rotation);

    try {
      // Create decal geometry
      const decalGeometry = new DecalGeometry(
        targetObject,
        position,
        orientation,
        new THREE.Vector3(size, size, size)
      );

      // Clone material with current color
      const material = this.decalMaterial.clone();
      material.color = this.currentColor.clone();

      // Create decal mesh
      const decalMesh = new THREE.Mesh(decalGeometry, material);
      this.scene.add(decalMesh);
      this.decals.push(decalMesh);

      // Optional: limit number of decals for performance
      if (this.decals.length > 500) {
        const oldDecal = this.decals.shift();
        this.scene.remove(oldDecal);
        oldDecal.geometry.dispose();
        oldDecal.material.dispose();
      }
    } catch (error) {
      console.warn('Could not create decal:', error);
    }
  }

  emitParticles(position, normal) {
    this.particleSystem.visible = true;
    this.particleSystem.position.copy(position);

    // Reset particles with random velocities
    const positions = this.particleSystem.geometry.attributes.position.array;

    for (let i = 0; i < this.particleVelocities.length; i++) {
      // Random spray cone
      const spreadAngle = 0.3;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * spreadAngle,
        (Math.random() - 0.5) * spreadAngle,
        -0.5
      );

      // Orient towards surface normal
      velocity.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.atan2(normal.y, normal.z));
      velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(normal.x, normal.z));

      this.particleVelocities[i].copy(velocity);
      this.particleLifetimes[i] = Math.random() * 0.5 + 0.3;

      // Reset position
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  update(delta) {
    // Continue spraying if mouse is held down
    if (this.isSpraySpraying) {
      this.spray();
    }

    // Update particles
    if (this.particleSystem.visible) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      let allDead = true;

      for (let i = 0; i < this.particleVelocities.length; i++) {
        this.particleLifetimes[i] -= delta;

        if (this.particleLifetimes[i] > 0) {
          allDead = false;
          positions[i * 3] += this.particleVelocities[i].x * delta;
          positions[i * 3 + 1] += this.particleVelocities[i].y * delta;
          positions[i * 3 + 2] += this.particleVelocities[i].z * delta;
        }
      }

      if (allDead && !this.isSpraySpraying) {
        this.particleSystem.visible = false;
      }

      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Update particle color to match current spray color
    this.particleSystem.material.color = this.currentColor;
  }

  setColor(color) {
    this.currentColor = new THREE.Color(color);
    this.decalMaterial.color = this.currentColor;
  }

  setSize(size) {
    this.spraySize = size;
  }

  setOpacity(opacity) {
    this.sprayOpacity = opacity;
    this.decalMaterial.opacity = opacity;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.isSpraySpraying = false;
  }

  clearAllGraffiti() {
    this.decals.forEach(decal => {
      this.scene.remove(decal);
      decal.geometry.dispose();
      decal.material.dispose();
    });
    this.decals = [];
  }

  dispose() {
    // Clean up event listeners
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);

    // Clean up decals
    this.clearAllGraffiti();

    // Clean up particle system
    this.scene.remove(this.particleSystem);
    this.particleSystem.geometry.dispose();
    this.particleSystem.material.dispose();
  }
}

export { SprayPaintSystem };
