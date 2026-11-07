import * as THREE from 'three';

/** Artistic Phobos reconstruction, not a measured shape model. Keeps spherical UVs
 * for the generated atlas while giving the silhouette and Stickney basin real relief. */
export function createPhobosGeometry(radius: number) {
  const width = 128;
  const height = 80;
  const geometry = new THREE.SphereGeometry(1, width, height);
  const positions = geometry.attributes.position;
  const direction = new THREE.Vector3();
  // Image origin is top-left; the basin is at (0.35, 0.50).
  const basin = new THREE.Vector3(-Math.cos(0.35 * Math.PI * 2), 0, Math.sin(0.35 * Math.PI * 2));
  for (let i = 0; i < positions.count; i++) {
    direction.fromBufferAttribute(positions, i).normalize();
    const { x, y, z } = direction;
    const angle = Math.acos(THREE.MathUtils.clamp(direction.dot(basin), -1, 1));
    const bowl = -0.16 * Math.exp(-Math.pow(angle / 0.37, 4));
    const rim = 0.025 * Math.exp(-Math.pow((angle - 0.46) / 0.085, 2));
    // Low spatial frequencies only: rounded asymmetry, without spikes or facets.
    const contour = 1 + 0.045 * Math.sin(3 * x + 1.1) * Math.cos(3 * z - y)
      + 0.025 * Math.sin(4 * y + z) + bowl + rim;
    positions.setXYZ(i, x * radius * 1.2 * contour, y * radius * 0.8 * contour, z * radius * 0.98 * contour);
  }
  smoothAtlasNormals(geometry, width, height);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Rounded Deimos approximation with roughly 15:11:12.2 principal axes.
 * Low-frequency contour variation preserves an irregular, non-spherical silhouette. */
export function createDeimosGeometry(radius: number) {
  const width = 128;
  const height = 80;
  const geometry = new THREE.SphereGeometry(1, width, height);
  const positions = geometry.attributes.position;
  const direction = new THREE.Vector3();
  const basinDirection = (u: number, v: number) => new THREE.Vector3(
    -Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI),
    Math.cos(v * Math.PI),
    Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI),
  );
  const basins = [basinDirection(0.3, 0.45), basinDirection(0.7, 0.6)];
  for (let i = 0; i < positions.count; i++) {
    direction.fromBufferAttribute(positions, i).normalize();
    const { x, y, z } = direction;
    let contour = 1 + 0.065 * Math.sin(2.8 * x + 0.7) * Math.cos(2.4 * z - y)
      + 0.035 * Math.sin(3 * y + 1.2 * z) - 0.04 * x * y;
    for (const basin of basins) {
      const angle = Math.acos(THREE.MathUtils.clamp(direction.dot(basin), -1, 1));
      contour -= 0.035 * Math.exp(-Math.pow(angle / 0.2, 4));
    }
    positions.setXYZ(i, x * radius * 1.21 * contour, y * radius * 0.89 * contour, z * radius * 0.98 * contour);
  }
  smoothAtlasNormals(geometry, width, height);
  geometry.computeBoundingSphere();
  return geometry;
}

function smoothAtlasNormals(geometry: THREE.SphereGeometry, width: number, height: number) {
  geometry.computeVertexNormals();
  const direction = new THREE.Vector3();
  const normals = geometry.attributes.normal;
  const average = new THREE.Vector3();
  // UV seam vertices are duplicated; share normals to avoid a lighting seam.
  for (let row = 1; row < height; row++) {
    const first = row * (width + 1);
    const last = first + width;
    average.fromBufferAttribute(normals, first).add(direction.fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, average.x, average.y, average.z);
    normals.setXYZ(last, average.x, average.y, average.z);
  }
  for (const row of [0, height]) {
    average.set(0, 0, 0);
    for (let col = 0; col <= width; col++) average.add(direction.fromBufferAttribute(normals, row * (width + 1) + col));
    average.normalize();
    for (let col = 0; col <= width; col++) normals.setXYZ(row * (width + 1) + col, average.x, average.y, average.z);
  }
}
