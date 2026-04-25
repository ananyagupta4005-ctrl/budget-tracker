const CATS = {
  Food:          { i:'🍕', c:'#ef4444' },
  Transport:     { i:'🚗', c:'#3b82f6' },
  Shopping:      { i:'🛍️', c:'#8b5cf6' },
  Health:        { i:'💊', c:'#10b981' },
  Entertainment: { i:'🎮', c:'#f59e0b' },
  Bills:         { i:'📋', c:'#06b6d4' },
  Travel:        { i:'✈️', c:'#ec4899' },
  Education:     { i:'📚', c:'#14b8a6' },
  Other:         { i:'📦', c:'#94a3b8' },
};

const getExp     = () => JSON.parse(localStorage.getItem('exp_data')    || '[]');
const setExp     = v  => localStorage.setItem('exp_data',    JSON.stringify(v));
const getGoals   = () => JSON.parse(localStorage.getItem('goals_data')  || '[]');
const setGoals   = v  => localStorage.setItem('goals_data',  JSON.stringify(v));
const getMembers = () => JSON.parse(localStorage.getItem('members_data')|| '[]');
const setMembers = v  => localStorage.setItem('members_data', JSON.stringify(v));
const getChallenge = () => JSON.parse(localStorage.getItem('challenge_data') || 'null');
const setChallenge = v  => localStorage.setItem('challenge_data', JSON.stringify(v));

const fmt     = n  => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

