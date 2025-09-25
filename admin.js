
(async function(){
  await ensureAdmin();
  const session = getSession();
  if(!session || session.role!=='admin'){
    document.body.innerHTML = '<div class="container"><div class="card"><h2>Admin Only</h2><p class="small">Please log in as admin (see Account page).</p></div></div>';
    return;
  }

  const s = getSettings();
  document.getElementById('crewVal').textContent = s.crewSize;
  document.getElementById('crewInput').value = s.crewSize;
  document.getElementById('weekendOnly').value = String(s.weekendOnly);
  document.getElementById('startAfter').value = s.startAfter;
  document.getElementById('minHours').value = s.minHours;
  document.getElementById('baseFlat').value = s.baseFlatPerHelper;
  document.getElementById('baseHours').value = s.baseHours;
  document.getElementById('hourlyAfter').value = s.hourlyAfterBase;

  function renderBookings(){
    const all = getBookings().slice().sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
    document.getElementById('bookingsVal').textContent = all.length;
    document.getElementById('pendingVal').textContent = all.filter(b=>b.status==='penciled').length;
    const rows = all.map(b=>{
      const price = calcPrice(b.helpers, b.start, b.end, getSettings()).total;
      return `<tr>
        <td>${b.date}</td><td>${b.start}–${b.end}</td><td>${b.name}<br><span class="small">${b.email||''}</span></td>
        <td>${b.helpers}</td><td>${b.status}${b.client==='erin'?' · <span class="pill">Erin</span>':''}</td>
        <td>$${price.toFixed(0)}</td>
        <td><button data-act="confirm" data-id="${b.id}">Confirm</button> <button data-act="erase" data-id="${b.id}">Delete</button></td>
      </tr>`;
    }).join('');
    document.getElementById('bookingsTable').innerHTML = `<table class="table">
      <tr><th>Date</th><th>Time</th><th>Client</th><th>Helpers</th><th>Status</th><th>Est. Price</th><th>Actions</th></tr>
      ${rows || '<tr><td colspan="7" class="small">No bookings</td></tr>'}
    </table>`;

    Array.from(document.querySelectorAll('#bookingsTable [data-act]')).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        const act = btn.getAttribute('data-act');
        const all = getBookings();
        if(act==='erase'){
          const next = all.filter(b=>b.id!==id);
          setBookings(next);
        } else if(act==='confirm'){
          const b = all.find(x=>x.id===id); if(b){ b.status='confirmed'; setBookings(all); }
        }
        renderBookings();
      });
    });
  }

  document.getElementById('saveSettings').addEventListener('click', ()=>{
    const next = {
      crewSize: parseInt(document.getElementById('crewInput').value||'2',10),
      weekendOnly: document.getElementById('weekendOnly').value==='true',
      startAfter: document.getElementById('startAfter').value||'13:00',
      minHours: parseInt(document.getElementById('minHours').value||'2',10),
      baseFlatPerHelper: parseFloat(document.getElementById('baseFlat').value||'200'),
      baseHours: parseFloat(document.getElementById('baseHours').value||'3'),
      hourlyAfterBase: parseFloat(document.getElementById('hourlyAfter').value||'30')
    };
    setSettings(next);
    document.getElementById('crewVal').textContent = next.crewSize;
    alert('Settings saved.');
  });

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify({settings:getSettings(), bookings:getBookings()}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'two-colins-data.json';
    a.click();
  });
  document.getElementById('importInput').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    try{
      const data = JSON.parse(text);
      if(data.settings) setSettings(data.settings);
      if(Array.isArray(data.bookings)) setBookings(data.bookings);
      alert('Import complete.');
      location.reload();
    }catch(err){ alert('Invalid JSON'); }
  });
  document.getElementById('clearBtn').addEventListener('click', ()=>{
    if(confirm('Erase ALL bookings?')){ setBookings([]); renderBookings(); }
  });

  renderBookings();
})();
