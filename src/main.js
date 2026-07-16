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

document.querySelectorAll('.date-btn[data-cal]').forEach((btn) => {
  btn.addEventListener('click', () => toggleCalendar(btn.dataset.cal));
});

// Sélecteur de personnes (1 à 10)
const guestsBtn = document.getElementById('guests-btn');
const guestsDropdown = document.getElementById('guests-dropdown');
const guestsLabel = document.getElementById('guests-label');
const chevronGuests = document.getElementById('chevron-guests');
let guestCount = 2;

for (let n = 1; n <= 10; n++) {
  const opt = document.createElement('button');
  opt.className = 'guest-option' + (n === guestCount ? ' selected' : '');
  opt.setAttribute('role', 'option');
  opt.textContent = n + (n > 1 ? ' personnes' : ' personne');
  opt.addEventListener('click', () => {
    guestCount = n;
    guestsLabel.textContent = opt.textContent;
    guestsDropdown.querySelectorAll('.guest-option').forEach((o) => o.classList.remove('selected'));
    opt.classList.add('selected');
    closeGuests();
  });
  guestsDropdown.appendChild(opt);
}

function closeGuests() {
  guestsDropdown.classList.remove('visible');
  guestsBtn.classList.remove('open');
  guestsBtn.setAttribute('aria-expanded', 'false');
  chevronGuests.classList.remove('rotated');
}

guestsBtn.addEventListener('click', () => {
  const isOpen = guestsDropdown.classList.contains('visible');
  if (isOpen) {
    closeGuests();
  } else {
    if (openCalendar) toggleCalendar(openCalendar); // ferme un calendrier ouvert
    guestsDropdown.classList.add('visible');
    guestsBtn.classList.add('open');
    guestsBtn.setAttribute('aria-expanded', 'true');
    chevronGuests.classList.add('rotated');
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.guest-pill')) closeGuests();
});

/* ============ Galeries des chambres ============ */
// Ajouter ici les photos fournies par catégorie — le compteur "X photos"
// des cartes se met à jour automatiquement.
const galleries = {
  double: {
    title: 'Chambre Double',
    photos: ['/media/rooms/double.webp'],
  },
  twin: {
    title: 'Chambre Twin',
    photos: ['/media/rooms/twin.webp'],
  },
  triple: {
    title: 'Chambre Triple Supérieure',
    photos: ['/media/rooms/triple.webp'],
  },
  quadruple: {
    title: 'Chambre Quadruple Supérieure',
    photos: ['/media/rooms/quadruple.webp'],
  },
};

// Compteurs de photos sur les cartes
document.querySelectorAll('.photo-count').forEach((el) => {
  const n = galleries[el.dataset.count].photos.length;
  el.textContent = n + (n > 1 ? ' photos' : ' photo');
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbCounter = document.getElementById('lb-counter');
let currentGallery = null;
let currentIndex = 0;

function showPhoto() {
  const g = galleries[currentGallery];
  lbImg.src = g.photos[currentIndex];
  lbImg.alt = g.title + ' — photo ' + (currentIndex + 1);
  lbTitle.textContent = g.title;
  lbCounter.textContent = ' — ' + (currentIndex + 1) + ' / ' + g.photos.length;
}

function openGallery(room) {
  currentGallery = room;
  currentIndex = 0;
  showPhoto();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

function stepPhoto(dir) {
  const g = galleries[currentGallery];
  currentIndex = (currentIndex + dir + g.photos.length) % g.photos.length;
  showPhoto();
}

document.querySelectorAll('.loc-card[data-room]').forEach((card) => {
  card.addEventListener('click', () => openGallery(card.dataset.room));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openGallery(card.dataset.room);
    }
  });
});

lightbox.querySelector('.lb-close').addEventListener('click', closeGallery);
lightbox.querySelector('.lb-prev').addEventListener('click', () => stepPhoto(-1));
lightbox.querySelector('.lb-next').addEventListener('click', () => stepPhoto(1));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeGallery();
});
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeGallery();
  if (e.key === 'ArrowLeft') stepPhoto(-1);
  if (e.key === 'ArrowRight') stepPhoto(1);
});

