/* ============================================
   SCIC — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ---- Active nav link ----
  const navLinks = document.querySelectorAll('#navbar .nav-links a');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---- Mobile menu ----
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
    if (mobileClose) mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  // ---- Intersection observer for fade-in ----
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(el => observer.observe(el));
  }

  // ---- Timeline observer ----
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length) {
    const tlObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15 });
    timelineItems.forEach(el => tlObserver.observe(el));
  }

  // ---- Tabs ----
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tab-group');
      if (!group) return;
      const target = btn.dataset.tab;
      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = group.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // ---- Accordions ----
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const inner = body.querySelector('.accordion-body-inner');
      const isOpen = item.classList.contains('open');
      // Close all in same group
      const group = item.closest('.accordion-group');
      if (group) {
        group.querySelectorAll('.accordion-item').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.accordion-body').style.maxHeight = '0';
        });
      }
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = inner.scrollHeight + 'px';
      }
    });
  });

  // ---- Dropdown menus (click on mobile) ----
  document.querySelectorAll('.dropdown').forEach(dd => {
    const btn = dd.querySelector('button');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.classList.toggle('open');
      });
    }
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach(dd => dd.classList.remove('open'));
  });

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

});

/* ============================================
   MRI: Larmor Precession + T1 Relaxation
   Each proton tip traces a 3-D cone projected
   to 2-D with a slight elevation angle so the
   circular orbit is visible (not just left-right).
   ============================================ */
(function () {
  const PROTONS = [
    { id: 1, cx: 295, cy: 80,  alpha0: 75, phase0: 0.0  },
    { id: 2, cx: 415, cy: 80,  alpha0: 70, phase0: 1.1  },
    { id: 3, cx: 535, cy: 80,  alpha0: 82, phase0: 2.3  },
    { id: 4, cx: 295, cy: 200, alpha0: 65, phase0: 0.7  },
    { id: 5, cx: 415, cy: 200, alpha0: 78, phase0: 1.9  },
    { id: 6, cx: 535, cy: 200, alpha0: 80, phase0: 3.1  },
    { id: 7, cx: 295, cy: 320, alpha0: 68, phase0: 0.4  },
    { id: 8, cx: 415, cy: 320, alpha0: 73, phase0: 2.6  },
    { id: 9, cx: 535, cy: 320, alpha0: 85, phase0: 1.5  },
  ];

  const L = 32;       // spin-vector length (px)
  const OMEGA = 8.4;  // precession angular speed (rad/s)
  const ELEV = 0.55;  // foreshortening factor — makes orbit elliptical
  const PERIOD = 14;  // total cycle length (s): RF pulse + T1 recovery
  const TAU = 4.0;    // T1 time-constant (s)
  const RF_DUR = 1; // RF pulse duration (s) — fast excitation phase

  let startTime = null;

  const nodes = PROTONS.map(p => ({
    line: document.querySelector(`.proton-g-${p.id} .spin-line`),
    tip:  document.querySelector(`.proton-g-${p.id} .spin-tip`),
  }));

  function frame(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    PROTONS.forEach((p, i) => {
      const { line, tip } = nodes[i];
      if (!line || !tip) return;

      const t = elapsed % PERIOD;
      const alpha0rad = p.alpha0 * Math.PI / 180;

      // RF pulse phase: spins rapidly tip away from B0 axis
      // T1 recovery phase: spins relax back toward alignment
      let alpha;
      if (t < RF_DUR) {
        const rfProgress = t / RF_DUR;
        // Smooth sine ease-in: 0 → alpha0
        alpha = alpha0rad * Math.sin(rfProgress * Math.PI / 2);
      } else {
        // T1 exponential relaxation after RF pulse
        alpha = alpha0rad * Math.exp(-(t - RF_DUR) / TAU);
      }

      const phi = OMEGA * elapsed + p.phase0;

      // 3-D cone projected to 2-D
      const tx = p.cx + L * Math.sin(alpha) * Math.cos(phi);
      const ty = p.cy - L * Math.cos(alpha) - L * Math.sin(alpha) * Math.sin(phi) * ELEV;

      line.setAttribute('x2', tx.toFixed(2));
      line.setAttribute('y2', ty.toFixed(2));

      // Arrowhead pointing along the spin vector
      const dx = tx - p.cx, dy = ty - p.cy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len, ny = dy / len;
      const px = -ny,      py =  nx;

      const AHEAD = 8, ABACK = 4, ASIDE = 5;
      const ax  = tx + nx * AHEAD,              ay  = ty + ny * AHEAD;
      const bx1 = tx - nx * ABACK + px * ASIDE, by1 = ty - ny * ABACK + py * ASIDE;
      const bx2 = tx - nx * ABACK - px * ASIDE, by2 = ty - ny * ABACK - py * ASIDE;

      tip.setAttribute('points',
        `${ax.toFixed(1)},${ay.toFixed(1)} ${bx1.toFixed(1)},${by1.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)}`);
    });

    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.proton-g-1 .spin-line')) {
      requestAnimationFrame(frame);
    }
  });
})();
