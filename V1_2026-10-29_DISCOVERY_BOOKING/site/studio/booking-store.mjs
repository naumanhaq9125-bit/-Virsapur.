import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

// Local demonstrations only. No provider, payment credentials or outbound delivery.
export function createBookingStore(file,{loadEvents,now=()=>Date.now()}) {
  let queue=Promise.resolve();
  const fail=message=>{const error=Error(message);error.statusCode=400;throw error;};
  const read=async()=>JSON.parse(await readFile(file,'utf8').catch(error=>{if(error.code==='ENOENT')return '[]';throw error;}));
  const clean=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
  return {
    list:read,
    create(input) {
      const work=queue.then(async()=>{
        if(!input||typeof input!=='object')fail('Booking details are required.');
        const requestId=clean(input.requestId,80);
        if(!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))fail('A valid booking request reference is required.');
        const events=await loadEvents();
        const event=events.find(item=>item.id===input.eventId);
        if(!event||event.demo!==true||event.previewOnly!==true)fail('This local checkout accepts sample activities only.');
        const quantity=input.quantity;
        if(!Number.isInteger(quantity)||quantity<1||quantity>20)fail('Choose between 1 and 20 participants.');
        const names=Array.isArray(input.participants)?input.participants.map(name=>clean(name)):[];
        if(names.length!==quantity||names.some(name=>!name))fail('Enter a name for every participant.');
        const customer=clean(input.customer);
        const email=clean(input.email,254);
        if(!customer||!/^\S+@\S+\.\S+$/.test(email))fail('Enter a contact name and email. You may use example details.');
        if(!['success','declined','cancelled'].includes(input.outcome))fail('Choose a simulated payment outcome.');
        const fingerprint=JSON.stringify({eventId:event.id,quantity,names,customer,email,outcome:input.outcome});
        const orders=await read();
        const prior=orders.find(order=>order.requestId===requestId);
        if(prior){if(prior.fingerprint!==fingerprint)fail('This request reference was already used with different details.');return prior;}
        if(event.registrationState!=='open'||Date.parse(event.start)<=now())fail('This sample departure is no longer open.');
        if(!Number.isFinite(event.amount)||event.amount<=0)fail('This activity does not have a valid sample price.');
        const reserved=orders.filter(order=>order.eventId===event.id&&order.status==='success').reduce((sum,order)=>sum+order.quantity,0);
        if(input.outcome==='success'&&reserved+quantity>event.capacity)fail('Not enough sample places remain. Choose fewer participants or another departure.');
        const id='DEMO-'+randomUUID().slice(0,8).toUpperCase();
        const order={id,requestId,fingerprint,demo:true,eventId:event.id,title:event.title,start:event.start,location:event.location,duration:event.duration,quantity,amount:event.amount,total:event.amount*quantity,currency:'PKR',customer,email,status:input.outcome,createdAt:new Date(now()).toISOString(),tickets:input.outcome==='success'?names.map((name,index)=>({id:id+'-'+String(index+1).padStart(2,'0'),name})):[]};
        orders.unshift(order);
        await mkdir(dirname(file),{recursive:true});
        const temp=file+'.'+randomUUID()+'.tmp';
        await writeFile(temp,JSON.stringify(orders,null,2)+'\n');await rename(temp,file);
        return order;
      });
      queue=work.catch(()=>{});
      return work;
    }
  };
}
