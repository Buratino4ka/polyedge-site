(function () {
  // Page enter transition
  requestAnimationFrame(function () {
    document.body.classList.add('page-ready');
  });

  // Smooth page-leave transition on internal navigation (skip same-page #hash links)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || href.indexOf('mailto:') === 0 || href.indexOf('http') === 0) return;
    var parts = href.split('#');
    var targetFile = parts[0] || 'index.html';
    var curFile = (window.location.pathname.split('/').pop() || 'index.html');
    if (targetFile === curFile && parts[1]) {
      var targetEl = document.getElementById(parts[1]);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    e.preventDefault();
    document.body.classList.remove('page-ready');
    document.body.classList.add('page-leave');
    setTimeout(function () {
      window.location.href = href;
    }, 220);
  });

  // Restore prefilled case from sessionStorage if coming from portfolio.html
  var savedCase = sessionStorage.getItem('pe_prefill_case');
  if (savedCase) {
    var tArea = document.querySelector('textarea[name="task"]');
    if (tArea) {
      tArea.value = 'Хочу похожий проект: «' + savedCase + '». Подскажите сроки и стоимость.';
      sessionStorage.removeItem('pe_prefill_case');
    }
  }

  // Theme initialization & toggle
  var savedTheme = localStorage.getItem('pe_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateThemeIcon(btn, theme) {
    if (!btn) return;
    btn.innerHTML = theme === 'light'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    btn.title = theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему';
  }

  var themeBtn = document.getElementById('theme-toggle');
  updateThemeIcon(themeBtn, savedTheme);
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pe_theme', next);
      updateThemeIcon(themeBtn, next);
    });
  }

  // Mobile menu
  var burger = document.querySelector('.burger');
  var mob = document.querySelector('.mobile-menu');
  if (burger && mob) {
    burger.addEventListener('click', function () {
      mob.classList.toggle('open');
    });
  }

  // Full-Bleed Interactive 3D Architectural Wave Mesh (60fps, zero external libs)
  var polyCanvas = document.getElementById('hero-3d-poly');
  if (polyCanvas && polyCanvas.getContext) {
    var ctx = polyCanvas.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resizePoly() {
      var hero = polyCanvas.parentElement;
      W = hero.clientWidth || window.innerWidth;
      H = hero.clientHeight || 680;
      polyCanvas.width = Math.floor(W * dpr);
      polyCanvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizePoly();
    window.addEventListener('resize', resizePoly);

    var COLS = 34, ROWS = 18;
    var t = 0, mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
    var heroEl = polyCanvas.parentElement;
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect();
      tmx = (e.clientX - r.left) / (r.width || 1);
      tmy = (e.clientY - r.top) / (r.height || 1);
    }, { passive: true });

    function drawWave() {
      t += 0.018;
      mx += (tmx - mx) * 0.07;
      my += (tmy - my) * 0.07;

      ctx.clearRect(0, 0, W, H);
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';

      // Subtle ambient spotlight following cursor
      var gx = mx * W, gy = my * H;
      var glow = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(W, H) * 0.45);
      glow.addColorStop(0, isLight ? 'rgba(91,134,255,0.14)' : 'rgba(91,134,255,0.22)');
      glow.addColorStop(0.5, isLight ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.11)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // 3D Perspective Grid Projection across ENTIRE Hero
      var pts = [];
      var fov = 420;
      var camY = -140 + (my - 0.5) * 60;
      var camX = (mx - 0.5) * 90;
      var spanX = W * 1.45;
      var spanZ = 950;

      for (var r = 0; r < ROWS; r++) {
        var row = [];
        var rz = (r / (ROWS - 1)) * spanZ + 120; // depth 120..1070
        for (var c = 0; c < COLS; c++) {
          var rx = ((c / (COLS - 1)) - 0.5) * spanX - camX;
          // Multi-octave architectural wave
          var wave = Math.sin(c * 0.34 + t) * 34
                   + Math.cos(r * 0.42 - t * 0.85) * 28
                   + Math.sin((c + r) * 0.25 + t * 0.6) * 18;

          // Interactive cursor magnetic lift
          var nx = c / (COLS - 1);
          var nz = 1 - r / (ROWS - 1);
          var dMouse = Math.hypot(nx - mx, nz - my);
          var lift = Math.max(0, 1 - dMouse * 2.8);
          wave -= lift * lift * 95;

          var ry = 135 + wave - camY;
          var scale = fov / (fov + rz);
          var sx = W * 0.5 + rx * scale;
          var sy = H * 0.56 + ry * scale;
          row.push({ x: sx, y: sy, z: rz, s: scale, h: wave });
        }
        pts.push(row);
      }

      // Draw mesh lines with depth & peak coloring
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var p = pts[r][c];
          var depthAlpha = Math.max(0.04, Math.min(0.65, 1 - (p.z - 120) / spanZ));
          var peak = Math.max(0, Math.min(1, (-p.h + 20) / 110));

          if (c < COLS - 1) {
            var pr = pts[r][c + 1];
            ctx.strokeStyle = peak > 0.45
              ? (isLight ? 'rgba(124,58,237,' + (depthAlpha * 0.7) + ')' : 'rgba(168,85,247,' + (depthAlpha * 0.85) + ')')
              : (isLight ? 'rgba(67,105,230,' + (depthAlpha * 0.45) + ')' : 'rgba(91,134,255,' + (depthAlpha * 0.55) + ')');
            ctx.lineWidth = 0.7 + p.s * 1.1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pr.x, pr.y);
            ctx.stroke();
          }

          if (r < ROWS - 1) {
            var pd = pts[r + 1][c];
            ctx.strokeStyle = isLight
              ? 'rgba(67,105,230,' + (depthAlpha * 0.35) + ')'
              : 'rgba(91,134,255,' + (depthAlpha * 0.42) + ')';
            ctx.lineWidth = 0.6 + p.s * 0.9;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pd.x, pd.y);
            ctx.stroke();
          }

          // Glowing vertex dots
          if (p.z < 750) {
            var dotA = depthAlpha * (peak > 0.4 ? 0.95 : 0.6);
            ctx.fillStyle = peak > 0.45
              ? (isLight ? 'rgba(124,58,237,' + dotA + ')' : 'rgba(196,167,255,' + dotA + ')')
              : (isLight ? 'rgba(67,105,230,' + dotA + ')' : 'rgba(139,176,255,' + dotA + ')');
            ctx.beginPath();
            ctx.arc(p.x, p.y, (1.2 + peak * 1.6) * p.s * 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      requestAnimationFrame(drawWave);
    }
    requestAnimationFrame(drawWave);
  }

  // Spotlight effect on Bento cards
  document.querySelectorAll('.bento-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });

  // Hero 3D tilt + interactive switcher
  var showcase = document.querySelector('.hero-showcase');
  if (showcase) {
    showcase.addEventListener('mousemove', function (e) {
      var rect = showcase.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      showcase.style.transform = 'perspective(1000px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 7) + 'deg)';
    });
    showcase.addEventListener('mouseleave', function () {
      showcase.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });

    var heroImg = document.getElementById('hero-img');
    var heroTitle = document.getElementById('hero-float-title');
    var heroMeta = document.getElementById('hero-float-meta');
    document.querySelectorAll('.hero-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.hero-tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (heroImg) heroImg.src = btn.getAttribute('data-img');
        if (heroTitle) heroTitle.textContent = btn.getAttribute('data-title');
        if (heroMeta) heroMeta.textContent = btn.getAttribute('data-meta');
      });
    });
  }

  // Portfolio tabs
  var tabs = document.querySelectorAll('.tab');
  var cards = document.querySelectorAll('.case-card');
  if (tabs.length && cards.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var filter = tab.getAttribute('data-filter');
        cards.forEach(function (card) {
          var cat = card.getAttribute('data-cat');
          card.classList.toggle('hidden', filter !== 'all' && cat !== filter);
        });
      });
    });
  }

  // Case Study Modal + Fullscreen Studio Loupe 2.5x & Lighting/Palette Viewer (ONLY for 3D cases)
  var modal = document.getElementById('case-modal');
  var fsOverlay = document.getElementById('assembly-fullscreen');
  if (modal) {
    var mImg = document.getElementById('cm-img');
    var mTag = document.getElementById('cm-tag');
    var mTitle = document.getElementById('cm-title');
    var mDesc = document.getElementById('cm-desc');
    var mMeta = document.getElementById('cm-meta');
    var mBtn = document.getElementById('cm-cta');
    var mOpen3d = document.getElementById('cm-open-3d');
    var mClose = modal.querySelector('.case-modal-close');
    var currentAssemblyType = '';
    var currentAssemblyTitle = '';
    var currentAssemblyImg = '';

    document.querySelectorAll('.case-card').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function () {
        var img = card.querySelector('.case-thumb img');
        var tag = card.querySelector('.case-tag');
        var title = card.querySelector('h3');
        var desc = card.querySelector('.case-body p');
        var meta = card.querySelector('.case-meta');
        currentAssemblyType = card.getAttribute('data-3d-assembly') || '';
        currentAssemblyTitle = title ? title.textContent : 'Студийный просмотр';
        currentAssemblyImg = img ? img.src : '';

        if (mImg && img) { mImg.src = img.src; mImg.alt = img.alt; }
        if (mTag && tag) mTag.textContent = tag.textContent;
        if (mTitle && title) mTitle.textContent = title.textContent;
        if (mDesc && desc) mDesc.textContent = desc.textContent;
        if (mMeta && meta) mMeta.textContent = meta.textContent;
        if (mOpen3d) {
          mOpen3d.style.display = currentAssemblyType ? 'inline-flex' : 'none';
        }
        modal.classList.add('open');
      });
    });

    function closeModal() { modal.classList.remove('open'); }
    if (mClose) mClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (fsOverlay && fsOverlay.classList.contains('open')) {
          closeFullscreen3D();
        } else {
          closeModal();
        }
      }
    });
    if (mBtn) {
      mBtn.addEventListener('click', function () {
        closeModal();
        if (mTitle) {
          sessionStorage.setItem('pe_prefill_case', mTitle.textContent);
          var taskInput = document.querySelector('textarea[name="task"]');
          if (taskInput) {
            taskInput.value = 'Хочу похожий проект: «' + mTitle.textContent + '». Подскажите сроки и стоимость.';
          }
        }
      });
    }

    // Studio Loupe 2.5x + Mood/Lighting Switcher
    var fsTitleEl = document.getElementById('afs-title');
    var fsCloseBtn = document.getElementById('afs-close');
    var studioViewer = document.getElementById('studio-viewer');
    var studioImg = document.getElementById('studio-img');
    var studioLoupe = document.getElementById('studio-loupe');
    var loupeToggle = document.getElementById('afs-loupe-toggle');
    var zoomRange = document.getElementById('afs-zoom-range');
    var zoomVal = document.getElementById('afs-zoom-val');
    var moodBtns = fsOverlay ? fsOverlay.querySelectorAll('.afs-step[data-mood]') : [];
    var loupeEnabled = true;
    var loupeZoom = 2.4;

    function setZoom(z) {
      loupeZoom = Math.max(1.5, Math.min(4.0, Math.round(z * 10) / 10));
      if (zoomRange) zoomRange.value = loupeZoom;
      if (zoomVal) zoomVal.textContent = loupeZoom.toFixed(1) + '×';
    }
    if (zoomRange) {
      zoomRange.addEventListener('input', function () {
        setZoom(parseFloat(zoomRange.value));
      });
    }

    function applyMood(mood) {
      if (studioViewer) studioViewer.setAttribute('data-mood', mood);
      if (studioLoupe && studioImg) {
        var filterMap = {
          original: 'none',
          warm: 'sepia(0.22) saturate(1.18) brightness(0.96) contrast(1.06)',
          scandi: 'saturate(0.82) brightness(1.08) contrast(0.96) hue-rotate(-6deg)',
          loft: 'contrast(1.16) brightness(0.84) saturate(0.88)'
        };
        studioLoupe.style.filter = filterMap[mood] || 'none';
      }
      moodBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mood') === mood);
      });
    }

    if (studioViewer && studioLoupe) {
      studioViewer.addEventListener('mousemove', function (e) {
        if (!loupeEnabled || !currentAssemblyImg) {
          studioLoupe.classList.remove('active');
          return;
        }
        var r = studioViewer.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        var zoom = loupeZoom;
        studioLoupe.classList.add('active');
        studioLoupe.style.left = x + 'px';
        studioLoupe.style.top = y + 'px';
        studioLoupe.style.backgroundImage = 'url("' + currentAssemblyImg + '")';
        studioLoupe.style.backgroundSize = (r.width * zoom) + 'px ' + (r.height * zoom) + 'px';
        studioLoupe.style.backgroundPosition = (-x * zoom + 95) + 'px ' + (-y * zoom + 95) + 'px';
      });
      studioViewer.addEventListener('wheel', function (e) {
        if (!loupeEnabled) return;
        e.preventDefault();
        setZoom(loupeZoom + (e.deltaY < 0 ? 0.3 : -0.3));
      }, { passive: false });
      studioViewer.addEventListener('mouseleave', function () {
        studioLoupe.classList.remove('active');
      });
    }

    if (loupeToggle) {
      loupeToggle.addEventListener('click', function () {
        loupeEnabled = !loupeEnabled;
        loupeToggle.classList.toggle('active', loupeEnabled);
        loupeToggle.textContent = loupeEnabled ? 'Лупа: ВКЛ' : 'Лупа: ВЫКЛ';
        if (!loupeEnabled && studioLoupe) studioLoupe.classList.remove('active');
      });
    }

    function openFullscreen3D() {
      if (!fsOverlay || !currentAssemblyImg) return;
      if (fsTitleEl) fsTitleEl.textContent = currentAssemblyTitle;
      if (studioImg) studioImg.src = currentAssemblyImg;
      applyMood('original');
      fsOverlay.classList.add('open');
    }

    function closeFullscreen3D() {
      if (studioLoupe) studioLoupe.classList.remove('active');
      if (fsOverlay) fsOverlay.classList.remove('open');
    }

    if (mOpen3d) mOpen3d.addEventListener('click', openFullscreen3D);
    if (fsCloseBtn) fsCloseBtn.addEventListener('click', closeFullscreen3D);
    moodBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyMood(btn.getAttribute('data-mood'));
      });
    });
  }

  // Form quick service tags
  document.querySelectorAll('.form-tag').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.form-tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var taskInput = document.querySelector('textarea[name="task"]');
      if (taskInput) {
        var serviceName = btn.textContent.trim();
        taskInput.value = 'Интересует: ' + serviceName + '. Кратко о задаче: ';
        taskInput.focus();
      }
    });
  });

  // Estimator
  var calcService = '3d';
  var calcScale = 'pilot';
  var prices = {
    '3d': { pilot: ['от 6 000 ₽', 'от 2 дней · 1 модель / 3 ракурса'], standard: ['от 25 000 ₽', 'от 5 дней · каталог моделей под ключ'], pro: ['от 65 000 ₽', 'от 10 дней · серия + варианты цветов и сцен'] },
    'web': { pilot: ['от 15 000 ₽', 'от 2 дней · концепт и прототип 1-го экрана'], standard: ['от 45 000 ₽', 'от 5 дней · продающий сайт / лендинг под ключ'], pro: ['от 95 000 ₽', 'от 10 дней · многостраничник + CRM и сервисы'] },
    'custom': { pilot: ['от 15 000 ₽', 'от 2 дней · бот, парсер или превью'], standard: ['от 40 000 ₽', 'от 5 дней · автоматизация заявок (CRM / TG)'], pro: ['по задаче', 'от 14 дней · индивидуальный сервис или комплекс'] }
  };

  function updateCalc() {
    var pEl = document.getElementById('calc-price');
    var tEl = document.getElementById('calc-term');
    var taskInput = document.querySelector('textarea[name="task"]');
    if (!pEl || !tEl) return;
    var res = prices[calcService][calcScale];
    pEl.textContent = res[0];
    tEl.textContent = res[1];
    if (taskInput && taskInput.dataset.autofill === '1') {
      taskInput.value = 'Расчёт с калькулятора: направление ' + calcService.toUpperCase() + ', формат ' + calcScale + ' (' + res[0] + ')';
    }
  }

  document.querySelectorAll('[data-calc-service]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-calc-service]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      calcService = btn.getAttribute('data-calc-service');
      updateCalc();
    });
  });

  document.querySelectorAll('[data-calc-scale]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-calc-scale]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      calcScale = btn.getAttribute('data-calc-scale');
      updateCalc();
    });
  });

  var calcBtn = document.getElementById('calc-apply');
  if (calcBtn) {
    calcBtn.addEventListener('click', function () {
      var taskInput = document.querySelector('textarea[name="task"]');
      if (taskInput) {
        taskInput.dataset.autofill = '1';
        updateCalc();
      }
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      if (item) item.classList.toggle('open');
    });
  });

  // Scroll progress & reveal
  var bar = document.getElementById('scroll-progress');
  if (bar) {
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }, { passive: true });
  }
  var els = document.querySelectorAll('.reveal');
  if (els.length) {
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.08 });
      els.forEach(function (e) { io.observe(e); });
    }
  }

  // Lead form
  var form = document.getElementById('lead-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      status.hidden = false;
      status.className = 'status';
      status.textContent = 'Отправляем…';
      var payload = {};
      new FormData(form).forEach(function (v, k) { if (k.charAt(0) !== '_') payload[k] = v; });
      payload._subject = 'Заявка с сайта PolyEdge-Studio';
      try {
        var r = await fetch('https://formsubmit.co/ajax/contact.polyedge@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        var j = await r.json();
        if (j.success !== true && j.success !== 'true') throw new Error(j.message || 'failed');
        form.reset();
        status.className = 'status ok';
        status.textContent = 'Спасибо! Заявка отправлена — ответим в течение 24 часов.';
      } catch (e) {
        status.className = 'status err';
        status.innerHTML = 'Не удалось отправить. Напишите в <a href="https://t.me/denis_polyedge" target="_blank" rel="noopener">Telegram</a> или на <a href="mailto:contact.polyedge@gmail.com">почту</a>.';
      }
    });
  }
})();

