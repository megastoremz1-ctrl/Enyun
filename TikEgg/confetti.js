/* ============================================
   TikEgg Overlay - Confetti & Particle Engine
   ============================================ */

class ConfettiEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ==========================================
    // Fire Confetti based on rarity
    // ==========================================

    fire(rarity = 'common') {
        const configs = {
            common: {
                count: 50,
                colors: ['#a0a0a0', '#c0c0c0', '#ffffff', '#e0e0e0'],
                spread: 60,
                velocity: 8,
                gravity: 0.4,
                duration: 2000
            },
            uncommon: {
                count: 80,
                colors: ['#6bcf7f', '#4db86a', '#a8e6cf', '#ffffff'],
                spread: 70,
                velocity: 10,
                gravity: 0.35,
                duration: 2500
            },
            rare: {
                count: 120,
                colors: ['#4db8ff', '#2196f3', '#80d4ff', '#ffffff', '#e3f2fd'],
                spread: 80,
                velocity: 12,
                gravity: 0.3,
                duration: 3000
            },
            epic: {
                count: 180,
                colors: ['#c44dff', '#9c27b0', '#e040fb', '#f3e5f5', '#ff6ff0', '#ffffff'],
                spread: 90,
                velocity: 14,
                gravity: 0.25,
                duration: 3500
            },
            legendary: {
                count: 300,
                colors: ['#ff4500', '#ff6b00', '#ffd700', '#ffeb3b', '#ff9800', '#ffffff', '#ff1744'],
                spread: 120,
                velocity: 18,
                gravity: 0.2,
                duration: 5000
            }
        };

        const config = configs[rarity] || configs.common;
        this.launchConfetti(config);
    }

    // ==========================================
    // Launch Confetti Burst
    // ==========================================

    launchConfetti(config) {
        const { count, colors, spread, velocity, gravity, duration } = config;

        // Create particles from center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (let i = 0; i < count; i++) {
            const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180) - Math.PI / 2;
            const speed = velocity * (0.5 + Math.random() * 0.5);

            this.particles.push({
                x: centerX + (Math.random() * 40 - 20),
                y: centerY + (Math.random() * 40 - 20),
                vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                vy: Math.sin(angle) * speed - Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 3,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravity: gravity,
                friction: 0.98,
                opacity: 1,
                fadeSpeed: 1 / (duration / 16),
                shape: Math.random() > 0.5 ? 'rect' : 'circle',
                width: Math.random() * 10 + 4,
                height: Math.random() * 6 + 2
            });
        }

        // Also add some from top
        for (let i = 0; i < count / 3; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8,
                gravity: gravity * 0.5,
                friction: 0.99,
                opacity: 1,
                fadeSpeed: 0.5 / (duration / 16),
                shape: Math.random() > 0.3 ? 'rect' : 'circle',
                width: Math.random() * 8 + 3,
                height: Math.random() * 5 + 2
            });
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    // ==========================================
    // Star Burst (for legendary)
    // ==========================================

    starBurst() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const starColors = ['#ffd700', '#ff6b00', '#ff4500', '#ffffff'];

        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const speed = 5 + Math.random() * 10;

            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                size: Math.random() * 4 + 2,
                rotation: 0,
                rotationSpeed: 0,
                gravity: 0.05,
                friction: 0.96,
                opacity: 1,
                fadeSpeed: 0.015,
                shape: 'circle',
                width: 4,
                height: 4,
                glow: true
            });
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    // ==========================================
    // Animation Loop
    // ==========================================

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update physics
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.opacity -= p.fadeSpeed;

            // Remove dead particles
            if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw particle
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation * Math.PI / 180);
            this.ctx.globalAlpha = p.opacity;

            if (p.glow) {
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
            }

            this.ctx.fillStyle = p.color;

            if (p.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            }

            this.ctx.restore();
        }

        // Continue or stop
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isRunning = false;
        }
    }

    // ==========================================
    // Quick Effects
    // ==========================================

    // Simple burst from a point
    burst(x, y, count = 20, colors = ['#ffd700', '#ff6b9d', '#c44dff']) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                gravity: 0.1,
                friction: 0.95,
                opacity: 1,
                fadeSpeed: 0.02,
                shape: Math.random() > 0.5 ? 'rect' : 'circle',
                width: Math.random() * 6 + 2,
                height: Math.random() * 4 + 2
            });
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    // Sparkle effect
    sparkle(x, y) {
        const sparkleColors = ['#ffffff', '#ffd700', '#ffffcc'];
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + (Math.random() * 30 - 15),
                y: y + (Math.random() * 30 - 15),
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
                size: Math.random() * 3 + 1,
                rotation: 0,
                rotationSpeed: 0,
                gravity: 0.02,
                friction: 0.98,
                opacity: 1,
                fadeSpeed: 0.03,
                shape: 'circle',
                width: 2,
                height: 2,
                glow: true
            });
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
}

// Expose globally
window.ConfettiEngine = ConfettiEngine;
