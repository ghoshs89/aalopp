/**
 * Renders one small locator map per country into public/maps/<code>.svg, from the committed
 * scripts/maps/data/countries.geojson (see data/README.md for where that file comes from).
 *
 * A locator map is a real geography fact, same as a flag: a drawn one could quietly put a country in the wrong
 * place or give it the wrong neighbours, and that is a fact he would learn and repeat. So this never draws a
 * coastline by hand, it only projects the committed geographic data.
 *
 * This is a one-off build step (npm run maps:build), never something the app runs. Always rewrites every file:
 * the output is a pure function of the committed input, so there is nothing to merge and no reason to skip one.
 */
import { geoAzimuthalEqualArea, geoCircle, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Props = { NAME: string; ISO_A2: string; CONTINENT: string };
type CountryFeature = Feature<Geometry, Props>;

/** code: the flag filename this app already uses. neName: the NAME field in countries.geojson. */
const TARGETS: { code: string; neName: string }[] = [
  { code: "ca", neName: "Canada" },
  { code: "in", neName: "India" },
  { code: "us", neName: "United States" },
  { code: "gb", neName: "United Kingdom" },
  { code: "fr", neName: "France" },
  { code: "de", neName: "Germany" },
  { code: "it", neName: "Italy" },
  { code: "jp", neName: "Japan" },
  { code: "cn", neName: "China" },
  { code: "kr", neName: "Republic of Korea" },
  { code: "br", neName: "Brazil" },
  { code: "mx", neName: "Mexico" },
  { code: "au", neName: "Australia" },
  { code: "es", neName: "Spain" },
  { code: "se", neName: "Sweden" },
  { code: "np", neName: "Nepal" },
  { code: "bd", neName: "Bangladesh" },
  { code: "lk", neName: "Sri Lanka" },
  { code: "pk", neName: "Pakistan" },
  { code: "bt", neName: "Bhutan" },
  { code: "eg", neName: "Egypt" },
  { code: "ke", neName: "Kenya" },
  { code: "za", neName: "South Africa" },
  { code: "ng", neName: "Nigeria" },
  { code: "ma", neName: "Morocco" },
  { code: "ar", neName: "Argentina" },
  { code: "pe", neName: "Peru" },
  { code: "cl", neName: "Chile" },
  { code: "co", neName: "Colombia" },
  { code: "cu", neName: "Cuba" },
  { code: "nl", neName: "Netherlands" },
  { code: "ch", neName: "Switzerland" },
  { code: "gr", neName: "Greece" },
  { code: "ru", neName: "Russia" },
  { code: "id", neName: "Indonesia" },
  { code: "th", neName: "Thailand" },
  { code: "nz", neName: "New Zealand" },
];

/**
 * View radius in degrees around the country's centre. Russia and New Zealand cross the antimeridian (longitude
 * wraps from 180 to -180), which breaks a bounding box computed from raw coordinates, so both get a fixed centre
 * and radius instead of one measured from the data. Everything else is sized from its own bounding box.
 */
const FIXED_VIEW: Record<string, { center: [number, number]; radiusDeg: number }> = {
  ru: { center: [60, 62], radiusDeg: 30 },
  // Wide enough to hold both main islands (roughly -34 to -47 latitude), which a bounding-box radius alone was
  // clipping the bottom off.
  nz: { center: [172, -41], radiusDeg: 19 },
};
const MIN_RADIUS_DEG = 5;
const MAX_RADIUS_DEG = 32;
// Applied to the bounding box's diagonal, not its width or height, so a corner (India's northern tip, say) is never
// closer to the clip edge than the rest of the country just because the box itself is wide and short, or tall and
// narrow.
const PAD_FACTOR = 1.35;

const WIDTH = 300;
const HEIGHT = 220;
const PAD = 10;

const COLOR = { ocean: "#eaf1ec", land: "#c7d2c9", border: "#1d2f4b", highlight: "#e8c158" };

function bbox(coordinates: unknown): [number, number, number, number] {
  let minX = 180, maxX = -180, minY = 90, maxY = -90;
  const walk = (coords: unknown): void => {
    if (typeof (coords as number[])[0] === "number") {
      const [x, y] = coords as [number, number];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }
    for (const c of coords as unknown[]) walk(c);
  };
  walk(coordinates);
  return [minX, minY, maxX, maxY];
}

const area = ([minX, minY, maxX, maxY]: [number, number, number, number]) => (maxX - minX) * (maxY - minY);

/**
 * The bounding box of a feature's biggest single polygon, not of the whole feature. Several countries here (France,
 * the Netherlands, Chile) are one MultiPolygon that also carries a far-off territory (French Guiana, Caribbean
 * islands, Easter Island), and a bbox across all of them would centre the map in the middle of an ocean and blow
 * its radius out to the cap. The mainland is always the biggest piece in degree-area, which is a rough stand-in for
 * true area but good enough at this distance from the poles.
 */
function mainlandBBox(geometry: Geometry): [number, number, number, number] {
  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [(geometry as { coordinates: unknown[] }).coordinates];
  const boxes = polygons.map((p) => bbox(p));
  return boxes.reduce((best, b) => (area(b) > area(best) ? b : best));
}

function viewFor(code: string, feature: CountryFeature): { center: [number, number]; radiusDeg: number } {
  const fixed = FIXED_VIEW[code];
  if (fixed) return fixed;
  const [minX, minY, maxX, maxY] = mainlandBBox(feature.geometry);
  const center: [number, number] = [(minX + maxX) / 2, (minY + maxY) / 2];
  const diagonal = Math.hypot(maxX - minX, maxY - minY) / 2;
  const radiusDeg = Math.min(MAX_RADIUS_DEG, Math.max(MIN_RADIUS_DEG, diagonal * PAD_FACTOR));
  return { center, radiusDeg };
}

/** Rough degree-distance from a view centre to a feature's mainland, used only to pick context countries. */
function roughDistanceDeg(center: [number, number], geometry: Geometry | null): number {
  if (!geometry) return Infinity;
  const [minX, minY, maxX, maxY] = mainlandBBox(geometry);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let dx = Math.abs(cx - center[0]);
  if (dx > 180) dx = 360 - dx;
  const dy = Math.abs(cy - center[1]);
  return Math.hypot(dx, dy);
}

function renderMap(code: string, feature: CountryFeature, all: CountryFeature[]): string {
  const { center, radiusDeg } = viewFor(code, feature);
  const projection = geoAzimuthalEqualArea().rotate([-center[0], -center[1]]);
  const frame = geoCircle().center(center).radius(radiusDeg)();
  projection.fitExtent([[PAD, PAD], [WIDTH - PAD, HEIGHT - PAD]], frame);
  // Drops everything outside the view before rendering it, rather than after: without this, a country with a
  // scattered territory on the other side of the planet (France's Pacific islands, Chile's) bloats every file with
  // path data for a point that was never going to be visible.
  projection.clipAngle(radiusDeg + 1);
  // One decimal place is plenty on a 300x220 canvas and keeps the file small; d3's default is many more digits
  // than an SVG this size can ever show, which was most of the earlier file size.
  const path = geoPath(projection).digits(1);

  // Context countries: anything whose own centre is within reach of this view, drawn in plain land colour, plus
  // the target drawn again on top in the highlight colour so it is never hidden under a context country.
  const context = all.filter((f) => f !== feature && roughDistanceDeg(center, f.geometry) < radiusDeg * 1.9);

  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="${COLOR.ocean}"/>`);
  for (const f of context) {
    const d = path(f);
    if (d) parts.push(`<path d="${d}" fill="${COLOR.land}" stroke="${COLOR.border}" stroke-width="0.75" stroke-opacity="0.5"/>`);
  }
  const d = path(feature);
  if (d) parts.push(`<path d="${d}" fill="${COLOR.highlight}" stroke="${COLOR.border}" stroke-width="1.5"/>`);

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A map">${parts.join("")}</svg>\n`;
}

function main(): void {
  const dataPath = path.join(process.cwd(), "scripts/maps/data/countries.geojson");
  const collection = JSON.parse(readFileSync(dataPath, "utf8")) as FeatureCollection<Geometry, Props>;
  // A few tiny dependencies simplify away to nothing; they are useless as context and never a target, so drop them.
  const all = (collection.features as CountryFeature[]).filter((f) => f.geometry !== null);
  const byName = new Map(all.map((f) => [f.properties.NAME, f]));

  const outDir = path.join(process.cwd(), "public/maps");
  mkdirSync(outDir, { recursive: true });

  let missing = 0;
  for (const { code, neName } of TARGETS) {
    const feature = byName.get(neName);
    if (!feature) {
      console.error(`  ${code}: no feature named "${neName}" in countries.geojson`);
      missing += 1;
      continue;
    }
    const svg = renderMap(code, feature, all);
    writeFileSync(path.join(outDir, `${code}.svg`), svg);
  }
  console.log(`maps: wrote ${TARGETS.length - missing} of ${TARGETS.length} to public/maps`);
  if (missing > 0) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) main();
