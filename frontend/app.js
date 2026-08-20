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

function requireAuth(redirectToLogin = 'index.html'){
  const token = getToken();
  if(!token){
    window.location.href = redirectToLogin;
    return false;
  }
  return true;
}

// Decodes the JWT payload client-side just to read display info like role/name.
// This is NOT a security check — the backend independently verifies the token
// and enforces role permissions on every request. This is only used to decide
// what to show/hide in the UI (e.g. the Admin link).
function getUserFromToken(){
  const token = getToken();
  if(!token) return null;
  try{
    const payloadB64 = token.split('.')[1];
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  }catch(err){
    return null;
  }
}

function isStaffOrAdmin(){
  const user = getUserFromToken();
  return !!user && (user.role === 'staff' || user.role === 'admin');
}

export { TOKEN_KEY, getToken, setToken, clearToken, setMsg, requireAuth, getUserFromToken, isStaffOrAdmin };