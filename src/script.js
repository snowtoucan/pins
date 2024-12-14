import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("canvas.container3D");

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 20, 10);
scene.add(camera);

const onResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", onResize);

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true; // Smooth camera movement
orbitControls.dampingFactor = 0.25; // Adjust damping factor
orbitControls.screenSpacePanning = true; // Enable panning
orbitControls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Load ground GLTF
const gltfLoader = new GLTFLoader();
let groundMesh = null; // Store the ground mesh
gltfLoader.load("./models/ground3.glb", (gltf) => {
  groundMesh = gltf.scene.children[0]; // Assume the first child is the ground
  groundMesh.geometry.computeBoundingBox(); // Ensure bounding box is computed
  groundMesh.geometry.computeBoundingSphere();
  groundMesh.receiveShadow = true;
  scene.add(gltf.scene);
});

// Cube
const cubeSize = 1;
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red (Front)
  new THREE.MeshBasicMaterial({ color: 0xff7f00 }), // Orange (Back)
  new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Yellow (Top)
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green (Bottom)
  new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue (Left)
  new THREE.MeshBasicMaterial({ color: 0x800080 }), // Purple (Right)
];
const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
const cubeCoordinates = { x: 0, y: 20, z: 0 }; // Initial coordinates
const cubeVelocity = { x: 0, y: 0, z: 0 }; // Initial velocity
const cubeAcceleration = 0.5;
const maxSpeed = 6; // Max speed of the cube
const gravity = -50;
cube.position.set(cubeCoordinates.x, cubeCoordinates.y, cubeCoordinates.z);
scene.add(cube);

const forwardVector = new THREE.Vector3(0, 0, 1); // Initially pointing along the Z axis
const origin = new THREE.Vector3(0, 0, 0);
const arrowHelper = new THREE.ArrowHelper(forwardVector.clone().normalize(), origin, 5, 0x00ff00); // Length of 5, green color
scene.add(arrowHelper);

const fvAcceleration = 0.1;
const fvFBLR = { FB: 0, LR: 0 };
const fvMax = 1;

// Movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

window.addEventListener("keydown", (event) => {
  if (event.key === "w") moveForward = true;
  if (event.key === "s") moveBackward = true;
  if (event.key === "a") moveLeft = true;
  if (event.key === "d") moveRight = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "w") moveForward = false;
  if (event.key === "s") moveBackward = false;
  if (event.key === "a") moveLeft = false;
  if (event.key === "d") moveRight = false;
});

function getCameraDirection(camera) {
  // Get the camera's forward direction and project it onto the XZ plane
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection); // Get the camera's forward direction
  cameraDirection.y = 0; // Remove the Y component to keep movement in the horizontal plane
  cameraDirection.normalize(); // Normalize the vector
  return cameraDirection;
}

function rotateVector(vector, axis, angle) {
  const quaternion = new THREE.Quaternion(); // Create a quaternion
  quaternion.setFromAxisAngle(axis, angle);  // Define the rotation using axis and angle
  vector.applyQuaternion(quaternion);        // Apply the rotation to the vector
}

// Raycaster for ground collision detection
const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3(0, -1, 0); // Downward direction

// Timing
let lastTime = performance.now();

const animate = () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
  lastTime = currentTime;

  orbitControls.update();

  const angleFBLR = Math.atan2(fvFBLR.LR, fvFBLR.FB);

  // Movement update
  if (moveForward && Math.abs(fvFBLR.FB) < fvMax) {
    fvFBLR.FB += fvAcceleration;
  } else if (moveBackward && Math.abs(fvFBLR.FB) < fvMax) {
    fvFBLR.FB -= fvAcceleration;
  }
  if (moveLeft && Math.abs(fvFBLR.LR) < fvMax) {
    fvFBLR.LR += fvAcceleration;
  } else if (moveRight && Math.abs(fvFBLR.LR) < fvMax) {
    fvFBLR.LR -= fvAcceleration;
  }
  
  const friction = fvAcceleration; // Apply some friction to decelerate movement gradually
  if (!moveForward && !moveBackward) {
    fvFBLR.FB = Math.abs(fvFBLR.FB) > friction ? fvFBLR.FB - Math.sign(fvFBLR.FB) * friction : 0;
  }
  if (!moveLeft && !moveRight) {
    fvFBLR.LR = Math.abs(fvFBLR.LR) > friction ? fvFBLR.LR - Math.sign(fvFBLR.LR) * friction : 0;
  }

  // Handle movement based on the key
  if (moveForward || moveBackward || moveLeft || moveRight) {
    forwardVector.copy(getCameraDirection(camera)); // Forward relative to the camera
    rotateVector(forwardVector, new THREE.Vector3(0, 1, 0), angleFBLR);
  }
  
  const currentSpeed = Math.sqrt(Math.pow(cubeVelocity.x, 2) + Math.pow(cubeVelocity.y, 2) + Math.pow(cubeVelocity.z, 2));

  cubeCoordinates.x += cubeVelocity.x * deltaTime;
  cubeCoordinates.y += cubeVelocity.y * deltaTime;
  cubeCoordinates.z += cubeVelocity.z * deltaTime;

  if (groundMesh) {
    raycaster.set(
      new THREE.Vector3(cubeCoordinates.x, cubeCoordinates.y + cubeSize / 2, cubeCoordinates.z),
      rayDirection
    );
    const intersects = raycaster.intersectObject(groundMesh);
    if (intersects.length > 0) {
      const groundHeight = intersects[0].point.y;

      // Collision detection with a small tolerance buffer
      if (cubeCoordinates.y - cubeSize / 2 <= groundHeight) {
        cubeCoordinates.y = groundHeight + cubeSize / 2; // Adjust position slightly above the ground
        cubeVelocity.y = 0; // No bouncing, zero out vertical velocity
      } else {
        cubeVelocity.y += gravity * deltaTime; // Falling
      }
    }
  }

  // Update cube
  const targetForward = new THREE.Vector3(forwardVector.x, 0, forwardVector.z).normalize(); // XZ plane only
  const targetAngle = Math.atan2(targetForward.x, targetForward.z); // Angle in radians
  cube.rotation.set(0, targetAngle, 0); // Fixes to horizontal rotation only (ignores tilt from Y)
  cube.position.set(cubeCoordinates.x, cubeCoordinates.y, cubeCoordinates.z);

  // Update the arrow position to match the cube's position
  arrowHelper.setDirection(forwardVector.clone().normalize());
  arrowHelper.position.set(cubeCoordinates.x, cubeCoordinates.y, cubeCoordinates.z); // Offset the arrow to center with the cube

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();