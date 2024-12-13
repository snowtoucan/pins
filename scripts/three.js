import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let object;
let controls;
let objToRender = 'pika';

// Initialize GLTFLoader
const loader = new GLTFLoader();

// Load the GLTF model
loader.load(
    './assets/pika/model.gltf',
    function (gltf) {
        object = gltf.scene;
        scene.add(object);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('Error loading GLTF model:', error);
    }
);

const canvas = document.getElementById('container3D');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });  // Use the existing canvas
renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.z = objToRender === "pika" ? 25 : 500;

// Lighting
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, objToRender === "pika" ? 5 : 1);
scene.add(ambientLight);

// Initialize OrbitControls
controls = new OrbitControls(camera, renderer.domElement);

function animate() {
    requestAnimationFrame(animate);

    // Update controls if they exist
    if (controls) {
        controls.update();  // Only needed if controls.enableDamping = true or controls.auto-rotate = true
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();