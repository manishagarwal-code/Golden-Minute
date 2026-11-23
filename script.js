const $ = s => document.querySelector(s);
const fmt = s => Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");

/* ---------- metronome (110 beats per minute, within the 100–120 CPR range) ---------- */
let actx;
function click(){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.frequency.value = 880; g.gain.setValueAtTime(.3,t); g.gain.exponentialRampToValueAtTime(.001,t+.08);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+.09);
  }catch(e){}
}
function metronome(onBeat){
  let timer=null, n=0;
  return {
    get on(){ return timer!==null },
    start(){ n=0; timer=setInterval(()=>{ n++; click(); onBeat(n); }, 60000/110); },
    stop(){ clearInterval(timer); timer=null; }
  };
}
function flash(el){ if(!el) return; el.classList.remove("beat"); void el.offsetWidth; el.classList.add("beat"); }

/* large metronome in the CPR section */
const big = metronome(n=>{ flash($("#ring")); $("#bigCount").textContent=n; $("#bigTime").textContent=fmt(Math.round(n*60/110)); });
$("#bigBtn").addEventListener("click",()=>{
  if(big.on){ big.stop(); $("#bigBtn").textContent="Start 110 beats per minute"; }
  else { big.start(); $("#bigBtn").textContent="Stop"; }
});

/* ---------- SOS demo ---------- */
const screen = $("#screen");
const responders = [
  {n:"Dr. Meera Iyer", r:"Cardiologist", d:"400 m", eta:170},
  {n:"Rahul Verma",    r:"Paramedic",    d:"650 m", eta:290},
  {n:"Sunita Nair",    r:"Staff nurse",  d:"900 m", eta:410}
];
let kind="cardiac", tick=null, alertTimer=null, small=null;

function reset(){
  clearInterval(tick); clearTimeout(alertTimer); if(small&&small.on) small.stop();
  screen.innerHTML = `
    <div><h4>What is happening?</h4><p class="muted">Sector 21, Dwarka (sample location)</p></div>
    <div class="chips" role="group" aria-label="Emergency type">
      <button class="chip" data-k="cardiac" aria-pressed="${kind==="cardiac"}">Not breathing</button>
      <button class="chip" data-k="bleeding" aria-pressed="${kind==="bleeding"}">Heavy bleeding</button>
    </div>
    <div class="sosbox">
      <button class="sos" id="sos" aria-label="Send SOS. Hold for one second.">
        <svg viewBox="0 0 214 214"><circle cx="107" cy="107" r="107"/></svg>SOS
      </button>
      <p class="muted">Hold for one second to send</p>
    </div>
    <p class="muted" style="text-align:center">Call 112 as well. This alerts trained people nearby.</p>`;
  screen.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
    kind=c.dataset.k;
    screen.querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed",x===c));
  });
  const sos=$("#sos"); let hold=null;
  sos.addEventListener("pointerdown",e=>{ sos.classList.add("holding"); hold=setTimeout(send,1200); });
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>sos.addEventListener(ev,()=>{ sos.classList.remove("holding"); clearTimeout(hold); }));
  sos.addEventListener("click",e=>{ if(e.detail===0) send(); }); /* keyboard activation */
}

function send(){
  screen.innerHTML = `
    <div><h4>Alert sent</h4><p class="muted">Looking for verified responders within 1.5 km</p></div>
    <div class="sosbox"><span class="pulse"></span><p>14 responders notified</p></div>`;
  alertTimer=setTimeout(accepted,2200);
}

function accepted(){
  const r=responders[0]; let eta=r.eta, amb=18*60, arrived=false;
  const guide = kind==="cardiac"
    ? `<p class="who">Start compressions now</p>
       <div class="mini" style="margin:10px 0"><div class="dot" id="sdot"></div><p class="muted">Push centre of chest to the beat. <span id="scount">0</span> so far.</p></div>
       <button class="sbtn" id="sbtn">Start beat</button>`
    : `<p class="who">Stop the bleeding</p>
       <ul class="plain"><li>Press a clean cloth firmly on the wound.</li><li>Don’t lift it if it soaks through; add more cloth.</li><li>Raise the injured limb if you can.</li></ul>`;
  screen.innerHTML = `
    <div><h4>${r.n} is on the way</h4><p class="muted">${r.r}, ${r.d} away · accepted</p></div>
    <div class="card row"><div><p class="muted">Responder arrives in</p><p class="time" id="eta">${fmt(eta)}</p></div><span class="tag">Verified</span></div>
    <div class="card row"><div><p class="muted">Ambulance arrives in</p><p class="time" id="amb">${fmt(amb)}</p></div></div>
    <div class="card">${guide}</div>
    <button class="linkbtn" id="again">Reset demo</button>`;
  $("#again").onclick=reset;
  if(kind==="cardiac"){
    small=metronome(n=>{ flash($("#sdot")); $("#scount").textContent=n; });
    $("#sbtn").onclick=()=>{ if(small.on){small.stop();$("#sbtn").textContent="Start beat";}else{small.start();$("#sbtn").textContent="Pause beat";} };
  }
  tick=setInterval(()=>{
    amb--; if(!arrived){ eta--; }
    if(eta<=0 && !arrived){ arrived=true; $("#eta").textContent="Arrived"; }
    else if(!arrived){ $("#eta").textContent=fmt(eta); }
    $("#amb").textContent=fmt(amb);
  },1000);
}
reset();

/* ---------- join form (demo only, nothing is sent) ---------- */
$("#joinForm").addEventListener("submit",e=>{ e.preventDefault(); $("#joined").hidden=false; e.target.reset(); });
