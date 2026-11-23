import { createOfficialTripBookingHandlers } from '../backend/official-trip-bookings.mjs';
export default { fetch: request => createOfficialTripBookingHandlers().handle(request) };
