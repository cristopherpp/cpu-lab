
const ICONS = {
  play: '<path d="m8 5 12 7-12 7V5Z"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  back: '<path d="m12 19-7-7 7-7M19 19l-7-7 7-7"/>',
  step: '<path d="m9 18 6-6-6-6M19 5v14"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  settings: '<path d="M4 7h16M4 17h16M9 4v6m6 4v6"/>',
  layers: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  max: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  bolt: '<path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sliders: '<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/>',
  spark: '<path d="m12 2 2.3 6.7L21 11l-6.7 2.3L12 20l-2.3-6.7L3 11l6.7-2.3L12 2Zm6 16 1 2 2 1-2 1"/>',
};
const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const COLOR = ['#b8ef74', '#8a9cff', '#ffc477', '#f28cae', '#62d8db', '#c5a0f8'];
const ALGOS = [
  { id:'fifo', num:'01', short:'FIFO', name:'First In, First Out', tag:'NO APROPIATIVO', rule:'El primero que llega, ejecuta primero.', win:'Simplicidad y orden', risk:'Efecto convoy', need:'Cola FIFO', note:'Un proceso largo hace esperar a los cortos.' },
  { id:'sjf', num:'02', short:'SJF', name:'Shortest Job First', tag:'NO APROPIATIVO', rule:'Entre los listos, elige la ráfaga más corta.', win:'Menor espera media*', risk:'Inanición', need:'Estimar ráfagas', note:'No interrumpe al que ya está ejecutándose.' },
  { id:'srtf', num:'03', short:'SRTF', name:'Shortest Remaining Time First', tag:'APROPIATIVO', rule:'Siempre ejecuta el de menor tiempo restante.', win:'Respuesta a trabajos cortos', risk:'Inanición y cambios', need:'Tiempo restante', note:'Uno nuevo puede interrumpir al actual.' },
  { id:'rr', num:'04', short:'Round Robin', name:'Turnos de CPU', tag:'APROPIATIVO', rule:'Cada proceso recibe hasta un quantum por turno.', win:'Equidad y respuesta', risk:'Costo de cambios', need:'Temporizador + quantum', note:'Al agotar el quantum, vuelve a la cola.' },
  { id:'priority', num:'05', short:'Prioridades', name:'Priority Scheduling', tag:'CONFIGURABLE', rule:'Ejecuta primero el de mayor prioridad.', win:'Atender tareas críticas', risk:'Inanición / inversión', need:'Prioridades + aging', note:'Prioridad 1 es la más alta en esta simulación.' },
];

const PRESETS = {
  staggered: { label:'Llegadas escalonadas', processes:[
    {arrival:0,burst:8,priority:3}, {arrival:1,burst:4,priority:1}, {arrival:2,burst:2,priority:2}, {arrival:3,burst:1,priority:4}
  ]},
  together: { label:'Todos al inicio', processes:[
    {arrival:0,burst:8,priority:4}, {arrival:0,burst:4,priority:2}, {arrival:0,burst:2,priority:1}, {arrival:0,burst:6,priority:3}
  ]},
  interruptions: { label:'Interrupciones', processes:[
    {arrival:0,burst:10,priority:4}, {arrival:2,burst:5,priority:2}, {arrival:3,burst:2,priority:1}, {arrival:6,burst:3,priority:3}
  ]},
  convoy: { label:'Efecto convoy', processes:[
    {arrival:0,burst:12,priority:4}, {arrival:1,burst:2,priority:1}, {arrival:2,burst:1,priority:2}, {arrival:3,burst:1,priority:3}
  ]},
};

const makeProcesses = rows => rows.map((p,i)=>({id:`P${i+1}`,name:`P${i+1}`,arrival:p.arrival,burst:p.burst,priority:p.priority,color:COLOR[i]}));
const state = { algorithm:'fifo', preset:'staggered', processes:makeProcesses(PRESETS.staggered.processes), quantum:2, priorityPreemptive:true, speed:1, playing:false, timer:null, frame:0, frames:[], modal:null };

