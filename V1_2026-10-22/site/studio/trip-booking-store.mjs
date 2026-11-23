import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

const STATUSES = new Set(['pending', 'confirmed', 'declined', 'cancelled']);

export function createTripBookingStore(file) {
  const database = new DatabaseSync(file);
  database.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
  const existing = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='official_trip_bookings'").get();
  if (!existing) {
    database.exec(`CREATE TABLE official_trip_bookings (
      id TEXT PRIMARY KEY, trip_id TEXT NOT NULL, user_id TEXT, trip_title TEXT NOT NULL,
      full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
      seats INTEGER NOT NULL CHECK(seats BETWEEN 1 AND 10),
      status TEXT NOT NULL CHECK(status IN ('pending','confirmed','declined','cancelled')),
      created_at TEXT NOT NULL
    )`);
  } else if (!existing.sql.includes("'pending'") || !existing.sql.includes("'declined'")) {
    const hadUserId = database.prepare('PRAGMA table_info(official_trip_bookings)').all().some(column => column.name === 'user_id');
    database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE official_trip_bookings_next (
        id TEXT PRIMARY KEY, trip_id TEXT NOT NULL, user_id TEXT, trip_title TEXT NOT NULL,
        full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
        seats INTEGER NOT NULL CHECK(seats BETWEEN 1 AND 10),
        status TEXT NOT NULL CHECK(status IN ('pending','confirmed','declined','cancelled')),
        created_at TEXT NOT NULL
      );
      INSERT INTO official_trip_bookings_next(id,trip_id,user_id,trip_title,full_name,email,phone,seats,status,created_at)
        SELECT id,trip_id,${hadUserId ? 'user_id' : 'NULL'},trip_title,full_name,email,phone,seats,
          CASE status WHEN 'confirmed' THEN 'confirmed' ELSE 'cancelled' END,created_at FROM official_trip_bookings;
      DROP TABLE official_trip_bookings;
      ALTER TABLE official_trip_bookings_next RENAME TO official_trip_bookings;
      COMMIT;`);
  }
  const existingColumns = new Set(database.prepare('PRAGMA table_info(official_trip_bookings)').all().map(column => column.name));
  for (const [name, declaration] of Object.entries({
    payment_status: "TEXT NOT NULL DEFAULT 'not_required'",
    payment_amount: 'INTEGER',
    payment_currency: 'TEXT',
    checkout_session_id: 'TEXT',
    checkout_expires_at: 'TEXT',
    paid_at: 'TEXT',
    payment_intent_id: 'TEXT'
  })) if (!existingColumns.has(name)) database.exec(`ALTER TABLE official_trip_bookings ADD COLUMN ${name} ${declaration}`);
  database.exec(`CREATE INDEX IF NOT EXISTS official_trip_bookings_inventory_idx ON official_trip_bookings(trip_id,status);
    CREATE INDEX IF NOT EXISTS official_trip_bookings_email_idx ON official_trip_bookings(email,created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS official_trip_bookings_checkout_idx ON official_trip_bookings(checkout_session_id) WHERE checkout_session_id IS NOT NULL;
    CREATE TABLE IF NOT EXISTS stripe_webhook_events (event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, processed_at TEXT NOT NULL)`);

  const columns = `id,trip_id AS tripId,user_id AS userId,trip_title AS tripTitle,full_name AS fullName,email,phone,seats,status,
    created_at AS createdAt,payment_status AS paymentStatus,payment_amount AS paymentAmount,payment_currency AS paymentCurrency,
    checkout_session_id AS checkoutSessionId,checkout_expires_at AS checkoutExpiresAt,paid_at AS paidAt,payment_intent_id AS paymentIntentId`;
  const usedSeats = database.prepare(`SELECT COALESCE(SUM(seats),0) AS seats FROM official_trip_bookings
    WHERE trip_id=? AND (status='confirmed' OR (status='pending' AND
      (payment_status IN ('not_required','paid_needs_review') OR
       (payment_status='checkout_pending' AND (checkout_expires_at IS NULL OR checkout_expires_at>?)))))
      AND (? IS NULL OR id<>?)`);
  const insert = database.prepare(`INSERT INTO official_trip_bookings
    (id,trip_id,user_id,trip_title,full_name,email,phone,seats,status,created_at,payment_status,payment_amount,payment_currency)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const allBookings = database.prepare(`SELECT ${columns} FROM official_trip_bookings ORDER BY created_at DESC`);
  const memberBookings = database.prepare(`SELECT ${columns} FROM official_trip_bookings WHERE user_id=? ORDER BY created_at DESC`);
  const bookingById = database.prepare(`SELECT ${columns} FROM official_trip_bookings WHERE id=?`);
  const bookingBySession = database.prepare(`SELECT ${columns} FROM official_trip_bookings WHERE checkout_session_id=?`);

  function available(tripId, capacity, excludeBookingId=null) {
    if (capacity === null || capacity === undefined || capacity === '') return null;
    const now=new Date().toISOString();
    database.prepare("UPDATE official_trip_bookings SET status='cancelled',payment_status='expired' WHERE trip_id=? AND status='pending' AND payment_status='checkout_pending' AND checkout_expires_at IS NOT NULL AND checkout_expires_at<=?").run(tripId,now);
    return Math.max(0, Number(capacity) - Number(usedSeats.get(tripId,now,excludeBookingId,excludeBookingId).seats));
  }
  function expireOverdueHolds(){database.prepare("UPDATE official_trip_bookings SET status='cancelled',payment_status='expired' WHERE status='pending' AND payment_status='checkout_pending' AND checkout_expires_at IS NOT NULL AND checkout_expires_at<=?").run(new Date().toISOString());}
  function reserve({trip, userId, fullName, email, phone='', seats, payment=null}) {
    const id = `VT-${randomUUID()}`;
    const createdAt = new Date().toISOString();
    database.exec('BEGIN IMMEDIATE');
    try {
      const remaining=available(trip.id,trip.capacity);
      if(remaining!==null&&seats>remaining)throw Object.assign(new Error(remaining===0?'This trip is fully booked.':`Only ${remaining} seat${remaining===1?'':'s'} remain for this trip.`),{statusCode:409});
      insert.run(id, trip.id, userId, trip.title, fullName, email, phone, seats, 'pending', createdAt,
        payment ? 'checkout_pending' : 'not_required', payment?.amount ?? null, payment?.currency ?? null);
      database.exec('COMMIT');
      return bookingById.get(id);
    }catch(error){database.exec('ROLLBACK');throw error;}
  }
  function setCheckoutSession(id, sessionId, expiresAt) {
    database.prepare("UPDATE official_trip_bookings SET checkout_session_id=?,checkout_expires_at=? WHERE id=? AND payment_status IN ('checkout_pending','paid')").run(sessionId,expiresAt,id);
    return bookingById.get(id);
  }
  function cancelCheckout(id, reason='failed') {
    database.prepare("UPDATE official_trip_bookings SET status='cancelled',payment_status=? WHERE id=? AND payment_status='checkout_pending'").run(reason,id);
  }
  function processStripeEvent(event) {
    database.exec('BEGIN IMMEDIATE');
    try {
      if (database.prepare('SELECT 1 FROM stripe_webhook_events WHERE event_id=?').get(event.id)) { database.exec('ROLLBACK'); return {duplicate:true,booking:null}; }
      database.prepare('INSERT INTO stripe_webhook_events(event_id,event_type,processed_at) VALUES(?,?,?)').run(event.id,event.type,new Date().toISOString());
      const session=event.data?.object||{};
      const booking=(session.id&&bookingBySession.get(session.id))|| (session.metadata?.bookingId&&bookingById.get(session.metadata.bookingId));
      if(!booking){database.exec('COMMIT');return {duplicate:false,booking:null};}
      let updated=null,newlyPaid=false,needsReview=false;
      if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type) && session.payment_status==='paid'){
        const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||null;
        const expectedTotal=booking.paymentAmount*booking.seats;
        const paymentMatches=Number(session.amount_total)===expectedTotal&&String(session.currency||'').toUpperCase()===String(booking.paymentCurrency||'').toUpperCase()&&(session.client_reference_id===booking.id||session.metadata?.bookingId===booking.id);
        const expiry=booking.checkoutExpiresAt?Date.parse(booking.checkoutExpiresAt):Number(session.expires_at)*1000;
        const holdActive=booking.status==='pending'&&booking.paymentStatus==='checkout_pending'&&Number.isFinite(expiry)&&expiry>Date.now();
        if(booking.paymentStatus==='paid'){
          updated=booking;
        }else if(!paymentMatches||!holdActive||booking.paymentStatus==='paid_needs_review'){
          needsReview=booking.paymentStatus!=='paid_needs_review';
          database.prepare("UPDATE official_trip_bookings SET status='pending',payment_status='paid_needs_review',paid_at=COALESCE(paid_at,?),payment_intent_id=COALESCE(payment_intent_id,?) WHERE id=? AND payment_status<>'paid'").run(new Date().toISOString(),intent,booking.id);
          updated=bookingById.get(booking.id);
        }else{
          newlyPaid=booking.paymentStatus!=='paid';
          database.prepare("UPDATE official_trip_bookings SET status='confirmed',payment_status='paid',paid_at=COALESCE(paid_at,?),payment_intent_id=COALESCE(payment_intent_id,?) WHERE id=? AND payment_status='checkout_pending'").run(new Date().toISOString(),intent,booking.id);
          updated=bookingById.get(booking.id);
        }
      } else if(event.type==='checkout.session.expired'){
        database.prepare("UPDATE official_trip_bookings SET status='cancelled',payment_status='expired' WHERE id=? AND payment_status='checkout_pending'").run(booking.id);
        updated=bookingById.get(booking.id);
      } else if(event.type==='checkout.session.async_payment_failed'){
        database.prepare("UPDATE official_trip_bookings SET status='cancelled',payment_status='failed' WHERE id=? AND payment_status='checkout_pending'").run(booking.id);
        updated=bookingById.get(booking.id);
      }
      database.exec('COMMIT');
      return {duplicate:false,newlyPaid,needsReview,booking:updated};
    } catch(error) { database.exec('ROLLBACK'); throw error; }
  }
  function updateStatus(id, status, trips) {
    if (!STATUSES.has(status)) throw Object.assign(new Error('Choose a valid booking status.'), {statusCode:422});
    database.exec('BEGIN IMMEDIATE');
    try {
      const booking = bookingById.get(id);
      if (!booking) { database.exec('ROLLBACK'); return false; }
      if(['paid','paid_needs_review'].includes(booking.paymentStatus) && ['declined','cancelled'].includes(status)) throw Object.assign(new Error('This booking has a Stripe payment. Process any refund in Stripe before changing its booking status.'),{statusCode:409});
      if (status === 'confirmed' && booking.status !== 'confirmed') {
        const trip = trips.find(item => item.id === booking.tripId);
        const remaining = available(booking.tripId, trip?.capacity, id);
        if (remaining !== null && booking.seats > remaining) throw Object.assign(new Error(`Only ${remaining} seat${remaining === 1 ? '' : 's'} remain for this trip.`), {statusCode:409});
      }
      database.prepare('UPDATE official_trip_bookings SET status=? WHERE id=?').run(status, id);
      database.exec('COMMIT');
      return {previousStatus:booking.status,booking:{...booking,status}};
    } catch (error) { database.exec('ROLLBACK'); throw error; }
  }
  return {available,reserve,setCheckoutSession,cancelCheckout,processStripeEvent,list:()=>{expireOverdueHolds();return allBookings.all();},listForMember:userId=>{expireOverdueHolds();return memberBookings.all(userId);},updateStatus,close:()=>database.close()};
}
