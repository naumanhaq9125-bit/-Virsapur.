import { createHostedMemberHandlers } from '../../backend/hosted-members.mjs';
export default { fetch: request => createHostedMemberHandlers().adminBookings(request) };
