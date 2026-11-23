// Uses the DOAM public map's own read-only filter endpoint, with its normal session.
const [province,pattern]=process.argv.slice(2);
const home=await fetch('https://doam.gov.pk/public/home');
const html=await home.text();
const token=html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
const cookie=home.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
const response=await fetch('https://doam.gov.pk/public/sites/filter',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',cookie,'accept':'application/json'},body:new URLSearchParams({_token:token,city:'',type:'',era:'',province,visibility:'Public'})});
if(!response.ok) throw Error(`Public catalogue returned ${response.status}`);
const data=(await response.json()).data;
const selected=data.filter(x=>new RegExp(pattern,'i').test(x.name_of_site));
console.log(JSON.stringify(selected.map(x=>({id:x.id,title:x.name_of_site,province:x.province,district:x.district,lat:x.latitude,lon:x.longitude})),null,2));
