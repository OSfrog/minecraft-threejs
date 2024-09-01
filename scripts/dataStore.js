export class DataStore {
  constructor() {
    this.data = {};
  }

  clear() {
    this.data = {};
  }

  set(chunkX, chunkZ, blockX, blockY, blockZ, blockId) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    this.data[key] = blockId;
    console.log(`Set block ${key} to ${blockId}`);
  }

  contains(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    return this.data[key] !== undefined;
  }

  get(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    const blockId = this.data[key];
    console.log(`Retrieving block ${key} with value ${blockId}`);
    return blockId;
  }

  #getKey(chunkX, chunkZ, blockX, blockY, blockZ) {
    return `${chunkX}-${chunkZ}-${blockX}-${blockY}-${blockZ}`;
  }
}