function schedule(processes, algorithm, quantum, priorityPreemptive) {
  const ps = processes.map((p,index)=>({ ...p,index,remaining:p.burst,first:null,finish:null }));
  const byId = new Map(ps.map(p=>[p.id,p]));
  let time=0, running=null, quantumUsed=0;
  const ready=[], history=[], frames=[];
  const total = ps.reduce((s,p)=>s+p.burst,0);
  const maxArr = Math.max(...ps.map(p=>p.arrival));
  const score = p => algorithm==='sjf' ? p.burst : algorithm==='srtf' ? p.remaining : p.priority;
  const sortedReady = () => algorithm==='fifo'||algorithm==='rr'
    ? [...ready] : [...ready].sort((a,b)=>score(byId.get(a))-score(byId.get(b)));
  let guard=0;
  while (guard++ < total+maxArr+4) {
    for (const p of ps) if (p.arrival===time) ready.push(p.id);
    if (algorithm==='rr' && running && quantumUsed>=quantum) {
      ready.push(running); running=null; quantumUsed=0;
    }
    if (running && algorithm==='srtf') {
      const better=ready.some(id=>byId.get(id).remaining<byId.get(running).remaining);
      if (better) {ready.push(running); running=null;quantumUsed=0;}
    }
    if (running && algorithm==='priority' && priorityPreemptive) {
      const better=ready.some(id=>byId.get(id).priority<byId.get(running).priority);
      if (better) {ready.push(running); running=null;quantumUsed=0;}
    }
    if (!running && ready.length) {
      const next=sortedReady()[0];
      ready.splice(ready.indexOf(next),1);
      running=next;
      quantumUsed=0;
    }
    const done=ps.every(p=>p.remaining===0);
    const statuses=ps.map(p=>({
      id:p.id,name:p.name,arrival:p.arrival,burst:p.burst,priority:p.priority,color:p.color,
      remaining:p.remaining,first:p.first,finish:p.finish,
      status:p.remaining===0?'done':p.id===running?'running':p.arrival>time?'future':'ready'
    }));
    const finished=statuses.filter(p=>p.status==='done').sort((a,b)=>a.finish-b.finish);
    const metrics = finished.length ? {
      wait:finished.reduce((s,p)=>s+p.finish-p.arrival-p.burst,0)/finished.length,
      turnaround:finished.reduce((s,p)=>s+p.finish-p.arrival,0)/finished.length,
      response:finished.reduce((s,p)=>s+p.first-p.arrival,0)/finished.length,
    } : {wait:null,turnaround:null,response:null};
    let switches=0;
    for(let k=1;k<history.length;k++) if(history[k]!==history[k-1] && history[k]!==null && history[k-1]!==null) switches++;
    frames.push({ time, running, ready:sortedReady(), finished:finished.map(p=>p.id), future:statuses.filter(p=>p.status==='future').sort((a,b)=>a.arrival-b.arrival||a.id.localeCompare(b.id)).map(p=>p.id), processes:statuses, history:[...history], done, metrics, switches });
    if(done) break;
    if(running) {
      const p=byId.get(running);
      if (p.first===null) p.first=time;
      p.remaining--;
      history.push(running);
      quantumUsed++;
      if(p.remaining===0){ p.finish=time+1;running=null;quantumUsed=0; }
    } else history.push(null);
    time++;
  }
  if (!frames.at(-1)?.done) throw Error('No se pudo completar la simulación');
  return frames;
}

const $ = s=>document.querySelector(s);
const fmt = n=>n===null ? '—' : Number.isInteger(n)? String(n) : n.toFixed(1);
const proc = (frame,id)=>frame.processes.find(p=>p.id===id);
const pct = (x)=>`${Math.round(x*100)}%`;

