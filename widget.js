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
  #cg, #cg * { box-sizing:border-box; }
  #cg .hide { display:none !important; }
  #cg .games > .card { width:100%; }
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
  /* Game cards: compact column on the left under the goal, kept above the GTA minimap so the centre stays clear */
  #cg .games { position:absolute; left:44px; top:252px; width:420px; display:flex; flex-direction:column; gap:10px; }
  #cg .card { text-align:left; display:grid; gap:4px; padding:10px 16px; background:rgba(12,7,32,.82); }
  #cg .card .k { font-size:13px; letter-spacing:.26em; text-transform:uppercase; color:var(--gold); }
  #cg .card .h { font-size:20px; font-weight:700; color:#ffd9ea; text-shadow:0 0 6px var(--pink); }
  #cg .card .s { font-family:Barlow,sans-serif; font-size:16px; color:#e4dbff; }
  #cg .card .h.sm { font-size:16px; }
  #cg .card .row { display:flex; align-items:center; gap:12px; }
  #cg .hp { height:14px; border-radius:999px; background:rgba(255,255,255,.12); overflow:hidden; margin-top:2px; }
  #cg .hp > span { display:block; height:100%; background:linear-gradient(90deg,var(--orange),var(--pink)); box-shadow:0 0 14px var(--pink); transition:width .4s; }
  #cg .opts { display:grid; gap:5px; margin-top:2px; }
  #cg .opt { display:grid; grid-template-columns:30px 1fr 34px; gap:6px 8px; align-items:center; font-size:15px; }
  #cg .opt .n { font-weight:700; color:var(--cyan); } #cg .opt .v { text-align:right; color:var(--gold); font-variant-numeric:tabular-nums; }
  #cg .opt .b { height:5px; border-radius:999px; background:rgba(255,255,255,.12); grid-column:2/4; overflow:hidden; } #cg .opt .b span { display:block; height:100%; width:0; background:var(--cyan); box-shadow:0 0 8px var(--cyan); transition:width .4s; }
  #cg .crate { font-size:34px; line-height:1; filter:drop-shadow(0 0 10px var(--cyan)); animation:cg-bob 1.2s ease-in-out infinite; }

  /* Animated stream border: flowing neon gradient + corner brackets */
  @property --cg-angle { syntax:'<angle>'; inherits:false; initial-value:0deg; }
  #cg .frame { position:absolute; inset:8px; border-radius:22px; padding:4px; pointer-events:none;
    background:conic-gradient(from var(--cg-angle), var(--pink), var(--orange), var(--gold), var(--cyan), var(--violet), var(--pink));
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude;
    filter:drop-shadow(0 0 6px var(--pink)) drop-shadow(0 0 14px rgba(255,46,136,.5)); opacity:.85; animation:cg-spin 12s linear infinite; }
  #cg .corner { position:absolute; width:46px; height:46px; border:4px solid var(--cyan); filter:drop-shadow(0 0 8px var(--cyan)); animation:cg-corner 3s ease-in-out infinite; }
  #cg .corner.tl { left:2px; top:2px; border-right:0; border-bottom:0; border-radius:18px 0 0 0; }
  #cg .corner.tr { right:2px; top:2px; border-left:0; border-bottom:0; border-radius:0 18px 0 0; animation-delay:.75s; }
  #cg .corner.bl { left:2px; bottom:2px; border-right:0; border-top:0; border-radius:0 0 0 18px; animation-delay:2.25s; }
  #cg .corner.br { right:2px; bottom:2px; border-left:0; border-top:0; border-radius:0 0 18px 0; animation-delay:1.5s; }

  /* Living panels */
  #cg .tube { animation:cg-breathe 4.5s ease-in-out infinite; }
  #cg .tube.c { animation-name:cg-breathe-c; }
  #cg .brand .word span { --glow:var(--pink); text-shadow:0 0 4px #fff,0 0 10px var(--glow),0 0 22px var(--glow); animation:cg-surge 8s infinite; }
  #cg .brand .word span:nth-child(2){animation-delay:.12s} #cg .brand .word span:nth-child(3){animation-delay:.24s} #cg .brand .word span:nth-child(4){animation-delay:.36s} #cg .brand .word span:nth-child(5){animation-delay:.48s}
  #cg .brand .the { animation:cg-flicker 7s infinite; }
  #cg .bar > span { position:relative; overflow:hidden; }
  #cg .bar > span::after { content:""; position:absolute; inset:0; background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.65) 50%,transparent 70%); animation:cg-shimmer 2.8s ease-in-out infinite; }
  #cg .heat[data-level="3"], #cg .heat[data-level="4"] { border-color:var(--orange); box-shadow:0 0 8px var(--orange),0 0 26px rgba(255,138,61,.6),inset 0 0 14px rgba(255,138,61,.35); }
  #cg .heat[data-level="5"], #cg .heat[data-level="6"] { border-color:var(--gold); box-shadow:0 0 10px var(--gold),0 0 34px rgba(255,210,94,.7),inset 0 0 16px rgba(255,210,94,.4); animation:cg-hot 1.2s ease-in-out infinite; }
  #cg .stars span.on { animation:cg-twinkle 2.4s ease-in-out infinite; }
  #cg .stars span.on:nth-child(2){animation-delay:.3s} #cg .stars span.on:nth-child(3){animation-delay:.6s} #cg .stars span.on:nth-child(4){animation-delay:.9s} #cg .stars span.on:nth-child(5){animation-delay:1.2s} #cg .stars span.on:nth-child(6){animation-delay:1.5s}
  #cg .lb li { animation:cg-row .6s both; } #cg .lb li:nth-child(2){animation-delay:.08s} #cg .lb li:nth-child(3){animation-delay:.16s} #cg .lb li:nth-child(4){animation-delay:.24s} #cg .lb li:nth-child(5){animation-delay:.32s}
  #cg .lb li:first-child .p { color:var(--gold); text-shadow:0 0 8px var(--gold); animation:cg-glint 3s ease-in-out infinite; }
  #cg .ticker .tag { animation:cg-tag 2s ease-in-out infinite; }
  #cg .ticker .item.swap { animation:cg-slide .6s cubic-bezier(.2,.9,.25,1.1) both; }
  #cg .title i { animation:cg-twinkle 3s ease-in-out infinite; }
  @keyframes cg-spin { to { --cg-angle:360deg; } }
  @keyframes cg-corner { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes cg-breathe { 0%,100%{box-shadow:0 0 6px var(--pink),0 0 16px rgba(255,46,136,.4),inset 0 0 10px rgba(255,46,136,.22)} 50%{box-shadow:0 0 10px var(--pink),0 0 28px rgba(255,46,136,.7),inset 0 0 16px rgba(255,46,136,.38)} }
  @keyframes cg-breathe-c { 0%,100%{box-shadow:0 0 6px var(--cyan),0 0 16px rgba(25,227,255,.4),inset 0 0 10px rgba(25,227,255,.2)} 50%{box-shadow:0 0 10px var(--cyan),0 0 28px rgba(25,227,255,.65),inset 0 0 16px rgba(25,227,255,.35)} }
  @property --glow { syntax:'<color>'; inherits:true; initial-value:#ff2e88; }
  @keyframes cg-surge { 0%,35%,100%{--glow:var(--pink)} 45%{--glow:var(--orange)} 55%{--glow:var(--gold)} 70%{--glow:var(--cyan)} }
  @keyframes cg-flicker { 0%,92%,95%,100%{opacity:1} 93%{opacity:.3} 94%{opacity:.85} }
  @keyframes cg-shimmer { 0%{transform:translateX(-100%)} 60%,100%{transform:translateX(100%)} }
  @keyframes cg-hot { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.04)} }
  @keyframes cg-twinkle { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.45)} }
  @keyframes cg-row { from{opacity:0;translate:16px 0} to{opacity:1;translate:0 0} }
  @keyframes cg-glint { 0%,70%,100%{filter:brightness(1)} 80%{filter:brightness(1.9)} }
  @keyframes cg-tag { 0%,100%{box-shadow:0 0 0 rgba(25,227,255,0)} 50%{box-shadow:0 0 14px var(--cyan)} }
  @keyframes cg-slide { from{opacity:0;translate:0 24px} to{opacity:1;translate:0 0} }
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
  /* Heat meter v2: next unlock + live top contributors */
  #cg .heat .next { font-size:15px; letter-spacing:.08em; color:#ffd9ea; text-shadow:0 0 6px var(--pink); white-space:nowrap; }
  #cg .heat .next b { color:var(--gold); }
  #cg .heat .crew { font-family:Barlow,sans-serif; font-size:15px; color:#c9f6ff; white-space:nowrap; max-width:560px; overflow:hidden; text-overflow:ellipsis; }
  #cg .goal .sub { display:grid; gap:6px; margin-top:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,.12); }
  #cg .goal .sub .bar > span { background:linear-gradient(90deg,var(--violet),var(--cyan)); box-shadow:0 0 12px var(--cyan); }
  #cg .goal .sub .num { font-size:15px; } #cg .goal .sub .rw { font-family:Barlow,sans-serif; font-size:14px; color:#c9f6ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  /* effects layer (Bits menu, subs, Spotlight) */
  #cg .fx { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  #cg .siren { position:absolute; inset:0; animation:cg-siren .35s steps(2) 8; mix-blend-mode:screen; }
  @keyframes cg-siren { 0%{background:linear-gradient(90deg,rgba(255,0,60,.45),transparent 45%,transparent 55%,rgba(0,90,255,0))} 100%{background:linear-gradient(90deg,rgba(255,0,60,0),transparent 45%,transparent 55%,rgba(0,90,255,.45))} }
  #cg .bubble { position:absolute; left:50%; top:380px; transform:translateX(-50%); max-width:900px; padding:18px 30px; text-align:center; font-family:Barlow,sans-serif; font-size:38px; font-weight:600; color:#fff; background:rgba(12,7,32,.88); border:3px solid var(--cyan); border-radius:22px; box-shadow:0 0 24px var(--cyan); animation:cg-pop .4s cubic-bezier(.2,1.5,.3,1) both; }
  #cg .bubble b { display:block; font-family:"Chakra Petch",monospace; font-size:22px; letter-spacing:.2em; color:var(--gold); }
  #cg .drop-emote { position:absolute; top:-120px; width:84px; height:84px; animation:cg-fall linear forwards; filter:drop-shadow(0 0 10px rgba(255,46,136,.6)); font-size:70px; text-align:center; }
  @keyframes cg-fall { to { transform:translateY(1300px) rotate(220deg); } }
  #cg .poster { position:absolute; right:470px; top:200px; width:360px; padding:18px; text-align:center; background:#e8d9b5; color:#2b1a0e; border:6px solid #2b1a0e; box-shadow:0 0 40px rgba(255,46,136,.6),0 20px 40px rgba(0,0,0,.6); transform:rotate(3deg); animation:cg-pop .5s cubic-bezier(.2,1.5,.3,1) both; font-family:"Chakra Petch",monospace; }
  #cg .poster .w { font-family:Impact,sans-serif; font-size:64px; letter-spacing:.06em; color:#8a1010; line-height:1; }
  #cg .poster .n { font-size:34px; font-weight:700; margin:10px 0; overflow-wrap:anywhere; } #cg .poster .r { font-size:20px; letter-spacing:.2em; }
  #cg .burst { position:absolute; width:16px; height:16px; border-radius:50%; animation:cg-burst 1.4s ease-out forwards; }
  @keyframes cg-burst { from{transform:translate(0,0) scale(1);opacity:1} to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0} }
  @keyframes cg-pop { from{opacity:0;transform:translateX(-50%) scale(.4)} to{opacity:1;transform:translateX(-50%) scale(1)} }
  /* WANTED poster: SLAMS onto the screen (big + tilted -> overshoot -> settle), then slowly slips down the wall and fades (8 s) */
  #cg .poster { animation:cg-slam-poster .42s cubic-bezier(.55,0,.75,.3) both, cg-slip 7.5s .5s cubic-bezier(.45,0,.55,1) both; }
  @keyframes cg-slam-poster { 0%{opacity:0;transform:rotate(-14deg) scale(2.8)} 60%{opacity:1;transform:rotate(5deg) scale(.92)}
    80%{transform:rotate(2deg) scale(1.04)} 100%{opacity:1;transform:rotate(3deg) scale(1)} }
  @keyframes cg-slip { 0%{opacity:1;transform:translateY(0) rotate(3deg)} 30%{transform:translateY(40px) rotate(-1deg)} 60%{transform:translateY(110px) rotate(2.5deg)}
    88%{opacity:1;transform:translateY(190px) rotate(-.5deg)} 100%{opacity:0;transform:translateY(230px) rotate(1deg)} }
  /* Session stats card: deliberately quiet (no glow pulse), bottom-right under chat, clear of the GTA minimap */
  #cg .stats { position:absolute; right:44px; top:846px; width:380px; padding:8px 14px; display:flex; justify-content:space-between; align-items:center;
    border:2px solid rgba(25,227,255,.45); border-radius:14px; background:rgba(12,7,32,.5); opacity:.78; font-size:15px; color:#d9cdf5; font-variant-numeric:tabular-nums; }
  #cg .stats span { display:flex; gap:5px; align-items:center; white-space:nowrap; } #cg .stats b { color:#fff; font-weight:700; }
  #cg .stats.bump { animation:cg-statbump .6s ease-out; } @keyframes cg-statbump { 0%{opacity:1;border-color:var(--gold)} 100%{opacity:.78} }
  #cg .hint { font-size:12px; letter-spacing:.12em; color:var(--cyan); text-shadow:none; opacity:.85; margin-left:auto; text-transform:none; }
  /* Vibe themes (chat-picked at ★5) */
  #cg.theme-vice-sunset { --pink:#ff6a3d; --orange:#ffb347; --cyan:#ff4fa3; --gold:#ffe17a; --violet:#c13cff; }
  #cg.theme-neon-storm { --pink:#7a3cff; --orange:#19e3ff; --cyan:#00ffb3; --gold:#e7ff4f; --violet:#3c7aff; }
  #cg.theme-night-drive { --pink:#ff2e88; --orange:#ff8a3d; --cyan:#19e3ff; --gold:#ffd25e; --violet:#7a3cff; }
  @media (prefers-reduced-motion: reduce) { #cg * { animation:none !important; transition:none !important; } }`;
  document.head.appendChild(style);

  // ---------------- markup ----------------
  const root = document.createElement('div');
  root.id = 'cg';
  const starRow = (n = 6) => '<span>★</span>'.repeat(n);
  root.innerHTML = `
    <div class="frame"></div><div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="brand"><div class="the">the</div><div class="word"><span>C</span><span>O</span><span>G</span><span>A</span><span>M</span></div></div>
    <div class="goal tube"><div class="title"><i>★</i><span data-goal-label>Follower goal</span><span class="hint">hit follow ♥</span></div><div class="bar"><span data-goal-bar></span></div><div class="num"><span><b data-goal-now>–</b> / <span data-goal-target>–</span></span><span>today</span></div>
      <div class="sub hide" data-subgoal><div class="num"><span>🎯 Sub goal <b data-sg-now>0</b> / <span data-sg-target>–</span></span><span class="hint">subs + gifts · !support</span></div><div class="bar"><span data-sg-bar></span></div><div class="rw" data-sg-reward></div></div></div>
    <div class="heat tube"><div class="title" style="font-size:14px">Chat heat · !heat</div><div class="stars" data-heat>${starRow()}</div><div class="next" data-next></div><div class="crew" data-crew></div></div>
    <div class="lb tube c"><div class="title"><i>★</i>Top crew<span class="hint">chat = XP · !rank</span></div><ol data-lb><li><span class="p">–</span><span>Crew loading…</span><span class="r"></span></li></ol></div>
    <div class="chat tube"><div class="title"><i>★</i>Chat<span class="hint">new? type !help</span></div><div class="list" data-chat></div></div>
    <div class="stats hide" data-stats><span title="time live">⏱ <b data-st-time>0:00</b></span><span title="deaths">💀 <b data-st-deaths>0</b></span><span title="crashes">💥 <b data-st-crashes>0</b></span><span title="Heat record">🔥 <b data-st-heat>0</b>★</span><span title="Spotlights">🔦 <b data-st-spot>0</b></span></div>
    <div class="ticker tube c"><span class="tag">Latest</span><span class="item" data-ticker>Welcome to the stream</span></div>
    <div class="games">
      <div class="card tube c siege hide" data-siege><div class="k">🚁 Chopper siege · !hit</div><div class="hp"><span data-hp style="width:100%"></span></div><div class="s" data-hp-text></div></div>
      <div class="card tube vote hide" data-vote><div class="k">🗳️ Chaos vote · !1 !2 !3</div><div class="opts" data-opts></div><div class="s" data-vote-time></div></div>
      <div class="card tube c drop hide" data-drop><div class="k">📦 Crew drop · !grab</div><div class="row"><div class="crate">📦</div><div><div class="h" data-drop-who></div><div class="s"><b data-drop-left>10</b> crates left</div></div></div></div>
      <div class="card tube c quiz hide" data-quiz><div class="k">❓ Trivia · answer in chat</div><div class="h sm" data-quiz-q></div></div>
    </div>
    <div class="fx" data-fx></div>
    <div data-alerts></div>
    <div class="debug ${DEBUG ? '' : 'hide'}" data-debug>connecting…</div>`;
  // COGAM_MOUNT: render inside a given element (playground page) instead of covering the window
  const MOUNT = window.COGAM_MOUNT || null;
  if (MOUNT) root.style.position = 'absolute';
  (MOUNT || document.body).appendChild(root);
  const $ = (s) => root.querySelector(s);
  const fit = () => {
    const s = MOUNT ? (MOUNT.clientWidth / 1920 || 1) : (Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1);
    root.style.transform = `scale(${s})`;
  };
  window.addEventListener('resize', fit); fit();
  const log = (t) => { if (DEBUG) $('[data-debug]').textContent = t; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const show = (el) => { el.classList.remove('hide', 'out'); void el.offsetWidth; el.classList.add('in'); };
  const hide = (el) => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => { el.classList.add('hide'); el.classList.remove('out'); }, 500); };
  const shake = () => { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); };
  const ticker = (t) => { lastTicker = Date.now(); $('.ticker .tag').textContent = 'Latest'; const el = $('[data-ticker]'); el.textContent = t; el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); };

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
  // Heat ladder v2: what the next star unlocks, shown under the meter so viewers always know why to push it
  const NEXT = ['★1 · sirens on the frame', '★2 · keep it going', '★3 · DOUBLE Neon Cash', '★4 · Heat Bet (channel points)', '★5 · you pick the overlay vibe', '★6 · SPOTLIGHT MODE'];
  const contrib = new Map();   // display name -> points this run (chat, hype words, bits, subs), computed from public chat
  const addHeat = (name, pts) => { if (name) contrib.set(name, (contrib.get(name) || 0) + pts); };
  const paintCrew = () => {
    const top = [...contrib.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
    $('[data-crew]').textContent = top.length ? `🔥 Pushing it: ${top.join(' · ')}` : 'Chat to push the Heat';
  };
  const paintHeat = () => {
    heatEls.forEach((s, i) => s.classList.toggle('on', i < stars)); $('.heat').dataset.level = String(stars);
    $('[data-next]').innerHTML = stars >= 6 ? '<b>SPOTLIGHT MODE</b> · double XP' : `NEXT: <b>${esc(NEXT[Math.min(5, stars)])}</b>`;
    paintCrew();
  };
  let cold = 0;
  setInterval(() => { if (stars === 0) { cold += 5; if (cold >= 120) contrib.clear(); } else cold = 0; }, 5000);

  // ---------------- effects (Bits menu, subs, Spotlight) ----------------
  let audioCtx = null;
  const tone = (fn) => { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); fn(audioCtx); } catch { /* sound is optional */ } };
  // No siren sounds (owner didn't like them). 100 bits = a short, soft "police radio chirp": two quick filtered blips.
  const chirp = () => tone((ac) => {
    const t = ac.currentTime;
    [0, 0.13].forEach((d, i) => {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'triangle'; f.type = 'lowpass'; f.frequency.value = 2200;
      o.frequency.setValueAtTime(i ? 1046 : 1318, t + d); o.frequency.exponentialRampToValueAtTime(i ? 880 : 1046, t + d + 0.08);
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.03, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.1);
      o.connect(f).connect(g).connect(ac.destination); o.start(t + d); o.stop(t + d + 0.12);
    });
  });
  // WANTED poster slam: deep thud (falling sine) + a short paper slap (filtered noise)
  const thud = () => tone((ac) => {
    const t = ac.currentTime + 0.25;                       // lands as the poster hits
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.45);
    const n = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.12), ac.sampleRate), ch = n.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g2 = ac.createGain();
    s.buffer = n; f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.8; g2.gain.value = 0.05;
    s.connect(f).connect(g2).connect(ac.destination); s.start(t);
  });
  const chime = () => tone((ac) => { const t = ac.currentTime; [880, 1320, 1760].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f;
    g.gain.setValueAtTime(0.05, t + i * 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.5); o.connect(g).connect(ac.destination); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.5); }); });
  const fxLayer = () => $('[data-fx]');
  const tmp = (el, ms) => { fxLayer().appendChild(el); setTimeout(() => el.remove(), ms); };
  const fxSiren = () => { const d = document.createElement('div'); d.className = 'siren'; tmp(d, 3000); chirp(); };
  const fxBubble = (name, msg) => { const d = document.createElement('div'); d.className = 'bubble'; d.innerHTML = `<b>${esc(name)}</b>${esc(msg)}`; tmp(d, 8000); chime(); };
  let EMOTES = [];
  const fxRain = (n = 36, pool) => {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div'); d.className = 'drop-emote';
      const src = (pool || EMOTES)[Math.floor(Math.random() * Math.max(1, (pool || EMOTES).length))];
      if (src && /^https?:/.test(src)) d.innerHTML = `<img src="${esc(src)}" style="width:100%;height:100%">`; else d.textContent = src || ['💜', '🔥', '⭐', '🌴'][i % 4];
      d.style.left = `${Math.random() * 1840}px`; d.style.animationDuration = `${2.6 + Math.random() * 2.2}s`; d.style.animationDelay = `${Math.random() * 1.5}s`;
      tmp(d, 7000);
    }
    chime();
  };
  const fxPoster = (name) => { const d = document.createElement('div'); d.className = 'poster'; d.innerHTML = `<div class="w">WANTED</div><div class="r">MOST WANTED IN VICE CITY</div><div class="n">${esc(name)}</div><div class="r">★★★★★★ · REWARD: RESPECT</div>`; tmp(d, 8100); thud(); setTimeout(shake, 250); };   // 8 s: slams in (thud + screen shake), slips down the wall, fades (owner-requested)
  const fxBurst = (x, y, n = 40, colors = ['#ff2e88', '#19e3ff', '#ffd25e', '#7a3cff']) => {
    for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'burst'; const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 380;
      d.style.left = `${x}px`; d.style.top = `${y}px`; d.style.background = colors[i % colors.length]; d.style.setProperty('--dx', `${Math.cos(a) * r}px`); d.style.setProperty('--dy', `${Math.sin(a) * r}px`); tmp(d, 1500); }
  };
  // game cards always start just below the goal panel (it grows when the sub goal bar appears)
  const placeGames = () => { const g = $('.goal'); $('.games').style.top = `${g.offsetTop + g.offsetHeight + 10}px`; };
  setTimeout(placeGames, 500);
  // session stats card (data.json gives the baseline; bot messages update it instantly)
  const ST = { startedAt: 0, deaths: 0, crashes: 0, heat: 0, spot: 0, live: false };
  const paintStats = (bump) => {
    const el = $('[data-stats]');
    if (!ST.live && !DEMO) { el.classList.add('hide'); return; }
    el.classList.remove('hide');
    $('[data-st-deaths]').textContent = ST.deaths; $('[data-st-crashes]').textContent = ST.crashes;
    $('[data-st-heat]').textContent = Math.max(ST.heat, stars); $('[data-st-spot]').textContent = ST.spot;
    if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  };
  setInterval(() => {
    if (!ST.startedAt) return;
    const s = Math.max(0, Math.floor((Date.now() - ST.startedAt) / 1000));
    $('[data-st-time]').textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`;
    ST.heat = Math.max(ST.heat, stars); $('[data-st-heat]').textContent = ST.heat;
  }, 1000);
  const applyTheme = (id) => { root.classList.remove('theme-vice-sunset', 'theme-neon-storm', 'theme-night-drive'); root.classList.add(`theme-${id}`); };

  // how-to tips rotate in the ticker when nothing else is happening
  let TIPS = ['Chat fast + hype words + support = HEAT ★ · type !heat', '★6 HEAT = SPOTLIGHT MODE: top crew credited + clipped', 'Bits: 100 🚓 · 300 💬 · 500 🌧️ · 1000 🚨 · type !support', 'Games pop up on the left · type !games', 'Neon Cash = your XP · climb 6 star ranks · type !rank'];
  let lastTicker = 0, tipIdx = 0;
  setInterval(() => { if (Date.now() - lastTicker > 20000 && !alertBusy) { const el = $('[data-ticker]'); el.textContent = `💡 ${TIPS[tipIdx++ % TIPS.length]}`; el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); $('.ticker .tag').textContent = 'How to'; } }, 12000);
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

  function voteStart(options, title = '🗳️ Crew vote · !1 !2 !3') {
    $('[data-vote] .k').textContent = title;
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
    // Heat ladder v2 markers from the engine (the engine is the source of truth for unlocks)
    else if (text.startsWith('🌡️ ★3')) { stars = Math.max(stars, 3); paintHeat(); alert('medium', '★3 unlocked', 'DOUBLE NEON CASH', 'Every message pays twice for 3 minutes'); }
    else if (text.startsWith('🔮 ★4')) { stars = Math.max(stars, 4); paintHeat(); alert('medium', '★4 unlocked', 'HEAT BET IS LIVE', 'Bet channel points: does chat hit ★6?'); }
    else if (text.startsWith('🔦 SPOTLIGHT')) {
      stars = 6; paintHeat();
      const crew = (text.match(/Crew that lit it up: (.+?)\./) || [])[1] || 'the whole chat';
      alert('full', '★6 · Spotlight mode', 'SPOTLIGHT', `Lit up by ${crew}`, 6000);
      fxBurst(960, 540, 70); fxRain(30, ['⭐', '🔥', '💜', '🌴']); setTimeout(() => { boost = 0; }, 6000);
      ST.spot++; ST.heat = 6; paintStats(true);
    }
    else if (text.startsWith('📸')) alert('toast', 'Crew photo', 'Photo-mode shot for the Spotlight crew 📸', '', 5000);
    else if ((m = text.match(/^💀 Death #(\d+)/))) { ST.deaths = Number(m[1]); paintStats(true); }
    else if ((m = text.match(/^💥 Crash #(\d+)/))) { ST.crashes = Number(m[1]); paintStats(true); }
    else if ((m = text.match(/^🎨 THEME ([\w-]+) ·/))) { applyTheme(m[1]); alert('small', 'Vibe picked by chat', m[1].replace(/-/g, ' ').toUpperCase(), 'New overlay vibe'); }
    else if ((m = text.match(/^🚓 (\S+) ·/))) fxSiren();
    else if ((m = text.match(/^💬 (\S+): (.+)$/))) fxBubble(m[1], m[2]);
    else if ((m = text.match(/^🌧️ (\S+) ·/))) fxRain();
    else if ((m = text.match(/^🚨 WANTED (\S+) ·/))) fxPoster(m[1]);
    else if (/^🎯 SUB GOAL COMPLETE/.test(text)) { alert('full', 'Sub goal complete', 'GOAL!', text.replace(/^.*Unlocked: /, '').replace(/\. The crew.*$/, ''), 6000); fxBurst(960, 540, 80); }
    // Games v2
    else if ((m = text.match(/^🎱 BINGO (\S+) ·/))) { alert('medium', 'Launch Bingo', `BINGO · ${m[1]}`, '3 in a row · Neon Cash payout'); fxBurst(960, 600, 50, ['#ffd25e', '#ff2e88', '#19e3ff']); chime(); }
    else if ((m = text.match(/^🎱 Bingo square: "(.+?)"/))) alert('toast', 'Bingo square', `✅ ${m[1]} · type !bingo`, '', 3500);
    else if (/^🏁 MISSION BET is live/.test(text)) alert('small', 'Mission bet', 'Bet your channel points', 'Done in under 10 minutes?');
    else if ((m = text.match(/^🏁 Mission done in ([\d.]+) minutes: (YES|NO)/))) alert('small', 'Mission bet settled', `${m[2]} wins`, `${m[1]} minutes`);
    else if ((m = text.match(/^🎲 (DEATHS|CRASHES) POOL: final count (\d+)\. Winners?: (.+)$/))) alert('medium', `${m[1].toLowerCase()} pool · ${m[2]}`, m[3].split(' (')[0], 'closest guess takes the pot');
    else if ((m = text.match(/^🏆 Quote of the stream: "(.+?)"/))) alert('medium', 'Quote of the stream', `“${m[1].slice(0, 60)}”`, 'Into the Hall of Fame');
    // channel-point rewards (show-only)
    else if ((m = text.match(/^🚗 (\S+) named the ride: "(.+?)"/))) alert('small', `Ride named by ${m[1]}`, `🚗 ${m[2]}`, 'just for fun');
    else if ((m = text.match(/^💧 (\S+) says hydrate/))) alert('toast', 'Pit stop', `💧 ${m[1]}: hydrate!`, '', 3500);
    else if ((m = text.match(/^🪑 Posture check from (\S+)/))) alert('toast', 'Posture check', `🪑 from ${m[1]}`, '', 3500);
    else if ((m = text.match(/^🕒 (\S+) clocked in/))) alert('toast', 'Clocked in', `🕒 ${m[1]}`, '', 2500);
    else if ((m = text.match(/^🎟️ (\S+) redeemed (.+?)(?::|$)/))) alert('toast', 'Channel points', `🎟️ ${m[1]} · ${m[2].slice(0, 40)}`, '', 3500);
    if ((m = text.match(/^🎨 ★5 · VIBE VOTE \(\d+s\): (.+?)\. Chat picks/))) { stars = Math.max(stars, 5); paintHeat(); voteStart(m[1].split(' · ').map((s) => s.replace(/^!\d\s*/, '')), '🎨 Vibe vote · !1 !2 !3'); }
    if (/^🎨 (THEME|Nobody voted)/.test(text)) voteEnd();
    if ((m = text.match(/CHOPPER SIEGE! .*?with (\d+) HP/))) siegeStart(Number(m[1]));
    if (/CHOPPER DOWN!/.test(text)) { siegeEnd(); alert('full', 'Chopper down', 'BOOM', 'The crew shot it down', 4500); }
    if (/The chopper escaped/.test(text)) siegeEnd();
    // Crew Vote (non-binding fun question) — older "CHAOS VOTE" messages still parse
    if ((m = text.match(/(?:CHAOS|CREW) VOTE \(\d+s\): (?:(.+?) — )?(.+?)\. (?:Just for fun|Cheer)/))) voteStart(m[2].split(' · ').map((s) => s.replace(/^!\d\s*/, '')), `🗳️ ${m[1] || 'Crew vote'} · !1 !2 !3`);
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
    addHeat(name, 1 + (hype(text) ? 1 : 0) + Math.round(Number(t.bits || 0) / 10));
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
      boost += 1; siegeDamage(GAME.subDamage); addHeat(name, 50); fxBurst(960, 620, 50); chime();
    }
    if (kind === 'submysterygift' || kind === 'subgift') {
      const n = Number(t['msg-param-mass-gift-count'] || 1);
      if (kind === 'submysterygift' || !t['msg-param-origin-id']) alert('medium', `${n} gift sub${n > 1 ? 's' : ''}`, name, 'Absolute legend');
      boost += 1;
      // A gift bomb arrives as one submysterygift plus one subgift per recipient (tagged with origin-id): count it once.
      if (kind === 'submysterygift') { siegeDamage(GAME.subDamage * n); addHeat(name, 50 * n); if (n >= 5) fxRain(Math.min(60, 12 * n), ['💸', '💵', '💰', '💎']); else fxBurst(960, 620, 40); }
      else if (!t['msg-param-origin-id']) { siegeDamage(GAME.subDamage); addHeat(name, 50); }
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
  // COGAM_PLAYGROUND: no live Twitch connection; the page feeds simulated chat/bot/event lines through window.cogamSim
  const PLAYGROUND = Boolean(window.COGAM_PLAYGROUND);
  if (!PLAYGROUND) connect();

  // ---------------- slow data: goal + Top Crew ----------------
  async function loadData() {
    try {
      const d = window.COGAM_DATA || await (await fetch(`${DATA_URL}?t=${Math.floor(Date.now() / 60000)}`, { cache: 'no-store' })).json();
      if (d.goal) {
        $('[data-goal-label]').textContent = d.goal.label || 'Follower goal';
        $('[data-goal-now]').textContent = d.goal.current; $('[data-goal-target]').textContent = d.goal.target;
        $('[data-goal-bar]').style.width = `${Math.min(100, d.goal.current / d.goal.target * 100)}%`;
      }
      if (d.subGoal && d.subGoal.target) {
        show($('[data-subgoal]'));
        $('[data-sg-now]').textContent = d.subGoal.current; $('[data-sg-target]').textContent = d.subGoal.target;
        $('[data-sg-bar]').style.width = `${Math.min(100, d.subGoal.current / d.subGoal.target * 100)}%`;
        $('[data-sg-reward]').textContent = `→ ${d.subGoal.reward}`;
      }
      placeGames();
      ST.live = Boolean(d.live && d.stats);
      if (d.stats) {
        const started = d.stats.startedAt ? Date.parse(d.stats.startedAt) : ST.startedAt;
        if (started && ST.startedAt && started !== ST.startedAt) Object.assign(ST, { deaths: 0, crashes: 0, heat: 0, spot: 0 });   // new stream
        ST.startedAt = started;
        ST.deaths = Math.max(ST.deaths, d.stats.deaths || 0); ST.crashes = Math.max(ST.crashes, d.stats.crashes || 0);
        ST.heat = Math.max(ST.heat, d.stats.heatRecord || 0); ST.spot = Math.max(ST.spot, d.stats.spotlights || 0);
      }
      paintStats(false);
      if (Array.isArray(d.emotes) && d.emotes.length) EMOTES = d.emotes;
      if (Array.isArray(d.tips) && d.tips.length) TIPS = d.tips;
      if (Array.isArray(d.top)) $('[data-lb]').innerHTML = d.top.length
        ? d.top.map((v, i) => `<li><span class="p">${i + 1}</span><span>${esc(v.name)}</span><span class="r">${esc(v.rank.split(' ')[0])}</span></li>`).join('')
        : '<li><span class="p">–</span><span>Chat to join the crew</span><span class="r"></span></li>';
    } catch { /* keep the last good data */ }
  }
  loadData(); setInterval(loadData, 60000);
  if (PLAYGROUND) window.cogamSim = { line: onLine, reloadData: loadData, stars: () => stars };

  // ---------------- demo ----------------
  if (DEMO) {
    const say = (s, d) => setTimeout(() => onLine(`@display-name=CogamCrew :thecogam!thecogam@thecogam.tmi.twitch.tv PRIVMSG #${CHANNEL} :${BOT} ${s}`), d);
    const chat = (n, s, d, extra = '') => setTimeout(() => onLine(`@display-name=${n};color=#ff8fc4${extra} :${n.toLowerCase()}!x@x.tmi.twitch.tv PRIVMSG #${CHANNEL} :${s}`), d);
    Object.assign(ST, { startedAt: Date.now() - 3_725_000, deaths: 3, crashes: 1, heat: 4, spot: 0 }); paintStats(false);
    say('💀 Death #4. Gravity wins again.', 18000);
    ['NO WAY', 'lets go', 'that jump was insane', 'W', 'clip it'].forEach((s, i) => chat(`viewer${i}`, s, 800 + i * 500));
    say('➕ nightrider_77 · New follower: nightrider_77! That\'s one more witness to the driving.', 3000);
    say('🚁 CHOPPER SIEGE! A police chopper is circling with 2000 HP. Type !hit to shoot it down, cheers and subs deal massive damage. 3 minutes!', 7000);
    chat('turbo_tara', 'cheer500 eat this', 9000, ';bits=500');
    [1, 2, 3, 4].forEach((i) => chat(`hitter${i}`, '!hit', 9500 + i * 300));
    say('⭐ vicekid → 3-Star Wanted · vicekid climbed to 3-Star Wanted. Keep chatting, legend.', 12000);
    say('🗳️ CREW VOTE (60s): Nickname for the current ride? — !1 Neon Bullet · !2 Grandma’s Rocket · !3 Vice Bandit. Just for fun, nobody’s forced! Cheer 10 bits for an extra vote, subs count double!', 15000);
    [['a', '!1'], ['b', '!2'], ['c', '!2'], ['d', '!3']].forEach(([u, v], i) => chat(`voter_${u}`, v, 16000 + i * 400, i === 1 ? ';badges=subscriber/1' : ''));
    say('🌡️ ★3 · DOUBLE NEON CASH for 3 minutes! Every chat message pays twice. Next: ★4 Heat Bet', 21000);
    say('🚓 turbo_tara · sirens on for turbo_tara!', 22500);
    say('💬 nightrider_77: first time catching the stream, this overlay is insane', 24000);
    say('🚨 WANTED vicekid · Most Wanted poster for vicekid! 1000 bits of pure chaos 🙌', 26000);
    say('🔦 SPOTLIGHT MODE · ★6 reached! Crew that lit it up: turbo_tara, vicekid, nightrider_77. Double XP for 90s, clip incoming!', 32000);
    if (window.COGAM_DEMO_THEME) say(`🎨 THEME ${window.COGAM_DEMO_THEME} · Chat picked it!`, 1500);
  }
})();
