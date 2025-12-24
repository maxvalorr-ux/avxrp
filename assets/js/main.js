document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('mainHeader');
    const scrollProgress = document.getElementById('scrollProgress');
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const playerCount = document.getElementById('playerCount');

    const scrollTopBtn = document.getElementById('scrollTop');

    // Scroll Effects
    window.addEventListener('scroll', () => {
        // Header Blur
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }

        // Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (scrollProgress) scrollProgress.style.width = scrolled + "%";

        // Scroll Top Button
        if (scrollTopBtn) {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('active');
            } else {
                scrollTopBtn.classList.remove('active');
            }
        }
    });

    // Scroll Top Click
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Mobile Menu Toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Dynamic Player Count Mock
    if (playerCount) {
        let count = parseInt(playerCount.textContent);
        setInterval(() => {
            const change = Math.floor(Math.random() * 5) - 2;
            count = Math.max(800, Math.min(1200, count + change));
            playerCount.textContent = count;
        }, 5000);
    }

    // Live Terminal Simulation
    const terminalLogs = document.getElementById('terminalLogs');
    if (terminalLogs) {
        const events = [
            "New citizen registered at City Hall.",
            "Vehicle listing deployed on XENO Market.",
            "Security alert: Illegal substation activity detected.",
            "Economy update: XENO coin value stabilized.",
            "Emergency Services: Unit dispatched to 402 Market St.",
            "Global message: Whitelist applications now OPEN.",
            "Transaction successful: Infernus X-200 transferred.",
            "Citizen #742 updated their physical assets profile.",
            "Atmosphere update: Sandstorm approaching from North."
        ];

        setInterval(() => {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false });
            const event = events[Math.floor(Math.random() * events.length)];
            const log = document.createElement('div');
            log.className = 'log-entry';
            log.innerHTML = `
                <span class="timestamp">[${time}]</span>
                <span class="action">${event.toUpperCase()}</span>
            `;
            terminalLogs.prepend(log);

            if (terminalLogs.children.length > 10) {
                terminalLogs.removeChild(terminalLogs.lastChild);
            }
        }, 3000);
    }
});
