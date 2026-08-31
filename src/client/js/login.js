(function(){
  const form=document.getElementById("loginForm"),button=document.getElementById("loginButton"),error=document.getElementById("loginError");
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
