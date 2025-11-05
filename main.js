import * as THREE from "three";
import { scene, setupScene } from "./modules/scene.js";
import { createPaintings } from "./modules/paintings.js";
import { createWalls } from "./modules/walls.js";
import { setupLighting } from "./modules/lighting.js";
import { setupFloor } from "./modules/floor.js";
import { createCeiling } from "./modules/ceiling.js";
import { createBoundingBoxes } from "./modules/boundingBox.js";
import { setupRendering } from "./modules/rendering.js";
import { setupEventListeners } from "./modules/eventListeners.js";
import { addObjectsToScene } from "./modules/sceneHelpers.js";
import { setupPlayButton } from "./modules/menu.js";
import { setupAudio } from "./modules/audioGuide.js";
import { clickHandling } from "./modules/clickHandling.js";
import { setupVR } from "./modules/VRSupport.js";
import { loadStatueModel } from "./modules/statue.js";
import { loadBenchModel } from "./modules/bench.js";
import { loadCeilingLampModel } from "./modules/ceilingLamp.js";
import { SprayPaintSystem } from "./modules/sprayPaint.js";
import { setupSprayUI } from "./modules/sprayUI.js";

let { camera, controls, renderer } = setupScene();

setupAudio(camera);

const textureLoader = new THREE.TextureLoader();

const walls = createWalls(scene, textureLoader);
const floor = setupFloor(scene);
const ceiling = createCeiling(scene, textureLoader);
const paintings = createPaintings(scene, textureLoader);
const lighting = setupLighting(scene, paintings);

createBoundingBoxes(walls);
createBoundingBoxes(paintings);

addObjectsToScene(scene, paintings);

setupPlayButton(controls);

setupEventListeners(controls);

clickHandling(renderer, camera, paintings);

loadStatueModel(scene);

loadBenchModel(scene);

loadCeilingLampModel(scene);

setupVR(renderer);

// Setup Spray Paint System
const spraySystem = new SprayPaintSystem(scene, camera, renderer);

// Add all sprayable surfaces
spraySystem.addSprayableGroup(walls); // Add all walls
spraySystem.addSprayable(floor); // Add floor
spraySystem.addSprayable(ceiling); // Add ceiling

// Setup spray paint UI controls
setupSprayUI(spraySystem);

// Setup rendering with spray system
setupRendering(scene, camera, renderer, paintings, controls, walls, spraySystem);

// Export spray system
export { spraySystem };
