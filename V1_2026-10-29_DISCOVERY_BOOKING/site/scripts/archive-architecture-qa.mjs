import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin="http://127.0.0.1:4173";
const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1");
const artifactRoot=join(root,"qa-artifacts","archive-architecture");
await mkdir(artifactRoot,{recursive:true});

const report={startedAt:new Date().toISOString(),checks:[],restored:false};
const check=(condition,label,detail="")=>{report.checks.push({label,passed:Boolean(condition),detail});if(!condition)throw new Error(`${label}${detail?`: ${detail}`:""}`);};
async function request(path,options={}){const response=await fetch(`${origin}${path}`,{headers:{"content-type":"application/json",...(options.headers||{})},...options});const text=await response.text();if(!response.ok)throw new Error(`${options.method||"GET"} ${path} returned ${response.status}: ${text}`);return text?JSON.parse(text):null;}
async function put(name,value){return request(`/api/content/${name}`,{method:"PUT",body:JSON.stringify(value)});}
async function page(path){const response=await fetch(`${origin}${path}`);const text=await response.text();check(response.ok,`HTTP ${path}`,String(response.status));return text;}

const originals=await request("/api/content");
const protectedCollections=["archiveCategories","stories","programmes","homepage"];
await writeFile(join(artifactRoot,"pre-test-content-snapshot.json"),`${JSON.stringify(Object.fromEntries(protectedCollections.map(key=>[key,originals[key]])),null,2)}\n`);

try{
  check(originals.archiveCategories.length===6,"Six baseline Archive Categories are present",String(originals.archiveCategories.length));
  check(originals.stories.length===12,"All twelve migrated stories are present",String(originals.stories.length));
  check(originals.programmes.length>=4,"Programme baseline is present",String(originals.programmes.length));
  check(originals.collaborators.length===8,"All eight collaborators are preserved as content",String(originals.collaborators.length));

  const category={...structuredClone(originals.archiveCategories[0]),id:"qa-category",slug:"qa-field-notes",title:"QA Field Notes",shortTitle:"QA Field Notes",summary:"A temporary category used to verify the local publishing workflow.",description:"This temporary Archive Category verifies dynamic collection routes, story assignment and Studio-safe publication.",featured:false,showOnHomepage:true,sortOrder:997,homepageOrder:997,seo:{title:"QA Field Notes | Virsapur Archives",description:"Temporary local QA category for the Virsapur Archive architecture."}};
  const categories=[...originals.archiveCategories,category];
  await put("archiveCategories",categories);
  check((await page("/preview/archives/category/qa-field-notes/")).includes("QA Field Notes"),"Dynamic category route builds in Preview");

  const story={...structuredClone(originals.stories[0]),id:"qa-story",slug:"qa-category-story",status:"published",featured:true,title:"A Temporary Archive Story for Category Testing",summary:"A local-only test record proving that Archive stories can be assigned to a newly created category.",primaryCategoryId:category.id,categoryIds:[category.id],category:category.title,body:[{type:"paragraph",text:"This temporary editorial record verifies the complete local Archive workflow without changing canonical production content."}],sortOrder:997,seo:{title:"Temporary Archive Story | Virsapur",description:"A local-only test story for the Virsapur Archive publishing workflow."}};
  await put("stories",[...originals.stories,story]);
  const categoryHtml=await page("/preview/archives/category/qa-field-notes/");
  check(categoryHtml.includes(story.title),"New story appears on its assigned category landing");
  check((await page("/preview/archives/qa-category-story/")).includes("QA Field Notes"),"Story page exposes canonical category context");

  const programme={...structuredClone(originals.programmes[0]),id:"qa-programme",slug:"qa-cultural-events-with-a-deliberately-long-title",status:"published",title:"Cultural Events, Learning Encounters and Community Heritage Conversations",summary:"A temporary local programme record used to verify responsive title wrapping and programme publishing.",sortOrder:997,seo:{title:"Temporary Cultural Events Programme | Virsapur",description:"A local-only programme created for responsive and publishing QA."}};
  await put("programmes",[...originals.programmes,programme]);
  check((await page("/preview/programmes/")).includes(programme.title),"New programme appears in the programme catalogue");

  const homepage=structuredClone(originals.homepage);
  homepage.modules=[homepage.modules[1],homepage.modules[0],...homepage.modules.slice(2)];
  homepage.experiences.programmeIds=[programme.id,...homepage.experiences.programmeIds];
  homepage.stories.storyIds=[story.id,...(homepage.stories.storyIds||[])];
  homepage.themes ||= {};
  await put("homepage",homepage);
  const homeHtml=await page("/preview/");
  check(homeHtml.indexOf("quick-discovery")<homeHtml.indexOf("discovery-hero"),"Homepage module order is stored and rendered exactly");
  check(homeHtml.includes(programme.title),"Homepage programme selection is data-driven");
  check(homeHtml.includes(story.title),"Homepage story selection is data-driven");
  check(homeHtml.includes("QA Field Notes"),"Homepage themes are sourced from Archive Categories");

  const publish=await request("/api/publish-local",{method:"POST",body:"{}"});
  check(publish.ok,"Publish to Local Production succeeds",publish.message||"");
  check((await page("/production/archives/category/qa-field-notes/")).includes(story.title),"Published category and story reach Local Production");
  check((await page("/production/service/qa-cultural-events-with-a-deliberately-long-title/")).includes(programme.title),"Published programme reaches Local Production");
}finally{
  for(const name of protectedCollections)await put(name,originals[name]);
  const publish=await request("/api/publish-local",{method:"POST",body:"{}"});
  report.restored=Boolean(publish.ok);
  report.finishedAt=new Date().toISOString();
  await writeFile(join(artifactRoot,"functional-test-report.json"),`${JSON.stringify(report,null,2)}\n`);
}

console.log(JSON.stringify(report,null,2));
