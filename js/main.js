/* MAUYUAN 貓苑 — Main JS */

// --- Navbar scroll behavior ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
}, { passive: true });

// --- Mobile menu ---
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('active');
});

function closeMobile() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('active');
}

// Close on outside click
document.addEventListener('click', (e) => {
  if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
    closeMobile();
  }
});

// --- Scroll animations ---
const fadeEls = document.querySelectorAll(
  '.pillar-card, .step-card, .mini-step-card, .guarantee-card, ' +
  '.stat-item, .philosophy-quote, .philosophy-text, .arch-frame, ' +
  '.dashboard-card, .heritage-box'
);

fadeEls.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach(el => observer.observe(el));

// --- Active nav link on scroll ---
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// --- Contact form ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-submit');
    btn.textContent = '✦ 已收到您的訊息，我們將盡快聯繫！';
    btn.style.background = '#5a8a5a';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '送出詢問 · Send Inquiry';
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
    }, 4000);
  });
}

// --- Smooth scroll for all anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// --- Staggered animation for timeline steps ---
const steps = document.querySelectorAll('.process-step');
const stepsObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 120);
      stepsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

steps.forEach(step => {
  step.style.opacity = '0';
  step.style.transform = 'translateY(20px)';
  step.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  stepsObserver.observe(step);
});
