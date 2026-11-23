const api=async(path,options={})=>{const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||'The account service could not complete this request.');return result;};
const form=document.querySelector('[data-account-form]');
const route=document.body.dataset.route;
const signedInBox=document.querySelector('[data-account-session]');
const accountLink=document.querySelector('[data-account-nav]');
const showError=(form,message)=>{const alert=form?.querySelector('[data-account-alert]');if(alert)alert.textContent=message;};
const returnTo=()=>{const next=new URLSearchParams(location.search).get('next')||'/';return next.startsWith('/')&&!next.startsWith('//')?next:'/';};
function showSession(user){if(!signedInBox)return;const form=document.querySelector('[data-account-form]');if(form)form.hidden=true;signedInBox.hidden=false;signedInBox.querySelector('[data-account-greeting]').textContent=`Welcome, ${user.name}.`;signedInBox.querySelector('[data-account-email]').textContent=user.email;}
function wireLogout(){signedInBox?.querySelector('[data-account-signout]')?.addEventListener('click',async()=>{try{await api('/api/visitor-logout',{method:'POST',body:'{}'});}finally{location.replace('/');}});}
if(accountLink){
  api('/api/visitor-session').then(({user})=>{accountLink.textContent=`Sign out (${user.name.split(' ')[0]})`;accountLink.href='#signout';accountLink.setAttribute('aria-label',`Sign out ${user.name}`);accountLink.addEventListener('click',async event=>{event.preventDefault();try{await api('/api/visitor-logout',{method:'POST',body:'{}'});}finally{location.reload();}});}).catch(()=>{});
}
if(form){
  form.querySelectorAll('[data-password-toggle]').forEach(button=>button.addEventListener('click',()=>{const input=document.getElementById(button.getAttribute('aria-controls'));if(!input)return;const visible=input.type==='password';input.type=visible?'text':'password';button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',visible?'Hide password':'Show password');}));
  api('/api/visitor-session').then(({user})=>showSession(user)).catch(()=>{});wireLogout();
  form.addEventListener('submit',async event=>{
    event.preventDefault();showError(form,'');if(!form.reportValidity())return;
    const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.setAttribute('aria-busy','true');
    try{
      let data;
      if(form.dataset.accountForm==='signup'){
        const password=form.elements.password.value,confirm=form.elements.confirm.value;
        if(password!==confirm)throw Error('Your passwords do not match.');
        data={name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),password,confirm,remember:true};
        await api('/api/visitor-signup',{method:'POST',body:JSON.stringify(data)});
      }else{
        data={email:form.elements.email.value.trim(),password:form.elements.password.value,remember:form.elements.remember?.checked===true};
        await api('/api/visitor-login',{method:'POST',body:JSON.stringify(data)});
      }
      location.replace(returnTo());
    }catch(error){showError(form,error.message);}
    finally{submit.disabled=false;submit.removeAttribute('aria-busy');}
  });
}