function init() {
  $('#app').innerHTML = `
  <div class="site-shell">
    <header class="topbar">
      <div class="brand"><div class="brand-glyph">▤</div><span>CPU<span class="brand-light">LAB</span></span><span class="brand-tag">/ VISUAL SIMULATOR</span></div>
      <div class="top-actions">
        <span class="header-label"><span class="online-dot"></span> SIMULACIÓN LOCAL</span>
        <button class="text-button" id="helpBtn" aria-label="Atajos del teclado">${icon('keyboard',16)} <span>Atajos</span></button>
        <button class="text-button" id="fullscreenBtn" title="Pantalla completa (F)">${icon('max',16)} <span>Presentar</span></button>
      </div>
    </header>
    <div class="workspace">
      <aside class="sidebar">
        <div class="side-kicker">ALGORITMOS <span>05</span></div>
        <nav id="algorithmNav" class="algo-nav" aria-label="Algoritmos de planificación"></nav>
        <div class="side-bottom">
          <div class="side-muted">SISTEMAS OPERATIVOS</div>
          <div class="side-version">Planificación de CPU <span>v1.0</span></div>
        </div>
      </aside>
      <main class="main-panel">
        <div class="heading-area">
          <div class="heading-upper"><span class="section-kicker">EXPERIMENTO <span id="experimentNo">01</span> / 05</span><span id="algoMode" class="type-badge">NO APROPIATIVO</span></div>
          <div class="heading-row"><div><h1 id="algoTitle">FIFO <span class="title-dim">/ FCFS</span></h1><p class="hero-subtitle" id="algoRule">El primero que llega, ejecuta primero.</p></div>
          <div class="heading-buttons"><button id="guideBtn" class="outline-btn">${icon('info',17)} <span>Idea clave</span></button><button id="compareBtn" class="outline-btn compare-btn">${icon('layers',17)} <span>Comparar</span></button></div></div>
        </div>
        <section class="control-strip" aria-label="Controles de la simulación">
          <div class="transport"><button class="round-btn reset-btn" id="resetBtn" title="Reiniciar (R)">${icon('rotate',19)}</button><button class="round-btn" id="prevBtn" title="Retroceder (←)">${icon('back',19)}</button><button class="play-btn" id="playBtn" title="Reproducir / pausar (Espacio)">${icon('play',19)}<span>Reproducir</span></button><button class="round-btn" id="nextBtn" title="Avanzar (→)">${icon('step',19)}</button></div>
          <div class="control-divider"></div>
          <div class="speed-control"><span>VELOCIDAD</span><div class="speed-buttons" id="speedButtons"><button data-speed="0.5">0.5×</button><button data-speed="1">1×</button><button data-speed="2">2×</button></div></div>
          <div class="control-spacer"></div>
          <span class="clock-label">TIEMPO</span><div class="time-counter" id="timeCounter">00<span> u.t.</span></div>
        </section>
        <div class="stage-grid">
          <section class="simulation-card panel">
            <div class="panel-head"><div><span class="eyebrow">ESTADO DEL SISTEMA</span><h2>Dentro del procesador</h2></div><div class="live-state" id="liveBadge"><i></i> EN ESPERA</div></div>
            <div class="future-section"><div class="small-heading">PRÓXIMAS LLEGADAS <span id="futureCount">0</span></div><div class="future-list" id="futureList"></div></div>
            <div class="pipeline">
              <div class="queue-column"><div class="small-heading">COLA DE LISTOS <span id="readyCount">0</span></div><div class="queue-list" id="readyList"></div><div class="queue-footnote">ESPERANDO CPU</div></div>
              <div class="pipeline-arrow">${icon('arrow',23)}</div>
              <div class="cpu-column"><div class="small-heading centered">CPU <span>01 NÚCLEO</span></div><div class="cpu-illustration"><div class="cpu-glow"></div><svg class="cpu-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="83" class="ring-track"/><circle id="cpuProgress" cx="100" cy="100" r="83" class="ring-progress"/></svg><div id="cpuInner" class="cpu-inner"></div></div><div id="cpuFootnote" class="cpu-footnote">DISPONIBLE</div></div>
              <div class="pipeline-arrow">${icon('arrow',23)}</div>
              <div class="finished-column"><div class="small-heading">TERMINADOS <span id="doneCount">0</span></div><div id="doneList" class="finished-list"></div><div class="queue-footnote">PROCESADOS</div></div>
            </div>
            <div class="decision-strip"><span class="decision-led">${icon('bolt',15)} REGLA ACTIVA</span><span id="decisionText">Orden de llegada</span></div>
          </section>
          <section class="settings-card panel">
            <div class="panel-head"><div><span class="eyebrow">CONFIGURACIÓN</span><h2>Experimento</h2></div>${icon('sliders',19)}</div>
            <label class="control-label" for="presetSelect">ESCENARIO</label><div class="select-wrap"><select id="presetSelect">${Object.entries(PRESETS).map(([k,p])=>`<option value="${k}">${p.label}</option>`).join('')}<option value="custom">Personalizado</option></select>${icon('chevron',16)}</div>
            <div class="scenario-visual"><div id="scenarioRows"></div></div>
            <button id="editBtn" class="edit-btn">${icon('settings',16)} Editar procesos ${icon('arrow',16)}</button>
            <div id="algorithmSettings"></div>
            <div class="settings-separator"></div>
            <div class="insight-mini"><span class="eyebrow">OBSERVA</span><p id="observeText">Un proceso largo retrasa a los demás.</p></div>
          </section>
        </div>
        <section class="timeline-panel panel">
          <div class="timeline-heading"><div><span class="eyebrow">HISTORIAL DE EJECUCIÓN</span><h2>Diagrama de Gantt <span class="mini-link">· pulsa un bloque para ir a ese instante</span></h2></div><div class="timeline-legend" id="legend"></div></div>
          <div class="timeline-scroll" id="timelineScroll"><div id="timeline" class="timeline-content"></div></div>
          <div class="timeline-footer"><span>INICIO <b>00</b></span><input type="range" id="timeScrubber" min="0" max="15" value="0" aria-label="Instante de la simulación" /><span>FIN <b id="timelineEnd">15</b></span></div>
        </section>
        <section class="metrics-row"><div class="metric"><span>FINALIZADOS</span><strong id="metricCompleted">0/4</strong><small>procesos</small></div><div class="metric"><span>ESPERA MEDIA</span><strong id="metricWait">—</strong><small>unidades de tiempo*</small></div><div class="metric"><span>RETORNO MEDIO</span><strong id="metricTurnaround">—</strong><small>unidades de tiempo*</small></div><div class="metric"><span>CAMBIOS</span><strong id="metricSwitches">0</strong><small>de proceso</small></div><p class="metrics-note">* Media de procesos completados. Se ignora el coste de cambio de contexto.</p></section>
      </main>
    </div>
  </div><div id="modalRoot"></div>`;
  bind(); refreshSchedule();
}

