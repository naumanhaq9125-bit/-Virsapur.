const form=document.querySelector('[data-account-form="signup"]');
if(form){
  const alert=form.querySelector('[data-account-alert]');
  const setError=message=>{alert.textContent=message;};
  form.querySelectorAll('[data-password-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById(button.getAttribute('aria-controls'));
    if(!input)return;
    const visible=input.type==='password';input.type=visible?'text':'password';
    button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',visible?'Hide password':'Show password');
  }));
  form.addEventListener('submit',event=>{
    event.preventDefault();setError('');
    const name=form.elements.name.value.trim(),email=form.elements.email.value.trim().toLowerCase();
      const password=form.elements.password.value,confirm=form.elements.confirm.value;
    if(name.length<2){setError('Enter your full name.');form.elements.name.focus();return;}
    if(!form.elements.email.validity.valid){setError('Enter a valid email address.');form.elements.email.focus();return;}
    if(password.length<8){setError('Use at least 8 characters for your password.');form.elements.password.focus();return;}
    if(password!==confirm){setError('Your passwords do not match.');form.elements.confirm.focus();return;}
    if(!navigator.onLine){setError('Account creation is unavailable offline. Your details have not been saved.');return;}
    setError('Account creation is not connected yet. Your details have not been saved.');
  });
}
