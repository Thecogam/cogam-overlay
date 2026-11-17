// Cogam Neon Tube overlay: self-contained script for a Streamlabs Custom Widget (iframes are not allowed there).
// Builds its own styles and markup, then reads public Twitch chat anonymously (read-only IRC). No secrets.
// Options (set on window before loading): COGAM_CHANNEL, COGAM_DEMO, COGAM_DEBUG.
(() => {
  if (window.__cogamOverlay) return;
  window.__cogamOverlay = true;
  const CHANNEL = String(window.COGAM_CHANNEL || 'thecogam').toLowerCase();
  const DEMO = Boolean(window.COGAM_DEMO);
  const DEBUG = Boolean(window.COGAM_DEBUG);

  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Monoton&family=Chakra+Petch:wght@600;700&display=swap';
  document.head.appendChild(font);

  const css = `
  #cogam-root { --pink:#ff2e88; --orange:#ff8a3d; --cyan:#19e3ff; --gold:#ffd25e; position:fixed; left:0; top:0; width:1920px; height:1080px; overflow:hidden; pointer-events:none;
    font-family:"Chakra Petch",Consolas,monospace; color:#fff; transform-origin:0 0; }
  #cogam-root .heat { position:absolute; left:50%; top:34px; transform:translateX(-50%); padding:12px 26px; display:grid; justify-items:center; gap:4px;
    border:3px solid var(--pink); border-radius:18px; background:rgba(12,7,32,.55); box-shadow:0 0 8px var(--pink),0 0 22px rgba(255,46,136,.6),inset 0 0 14px rgba(255,46,136,.35); }
  #cogam-root .label { font-size:15px; letter-spacing:.4em; color:#ffd9ea; text-transform:uppercase; text-shadow:0 0 6px var(--pink); }
  #cogam-root .stars { display:flex; gap:10px; font-size:44px; line-height:1; }
  #cogam-root .stars span { color:rgba(255,255,255,.14); transition:color .35s,text-shadow .35s,transform .35s; }
  #cogam-root .stars span.on { color:var(--gold); text-shadow:0 0 10px var(--gold),0 0 24px var(--orange); transform:scale(1.08); }
  #cogam-root .drop { position:absolute; left:50%; top:170px; transform:translateX(-50%); min-width:560px; padding:20px 34px; text-align:center; display:grid; gap:6px;
    border:3px solid var(--cyan); border-radius:20px; background:rgba(12,7,32,.85); box-shadow:0 0 10px var(--cyan),0 0 34px var(--cyan),inset 0 0 18px rgba(25,227,255,.4); }
  #cogam-root .hide { display:none !important; }
  #cogam-root .kind { font-size:18px; letter-spacing:.35em; color:var(--gold); text-transform:uppercase; }
  #cogam-root .who { font-size:42px; font-weight:700; color:#dcfaff; text-shadow:0 0 8px var(--cyan),0 0 20px var(--cyan); }
  #cogam-root .crate { font-size:70px; line-height:1; filter:drop-shadow(0 0 14px var(--cyan)); animation:cogam-bob 1.2s ease-in-out infinite; }
  #cogam-root .left { font-size:24px; } #cogam-root .left b { color:var(--gold); }
  #cogam-root .drop:not(.hide) { animation:cogam-tube .9s both; }
  #cogam-root .max { position:absolute; inset:0; display:grid; place-items:center; align-content:center; gap:10px; background:radial-gradient(circle,rgba(255,46,136,.35),rgba(12,7,32,.8) 70%); }
  #cogam-root .big { font-family:Monoton,Impact,sans-serif; font-size:150px; color:#ffd9ea; text-shadow:0 0 6px #fff,0 0 18px var(--pink),0 0 50px var(--pink); animation:cogam-slam .7s cubic-bezier(.2,1.4,.3,1) both; }
  #cogam-root .max .stars { font-size:80px; justify-content:center; } #cogam-root .max .stars span { color:var(--gold); text-shadow:0 0 14px var(--gold),0 0 30px var(--orange); }
  #cogam-root .debug { position:absolute; left:20px; bottom:20px; font-size:18px; padding:6px 12px; border-radius:8px; background:rgba(0,0,0,.6); }
  #cogam-root.shake { animation:cogam-shake .5s; }
  @keyframes cogam-tube { 0%{opacity:0} 10%{opacity:1} 16%{opacity:.1} 24%{opacity:1} 30%{opacity:.3} 40%,100%{opacity:1} }
  @keyframes cogam-bob { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-8px) rotate(4deg)} }
  @keyframes cogam-slam { 0%{transform:scale(2.4);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes cogam-shake { 0%,100%{translate:0 0} 25%{translate:-10px 6px} 50%{translate:9px -6px} 75%{translate:-5px 3px} }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'cogam-root';
  const six = '<div class="stars"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>';
  root.innerHTML = `
    <div class="heat"><div class="label">Chat heat</div><div class="stars" data-heat>${'<span>★</span>'.repeat(6)}</div></div>
    <div class="drop hide" data-drop><div class="kind">Crew drop</div><div class="crate">📦</div><div class="who" data-who></div><div class="left">Type <b>!grab</b> · <b data-left>10</b> crates left</div></div>
    <div class="max hide" data-max><div class="big">SIX STARS</div>${six}</div>
    <div class="debug ${DEBUG ? '' : 'hide'}" data-debug>connecting…</div>`;
  document.body.appendChild(root);
  const q = (sel) => root.querySelector(sel);

  // Scale the 1920x1080 layout to whatever size Streamlabs gives the widget.
  const fit = () => { const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1; root.style.transform = `scale(${s})`; };
  window.addEventListener('resize', fit); fit();

  const log = (t) => { if (DEBUG) q('[data-debug]').textContent = t; };

  // ---- Heat meter (same rules as the engine) ----
  const HYPE = ['no way', 'omg', 'lets go', "let's go", 'w', 'lul', 'lmao', 'insane', 'clip it', 'pog'];
  let msgs = [], baseline = 0, samples = 0, boost = 0, stars = 0, last = 0, maxedAt = -Infinity;
  const heatEls = [...q('[data-heat]').children];
  const hype = (text) => { const t = ` ${text.toLowerCase()} `; return HYPE.some((w) => (w.length <= 2 ? t.includes(` ${w} `) : t.includes(w))) ? 0.15 : 0; };
  setInterval(() => {
    const now = Date.now(), dt = last ? (now - last) / 1000 : 0; last = now;
    boost = Math.max(0, boost - dt / 45);
    msgs = msgs.filter((t) => now - t <= 30000);
    const rate = msgs.length; samples++;
    const a = samples < 12 ? 0.3 : rate > baseline * 2 ? 0.01 : 0.05;
    baseline += a * (rate - baseline);
    const z = (rate - baseline) / Math.max(1, Math.sqrt(Math.max(baseline, 1)));
    stars = Math.min(6, Math.floor(Math.max(0, z / 1.5) + boost));
    heatEls.forEach((s, i) => s.classList.toggle('on', i < stars));
    if (stars >= 6 && now - maxedAt > 180000) {
      maxedAt = now; boost = 0;
      q('[data-max]').classList.remove('hide');
      root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
      setTimeout(() => q('[data-max]').classList.add('hide'), 4800);
    }
  }, 5000);

  // ---- Crew Drop ----
  let drop = null;
  function startDrop(who, crates) {
    if (drop) { drop.left += crates; q('[data-left]').textContent = drop.left; return; }
    drop = { left: crates, grabbed: new Set(), timer: setTimeout(endDrop, 45000) };
    q('[data-who]').textContent = `from ${who}`;
    q('[data-left]').textContent = crates;
    q('[data-drop]').classList.remove('hide');
  }
  function endDrop() { if (!drop) return; clearTimeout(drop.timer); drop = null; q('[data-drop]').classList.add('hide'); }
  function grab(user) {
    if (!drop || drop.grabbed.has(user)) return;
    drop.grabbed.add(user); drop.left--;
    q('[data-left]').textContent = Math.max(0, drop.left);
    if (drop.left <= 0) setTimeout(endDrop, 1200);
  }

  // ---- Twitch chat (anonymous, read-only) ----
  const tags = (raw) => { const o = {}; raw.slice(1).split(';').forEach((kv) => { const i = kv.indexOf('='); o[kv.slice(0, i)] = kv.slice(i + 1); }); return o; };
  let ws;
  function onLine(line) {
    if (line.startsWith('PING')) return ws.send('PONG :tmi.twitch.tv');
    const m = line.match(/^(@\S+ )?:(\S+?)!?\S* (PRIVMSG|USERNOTICE) #\S+ ?:?(.*)$/);
    if (!m) return;
    const t = m[1] ? tags(m[1].trim()) : {}, user = (m[2] || '').toLowerCase(), cmd = m[3], text = m[4] || '';
    if (cmd === 'PRIVMSG') {
      const isBot = text.startsWith('🤖 CogamCrew:');
      if (!isBot) { msgs.push(Date.now()); boost += hype(text); }
      if (t.bits) boost += Number(t.bits) / 100;
      if (text.trim().toLowerCase() === '!grab') grab(user);
      const d = isBot && text.match(/CREW DROP from (.+?)!/);
      if (d) startDrop(d[1], 10);
      log(`connected · #${CHANNEL} · heat ${stars}`);
    } else if (cmd === 'USERNOTICE') {
      const kind = t['msg-id'];
      if (kind === 'sub' || kind === 'resub' || kind === 'subgift' || kind === 'submysterygift') boost += 1;
      if (kind === 'raid') boost += 2;
    }
  }
  function connect() {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      ws.send('PASS SCHMOOPIIE');
      ws.send(`NICK justinfan${Math.floor(10000 + Math.random() * 80000)}`);
      ws.send(`JOIN #${CHANNEL}`);
      log(`connected · #${CHANNEL}`);
    };
    ws.onmessage = (e) => String(e.data).split('\r\n').filter(Boolean).forEach(onLine);
    ws.onclose = () => { log('reconnecting…'); setTimeout(connect, 3000); };
  }
  connect();

  if (DEMO) {
    let n = 0;
    const fake = setInterval(() => { for (let i = 0; i < 3 + n; i++) { msgs.push(Date.now()); boost += 0.15; } if (++n > 10) clearInterval(fake); }, 1500);
    setTimeout(() => startDrop('nightrider_77', 10), 2000);
    [3, 4, 5, 6].forEach((s) => setTimeout(() => grab('viewer' + s), s * 1000));
  }
})();
