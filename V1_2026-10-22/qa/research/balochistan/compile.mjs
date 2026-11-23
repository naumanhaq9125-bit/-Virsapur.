// Deliberately curated research proposals. Does not ingest canonical content.
import {readFile,writeFile} from 'node:fs/promises';
import {prepareHeritageRecords} from '../../../../src/heritage-spatial.mjs';
import {loadHeritageContext} from '../../../../src/heritage-context.mjs';
const date='2026-10-22',base=new URL('./',import.meta.url);
const catalogue=JSON.parse(await readFile(new URL('catalogue.json',base))).data;
const byId=new Map(catalogue.map(x=>[x.id,x]));
const existing=JSON.parse(await readFile('content/data/heritage-places.json'));
const previous=JSON.parse(await readFile('qa-artifacts/v1-finalization/heritage-research/balochistan/research.json'));
const context=await loadHeritageContext(process.cwd());
const selections=[
 [9660,'Samungli Mound No. 2','Archaeological Site','A low archaeological mound at Samungli preserves part of the Quetta valley’s settlement record. The federal inventory describes surviving pottery and a mound near the village, distinguishing it from the valley’s other numbered archaeological sites.'],
 [9661,'Killi Gul Muhammad Mound No. 1','Archaeological Site','The mound catalogued near Killi Gul Muhammad preserves pottery-bearing archaeological deposits beneath and beside a later graveyard. It belongs to the Quetta valley’s early settlement landscape. Conflicting chronological statements in the inventory require specialist review before assigning a precise date.'],
 [9669,'Sheikh Manda Mound No. 10','Archaeological Site','An archaeological mound near Sheikh Manda lies within the Quetta valley’s network of early settlements. The federal inventory records surviving structural traces and pottery, giving the site value beyond its modest appearance in the modern landscape.'],
 [9664,'Kuchlak Mound No. 7','Archaeological Site','A settlement mound at Kuchlak is documented beside the historic Quetta–Chaman corridor. Its raised archaeological deposits and recorded pottery preserve evidence of occupation in a valley shaped by movement between upland routes.'],
 [9670,'Nauhisar Mound No. 11','Archaeological Site','A small archaeological mound near Nauhisar preserves pottery-bearing deposits within the Quetta valley. The officially recorded site contributes to the regional settlement inventory without implying that its occupation sequence has been fully established.'],
 [9658,'Harian Haider Zai Mound','Archaeological Site','A broad prehistoric mound near Harian Haider Zai contains evidence of settlement recorded through pottery and stone tools. The inventory connects this landscape with archaeological investigations around Loralai; the mound is retained as a distinct surveyed location.'],
 [9663,'Shahi Khan Mound No. 6','Archaeological Site','The archaeological mound near Shahi Khan and Pir Ballo preserves pottery-bearing settlement deposits along the Sariab corridor. Later graves form part of its recorded surface, showing how an older settlement location acquired subsequent uses.'],
 [9666,'Samali Mound No. 8','Archaeological Site','A prominent mound at Samali forms part of the officially catalogued archaeological landscape north of Quetta. Its rounded profile and surviving deposits offer a tangible location for studying the valley’s settlement history.'],
 [9667,'Mehtar Zai Mound No. 9','Archaeological Site','An archaeological mound at Mehtar Zai preserves evidence of an earlier settlement beneath later uses of the site. The federal description records its incorporation into a military redoubt, illustrating the reuse of raised archaeological ground.'],
 [9681,'Ibn-e-Haroon Tomb, Bela','Sacred Heritage','A substantial square brick tomb stands on Bela’s outskirts. Catalogued under the name Ibn-e-Haroon, the structure represents the town’s historic funerary architecture. The record identifies the monument without treating uncertain personal associations as established biography.'],
 [10399,'Robert Sandeman Tomb, Bela','Historic Monument','A marble funerary monument in Sandeman Park at Bela commemorates the colonial administrator Robert Sandeman. Its architectural and commemorative setting provides a material record of British-period authority in the region.'],
 [10403,'Zoroastrian Graveyard, Quetta','Sacred Heritage','A walled Zoroastrian graveyard in Quetta contains brick and marble funerary monuments with inscriptions in several languages. The cemetery is a surviving record of the city’s religious communities and their commemorative traditions.'],
 [8423,'Saindak Fort','Fortification','A courtyard fort near Saindak uses earthen walls strengthened with straw. The official catalogue dates its construction to 1912 and records a deteriorated condition. Its surviving fabric documents frontier infrastructure in western Balochistan.'],
 [8718,'Bit Fortress','Fortification','The remains of a fortress occupy a terrace above Bit village near the Gish Kaur. The surveyed enclosure preserves a local defensive site within the Kech landscape; its precise construction history remains uncertain.'],
 [9124,'Hazar Ganji Fort','Fortification','A rectangular fort enclosure in Khuzdar’s landscape preserves stone and mud-brick construction with rounded defensive projections. The official inventory records the site as a historic fortification, distinct from similarly named modern locations.'],
 [9183,'Chogaanekand Fort, Turbat','Fortification','An earthen fort at Chogaanekand near Turbat represents the fortified compounds of historic Makran. Its recorded mud-brick construction contributes to the regional architectural inventory, although its exact foundation date is not established.'],
 [10400,'Baba Khatawara Ashram, Gandhawa','Sacred Heritage','A Hindu ashram in Gandhawa’s old bazaar includes a temple, assembly space and residential rooms. Surviving decorative details and the arrangement of the compound preserve evidence of the town’s historic religious and community life.'],
 [10397,'Sardar Ahmad Khan Magsi Tomb','Sacred Heritage','A square funerary monument near Jhal Magsi is distinguished by its dome and decorated wall panels. Catalogued as the tomb of Sardar Ahmad Khan Magsi, it forms part of the area’s historic cemetery architecture.']
];
const accepted=selections.map(([id,title,heritageCategory,summary])=>{
 const x=byId.get(id),sourceUrl=`https://doam.gov.pk/public/sites/${id}`;
 for(const f of ['lat_min','lat_sec','long_min','long_sec'])if(!(Number(x[f])>=0&&Number(x[f])<60))throw Error(`Malformed DMS ${id}:${f}`);
 const lat=Number(x.lat_deg)+Number(x.lat_min)/60+Number(x.lat_sec)/3600,lon=Number(x.long_deg)+Number(x.long_min)/60+Number(x.long_sec)/3600;
 if(Math.abs(lat-Number(x.latitude))>0.000002||Math.abs(lon-Number(x.longitude))>0.000002)throw Error(`DMS/decimal mismatch ${id}`);
 if(existing.some(r=>r.id===`major-doam-${id}`||r.sourceUrl===sourceUrl))throw Error(`Already canonical ${id}`);
 return {id:`major-doam-${id}`,slug:title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),status:'published',title,shortTitle:title,summary,recordType:'place',heritageDomain:'cultural-tangible',heritageCategory,designationType:'none',designationName:'Heritage site',sourceAuthority:'Department of Archaeology & Museums, Government of Pakistan',sourceUrl,sourceTitle:x.name_of_site.trim(),sourceRegion:x.province,sourceDistrict:x.district,sourcePublication:x.title,verifiedDate:date,sourceNote:'Official catalogue identity and published point reviewed. Historical district attribution is retained as source metadata; current map context is derived from unchanged runtime boundaries. Access and visitor facilities have not been confirmed.',legalStatus:x.legal_status,legalStatusNote:'Attributed catalogue statement; not an independent assessment of current legal protection.',components:[{id:`major-doam-${id}-point`,name:title,latitude:Number(x.latitude),longitude:Number(x.longitude),coordinateStatus:'verified-official',coordinateSource:sourceUrl,coordinateNote:'Exact decimal coordinate from the official catalogue; DMS consistency checked. This is source verification, not a field survey.'}],mapDisplay:'listed',image:null,imageAlt:'',placeholderImage:true,imageTemporary:false,productionCleared:false,featured:false,sortOrder:50000+id,detailsPageStatus:'available'};
});
const spatial=await prepareHeritageRecords(process.cwd(),accepted);
if(spatial.failures.length||spatial.overlaps.length)throw Error(JSON.stringify({failures:spatial.failures,overlaps:spatial.overlaps}));
const issues=[
 [8591,'Malformed source DMS seconds (890); public decimal alone does not resolve the source-coordinate defect.'],
 [8541,'Galuga tomb group A–G shares one source point with invalid latitude seconds79. Ensemble needs a verified group location, not seven duplicate Places.'],
 [8867,'Coarse Killi Gul Muhammad entry conflicts in precision/chronology with numbered mound9661. Do not create a second public entity; retain this candidate for identity reconciliation.'],
 [8422,'Kachao Fort coordinate conflicts with stated direction/distance from Taftan; no relocation inferred.'],
 [10405,'Sandeman Fort is described in Zhob but the published point is in Quetta; reject coordinate.'],
 [9190,'Mir Chakar tomb description is a fort description and may duplicate retained Mir Chakar Fort8426. Identity unresolved.'],
 [9657,'Tor Dheri point conflicts with its stated proximity to Dabarkot; coordinate requires corroboration.'],
 [9683,'Hinidan tombs location description contains inconsistent distances; cannot establish monument-scale identity/location.'],
 [10389,'Shireen Farhad tomb is associated with folklore; relative location requires corroboration before adding the source point.'],
 [8666,'Pidarak Oasis Fortress appears twice (also8494); shared rounded point needs precision and ensemble review.'],
 [8590,'Palli Kalat tomb longitude is coarse and exact monument location has not been independently resolved.'],
 [8565,'Zahida Bibi tomb point needs corroboration against Nag locality; no invented correction.'],
 [8581,'Shah Qalandar tomb source/derived district context differs; retain for geographic diagnosis.'],
 [8592,'Gwadar tomb identity and stated city setting are insufficiently reconciled with the catalogue coordinate.'],
 [9101,'Janabad is described as completely levelled; relationship to nearby Harian Haider Zai mound9658 needs reconciliation before a separate public Place.']
];
const unresolved=[...previous.unresolved,...issues.map(([id,note])=>{const x=byId.get(id);return{id:`doam-${id}`,title:x?.name_of_site?.trim()||String(id),districtIds:x?.derivedDistricts||[],sourceDistrict:x?.district,sourceUrl:`https://doam.gov.pk/public/sites/${id}`,reason:'source/identity/coordinate review',note};})].filter((x,i,a)=>a.findIndex(y=>(y.id||y.title)===(x.id||x.title))===i);
const legacy={barshore:['pishin','killa saifullah'],hub:['lasbela','las bela'],'north-dera-bugti':['dera bugti'],'south-dera-bugti':['dera bugti'],'quetta-east':['quetta'],'quetta-west':['quetta'],rakhni:['barkhan','loralai'],'usta-muhammad':['jaffarabad','nasirabad'],wadh:['khuzdar']};
const districts=Object.values(context.districts).filter(x=>x.parentRegionId==='balochistan').map(d=>{
 const labels=[d.name.toLowerCase(),...(legacy[d.id.replace('balochistan-','')]||[])];
 const candidates=catalogue.filter(x=>x.derivedDistricts.includes(d.id)||labels.includes(x.district.toLowerCase()));
 const retained=existing.filter(x=>x.districtIds?.includes(d.id)),added=spatial.records.filter(x=>x.districtIds.includes(d.id));
 return{id:d.id,name:d.name,catalogueCandidateCount:candidates.length,candidateIds:candidates.map(x=>`doam-${x.id}`),existingIds:retained.map(x=>x.id),acceptedIds:added.map(x=>x.id),sourceUrls:['https://doam.gov.pk/public/home','https://cta.gob.pk/archaeology/',...added.map(x=>x.sourceUrl)],status:added.length?'reviewed-additional-records':retained.length?'reviewed-existing-records-retained':d.publicationStatus==='withheld'?'reviewed-runtime-geometry-withheld':'reviewed-no-additional-coordinate-verified',note:'All474 catalogue rows were screened by identity, source district and protected spatial context. Only individually reviewed proposals are accepted; not a declaration of district completeness or absence of heritage. Earlier university-survey and coordinate backlogs remain unresolved.'};
});
const result={region:'balochistan',accessDate:date,methodology:'Fresh complete federal inventory, manual named-site review, source DMS consistency, duplication/ensemble checks and unchanged ADM2 spatial validation. No image rights inferred. Additional listed records are independent of editorial/map pins.',authoritySources:[{authority:'Department of Archaeology & Museums, Government of Pakistan',url:'https://doam.gov.pk/public/home',title:'Heritage of Pakistan official catalogue',accessDate:date},{authority:'Directorate of Archaeology & Museums, Culture, Tourism & Archives Department, Government of Balochistan',url:'https://cta.gob.pk/archaeology/',title:'Current provincial archaeology portal',accessDate:date}],districts,accepted,unresolved,proposalQA:{spatialFailures:spatial.failures,spatialOverlaps:spatial.overlaps}};
await writeFile(new URL('research.json',base),JSON.stringify(result,null,2));
console.log({accepted:accepted.length,unresolved:unresolved.length,districts:districts.length});