/* ============ Témoignages (carrousel) ============ */
// Sélection d'avis Google authentiques (4-5★) — lien "Voir tous les avis"
// vers la fiche Google pour la transparence.
const reviews = [
  {
    name: 'Clarisse Bochet',
    when: 'il y a une semaine',
    stars: 5,
    text: 'Nouveau propriétaire et très sympa. Très bon rapport qualité-prix. Chambre et salle de bain propres. Petit déjeuner à disposition.',
  },
  {
    name: 'Sylvain Desmarais',
    when: 'novembre 2023',
    stars: 5,
    text: 'Là pour une nuit, nous avons trouvé un accueil des plus chaleureux. Les gérants sont d\'une gentillesse et d\'une amabilité rare à trouver. Tout est là pour prendre soin de vous.',
  },
  {
    name: 'Hocine Hammaci',
    when: 'mars 2023',
    stars: 5,
    text: 'Accueil très sympathique et souriant et surtout très professionnel. J\'ai séjourné 2 nuits et repas, tout était parfait ! Personnel à l\'écoute, nourriture de qualité.',
  },
  {
    name: 'Agnès C.',
    when: 'avril 2023',
    stars: 4,
    text: 'On ne peut que dire bravo à ce couple charmant qui vient de reprendre cet établissement, plein de projets, qui sait réserver un accueil parfait à sa clientèle. Excellent petit-déjeuner très copieux.',
  },
  {
    name: 'daniel fourché',
    when: 'sur Google',
    stars: 5,
    text: 'Un accueil de qualité, le proprio est très sympa et réactif, un petit jardin derrière et belle vue sur celui-ci depuis la chambre. Cet hôtel a beaucoup de charme, 2 nuits très agréables.',
  },
  {
    name: 'marc lemaire',
    when: 'août 2023',
    stars: 4,
    text: 'Nous avons réservé au Château Blanc 5 chambres afin d\'y loger notre famille pour un rassemblement d\'anniversaire. Un hébergement qui a su accueillir tout le monde.',
  },
];

const testiCard = document.querySelector('.testi-card');
const testiName = document.getElementById('testi-name');
const testiWhen = document.getElementById('testi-when');
const testiText = document.getElementById('testi-text');
const testiStars = document.getElementById('testi-stars');
const testiDots = document.getElementById('testi-dots');
let reviewIndex = 0;
let reviewTimer = null;

reviews.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', 'Avis ' + (i + 1));
  dot.addEventListener('click', () => goToReview(i));
  testiDots.appendChild(dot);
});

function renderReview() {
  const r = reviews[reviewIndex];
  testiName.textContent = r.name;
  testiWhen.textContent = r.when + ' · Google';
  testiText.textContent = r.text;
  testiStars.textContent = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
  testiDots.querySelectorAll('.testi-dot').forEach((d, i) => {
    d.classList.toggle('active', i === reviewIndex);
  });
}

function goToReview(i) {
  reviewIndex = (i + reviews.length) % reviews.length;
  testiCard.classList.add('fading');
  testiStars.classList.add('fading');
  setTimeout(() => {
    renderReview();
    testiCard.classList.remove('fading');
    testiStars.classList.remove('fading');
  }, 300);
  restartReviewTimer();
}

function restartReviewTimer() {
  clearInterval(reviewTimer);
  reviewTimer = setInterval(() => goToReview(reviewIndex + 1), 7000);
}

document.getElementById('testi-prev').addEventListener('click', () => goToReview(reviewIndex - 1));
document.getElementById('testi-next').addEventListener('click', () => goToReview(reviewIndex + 1));
testiCard.addEventListener('mouseenter', () => clearInterval(reviewTimer));
testiCard.addEventListener('mouseleave', restartReviewTimer);

renderReview();
restartReviewTimer();

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

  // Testimonials: head then card rise into view
  // (.testi-stars est exclu : sa transition CSS du carrousel entre en
  // conflit avec le tween GSAP et le laisse bloqué à opacity 0)
  gsap.from('.testi-head, .testi-card, .testi-controls, .testi-link', {
    y: 50,
    opacity: 0,
    duration: 0.9,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.testimonials', start: 'top 70%', once: true },
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
