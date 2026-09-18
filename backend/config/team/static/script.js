document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeader();
  initCurrentNavigation();
  initRevealAnimations(prefersReducedMotion);
  initLightbox();
  initMobileMenu();
  initScrollTopButton();
  initHonorModal();
});

function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initCurrentNavigation() {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, "") || "/";

    if (linkPath === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function initRevealAnimations(prefersReducedMotion) {
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if (!revealItems.length) return;

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealPassedItems = () => {
    revealItems.forEach((item) => {
      if (item.classList.contains("is-visible")) return;

      const box = item.getBoundingClientRect();
      const isNearViewport = box.top < window.innerHeight * 1.18;
      const wasSkipped = box.bottom < 0;

      if (isNearViewport || wasSkipped) {
        item.classList.add("is-visible");
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => {
    const box = item.getBoundingClientRect();

    if (box.top < window.innerHeight * 1.18) {
      item.classList.add("is-visible");
      return;
    }

    observer.observe(item);
  });

  revealPassedItems();
  window.addEventListener("scroll", revealPassedItems, { passive: true });
  window.addEventListener("resize", revealPassedItems);
}

function initLightbox() {
  const galleryImages = Array.from(document.querySelectorAll(".gallery img, .lightbox-gallery img"));
  if (!galleryImages.length) return;

  galleryImages.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", "Bild vergrößern");
  });

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Bildansicht">
      <button class="lightbox-close" type="button" aria-label="Schließen">×</button>
      <div class="lightbox-counter" aria-live="polite"></div>
      <button class="lightbox-btn prev" type="button" aria-label="Vorheriges Bild">‹</button>
      <figure class="lightbox-figure">
        <img class="lightbox-img" alt="">
      </figure>
      <button class="lightbox-btn next" type="button" aria-label="Nächstes Bild">›</button>
    </div>
  `;
  document.body.appendChild(lightbox);

  const closeBtn = lightbox.querySelector(".lightbox-close");
  const counter = lightbox.querySelector(".lightbox-counter");
  const prevBtn = lightbox.querySelector(".lightbox-btn.prev");
  const nextBtn = lightbox.querySelector(".lightbox-btn.next");
  const image = lightbox.querySelector(".lightbox-img");

  let currentIndex = 0;
  let lastFocused = null;
  let open = false;

  const normalizeIndex = (index) => (index + galleryImages.length) % galleryImages.length;

  const updateImage = (index, animate = true) => {
    currentIndex = normalizeIndex(index);

    const source = galleryImages[currentIndex];
    const src = source.currentSrc || source.getAttribute("src");
    const alt = source.getAttribute("alt") || `Bild ${currentIndex + 1}`;
    const hasMultipleImages = galleryImages.length > 1;

    prevBtn.hidden = !hasMultipleImages;
    nextBtn.hidden = !hasMultipleImages;
    counter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;

    if (!animate) {
      image.src = src;
      image.alt = alt;
      return;
    }

    image.classList.add("is-switching");

    requestAnimationFrame(() => {
      image.src = src;
      image.alt = alt;
    });

    image.addEventListener(
      "load",
      () => {
        image.classList.remove("is-switching");
      },
      { once: true }
    );
  };

  const openAt = (index) => {
    if (open) return;

    open = true;
    lastFocused = document.activeElement;

    document.body.classList.add("lightbox-open");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");

    updateImage(index, false);
    closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    if (!open) return;

    open = false;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");

    if (lastFocused) {
      lastFocused.focus({ preventScroll: true });
    }
  };

  galleryImages.forEach((galleryImage, index) => {
    galleryImage.addEventListener("click", () => openAt(index));
    galleryImage.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      openAt(index);
    });
  });

  prevBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    updateImage(currentIndex - 1);
  });

  nextBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    updateImage(currentIndex + 1);
  });

  closeBtn.addEventListener("click", close);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lightbox-dialog")) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!open) return;

    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") updateImage(currentIndex - 1);
    if (event.key === "ArrowRight") updateImage(currentIndex + 1);
  });
}

function initMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-controls", mobileMenu.id || "mobile-menu");
  menuToggle.setAttribute("aria-expanded", "false");

  const setMenuOpen = (open) => {
    mobileMenu.classList.toggle("show", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("mobile-menu-open", open);
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!mobileMenu.classList.contains("show"));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("click", (event) => {
    if (!mobileMenu.classList.contains("show")) return;
    if (mobileMenu.contains(event.target) || menuToggle.contains(event.target)) return;

    setMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });
}

function initScrollTopButton() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (!scrollTopBtn) return;

  const toggleButton = () => {
    scrollTopBtn.classList.toggle("show", window.scrollY > 360);
  };

  toggleButton();
  window.addEventListener("scroll", toggleButton, { passive: true });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

function initHonorModal() {
  const modal = document.getElementById("honor-modal");
  const overlay = document.getElementById("honor-modal-overlay");
  const closeBtn = document.getElementById("honor-modal-close");
  const modalImage = document.getElementById("honor-modal-bild");
  const modalImageWrap = document.getElementById("honor-modal-left");
  const modalName = document.getElementById("honor-modal-name");
  const modalText = document.getElementById("honor-modal-text");
  const cards = Array.from(document.querySelectorAll(".honor-card"));

  if (!modal || !overlay || !closeBtn || !modalName || !modalText || !cards.length) return;

  let lastFocused = null;

  const close = () => {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeyDown);

    if (lastFocused) {
      lastFocused.focus({ preventScroll: true });
    }
  };

  function onKeyDown(event) {
    if (event.key === "Escape") close();
  }

  const open = ({ name, text, bild }) => {
    lastFocused = document.activeElement;
    modalName.textContent = name || "";
    modalText.textContent = text || "";

    if (modalImage && modalImageWrap) {
      if (bild) {
        modalImage.src = bild;
        modalImage.alt = name || "";
        modalImageWrap.style.display = "";
      } else {
        modalImage.removeAttribute("src");
        modalImage.alt = "";
        modalImageWrap.style.display = "none";
      }
    }

    document.body.style.overflow = "hidden";
    modal.classList.add("is-open");
    closeBtn.focus({ preventScroll: true });
    document.addEventListener("keydown", onKeyDown);
  };

  cards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${card.dataset.name || "Mitglied"} ansehen`);

    card.addEventListener("click", () => open(card.dataset));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      open(card.dataset);
    });
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);
}
