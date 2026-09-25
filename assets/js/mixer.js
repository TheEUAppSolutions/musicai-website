/* The "hear it split" demo.
 *
 * An original four-bar loop in D minor at 117 BPM, synthesised live with the
 * Web Audio API — no audio files, nothing licensed. Each of the six parts runs
 * into its own bus so it can be muted or soloed exactly like a stem in the app:
 *
 *   voices → bus ─┬→ analyser (drives the lane's waveform, even while muted)
 *                 └→ gate (mute/solo) ─┬→ master
 *                                      └→ reverb send
 */
(() => {
  const root = document.querySelector("[data-mixer]");
  if (!root) return;

  const BPM = 117;
  let STEP = 60 / BPM / 4;            // one 16th note (changes with the tempo control)
  let transpose = 0;                  // semitones, from the key control
  const LOOP = 64;                    // four bars of 16ths
  const STEMS = ["vocals", "drums", "bass", "guitar", "piano", "other"];

  const mtof = (m) => 440 * Math.pow(2, (m + transpose - 69) / 12);

  // Dm9 · Bbmaj7 · Gm9 · A7 — voiced close so the keys barely move.
  const CHORDS = [
    { bass: 38, keys: [53, 57, 60, 64], pad: [50, 57, 64, 69] },
    { bass: 34, keys: [53, 57, 58, 62], pad: [46, 53, 57, 62] },
    { bass: 43, keys: [53, 55, 58, 62], pad: [43, 50, 58, 65] },
    { bass: 45, keys: [55, 57, 61, 64], pad: [45, 52, 61, 67] },
  ];

  // [step, length in 16ths, midi, vowel]
  const MELODY = [
    [0, 3, 69, "a"], [4, 2, 72, "e"], [6, 5, 74, "o"], [12, 2, 72, "a"], [14, 2, 69, "a"],
    [16, 6, 69, "o"], [22, 2, 65, "a"], [24, 5, 67, "e"], [30, 2, 65, "a"],
    [32, 3, 70, "a"], [36, 2, 69, "e"], [38, 4, 67, "o"], [42, 2, 65, "a"], [44, 4, 62, "u"],
    [48, 3, 64, "a"], [52, 2, 65, "e"], [54, 2, 67, "a"], [56, 6, 69, "o"],
  ];
  const VOWELS = { a: [850, 1220, 2810], e: [420, 2050, 2900], o: [500, 860, 2750], u: [340, 720, 2600] };

  const KICK = [0, 6, 8, 11];
  const SNARE = [4, 12];
  const BASS_RHYTHM = [[0, 3], [3, 1], [6, 2], [8, 3], [11, 1], [14, 2]];
  const BASS_INTERVAL = [0, 0, 12, 0, 7, 10];
  const KEYS_RHYTHM = [[0, 5], [7, 2], [10, 5]];
  const GUITAR_STEPS = [2, 5, 6, 10, 13, 14];

  let ctx, master, reverb, noise;
  const bus = {}, gate = {}, analyser = {}, send = {};
  let vocal;                          // the one continuous voice
  let step = 0, nextTime = 0, timer = null, playing = false;

  const state = Object.fromEntries(STEMS.map((s) => [s, { mute: false, solo: false }]));

  /* ---------- Graph ---------- */

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.4, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    reverb.connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const levels = { vocals: 0.5, drums: 0.9, bass: 0.62, guitar: 0.34, piano: 0.4, other: 0.26 };
    const sends = { vocals: 0.45, drums: 0.06, bass: 0, guitar: 0.3, piano: 0.35, other: 0.6 };
    for (const s of STEMS) {
      bus[s] = ctx.createGain(); bus[s].gain.value = levels[s];
      analyser[s] = ctx.createAnalyser(); analyser[s].fftSize = 1024; analyser[s].smoothingTimeConstant = 0.2;
      gate[s] = ctx.createGain();
      send[s] = ctx.createGain(); send[s].gain.value = sends[s];
      bus[s].connect(analyser[s]);
      bus[s].connect(gate[s]).connect(master);
      gate[s].connect(send[s]).connect(reverb);
    }
    // One analyser for the un-split view: the full mix.
    analyser.mix = ctx.createAnalyser(); analyser.mix.fftSize = 1024;
    master.connect(analyser.mix);

    buildVoice();
    applyGates(true);
  }

  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // A sawtooth through three formant filters, with vibrato — reads as "ooh/aah".
  function buildVoice() {
    const osc = ctx.createOscillator(); osc.type = "sawtooth";
    const osc2 = ctx.createOscillator(); osc2.type = "sawtooth"; osc2.detune.value = 7;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.4;
    const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 18;
    lfo.connect(lfoDepth); lfoDepth.connect(osc.detune); lfoDepth.connect(osc2.detune);

    const pre = ctx.createGain(); pre.gain.value = 0.5;
    osc.connect(pre); osc2.connect(pre);
    const env = ctx.createGain(); env.gain.value = 0;
    const formants = [0, 1, 2].map((i) => {
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = [9, 12, 14][i];
      const g = ctx.createGain(); g.gain.value = [1, 0.55, 0.3][i];
      pre.connect(f).connect(g).connect(env);
      return f;
    });
    const air = ctx.createBiquadFilter(); air.type = "highshelf"; air.frequency.value = 3500; air.gain.value = 4;
    const delay = ctx.createDelay(1); delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const dMix = ctx.createGain(); dMix.gain.value = 0.22;
    env.connect(air).connect(bus.vocals);
    air.connect(delay); delay.connect(fb).connect(delay); delay.connect(dMix).connect(bus.vocals);

    osc.start(); osc2.start(); lfo.start();
    vocal = { osc, osc2, env, formants };
  }

  /* ---------- Instruments ---------- */

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(1.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    o.connect(g).connect(bus.drums);
    o.start(t); o.stop(t + 0.5);
    hit(t, 0.004, 0.35, "highpass", 3000);         // beater click
  }

  function snare(t) {
    hit(t, 0.19, 0.9, "bandpass", 1900, 0.8);
    hit(t, 0.12, 0.35, "highpass", 6000);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(bus.drums); o.start(t); o.stop(t + 0.14);
  }

  function hat(t, open, vel) {
    hit(t, open ? 0.22 : 0.035, (open ? 0.22 : 0.18) * vel, "highpass", 7500);
  }

  function hit(t, dur, amp, type, freq, q = 1) {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(bus.drums);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  function bass(t, midi, dur) {
    const o = ctx.createOscillator(), sub = ctx.createOscillator();
    o.type = "sawtooth"; sub.type = "sine";
    o.frequency.value = mtof(midi); sub.frequency.value = mtof(midi);
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 4;
    f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.85, 0.04);
    const sg = ctx.createGain(); sg.gain.value = 0.6;
    o.connect(f).connect(g); sub.connect(sg).connect(g); g.connect(bus.bass);
    o.start(t); sub.start(t); o.stop(t + dur + 0.3); sub.stop(t + dur + 0.3);
  }

  // Electric piano: a sine carrier with a decaying FM "tine".
  function ep(t, midi, dur) {
    const hz = mtof(midi);
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
    car.frequency.value = hz; mod.frequency.value = hz * 7;
    mg.gain.setValueAtTime(hz * 1.6, t); mg.gain.exponentialRampToValueAtTime(hz * 0.05, t + 0.35);
    mod.connect(mg).connect(car.frequency);
    const warm = ctx.createOscillator(); warm.frequency.value = hz * 2; const wg = ctx.createGain(); wg.gain.value = 0.12;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.6);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.12);
    car.connect(g); warm.connect(wg).connect(g); g.connect(bus.piano);
    const end = t + dur + 0.8;
    for (const o of [car, mod, warm]) { o.start(t); o.stop(end); }
  }

  // Muted funk "chk" — a bright pluck that closes fast.
  function pluck(t, midi) {
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = mtof(midi);
    const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = mtof(midi + 12); o2.detune.value = 4;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 6;
    f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(bus.guitar);
    o.start(t); o2.start(t); o.stop(t + 0.3); o2.stop(t + 0.3);
  }

  function pad(t, notes, dur) {
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1100; f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.7);
    g.gain.setTargetAtTime(0.0001, t + dur - 0.1, 0.25);
    f.connect(g).connect(bus.other);
    for (const m of notes) for (const det of [-9, 9]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(f); o.start(t); o.stop(t + dur + 1.2);
    }
  }

  function sing(t, midi, dur, vowel) {
    const hz = mtof(midi), { osc, osc2, env, formants } = vocal;
    for (const o of [osc, osc2]) o.frequency.setTargetAtTime(hz, t, 0.025);
    VOWELS[vowel].forEach((fq, i) => formants[i].frequency.setTargetAtTime(fq, t, 0.05));
    env.gain.setTargetAtTime(0.9, t, 0.035);
    env.gain.setTargetAtTime(0.0, t + dur - 0.06, 0.05);
  }

  /* ---------- Sequencer ---------- */

  function schedule(s, t) {
    const bar = Math.floor(s / 16), pos = s % 16, chord = CHORDS[bar];

    if (KICK.includes(pos)) kick(t);
    if (SNARE.includes(pos)) snare(t);
    if (pos % 2 === 0) hat(t, pos === 14, pos % 4 === 0 ? 1 : 0.7);
    else if (pos === 15 || pos === 7) hat(t, false, 0.35);

    BASS_RHYTHM.forEach(([p, len], i) => { if (p === pos) bass(t, chord.bass + BASS_INTERVAL[i], len * STEP); });
    for (const [p, len] of KEYS_RHYTHM) if (p === pos) chord.keys.forEach((m) => ep(t, m, len * STEP));
    const gi = GUITAR_STEPS.indexOf(pos);
    if (gi >= 0) pluck(t, chord.keys[(gi + bar) % 4] + 12);
    if (pos === 0) pad(t, chord.pad, 16 * STEP);

    for (const [st, len, midi, vowel] of MELODY) if (st === s) sing(t, midi, len * STEP, vowel);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.14) {
      schedule(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % LOOP;
    }
  }

  async function play() {
    if (!ctx) build();
    if (ctx.state === "suspended") await ctx.resume();
    step = 0; nextTime = ctx.currentTime + 0.06;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.01);
    timer = setInterval(tick, 25); tick();
    playing = true; root.classList.add("is-playing");
    playBtn.setAttribute("aria-label", "Pause");
    requestAnimationFrame(draw);
  }

  function stop() {
    clearInterval(timer); timer = null; playing = false;
    root.classList.remove("is-playing");
    playBtn.setAttribute("aria-label", "Play");
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    vocal.env.gain.cancelScheduledValues(ctx.currentTime);
    vocal.env.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  }

  /* ---------- Mute / solo ---------- */

  const audible = (s) => (STEMS.some((x) => state[x].solo) ? state[s].solo : !state[s].mute);

  function applyGates(instant) {
    for (const s of STEMS) {
      const on = audible(s);
      const lane = root.querySelector(`[data-stem="${s}"]`);
      lane.classList.toggle("is-off", !on);
      lane.classList.toggle("is-solo", state[s].solo);
      lane.querySelector(".m").setAttribute("aria-pressed", state[s].mute);
      lane.querySelector(".s").setAttribute("aria-pressed", state[s].solo);
      if (ctx) {
        const g = gate[s].gain;
        if (instant) g.value = on ? 1 : 0;
        else g.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.02);
      }
    }
    const match = PRESETS.find((p) => STEMS.every((s) => audible(s) === p.on.includes(s)));
    root.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", match ? b.dataset.preset === match.id : false));
  }

  const PRESETS = [
    { id: "full", on: STEMS },
    { id: "karaoke", on: STEMS.filter((s) => s !== "vocals") },
    { id: "acapella", on: ["vocals"] },
    { id: "rhythm", on: ["drums", "bass"] },
    { id: "drumless", on: STEMS.filter((s) => s !== "drums") },
    { id: "guitar", on: ["guitar"] },
    { id: "bass", on: ["bass"] },
    { id: "drums", on: ["drums"] },
    { id: "harmony", on: ["guitar", "piano"] },
  ];

  /* ---------- Waveforms ---------- */

  // Each lane keeps a rolling history of loudness and draws it as mirrored
  // bars scrolling right to left — the app's waveform look, live.
  const lanes = [...STEMS, "mix"].map((s) => {
    const canvas = root.querySelector(`canvas[data-wave="${s}"]`);
    return { s, canvas, g: canvas.getContext("2d"), hist: [], buf: new Float32Array(1024) };
  });
  const BAR_W = 3, BAR_GAP = 2;

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const l of lanes) {
      const r = l.canvas.getBoundingClientRect();
      l.canvas.width = Math.max(1, r.width * dpr); l.canvas.height = Math.max(1, r.height * dpr);
      l.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      l.w = r.width; l.h = r.height;
      if (!l.hist.length) l.hist = idle(l.s, Math.ceil(r.width / (BAR_W + BAR_GAP)));
      paint(l);
    }
  }

  // Before anything plays, show a plausible still waveform per stem.
  function idle(s, n) {
    const seed = [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = Math.sin(i * 0.9 + seed) * Math.sin(i * 0.23 + seed * 0.3);
      const v = s === "drums" ? (i % 4 === 0 ? 0.8 : 0.18) : Math.abs(x) * 0.7 + 0.08;
      out.push(v);
    }
    return out;
  }

  function paint(l) {
    const { g, w, h, hist } = l;
    g.clearRect(0, 0, w, h);
    const n = Math.ceil(w / (BAR_W + BAR_GAP));
    const start = Math.max(0, hist.length - n);
    const mid = h / 2;
    for (let i = start; i < hist.length; i++) {
      const x = w - (hist.length - i) * (BAR_W + BAR_GAP);
      const v = Math.min(1, hist[i]);
      const bh = Math.max(1.5, v * (h - 14));
      const age = (hist.length - i) / n;
      g.fillStyle = `rgba(15, 227, 154, ${0.35 + 0.65 * (1 - age * 0.6)})`;
      g.fillRect(x, mid - bh / 2, BAR_W, bh);
    }
  }

  let frame = 0;
  function draw() {
    if (!playing) return;
    frame++;
    if (frame % 2 === 0) {                     // ~30 bars a second
      for (const l of lanes) {
        const a = analyser[l.s];
        a.getFloatTimeDomainData(l.buf);
        let peak = 0;
        for (let i = 0; i < l.buf.length; i++) peak = Math.max(peak, Math.abs(l.buf[i]));
        const gain = l.s === "mix" ? 1.4 : l.s === "drums" ? 1.1 : 2.2;
        l.hist.push(Math.pow(peak * gain, 0.8));
        if (l.hist.length > 600) l.hist.splice(0, l.hist.length - 600);
        paint(l);
      }
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Wiring ---------- */

  const playBtn = root.querySelector("[data-play]");
  playBtn.addEventListener("click", () => (playing ? stop() : play()));

  root.querySelector("[data-split]").addEventListener("click", () => {
    const split = !root.classList.contains("is-split");
    root.classList.toggle("is-split", split);
    if (!playing) play();
    setTimeout(fit, 750);
  });

  root.querySelectorAll("[data-stem]").forEach((lane) => {
    const s = lane.dataset.stem;
    lane.querySelector(".m").addEventListener("click", () => { state[s].mute = !state[s].mute; applyGates(); });
    lane.querySelector(".s").addEventListener("click", () => { state[s].solo = !state[s].solo; applyGates(); });
  });

  root.querySelectorAll("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      const p = PRESETS.find((x) => x.id === b.dataset.preset);
      for (const s of STEMS) state[s] = { mute: !p.on.includes(s), solo: false };
      applyGates();
      if (!playing) play();
    })
  );

  // Landing pages open the demo on the stem they're about (data-start="karaoke" etc.):
  // the first press of play splits the song and applies that mix.
  const start = PRESETS.find((p) => p.id === root.dataset.start);
  function applyPreset(p) {
    for (const s of STEMS) state[s] = { mute: !p.on.includes(s), solo: false };
    applyGates();
  }
  if (start) {
    playBtn.addEventListener("click", () => {
      if (!root.classList.contains("is-split")) {
        root.classList.add("is-split");
        applyPreset(start);
        setTimeout(fit, 750);
      }
    }, { once: true });
  }

  // Tempo and key: change one without the other, the way the app does.
  const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const bpmOut = root.querySelector("[data-bpm]"), keyOut = root.querySelector("[data-key]");
  root.querySelector("[data-tempo]")?.addEventListener("input", (e) => {
    const bpm = Math.round(BPM * e.target.value / 100);
    STEP = 60 / bpm / 4;
    if (bpmOut) bpmOut.textContent = bpm;
    const out = root.querySelector("[data-tempo-out]"); if (out) out.textContent = e.target.value + "%";
  });
  root.querySelector("[data-transpose]")?.addEventListener("input", (e) => {
    transpose = +e.target.value;
    if (keyOut) keyOut.textContent = KEYS[(2 + transpose + 12) % 12] + " minor";
    const out = root.querySelector("[data-transpose-out]"); if (out) out.textContent = (transpose > 0 ? "+" : "") + transpose;
  });

  // Pause when the demo scrolls out of view — nobody wants a loop in the background.
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && playing) stop(); }, { threshold: 0.05 }).observe(root);
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) stop(); });

  window.addEventListener("resize", fit);
  fit();
  applyGates(true);
})();