function toast(msg, type = 'ok') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  const icons = { ok:'✅', warn:'⚠️', info:'ℹ️', bad:'❌' };
  t.innerHTML = `<span>${icons[type]||'✅'}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('p-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  const renders = { home:renderHome, add:renderAdd, dash:renderDash, map:renderMap, goals:renderGoals, team:renderTeam, ins:renderIns };
  renders[id]?.();
}

function renderAll() {
  renderHome(); renderAdd(); renderDash(); renderMap(); renderGoals(); renderTeam(); renderIns();
}

function renderHome() {
  const exps  = getExp();
  const total = exps.reduce((s, e) => s + Number(e.amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayAmt = exps.filter(e => e.date?.slice(0,10) === today).reduce((s,e) => s + Number(e.amount), 0);
  const cats  = {};
  exps.forEach(e => { cats[e.category] = (cats[e.category]||0) + Number(e.amount); });
  const topCat = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];
  setText('h-total', fmt(total));
  setText('h-count', exps.length + ' entries');
  setText('h-today', fmt(todayAmt));
  setText('h-top',   topCat ? (CATS[topCat[0]]?.i||'') + ' ' + topCat[0] : '—');
  setText('h-goals', getGoals().length);
  const rl = document.getElementById('recent-list');
  const recent = [...exps].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 5);
  if (!recent.length) { rl.innerHTML = `<div class="empty"><div class="ei">💸</div><h3>No expenses yet</h3><p>Add your first expense to get started.</p></div>`; return; }
  rl.innerHTML = recent.map(e =>
    `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:36px;height:36px;border-radius:9px;background:${CATS[e.category]?.c||'#64748b'}18;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${CATS[e.category]?.i||'📦'}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.description}</div><div class="t-xs text3">${e.category} · ${e.member||'You'} · ${new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div></div>
      <span class="mono" style="font-size:0.9rem;flex-shrink:0">${fmt(e.amount)}</span>
    </div>`
  ).join('');
}

let capturedLat = null, capturedLng = null;

function renderAdd() {
  const exps = getExp(), now = new Date();
  const month = now.toISOString().slice(0, 7);
  const week  = new Date(now - 7*86400000).toISOString().slice(0,10);
  const today = now.toISOString().slice(0, 10);
  setText('qs-m', fmt(exps.filter(e => e.date?.startsWith(month)).reduce((s,e) => s+Number(e.amount), 0)));
  setText('qs-w', fmt(exps.filter(e => e.date?.slice(0,10) >= week).reduce((s,e) => s+Number(e.amount), 0)));
  setText('qs-t', fmt(exps.filter(e => e.date?.slice(0,10) === today).reduce((s,e) => s+Number(e.amount), 0)));
  const di = document.getElementById('a-date');
  if (di && !di.value) di.value = today;
}

function captureLocation() {
  const btn = document.getElementById('loc-btn'), st = document.getElementById('loc-status');
  if (!navigator.geolocation) { toast('Geolocation not supported', 'warn'); return; }
  btn.textContent = '📡 Getting location…'; btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    pos => {
      capturedLat = pos.coords.latitude; capturedLng = pos.coords.longitude;
      st.textContent = `📍 ${capturedLat.toFixed(5)}, ${capturedLng.toFixed(5)}`;
      st.style.color = 'var(--green)';
      btn.textContent = '✅ Location Captured'; btn.disabled = false;
    },
    () => {
      toast('Location access denied', 'warn');
      st.textContent = 'Could not capture location.'; st.style.color = 'var(--yellow)';
      btn.textContent = '📍 Location Set'; btn.disabled = false;
    },
    { timeout: 6000 }
  );
}

function saveExpense() {
  const desc   = document.getElementById('a-desc').value.trim();
  const amt    = parseFloat(document.getElementById('a-amt').value);
  const cat    = document.getElementById('a-cat').value;
  const date   = document.getElementById('a-date').value;
  const member = document.getElementById('a-member').value.trim() || 'You';
  const notes  = document.getElementById('a-notes').value.trim();
  if (!desc || !amt || !cat || !date) { toast('Fill all required fields', 'warn'); return; }
  const exps = getExp();
  exps.push({ id: Date.now(), description: desc, amount: amt, category: cat, date, member, notes, lat: capturedLat, lng: capturedLng });
  setExp(exps);
  const mems = getMembers();
  if (!mems.find(m => m.name === member)) { mems.push({ name: member, emoji: '😊' }); setMembers(mems); }
  toast('Expense saved! 🎉');
  ['a-desc','a-amt','a-cat','a-notes','a-member'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('loc-status').textContent = '';
  document.getElementById('loc-btn').textContent = '📍 Capture Location';
  document.getElementById('loc-btn').disabled = false;
  capturedLat = null; capturedLng = null;
  renderAdd();
}

function renderDash() {
  const exps = getExp(), total = exps.reduce((s, e) => s + Number(e.amount), 0);
  const cats = {}, days = {};
  exps.forEach(e => { cats[e.category] = (cats[e.category]||0) + Number(e.amount); const d = e.date?.slice(0,10)||''; days[d] = (days[d]||0) + Number(e.amount); });
  const dayCount = Object.keys(days).length || 1;
  setText('d-total', fmt(total)); setText('d-tx', exps.length + ' transactions'); setText('d-avg', fmt(total / dayCount));
  const topC = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];
  setText('d-top', topC ? (CATS[topC[0]]?.i||'') + '  ' + topC[0] : '—');
  const pv = document.getElementById('pie-vis'), pl = document.getElementById('pie-legend');
  if (!Object.keys(cats).length) { pv.innerHTML = `<div class="empty" style="padding:20px"><div class="ei">📊</div><p>No data yet</p></div>`; pl.innerHTML = ''; }
  else {
    const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]);
    pv.innerHTML = sorted.map(([c, v]) => { const pct = total ? Math.round((v/total)*100) : 0; const col = CATS[c]?.c || '#94a3b8'; return `<div style="margin-bottom:8px"><div class="fb" style="margin-bottom:4px"><span class="t-xs">${CATS[c]?.i||''} ${c}</span><span class="mono t-xs">${fmt(v)}</span></div><div class="pw"><div class="pb" style="width:${pct}%;background:${col}"></div></div></div>`; }).join('');
    pl.innerHTML = sorted.map(([c]) => `<div class="ple"><div class="pld" style="background:${CATS[c]?.c||'#94a3b8'}"></div>${c}</div>`).join('');
  }
  const bv = document.getElementById('bar-vis');
  const barDays = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate()-i); barDays.push(d); }
  const vals = barDays.map(d => days[d.toISOString().slice(0,10)] || 0), maxV = Math.max(...vals, 1), avg = total / dayCount;
  bv.innerHTML = barDays.map((d, i) => { const v = vals[i], h = Math.round((v/maxV)*100), col = v > avg ? '#ef4444' : '#3b82f6'; return `<div class="bar-col"><div class="bar-val">${v>=1000?Math.round(v/1000)+'k':v||''}</div><div class="bar" style="height:${Math.max(4,h)}%;background:${col}40;border:1px solid ${col}66"></div><div class="bar-lbl">${d.toLocaleDateString('en-IN',{weekday:'narrow'})}</div></div>`; }).join('');
  const tb = document.getElementById('exp-tbody');
  const sorted2 = [...exps].sort((a,b) => new Date(b.date)-new Date(a.date));
  if (!sorted2.length) { tb.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">No expenses yet.</td></tr>`; return; }
  tb.innerHTML = sorted2.map(e => `<tr><td><div style="font-weight:600">${e.description}</div>${e.notes?`<div class="t-xs text3">${e.notes}</div>`:''}</td><td><span class="badge bd-b">${CATS[e.category]?.i||''} ${e.category}</span></td><td class="text2 t-sm">${e.member||'You'}</td><td><span class="mono">${fmt(e.amount)}</span></td><td><button class="btn btn-d btn-sm" onclick="delExp(${e.id})">🗑️</button></td></tr>`).join('');
}

