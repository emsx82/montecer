/* =====================================================
   globo.js · Contador de visitantes en forma de globo terráqueo
   - Dibuja un globo 3D giratorio con canvas (sin librerías).
   - Cuenta visitas con el servicio gratuito CounterAPI (counterapi.dev).
     Si no hay internet o el servicio no responde, usa un contador
     local (solo de este navegador) y lo indica en pantalla.
   ===================================================== */
(function () {
  "use strict";

  /* ---------- Configuración ---------- */
  // Cambie NAMESPACE por un nombre único de su proyecto para tener su propio contador.
  const NAMESPACE = "municipio-changuinola-proyecto-final";
  const KEY = "visitas";
  const API_UP = "https://api.counterapi.dev/v1/" + NAMESPACE + "/" + KEY + "/up";
  const PANAMA = { lat: 9.43, lon: -82.52, nombre: "Changuinola" };

  const canvas = document.getElementById("globoCanvas");
  const numEl = document.getElementById("visitasNumero");
  const noteEl = document.getElementById("visitasNota");
  if (!canvas || !numEl) return;

  /* ---------- 1. Contador de visitas ---------- */
  function mostrar(n, nota) {
    numEl.textContent = new Intl.NumberFormat("es-PA").format(n);
    noteEl.textContent = nota;
  }

  function contadorLocal() {
    let n = 0;
    try {
      n = Number(localStorage.getItem("changuinola_visitas_local") || 0);
      if (!sessionStorage.getItem("changuinola_contada_local")) {
        n += 1;
        localStorage.setItem("changuinola_visitas_local", String(n));
        sessionStorage.setItem("changuinola_contada_local", "1");
      }
    } catch (e) { n = 1; }
    mostrar(n, "Contador local de este navegador");
  }

  async function contarVisita() {
    // Una visita se cuenta una sola vez por sesión del navegador.
    try {
      const guardado = sessionStorage.getItem("changuinola_visitas_total");
      if (guardado) { mostrar(Number(guardado), "Visitas totales al sitio"); return; }
    } catch (e) { /* almacenamiento no disponible */ }

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(API_UP, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const total = Number(data.count);
      if (!Number.isFinite(total)) throw new Error("Respuesta inesperada");
      try { sessionStorage.setItem("changuinola_visitas_total", String(total)); } catch (e) {}
      mostrar(total, "Visitas totales al sitio");
    } catch (err) {
      contadorLocal();
    }
  }

  /* ---------- 2. Globo terráqueo en canvas ---------- */
  const ctx = canvas.getContext("2d");
  const tierra = window.GLOBO_TIERRA || [];
  const RAD = Math.PI / 180;
  let size = 0, R = 0, dpr = 1;
  let lambda0 = PANAMA.lon + 60;      // longitud al centro (comienza algo desplazado y gira hacia Panamá)
  const phi0 = 12 * RAD;              // inclinación del globo
  let arrastrando = false, lastX = 0, velocidad = 0.25;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ajustar() {
    dpr = window.devicePixelRatio || 1;
    size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = size / 2 - 6;
  }

  // Proyección ortográfica: devuelve null si el punto está en la cara oculta
  function proyectar(latDeg, lonDeg) {
    const phi = latDeg * RAD, dl = (lonDeg - lambda0) * RAD;
    const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dl);
    if (cosc <= 0) return null;
    const x = Math.cos(phi) * Math.sin(dl);
    const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dl);
    return { x: size / 2 + R * x, y: size / 2 - R * y, d: cosc };
  }

  function dibujar(tiempo) {
    ctx.clearRect(0, 0, size, size);
    const c = size / 2;

    // Océano con degradado
    const g = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
    g.addColorStop(0, "#37a7c9");
    g.addColorStop(1, "#0b4a6e");
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Cuadrícula de latitud/longitud
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) trazar(lat, null);
    for (let lon = -180; lon < 180; lon += 30) trazar(null, lon);

    // Tierra firme (puntos)
    for (let i = 0; i < tierra.length; i += 2) {
      const p = proyectar(tierra[i], tierra[i + 1]);
      if (!p) continue;
      ctx.fillStyle = "rgba(120, 214, 140," + (0.35 + 0.65 * p.d).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3 + p.d * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Marcador de Changuinola con pulso
    const m = proyectar(PANAMA.lat, PANAMA.lon);
    if (m) {
      const pulso = (Math.sin(tiempo / 350) + 1) / 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 5 + pulso * 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 196, 0," + (0.45 - pulso * 0.3).toFixed(2) + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffc400";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Brillo y borde de la esfera
    const brillo = ctx.createRadialGradient(c - R * 0.4, c - R * 0.45, R * 0.05, c, c, R);
    brillo.addColorStop(0, "rgba(255,255,255,0.28)");
    brillo.addColorStop(0.4, "rgba(255,255,255,0)");
    brillo.addColorStop(1, "rgba(0,20,40,0.35)");
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.fillStyle = brillo;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Dibuja un paralelo (lat fija) o un meridiano (lon fija) solo en la cara visible
  function trazar(lat, lon) {
    ctx.beginPath();
    let abierto = false;
    for (let t = -90; t <= 90 || (lat !== null && t <= 180); t += 3) {
      const la = lat !== null ? lat : t;
      const lo = lat !== null ? t * 2 : lon;
      const p = proyectar(la, lo);
      if (p) { if (!abierto) { ctx.moveTo(p.x, p.y); abierto = true; } else ctx.lineTo(p.x, p.y); }
      else abierto = false;
    }
    ctx.stroke();
  }

  let ultimo = 0;
  function animar(t) {
    if (!arrastrando && !reducir) lambda0 += velocidad * ((t - ultimo) / 16.7 || 0);
    ultimo = t;
    dibujar(t);
    requestAnimationFrame(animar);
  }

  // Arrastrar con el mouse o el dedo para girar el globo
  canvas.addEventListener("pointerdown", (e) => {
    arrastrando = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!arrastrando) return;
    lambda0 -= (e.clientX - lastX) * 0.6;
    lastX = e.clientX;
  });
  ["pointerup", "pointercancel"].forEach((ev) =>
    canvas.addEventListener(ev, () => { arrastrando = false; }));

  window.addEventListener("resize", ajustar);
  ajustar();
  requestAnimationFrame(animar);

  contarVisita();
})();