(function () {
  var bg = document.getElementById('hero-bg-3d');
  var hero = document.querySelector('.hero');
  if (!bg || !hero) return;
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    var x = ((e.clientX - r.left) / (r.width || 1) - 0.5) * -28;
    var y = ((e.clientY - r.top) / (r.height || 1) - 0.5) * -20;
    bg.style.animation = 'none';
    bg.style.transform = 'scale(1.07) translate3d(' + x + 'px, ' + y + 'px, 0)';
  }, { passive: true });
  hero.addEventListener('mouseleave', function () {
    bg.style.transform = '';
    bg.style.animation = 'heroFloat3D 16s ease-in-out infinite alternate';
  });
})();

(function () {
  var aura = document.getElementById('hero-aura');
  var hero = document.querySelector('.hero');
  if (!aura || !hero) return;
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    var x = ((e.clientX - r.left) / (r.width || 1) - 0.5) * 40;
    var y = ((e.clientY - r.top) / (r.height || 1) - 0.5) * 30;
    aura.style.animation = 'none';
    aura.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) scale(1.05)';
  }, { passive: true });
  hero.addEventListener('mouseleave', function () {
    aura.style.transform = '';
    aura.style.animation = 'auraDrift 12s ease-in-out infinite alternate';
  });
})();



(function () {
  var canvas = document.getElementById('hero-3d-stage');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return;

  var vsSource = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var fsSource = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec2 u_mouse;',
    'uniform float u_light;',
    '',
    'mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }',
    '',
    'float smin(float a, float b, float k) {',
    '  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);',
    '  return mix(b, a, h) - k * h * (1.0 - h);',
    '}',
    '',
    'float sdTorus(vec3 p, vec2 t) {',
    '  vec2 q = vec2(length(p.xz) - t.x, p.y);',
    '  return length(q) - t.y;',
    '}',
    '',
    'float map(vec3 p) {',
    '  p.xz *= rot(u_time * 0.35 + u_mouse.x * 2.2);',
    '  p.yz *= rot(u_time * 0.22 + u_mouse.y * 1.6);',
    '  vec3 p1 = p;',
    '  p1.xy *= rot(u_time * 0.4);',
    '  float d1 = sdTorus(p1, vec2(0.88, 0.26));',
    '  vec3 p2 = p;',
    '  p2.yz *= rot(1.57 + u_time * 0.3);',
    '  float d2 = sdTorus(p2, vec2(0.72, 0.22));',
    '  float core = length(p) - (0.42 + 0.06 * sin(u_time * 2.0));',
    '  float orb1 = length(p - vec3(sin(u_time)*1.1, cos(u_time*1.3)*0.55, cos(u_time)*0.7)) - 0.24;',
    '  float orb2 = length(p + vec3(cos(u_time*0.8)*1.0, sin(u_time*1.1)*0.6, sin(u_time*0.9)*0.8)) - 0.20;',
    '  float d = smin(d1, d2, 0.32);',
    '  d = smin(d, core, 0.35);',
    '  d = smin(d, orb1, 0.35);',
    '  d = smin(d, orb2, 0.35);',
    '  return d;',
    '}',
    '',
    'vec3 calcNormal(vec3 p) {',
    '  vec2 e = vec2(0.0025, 0.0);',
    '  return normalize(vec3(',
    '    map(p + e.xyy) - map(p - e.xyy),',
    '    map(p + e.yxy) - map(p - e.yxy),',
    '    map(p + e.yyx) - map(p - e.yyx)',
    '  ));',
    '}',
    '',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);',
    '  vec3 ro = vec3(0.0, 0.0, 3.25);',
    '  vec3 rd = normalize(vec3(uv, -1.55));',
    '',
    '  float t = 0.0;',
    '  bool hit = false;',
    '  for (int i = 0; i < 64; i++) {',
    '    vec3 p = ro + rd * t;',
    '    float d = map(p);',
    '    if (d < 0.002) { hit = true; break; }',
    '    if (t > 6.5) break;',
    '    t += d * 0.85;',
    '  }',
    '',
    '  if (!hit) {',
    '    float glow = exp(-length(uv) * 2.4) * (u_light > 0.5 ? 0.16 : 0.28);',
    '    vec3 bgGlow = mix(vec3(0.35, 0.52, 1.0), vec3(0.66, 0.33, 0.97), 0.5 + 0.5 * sin(u_time * 0.5));',
    '    gl_FragColor = vec4(bgGlow * glow, glow);',
    '    return;',
    '  }',
    '',
    '  vec3 p = ro + rd * t;',
    '  vec3 n = calcNormal(p);',
    '  vec3 r = reflect(rd, n);',
    '  float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);',
    '',
    '  // Studio HDRI-style lighting',
    '  vec3 l1 = normalize(vec3(1.2, 1.5, 1.4));',
    '  vec3 l2 = normalize(vec3(-1.4, -0.8, 0.9));',
    '  float diff1 = max(dot(n, l1), 0.0);',
    '  float diff2 = max(dot(n, l2), 0.0);',
    '  float spec1 = pow(max(dot(r, l1), 0.0), 36.0);',
    '  float spec2 = pow(max(dot(r, l2), 0.0), 22.0);',
    '',
    '  // Iridescent chrome/glass palette',
    '  vec3 baseCol = mix(vec3(0.06, 0.09, 0.20), vec3(0.18, 0.28, 0.65), diff1);',
    '  vec3 rimA = vec3(0.36, 0.54, 1.0);',
    '  vec3 rimB = vec3(0.68, 0.34, 0.98);',
    '  vec3 irid = mix(rimA, rimB, 0.5 + 0.5 * sin(n.x * 3.0 + n.y * 2.5 + u_time));',
    '',
    '  vec3 col = baseCol',
    '    + irid * (fresnel * 1.15 + diff2 * 0.45)',
    '    + vec3(0.92, 0.96, 1.0) * spec1 * 1.35',
    '    + rimB * spec2 * 0.75;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'u_res');
  var uTime = gl.getUniformLocation(prog, 'u_time');
  var uMouse = gl.getUniformLocation(prog, 'u_mouse');
  var uLight = gl.getUniformLocation(prog, 'u_light');

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = r.width || 500;
    H = r.height || 460;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  var mx = 0, my = 0, tmx = 0, tmy = 0, start = performance.now();
  var heroEl = document.querySelector('.hero') || canvas.parentElement;
  heroEl.addEventListener('mousemove', function (e) {
    var r = heroEl.getBoundingClientRect();
    tmx = (e.clientX - r.left) / (r.width || 1) - 0.5;
    tmy = (e.clientY - r.top) / (r.height || 1) - 0.5;
  }, { passive: true });

  function render(now) {
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) * 0.001);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uLight, isLight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();

