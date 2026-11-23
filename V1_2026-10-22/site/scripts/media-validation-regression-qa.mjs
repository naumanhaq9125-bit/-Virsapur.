// Pure offline regression tests. Does not import/start Studio or write canonical content.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createMediaPolicy} from '../src/media-policy.mjs';
import {validateContentInput,validateCollection,validateHeritageComponents} from '../src/cms/validation.mjs';
import {validateHeritageIds} from '../src/heritage-relations.mjs';

const passed=[];
function test(name,fn){fn();passed.push(name);}
const server=await readFile(new URL('../studio/server.mjs',import.meta.url),'utf8');
const localFunction=server.slice(server.indexOf('function validate(name,'),server.indexOf('function runNode('));
assert(localFunction.startsWith('function validate('));
const localValidate=vm.runInNewContext(localFunction+';validate',{validateContentInput,validateHeritageIds});

test('local collection shape comes from route identity, before any write',()=>{
  for(const name of ['stories','heritagePlaces','media','programmes','archiveCategories'])for(const value of [{},null,'oops',42])assert(localValidate(name,value).length,`${name} rejects ${JSON.stringify(value)}`);
  assert(localValidate('homepage',[]).length);assert.equal(localValidate('homepage',{}).length,0);
  assert.equal(localValidate('stories',[]).length,0);
  assert(localValidate('site',{navigation:{}}).length);
  assert(localValidate('stories',[null]).length);
  assert(server.includes('const errors=validate(name,value,heritageRecords);if(errors.length)return json(res,422'));
});
const clear={id:'media-one',src:'assets/image.jpg',productionCleared:true,license:'CC BY 4.0',sourceUrl:'https://example.invalid/source',credit:'Creator',relatedHeritageIds:['place-one'],derivatives:{webp640:'assets/image-640.webp',webp1280:'assets/image-1280.webp'}};
const place={id:'place-one',title:'Place',image:null};
test('heritage related media uses identical safe-path gate',()=>{
  for(const changes of [{src:'https://third-party.invalid/photo.jpg'},{src:'assets/../private.jpg'},{derivatives:{webp640:'assets/good.webp',webp1280:'../private-file'}},{derivatives:['assets/a.webp']},{optimizedStem:'../private'},{optimizedStem:'x" onerror="alert(1)'}]){
    const item={...clear,...changes},policy=createMediaPolicy({media:[item]});
    assert.equal(policy.resolve(item).allowed,false);const record=policy.heritage([place])[0];assert.equal(record.image,null);assert.equal(record.productionCleared,false);
  }
  const policy=createMediaPolicy({media:[clear]});assert.equal(policy.resolve(clear).allowed,true);assert.equal(policy.heritage([place])[0].image,'assets/image-1280.webp');
  const original=[{...place,image:'https://preview.invalid/reference.jpg'}];assert.strictEqual(createMediaPolicy({media:[clear],preview:true}).heritage(original),original);
  assert.equal(createMediaPolicy({}).resolve('assets/logo_full_slate.png').allowed,true);
});
test('malformed categories return validation errors, exact array membership remains',()=>{
  for(const categoryIds of [42,'category-one',{},null,['category-one',42]])assert(validateCollection('stories',[{id:'story-one',primaryCategoryId:'category-one',categoryIds}]).length);
  assert(validateCollection('stories',[{id:'story-one',primaryCategoryId:'one',categoryIds:['category-one']}]).length);
  assert.equal(validateCollection('stories',[{id:'story-one',primaryCategoryId:'category-one',categoryIds:['category-one']}]).length,0);
  assert.equal(validateCollection('stories',[{id:'draft-without-categories'}]).length,0);
});
test('coordinates reject partial/non-numeric/range errors in shared and local guards',()=>{
  const base={id:'place-one',title:'Place',slug:'place',recordType:'place',heritageDomain:'cultural-tangible',designationType:'none',sourceAuthority:'Institution',sourceUrl:'https://example.invalid'};
  for(const point of [{latitude:30,longitude:null},{latitude:null,longitude:70},{latitude:'30',longitude:'70'},{latitude:91,longitude:70},{latitude:30,longitude:181},{latitude:NaN,longitude:70},{latitude:Infinity,longitude:70},{latitude:false,longitude:0},null]){
    const record={...base,components:[point&&{id:'point',name:'Point',...point}]};
    assert(validateHeritageComponents(record).length);assert(validateCollection('heritagePlaces',[record]).length);assert(localValidate('heritagePlaces',[record]).length);
  }
  for(const point of [{latitude:30,longitude:70},{latitude:0,longitude:0},{latitude:-90,longitude:180},{latitude:null,longitude:null,coordinateStatus:'missing-at-source'}])assert.equal(localValidate('heritagePlaces',[{...base,components:[{id:'point',name:'Point',...point}]}]).length,0);
  assert(localValidate('heritagePlaces',[{...base,components:{}}]).length);
});
console.log(JSON.stringify({ok:true,offline:true,tests:passed.length,passed,canonicalWrites:0,serverStarted:false},null,2));
