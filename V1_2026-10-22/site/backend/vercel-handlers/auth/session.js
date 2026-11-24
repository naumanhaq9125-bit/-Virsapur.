import { clearSessionCookies, cookies, handleError, json, productionCmsUnavailable, refresh, requireMember, responseWithCookies, sessionCookies } from '../../../api/_lib/http.js';
import { publicMember, profileFor, provider } from '../../hosted-members.mjs';
export default { async fetch(request) {
  const unavailable=productionCmsUnavailable();if(unavailable)return unavailable;
  if(request.method!=='GET')return json({ok:false,error:'Method not allowed.'},405);
  try{let auth;try{auth=await requireMember(request);}catch(initial){const token=cookies(request)['__Host-virsapur_refresh'];if(!token)throw initial;const tokens=await refresh(token),headers=new Headers(request.headers);headers.set('cookie',`__Host-virsapur_access=${encodeURIComponent(tokens.access_token)}`);auth=await requireMember(new Request(request.url,{headers}));const profile=await profileFor(provider(),auth.user);return responseWithCookies({ok:true,user:publicMember(auth.user,profile)},200,sessionCookies(tokens));}const profile=await profileFor(provider(),auth.user);return json({ok:true,user:publicMember(auth.user,profile)});}catch(e){const result=handleError(e);if(e.status===401){for(const value of clearSessionCookies())result.headers.append('set-cookie',value);}return result;}
} };
