import {readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const qa=join(root,'qa-artifacts/final-build-2026-10-22/media');
const read=async path=>JSON.parse(await readFile(join(root,path),'utf8'));
const records=await read('qa-artifacts/final-build-2026-10-22/media/download-results.json');
const choices={
 'release-shah-jahan-portrait':{alt:'Repeated brick arches and a tiled doorway in Shah Jahan Mosque, Thatta',caption:'Shah Jahan Mosque, Thatta · brick arcade',relatedHeritageIds:['major-doam-5625'],focalPoint:'50,55',treatment:'portrait',cropNote:'Keep the central doorway and converging arches; preferred native portrait or 3:4, no wide hero crop.',visualNote:'Warm, detailed architectural portrait; strong About/editorial image.'},
 'release-shah-jahan-courtyard':{alt:'Tiled facades around the open courtyard of Shah Jahan Mosque in Thatta',caption:'Shah Jahan Mosque, Thatta · courtyard',relatedHeritageIds:['major-doam-5625'],focalPoint:'50,48',treatment:'landscape',cropNote:'Preserve the central portal and dome finial; reduce foreground paving before cropping the roof.',visualNote:'Clear symmetrical landscape; suitable for site and sacred-architecture category.'},
 'release-mohenjodaro':{alt:'Excavated brick walls at Moenjodaro in Sindh',caption:'Moenjodaro · archaeological remains',relatedHeritageIds:['unesco-138'],focalPoint:'50,60',treatment:'documentary-landscape',cropNote:'Keep the visible excavated walls; no assertion that a particular well or bath is shown.',visualNote:'Muted and somewhat shadowed documentary view; use for the place record, not the promotional hero.'},
 'release-badshahi-courtyard':{alt:'Badshahi Mosque prayer hall and minarets seen across its courtyard in Lahore',caption:'Badshahi Mosque, Lahore · courtyard',relatedHeritageIds:['major-doam-6467'],focalPoint:'52,48',treatment:'cinematic-landscape',cropNote:'Preserve dome finials and right-hand minaret top; keep the full width where possible.',visualNote:'Restrained overcast landscape with ample breathing room; no invented aerial or blue-hour description.'},
 'release-baltit-rakaposhi':{alt:'A side of Baltit Fort beside a view of snow-covered Rakaposhi in Hunza',caption:'Baltit Fort and Rakaposhi, Hunza · side view',relatedHeritageIds:['curated-baltit'],focalPoint:'32,50',treatment:'documentary-landscape',cropNote:'Keep the left-hand fort facade and right-hand mountain together; do not crop into a false complete-fort portrait.',visualNote:'Side facade is intentionally partial and shadowed; documentary context only, not a full-fort establishing hero.'},
 'release-rohtas':{alt:'A monumental stone gateway within Rohtas Fort',caption:'Rohtas Fort · gateway',relatedHeritageIds:['unesco-586'],focalPoint:'50,43',treatment:'architectural-landscape',cropNote:'Retain the gateway crown and arch together; native ratio is preferable to a shallow banner.',visualNote:'Clear masonry detail, bright sky and partial people at bottom; suitable supporting architectural image.'},
 'release-takht-i-bahi':{alt:'Buddhist monastic ruins on the hillside at Takht-i-Bahi',caption:'Takht-i-Bahi · monastery component of the Takht-i-Bahi and Sahr-i-Bahlol World Heritage property',relatedHeritageIds:['unesco-140'],relatedComponentIds:['140-001'],focalPoint:'57,55',treatment:'landscape',cropNote:'Retain the central standing monastery walls and hillside context; this does not show Sahr-i-Bahlol.',visualNote:'Strong readable landscape with layered ruins; suitable archaeology category and exploration context.'},
 'release-shalimar':{alt:'A fountain basin at Shalamar Gardens in Lahore viewed through cusped arches',caption:'Shalamar Gardens, Lahore · garden component of the Fort and Shalamar Gardens World Heritage property',relatedHeritageIds:['unesco-171'],relatedComponentIds:['171-002'],focalPoint:'50,49',treatment:'landscape',cropNote:'Keep the arcade rhythm and reflecting basin; this is Shalamar Gardens, not Lahore Fort.',visualNote:'Silhouetted arches and pool create depth; use in cultural-landscape/editorial contexts.'},
 'release-badshahi-prayer-hall':{alt:'Monochrome view of the domes and prayer hall of Badshahi Mosque in Lahore',caption:'Badshahi Mosque, Lahore · monochrome architectural study',relatedHeritageIds:['major-doam-6467'],focalPoint:'50,45',treatment:'landscape',cropNote:'Keep all three dome finials; monochrome/tonal treatment is present in the licensed source.',visualNote:'Expressive source-processed monochrome; supporting editorial image rather than replacing the colour-led hero.'},
 'release-badshahi-night':{alt:'Illuminated Badshahi Mosque and its minarets at night in Lahore',caption:'Badshahi Mosque, Lahore · night view',relatedHeritageIds:['major-doam-6467'],focalPoint:'50,0',treatment:'cinematic-landscape',cropNote:'Anchor crop to the top to preserve the tall right-hand minaret finial. Avoid narrow portrait crops that lose the prayer hall.',visualNote:'Visually checked illuminated architecture and dark sky; final-CTA candidate. Final responsive crop requires page QA.'}
};
if(records.length!==10||records.some(x=>x.error))throw Error('All ten downloads must succeed before clearance');
const media=records.map(record=>({...record,...choices[record.id],credit:`${record.creator} / Wikimedia Commons / ${record.license}`,productionCleared:true,changes:'Resized WebP; layout crop',derivativeLicense:record.license,approvedUsage:['Virsapur local release candidate','Editorial heritage discovery and correctly captioned site representation'],usageRestrictions:'No endorsement implied. Do not imply Virsapur commissioned the photograph, carried out depicted work, or owns the monument. Preserve attribution and the applicable licence; BY-SA derivatives remain under the same licence.',visualReview:{date:'2026-10-22',method:'Each 1280-pixel WebP inspected individually, not just contact sheet',status:'reviewed',pageCropStatus:'pending release candidate responsive QA'}}));
for(const item of media){
 [item.focalX,item.focalY]=item.focalPoint.split(',').map(Number);
 item.derivatives={webp640:`assets/optimized/${item.id}-640.webp`,webp1280:`assets/optimized/${item.id}-1280.webp`};
 if(item.relatedComponentIds?.length)item.credit+=` · ${item.id==='release-shalimar'?'Shalamar Gardens component only; not Lahore Fort':'Takht-i-Bahi component only; not Sahr-i-Bahlol'}`;
}
await writeFile(join(root,'content/data/media.json'),JSON.stringify(media,null,2)+'\n');
const placements={
 'homepage.hero':'release-badshahi-courtyard',
 'homepage.final-action':'release-badshahi-night',
 'homepage.about.primary':'release-shah-jahan-portrait',
 'homepage.about.support':'release-shalimar',
 'why.hero':'release-shah-jahan-portrait',
 'why.approach.primary':'release-shah-jahan-courtyard',
 'why.approach.support':'release-takht-i-bahi',
 'programme-heritage-tours':'release-rohtas',
 'archive-category-archaeology-ancient-civilisations':'release-takht-i-bahi',
 'archive-category-architecture-built-heritage':'release-shah-jahan-portrait',
 'archive-category-sacred-heritage':'release-shah-jahan-courtyard',
 'archive-category-cultural-landscapes-historic-places':'release-shalimar'
};
const replaces={'assets/hero-badshahi.jpg':'release-badshahi-courtyard'};
await writeFile(join(root,'content/data/release-media-overrides.json'),JSON.stringify({placements,replaces,notes:'Release-candidate-only mappings. Shared temporary images are deliberately not globally replaced: their reuse across unrelated named places would create false subject claims. Keep Preview overrides unchanged. Use metadata caption/alt/focalPoint rather than previous-image metadata.'},null,2)+'\n');
const places=await read('content/data/heritage-places.json');
const catalogue=new Map();
for(const region of ['ajk','balochistan','gb','islamabad','kp','punjab','sindh']){
 const path=`qa-artifacts/final-build-2026-10-22/research/${region}/catalogue.json`;
 for(const row of (await read(path)).data||[])catalogue.set(String(row.id),{row,path});
}
const clean=x=>x&&!/^(?:blank\.(?:png|jpg)|null|none|undefined)$/i.test(String(x).trim());
const attempts=places.map(place=>{
 const match=String(place.sourceUrl||'').match(/\/sites\/(\d+)/),entry=catalogue.get(match?.[1]);
 const catalogueImages=entry?['image','image1','image2','image3','image4'].map(k=>entry.row[k]).filter(clean):[];
 const cleared=media.filter(x=>x.relatedHeritageIds.includes(place.id));
 const candidates=[place.imageOriginalUrl,...catalogueImages.map(x=>/^https?:/.test(x)?x:`https://doam.gov.pk/public/assets/assets/media/sites/${x}`)].filter(clean);
 return {id:place.id,title:place.title,existingImage:place.image||null,currentImagePresent:!!place.image,existingImageRights:place.image?'unverified-not-cleared-by-this-pass':'not-applicable',sourceCandidatePresent:candidates.length>0,candidateSourceUrls:[...new Set(candidates)],catalogueEvidence:entry?.path||null,clearedMediaIds:cleared.map(x=>x.id),rightsUnknown:candidates.length>0||!!place.image,noImage:cleared.length===0,attemptStatus:cleared.length?'cleared-local-alternative':candidates.length?'catalogue-candidate-rights-unverified':place.image?'existing-image-rights-unverified':'no-image-obtained',method:cleared.length?'Bounded Wikimedia search, file-page rights check, download and individual visual inspection':'Existing image metadata plus all-region local catalogue image-field inventory; no individual external image search claimed',decision:cleared.length?'Use the separately cleared local alternative with its precise caption. Existing catalogue image is not thereby cleared.':'No cleared image from this pass; release should omit the unverified image. Absence is not clearance.'};
});
const summary={date:'2026-10-22',totalPlaces:places.length,clearedMedia:media.length,placesWithClearedAlternative:attempts.filter(x=>x.clearedMediaIds.length).length,catalogueCandidatePresent:attempts.filter(x=>x.sourceCandidatePresent).length,noClearedImage:attempts.filter(x=>x.noImage).length,methodLimitation:'This is a complete inventory of local image/source-candidate fields for 606 places plus a bounded curated Wikimedia search, not 606 individual web image searches. Catalogue image availability never establishes reuse rights.'};
await writeFile(join(qa,'place-image-attempt-manifest.json'),JSON.stringify({summary,places:attempts},null,2)+'\n');
await writeFile(join(qa,'rights-review.json'),JSON.stringify({date:'2026-10-22',sources:media.map(x=>({id:x.id,sourceUrl:x.sourceUrl,creator:x.creator,license:x.license,licenseUrl:x.licenseUrl,sha256:x.sha256,productionCleared:x.productionCleared,review:x.visualReview,visualNote:x.visualNote,cropNote:x.cropNote})),unfilledContexts:['Founder portraits','Virsapur conservation teams and research activity','Workshops and craft activity','Cultural-event documentation','Objects/material-culture category','Specific named stories without an exact-subject photograph'],networkNote:'Commons API requests timed out. Full file-page content was verified via web reader; factual source records are saved in sources/. Original binaries downloaded from Wikimedia public upload server using PowerShell; their dimensions match the source pages.'},null,2)+'\n');
const optimizedBytes=(await Promise.all(media.flatMap(x=>[640,1280].map(w=>stat(join(root,`assets/optimized/${x.id}-${w}.webp`)))))).reduce((n,x)=>n+x.size,0);
console.log(JSON.stringify({...summary,optimizedBytes,originalBytes:media.reduce((n,x)=>n+x.bytes,0)},null,2));
