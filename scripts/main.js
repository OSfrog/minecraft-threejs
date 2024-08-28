import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { World } from "./world";
import { createUI } from "./ui";
import { Player } from "./player";

let WINDOW_WIDTH = window.innerWidth;
let WINDOW_HEIGHT = window.innerHeight;

const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const orbitCamera = new THREE.PerspectiveCamera(
  75,
  WINDOW_WIDTH / WINDOW_HEIGHT,
);
orbitCamera.position.set(-32, 16, -32);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene);

const setupLights = () => {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.0005;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(sun);

  // const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(shadowHelper);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.1;
  scene.add(ambient);
};

let previousTime = performance.now();
const animate = () => {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;

  requestAnimationFrame(animate);
  player.applyInputs(dt);
  stats.update();

  previousTime = currentTime;

  renderer.render(
    scene,
    player.controls.isLocked ? player.camera : orbitCamera,
  );
};

window.addEventListener("resize", () => {
  WINDOW_WIDTH = window.innerWidth;
  WINDOW_HEIGHT = window.innerHeight;

  orbitCamera.aspect = WINDOW_WIDTH / WINDOW_HEIGHT;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = WINDOW_WIDTH / WINDOW_HEIGHT;
  player.camera.updateProjectionMatrix();

  renderer.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
});

setupLights();
createUI(world, player);
animate();