function bind() {
  $('#algorithmNav').addEventListener('click',e=>{const b=e.target.closest('[data-algo]');if(b) selectAlgorithm(b.dataset.algo);});
  $('#playBtn').addEventListener('click',togglePlay);
  $('#prevBtn').addEventListener('click',()=>seek(state.frame-1));
  $('#nextBtn').addEventListener('click',()=>seek(state.frame+1));
  $('#resetBtn').addEventListener('click',()=>seek(0));
  $('#timeScrubber').addEventListener('input',e=>seek(Number(e.target.value)));
  $('#speedButtons').addEventListener('click',e=>{const b=e.target.closest('[data-speed]');if(b){state.speed=Number(b.dataset.speed);if(state.playing){stop();start();}renderControls();}});
  $('#presetSelect').addEventListener('change',e=>{const key=e.target.value;if(PRESETS[key]){state.preset=key;state.processes=makeProcesses(PRESETS[key].processes);refreshSchedule();}});
  $('#editBtn').addEventListener('click',()=>showModal('edit'));
  $('#compareBtn').addEventListener('click',()=>showModal('compare'));
  $('#guideBtn').addEventListener('click',()=>showModal('guide'));
  $('#helpBtn').addEventListener('click',()=>showModal('help'));
  $('#fullscreenBtn').addEventListener('click',()=>{
    if(document.fullscreenElement) document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();
  });
  $('#timeline').addEventListener('click',e=>{const t=e.target.closest('[data-tick]');if(t) seek(Number(t.dataset.tick));});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&state.modal){closeModal();return;}
    if(state.modal||e.target.matches('input,select,textarea')||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.code==='Space'){e.preventDefault();togglePlay();}
    else if(e.key==='ArrowRight'){e.preventDefault();seek(state.frame+1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();seek(state.frame-1);}
    else if(e.key.toLowerCase()==='r'){seek(0);}
    else if(e.key.toLowerCase()==='f'){$('#fullscreenBtn').click();}
    else if('12345'.includes(e.key)) selectAlgorithm(ALGOS[Number(e.key)-1].id);
  });
  $('#modalRoot').addEventListener('click',e=>{if(e.target.matches('.modal-backdrop')||e.target.closest('[data-dismiss]'))closeModal();});
}

function selectAlgorithm(id){if(!ALGOS.some(a=>a.id===id))return;state.algorithm=id;refreshSchedule();}
function stop(){state.playing=false;if(state.timer!==null){clearInterval(state.timer);state.timer=null;}renderControls();}
function start(){if(state.frame>=state.frames.length-1)state.frame=0;state.playing=true;renderControls();state.timer=setInterval(()=>{if(state.frame>=state.frames.length-1){stop();return;}state.frame++;renderFrame();if(state.frame===state.frames.length-1)stop();},Math.round(850/state.speed));}
function togglePlay(){state.playing?stop():start();}
function seek(t){stop();state.frame=Math.max(0,Math.min(state.frames.length-1,t));renderFrame();}
function refreshSchedule(){stop();state.frame=0;state.frames=schedule(state.processes,state.algorithm,state.quantum,state.priorityPreemptive);renderAlgorithm();renderScenario();renderFrame();}

