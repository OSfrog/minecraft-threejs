import * as THREE from "three";

export class Tool extends THREE.Group {
  animate = false;
  animationAmplitude = 0.5;
  animationDuration = 750;
  animationStart = 0;
  animationSpeed = 0.025;
  animation = undefined;
  toolMesh = undefined;

  get animationTime() {
    return performance.now() - this.animationStart;
  }

  update() {
    if (this.animate && this.toolMesh) {
      this.toolMesh.rotation.z =
        this.animationAmplitude *
        Math.sin(this.animationTime * this.animationSpeed);
    }
  }

  startAnimation() {
    if (this.animate) return;

    this.animate = true;
    this.animationStart = performance.now();

    clearTimeout(this.animate);

    this.animation = setTimeout(() => {
      this.animate = false;
    }, this.animationDuration);
  }

  setMesh(mesh) {
    this.clear();
    this.toolMesh = mesh;
    this.add(mesh);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    this.position.set(0.09, -0.1, -0.1);
    this.scale.set(0.006, 0.006, 0.006);
    // this.rotation.x = Math.PI / 2 + 1.5;
    // this.rotation.x = 0.2;
    this.rotation.y = Math.PI / 2 + 0.1;
    // this.rotation.z = -0.1;
  }
}
