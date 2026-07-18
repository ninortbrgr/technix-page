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

(() => {
  const galleryImages = Array.from(document.querySelectorAll(".gallery img, .lightbox-gallery img"));
  if (galleryImages.length === 0) return;

  galleryImages.forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Bild öffnen");
  });

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Bildansicht">
      <button class="lightbox-close" type="button" aria-label="Schließen">×</button>
      <div class="lightbox-counter" aria-live="polite" aria-atomic="true"></div>
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

  const normalizeIndex = (index) => {
    if (galleryImages.length === 0) return 0;
    return (index + galleryImages.length) % galleryImages.length;
  };

  const preloadNeighbors = (index) => {
    if (galleryImages.length <= 1) return;
    const prevIndex = normalizeIndex(index - 1);
    const nextIndex = normalizeIndex(index + 1);
    [prevIndex, nextIndex].forEach((i) => {
      const src = galleryImages[i].currentSrc || galleryImages[i].src;
      if (!src) return;
      const preloader = new Image();
      preloader.src = src;
    });
  };

  const setImage = (index, { animate } = { animate: true }) => {
    const i = normalizeIndex(index);
    currentIndex = i;

    const source = galleryImages[i];
    const src = source.currentSrc || source.src;
    const alt = source.getAttribute("alt") || `Bild ${i + 1}`;

    prevBtn.style.display = galleryImages.length > 1 ? "" : "none";
    nextBtn.style.display = galleryImages.length > 1 ? "" : "none";
    counterEl.textContent = `${i + 1} / ${galleryImages.length}`;

    if (!animate) {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
      preloadNeighbors(i);
      return;
    }

    lightboxImg.classList.add("is-switching");

    const apply = () => {
      lightboxImg.alt = alt;
      lightboxImg.src = src;
      preloadNeighbors(i);
    };

    const onLoad = () => {
      lightboxImg.classList.remove("is-switching");
      lightboxImg.removeEventListener("load", onLoad);
      lightboxImg.removeEventListener("error", onLoad);
    };

    lightboxImg.addEventListener("load", onLoad);
    lightboxImg.addEventListener("error", onLoad);

    requestAnimationFrame(apply);
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
    document.addEventListener("keydown", onKeyDown);
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    document.removeEventListener("keydown", onKeyDown);

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
  };

  const prev = () => setImage(currentIndex - 1, { animate: true });
  const next = () => setImage(currentIndex + 1, { animate: true });

  function onKeyDown(event) {
    if (!isOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  }

  galleryImages.forEach((img, idx) => {
    img.addEventListener("click", () => openAt(idx));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAt(idx);
      }
    });
  });

  prevBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    prev();
  });
  nextBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    next();
  });
  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    close();
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  dialog.addEventListener("click", (event) => event.stopPropagation());
})();