function renderAlgorithm(){
  const a=ALGOS.find(a=>a.id===state.algorithm);
  $('#algorithmNav').innerHTML=ALGOS.map(x=>`<button class="algo-option ${x.id===state.algorithm?'selected':''}" data-algo="${x.id}" aria-current="${x.id===state.algorithm?'true':'false'}"><span class="algo-index">${x.num}</span><span class="algo-entry"><strong>${x.short}</strong><small>${x.name}</small></span><span class="algo-indicator">${icon('chevron',15)}</span></button>`).join('');
  $('#experimentNo').textContent=a.num;
  $('#algoMode').textContent=a.id==='priority'?(state.priorityPreemptive?'APROPIATIVO':'NO APROPIATIVO'):a.tag;
  $('#algoMode').className=`type-badge ${(a.id==='priority'?state.priorityPreemptive:a.id==='srtf'||a.id==='rr')?'is-preemptive':''}`;
  $('#algoTitle').innerHTML=a.id==='fifo'?'FIFO <span class="title-dim">/ FCFS</span>':a.id==='priority'?'Prioridades':a.id==='rr'?'Round Robin':a.short;
  $('#algoRule').textContent=a.rule;
  $('#decisionText').textContent=a.id==='fifo'?'Orden de llegada':a.id==='sjf'?'Menor ráfaga total':a.id==='srtf'?'Menor tiempo restante':a.id==='rr'?`Quantum de ${state.quantum} u.t.`:`Prioridad más alta = 1 · ${state.priorityPreemptive?'con interrupción':'sin interrupción'}`;
  $('#observeText').textContent=a.note;
  $('#algorithmSettings').innerHTML = a.id==='rr'?`<div class="special-setting"><div class="control-label setting-title">QUANTUM <span class="setting-value" id="quantumValue">${state.quantum} u.t.</span></div><input class="q-range" id="quantumRange" type="range" min="1" max="8" value="${state.quantum}" aria-label="Quantum Round Robin"/><div class="range-endpoints"><span>1</span><span>8</span></div></div>` : a.id==='priority'?`<div class="special-setting"><div class="control-label setting-title">MODO DE PLANIFICACIÓN</div><div class="mode-toggle"><button data-mode="preemptive" class="${state.priorityPreemptive?'on':''}">Apropiativo</button><button data-mode="non" class="${!state.priorityPreemptive?'on':''}">No apropiativo</button></div><small class="setting-hint">1 = máxima prioridad</small></div>`:'';
  $('#quantumRange')?.addEventListener('input',e=>{state.quantum=Number(e.target.value);$('#quantumValue').textContent=`${state.quantum} u.t.`;});
  $('#quantumRange')?.addEventListener('change',()=>refreshSchedule());
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{state.priorityPreemptive=el.dataset.mode==='preemptive';refreshSchedule();}));
}

function renderScenario(){
  $('#presetSelect').value=state.preset;
  $('#scenarioRows').innerHTML=`<div class="scenario-labels"><span>PROCESO</span><span>LLEGA</span><span>CPU</span><span>PRIO.</span></div>`+state.processes.map(p=>`<div class="scenario-row"><span class="process-id"><i style="background:${p.color}"></i>${p.id}</span><span>${p.arrival}</span><span>${p.burst}</span><span>${p.priority}</span></div>`).join('');
  $('#legend').innerHTML=state.processes.map(p=>`<span class="legend-item"><i style="background:${p.color}"></i>${p.id}</span>`).join('');
}

function processCard(p,small=false){
  const remaining=p.remaining;
  return `<div class="process-card ${small?'small':''}" style="--pc:${p.color}"><div class="process-main"><span class="process-dot"></span><strong>${p.name}</strong>${state.algorithm==='priority'?`<small class="queue-priority">↑ ${p.priority}</small>`:''}<span class="process-time">${remaining} <small>u.t.</small></span></div><div class="bar-bg"><div style="width:${pct((p.burst-remaining)/p.burst)};background:${p.color}"></div></div></div>`;
}
function describeDecision(frame){
  const now=frame.running?proc(frame,frame.running):null;
  const previous=frame.time>0?state.frames[frame.time-1]:null;
  if(frame.done)return 'Todos los procesos han terminado.';
  if(!now)return 'CPU en espera de nuevas llegadas.';
  if(!previous || !previous.running){
    if(state.algorithm==='sjf')return `${now.id} seleccionado · ráfaga ${now.burst} u.t.`;
    if(state.algorithm==='priority')return `${now.id} seleccionado · prioridad ${now.priority}`;
    return `${now.id} recibe la CPU.`;
  }
  if(previous.running===frame.running)return `${now.id} continúa · ${now.remaining} u.t. restantes.`;
  const before=proc(frame,previous.running);
  if(before.remaining>0){
    if(state.algorithm==='rr')return `Quantum agotado · turno de ${now.id}.`;
    if(state.algorithm==='srtf')return `${now.id} interrumpe a ${before.id} · menor tiempo restante.`;
    if(state.algorithm==='priority')return `${now.id} interrumpe a ${before.id} · prioridad ${now.priority}.`;
  }
  if(state.algorithm==='sjf')return `${now.id} seleccionado · ráfaga ${now.burst} u.t.`;
  if(state.algorithm==='priority')return `${now.id} seleccionado · prioridad ${now.priority}.`;
  return `${previous.running} finalizó · ahora ejecuta ${now.id}.`;
}

