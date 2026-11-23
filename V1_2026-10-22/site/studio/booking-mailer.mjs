import nodemailer from 'nodemailer';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function createBookingMailer(env=process.env){
  const service=String(env.SMTP_SERVICE||'gmail').trim();
  const user=String(env.SMTP_USER||'').trim();
  const password=String(env.SMTP_PASS||'').replace(/\s/g,'');
  const from=String(env.SMTP_FROM||user).trim();
  const configured=Boolean(user&&password&&from);
  const transporter=configured?nodemailer.createTransport({service,auth:{user,pass:password},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000}):null;

  return {
    configured,
    async sendConfirmation(booking){
      if(!configured)return {sent:false,reason:'not_configured'};
      const tripDate=booking.tripStart&&Number.isFinite(Date.parse(booking.tripStart))?new Date(booking.tripStart).toLocaleString('en-PK',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Karachi'}):'';
      const subject=`Booking confirmed: ${booking.tripTitle}`;
      const text=[`Hello ${booking.fullName},`,``,`Your booking request for ${booking.tripTitle} is confirmed.`,`Seats: ${booking.seats}`,tripDate?`Trip date: ${tripDate}`:'',booking.location?`Meeting point: ${booking.location}`:'',`Booking reference: ${booking.id}`,``,`We look forward to welcoming you.`,`Virsapur`].filter(Boolean).join('\n');
      const html=`<main style="max-width:600px;margin:0 auto;padding:28px;color:#2f3239;font:16px/1.6 Arial,sans-serif"><p style="color:#a74720;font-size:12px;font-weight:700;letter-spacing:.14em">VIRSAPUR OFFICIAL TRIPS</p><h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.15">Your seats are confirmed</h1><p>Hello ${escapeHtml(booking.fullName)},</p><p>Your booking for <strong>${escapeHtml(booking.tripTitle)}</strong> has been confirmed.</p><table style="width:100%;border-collapse:collapse;margin:22px 0"><tbody><tr><th style="padding:10px;text-align:left;border-bottom:1px solid #ded4c6">Seats</th><td style="padding:10px;border-bottom:1px solid #ded4c6">${escapeHtml(booking.seats)}</td></tr>${tripDate?`<tr><th style="padding:10px;text-align:left;border-bottom:1px solid #ded4c6">Trip date</th><td style="padding:10px;border-bottom:1px solid #ded4c6">${escapeHtml(tripDate)}</td></tr>`:''}${booking.location?`<tr><th style="padding:10px;text-align:left;border-bottom:1px solid #ded4c6">Meeting point</th><td style="padding:10px;border-bottom:1px solid #ded4c6">${escapeHtml(booking.location)}</td></tr>`:''}<tr><th style="padding:10px;text-align:left">Booking reference</th><td style="padding:10px"><code>${escapeHtml(booking.id)}</code></td></tr></tbody></table><p>We look forward to welcoming you.</p><p>Virsapur</p></main>`;
      await transporter.sendMail({from,to:booking.email,subject,text,html});
      return {sent:true};
    },
    close(){transporter?.close();}
  };
}
