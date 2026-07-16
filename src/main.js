import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/fraunces';
import './styles.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initFireflies } from './fireflies.js';

gsap.registerPlugin(ScrollTrigger);

/* ============ Hero interactions (from source design) ============ */

// Animate dim line to 0.5 opacity after fadeUp completes
setTimeout(() => {
  document.querySelector('.hero-title .dim').classList.add('animated');
}, 1050);

// Mobile menu toggle
const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', () => {
  const nav = document.getElementById('mobile-nav');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  const isOpen = nav.classList.contains('open');
  nav.classList.toggle('open');
  menuIcon.style.display = isOpen ? 'block' : 'none';
  closeIcon.style.display = isOpen ? 'none' : 'block';
});

// Calendar logic — dates calculées automatiquement sur le mois courant
const weekdays = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

function dateToCalendar(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  return {
    days: new Date(y, m + 1, 0).getDate(),
    startBlanks: new Date(y, m, 1).getDay(),
    selectedDay: date.getDate(),
    label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    monthTitle: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase(),
  };
}

const checkinDate = new Date(); // aujourd'hui
const checkoutDate = new Date();
checkoutDate.setDate(checkoutDate.getDate() + 7); // arrivée + 7 nuits

const calendars = {
  checkin: dateToCalendar(checkinDate),
  checkout: dateToCalendar(checkoutDate),
};

function buildCalendar(type) {
  const grid = document.getElementById('cal-grid-' + type);
  const config = calendars[type];
  grid.innerHTML = '';

  document.querySelector('#cal-' + type + ' .cal-month').textContent = config.monthTitle;
  document.querySelector('#' + type + '-btn > span').textContent = config.label;

  weekdays.forEach((d) => {
    const span = document.createElement('span');
    span.className = 'cal-weekday';
    span.textContent = d;
    grid.appendChild(span);
  });

  for (let i = 0; i < config.startBlanks; i++) {
    grid.appendChild(document.createElement('span'));
  }

  for (let day = 1; day <= config.days; day++) {
    const btn = document.createElement('button');
    btn.className = 'cal-day' + (day === config.selectedDay ? ' selected' : '');
    btn.textContent = day;
    grid.appendChild(btn);
  }
}

buildCalendar('checkin');
buildCalendar('checkout');

let openCalendar = null;

function toggleCalendar(type) {
  const cal = document.getElementById('cal-' + type);
  const btn = document.getElementById(type + '-btn');
  const chevron = document.getElementById('chevron-' + type);

  if (openCalendar === type) {
    cal.classList.remove('visible');
    btn.classList.remove('open');
    chevron.classList.remove('rotated');
    openCalendar = null;
  } else {
    if (openCalendar) {
      document.getElementById('cal-' + openCalendar).classList.remove('visible');
      document.getElementById(openCalendar + '-btn').classList.remove('open');
      document.getElementById('chevron-' + openCalendar).classList.remove('rotated');
    }
    cal.classList.add('visible');
    btn.classList.add('open');
    chevron.classList.add('rotated');
    openCalendar = type;
  }
}

document.querySelectorAll('.date-btn').forEach((btn) => {
  btn.addEventListener('click', () => toggleCalendar(btn.dataset.cal));
});

/* ============ Three.js atmospheric layer ============ */

initFireflies(document.getElementById('fx-canvas'));

/* ============ Cinematic scroll (GSAP ScrollTrigger) ============ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  // Hero video: slow cinematic zoom + darken as it scrolls away
  gsap.to('.hero-video', {
    scale: 1.18,
    filter: 'brightness(0.55)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  // Manifesto: words light up one by one, scrubbed
  gsap.to('.manifesto-text .w', {
    opacity: 1,
    stagger: 0.35,
    ease: 'none',
    scrollTrigger: {
      trigger: '.manifesto',
      start: 'top 70%',
      end: 'bottom 65%',
      scrub: 1,
    },
  });

  // Locations: pinned horizontal scroll (desktop only)
  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      const track = document.querySelector('.locations-track');

      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: '.locations',
          start: 'top top',
          end: () => '+=' + (track.scrollWidth - window.innerWidth),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Inner parallax on each card image while the track moves
      gsap.utils.toArray('.loc-media img').forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: '.locations',
              start: 'top top',
              end: () => '+=' + (track.scrollWidth - window.innerWidth),
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    },

    // Mobile / tablet: simple vertical reveals
    '(max-width: 1023px)': () => {
      gsap.utils.toArray('.loc-card').forEach((card) => {
        gsap.from(card, {
          y: 60,
          opacity: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });
    },
  });

  // Experiences: curtain reveal + inner parallax, staggered copy
  gsap.utils.toArray('.exp-row').forEach((row) => {
    const media = row.querySelector('.exp-media');
    const img = row.querySelector('.exp-media img');
    const copy = row.querySelectorAll('.exp-copy > *');

    gsap.to(media, {
      clipPath: 'inset(0 0 0% 0)',
      duration: 1.2,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: row, start: 'top 75%', once: true },
    });

    gsap.fromTo(
      img,
      { yPercent: -10 },
      {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: {
          trigger: row,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    gsap.from(copy, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: row, start: 'top 70%', once: true },
    });
  });

  // Section heads fade up
  gsap.utils.toArray('.exp-head, .locations-intro').forEach((el) => {
    gsap.from(el.children, {
      y: 50,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
    });
  });

  // CTA: lines rise like the hero title
  gsap.from('.cta-title span', {
    y: 90,
    opacity: 0,
    duration: 1.1,
    stagger: 0.18,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.cta', start: 'top 65%', once: true },
  });

  gsap.from('.cta-btn', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    delay: 0.3,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.cta', start: 'top 65%', once: true },
  });
} else {
  // Reduced motion: show everything statically
  gsap.set('.manifesto-text .w', { opacity: 1 });
  gsap.set('.exp-media', { clipPath: 'inset(0 0 0% 0)' });
}
