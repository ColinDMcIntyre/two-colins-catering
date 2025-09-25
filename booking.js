
(async function(){
  await ensureAdmin();
  const settings = getSettings();

  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('dow').innerHTML = dows.map(d=>`<div class="dow">${d}</div>`).join('');

  let view = (function(){ const d=new Date(); return { y:d.getFullYear(), m:d.getMonth() }; })();

  function dayStatus(dateStr){
    const d = toDate(dateStr);
    const isWeekend = [0,6].includes(d.getDay());
    if(!isWeekend) return 'weekday';
    const rem = remainingCapacity(dateStr, parseHM('13:00'), parseHM('21:00'), settings.crewSize);
    if(rem <= 0) return 'full';
    const any = getBookings().some(b => b.date===dateStr);
    return any ? 'partial' : 'available';
  }

  function renderCalendar(){
    document.getElementById('monthLabel').textContent = new Date(view.y, view.m, 1).toLocaleString(undefined,{month:'long',year:'numeric'});
    const first = new Date(view.y, view.m, 1);
    const startIdx = first.getDay();
    const daysInMonth = new Date(view.y, view.m+1, 0).getDate();
    const cells = [];
    for(let i=0;i<startIdx;i++) cells.push('<div></div>');
    for(let d=1; d<=daysInMonth; d++){
      const dateStr = fmtDate(new Date(view.y, view.m, d));
      const st = dayStatus(dateStr);
      const color = st==='full'?'red': st==='partial'?'yellow': st==='available'?'green':'gray';
      cells.push(`<div class="cal-day ${st==='weekday'?'disabled':''}" data-date="${dateStr}">
        <div class="num">${d}</div>
        <div class="cap"><span class="dot ${color}"></span>${st}</div>
      </div>`);
    }
    document.getElementById('calendar').innerHTML = cells.join('');
    Array.from(document.querySelectorAll('#calendar .cal-day')).forEach(el=>{
      if(el.classList.contains('disabled')) return;
      el.addEventListener('click', ()=>{ document.getElementById('date').value = el.dataset.date; window.scrollTo({top:0,behavior:'smooth'}); });
    });
  }

  document.getElementById('prevMonth').addEventListener('click', ()=>{ view.m--; if(view.m<0){view.m=11;view.y--;} renderCalendar(); });
  document.getElementById('nextMonth').addEventListener('click', ()=>{ view.m++; if(view.m>11){view.m=0;view.y++;} renderCalendar(); });

  function updateCost(){
    const helpers = parseInt(document.getElementById('helpers').value || '1', 10);
    const start = document.getElementById('start').value || '13:00';
    const end = document.getElementById('end').value || '14:00';
    const {hours, extra, perHelper, total} = calcPrice(helpers, start, end, settings);
    document.getElementById('costOut').textContent = `$${total.toFixed(0)}`;
    document.getElementById('costDetail').textContent = `${helpers} helper(s) · ${hours.toFixed(1)}h total · includes ${settings.baseHours}h at $${settings.baseFlatPerHelper} + $${settings.hourlyAfterBase}/h after · per helper ≈ $${perHelper.toFixed(0)}`;
  }

  document.getElementById('date').min = fmtDate(new Date());
  ['helpers','start','end'].forEach(id=> document.getElementById(id).addEventListener('input', updateCost));
  updateCost();

  document.getElementById('submit').addEventListener('click', ()=>{
    const name = (document.getElementById('clientName').value||'').trim();
    const email = (document.getElementById('clientEmail').value||'').trim();
    const phone = (document.getElementById('clientPhone').value||'').trim();
    const helpers = parseInt(document.getElementById('helpers').value||'1',10);
    const date = document.getElementById('date').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    const notes = (document.getElementById('notes').value||'').trim();
    const status = document.getElementById('status').value;

    if(!name || !email || !date || !start || !end){ alert('Please complete required fields.'); return; }

    const d = toDate(date);
    const isWeekend = [0,6].includes(d.getDay());
    if(!isWeekend){ alert('We only book Saturdays and Sundays.'); return; }

    const startMin = parseHM(start), endMin = parseHM(end);
    if(endMin <= startMin){ alert('End time must be after start time.'); return; }
    if(startMin < parseHM('13:00')){ alert('Start time must be at or after 1:00 PM.'); return; }
    if(endMin - startMin < (getSettings().minHours*60)){ alert('Minimum booking is 2 hours.'); return; }

    const rem = remainingCapacity(date, startMin, endMin, getSettings().crewSize);
    if(rem < helpers){ alert('Not enough capacity for that window.'); return; }

    const b = { id: Math.random().toString(36).slice(2,10), name, email, phone, helpers, date, start, end, notes, status,
      created: Date.now(), client: name.toLowerCase().startsWith('erin') ? 'erin' : '' };
    const all = getBookings(); all.push(b); setBookings(all);
    alert('Request submitted! We will confirm by email/text.');
    location.href = 'account.html';
  });

  renderCalendar();
})();