function delExp(id) { if (!confirm('Delete?')) return; setExp(getExp().filter(e => e.id !== id)); renderDash(); toast('Deleted', 'info'); }
window.delExp = delExp;

function renderMap() {
  const exps = getExp().filter(e => e.lat && e.lng);
  setText('mp-pin', exps.length); setText('mp-tot', fmt(exps.reduce((s,e) => s+Number(e.amount), 0)));
  const dots = document.getElementById('map-dots'), list = document.getElementById('map-list'), maxA = Math.max(...exps.map(e => Number(e.amount)), 1);
  if (dots) dots.innerHTML = exps.map(e => { const p = Number(e.amount)/maxA, c = p>0.7?'#ef4444':p>0.4?'#f59e0b':'#10b981', sz = Math.round(8+p*16); return `<span class="exp-dot" style="width:${sz}px;height:${sz}px;background:${c};border:2px solid ${c}44;display:inline-block;border-radius:50%;margin:3px;vertical-align:middle" title="${e.description}: ${fmt(e.amount)}"></span>`; }).join('');
  if (!list) return;
  if (!exps.length) { list.innerHTML = `<div class="empty"><div class="ei">📍</div><h3>No location data</h3><p>Capture location when adding expenses.</p></div>`; return; }
  list.innerHTML = exps.slice(0,8).map(e => { const p = Number(e.amount)/maxA, c = p>0.7?'#ef4444':p>0.4?'#f59e0b':'#10b981'; return `<div style="display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:1.2rem">${CATS[e.category]?.i||'📦'}</span><div style="flex:1"><div style="font-size:0.87rem;font-weight:600">${e.description}</div><div class="t-xs text3">${e.lat.toFixed(4)}, ${e.lng.toFixed(4)} · ${e.member}</div></div><span class="mono" style="font-size:0.82rem;color:${c}">${fmt(e.amount)}</span></div>`; }).join('');
}

