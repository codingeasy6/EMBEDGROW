/* ==========================================================================
   EMBEDGROW - Senior Front-End UX & Script Functionality
   ========================================================================== */

/**
 * CONFIGURATION VARIABLES
 * Set your real WhatsApp phone number (e.g. "15550192834" or "919876543210")
 */
const WHATSAPP_NUMBER = "918610752189";
const DEFAULT_WHATSAPP_MESSAGE = encodeURIComponent("Hello EMBEDGROW! I would like to inquire about your website or project development services.");

document.addEventListener("DOMContentLoaded", () => {
  initScrollProgress();
  initNavbar();
  initScrollReveal();
  initWhatsAppButton();
  initPortfolioFilters();
  initContactForm();
});

/* --------------------------------------------------------------------------
   1. Scroll Progress Bar Top Indicator
   -------------------------------------------------------------------------- */
function initScrollProgress() {
  const progressBar = document.getElementById("scroll-progress");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + "%";
  });
}

/* --------------------------------------------------------------------------
   2. Sticky Header & Mobile Drawer Control
   -------------------------------------------------------------------------- */
function initNavbar() {
  const header = document.querySelector(".header");
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  // Add scroll shadow class
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  });

  // Mobile menu toggle
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !isExpanded);
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");

      // Prevent scrolling when mobile menu is active
      document.body.style.overflow = navMenu.classList.contains("active") ? "hidden" : "";
    });

    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }
}

/* --------------------------------------------------------------------------
   3. IntersectionObserver Scroll Reveal Animations
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(".reveal-on-scroll");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback for older browsers
    revealElements.forEach(el => el.classList.add("is-visible"));
  }
}

/* --------------------------------------------------------------------------
   4. Dynamic WhatsApp Contact Redirection & Fallback Alert
   -------------------------------------------------------------------------- */
function initWhatsAppButton() {
  const whatsappBtns = document.querySelectorAll(".whatsapp-float, .js-whatsapp-link");
  
  whatsappBtns.forEach(btn => {
    let url = "https://wa.me/";
    if (WHATSAPP_NUMBER && WHATSAPP_NUMBER !== "YOUR_NUMBER") {
      url += `${WHATSAPP_NUMBER}?text=${DEFAULT_WHATSAPP_MESSAGE}`;
    } else {
      url = "https://wa.me/YOUR_NUMBER";
    }

    btn.setAttribute("href", url);
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener noreferrer");
    
    btn.addEventListener("click", (e) => {
      if (WHATSAPP_NUMBER === "YOUR_NUMBER") {
        e.preventDefault();
        alert("WhatsApp Configuration Notice:\nPlease specify your actual WhatsApp number inside js/script.js (const WHATSAPP_NUMBER = 'YOUR_NUMBER') to complete the integration.");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. Smooth Portfolio Filter Grid Animation
   -------------------------------------------------------------------------- */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioCards = document.querySelectorAll(".portfolio-card");

  if (filterBtns.length === 0 || portfolioCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      portfolioCards.forEach((card, index) => {
        const categories = card.getAttribute("data-category")?.split(" ") || [];
        
        if (filterValue === "all" || categories.includes(filterValue)) {
          card.style.display = "flex";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0) scale(1)";
          }, index * 40);
        } else {
          card.style.opacity = "0";
          card.style.transform = "translateY(20px) scale(0.95)";
          setTimeout(() => {
            card.style.display = "none";
          }, 250);
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   6. Professional Form Validation & Loading Toast Simulation
   -------------------------------------------------------------------------- */
function initContactForm() {
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");

  if (!contactForm) return;

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const service = document.getElementById("service")?.value;
    const message = document.getElementById("message")?.value.trim();
    const submitBtn = contactForm.querySelector("button[type='submit']");

    if (!name || !email || !service || !message) {
      showStatus("Please fill in all required fields marked with *.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showStatus("Please enter a valid email address.", "error");
      return;
    }

    // UX Button Loading State
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Submitting Inquiry...`;

      setTimeout(() => {
        showStatus("Thank you! Your inquiry has been sent successfully. Our team will reach out within 24 hours.", "success");
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }, 1000);
    }
  });

  function showStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.className = `form-status-msg ${type}`;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
