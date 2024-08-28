import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls";

export class Player {
  maxSpeed = 10;
  input = new THREE.Vector2();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  controls = new PointerLockControls(this.camera, document.body);
  constructor(scene) {
    this.camera.position.set(32, 16, 32);
    scene.add(this.camera);

    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  get position() {
    return this.camera.position;
  }

  applyInputs(dt) {
    if (this.controls.isLocked) {
      console.log("player update");
    }
  }

  onKeyDown(event) {
    if (!this.controls.isLocked) {
      this.controls.lock();
      console.log("Controls locked");
    }

    switch (event.code) {
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyD":
        this.input.x = 0;
    }
  }
}