function renderGoals() { renderGoalsList(); renderChallenge(); }
function renderGoalsList() {
  const goals = getGoals(), el = document.getElementById('goals-list');
  if (!el) return;
  if (!goals.length) { el.innerHTML = `<div class="empty"><div class="ei">🎯</div><h3>No goals yet</h3><p>Create a goal to track savings.</p></div>`; return; }
  el.innerHTML = goals.map(g => { const p = Math.min(100,Math.round((g.saved/g.target)*100)), dl = g.deadline?Math.ceil((new Date(g.deadline)-new Date())/86400000):null, col = p>=100?'var(--green)':p>=60?'var(--accent2)':'var(--accent)'; return `<div class="gc"><div class="fb mb12"><div><div style="font-weight:700;font-size:0.95rem">${g.name}</div>${g.deadline?`<div class="t-xs text3 mt12" style="margin-top:3px">${dl>0?dl+' days left':'⚠️ Overdue'}</div>`:''}</div><div style="text-align:right"><div class="mono t-sm">${fmt(g.saved)} / ${fmt(g.target)}</div><span class="badge ${p>=100?'bd-g':'bd-b'}" style="margin-top:4px">${p}%</span></div></div><div class="pw"><div class="pb" style="width:${p}%;background:${col}"></div></div><div class="fb mt12 t-xs text3"><span>${g.saved<g.target?fmt(g.target-g.saved)+' remaining':'🎉 Goal reached!'}</span><div style="display:flex;gap:6px"><button class="btn btn-o btn-sm" onclick="addToGoal(${g.id})">+₹ Add</button><button class="btn btn-d btn-sm" onclick="delGoal(${g.id})">Delete</button></div></div></div>`; }).join('');
}

function addGoal() {
  const name = document.getElementById('g-name').value.trim(), target = parseFloat(document.getElementById('g-target').value);
  const saved = parseFloat(document.getElementById('g-saved').value||0), dl = document.getElementById('g-dl').value;
  if (!name || !target) { toast('Fill required fields', 'warn'); return; }
  const goals = getGoals(); goals.push({ id: Date.now(), name, target, saved: saved||0, deadline: dl }); setGoals(goals);
  toast('Goal created! 🎯'); ['g-name','g-target','g-saved','g-dl'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; }); renderGoalsList();
}

function addToGoal(id) { const a = parseFloat(prompt('Amount to add (₹):')); if (!a||a<=0) return; const goals = getGoals(), g = goals.find(x => x.id===id); if(g){g.saved=(g.saved||0)+a;setGoals(goals);renderGoalsList();toast(`Added ${fmt(a)}!`);} }
function delGoal(id) { if (!confirm('Delete goal?')) return; setGoals(getGoals().filter(g => g.id!==id)); renderGoalsList(); toast('Deleted','info'); }
window.addToGoal = addToGoal; window.delGoal = delGoal;

function renderChallenge() {
  const ch = getChallenge(), btn = document.getElementById('ch-btn'), st = document.getElementById('ch-status'), grid = document.getElementById('day-grid');
  if (!ch) { if(btn){btn.textContent='🚀 Start Challenge';btn.className='btn btn-g';}if(st)st.textContent='No active challenge';if(grid)grid.innerHTML='';return; }
  const start = new Date(ch.start), today = new Date(), daysPassed = Math.floor((today-start)/86400000), ns = ch.nospend||[];
  if(btn){btn.textContent='⏹ End Challenge';btn.className='btn btn-d';}
  if(st)st.textContent=`Day ${Math.min(daysPassed+1,ch.days)} of ${ch.days} · ${ns.length} no-spend days 🔥`;
  if(grid){grid.innerHTML='';for(let i=0;i<ch.days;i++){const d=new Date(start);d.setDate(d.getDate()+i);const ds=d.toISOString().slice(0,10),past=i<=daysPassed,isn=ns.includes(ds),c=document.createElement('div');c.className='dc'+(isn?' ns':past?' sp':'');c.textContent=i+1;c.title=ds;if(past&&!isn)c.onclick=()=>{const n=[...ns],x=n.indexOf(ds);x>=0?n.splice(x,1):n.push(ds);ch.nospend=n;setChallenge(ch);renderChallenge();};grid.appendChild(c);}}
}

function toggleChallenge() {
  const ch = getChallenge();
  if (ch) { if (!confirm('End chal
