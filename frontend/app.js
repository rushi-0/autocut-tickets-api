const TOKEN_KEY = 'autocut_token';

function getToken(){
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token){
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(){
  localStorage.removeItem(TOKEN_KEY);
}

function setMsg(el, {type, text}){
  el.classList.remove('show','success','error');
  el.textContent = '';
  if(!text) return;
  el.classList.add('show');
  el.classList.add(type);
  el.textContent = text;
}

function requireAuth(redirectToLogin = 'login.html'){
  const token = getToken();
  if(!token){
    window.location.href = redirectToLogin;
    return false;
  }
  return true;
}

export { TOKEN_KEY, getToken, setToken, clearToken, setMsg, requireAuth };