(function () {
  var stage = document.getElementById('hero-sculpture-stage');
  var img = document.getElementById('hero-sculpture');
  if (!stage || !img) return;
  var hero = document.querySelector('.hero') || stage;
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    var x = ((e.clientX - r.left) / (r.width || 1) - 0.5) * 20;
    var y = ((e.clientY - r.top) / (r.height || 1) - 0.5) * -20;
    img.style.animation = 'none';
    img.style.transform = 'perspective(900px) rotateY(' + x + 'deg) rotateX(' + y + 'deg) scale(1.04)';
  }, { passive: true });
  hero.addEventListener('mouseleave', function () {
    img.style.transform = '';
    img.style.animation = 'sculptureFloat 9s ease-in-out infinite';
  });
})();



(function () {
  var canvas = document.getElementById('hero-three-canvas');
  var fallbackImg = document.getElementById('hero-sculpture');
  if (!canvas) return;
  if (typeof THREE === 'undefined') {
    canvas.style.display = 'none';
    if (fallbackImg) fallbackImg.style.display = 'block';
    return;
  }

  var stage = canvas.parentElement;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  function resize() {
    var w = stage.clientWidth || 480;
    var h = stage.clientHeight || 460;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Studio Lights
  scene.add(new THREE.AmbientLight(0x9bb4ff, 0.75));
  var keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
  keyLight.position.set(4, 5, 5);
  scene.add(keyLight);

  var blueLight = new THREE.PointLight(0x5b86ff, 11, 16);
  blueLight.position.set(-4, 2, 3);
  scene.add(blueLight);

  var violetLight = new THREE.PointLight(0xa855f7, 11, 16);
  violetLight.position.set(4, -3, 2);
  scene.add(violetLight);

  var cyanLight = new THREE.PointLight(0x38bdf8, 6, 14);
  cyanLight.position.set(0, 4, -2);
  scene.add(cyanLight);

  var group = new THREE.Group();
  scene.add(group);

  // 1. Living Faceted Morphing Crystal/Obsidian Core (replaces plain grey sphere!)
  var coreGeo = new THREE.IcosahedronGeometry(1.0, 3);
  var basePos = coreGeo.attributes.position.array.slice();
  var coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x151b33,
    metalness: 0.82,
    roughness: 0.16,
    flatShading: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });
  var coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // Glowing outer wireframe cage around core
  var cageGeo = new THREE.IcosahedronGeometry(1.12, 2);
  var cageMat = new THREE.MeshBasicMaterial({
    color: 0x7ea1ff,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  var cageMesh = new THREE.Mesh(cageGeo, cageMat);
  group.add(cageMesh);

  // 2. Wavy Sculpted Metallic/Sapphire/Violet Ribbons (organic chaos!)
  function makeWavyRibbon(radius, tube, waves, amp, color, metal, rough) {
    var pts = [];
    var segs = 100;
    for (var i = 0; i < segs; i++) {
      var a = (i / segs) * Math.PI * 2;
      var r = radius + Math.sin(a * waves) * amp;
      var z = Math.cos(a * (waves - 1)) * (amp * 1.45);
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z));
    }
    var curve = new THREE.CatmullRomCurve3(pts, true);
    var geo = new THREE.TubeGeometry(curve, 140, tube, 16, true);
    var mat = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: metal,
      roughness: rough,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06
    });
    return new THREE.Mesh(geo, mat);
  }

  var ribbonSpecs = [
    { r: 1.48, tube: 0.058, w: 3, amp: 0.14, col: 0xe2e8f0, m: 0.96, rg: 0.10, rx: 0.6, ry: 0.3, sx: 0.009, sy: 0.013, sz: 0.005, ph: 0.0 },
    { r: 1.64, tube: 0.052, w: 4, amp: 0.16, col: 0x5b86ff, m: 0.90, rg: 0.14, rx: -0.9, ry: 0.7, sx: -0.012, sy: 0.008, sz: -0.006, ph: 1.3 },
    { r: 1.78, tube: 0.048, w: 5, amp: 0.13, col: 0xa855f7, m: 0.90, rg: 0.14, rx: 1.2, ry: -0.5, sx: 0.007, sy: -0.014, sz: 0.008, ph: 2.6 },
    { r: 1.38, tube: 0.042, w: 3, amp: 0.11, col: 0x38bdf8, m: 0.92, rg: 0.12, rx: -0.4, ry: -1.1, sx: -0.011, sy: -0.009, sz: 0.007, ph: 4.1 },
    { r: 1.92, tube: 0.036, w: 6, amp: 0.12, col: 0xf1f5f9, m: 0.96, rg: 0.09, rx: 0.2, ry: 0.9, sx: 0.006, sy: 0.011, sz: -0.009, ph: 5.2 }
  ];

  var ribbons = ribbonSpecs.map(function (sp) {
    var mesh = makeWavyRibbon(sp.r, sp.tube, sp.w, sp.amp, sp.col, sp.m, sp.rg);
    mesh.rotation.set(sp.rx, sp.ry, 0);
    mesh.userData = sp;
    group.add(mesh);
    return mesh;
  });

  // 3. Chaotic Floating 3D Micro-Shards
  var shards = [];
  var shardGeo = new THREE.OctahedronGeometry(0.065, 0);
  var shardMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, metalness: 0.9, roughness: 0.12 });
  for (var i = 0; i < 18; i++) {
    var sh = new THREE.Mesh(shardGeo, shardMat);
    var rad = 1.95 + Math.random() * 0.95;
    var th = Math.random() * Math.PI * 2;
    var ph = Math.acos(2 * Math.random() - 1);
    sh.userData = {
      rad: rad, th: th, ph: ph,
      vTh: (Math.random() - 0.5) * 0.007,
      vPh: (Math.random() - 0.5) * 0.005,
      spin: 0.006 + Math.random() * 0.012,
      sc: 0.6 + Math.random() * 0.9
    };
    sh.scale.setScalar(sh.userData.sc);
    group.add(sh);
    shards.push(sh);
  }

  // Orbiting stardust
  var pGeo = new THREE.BufferGeometry();
  var pCount = 90;
  var pPos = new Float32Array(pCount * 3);
  for (var i = 0; i < pCount; i++) {
    var rad = 2.0 + Math.random() * 1.4;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pPos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = rad * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xa5b4fc, size: 0.042, transparent: true, opacity: 0.72 });
  var particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  // Interactive mouse drag + hover tilt
  var mx = 0, my = 0, dragging = false, prevX = 0, prevY = 0, rotVelX = 0, rotVelY = 0.005;
  stage.addEventListener('mousedown', function (e) { dragging = true; prevX = e.clientX; prevY = e.clientY; });
  window.addEventListener('mouseup', function () { dragging = false; });
  window.addEventListener('mousemove', function (e) {
    var r = stage.getBoundingClientRect();
    mx = ((e.clientX - r.left) / (r.width || 1) - 0.5) * 0.7;
    my = ((e.clientY - r.top) / (r.height || 1) - 0.5) * 0.7;
    if (dragging) {
      rotVelY = (e.clientX - prevX) * 0.009;
      rotVelX = (e.clientY - prevY) * 0.009;
      prevX = e.clientX; prevY = e.clientY;
    }
  }, { passive: true });

  var clock = new THREE.Clock();
  function animate() {
    var t = clock.getElapsedTime();

    // Morph core vertices organically
    var posAttr = coreGeo.attributes.position;
    var arr = posAttr.array;
    for (var i = 0; i < arr.length; i += 3) {
      var bx = basePos[i], by = basePos[i + 1], bz = basePos[i + 2];
      var n = 1.0 + 0.11 * Math.sin(bx * 3.2 + t * 0.72) * Math.cos(by * 2.9 - t * 0.58)
                  + 0.06 * Math.sin(bz * 4.1 + t * 0.92);
      arr[i] = bx * n;
      arr[i + 1] = by * n;
      arr[i + 2] = bz * n;
    }
    posAttr.needsUpdate = true;
    coreGeo.computeVertexNormals();

    coreMesh.rotation.y += 0.0016;
    coreMesh.rotation.x += 0.0010;
    cageMesh.rotation.y -= 0.0018;
    cageMesh.rotation.z += 0.0012;

    if (!dragging) {
      rotVelX *= 0.94;
      rotVelY += (0.0014 - rotVelY) * 0.03;
    }
    group.rotation.y += rotVelY + (mx - group.rotation.y) * 0.025;
    group.rotation.x += rotVelX + (my - group.rotation.x) * 0.025;
    group.position.y = Math.sin(t * 0.65) * 0.10;

    // Non-linear chaotic ribbon motion
    ribbons.forEach(function (rb) {
      var d = rb.userData;
      var boost = 0.28 + 0.18 * Math.sin(t * 0.42 + d.ph) + 0.12 * Math.cos(t * 0.27 + d.ph * 1.7);
      rb.rotation.x += d.sx * boost;
      rb.rotation.y += d.sy * boost;
      rb.rotation.z += d.sz * Math.cos(t * 0.31 + d.ph) * 0.35;
    });

    // Chaotic shard orbits
    shards.forEach(function (sh) {
      var u = sh.userData;
      u.th += u.vTh;
      u.ph += u.vPh;
      var r = u.rad + Math.sin(t * 0.55 + u.th) * 0.12;
      sh.position.set(
        r * Math.sin(u.ph) * Math.cos(u.th),
        r * Math.sin(u.ph) * Math.sin(u.th),
        r * Math.cos(u.ph)
      );
      sh.rotation.x += u.spin;
      sh.rotation.y += u.spin * 0.8;
    });

    particles.rotation.y -= 0.001;
    particles.rotation.x = Math.sin(t * 0.18) * 0.15;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();