function renderFrame(){
  const frame=state.frames[state.frame];const t=frame.time;
  $('#timeCounter').innerHTML=String(t).padStart(2,'0')+'<span> u.t.</span>';
  $('#decisionText').textContent=describeDecision(frame);
  const previous=t>0?state.frames[t-1]:null;
  const changed=!!previous && previous.running!==frame.running;
  const stage=$('.pipeline');
  stage.classList.remove('just-switched');
  if(changed){void stage.offsetWidth; stage.classList.add('just-switched');}
  $('#readyCount').textContent=frame.ready.length;
  $('#futureCount').textContent=frame.future.length;
  $('#doneCount').textContent=frame.finished.length;
  $('#readyList').innerHTML=frame.ready.length?frame.ready.map(id=>processCard(proc(frame,id))).join(''):'<div class="empty-slot"><span>Sin procesos</span></div>';
  $('#futureList').innerHTML=frame.future.length?frame.future.map(id=>{const p=proc(frame,id);return `<span class="future-chip"><i style="background:${p.color}"></i><b>${p.id}</b><small>t = ${p.arrival}</small></span>`;}).join(''):`<span class="all-arrived">Todos han llegado ${icon('check',14)}</span>`;
  $('#doneList').innerHTML=frame.finished.length?frame.finished.map(id=>{const p=proc(frame,id);return `<div class="done-process" style="--pc:${p.color}"><span class="done-mark">${icon('check',13)}</span><strong>${p.id}</strong><small>t = ${p.finish}</small></div>`;}).join(''):'<div class="empty-slot done-empty"><span>Sin finalizar</span></div>';
  const current=frame.running?proc(frame,frame.running):null;
  $('#cpuInner').innerHTML=current?`<span class="cpu-status">EJECUTANDO</span><strong style="color:${current.color}">${current.id}</strong><small>${current.remaining} / ${current.burst} u.t.</small>`:`<span class="cpu-status">${frame.done?'COMPLETADO':'SIN ACTIVIDAD'}</span><strong class="idle-graphic">${frame.done?'✓':'—'}</strong><small>${frame.done?'TODOS LISTOS':'CPU LIBRE'}</small>`;
  $('#cpuProgress').style.stroke=current?current.color:'#aeb8c9';
  $('#cpuProgress').style.strokeDashoffset=String(2*Math.PI*83*(1-(current?(current.burst-current.remaining)/current.burst:frame.done?1:0)));
  $('.cpu-illustration').classList.toggle('is-active',!!current);
  $('#cpuFootnote').textContent=current?`${Math.round((current.burst-current.remaining)/current.burst*100)}% COMPLETADO`:frame.done?'EJECUCIÓN FINALIZADA':'ESPERANDO PROCESOS';
  $('#liveBadge').innerHTML=`<i></i> ${frame.done?'COMPLETADO':state.playing?'REPRODUCIENDO':current?'CPU OCUPADA':'CPU LIBRE'}`;
  $('#liveBadge').classList.toggle('live',!!current&&!frame.done);
  $('#metricCompleted').textContent=`${frame.finished.length}/${frame.processes.length}`;
  $('#metricWait').textContent=fmt(frame.metrics.wait);
  $('#metricTurnaround').textContent=fmt(frame.metrics.turnaround);
  $('#metricSwitches').textContent=frame.switches;
  $('#timeScrubber').max=state.frames.length-1;
  $('#timeScrubber').value=state.frame;
  $('#timeScrubber').style.setProperty('--scrub',`${state.frame/(state.frames.length-1)*100}%`);
  $('#timelineEnd').textContent=String(state.frames.length-1).padStart(2,'0');
  renderTimeline(frame);
  renderControls();
}

