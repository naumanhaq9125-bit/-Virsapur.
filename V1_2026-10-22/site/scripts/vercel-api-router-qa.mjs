import assert from 'node:assert/strict';
import {resolveApiHandler} from '../api/[...path].js';

const routes=[
  '/api/activity','/api/admin-custom-tour-quotes','/api/admin/trip-bookings','/api/admin/trip-bookings/VT-qa',
  '/api/auth/login','/api/auth/logout','/api/auth/profile','/api/auth/session','/api/auth/signup',
  '/api/auth-login','/api/auth-logout','/api/auth-session','/api/content','/api/custom-tour-quotes',
  '/api/export','/api/import','/api/media','/api/media-preview','/api/member/places',
  '/api/member/trip-bookings','/api/member/trips','/api/member/trips/qa-trip','/api/member/trips/qa-trip/submit',
  '/api/member-session','/api/preview','/api/publish','/api/publish-finalize','/api/publish-status',
  '/api/revisions','/api/saved-articles','/api/saved-articles/qa-story','/api/stripe/webhook','/api/trip-bookings',
];
for(const route of routes)assert.equal(typeof resolveApiHandler(route),'function',`Route is not mapped: ${route}`);
assert.equal(resolveApiHandler('/api/not-a-route'),null);
assert.equal(resolveApiHandler('/api/member/trips/qa-trip/submit/'),resolveApiHandler('/api/member/trips/qa-trip/submit'));
console.log(JSON.stringify({ok:true,checks:routes.length+2,apiFunctionFiles:1,passed:true,syntheticOnly:true},null,2));
