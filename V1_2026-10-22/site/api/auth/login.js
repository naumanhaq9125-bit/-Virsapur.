import { enforceRateLimit, handleError, json, login, productionCmsUnavailable, requireSameOrigin, responseWithCookies, sessionCookies } from '../_lib/http.js';
import { readJson } from '../../backend/hosted-members.mjs';
export default { async fetch(request) {
  const unavailable=productionCmsUnavailable();if(unavailable)return unavailable;
  if(request.method!=='POST')return json({ok:false,error:'Method not allowed.'},405,{allow:'POST'});
  try{requireSameOrigin(request);await enforceRateLimit(request,'member-login',8,900);const input=await readJson(request,4096);if(!input||Object.keys(input).some(key=>!['email','password','remember'].includes(key))||typeof input.email!=='string'||input.email.length>254||typeof input.password!=='string'||input.password.length>128)return json({ok:false,error:'Enter a valid email and password.'},422);const tokens=await login(input.email.trim().toLowerCase(),input.password);const user=tokens.user||{};return responseWithCookies({ok:true,user:{id:user.id,fullName:user.user_metadata?.full_name||user.user_metadata?.name||'',email:user.email||input.email}},200,sessionCookies(tokens));}
  catch(e){if(e.status===400||e.status===401)return json({ok:false,error:'Incorrect email or password. Please try again.'},401);return handleError(e);}
} };
