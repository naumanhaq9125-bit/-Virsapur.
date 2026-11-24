import { createHostedMemberHandlers } from '../hosted-members.mjs';
export default { fetch: request => createHostedMemberHandlers().savedArticles(request) };
