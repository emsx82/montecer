/* =====================================================
   script.js · Municipio de Changuinola
   JavaScript puro (sin frameworks)
   ===================================================== */
(function () {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- 1. Menú de navegación responsive ---------- */
  const toggle = $("#navToggle");
  const menu = $("#menu");

  function setMenu(open) {
    menu.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
  }

  toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- 2. Navegación por vistas (todo en un solo index.html) ---------- */
  // Cada opción del menú muestra su sección como si fuera otra "ventana",
  // sin recargar la página. Usa el hash (#historia) para que funcionen
  // los botones Atrás/Adelante del navegador.
  const navLinks = $$(".main-nav a");
  const views = {};
  navLinks.forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    views[id] = id === "inicio" ? [$("#inicio"), $(".intro")] : [$("#" + id)];
  });

  const titles = {
    inicio: "Municipio de Changuinola | Bocas del Toro, Panamá",
    historia: "Historia | Municipio de Changuinola",
    geografia: "Geografía y ubicación | Municipio de Changuinola",
    cultura: "Cultura y tradiciones | Municipio de Changuinola",
    turismo: "Turismo y lugares de interés | Municipio de Changuinola",
    economia: "Economía | Municipio de Changuinola",
    corregimientos: "Corregimientos | Municipio de Changuinola",
    contacto: "Contacto | Municipio de Changuinola"
  };

  let currentView = "inicio";

  function showView(id) {
    if (!views[id]) id = "inicio";
    currentView = id;
    Object.keys(views).forEach((k) => views[k].forEach((el) => { el.hidden = k !== id; }));
    document.title = titles[id];
    updateActiveLink();
    window.scrollTo(0, 0);
    // Reinicia la animación de aparición de las tarjetas de la vista
    views[id].forEach((el) => $$(".reveal", el).forEach((r) => r.classList.add("visible")));
  }

  // Todos los enlaces internos (#seccion) cambian de vista
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href").slice(1);
      if (!views[id]) return;              // p. ej. "saltar al contenido"
      e.preventDefault();
      if (location.hash === "#" + id) showView(id);
      else location.hash = id;             // dispara "hashchange"
      setMenu(false);
    });
  });

  window.addEventListener("hashchange", () => showView(location.hash.slice(1)));

  /* ---------- 3. Enlace activo del menú ---------- */
  function updateActiveLink() {
    navLinks.forEach((a) => {
      const active = a.getAttribute("href") === "#" + currentView;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* ---------- 4. Botón volver arriba ---------- */
  const toTop = $("#toTop");
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  window.addEventListener("scroll", () => {
    updateActiveLink();
    toTop.hidden = window.scrollY < 600;
  }, { passive: true });
  updateActiveLink();

  /* ---------- 5. Animación de aparición (reveal) ---------- */
  const revealEls = $$(".card, .stat-card, .gallery-item, .table-wrap, .section-head");
  revealEls.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- 6. Contadores animados (estadísticas) ---------- */
  const counters = $$(".stat-number");
  const formatter = new Intl.NumberFormat("es-PA");

  function animateCounter(el) {
    const target = Number(el.dataset.target);
    // El año 1970 se muestra sin separador de miles
    const isYear = target > 1900 && target < 2100;
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const value = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = isYear ? String(value) : formatter.format(value);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach((c) => {
      const t = Number(c.dataset.target);
      c.textContent = t > 1900 && t < 2100 ? String(t) : formatter.format(t);
    });
  }

  /* ---------- 7. Pestañas de Cultura (accesibles con teclado) ---------- */
  const tabs = $$("#cultureTabs .tab");
  const panels = $$("#cultureTabs .tab-panel");

  function activateTab(tab) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.classList.toggle("active", selected);
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((p) => {
      const show = p.id === tab.getAttribute("aria-controls");
      p.hidden = !show;
      p.classList.toggle("active", show);
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); next.focus(); activateTab(next); }
    });
  });

  /* ---------- 8. Galería con visor (lightbox) ---------- */
  const items = $$(".gallery-item");
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  let current = 0;
  let lastFocus = null;

  function showImage(i) {
    current = (i + items.length) % items.length;
    const img = $("img", items[current]);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = $("figcaption", items[current]).textContent + " (" + (current + 1) + " de " + items.length + ")";
  }

  function openLightbox(i) {
    lastFocus = document.activeElement;
    showImage(i);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  items.forEach((item, i) => {
    item.addEventListener("click", () => openLightbox(i));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
    });
  });

  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", () => showImage(current - 1));
  $("#lbNext").addEventListener("click", () => showImage(current + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(current - 1);
    if (e.key === "ArrowRight") showImage(current + 1);
  });

  /* ---------- 9. Buscador de corregimientos ---------- */
  const search = $("#buscarCorr");
  const cards = $$("#corrGrid .corr");
  const noResults = $("#noResults");
  const count = $("#corrCount");

  // Quita tildes y pasa a minúsculas para comparar
  const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

  function filterCorr() {
    const q = normalize(search.value);
    let visible = 0;
    cards.forEach((c) => {
      const match = normalize(c.dataset.name).includes(q);
      c.classList.toggle("oculto", !match);
      if (match) visible++;
    });
    noResults.hidden = visible !== 0;
    count.textContent = visible + " de " + cards.length + " corregimientos";
  }
  if (search) {
    search.addEventListener("input", filterCorr);
    filterCorr();
  }

  /* ---------- 10. Formulario de contacto: validación ---------- */
  function initForm() {
  const form = $("#contactForm");
  const status = $("#formStatus");
  const fields = {
    nombre: { el: $("#nombre"), err: $("#err-nombre") },
    correo: { el: $("#correo"), err: $("#err-correo") },
    asunto: { el: $("#asunto"), err: $("#err-asunto") },
    mensaje: { el: $("#mensaje"), err: $("#err-mensaje") }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Reglas: devuelven un texto de error o "" si es válido
  const rules = {
    nombre(v) {
      if (!v) return "El nombre completo es obligatorio.";
      if (v.length < 3) return "Escriba al menos 3 caracteres.";
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(v)) return "El nombre solo puede contener letras y espacios.";
      if (v.split(/\s+/).length < 2) return "Indique nombre y apellido.";
      return "";
    },
    correo(v) {
      if (!v) return "El correo electrónico es obligatorio.";
      if (!emailRegex.test(v)) return "Ingrese un correo válido (ejemplo: nombre@correo.com).";
      return "";
    },
    asunto(v) {
      if (!v) return "El asunto es obligatorio.";
      if (v.length < 4) return "El asunto debe tener al menos 4 caracteres.";
      return "";
    },
    mensaje(v) {
      if (!v) return "El mensaje es obligatorio.";
      if (v.length < 10) return "El mensaje debe tener al menos 10 caracteres.";
      return "";
    }
  };

  function validateField(name) {
    const { el, err } = fields[name];
    const msg = rules[name](el.value.trim());
    err.textContent = msg;
    el.classList.toggle("invalid", Boolean(msg));
    el.classList.toggle("valid", !msg);
    el.setAttribute("aria-invalid", String(Boolean(msg)));
    return !msg;
  }

  Object.keys(fields).forEach((name) => {
    fields[name].el.addEventListener("blur", () => validateField(name));
    fields[name].el.addEventListener("input", () => {
      if (fields[name].el.classList.contains("invalid")) validateField(name);
    });
  });

  // Contador de caracteres del mensaje
  const counter = $("#contador");
  fields.mensaje.el.addEventListener("input", () => {
    counter.textContent = fields.mensaje.el.value.length + " / 500";
  });

  function showStatus(type, text) {
    status.hidden = false;
    status.className = "form-status " + type;
    status.textContent = text;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.hidden = true;

    const results = Object.keys(fields).map(validateField);
    if (results.includes(false)) {
      showStatus("fail", "⚠️ Revise los campos marcados en rojo antes de enviar.");
      const firstBad = Object.values(fields).find((f) => f.el.classList.contains("invalid"));
      if (firstBad) firstBad.el.focus();
      return;
    }

    // No hay servidor: el envío se simula (proyecto académico, sin backend).
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.textContent = "Enviando…";

    setTimeout(() => {
      const nombre = fields.nombre.el.value.trim().split(/\s+/)[0];
      showStatus("success", "✅ ¡Gracias, " + nombre + "! Su mensaje fue validado y registrado correctamente (envío simulado).");
      form.reset();
      Object.values(fields).forEach((f) => f.el.classList.remove("valid", "invalid"));
      counter.textContent = "0 / 500";
      btn.disabled = false;
      btn.textContent = "Enviar mensaje";
    }, 900);
  });
  } // fin initForm

  // El formulario solo existe en contacto.html
  if ($("#contactForm")) initForm();

  /* ---------- 11. Imágenes: si falta una, mostrar fondo de respaldo ---------- */
  $$("img").forEach((img) => {
    img.addEventListener("error", () => { img.style.visibility = "hidden"; });
  });

  /* ---------- 11b. Vista inicial según el hash de la URL ---------- */
  showView(location.hash.slice(1));

  /* ---------- 12. Año en el pie de página ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
