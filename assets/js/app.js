/* ==========================================================================
   SOLVYNIX — comportamiento
   Sin dependencias. Funciona abriendo index.html directamente (file://).
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SOLVYNIX_CONFIG || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* 1. Contacto ----------------------------------------------------------- */
  function waLink(text) {
    var number = String(CFG.whatsapp || '').replace(/\D/g, '');
    var msg = text || CFG.mensaje || 'Hola, vengo de la página de SOLVYNIX.';
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(msg);
  }

  function initContact() {
    $$('[data-wa]').forEach(function (el) {
      el.setAttribute('href', waLink());
      el.setAttribute('rel', 'noopener');
    });

    var mail = $('#mail-link');
    if (mail && CFG.correo) {
      var subject = 'Quiero ordenar mi negocio';
      mail.setAttribute('href', 'mailto:' + CFG.correo +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(CFG.mensaje || ''));
    }

    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    var menuMail = $('#menu-mail');
    if (menuMail && CFG.correo) {
      menuMail.textContent = CFG.correo;
      menuMail.setAttribute('href', 'mailto:' + CFG.correo +
        '?subject=' + encodeURIComponent('Quiero ordenar mi negocio'));
    }
  }

  /* 2. Nav + menú móvil --------------------------------------------------- */
  function initNav() {
    var nav = $('#nav');
    var burger = $('.burger');
    var menu = $('#menu-movil');

    function onScroll() {
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 12);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!burger || !menu) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.hidden = !open;
      if (nav) nav.classList.toggle('is-open', open);
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 880 && burger.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* 3. Revelado al desplazar ---------------------------------------------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
        var index = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(index, 4) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* 4. Riel del método ---------------------------------------------------- */
  function initRail() {
    var fill = $('#rail-fill');
    var section = $('.method');
    if (!fill || !section) return;

    var ticking = false;

    function update() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.82 - rect.top) / (rect.height * 0.85);
      fill.style.width = (clamp(progress, 0, 1) * 100).toFixed(2) + '%';
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* 5. Estelas de luz (canvas) -------------------------------------------- */
  function initTrails() {
    var canvas = $('#trails');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1;
    var streaks = [];
    var washes = [];
    var time = 0.8;
    var lastFrame = 0;
    var raf = null;
    var onScreen = true;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var pointer = { x: 0.5, active: 0 };

    function random(min, max) { return min + Math.random() * (max - min); }

    function build() {
      var count = w < 720 ? 10 : 19;
      streaks = [];
      for (var i = 0; i < count; i++) {
        streaks.push({
          y: random(0.08, 0.92),
          amp: random(0.012, 0.07),
          speed: random(0.16, 0.5),
          phase: random(0, Math.PI * 2),
          alpha: random(0.32, 0.85),
          width: random(0.9, 3.4),
          resp: random(0.3, 1.4),
          hot: Math.random() < 0.34
        });
      }
      washes = [
        { x: 0.62, y: 0.3, r: 0.46, a: 0.20, phase: 0.4 },
        { x: 0.82, y: 0.62, r: 0.4, a: 0.16, phase: 2.1 },
        { x: 0.44, y: 0.7, r: 0.34, a: 0.11, phase: 4.3 }
      ];
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduceMotion.matches) draw(time);
    }

    function streakPath(s, t) {
      var path = new Path2D();
      var n = w < 720 ? 34 : 56;
      for (var i = 0; i <= n; i++) {
        var u = i / n;
        var x = -0.16 * w + u * 1.32 * w;
        var wobble = Math.sin(u * 4.2 + t * s.speed + s.phase) * s.amp * h;
        var drift = Math.sin(t * 0.28 + s.phase) * h * 0.02;
        var pull = pointer.active * (pointer.x - 0.5) * 120 * s.resp * Math.sin(u * Math.PI);
        var y = s.y * h + wobble + drift + pull;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      return path;
    }

    function gradientFor(s) {
      var g = ctx.createLinearGradient(0, 0, w, 0);
      var a = s.alpha;
      g.addColorStop(0, 'rgba(4,231,254,0)');
      g.addColorStop(0.2, 'rgba(4,231,254,' + (a * 0.5).toFixed(3) + ')');
      g.addColorStop(0.48, 'rgba(4,231,254,' + a.toFixed(3) + ')');
      g.addColorStop(0.68, 'rgba(1,184,251,' + (a * 0.85).toFixed(3) + ')');
      g.addColorStop(0.86, 'rgba(1,67,139,' + (a * 0.55).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(1,67,139,0)');
      return g;
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Masa de luz: manchas grandes que dan cuerpo a las estelas.
      for (var k = 0; k < washes.length; k++) {
        var ws = washes[k];
        var cx = (ws.x + Math.sin(t * 0.18 + ws.phase) * 0.02) * w;
        var cy = (ws.y + Math.cos(t * 0.22 + ws.phase) * 0.03) * h;
        var r = ws.r * w;
        var wg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        wg.addColorStop(0, 'rgba(4,231,254,' + ws.a.toFixed(3) + ')');
        wg.addColorStop(0.42, 'rgba(1,184,251,' + (ws.a * 0.55).toFixed(3) + ')');
        wg.addColorStop(1, 'rgba(1,67,139,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = wg;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      for (var i = 0; i < streaks.length; i++) {
        var s = streaks[i];
        var path = streakPath(s, t);

        // Halo: la misma línea, más ancha y casi transparente.
        ctx.globalAlpha = 0.09;
        ctx.lineWidth = s.width * 9;
        ctx.strokeStyle = gradientFor(s);
        ctx.stroke(path);

        // Núcleo.
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = s.width;
        ctx.strokeStyle = gradientFor(s);
        ctx.stroke(path);

        // Punto caliente de la estela.
        if (s.hot) {
          var hx = w * (0.46 + 0.08 * Math.sin(t * s.speed + s.phase));
          var hy = s.y * h + Math.sin(t * s.speed + s.phase) * s.amp * h * 0.4;
          var r2 = 26 + s.width * 16;
          var rg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r2);
          rg.addColorStop(0, 'rgba(180,250,255,' + (0.5 * s.alpha).toFixed(3) + ')');
          rg.addColorStop(0.45, 'rgba(4,231,254,' + (0.28 * s.alpha).toFixed(3) + ')');
          rg.addColorStop(1, 'rgba(4,231,254,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(hx, hy, r2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }

    function loop(now) {
      raf = window.requestAnimationFrame(loop);
      if (!onScreen || document.hidden) { lastFrame = now; return; }
      var dt = lastFrame ? Math.min(48, now - lastFrame) : 16;
      lastFrame = now;
      time += dt * 0.0006;
      pointer.active += ((pointer.target || 0) - pointer.active) * 0.05;
      draw(time);
    }

    function start() {
      if (reduceMotion.matches || raf) return;
      lastFrame = 0;
      raf = window.requestAnimationFrame(loop);
    }

    function stop() {
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    }

    function sync() {
      if (reduceMotion.matches) { stop(); draw(time); return; }
      if (onScreen && !document.hidden) start();
      else stop();
    }

    pointer.target = 0;

    if (finePointer) {
      var hero = $('.hero');
      if (hero) {
        hero.addEventListener('pointermove', function (e) {
          var rect = canvas.getBoundingClientRect();
          pointer.x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
          pointer.target = 1;
        }, { passive: true });
        hero.addEventListener('pointerleave', function () { pointer.target = 0; }, { passive: true });
      }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resize();
        if (reduceMotion.matches) draw(time);
      }, 160);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.02 }).observe(canvas);
    }

    document.addEventListener('visibilitychange', sync);

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', function () {
        resize();
        sync();
      });
    }

    resize();
    sync();
  }

  /* 6. Diagnóstico -------------------------------------------------------- */
  function initQuiz() {
    var form = $('#quiz');
    var stage = $('#quiz-stage');
    if (!form || !stage) return;

    var stepEl = $('#quiz-step');
    var ticks = $$('#quiz-ticks i');
    var live = $('#quiz-live');
    var result = $('#quiz-result');
    var messageEl = $('#quiz-message');
    var sendEl = $('#quiz-send');
    var restart = $('#quiz-restart');
    var nameEl = $('#quiz-name');
    var total = 4;
    var advanceTimer = null;

    var steps = [
      {
        legend: '¿Qué te está frenando más hoy?',
        options: [
          'Cotizaciones y pedidos a mano',
          'Inventario y clientes en Excel',
          'No tengo presencia digital',
          'Todo lo anterior, a la vez'
        ]
      },
      {
        legend: '¿Dónde vive la operación de tu negocio?',
        options: [
          'Papel y cuadernos',
          'Excel y hojas de cálculo',
          'Un sistema que ya no sirve',
          'En mi cabeza'
        ]
      },
      {
        legend: '¿Cuántas personas trabajan en el negocio?',
        options: [
          'Solo yo',
          'De 2 a 5 personas',
          'De 6 a 20 personas',
          'Más de 20 personas'
        ]
      },
      {
        legend: '¿Qué quisieras resolver primero?',
        options: [
          'Vender en línea',
          'Automatizar lo repetitivo',
          'Ver mis números claros',
          'Tener un sistema propio'
        ]
      }
    ];

    var state = { index: 0, answers: [null, null, null, null], name: '' };

    function announce(text) { if (live) live.textContent = text; }

    function paintTicks() {
      ticks.forEach(function (tick, i) {
        tick.classList.toggle('is-on', state.answers[i] !== null);
      });
      if (stepEl) stepEl.textContent = String(Math.min(state.index + 1, total));
    }

    function render() {
      window.clearTimeout(advanceTimer);
      paintTicks();
      stage.innerHTML = '';

      var step = steps[state.index];

      var fieldset = document.createElement('fieldset');
      fieldset.className = 'q';

      var legend = document.createElement('legend');
      legend.className = 'q__legend';
      legend.tabIndex = -1;
      legend.textContent = step.legend;
      fieldset.appendChild(legend);

      var opts = document.createElement('div');
      opts.className = 'q__opts';

      step.options.forEach(function (label, i) {
        var lab = document.createElement('label');
        lab.className = 'opt';

        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'pregunta-' + state.index;
        input.value = String(i);

        var box = document.createElement('span');
        box.className = 'opt__box';

        var text = document.createElement('span');
        text.textContent = label;

        var mark = document.createElement('span');
        mark.className = 'opt__mark';
        mark.setAttribute('aria-hidden', 'true');

        box.appendChild(text);
        box.appendChild(mark);
        lab.appendChild(input);
        lab.appendChild(box);

        if (state.answers[state.index] === label) input.checked = true;

        input.addEventListener('change', function () {
          state.answers[state.index] = label;
          paintTicks();
          announce('Respuesta ' + (state.index + 1) + ' de ' + total + ': ' + label);
          advanceTimer = window.setTimeout(next, 260);
        });

        opts.appendChild(lab);
      });

      fieldset.appendChild(opts);
      stage.appendChild(fieldset);

      var nav = document.createElement('div');
      nav.className = 'quiz__nav';

      if (state.index > 0) {
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'quiz__back';
        back.textContent = 'Atrás';
        back.addEventListener('click', function () {
          state.index = Math.max(0, state.index - 1);
          render();
        });
        nav.appendChild(back);
      } else {
        var hint = document.createElement('span');
        hint.className = 'quiz__hint';
        hint.textContent = 'Elige una opción para continuar.';
        nav.appendChild(hint);
      }

      stage.appendChild(nav);

      announce('Pregunta ' + (state.index + 1) + ' de ' + total + '. ' + step.legend);
      legend.focus({ preventScroll: true });
    }

    function buildMessage() {
      var a = state.answers;
      var name = state.name.trim();
      var lines = [];

      lines.push(name
        ? 'Hola, soy ' + name + '. Vengo de la página de SOLVYNIX.'
        : 'Hola, vengo de la página de SOLVYNIX.');
      lines.push('Me está frenando: ' + a[0]);
      lines.push('Mi operación vive en: ' + a[1]);
      lines.push('Tamaño del negocio: ' + a[2]);
      lines.push('Quiero resolver primero: ' + a[3]);
      lines.push('¿Podemos hablar?');

      return lines.join('\n\n');
    }

    function updateMessage() {
      if (!messageEl) return;
      var text = buildMessage();
      messageEl.textContent = text;
      if (sendEl) {
        sendEl.setAttribute('href', waLink(text));
        sendEl.setAttribute('rel', 'noopener');
      }
    }

    function finish() {
      if (state.answers.indexOf(null) !== -1) return;
      stage.hidden = true;
      if (result) {
        result.hidden = false;
        updateMessage();
        var label = $('.quiz__result-label', result);
        if (label) label.focus({ preventScroll: true });
        result.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
      announce('Listo. Tu mensaje está armado. Puedes abrirlo en WhatsApp.');
    }

    function next() {
      if (state.index < total - 1) {
        state.index += 1;
        render();
      } else {
        paintTicks();
        finish();
      }
    }

    if (nameEl) {
      nameEl.addEventListener('input', function () {
        state.name = nameEl.value;
        updateMessage();
      });
    }

    if (restart) {
      restart.addEventListener('click', function () {
        state.index = 0;
        state.answers = [null, null, null, null];
        state.name = '';
        if (nameEl) nameEl.value = '';
        if (result) result.hidden = true;
        stage.hidden = false;
        render();
      });
    }

    render();
  }

  /* 7. Arranque ----------------------------------------------------------- */
  function boot() {
    [initReveal, initContact, initNav, initRail, initTrails, initQuiz].forEach(function (init) {
      try { init(); } catch (err) {
        document.documentElement.classList.remove('js');
        if (window.console && window.console.error) window.console.error(err);
      }
    });
    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