function renderTimeline(frame){
  const final=state.frames.at(-1).history;
  $('#timeline').innerHTML=`<div class="time-ticks">${final.map((_,i)=>`<span>${String(i).padStart(2,'0')}</span>`).join('')}<span>${String(final.length).padStart(2,'0')}</span></div><div class="gantt-cells">${final.map((id,i)=>{
    const p=state.processes.find(p=>p.id===id);
    return `<button data-tick="${i+1}" class="gantt-cell ${i<frame.time?'elapsed':'future-tick'} ${i===frame.time-1?'last-tick':''}" ${p&&i<frame.time?`style="--cell:${p.color}"`:''} title="Ir a t=${i+1}" aria-label="Ir a t=${i+1}"><span>${i<frame.time?(id||'·'):''}</span></button>`;
  }).join('')}</div>`;
  // Keep the playhead visible as the presentation advances.
  const scroller=$('#timelineScroll');
  if(frame.time*45>scroller.scrollLeft+scroller.clientWidth-100) scroller.scrollLeft=Math.max(0,frame.time*45-scroller.clientWidth+140);
  if(frame.time===0)scroller.scrollLeft=0;
}
function renderControls(){
  if(!$('#playBtn'))return;
  $('#playBtn').innerHTML=`${icon(state.playing?'pause':'play',19)}<span>${state.playing?'Pausar':'Reproducir'}</span>`;
  $('#prevBtn').disabled=state.frame<=0;
  $('#nextBtn').disabled=state.frame>=state.frames.length-1;
  document.querySelectorAll('[data-speed]').forEach(el=>el.classList.toggle('active',Number(el.dataset.speed)===state.speed));
  if(state.frames.length){
    const frame=state.frames[state.frame];const badge=$('#liveBadge');
    badge.innerHTML=`<i></i> ${frame.done?'COMPLETADO':state.playing?'REPRODUCIENDO':frame.running?'CPU OCUPADA':'CPU LIBRE'}`;
    badge.classList.toggle('live',!!frame.running&&!frame.done);
  }
}

