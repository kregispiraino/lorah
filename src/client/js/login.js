(function(){
  const form=document.getElementById("loginForm"),button=document.getElementById("loginButton"),error=document.getElementById("loginError"),password=document.getElementById("password"),passwordToggle=document.getElementById("passwordToggle");
  passwordToggle.addEventListener("click",()=>{
    const visible=password.type==="password";
    password.type=visible?"text":"password";
    passwordToggle.setAttribute("aria-pressed",String(visible));
    passwordToggle.setAttribute("aria-label",visible?"Ocultar senha":"Mostrar senha");
    password.focus({preventScroll:true});
  });
  form.addEventListener("submit",async event=>{
    event.preventDefault();error.textContent="";button.disabled=true;button.querySelector("span").textContent="Entrando…";
    try{
      const response=await fetch("/api/auth/login",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.email.value,password:form.password.value})});
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(body.error||"Não foi possível entrar.");
      location.replace("/");
    }catch(reason){error.textContent=reason.message;button.disabled=false;button.querySelector("span").textContent="Entrar";}
  });
})();
