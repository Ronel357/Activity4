import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
const debugObject = {}; // Create the debugObject to store the properties for the GUI

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader(); // Add CubeTextureLoader for environment map

/**
 * Environment map (this is important for realistic light bounce)
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg",
]);

// Apply environment map to the scene's background
scene.background = environmentMap; // Set the scene's background to the environment map
scene.environment = environmentMap; // Set the environment map for realistic lighting on all objects

// Ensure the environment map is using sRGB encoding for accurate color rendering
environmentMap.encoding = THREE.sRGBEncoding;

/**
 * Directional Light (important for control and shadow)
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3); // Set intensity to 3
directionalLight.position.set(0.25, 3, -2.25);
directionalLight.castShadow = true; // Enable shadows for the light
scene.add(directionalLight);

// Set up shadow properties
directionalLight.shadow.mapSize.width = 1024; // Default is 512
directionalLight.shadow.mapSize.height = 1024; // Default is 512
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.bias = -0.005; // To avoid shadow acne

// Dat.GUI controls for light intensity and position
gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightZ");

/**
 * Models
 */
gltfLoader.load(
  "/models/FlightHelmet/glTF/FlightHelmet.gltf", // Path to your model
  (gltf) => {
    // Scale, position, and rotate the model
    gltf.scene.scale.set(10, 10, 10); // Increase scale if model is too small
    gltf.scene.position.set(0, -4, 0); // Move model down for better view
    gltf.scene.rotation.y = Math.PI * 0.5; // Rotate model 90 degrees around Y-axis

    // Add the model to the scene
    scene.add(gltf.scene);

    // Add rotation control to Dat.GUI
    gui
      .add(gltf.scene.rotation, "y")
      .min(-Math.PI)
      .max(Math.PI)
      .step(0.001)
      .name("rotation");
  },
  (xhr) => {
    // Log loading progress
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    // Handle loading error
    console.error("Error loading model:", error);
  }
);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 10);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Enable physically correct lighting
renderer.physicallyCorrectLights = true; // Enable physically-based lighting

// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Set output encoding for better color accuracy
renderer.outputEncoding = THREE.sRGBEncoding; // Set the output encoding to sRGB

/**
 * Dat.GUI control for envMapIntensity
 */
// Initialize envMapIntensity in the debugObject
debugObject.envMapIntensity = 2.5; // Set initial intensity

// Add the envMapIntensity control to the GUI
gui
  .add(debugObject, "envMapIntensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("envMapIntensity")
  .onChange(() => {
    // Apply the updated envMapIntensity to all materials when changed
    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.material.envMapIntensity = debugObject.envMapIntensity;
      }
    });
  });

/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
