import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("canvas.container3D");

// Coordinate display
const coordinateDisplay = document.createElement("div");
coordinateDisplay.style.position = "absolute";
coordinateDisplay.style.top = "10px";
coordinateDisplay.style.left = "10px";
coordinateDisplay.style.color = "white";
coordinateDisplay.style.fontFamily = "Arial, sans-serif";
coordinateDisplay.style.fontSize = "16px";
coordinateDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
coordinateDisplay.style.padding = "5px 10px";
coordinateDisplay.style.borderRadius = "5px";
document.body.appendChild(coordinateDisplay);

// FPS Counter
const fpsDisplay = document.createElement("div");
fpsDisplay.style.position = "absolute";
fpsDisplay.style.top = "10px";
fpsDisplay.style.right = "10px";
fpsDisplay.style.color = "white";
fpsDisplay.style.fontFamily = "Arial, sans-serif";
fpsDisplay.style.fontSize = "16px";
fpsDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
fpsDisplay.style.padding = "5px 10px";
fpsDisplay.style.borderRadius = "5px";
document.body.appendChild(fpsDisplay);

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const cameraOffset = new THREE.Vector3(0, 2, -5); // Adjust the position as needed
scene.add(camera);

const onResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", onResize);

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Load ground model
const gltfLoader = new GLTFLoader();
let groundMesh = null; // Store the ground mesh
gltfLoader.load("./models/ground2.glb", (gltf) => {
  groundMesh = gltf.scene.children[0]; // Assume the first child is the ground
  groundMesh.geometry.computeBoundingBox(); // Ensure bounding box is computed
  groundMesh.geometry.computeBoundingSphere();
  groundMesh.receiveShadow = true;
  scene.add(gltf.scene);
});

// Cube
const cubeSize = 1;
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

// Cube coordinates and physics properties
const cubeCoordinates = { x: 0, y: 0, z: 5 }; // Start at z=5
const velocity = { x: 0, y: 0, z: 0 }; // Initial velocity
const gravity = -0.05; // Gravity acceleration

// Position the cube
cube.position.set(cubeCoordinates.x, cubeCoordinates.z, cubeCoordinates.y);
scene.add(cube);

// Movement and rotation
const moveSpeed = 0.1;
const rotateSpeed = 0.05;
let moveDirection = 0; // -1 for backward, 1 for forward
let rotateDirection = 0; // -1 for left, 1 for right

document.addEventListener("keydown", (event) => {
  if (event.key === "w" || event.key === "W") moveDirection = 1;
  if (event.key === "s" || event.key === "S") moveDirection = -1;
  if (event.key === "a" || event.key === "A") rotateDirection = -1;
  if (event.key === "d" || event.key === "D") rotateDirection = 1;
});

document.addEventListener("keyup", (event) => {
  if (event.key === "w" || event.key === "W" || event.key === "s" || event.key === "S") moveDirection = 0;
  if (event.key === "a" || event.key === "A" || event.key === "d" || event.key === "D") rotateDirection = 0;
});

// Raycaster for ground collision detection
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3(0, -1, 0); // Downward direction

// FPS tracking
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

const animate = () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
  lastTime = currentTime;

  frameCount++;
  if (frameCount % 60 === 0) { // Update FPS every 60 frames
    fps = Math.round(1 / deltaTime);
    frameCount = 0;
  }

  orbitControls.update();

  // Apply gravity
  velocity.z += gravity;

  // Update cube's z position
  cubeCoordinates.z += velocity.z;

  // Use raycaster to detect ground height
  if (groundMesh) {
    raycaster.set(
      new THREE.Vector3(cubeCoordinates.x, cubeCoordinates.z + cubeSize / 2, cubeCoordinates.y),
      rayDirection
    );
    const intersects = raycaster.intersectObject(groundMesh);
    if (intersects.length > 0) {
      const groundHeight = intersects[0].point.y;

      // Collision detection with the ground
      if (cubeCoordinates.z - cubeSize / 2 <= groundHeight) {
        cubeCoordinates.z = groundHeight + cubeSize / 2; // Stop at ground level
        velocity.z = 0; // No bouncing
      }
    }
  }

  // Update rotation
  cube.rotation.y -= rotateDirection * rotateSpeed;

  // Update position (forward/backward in local direction)
  if (moveDirection !== 0) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cube.quaternion); // Local forward direction
    cubeCoordinates.x += forward.x * moveSpeed * moveDirection;
    cubeCoordinates.y += forward.z * moveSpeed * moveDirection; // Adjust for THREE.js coordinate system
  }

  // Update cube's position
  cube.position.set(cubeCoordinates.x, cubeCoordinates.z, cubeCoordinates.y);

  // Update camera position behind the cube
  camera.position.copy(cube.position).add(cameraOffset); // Move the camera behind the cube
  camera.lookAt(cube.position); // Make the camera look at the cube

  // Update coordinate display with angle between 0 and 360 degrees
  let angle = THREE.MathUtils.radToDeg(cube.rotation.y);
  angle = (angle + 360) % 360; // Normalize the angle between 0 and 360
  coordinateDisplay.innerText = `x: ${cubeCoordinates.x.toFixed(2)}, y: ${cubeCoordinates.y.toFixed(2)}, z: ${cubeCoordinates.z.toFixed(2)}, Angle: ${angle.toFixed(2)}º`;

  // Update FPS display
  fpsDisplay.innerText = `FPS: ${fps}`;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();