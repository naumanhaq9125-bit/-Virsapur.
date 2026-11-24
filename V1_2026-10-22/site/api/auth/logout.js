import { clearSessionCookies, cookies, handleError, json, productionCmsUnavailable, requireSameOrigin, responseWithCookies } from '../_lib/http.js';
export default { async fetch(request) {
  const unavailable=productionCmsUnavailable();if(unavailable)return unavailable;
  if(request.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  try{requireSameOrigin(request);const access=cookies(request).__Host_virsapur_access;const {cmsConfig}=await import('../../src/cms/config.mjs');const config=cmsConfig();if(access&&config.supabaseUrl&&config.supabasePublishableKey)await fetch(`${config.supabaseUrl}/auth/v1/logout`,{method:'POST',headers:{apikey:config.supabasePublishableKey,authorization:`Bearer ${access}`}}).catch(()=>{});return responseWithCookies({ok:true},200,clearSessionCookies());}catch(e){return handleError(e);}
} };
