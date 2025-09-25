
const DB = {
  BOOKINGS: 'tc.bookings.v1',
  USERS: 'tc.users.v1',
  SESSION: 'tc.session.v1',
  SETTINGS: 'tc.settings.v1'
};

const DEFAULT_SETTINGS = { crewSize: 2, weekendOnly: true, startAfter: '13:00', minHours: 2, baseFlatPerHelper: 200, baseHours: 3, hourlyAfterBase: 30 };

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmtDate = d => d.toISOString().slice(0,10);
const parseHM = hm => { const [h,m]=hm.split(':').map(Number); return h*60+m; };
const toDate = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y, m-1, d); };
const overlap = (as,ae,bs,be) => Math.max(as,bs) < Math.min(ae,be);

function load(key, fallback){ try{ const raw = localStorage.getItem(key); return raw? JSON.parse(raw): (fallback ?? null);}catch(e){ return fallback ?? null; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function getSettings(){ const s = load(DB.SETTINGS, null); if(s) return s; save(DB.SETTINGS, DEFAULT_SETTINGS); return {...DEFAULT_SETTINGS}; }
function setSettings(s){ save(DB.SETTINGS, s); }

async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function getUsers(){ return load(DB.USERS, {}); }
function setUsers(u){ save(DB.USERS, u); }

async function signup(username, password, role='user'){
  username = (username||'').trim();
  if(!username || !password) throw new Error('Missing username or password');
  const users = getUsers();
  if(users[username]) throw new Error('Username already exists');
  users[username] = { hash: await sha256(password), role, created: Date.now() };
  setUsers(users);
  return true;
}

async function login(username, password){
  const users = getUsers();
  if(!users[username]) throw new Error('User not found');
  const ok = users[username].hash === await sha256(password);
  if(!ok) throw new Error('Invalid password');
  save(DB.SESSION, { username, role: users[username].role, ts: Date.now() });
  return getSession();
}

function logout(){ localStorage.removeItem(DB.SESSION); }
function getSession(){ return load(DB.SESSION, null); }

async function ensureAdmin(){
  const users = getUsers();
  if(!users['colinAdmin']){
    users['colinAdmin'] = { hash: await sha256('secret123'), role:'admin', created: Date.now() };
    setUsers(users);
  }
}

function getBookings(){ return load(DB.BOOKINGS, []); }
function setBookings(b){ save(DB.BOOKINGS, b); }

function remainingCapacity(dateStr, startHM, endHM, crewSize){
  const bookings = getBookings().filter(b => b.date===dateStr);
  let used = 0;
  for(const b of bookings){
    if(overlap(parseHM(b.start), parseHM(b.end), startHM, endHM)) used += b.helpers;
  }
  return Math.max(0, crewSize - used);
}

function calcPrice(helpers, start, end, settings){
  const minutes = parseHM(end) - parseHM(start);
  const hours = Math.max(0, minutes/60);
  const extra = Math.max(0, hours - settings.baseHours);
  const perHelper = settings.baseFlatPerHelper + (extra * settings.hourlyAfterBase);
  const total = perHelper * helpers;
  return { hours, extra, perHelper, total };
}
