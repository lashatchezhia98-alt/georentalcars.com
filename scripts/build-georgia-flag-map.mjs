import { writeFile } from "node:fs/promises";

const boundaryUrl =
  "https://gisserver.mepa.gov.ge/arcgis/rest/services/IT_TEST/sazRvrebi/FeatureServer/0/query" +
  "?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson";
const outputUrl = new URL("../public/georgia-flag-map.svg", import.meta.url);
const response = await fetch(boundaryUrl);

if (!response.ok) throw new Error(`Boundary download failed: ${response.status}`);

const geojson = await response.json();
const geometry = geojson.features?.[0]?.geometry;

if (geometry?.type !== "Polygon") {
  throw new Error("The official Georgia boundary polygon was not found");
}

const rings = geometry.coordinates;
const points = rings.flat();
const longitudes = points.map(([longitude]) => longitude);
const latitudes = points.map(([, latitude]) => latitude);
const minLongitude = Math.min(...longitudes);
const maxLongitude = Math.max(...longitudes);
const minLatitude = Math.min(...latitudes);
const maxLatitude = Math.max(...latitudes);
const latitudeScale = Math.cos(((minLatitude + maxLatitude) / 2) * Math.PI / 180);
const width = (maxLongitude - minLongitude) * latitudeScale;
const height = maxLatitude - minLatitude;
const padding = 0.035;
const project = ([longitude, latitude]) => [
  (longitude - minLongitude) * latitudeScale + padding,
  maxLatitude - latitude + padding,
];
const outline = rings
  .map((ring) =>
    ring
      .map((point, index) => {
        const [x, y] = project(point);
        return `${index ? "L" : "M"}${x.toFixed(5)} ${y.toFixed(5)}`;
      })
      .join("") + "Z",
  )
  .join("");
const viewWidth = width + padding * 2;
const viewHeight = height + padding * 2;
const centerX = viewWidth / 2;
const centerY = viewHeight / 2;
const horizontalBar = viewHeight * 0.125;
const verticalBar = viewWidth * 0.072;
const smallCrossWidth = viewWidth * 0.105;
const smallCrossBar = viewHeight * 0.045;

const smallCross = (x, y) => `
      <rect x="${(x - smallCrossBar / 2).toFixed(5)}" y="${(y - smallCrossWidth / 2).toFixed(5)}" width="${smallCrossBar.toFixed(5)}" height="${smallCrossWidth.toFixed(5)}" rx="0.012"/>
      <rect x="${(x - smallCrossWidth / 2).toFixed(5)}" y="${(y - smallCrossBar / 2).toFixed(5)}" width="${smallCrossWidth.toFixed(5)}" height="${smallCrossBar.toFixed(5)}" rx="0.012"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth.toFixed(5)} ${viewHeight.toFixed(5)}" role="img" aria-label="საქართველოს ზუსტი გეოგრაფიული კონტური">
  <defs>
    <clipPath id="georgia-outline">
      <path d="${outline}" fill-rule="evenodd"/>
    </clipPath>
  </defs>
  <g clip-path="url(#georgia-outline)">
    <rect width="${viewWidth.toFixed(5)}" height="${viewHeight.toFixed(5)}" fill="#fff"/>
    <g fill="#d71920">
      <rect x="0" y="${(centerY - horizontalBar / 2).toFixed(5)}" width="${viewWidth.toFixed(5)}" height="${horizontalBar.toFixed(5)}"/>
      <rect x="${(centerX - verticalBar / 2).toFixed(5)}" y="0" width="${verticalBar.toFixed(5)}" height="${viewHeight.toFixed(5)}"/>
      ${smallCross(viewWidth * 0.26, viewHeight * 0.29)}
      ${smallCross(viewWidth * 0.74, viewHeight * 0.29)}
      ${smallCross(viewWidth * 0.26, viewHeight * 0.72)}
      ${smallCross(viewWidth * 0.74, viewHeight * 0.72)}
    </g>
  </g>
  <path d="${outline}" fill="none" stroke="#10172d" stroke-width="0.018" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd"/>
</svg>
`;

await writeFile(outputUrl, svg);
