import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class ModelLoader {
  loader = new GLTFLoader();

  models = {
    pickaxe: undefined,
  };

  constructor() {
    this.loader = new GLTFLoader();
  }

  loadModels(onLoad) {
    this.loader.load("/models/diamond_pickaxe.glb", (model) => {
      const mesh = model.scene;
      this.models.pickaxe = mesh;
      onLoad(this.models);
    });
  }
}
