import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Rover length in world units (the box stand-in was about this long). */
const LENGTH = 3.7;

export type LoadedRover = {
  /** Rover-space model: length along +z (forward), lateral x, wheels resting on y = 0. */
  group: THREE.Group;
  /** Six wheel pivots: steer with rotation.y; spin the child in userData.spin with rotation.x. */
  wheels: THREE.Object3D[];
  /** Marker at the mast head, for the laser's origin. */
  head: THREE.Object3D;
  /** Tyre radius in world units, for ground contact. */
  wheelRadius: number;
};

const isUnder = (object: THREE.Object3D, name: string) => {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) if (node.name === name) return true;
  return false;
};

const signature = (geometry: THREE.BufferGeometry) =>
  `${geometry.index ? 'i' : 'n'}:${Object.keys(geometry.attributes).sort().join(',')}`;

/**
 * Loads the Perseverance glTF (CC BY 4.0, credited in public/models/perseverance/README.md)
 * and prepares it for driving:
 *  - bakes every part into rover space (scaled, centred, facing +z, wheels on y = 0),
 *  - splits the combined wheel meshes into six wheels that can each turn on its axle,
 *  - merges the remaining ~240 parts by material, so drawing it costs dozens of calls.
 */
export async function loadPerseverance(url: string): Promise<LoadedRover> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const source = gltf.scene;
  source.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(source);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const headNode = source.getObjectByName('head_46');
  const headCentre = headNode ? new THREE.Box3().setFromObject(headNode).getCenter(new THREE.Vector3()) : centre.clone();

  // Turn the long axis to +z with the mast end forward.
  const alongZ = size.z >= size.x;
  const yaw = alongZ ? (headCentre.z >= centre.z ? 0 : Math.PI) : (headCentre.x >= centre.x ? -Math.PI / 2 : Math.PI / 2);
  const scale = LENGTH / (alongZ ? size.z : size.x);
  const toRover = new THREE.Matrix4()
    .makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeRotationY(yaw))
    .multiply(new THREE.Matrix4().makeTranslation(-centre.x, -box.min.y, -centre.z));

  const group = new THREE.Group();
  const statics = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[] }>();
  const wheelParts: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];

  source.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toRover, mesh.matrixWorld));
    mesh.geometry.dispose();
    if (isUnder(mesh, 'Wheels_objs_8')) {
      wheelParts.push({ geometry: geometry.index ? geometry.toNonIndexed() : geometry, material });
      return;
    }
    const key = `${material.uuid}|${signature(geometry)}`;
    const bucket = statics.get(key) ?? { material, geometries: [] };
    bucket.geometries.push(geometry);
    statics.set(key, bucket);
  });

  for (const { material, geometries } of statics.values()) {
    const merged = geometries.length > 1 ? mergeGeometries(geometries, false) : geometries[0];
    if (!merged) {
      geometries.forEach((geometry) => group.add(new THREE.Mesh(geometry, material)));
      continue;
    }
    if (geometries.length > 1) geometries.forEach((geometry) => geometry.dispose());
    group.add(new THREE.Mesh(merged, material));
  }

  // Wheels: assign each triangle to one of six wheels by side (x) and position along z.
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const { geometry } of wheelParts) {
    geometry.computeBoundingBox();
    minZ = Math.min(minZ, geometry.boundingBox!.min.z);
    maxZ = Math.max(maxZ, geometry.boundingBox!.max.z);
  }
  const third = (maxZ - minZ) / 3;
  const clusters: Map<number, { geometry: THREE.BufferGeometry; material: THREE.Material }[]> = new Map();
  for (const { geometry, material } of wheelParts) {
    const position = geometry.attributes.position;
    const buckets: number[][] = Array.from({ length: 6 }, () => []);
    for (let tri = 0; tri < position.count / 3; tri++) {
      const a = tri * 3;
      const cx = (position.getX(a) + position.getX(a + 1) + position.getX(a + 2)) / 3;
      const cz = (position.getZ(a) + position.getZ(a + 1) + position.getZ(a + 2)) / 3;
      const bin = Math.min(2, Math.max(0, Math.floor((cz - minZ) / third)));
      buckets[(cx >= 0 ? 3 : 0) + bin].push(tri);
    }
    buckets.forEach((triangles, wheel) => {
      if (!triangles.length) return;
      const part = new THREE.BufferGeometry();
      for (const [name, attribute] of Object.entries(geometry.attributes)) {
        const source = attribute as THREE.BufferAttribute;
        const array = new (source.array.constructor as Float32ArrayConstructor)(triangles.length * 3 * source.itemSize);
        triangles.forEach((tri, i) => {
          for (let v = 0; v < 3; v++) {
            for (let c = 0; c < source.itemSize; c++) array[(i * 3 + v) * source.itemSize + c] = source.array[(tri * 3 + v) * source.itemSize + c];
          }
        });
        part.setAttribute(name, new THREE.BufferAttribute(array, source.itemSize, source.normalized));
      }
      const list = clusters.get(wheel) ?? [];
      list.push({ geometry: part, material });
      clusters.set(wheel, list);
    });
    geometry.dispose();
  }

  const wheels: THREE.Object3D[] = [];
  let wheelRadius = 0;
  for (const parts of clusters.values()) {
    const bounds = new THREE.Box3();
    parts.forEach(({ geometry }) => {
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox!);
    });
    const hub = bounds.getCenter(new THREE.Vector3());
    wheelRadius = Math.max(wheelRadius, (bounds.max.y - bounds.min.y) / 2);
    // Two joints per wheel: the pivot steers (rotation.y) and slides on the suspension;
    // its child spins (rotation.x). Steering must sit outside the spin to look right.
    const pivot = new THREE.Group();
    pivot.position.copy(hub);
    const spin = new THREE.Group();
    pivot.add(spin);
    pivot.userData.spin = spin;
    for (const { geometry, material } of parts) {
      geometry.translate(-hub.x, -hub.y, -hub.z);
      spin.add(new THREE.Mesh(geometry, material));
    }
    group.add(pivot);
    wheels.push(pivot);
  }

  const head = new THREE.Object3D();
  head.position.copy(headCentre.applyMatrix4(toRover));
  group.add(head);

  group.traverse((object) => {
    const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (material && 'envMapIntensity' in material) material.envMapIntensity = 0.7;
  });
  return { group, wheels, head, wheelRadius: wheelRadius || 0.35 };
}
