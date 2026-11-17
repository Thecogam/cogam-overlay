// Cogam Neon Tube overlay (style A). Self-contained script for a Streamlabs widget's custom JS.
// Live data: public Twitch chat over anonymous read-only IRC (chat, cheers, subs, raids, CogamCrew game messages).
// Slow data: data.json on the overlay repo's live-data branch (follower goal, Top Crew), refreshed every few minutes.
// Options on window before loading: COGAM_CHANNEL, COGAM_DEMO, COGAM_DEBUG, COGAM_DATA_URL. No secrets anywhere.
(() => {
  if (window.__cogamOverlay) return;
  window.__cogamOverlay = true;
  const CHANNEL = String(window.COGAM_CHANNEL || 'thecogam').toLowerCase();
  const DEMO = Boolean(window.COGAM_DEMO);
  const DEBUG = Boolean(window.COGAM_DEBUG);
  const DATA_URL = window.COGAM_DATA_URL || 'https://raw.githubusercontent.com/Thecogam/cogam-overlay/live-data/data.json';
  const BOT = '🤖 CogamCrew:';
  const GAME = { siegeHp: 2000, hitDamage: 10, hitCooldownMs: 10000, subDamage: 500, voteSeconds: 60, subVoteWeight: 2, bitsPerVote: 10 };

  // ---------------- styles ----------------
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Monoton&family=Chakra+Petch:wght@500;600;700&family=Barlow:wght@500;600&display=swap';
  document.head.appendChild(font);
  const style = document.createElement('style');
  style.textContent = `
  #cg { --pink:#ff2e88; --orange:#ff8a3d; --cyan:#19e3ff; --gold:#ffd25e; --violet:#7a3cff;
    position:fixed; left:0; top:0; width:1920px; height:1080px; overflow:hidden; pointer-events:none; transform-origin:0 0;
    font-family:"Chakra Petch",Consolas,monospace; color:#fff; }
  #cg .hide { display:none !important; }
  #cg .tube { border:3px solid var(--pink); border-radius:18px; background:rgba(12,7,32,.62);
    box-shadow:0 0 8px var(--pink),0 0 22px rgba(255,46,136,.55),inset 0 0 14px rgba(255,46,136,.3); }
  #cg .tube.c { border-color:var(--cyan); box-shadow:0 0 8px var(--cyan),0 0 22px rgba(25,227,255,.5),inset 0 0 14px rgba(25,227,255,.28); }
  #cg .title { font-weight:700; font-size:17px; letter-spacing:.22em; text-transform:uppercase; color:#ffd9ea; text-shadow:0 0 6px var(--pink),0 0 14px var(--pink); display:flex; gap:10px; align-items:center; }
  #cg .title i { font-style:normal; color:var(--gold); text-shadow:0 0 8px var(--gold); }
  #cg .brand { position:absolute; left:44px; top:28px; display:grid; justify-items:start; }
  #cg .brand .the { font-family:"Mr Dafoe",cursive; font-size:40px; color:var(--cyan); line-height:.7; margin-left:30px; transform:rotate(-8deg); text-shadow:0 0 6px var(--cyan),0 0 16px var(--cyan); }
  #cg .brand .word { font-family:Monoton,Impact,sans-serif; font-size:50px; line-height:1; color:#ffd9ea; text-shadow:0 0 4px #fff,0 0 10px var(--pink),0 0 22px var(--pink); }
  #cg .goal { position:absolute; left:44px; top:140px; width:420px; padding:14px 18px; display:grid; gap:8px; }
  #cg .bar { height:14px; border-radius:999px; background:rgba(255,255,255,.12); overflow:hidden; }
  #cg .bar > span { display:block; height:100%; width:0; border-radius:999px; background:linear-gradient(90deg,var(--pink),var(--orange),var(--gold)); transition:width 1.2s cubic-bezier(.2,.8,.2,1); box-shadow:0 0 12px var(--pink); }
  #cg .goal .num { font-size:18px; color:#d9cdf5; display:flex; justify-content:space-between; font-variant-numeric:tabular-nums; } #cg .goal .num b { color:#fff; }
  #cg .heat { position:absolute; left:50%; top:30px; transform:translateX(-50%); padding:10px 24px; display:grid; justify-items:center; gap:4px; }
  #cg .stars { display:flex; gap:10px; font-size:42px; line-height:1; }
  #cg .stars span { color:rgba(255,255,255,.14); transition:color .35s,text-shadow .35s,transform .35s; }
  #cg .stars span.on { color:var(--gold); text-shadow:0 0 10px var(--gold),0 0 24px var(--orange); transform:scale(1.08); }
  #cg .lb { position:absolute; right:44px; top:140px; width:380px; padding:16px 18px; display:grid; gap:10px; }
  #cg .lb ol { list-style:none; margin:0; padding:0; display:grid; gap:7px; }
  #cg .lb li { display:grid; grid-template-columns:28px 1fr auto; gap:10px; align-items:center; font-size:19px; }
  #cg .lb li .p { color:#a99cc9; } #cg .lb li .r { color:var(--gold); font-size:14px; }
  #cg .chat { position:absolute; right:44px; top:470px; width:380px; height:360px; padding:16px 18px; display:grid; grid-template-rows:auto 1fr; gap:10px; }
  #cg .chat .list { overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; gap:8px; font-family:Barlow,"Segoe UI",sans-serif; font-weight:500; font-size:19px; line-height:1.3; }
  #cg .msg { overflow-wrap:anywhere; animation:cg-msg .5s both; } #cg .msg b { font-family:"Chakra Petch",monospace; font-weight:700; margin-right:6px; }
  #cg .msg.bot { color:#c9f6ff; } #cg .msg.bot b { color:var(--cyan); }
  #cg .ticker { position:absolute; left:50%; bottom:36px; transform:translateX(-50%); width:760px; height:52px; display:flex; align-items:center; gap:14px; padding:0 22px; overflow:hidden; }
  #cg .ticker .tag { font-weight:700; font-size:14px; letter-spacing:.2em; color:#0c0720; background:var(--cyan); padding:4px 10px; border-radius:4px; flex:none; }
  #cg .ticker .item { font-size:21px; white-space:nowrap; }
  #cg .games { position:absolute; left:50%; top:122px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:12px; }
  #cg .card { text-align:center; display:grid; gap:6px; padding:16px 30px; min-width:560px; max-width:900px; background:rgba(12,7,32,.86); }
  #cg .card .k { font-size:17px; letter-spacing:.32em; text-transform:uppercase; color:var(--gold); }
  #cg .card .h { font-size:38px; font-weight:700; color:#ffd9ea; text-shadow:0 0 8px var(--pink),0 0 20px var(--pink); }
  #cg .card .s { font-family:Barlow,sans-serif; font-size:22px; color:#e4dbff; }
  #cg .card .h.sm { font-size:24px; }
  #cg .hp { height:22px; border-radius:999px; background:rgba(255,255,255,.12); overflow:hidden; margin-top:6px; }
  #cg .hp > span { display:block; height:100%; background:linear-gradient(90deg,var(--orange),var(--pink)); box-shadow:0 0 14px var(--pink); transition:width .4s; }
  #cg .opts { display:grid; gap:8px; text-align:left; margin-top:6px; }
  #cg .opt { display:grid; grid-template-columns:44px 1fr 60px; gap:10px; align-items:center; font-size:20px; }
  #cg .opt .n { font-weight:700; color:var(--cyan); } #cg .opt .v { text-align:right; color:var(--gold); font-variant-numeric:tabular-nums; }
  #cg .opt .b { height:8px; border-radius:999px; background:rgba(255,255,255,.12); grid-column:2/4; overflow:hidden; } #cg .opt .b span { display:block; height:100%; width:0; background:var(--cyan); box-shadow:0 0 8px var(--cyan); transition:width .4s; }
  #cg .crate { font-size:64px; line-height:1; filter:drop-shadow(0 0 14px var(--cyan)); animation:cg-bob 1.2s ease-in-out infinite; }
  #cg .alert { position:absolute; left:50%; top:600px; transform:translateX(-50%); text-align:center; display:grid; gap:4px; padding:18px 34px; min-width:480px; background:rgba(12,7,32,.86); }
  #cg .alert .k { font-size:17px; letter-spacing:.32em; text-transform:uppercase; color:var(--cyan); }
  #cg .alert .h { font-size:36px; font-weight:700; color:#ffd9ea; text-shadow:0 0 8px var(--pink),0 0 20px var(--pink); }
  #cg .alert .s { font-family:Barlow,sans-serif; font-size:21px; color:#e4dbff; }
  #cg .alert.medium { top:580px; min-width:640px; } #cg .alert.medium .h { font-size:46px; }
  #cg .toast { position:absolute; right:440px; top:150px; padding:10px 18px; display:grid; gap:2px; }
  #cg .toast .k { font-size:13px; letter-spacing:.24em; color:var(--gold); text-transform:uppercase; } #cg .toast .h { font-size:22px; font-weight:700; }
  #cg .full { position:absolute; inset:0; display:grid; place-items:center; align-content:center; gap:10px; background:radial-gradient(circle,rgba(255,46,136,.35),rgba(12,7,32,.82) 70%); }
  #cg .full .k { font-size:20px; letter-spacing:.35em; color:var(--cyan); text-transform:uppercase; }
  #cg .full .big { font-family:Monoton,Impact,sans-serif; font-size:150px; line-height:1; color:#ffd9ea; text-shadow:0 0 6px #fff,0 0 18px var(--pink),0 0 50px var(--pink); animation:cg-slam .7s cubic-bezier(.2,1.4,.3,1) both; }
  #cg .full .h { font-size:44px; font-weight:700; } #cg .full .stars { font-size:78px; justify-content:center; } #cg .full .stars span { color:var(--gold); text-shadow:0 0 14px var(--gold),0 0 30px var(--orange); }
  #cg .debug { position:absolute; left:20px; bottom:20px; font-size:16px; padding:6px 12px; border-radius:8px; background:rgba(0,0,0,.6); }
  #cg .in { animation:cg-tube .9s both; } #cg .out { animation:cg-out .5s both; }
  #cg.shake { animation:cg-shake .5s; }
  @keyframes cg-tube { 0%{opacity:0} 10%{opacity:1} 16%{opacity:.1} 24%{opacity:1} 30%{opacity:.3} 40%,100%{opacity:1} }
  @keyframes cg-out { 0%{opacity:1} 30%{opacity:.2} 45%{opacity:.9} 100%{opacity:0} }
  @keyframes cg-msg { from{opacity:0;text-shadow:0 0 20px var(--pink)} to{opacity:1;text-shadow:none} }
  @keyframes cg-bob { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-8px) rotate(4deg)} }
  @keyframes cg-slam { 0%{transform:scale(2.4);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes cg-shake { 0%,100%{translate:0 0} 25%{translate:-10px 6px} 50%{translate:9px -6px} 75%{translate:-5px 3px} }
  @media (prefers-reduced-motion: reduce) { #cg * { animation:none !important; transition:none !important; } }`;
  document.head.appendChild(style);

  // ---------------- markup ----------------
  const root = document.createElement('div');
  root.id = 'cg';
  const starRow = (n = 6) => '<span>★</span>'.repeat(n);
  root.innerHTML = `
    <div class="brand"><div class="the">the</div><div class="word">COGAM</div></div>
    <div class="goal tube"><div class="title"><i>★</i><span data-goal-label>Follower goal</span></div><div class="bar"><span data-goal-bar></span></div><div class="num"><span><b data-goal-now>–</b> / <span data-goal-target>–</span></span><span>today</span></div></div>
    <div class="heat tube"><div class="title" style="font-size:14px">Chat heat</div><div class="stars" data-heat>${starRow()}</div></div>
    <div class="lb tube c"><div class="title"><i>★</i>Top crew</div><ol data-lb><li><span class="p">–</span><span>Crew loading…</span><span class="r"></span></li></ol></div>
    <div class="chat tube"><div class="title"><i>★</i>Chat</div><div class="list" data-chat></div></div>
    <div class="ticker tube c"><span class="tag">Latest</span><span class="item" data-ticker>Welcome to the stream</span></div>
    <div class="games">
      <div class="card tube c siege hide" data-siege><div class="k">🚁 Chopper siege</div><div class="h sm">Type !hit · cheers & subs deal massive damage</div><div class="hp"><span data-hp style="width:100%"></span></div><div class="s" data-hp-text></div></div>
      <div class="card tube vote hide" data-vote><div class="k">🗳️ Chaos vote</div><div class="opts" data-opts></div><div class="s" data-vote-time></div></div>
      <div class="card tube c drop hide" data-drop><div class="k">Crew drop</div><div class="crate">📦</div><div class="h" data-drop-who></div><div class="s">Type <b>!grab</b> · <b data-drop-left>10</b> crates left</div></div>
      <div class="card tube c quiz hide" data-quiz><div class="k">❓ Trivia</div><div class="h sm" data-quiz-q></div><div class="s">First correct answer in chat wins XP</div></div>
    </div>
    <div data-alerts></div>
    <div class="debug ${DEBUG ? '' : 'hide'}" data-debug>connecting…</div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const fit = () => { const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1; root.style.transform = `scale(${s})`; };
  window.addEventListener('resize', fit); fit();
  const log = (t) => { if (DEBUG) $('[data-debug]').textContent = t; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const show = (el) => { el.classList.remove('hide', 'out'); void el.offsetWidth; el.classList.add('in'); };
  const hide = (el) => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => { el.classList.add('hide'); el.classList.remove('out'); }, 500); };
  const shake = () => { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); };
  const ticker = (t) => { $('[data-ticker]').textContent = t; };

  // ---------------- alerts (queued, tiered) ----------------
  const queue = []; let alertBusy = false;
  function alert(tier, k, h, s = '', ms = 4000) { queue.push({ tier, k, h, s, ms }); if (!alertBusy) nextAlert(); }
  function nextAlert() {
    const a = queue.shift(); if (!a) { alertBusy = false; return; }
    alertBusy = true;
    const el = document.createElement('div');
    if (a.tier === 'full') {
      el.className = 'full in';
      el.innerHTML = `<div class="k">${esc(a.k)}</div><div class="big">${esc(a.h)}</div>${a.s === 'stars' ? `<div class="stars">${starRow()}</div>` : `<div class="h">${esc(a.s)}</div>`}`;
      shake();
    } else if (a.tier === 'toast') {
      el.className = 'toast tube c in';
      el.innerHTML = `<div class="k">${esc(a.k)}</div><div class="h">${esc(a.h)}</div>`;
    } else {
      el.className = `alert tube ${a.tier} in`;
      el.innerHTML = `<div class="k">${esc(a.k)}</div><div class="h">${esc(a.h)}</div>${a.s ? `<div class="s">${esc(a.s)}</div>` : ''}`;
    }
    $('[data-alerts]').appendChild(el);
    if (a.tier !== 'toast' && a.tier !== 'full') ticker(`${a.k} · ${a.h}`);
    setTimeout(() => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => { el.remove(); nextAlert(); }, 500); }, a.ms);
  }

  // ---------------- chat box ----------------
  function chatLine(name, color, text, bot) {
    const d = document.createElement('div');
    d.className = 'msg' + (bot ? ' bot' : '');
    d.innerHTML = `<b style="${bot ? '' : `color:${color || '#ff8fc4'}`}">${esc(bot ? 'CogamCrew' : name)}</b>${esc(text)}`;
    const list = $('[data-chat]');
    list.appendChild(d);
    while (list.children.length > 8) list.firstChild.remove();
  }

  // ---------------- heat meter (display mirrors the engine; the engine's 🔥 message is the six-star source of truth) ----------------
  const HYPE = ['no way', 'omg', 'lets go', "let's go", 'w', 'lul', 'lmao', 'insane', 'clip it', 'pog'];
  let msgs = [], baseline = 0, samples = 0, boost = 0, stars = 0, last = 0;
  const heatEls = [...$('[data-heat]').children];
  const hype = (t) => { const x = ` ${t.toLowerCase()} `; return HYPE.some((w) => (w.length <= 2 ? x.includes(` ${w} `) : x.includes(w))) ? 0.15 : 0; };
  const paintHeat = () => heatEls.forEach((s, i) => s.classList.toggle('on', i < stars));
  setInterval(() => {
    const now = Date.now(), dt = last ? (now - last) / 1000 : 0; last = now;
    boost = Math.max(0, boost - dt / 45);
    msgs = msgs.filter((t) => now - t <= 30000);
    const rate = msgs.length; samples++;
    baseline += (samples < 12 ? 0.3 : rate > baseline * 2 ? 0.01 : 0.05) * (rate - baseline);
    const z = (rate - baseline) / Math.max(1, Math.sqrt(Math.max(baseline, 1)));
    stars = Math.min(5, Math.floor(Math.max(0, z / 1.5) + boost));   // 6th star only lights on the engine's six-star call
    paintHeat();
  }, 5000);

  // ---------------- games (mirrors the engine's rules; the bot's messages start and end them) ----------------
  let siege = null, vote = null, drop = null, quiz = null;
  function siegeStart(hp) {
    siege = { hp, max: hp, hit: new Map() };
    siegePaint(); show($('[data-siege]'));
  }
  function siegePaint() { if (!siege) return; $('[data-hp]').style.width = `${Math.max(0, siege.hp / siege.max * 100)}%`; $('[data-hp-text]').textContent = `${Math.max(0, siege.hp)} / ${siege.max} HP`; }
  function siegeDamage(n) { if (!siege) return; siege.hp -= n; siegePaint(); }
  function siegeEnd() { if (!siege) return; siege = null; hide($('[data-siege]')); }

  function voteStart(options) {
    vote = { options, tally: options.map(() => 0), voters: new Set(), ends: Date.now() + GAME.voteSeconds * 1000 };
    $('[data-opts]').innerHTML = options.map((o, i) => `<div class="opt"><span class="n">!${i + 1}</span><span>${esc(o)}</span><span class="v" data-v${i}>0</span><span class="b"><span data-b${i}></span></span></div>`).join('');
    show($('[data-vote]')); votePaint();
  }
  function votePaint() {
    if (!vote) return;
    const total = vote.tally.reduce((a, b) => a + b, 0) || 1;
    vote.tally.forEach((v, i) => { $(`[data-v${i}]`).textContent = v; $(`[data-b${i}]`).style.width = `${v / total * 100}%`; });
    $('[data-vote-time]').textContent = `${Math.max(0, Math.ceil((vote.ends - Date.now()) / 1000))}s left · subs count double · ${GAME.bitsPerVote} bits = +1 vote`;
  }
  setInterval(votePaint, 1000);
  function voteEnd() { if (!vote) return; vote = null; setTimeout(() => hide($('[data-vote]')), 3000); }

  function dropStart(who, crates) {
    if (drop) { drop.left += crates; $('[data-drop-left]').textContent = drop.left; return; }
    drop = { left: crates, grabbed: new Set(), timer: setTimeout(dropEnd, 45000) };
    $('[data-drop-who]').textContent = `from ${who}`; $('[data-drop-left]').textContent = crates;
    show($('[data-drop]'));
  }
  function dropEnd() { if (!drop) return; clearTimeout(drop.timer); drop = null; hide($('[data-drop]')); }
  function grab(user) { if (!drop || drop.grabbed.has(user)) return; drop.grabbed.add(user); drop.left--; $('[data-drop-left]').textContent = Math.max(0, drop.left); if (drop.left <= 0) setTimeout(dropEnd, 1200); }

  function quizStart(q) { quiz = q; $('[data-quiz-q]').textContent = q; show($('[data-quiz]')); }
  function quizEnd() { if (!quiz) return; quiz = null; setTimeout(() => hide($('[data-quiz]')), 2500); }

  // ---------------- CogamCrew messages drive the moments ----------------
  function botMessage(raw) {
    const text = raw.slice(BOT.length).trim();
    chatLine('', '', text, true);
    let m;
    if ((m = text.match(/^➕ (\S+) ·/))) { alert('small', 'New follower', m[1], 'joined the crew'); boost += 0.5; }
    else if ((m = text.match(/^⭐ (\S+) → (.+?) ·/))) alert('toast', 'Rank up', `${m[1]} · ${m[2]}`, '', 3000);
    else if (text.startsWith('🔥')) { stars = 6; paintHeat(); alert('full', 'Chat heat maxed', 'SIX STARS', 'stars', 5000); setTimeout(() => { boost = 0; }, 5000); }
    if ((m = text.match(/CHOPPER SIEGE! .*?with (\d+) HP/))) siegeStart(Number(m[1]));
    if (/CHOPPER DOWN!/.test(text)) { siegeEnd(); alert('full', 'Chopper down', 'BOOM', 'The crew shot it down', 4500); }
    if (/The chopper escaped/.test(text)) siegeEnd();
    if ((m = text.match(/CHAOS VOTE \(\d+s\): (.+?)\. Cheer/))) voteStart(m[1].split(' · ').map((s) => s.replace(/^!\d\s*/, '')));
    if (/Chat has spoken|Nobody voted/.test(text)) voteEnd();
    if ((m = text.match(/CREW DROP from (.+?)!/))) dropStart(m[1], 10);
    if (/Crew Drop cleared/.test(text)) dropEnd();
    if ((m = text.match(/^❓ TRIVIA: (.+?) \(first correct/))) quizStart(m[1]);
    if (/^✅ .* got it|^Time! The answer was/.test(text)) quizEnd();
  }

  // ---------------- Twitch chat (anonymous, read-only) ----------------
  const tags = (raw) => { const o = {}; raw.slice(1).split(';').forEach((kv) => { const i = kv.indexOf('='); o[kv.slice(0, i)] = kv.slice(i + 1).replace(/\\s/g, ' '); }); return o; };
  let ws;
  function viewerMessage(t, user, text) {
    const name = t['display-name'] || user;
    chatLine(name, t.color, text, false);
    msgs.push(Date.now()); boost += hype(text);
    const bits = Number(t.bits || 0);
    const sub = /(^|,)(subscriber|founder)\//.test(t.badges || '');
    const cmd = text.trim().toLowerCase();
    if (bits) { boost += bits / 100; alert(bits >= 500 ? 'medium' : 'small', `${bits} bits`, name, text.replace(/\b\w*cheer\d+\b/gi, '').trim().slice(0, 80)); siegeDamage(bits); }
    if (cmd === '!grab') grab(user);
    if (cmd === '!hit' && siege) { const lastHit = siege.hit.get(user) || 0; if (Date.now() - lastHit >= GAME.hitCooldownMs) { siege.hit.set(user, Date.now()); siegeDamage(GAME.hitDamage); } }
    if (vote) {
      const v = cmd.match(/^!([1-3])$/);
      if (v && !vote.voters.has(user)) { vote.voters.add(user); vote.tally[Number(v[1]) - 1] += sub ? GAME.subVoteWeight : 1; }
      const bv = bits && text.match(/!([1-3])\b/);
      if (bv) vote.tally[Number(bv[1]) - 1] += Math.floor(bits / GAME.bitsPerVote);
      votePaint();
    }
  }
  function notice(t, text) {
    const kind = t['msg-id'], name = t['display-name'] || t.login || 'someone';
    if (kind === 'announcement') { if (text.startsWith(BOT)) botMessage(text); return; }
    if (kind === 'sub' || kind === 'resub') {
      const months = Number(t['msg-param-cumulative-months'] || 1);
      alert('medium', kind === 'sub' ? 'New subscriber' : `Resub · ${months} months`, name, 'Welcome to the crew');
      boost += 1; siegeDamage(GAME.subDamage);
    }
    if (kind === 'submysterygift' || kind === 'subgift') {
      const n = Number(t['msg-param-mass-gift-count'] || 1);
      if (kind === 'submysterygift' || !t['msg-param-origin-id']) alert('medium', `${n} gift sub${n > 1 ? 's' : ''}`, name, 'Absolute legend');
      boost += 1;
      // A gift bomb arrives as one submysterygift plus one subgift per recipient (tagged with origin-id): count it once.
      if (kind === 'submysterygift') siegeDamage(GAME.subDamage * n);
      else if (!t['msg-param-origin-id']) siegeDamage(GAME.subDamage);
    }
    if (kind === 'raid') { const v = t['msg-param-viewerCount'] || ''; alert('full', 'Incoming raid', 'RAID', `${name} + ${v} riders`, 5000); boost += 2; }
  }
  function onLine(line) {
    if (line.startsWith('PING')) return ws.send('PONG :tmi.twitch.tv');
    // ":login!login@login.tmi.twitch.tv" -> login (the whole name, never a prefix of it)
    const m = line.match(/^(@\S+ )?:([^!\s]+)(?:!\S+)? (PRIVMSG|USERNOTICE) #\S+ ?:?(.*)$/);
    if (!m) return;
    const t = m[1] ? tags(m[1].trim()) : {}, user = (m[2] || '').toLowerCase(), cmd = m[3], text = m[4] || '';
    if (cmd === 'PRIVMSG') { if (text.startsWith(BOT)) botMessage(text); else viewerMessage(t, user, text); }
    else notice(t, text);
    log(`connected · #${CHANNEL} · heat ${stars}`);
  }
  function connect() {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    ws.onopen = () => { ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands'); ws.send('PASS SCHMOOPIIE'); ws.send(`NICK justinfan${Math.floor(10000 + Math.random() * 80000)}`); ws.send(`JOIN #${CHANNEL}`); log(`connected · #${CHANNEL}`); };
    ws.onmessage = (e) => String(e.data).split('\r\n').filter(Boolean).forEach(onLine);
    ws.onclose = () => { log('reconnecting…'); setTimeout(connect, 3000); };
  }
  connect();

  // ---------------- slow data: goal + Top Crew ----------------
  async function loadData() {
    try {
      const d = await (await fetch(`${DATA_URL}?t=${Math.floor(Date.now() / 60000)}`, { cache: 'no-store' })).json();
      if (d.goal) {
        $('[data-goal-label]').textContent = d.goal.label || 'Follower goal';
        $('[data-goal-now]').textContent = d.goal.current; $('[data-goal-target]').textContent = d.goal.target;
        $('[data-goal-bar]').style.width = `${Math.min(100, d.goal.current / d.goal.target * 100)}%`;
      }
      if (Array.isArray(d.top)) $('[data-lb]').innerHTML = d.top.length
        ? d.top.map((v, i) => `<li><span class="p">${i + 1}</span><span>${esc(v.name)}</span><span class="r">${esc(v.rank.split(' ')[0])}</span></li>`).join('')
        : '<li><span class="p">–</span><span>Chat to join the crew</span><span class="r"></span></li>';
    } catch { /* keep the last good data */ }
  }
  loadData(); setInterval(loadData, 60000);

  // ---------------- demo ----------------
  if (DEMO) {
    const say = (s, d) => setTimeout(() => onLine(`@display-name=CogamCrew :thecogam!thecogam@thecogam.tmi.twitch.tv PRIVMSG #${CHANNEL} :${BOT} ${s}`), d);
    const chat = (n, s, d, extra = '') => setTimeout(() => onLine(`@display-name=${n};color=#ff8fc4${extra} :${n.toLowerCase()}!x@x.tmi.twitch.tv PRIVMSG #${CHANNEL} :${s}`), d);
    ['NO WAY', 'lets go', 'that jump was insane', 'W', 'clip it'].forEach((s, i) => chat(`viewer${i}`, s, 800 + i * 500));
    say('➕ nightrider_77 · New follower: nightrider_77! That\'s one more witness to the driving.', 3000);
    say('🚁 CHOPPER SIEGE! A police chopper is circling with 2000 HP. Type !hit to shoot it down, cheers and subs deal massive damage. 3 minutes!', 7000);
    chat('turbo_tara', 'cheer500 eat this', 9000, ';bits=500');
    [1, 2, 3, 4].forEach((i) => chat(`hitter${i}`, '!hit', 9500 + i * 300));
    say('⭐ vicekid → 3-Star Wanted · vicekid climbed to 3-Star Wanted. Keep chatting, legend.', 12000);
    say('🗳️ CHAOS VOTE (60s): !1 No brakes for 2 minutes · !2 Steal a bus and drive it like a sports car · !3 Jump off the tallest building in sight. Cheer 10 bits for an extra vote, subs count double!', 15000);
    [['a', '!1'], ['b', '!2'], ['c', '!2'], ['d', '!3']].forEach(([u, v], i) => chat(`voter_${u}`, v, 16000 + i * 400, i === 1 ? ';badges=subscriber/1' : ''));
    say('🔥 SIX STARS! Chat went absolutely feral. Bonus XP for everyone who was here, and the clip is saved!', 20000);
  }
})();
