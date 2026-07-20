document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. SCROLL ANIMATIONEN (Intersection Observer)
  // ==========================================
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // ==========================================
  // 2. LIGHTBOX GALERIE
  // ==========================================
  (() => {
    const galleryImages = Array.from(document.querySelectorAll(".gallery img, .lightbox-gallery img"));
    if (galleryImages.length === 0) return;

    galleryImages.forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Bild vergrößern");
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

    const dialog = lightbox.querySelector(".lightbox-dialog");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const counterEl = lightbox.querySelector(".lightbox-counter");
    const prevBtn = lightbox.querySelector(".lightbox-btn.prev");
    const nextBtn = lightbox.querySelector(".lightbox-btn.next");
    const lightboxImg = lightbox.querySelector(".lightbox-img");

    let currentIndex = 0;
    let lastFocused = null;
    let isOpen = false;

    const normalizeIndex = (index) => (index + galleryImages.length) % galleryImages.length;

    const setImage = (index, { animate } = { animate: true }) => {
      currentIndex = normalizeIndex(index);
      const source = galleryImages[currentIndex];
      const src = source.currentSrc || source.getAttribute("src");
      const alt = source.getAttribute("alt") || `Bild ${currentIndex + 1}`;

      prevBtn.style.display = galleryImages.length > 1 ? "" : "none";
      nextBtn.style.display = galleryImages.length > 1 ? "" : "none";
      counterEl.textContent = `${currentIndex + 1} / ${galleryImages.length}`;

      if (!animate) {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        return;
      }

      lightboxImg.classList.add("is-switching");
      requestAnimationFrame(() => {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
      });

      const onLoad = () => {
        lightboxImg.classList.remove("is-switching");
        lightboxImg.removeEventListener("load", onLoad);
      };
      lightboxImg.addEventListener("load", onLoad);
    };

    const openAt = (index) => {
      if (isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;

      document.body.classList.add("lightbox-open");
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");

      setImage(index, { animate: false });
      closeBtn.focus({ preventScroll: true });
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;

      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");

      if (lastFocused) lastFocused.focus({ preventScroll: true });
    };

    const prev = () => setImage(currentIndex - 1, { animate: true });
    const next = () => setImage(currentIndex + 1, { animate: true });

    document.addEventListener("keydown", (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });

    galleryImages.forEach((img, idx) => {
      img.addEventListener("click", () => openAt(idx));
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAt(idx);
        }
      });
    });

    prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prev(); });
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); next(); });
    closeBtn.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target === dialog) close();
    });
  })();

  // ==========================================
  // 3. MOBILE MENU & SIDEBAR
  // ==========================================
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (menuToggle && mobileMenu) {
    // Öffnen & Schließen über den Button
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation(); // Verhindert sofortiges Schließen durch den document-Klicker
      mobileMenu.classList.toggle("show");
    });

    // Sidebar schließen, wenn man irgendwo ins Leere klickt
    document.addEventListener("click", (event) => {
      if (mobileMenu.classList.contains("show")) {
        // Prüfen, ob der Klick außerhalb des Menüs und außerhalb des Buttons war
        if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
          mobileMenu.classList.remove("show");
        }
      }
    });

    // Sidebar schließen, wenn man auf einen Link darin klickt (bessere User Experience)
    const menuLinks = mobileMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("show");
      });
    });
  } else {
    console.warn("Mobile Menu Element(e) nicht gefunden! Prüfe die Klassen '.menu-toggle' und '.mobile-menu' im HTML.");
  }
});

  // ==========================================
  // 3. Back to Top Button
  // ==========================================
const scrollTopBtn = document.getElementById("scrollTopBtn");

// Button ein- und ausblenden
window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        scrollTopBtn.classList.add("show");
    } else {
        scrollTopBtn.classList.remove("show");
    }
});

// Nach oben scrollen
scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});