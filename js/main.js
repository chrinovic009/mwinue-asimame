/* =====================================================
   NEXORA — UI Interactions (Vanilla JS)
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Sticky navbar on scroll ---------- */
  const navbar = document.querySelector('.navbar-nexora');
  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  /* ---------- Hero presentation video ---------- */
  const videoPlayButton = document.querySelector('.hero-video-play');
  const heroVideo = document.querySelector('.hero-video');
  const videoCover = document.querySelector('.hero-video-cover');
  const videoStatus = document.querySelector('.hero-video-status');

  if (videoPlayButton && heroVideo && videoCover && videoStatus) {
    videoPlayButton.addEventListener('click', () => {
      heroVideo.hidden = false;
      videoCover.hidden = true;
      heroVideo.play().catch(() => {
        videoStatus.textContent = 'Impossible de lire cette vidéo. Vérifiez que le fichier MP4 utilise un codec compatible avec votre navigateur.';
      });
    });
  }

  /* ---------- Activity card flips ---------- */
  document.querySelectorAll('.activity-flip').forEach(card => {
    const front = card.querySelector('.activity-flip-front');
    const back = card.querySelector('.activity-flip-back');
    let lastPointerType = null;

    const setFlipped = isFlipped => {
      card.classList.toggle('is-flipped', isFlipped);
      front?.setAttribute('aria-expanded', String(isFlipped));
      back?.setAttribute('aria-hidden', String(!isFlipped));
      back?.toggleAttribute('inert', !isFlipped);
    };

    card.addEventListener('pointerdown', event => {
      lastPointerType = event.pointerType;
    });

    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') setFlipped(true);
    });

    card.addEventListener('pointerleave', () => {
      if (!card.contains(document.activeElement)) setFlipped(false);
    });

    card.addEventListener('focusin', () => {
      if (lastPointerType !== 'touch') setFlipped(true);
    });

    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget) && !card.matches(':hover')) {
        setFlipped(false);
      }
    });

    front?.addEventListener('keydown', () => {
      lastPointerType = 'keyboard';
    });

    front?.addEventListener('click', event => {
      if (event.pointerType === 'mouse' || event.detail === 0) {
        setFlipped(true);
      } else {
        setFlipped(!card.classList.contains('is-flipped'));
      }
    });
  });

  /* ---------- Mobile menu toggle animation ---------- */
  const toggler = document.querySelector('.navbar-toggler-custom');
  const navCollapse = document.getElementById('mainNav');

  if (toggler && navCollapse) {
    navCollapse.addEventListener('show.bs.collapse', () => toggler.classList.add('active'));
    navCollapse.addEventListener('hide.bs.collapse', () => toggler.classList.remove('active'));

    // Close menu on link click (mobile)
    navCollapse.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (navCollapse.classList.contains('show')) {
          bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
        }
      });
    });
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const offset = 90;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  /* ---------- Scroll reveal (lightweight IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 0.08}s`;
      observer.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Back to top button ---------- */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Bootstrap form validation UI ---------- */
  document.querySelectorAll('.needs-validation').forEach(form => {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = 'Sending...';
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = 'Message sent ✓';
            setTimeout(() => {
              btn.innerHTML = original;
              btn.disabled = false;
              form.reset();
              form.classList.remove('was-validated');
            }, 2200);
          }, 1000);
        }
      }
      form.classList.add('was-validated');
    }, false);
  });

  /* ---------- Set active nav link based on current page ---------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nexora .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

});
