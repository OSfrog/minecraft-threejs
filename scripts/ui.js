import { GUI } from "lil-gui";
import { resources } from "./blocks";

export function createUI(scene, world, player, physics) {
  const gui = new GUI();

  const sceneFolder = gui.addFolder("Scene");
  sceneFolder.add(scene.fog, "near", 1, 200, 1).name("Fog Near");
  sceneFolder.add(scene.fog, "far", 1, 200, 1).name("Fog Far");

  const playerFolder = gui.addFolder("Player");
  playerFolder.add(player, "maxSpeed", 1, 20);
  player.cameraHelper.visible = false;
  playerFolder.add(player.cameraHelper, "visible").name("Show Camera Helper");
  physics.helpers.visible = false;
  playerFolder.add(physics.helpers, "visible").name("Show Physics Helper");

  const terrainFolder = gui.addFolder("Terrain");
  // terrainFolder.add(world.chunkSize, "width", 8, 128, 1).name("Width");
  // terrainFolder.add(world.chunkSize, "height", 8, 128, 1).name("Height");
  terrainFolder.add(world, "asyncLoading").name("Async Chunk Loading");
  terrainFolder.add(world, "drawDistance", 0, 10, 1).name("Draw Distance");
  terrainFolder.add(world.params, "seed", 0, 1000).name("Seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
  terrainFolder
    .add(world.params.terrain, "magnitude", 0, 32, 1)
    .name("Magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 32, 1).name("Offset");
  terrainFolder
    .add(world.params.terrain, "waterOffset", 0, 32, 1)
    .name("Water Offset");

  const resourcesFolder = terrainFolder.addFolder("Resources").close();

  resources.forEach((resource) => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourcesFolder.addFolder("Scale");
    scaleFolder.add(resource.scale, "x", 10, 100).name("X Scale");
    scaleFolder.add(resource.scale, "y", 10, 100).name("Y Scale");
    scaleFolder.add(resource.scale, "z", 10, 100).name("Z Scale");
  });

  const treesFolder = terrainFolder.addFolder("Trees").close();
  treesFolder.add(world.params.trees, "frequency", 0, 0.1).name("Frequency");
  treesFolder
    .add(world.params.trees.trunk, "minHeight", 0, 10, 1)
    .name("Min Trunk Height");
  treesFolder
    .add(world.params.trees.trunk, "maxHeight", 0, 10, 1)
    .name("Max Trunk Height");
  treesFolder
    .add(world.params.trees.canopy, "minRadius", 0, 10, 1)
    .name("Min Canopy Size");
  treesFolder
    .add(world.params.trees.canopy, "maxRadius", 0, 10, 1)
    .name("Max Canopy Size");
  treesFolder
    .add(world.params.trees.canopy, "density", 0, 1)
    .name("Canopy Density");

  const cloudsFolder = terrainFolder.addFolder("Clouds").close();
  cloudsFolder.add(world.params.clouds, "scale", 0, 100).name("Cloud Size");
  cloudsFolder.add(world.params.clouds, "density", 0, 1).name("Cloud Density");

  gui.onChange(() => {
    world.generate();
  });
}
