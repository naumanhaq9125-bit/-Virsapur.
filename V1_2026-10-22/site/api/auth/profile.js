import { handleError, json, productionCmsUnavailable, requireMember, requireSameOrigin, updateMemberAuth } from '../_lib/http.js';
import { isValidPersonName } from '../../src/input-validation.mjs';
import { profileFor, provider } from '../../backend/hosted-members.mjs';
import { readJson } from '../../backend/hosted-members.mjs';
export default { async fetch(request) {
  const unavailable=productionCmsUnavailable();if(unavailable)return unavailable;
  if(request.method!=='PATCH')return json({ok:false,error:'Method not allowed.'},405);
  try{requireSameOrigin(request);const {user,token}=await requireMember(request),input=await readJson(request,2048);if(!input||Object.keys(input).some(key=>key!=='fullName'))return json({ok:false,error:'Only the full name can be updated here.'},422);const fullName=String(input.fullName||'').trim();if(fullName.length<2||fullName.length>80||!isValidPersonName(fullName))return json({ok:false,error:'Enter a valid name (2–80 characters).'},422);await updateMemberAuth(token,fullName);const cms=provider(),now=new Date().toISOString();await cms.request('/rest/v1/member_profiles',{method:'POST',query:{on_conflict:'user_id'},body:{user_id:user.id,full_name:fullName,updated_at:now},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});return json({ok:true,user:{id:user.id,fullName,email:user.email}});}catch(e){return handleError(e);}
} };