function closeModal(){state.modal=null;$('#modalRoot').innerHTML='';}
function shellModal(title,body,wide=false){state.modal=title;$('#modalRoot').innerHTML=`<div class="modal-backdrop"><section class="modal-dialog ${wide?'modal-wide':''}" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="modal-head"><h2 id="dialogTitle">${title}</h2><button class="round-btn" data-dismiss aria-label="Cerrar">${icon('close',20)}</button></div><div class="modal-body">${body}</div></section></div>`;}
function showModal(type){
  stop();
  if(type==='guide'){
    const a=ALGOS.find(a=>a.id===state.algorithm);
    shellModal(`${a.short} · Idea clave`,`<div class="guide-headline">${a.rule}</div><div class="guide-grid"><div class="guide-box win"><span>VENTAJA</span><strong>${a.win}</strong></div><div class="guide-box risk"><span>DESVENTAJA</span><strong>${a.risk}</strong></div><div class="guide-box"><span>TIPO</span><strong>${a.id==='priority'?(state.priorityPreemptive?'Apropiativo':'No apropiativo'):a.tag.charAt(0)+a.tag.slice(1).toLowerCase()}</strong></div><div class="guide-box"><span>REQUISITO TÉCNICO</span><strong>${a.need}</strong></div></div><p class="guide-caveat">${a.id==='sjf'||a.id==='srtf'?'En sistemas reales, la ráfaga futura se estima; en esta demostración usamos la duración conocida.':a.id==='priority'?'Para evitar inanición se puede usar aging. Para inversión de prioridad, herencia de prioridad.':a.id==='rr'?'Un quantum pequeño implica más cambios de contexto; uno grande se parece a FIFO.':a.id==='fifo'?'La CPU no se retira a un proceso por la llegada de otro.':'Una nueva llegada puede provocar una interrupción.'}</p>`);
  } else if(type==='help'){
    shellModal('Atajos para exponer',`<div class="shortcut-grid">${[['Espacio','Reproducir / pausar'],['→','Avanzar 1 unidad'],['←','Retroceder 1 unidad'],['1–5','Cambiar de algoritmo'],['R','Reiniciar'],['F','Pantalla completa'],['Esc','Cerrar ventanas']].map(([k,v])=>`<div><kbd>${k}</kbd><span>${v}</span></div>`).join('')}</div>`);
  } else if(type==='compare'){
    const rows=ALGOS.map(a=>{const result=schedule(state.processes,a.id,state.quantum,state.priorityPreemptive);const f=result.at(-1);return {...a,frame:f};});
    const best=Math.min(...rows.map(r=>r.frame.metrics.wait));
    shellModal('Comparar algoritmos',`<p class="modal-lead">Mismos procesos · mismo escenario · menor espera = mejor en este ejemplo</p><div class="compare-head"><span>ALGORITMO</span><span>GANTT · EJECUCIÓN COMPLETA</span><span>ESPERA</span></div><div class="compare-list">${rows.map(r=>`<button class="compare-row ${r.frame.metrics.wait===best?'best':''}" data-choose="${r.id}"><div class="compare-name"><strong>${r.short}</strong><small>${r.id==='priority'?(state.priorityPreemptive?'Apropiativo':'No apropiativo'):r.tag.toLowerCase()}</small></div><div class="compare-segments">${r.frame.history.map(id=>{const p=state.processes.find(x=>x.id===id);return `<span style="background:${p?p.color:'#243044'}" title="${id||'Libre'}"></span>`;}).join('')}</div><strong class="compare-score">${fmt(r.frame.metrics.wait)}${r.frame.metrics.wait===best?` ${icon('spark',15)}`:''}</strong></button>`).join('')}</div><div class="modal-endnote">Los valores son específicos de este escenario. Los cambios de contexto no agregan tiempo extra.</div>`,true);
    document.querySelectorAll('[data-choose]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.choose;closeModal();selectAlgorithm(id);}));
  } else if(type==='edit'){
    const fields=`<div class="edit-header"><span>PROCESO</span><span>LLEGADA</span><span>CPU</span><span>PRIORIDAD</span><span></span></div><div id="editRows"></div><div class="editor-bottom"><button class="outline-btn" id="addProcess">${icon('plus',16)} Añadir proceso</button><span>Hasta 6 procesos</span></div><div id="editError" role="alert"></div><div class="editor-actions"><button class="outline-btn" data-dismiss>Cancelar</button><button class="primary-action" id="applyProcesses">${icon('check',16)} Aplicar cambios</button></div>`;
    shellModal('Editar procesos',`<p class="modal-lead">Modifica las entradas y observa cómo cambia cada algoritmo.</p>${fields}`,true);
    let draft=state.processes.map(p=>({arrival:p.arrival,burst:p.burst,priority:p.priority}));
    const syncInputs=()=>{document.querySelectorAll('.edit-row').forEach((row,i)=>{const inp=row.querySelectorAll('input');draft[i]={arrival:Number(inp[0].value),burst:Number(inp[1].value),priority:Number(inp[2].value)};});};
    const draw=()=>{
      $('#editRows').innerHTML=draft.map((p,i)=>`<div class="edit-row"><strong><i style="background:${COLOR[i]}"></i>P${i+1}</strong><input type="number" min="0" max="18" step="1" value="${p.arrival}" aria-label="P${i+1} llegada"/><input type="number" min="1" max="20" step="1" value="${p.burst}" aria-label="P${i+1} ráfaga"/><input type="number" min="1" max="9" step="1" value="${p.priority}" aria-label="P${i+1} prioridad"/><button class="remove-proc" data-remove="${i}" aria-label="Eliminar P${i+1}" ${draft.length===1?'disabled':''}>${icon('trash',16)}</button></div>`).join('');
      $('#addProcess').disabled=draft.length>=6;
      document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{syncInputs();draft.splice(Number(b.dataset.remove),1);draw();}));
    };
    draw();
    $('#addProcess').addEventListener('click',()=>{syncInputs();if(draft.length<6){draft.push({arrival:Math.max(...draft.map(p=>p.arrival))+1,burst:3,priority:Math.min(9,draft.length+1)});draw();}});
    $('#applyProcesses').addEventListener('click',()=>{
      syncInputs();
      if(draft.some(p=>!Number.isInteger(p.arrival)||p.arrival<0||p.arrival>18||!Number.isInteger(p.burst)||p.burst<1||p.burst>20||!Number.isInteger(p.priority)||p.priority<1||p.priority>9)){
        $('#editError').textContent='Usa valores enteros: llegada 0–18, CPU 1–20, prioridad 1–9.';return;
      }
      state.processes=makeProcesses(draft);state.preset='custom';closeModal();refreshSchedule();
    });
  }
}

init();
