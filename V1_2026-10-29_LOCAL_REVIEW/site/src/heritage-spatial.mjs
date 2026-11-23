import { readFile } from "node:fs/promises";
import { join } from "node:path";

const districtFiles = {
  punjab: "punjab-admin-2.geojson",
  sindh: "sindh-admin-2.geojson",
  "khyber-pakhtunkhwa": "khyber-pakhtunkhwa-admin-2.geojson",
  balochistan: "balochistan-admin-2.geojson",
  islamabad: "islamabad-admin-2.geojson",
  "gilgit-baltistan": "gilgit-baltistan-admin-2.geojson",
  "azad-kashmir": "azad-kashmir-admin-2.geojson"
};

const pointOnSegment = ([x, y], [ax, ay], [bx, by]) => {
  if (ax === bx && ay === by) return Math.abs(x - ax) < 1e-9 && Math.abs(y - ay) < 1e-9;
  const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
  if (Math.abs(cross) > 1e-9) return false;
  const dot = (x - ax) * (bx - ax) + (y - ay) * (by - ay);
  if (dot < 0) return false;
  return dot <= (bx - ax) ** 2 + (by - ay) ** 2;
};

export function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const a = ring[index];
    const b = ring[previous];
    if (pointOnSegment(point, a, b)) return true;
    const intersects = (a[1] > point[1]) !== (b[1] > point[1]) &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInGeometry(point, geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(polygon => pointInRing(point, polygon[0]) && !polygon.slice(1).some(hole => pointInRing(point, hole)));
}

export async function loadDistrictCollections(root) {
  return Object.fromEntries(await Promise.all(Object.entries(districtFiles).map(async ([regionId, file]) => {
    const collection = JSON.parse(await readFile(join(root, "assets", "maps", "runtime", "districts", file), "utf8"));
    return [regionId, collection];
  })));
}

export function deriveHeritageAssignments(records, collections) {
  const failures = [];
  const overlaps = [];
  const enriched = records.map(record => {
    const components = (record.components || []).map(component => {
      if (component.coordinateStatus === "missing-at-source" || component.latitude == null || component.longitude == null) {
        return { ...component, regionId: null, districtId: null, regionIds: [], districtIds: [], spatialMatches: [], assignmentStatus: "not-applicable-missing-coordinate" };
      }
      const point = [Number(component.longitude), Number(component.latitude)];
      const matches = [];
      for (const [regionId, collection] of Object.entries(collections)) {
        for (const feature of collection.features || []) if (pointInGeometry(point, feature.geometry)) matches.push({ regionId, districtId: feature.id });
      }
      if (!matches.length) failures.push({ propertyId: record.id, componentId: component.id, point, matches });
      if (matches.length > 1) overlaps.push({ propertyId: record.id, componentId: component.id, point, matches });
      const match = matches[0];
      // Keep legacy primary IDs, but never discard another valid geographic context.
      // Overlapping source polygons remain visible in diagnostics; coordinates are not moved.
      return { ...component, regionId: match?.regionId || null, districtId: match?.districtId || null,
        regionIds: [...new Set(matches.map(item => item.regionId))],
        districtIds: [...new Set(matches.map(item => item.districtId))], spatialMatches: matches,
        assignmentStatus: matches.length === 1 ? "spatially-derived" : matches.length ? "multiple-contexts" : "unassigned" };
    });
    return {
      ...record,
      components,
      provinceRegionIds: [...new Set(components.flatMap(component => component.regionIds))],
      districtIds: [...new Set(components.flatMap(component => component.districtIds))],
      spatialAssignment: { method: "point-in-polygon", geometryDataset: "Virsapur authoritative ADM2 runtime geometry", reviewedAt: new Date().toISOString().slice(0, 10) }
    };
  });
  return { records: enriched, failures, overlaps };
}

export async function prepareHeritageRecords(root, records) {
  return deriveHeritageAssignments(records, await loadDistrictCollections(root));
}
