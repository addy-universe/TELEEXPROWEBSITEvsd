/**
 * Teleexpro — Main JavaScript
 * Handles scroll animations, navbar effects, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initNavbarScrolled();
    initShutterText();
    initMobileMenu();
    initHeroFade();
});

/* =========================================================================
   Mobile Menu Toggle
   ========================================================================= */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');
    if (!menuBtn || !navLinks) return;

    // Toggle open/close on hamburger click
    menuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('nav-open');
        menuBtn.classList.toggle('is-open', isOpen);
        menuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when any nav link is tapped
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('nav-open');
            menuBtn.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', false);
        });
    });

    // Close when clicking outside the navbar
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            navLinks.classList.remove('nav-open');
            menuBtn.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', false);
        }
    });
}

/* =========================================================================
   Shutter Brand Text — TELEEXPRO animated reveal
   ========================================================================= */
function initShutterText() {
    const el = document.getElementById('shutterText');
    if (!el) return;

    const text = el.dataset.text || 'TELEEXPRO';
    el.innerHTML = '';

    text.split('').forEach((char, i) => {
        const delay = i * 0.045; // stagger per character

        const wrapper = document.createElement('span');
        wrapper.className = 'shutter-char';

        // Main visible character
        const main = document.createElement('span');
        main.className = 'char-main';
        main.style.animationDelay = `${delay + 0.3}s`;
        main.textContent = char === ' ' ? '\u00A0' : char;

        // Top slice
        const top = document.createElement('span');
        top.className = 'slice slice-top';
        top.style.animationDelay = `${delay}s`;
        top.textContent = char;

        // Mid slice
        const mid = document.createElement('span');
        mid.className = 'slice slice-mid';
        mid.style.animationDelay = `${delay + 0.1}s`;
        mid.textContent = char;

        // Bot slice
        const bot = document.createElement('span');
        bot.className = 'slice slice-bot';
        bot.style.animationDelay = `${delay + 0.2}s`;
        bot.textContent = char;

        wrapper.appendChild(main);
        wrapper.appendChild(top);
        wrapper.appendChild(mid);
        wrapper.appendChild(bot);
        el.appendChild(wrapper);
    });
}


/* =========================================================================
   Navbar Scroll Effect
   ========================================================================= */
function initNavbarScrolled() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* =========================================================================
   Intersection Observer for Scroll Reveal
   ========================================================================= */
function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -10% 0px', // Trigger slightly before it comes into full view
            threshold: 0.1
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => el.classList.add('active'));
    }
}

/* =========================================================================
   Hero Video Fade Out
   ========================================================================= */
function initHeroFade() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        setTimeout(initHeroFade, 100);
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const heroVideo = document.getElementById('video-container');
    const heroSection = document.getElementById('hero');

    if (heroVideo && heroSection) {
        gsap.to(heroVideo, {
            scrollTrigger: {
                trigger: heroSection,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
            opacity: 0,
            ease: "none"
        });
    }
}

/* =========================================================================
   Newsletter Form Submission
   ========================================================================= */
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const success = document.getElementById('newsletterSuccess');
    const inputWrap = form.querySelector('.newsletter-input-wrap');
    const privacy = form.querySelector('.newsletter-privacy');

    // Hide form fields, show success
    inputWrap.style.display = 'none';
    privacy.style.display = 'none';
    success.style.display = 'block';

    // Reset after 6s
    setTimeout(() => {
        inputWrap.style.display = '';
        privacy.style.display = '';
        success.style.display = 'none';
        form.reset();
    }, 6000);
}

/* End of main.js */
