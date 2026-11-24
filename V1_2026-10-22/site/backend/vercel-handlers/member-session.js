import { handleError, json, productionCmsUnavailable, requireMember } from '../../api/_lib/http.js';

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable();
  if (unavailable) return unavailable;
  if (request.method !== 'GET') return json({ok:false,error:'Method not allowed.'},405,{allow:'GET'});
  try {
    const {user} = await requireMember(request);
    return json({ok:true,user:{id:user.id,fullName:user.user_metadata?.full_name||user.user_metadata?.name||'',email:user.email||''}});
  } catch (error) {
    return handleError(error);
  }
} };
