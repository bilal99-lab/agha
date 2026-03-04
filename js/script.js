document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const mobileBtn = document.getElementById('mobile-btn');
    const navLinks = document.getElementById('nav-links');
    const links = navLinks.querySelectorAll('a');

    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close menu on link click
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // --- Active Link Updates on Scroll ---
    const sections = document.querySelectorAll('section, header.hero');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // --- Intersection Observer for Scroll Animations ---
    const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the class that triggers the animation
                entry.target.classList.add('in-view');
                // Optional: stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // --- Fallback check for items already in view on load ---
    setTimeout(() => {
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                el.classList.add('in-view');
            }
        });
    }, 100);

    // --- Testimonial Slider Functionality ---
    const track = document.getElementById('testimonial-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (track && prevBtn && nextBtn) {
        // Calculate scroll amount based on card width
        const scrollAmount = () => {
            const card = track.querySelector('.testimonial-card');
            return card ? card.offsetWidth + 30 : 380; // width + gap
        };

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
        });
    }

    // --- Animated Counting Effect for Trust Stats ---
    const statNumbers = document.querySelectorAll('.stat-number');
    let hasAnimatedStats = false;

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimatedStats) {
                hasAnimatedStats = true;
                statNumbers.forEach(stat => {
                    const target = +stat.getAttribute('data-target');
                    const duration = 2000; // ms
                    const increment = target / (duration / 16); // 60fps

                    let current = 0;

                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            stat.innerText = Math.ceil(current) + (target > 50 ? '+' : '');
                            requestAnimationFrame(updateCounter);
                        } else {
                            stat.innerText = target + (target > 50 ? '+' : '');
                        }
                    };
                    updateCounter();
                });
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats-strip');
    if (statsSection && statNumbers.length > 0) {
        statsObserver.observe(statsSection);
    }
});
