import { signUp, json, productionCmsUnavailable, requireSameOrigin, enforceRateLimit, responseWithCookies, sessionCookies } from '../../../api/_lib/http.js';
import { createSupabaseProvider } from '../../../src/cms/providers/supabase.mjs';
import { cmsConfig } from '../../../src/cms/config.mjs';
import { isValidPersonName } from '../../../src/input-validation.mjs';
import { readJson } from '../../hosted-members.mjs';

export default { async fetch(request) {
  const unavailable=productionCmsUnavailable();if(unavailable)return unavailable;
  if(request.method!=='POST')return json({ok:false,error:'Method not allowed.'},405,{allow:'POST'});
  try{
    requireSameOrigin(request);await enforceRateLimit(request,'member-signup',5,3600);
    const input=await readJson(request,4096),fullName=String(input?.fullName||'').trim(),email=String(input?.email||'').trim().toLowerCase(),password=input?.password;
    if(!input||Object.keys(input).some(key=>!['fullName','email','password','remember'].includes(key)))return json({ok:false,error:'Only name, email and password can be submitted.'},422);
    if(fullName.length<2||fullName.length>80||!isValidPersonName(fullName))return json({ok:false,error:'Enter a valid name (2–80 characters).'},422);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254)return json({ok:false,error:'Enter a valid email address.'},422);
    if(typeof password!=='string'||password.length<8||password.length>128||!/[A-Z]/.test(password)||!/[0-9]/.test(password))return json({ok:false,error:'Password must be 8–128 characters and include an uppercase letter and a number.'},422);
    const result=await signUp(email,password,fullName),user=result?.user;
    if(!user?.id)throw Object.assign(new Error('Signup did not return an account.'),{status:502});
    if(Array.isArray(user.identities)&&user.identities.length===0)return json({ok:true,requiresEmailConfirmation:true},202);
    const cms=createSupabaseProvider({config:cmsConfig()});
    await cms.request('/rest/v1/member_profiles',{method:'POST',query:{on_conflict:'user_id'},body:{user_id:user.id,full_name:fullName,updated_at:new Date().toISOString()},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
    const safeUser={id:user.id,fullName,email:user.email||email,createdAt:user.created_at};
    if(result.access_token&&result.refresh_token)return responseWithCookies({ok:true,user:safeUser},201,sessionCookies(result));
    return json({ok:true,user:safeUser,requiresEmailConfirmation:true},202);
  }catch(e){const status=e.status||(e.code==='user_already_exists'||/already registered|already exists/i.test(e.message||'')?409:500);if(status>=500)console.error('Hosted signup failed',{name:e?.name||'Error',status,message:e?.message||'Unknown error'});return json({ok:false,error:status===500?'Account creation could not be completed.':e.message},status);}
} };
