
(async function(){
  await ensureAdmin();

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginStatus = document.getElementById('loginStatus');
  const signupStatus = document.getElementById('signupStatus');
  const meSection = document.getElementById('meSection');
  const myBookings = document.getElementById('myBookings');

  function renderMe(){
    const session = getSession();
    if(!session){ if(meSection) meSection.style.display='none'; return; }
    if(meSection) meSection.style.display='block';
    const mine = getBookings().filter(b => (b.email||'').toLowerCase().includes(session.username.toLowerCase()));
    if(!myBookings) return;
    if(mine.length===0){ myBookings.innerHTML = '<div class="small">No bookings linked to your email yet.</div>'; return; }
    let rows = '<table class="table"><tr><th>Date</th><th>Time</th><th>Helpers</th><th>Status</th><th>Notes</th></tr>';
    rows += mine.map(b=>`<tr><td>${b.date}</td><td>${b.start}–${b.end}</td><td>${b.helpers}</td><td>${b.status}${b.client==='erin'?' · Erin':''}</td><td>${(b.notes||'').replace(/</g,'&lt;')}</td></tr>`).join('');
    rows += '</table>';
    myBookings.innerHTML = rows;
  }

  if(loginBtn){
    loginBtn.addEventListener('click', async ()=>{
      const u = (document.getElementById('loginUser').value||'').trim();
      const p = document.getElementById('loginPass').value||'';
      try{
        await login(u,p);
        loginStatus.textContent = 'Logged in.';
        renderMe();
      }catch(e){
        loginStatus.textContent = e.message;
      }
    });
  }

  if(signupBtn){
    signupBtn.addEventListener('click', async ()=>{
      const u = (document.getElementById('signupUser').value||'').trim();
      const p = document.getElementById('signupPass').value||'';
      try{
        await signup(u,p,'user');
        signupStatus.textContent = 'Account created. You can log in now.';
      }catch(e){
        signupStatus.textContent = e.message;
      }
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      logout();
      renderMe();
      if(loginStatus) loginStatus.textContent = 'Logged out.';
    });
  }

  renderMe();
})();
