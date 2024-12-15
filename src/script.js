import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("canvas.container3D");

const fbValueElement = document.getElementById('fbValue');
const lrValueElement = document.getElementById('lrValue');
const csValueElement = document.getElementById('csValue');

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraPos = { x: 0, y: 3, z: 6 };
let cameraYOffset = 1.7;
scene.add(camera);

const onResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", onResize);

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
let cubeSpeed = 1; // Initial speed (without components)
const cubeAcceleration = 0.4;
const maxCubeSpeed = 6; // Max speed of the cube
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

function updateFBLRVector(angle) {
  forwardVector.copy(getCameraDirection(camera)); // Forward relative to the camera
  rotateVector(forwardVector, new THREE.Vector3(0, 1, 0), angle);
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

  const angleFBLR = Math.atan2(-fvFBLR.LR, fvFBLR.FB);

  if (moveForward === moveBackward) {
    if (Math.abs(fvFBLR.FB) < 2*fvAcceleration + 0.0001) {
      fvFBLR.FB = 0
    } else {
    fvFBLR.FB = Math.sign(fvFBLR.FB) * (Math.abs(fvFBLR.FB) - 2*fvAcceleration);
    }
  } else if (moveForward && ((Math.abs(fvFBLR.FB) < fvMax - 0.001) || fvFBLR.FB < 0)) {
    fvFBLR.FB += fvAcceleration;
  } else if (moveBackward && ((Math.abs(fvFBLR.FB) < fvMax - 0.001) || fvFBLR.FB > 0)) {
    fvFBLR.FB -= fvAcceleration;
  }

  if (moveLeft === moveRight) {
    if (Math.abs(fvFBLR.LR) < 2*fvAcceleration + 0.0001) {
      fvFBLR.LR = 0
    } else {
    fvFBLR.LR = Math.sign(fvFBLR.LR) * (Math.abs(fvFBLR.LR) - 2*fvAcceleration);
    }
  } else if (moveRight && ((Math.abs(fvFBLR.LR) < fvMax - 0.001) || fvFBLR.LR < 0)) {
    fvFBLR.LR += fvAcceleration;
  } else if (moveLeft && ((Math.abs(fvFBLR.LR) < fvMax - 0.001) || fvFBLR.LR > 0)) {
    fvFBLR.LR -= fvAcceleration;
  }  
  
  if ((moveForward ^ moveBackward) || (moveLeft ^ moveRight)) { // Single key pressed in either direction
    if (cubeSpeed < maxCubeSpeed - 0.0001) {
      cubeSpeed += cubeAcceleration;
    }
  } else if ((moveForward && moveBackward && !(moveLeft || moveRight)) || // Both forward/backward, but no left/right
             (moveLeft && moveRight && !(moveForward || moveBackward))) { // Both left/right, but no forward/backward
    if (Math.abs(cubeSpeed) < 2*cubeAcceleration + 0.0001) {
      cubeSpeed = 0; // Fully stop when close to 0 speed
    } else {
      cubeSpeed -= 2*cubeAcceleration; // Decelerate
    }
  } else if (!(moveForward || moveBackward || moveLeft || moveRight)) { // No keys pressed
    if (Math.abs(cubeSpeed) < 2*cubeAcceleration + 0.0001) {
      cubeSpeed = 0; // Fully stop when close to 0 speed
    } else {
      cubeSpeed -= 2*cubeAcceleration; // Decelerate
    }
  }

  updateFBLRVector(angleFBLR);

  cubeVelocity.x = forwardVector.x * cubeSpeed; // Need to multiply by velocity determined by how long keys have been pressed
  cubeVelocity.z = forwardVector.z * cubeSpeed; // i think maybe have a function based on any key. automate 'cubevelocity

  cameraPos.x += Math.abs(fvFBLR.FB) * cubeVelocity.x * deltaTime;
  cameraPos.z += Math.abs(fvFBLR.FB) * cubeVelocity.z * deltaTime;

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
      if (cubeCoordinates.y - cubeSize / 2 <= groundHeight + 0.001) {
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

  camera.position.setX(cameraPos.x);
  camera.position.setY(cubeCoordinates.y + cameraPos.y);
  camera.position.setZ(cameraPos.z);
  camera.lookAt(cubeCoordinates.x, (cubeCoordinates.y + cameraYOffset), cubeCoordinates.z); // Keep the camera looking at the cube

  // Update the arrow position to match the cube's position
  arrowHelper.setDirection(forwardVector.clone().normalize());
  arrowHelper.position.set(cubeCoordinates.x, cubeCoordinates.y, cubeCoordinates.z); // Offset the arrow to center with the cube

  fbValueElement.textContent = `FB: ${fvFBLR.FB.toFixed(2)}`;
  lrValueElement.textContent = `LR: ${fvFBLR.LR.toFixed(2)}`;
  csValueElement.textContent = `Speed: ${cubeSpeed.toFixed(2)}`;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();