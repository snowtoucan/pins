import '../css/style.css';
import '../json/paths.json';
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
    antialias: true,
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight); // initial size

function onWindowResize() { // resize canvas
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize); // update canvas size on window resize

// Create a cube
const geometry = new THREE.BoxGeometry(5, 5, 5);  // Size of the cube
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });  // Green color
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);  // Add the cube to the scene

camera.position.setZ(30);  // Position the camera

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube to see it move
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);  // Render the scene
}

animate();  // Start the animation loop