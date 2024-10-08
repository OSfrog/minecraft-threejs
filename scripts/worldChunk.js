import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";

const geometry = new THREE.BoxGeometry();

export class WorldChunk extends THREE.Group {
  /**
   * @type {{id: number, instanceId: number
   * }[][][]}
   */
  data = [];

  constructor(size, params, dataStore) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
    this.dataStore = dataStore;
  }

  generate() {
    // const start = performance.now();
    const rng = new RNG(this.params.seed);

    this.initializeTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateTrees();
    this.generateClouds(rng);
    this.loadPlayerChanges();
    this.generateMeshes();

    this.loaded = true;
    // console.log(`Chunk generated in ${performance.now() - start}ms`);
  }

  initializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: blocks.empty.id,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  generateResources(rng) {
    const simplex = new SimplexNoise(rng);
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z,
            );
            if (value > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    });
  }

  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale,
        );

        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;

        let height = Math.floor(scaledNoise);
        height = Math.max(0, Math.min(height, this.size.height - 1));

        // Starting at the terrain height, fill in all the blocks below that height
        for (let y = 0; y < this.size.height; y++) {
          if (y <= this.params.terrain.waterOffset && y <= height) {
            this.setBlockId(x, y, z, blocks.sand.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (
            y < height &&
            this.getBlock(x, y, z).id === blocks.empty.id
          ) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  generateTrees() {
    const generateTreeTrunk = (x, z, rng) => {
      const minH = this.params.trees.trunk.minHeight;
      const maxH = this.params.trees.trunk.maxHeight;
      const height = Math.round(minH + (maxH - minH) * rng.random());

      // Optimize this later
      // Search for the grass block which indicates the top of the terrain
      for (let y = 0; y < this.size.height; y++) {
        const block = this.getBlock(x, y, z);
        if (block && block.id === blocks.grass.id) {
          // The trunk of the tree starts here
          for (let treeY = y + 1; treeY <= y + height; treeY++) {
            this.setBlockId(x, treeY, z, blocks.tree.id);
          }

          generateTreeCanopy(x, y + height, z, rng);
          break;
        }
      }
    };

    const generateTreeCanopy = (centerX, centerY, centerZ, rng) => {
      const minR = this.params.trees.canopy.minRadius;
      const maxR = this.params.trees.canopy.maxRadius;
      const radius = Math.round(minR + (maxR - minR) * rng.random());

      for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
          for (let z = -radius; z <= radius; z++) {
            const n = rng.random();
            // Make sure block is within the canopy radius
            if (x * x + y * y + z * z > radius * radius) continue;

            const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
            if (block && block.id !== blocks.empty.id) continue;
            if (n < this.params.trees.canopy.density) {
              this.setBlockId(
                centerX + x,
                centerY + y,
                centerZ + z,
                blocks.leaves.id,
              );
            }
          }
        }
      }
    };

    let rng = new RNG(this.params.seed);
    let offset = this.params.trees.canopy.maxRadius;
    for (let x = offset; x < this.size.width - offset; x++) {
      for (let z = offset; z < this.size.width - offset; z++) {
        if (rng.random() < this.params.trees.frequency) {
          generateTreeTrunk(x, z, rng);
        }
      }
    }
  }

  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value =
          (simplex.noise(
            (this.position.x + x) / this.params.clouds.scale,
            (this.position.z + z) / this.params.clouds.scale,
          ) +
            1) *
          0.5;

        if (value < this.params.clouds.density) {
          this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
        }
      }
    }
  }

  loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (
            this.dataStore.contains(this.position.x, this.position.z, x, y, z)
          ) {
            const blockId = this.dataStore.get(
              this.position.x,
              this.position.z,
              x,
              y,
              z,
            );
            this.setBlockId(x, y, z, blockId);
          }
        }
      }
    }
  }

  generateWater() {
    const material = new THREE.MeshLambertMaterial({
      color: 0x9090e0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
    waterMesh.rotateX(-Math.PI / 2.0);
    waterMesh.position.set(
      this.size.width / 2,
      this.params.terrain.waterOffset + 0.4,
      this.size.width / 2,
    );
    waterMesh.scale.set(this.size.width, this.size.width, 1);
    waterMesh.layers.set(1);

    this.add(waterMesh);
  }

  generateMeshes() {
    this.disposeInstances();

    this.generateWater();

    const maxCount = this.size.width * this.size.width * this.size.height;

    // Lookup table where the key is the block id
    const meshes = {};

    Object.values(blocks)
      .filter((blockType) => blockType.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new THREE.InstancedMesh(
          geometry,
          blockType.material,
          maxCount,
        );
        mesh.name = blockType.id;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;

          if (blockId === blocks.empty.id) {
            continue;
          }

          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }

    this.add(...Object.values(meshes));
  }

  addBlock(x, y, z, blockId) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, blockId);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
    }
  }

  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.dataStore.set(
        this.position.x,
        this.position.z,
        x,
        y,
        z,
        blocks.empty.id,
      );
    }
  }

  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (!block.instanceId || block.id === blocks.empty.id) return;
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id,
    );
    const instanceId = block.instanceId;

    // Swapping the transformation matrix of the block in the last position
    // with the block to be deleted
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Update the instanceId of the block in the last position to its new instanceId
    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // Swapping the transformation matrices
    mesh.setMatrixAt(instanceId, lastMatrix);

    mesh.count--;

    // Notify the instanced mesh we updated the instance matrix
    // Also re-compute the bounding sphere so raycasting works
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    this.setBlockInstanceId(x, y, z, undefined);
    // console.log(`Block removed successfully at x: ${x} y: ${y} z: ${z} `);
  }

  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // Verify the block exists and is not an empty block type
    if (block && block.id !== blocks.empty.id && !block.instanceId) {
      const mesh = this.children.find(
        (instanceMesh) => instanceMesh.name === block.id,
      );
      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);

      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);

      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  inBounds(x, y, z) {
    return (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    );
  }

  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    return (
      up !== blocks.empty.id &&
      down !== blocks.empty.id &&
      left !== blocks.empty.id &&
      right !== blocks.empty.id &&
      forward !== blocks.empty.id &&
      back !== blocks.empty.id
    );
  }

  disposeInstances() {
    this.traverse((obj) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }
}
