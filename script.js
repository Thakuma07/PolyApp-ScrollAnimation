gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {

    // ✅ SAFETY CHECK
    if (typeof Lenis === "undefined") {
        console.error("Lenis is not loaded. Check CDN order in index.html");
        return;
    }

    const lenis = new Lenis();

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const CONFIG = {
        cardCount: 15,
        cardWidth: 250,
        cardHeight: 300,
        animationDuration: 0.75,
        animationOverlap: 0.5,
        headingFadeDuration: 0.5,
        headings: [
            "Order its temporary while you're passing through",
            "memories shuffle like cards in an endless deck",
            "Each moment scatters as another takes its place",
            "The fragments float before settings once more",
        ],
    };

    const gallery = document.querySelector(".gallery");
    const galleryHeading = document.querySelector(".gallery h1");

    let viewport = {
        centerX: window.innerWidth / 2,
        centerY: window.innerHeight / 2,
        rangeMin: Math.min(window.innerWidth, window.innerHeight) * 0.35,
        rangeMax: Math.min(window.innerWidth, window.innerHeight) * 0.7,
    };

    let state = {
        activeCards: [],
        currentSection: 0,
        isAnimating: false,
    };

    function updateViewport() {
        viewport.centerX = window.innerWidth / 2;
        viewport.centerY = window.innerHeight / 2;
        viewport.rangeMin = Math.min(window.innerWidth, window.innerHeight) * 0.35;
        viewport.rangeMax = Math.min(window.innerWidth, window.innerHeight) * 0.7;
    }

    function getEdgePosition(centerX, centerY) {
        const distances = {
            left: centerX,
            right: window.innerWidth - centerX,
            top: centerY,
            bottom: window.innerHeight - centerY,
        };

        const minDistance = Math.min(...Object.values(distances));
        const offset = () => (Math.random() - 0.5) * 400;

        if (minDistance === distances.left)
            return { x: -300, y: centerY + offset() };

        if (minDistance === distances.right)
            return { x: window.innerWidth + 300, y: centerY + offset() };

        if (minDistance === distances.top)
            return { x: centerX + offset(), y: -300 };

        return { x: centerX + offset(), y: window.innerHeight + 300 };
    }

    function createCards(setNumber) {
        const cards = [];

        for (let i = 0; i < CONFIG.cardCount; i++) {
            const card = document.createElement("div");
            card.classList.add("card");

            const img = document.createElement("img");
            img.src = `assets/set${setNumber}/img${i + 1}.jpg`;
            card.appendChild(img);

            const angle = Math.random() * Math.PI * 2;
            const radius =
                viewport.rangeMin +
                Math.random() * (viewport.rangeMax - viewport.rangeMin);

            const centerX = viewport.centerX + Math.cos(angle) * radius;
            const centerY = viewport.centerY + Math.sin(angle) * radius;

            gsap.set(card, {
                left: centerX - CONFIG.cardWidth / 2,
                top: centerY - CONFIG.cardHeight / 2,
                rotation: Math.random() * 50 - 25,
            });

            gallery.appendChild(card);
            cards.push({ element: card, centerX, centerY });
        }

        return cards;
    }

    function animateHeading(newText) {
        return gsap.timeline()
            .to(galleryHeading, {
                opacity: 0,
                duration: CONFIG.headingFadeDuration,
                ease: "power2.inOut",
            })
            .call(() => {
                galleryHeading.textContent = newText;
            })
            .to(galleryHeading, {
                opacity: 1,
                duration: CONFIG.headingFadeDuration,
                ease: "power2.inOut",
            });
    }

    function animateCards(exitingCards, enteringCards) {
        const tl = gsap.timeline();

        exitingCards.forEach(({ element, centerX, centerY }) => {
            const targetEdge = getEdgePosition(centerX, centerY);
            tl.to(element, {
                left: targetEdge.x,
                top: targetEdge.y,
                rotation: Math.random() * 180 - 90,
                duration: CONFIG.animationDuration,
                ease: "power2.in",
                onComplete: () => element.remove(),
            }, 0);
        });

        enteringCards.forEach(({ element, centerX, centerY }) => {
            const targetEdge = getEdgePosition(centerX, centerY);
            gsap.set(element, {
                left: targetEdge.x,
                top: targetEdge.y,
                rotation: Math.random() * 180 - 90,
            });

            tl.to(element, {
                left: centerX - CONFIG.cardWidth / 2,
                top: centerY - CONFIG.cardHeight / 2,
                rotation: Math.random() * 50 - 25,
                duration: CONFIG.animationDuration,
                ease: "power2.out",
            }, CONFIG.animationOverlap);
        });

        return tl;
    }

    function getSectionIndex(progress) {
        if (progress < 0.25) return 0;
        if (progress < 0.5) return 1;
        if (progress < 0.75) return 2;
        return 3;
    }

    function reinitialize() {
        state.activeCards.forEach(({ element }) => element.remove());
        updateViewport();
        state.activeCards = createCards(state.currentSection + 1);
    }

    state.activeCards = createCards(1);
    galleryHeading.textContent = CONFIG.headings[0];
    gsap.set(galleryHeading, { opacity: 1 });

    ScrollTrigger.create({
        trigger: ".gallery",
        start: "top top",
        end: () => `+=${window.innerHeight * 6}`,
        pin: true,
        pinSpacing: true,
        onUpdate: ({ progress }) => {
            if (state.isAnimating) return;

            const targetSection = getSectionIndex(progress);
            if (targetSection === state.currentSection) return;

            state.isAnimating = true;
            const newCards = createCards(targetSection + 1);

            Promise.all([
                animateCards(state.activeCards, newCards),
                animateHeading(CONFIG.headings[targetSection]),
            ]).then(() => {
                state.activeCards = newCards;
                state.currentSection = targetSection;
                state.isAnimating = false;
            });
        },
    });

    window.addEventListener("resize", () => {
        reinitialize();
        ScrollTrigger.refresh();
    });
});
