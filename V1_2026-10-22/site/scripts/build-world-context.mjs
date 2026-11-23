import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1");
const sourcePath=join(root,"data","world-context","natural-earth-110m-admin-0.geojson");
const outputPath=join(root,"data","world-context.js");
const source=JSON.parse(await readFile(sourcePath,"utf8"));

const roundCoordinates=value=>Array.isArray(value)
  ? value.map(roundCoordinates)
  : typeof value==="number"
    ? Math.round(value*1000)/1000
    : value;

const countries=source.features.map(feature=>({
  id:feature.properties.ADM0_A3||feature.properties.ISO_A3_EH||feature.properties.ISO_A3,
  name:feature.properties.NAME_EN||feature.properties.NAME||feature.properties.ADMIN,
  label:[feature.properties.LABEL_X,feature.properties.LABEL_Y].map(value=>Math.round(value*1000)/1000),
  geometry:{type:feature.geometry.type,coordinates:roundCoordinates(feature.geometry.coordinates)}
}));

const context={
  source:{
    title:"Natural Earth 1:110m Admin 0 — Countries",
    version:"5.1.0",
    url:"https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/",
    repository:"https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson",
    terms:"Natural Earth public domain"
  },
  countries
};

await writeFile(outputPath,`window.VIRSAPUR_WORLD_CONTEXT=${JSON.stringify(context)};\n`,"utf8");
console.log(`Built ${countries.length} Natural Earth countries into ${outputPath}`);
