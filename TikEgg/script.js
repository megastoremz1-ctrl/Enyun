/* ============================================
   TikEgg Overlay - Main Game Logic
   ============================================ */

class TikEggGame {
    constructor() {
        // State
        this.progress = 0;
        this.maxProgress = 100;
        this.totalGifts = 0;
        this.totalHatched = 0;
        this.giftHistory = [];
        this.gifterStats = {};
        this.isHatching = false;
        this.currentAnimal = null;

        // Gift values (customize as needed)
        this.giftValues = {
            'Rose': 1,
            'TikTok': 1,
            'Like': 1,
            'Heart': 1,
            'Ice Cream Cone': 2,
            'Finger Heart': 5,
            'GG': 5,
            'Doughnut': 10,
            'Love You': 15,
            'Cap': 20,
            'Sunglasses': 25,
            'Hand Hearts': 50,
            'Corgi': 100,
            'Galaxy': 500,
            'Universe': 1000,
            'Lion': 2000,
            'Dragon': 5000
        };

        // Gift icons mapping
        this.giftIcons = {
            'Rose': '🌹',
            'TikTok': '🎵',
            'Like': '👍',
            'Heart': '❤️',
            'Ice Cream Cone': '🍦',
            'Finger Heart': '🫰',
            'GG': '🎮',
            'Doughnut': '🍩',
            'Love You': '💕',
            'Cap': '🧢',
            'Sunglasses': '😎',
            'Hand Hearts': '🙌',
            'Corgi': '🐕',
            'Galaxy': '🌌',
            'Universe': '🌍',
            'Lion': '🦁',
            'Dragon': '🐲'
        };

        // Animals pool with rarity
        this.animals = [
            { name: 'Pintinho', file: 'chick.svg', rarity: 'common', emoji: '🐣' },
            { name: 'Patinho', file: 'duck.svg', rarity: 'common', emoji: '🦆' },
            { name: 'Coelhinho', file: 'fox.svg', rarity: 'uncommon', emoji: '🐰' },
            { name: 'Raposa', file: 'fox.svg', rarity: 'uncommon', emoji: '🦊' },
            { name: 'Leao', file: 'lion.svg', rarity: 'rare', emoji: '🦁' },
            { name: 'Unicornio', file: 'unicorn.svg', rarity: 'epic', emoji: '🦄' },
            { name: 'Dragao', file: 'dragon.svg', rarity: 'legendary', emoji: '🐲' },
            { name: 'Phoenix', file: 'dragon.svg', rarity: 'legendary', emoji: '🔥' }
        ];

        // Rarity weights (higher = more common)
        this.rarityWeights = {
            'common': 40,
            'uncommon': 30,
            'rare': 18,
            'epic': 9,
            'legendary': 3
        };

        // DOM elements
        this.elements = {
            eggImage: document.getElementById('egg-image'),
            eggContainer: document.getElementById('egg-container'),
            eggGlow: document.getElementById('egg-glow'),
            eggSection: document.getElementById('egg-section'),
            progressFill: document.getElementById('progress-bar-fill'),
            progressText: document.getElementById('progress-text'),
            giftSection: document.getElementById('gift-section'),
            giftIcon: document.getElementById('gift-icon'),
            giftName: document.getElementById('gift-name'),
            giftUser: document.getElementById('gift-user'),
            giftValue: document.getElementById('gift-value'),
            historyList: document.getElementById('history-list'),
            hatchAnimal: document.getElementById('hatch-animal'),
            animalImage: document.getElementById('animal-image'),
            animalName: document.getElementById('animal-name'),
            animalRarity: document.getElementById('animal-rarity'),
            celebrationOverlay: document.getElementById('celebration-overlay'),
            celebrationText: document.getElementById('celebration-text'),
            statTotal: document.getElementById('stat-total'),
            statHatched: document.getElementById('stat-hatched'),
            statTopGifter: document.getElementById('stat-top-gifter'),
            particlesCanvas: document.getElementById('particles-canvas')
        };

        // Audio
        this.sounds = {
            gift: new Audio('assets/sounds/gift.mp3'),
            hatch: new Audio('assets/sounds/hatch.mp3'),
            legendary: new Audio('assets/sounds/legendary.mp3')
        };

        // Preload sounds (won't error if files missing)
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5;
            sound.load();
        });

        // Initialize
        this.init();
    }

    init() {
        this.updateProgressBar();
        this.updateStats();
        this.initParticles();
        console.log('🥚 TikEgg Overlay initialized!');
        console.log('📡 Waiting for WebSocket connection...');
    }

    // ==========================================
    // Gift Processing
    // ==========================================

    processGift(data) {
        if (this.isHatching) return;

        const { user, gift, value } = data;
        
        // Calculate progress value
        let progressValue = value || this.giftValues[gift] || 1;

        // Update stats
        this.totalGifts++;
        this.gifterStats[user] = (this.gifterStats[user] || 0) + progressValue;

        // Add to history
        this.addToHistory(user, gift, progressValue);

        // Show gift popup
        this.showGiftPopup(user, gift, progressValue);

        // Play gift sound
        this.playSound('gift');

        // Shake the egg
        this.shakeEgg(progressValue);

        // Update progress
        this.addProgress(progressValue);

        // Float text
        this.showFloatText(`+${progressValue}%`);

        // Update stats display
        this.updateStats();
    }

    // ==========================================
    // Progress Management
    // ==========================================

    addProgress(amount) {
        const oldProgress = this.progress;
        this.progress = Math.min(this.progress + amount, this.maxProgress);

        // Update egg image based on progress
        this.updateEggImage();

        // Animate progress bar
        this.updateProgressBar();

        // Update glow intensity
        this.updateGlowIntensity();

        // Check if hatching
        if (this.progress >= this.maxProgress && oldProgress < this.maxProgress) {
            setTimeout(() => this.startHatching(), 800);
        }
    }

    updateProgressBar() {
        const percentage = (this.progress / this.maxProgress) * 100;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${Math.round(percentage)}%`;
    }

    updateEggImage() {
        const percentage = (this.progress / this.maxProgress) * 100;
        let eggFile = 'egg0.svg';

        if (percentage >= 100) eggFile = 'egg100.svg';
        else if (percentage >= 75) eggFile = 'egg75.svg';
        else if (percentage >= 50) eggFile = 'egg50.svg';
        else if (percentage >= 25) eggFile = 'egg25.svg';

        this.elements.eggImage.src = `assets/eggs/${eggFile}`;
    }

    updateGlowIntensity() {
        const intensity = this.progress / this.maxProgress;
        const size = 250 + (intensity * 100);
        const opacity = 0.3 + (intensity * 0.7);
        
        this.elements.eggGlow.style.width = `${size}px`;
        this.elements.eggGlow.style.height = `${size}px`;
        this.elements.eggGlow.style.opacity = opacity;

        // Change glow color based on progress
        if (intensity > 0.75) {
            this.elements.eggGlow.style.background = 
                'radial-gradient(circle, rgba(255, 69, 0, 0.4) 0%, transparent 70%)';
        } else if (intensity > 0.5) {
            this.elements.eggGlow.style.background = 
                'radial-gradient(circle, rgba(255, 217, 61, 0.4) 0%, transparent 70%)';
        }
    }

    // ==========================================
    // Egg Animations
    // ==========================================

    shakeEgg(intensity) {
        const el = this.elements.eggContainer;
        el.classList.remove('shake', 'shake-intense');

        // Force reflow
        void el.offsetWidth;

        if (intensity >= 10) {
            el.classList.add('shake-intense');
        } else {
            el.classList.add('shake');
        }

        setTimeout(() => {
            el.classList.remove('shake', 'shake-intense');
        }, 800);
    }

    showFloatText(text) {
        const floatEl = document.createElement('div');
        floatEl.className = 'float-text';
        floatEl.textContent = text;
        
        // Position near the egg
        const eggRect = this.elements.eggSection.getBoundingClientRect();
        floatEl.style.left = `${eggRect.left + eggRect.width / 2 + (Math.random() * 60 - 30)}px`;
        floatEl.style.top = `${eggRect.top + 20}px`;

        document.body.appendChild(floatEl);

        setTimeout(() => {
            floatEl.remove();
        }, 1500);
    }

    // ==========================================
    // Hatching
    // ==========================================

    startHatching() {
        this.isHatching = true;

        // Intense shake
        this.elements.eggContainer.classList.add('shake-intense');

        // Play hatch sound
        this.playSound('hatch');

        // After shake, show animal
        setTimeout(() => {
            this.elements.eggContainer.style.display = 'none';
            this.elements.eggGlow.style.display = 'none';

            // Pick random animal
            this.currentAnimal = this.pickRandomAnimal();
            
            // Show animal
            this.showAnimal(this.currentAnimal);

            // Show celebration
            this.showCelebration(this.currentAnimal);

            // Fire confetti
            if (window.ConfettiEngine) {
                const confetti = new window.ConfettiEngine('confetti-canvas');
                confetti.fire(this.currentAnimal.rarity);
            }

            // Play legendary sound for epic+ rarity
            if (this.currentAnimal.rarity === 'legendary' || this.currentAnimal.rarity === 'epic') {
                this.playSound('legendary');
            }

            // Update hatched count
            this.totalHatched++;
            this.updateStats();

            // Reset after delay
            setTimeout(() => this.resetEgg(), 6000);
        }, 1500);
    }

    pickRandomAnimal() {
        // Weighted random selection
        const totalWeight = Object.values(this.rarityWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        let selectedRarity = 'common';
        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            random -= weight;
            if (random <= 0) {
                selectedRarity = rarity;
                break;
            }
        }

        // Filter animals by rarity
        const pool = this.animals.filter(a => a.rarity === selectedRarity);
        return pool[Math.floor(Math.random() * pool.length)];
    }

    showAnimal(animal) {
        this.elements.hatchAnimal.classList.remove('hidden');
        this.elements.animalImage.src = `assets/animals/${animal.file}`;
        this.elements.animalName.textContent = `${animal.emoji} ${animal.name}`;
        this.elements.animalRarity.textContent = animal.rarity.toUpperCase();
        this.elements.animalRarity.className = `rarity-${animal.rarity}`;

        // Trigger animation
        setTimeout(() => {
            this.elements.hatchAnimal.classList.add('visible');
        }, 100);
    }

    showCelebration(animal) {
        const messages = {
            'common': 'Novo Amigo!',
            'uncommon': 'Que Legal!',
            'rare': 'RARO!',
            'epic': 'EPICO!!',
            'legendary': 'LENDARIO!!!'
        };

        this.elements.celebrationText.textContent = messages[animal.rarity] || 'Parabens!';
        this.elements.celebrationOverlay.classList.remove('hidden');

        setTimeout(() => {
            this.elements.celebrationOverlay.classList.add('hidden');
        }, 3000);
    }

    resetEgg() {
        // Hide animal
        this.elements.hatchAnimal.classList.remove('visible');
        setTimeout(() => {
            this.elements.hatchAnimal.classList.add('hidden');
        }, 500);

        // Reset progress
        this.progress = 0;
        this.updateProgressBar();

        // Show egg again
        this.elements.eggContainer.style.display = 'block';
        this.elements.eggGlow.style.display = 'block';
        this.elements.eggImage.src = 'assets/eggs/egg0.svg';

        // Reset glow
        this.elements.eggGlow.style.background = 
            'radial-gradient(circle, rgba(196, 77, 255, 0.3) 0%, transparent 70%)';
        this.elements.eggGlow.style.width = '250px';
        this.elements.eggGlow.style.height = '250px';
        this.elements.eggGlow.style.opacity = 0.6;

        this.isHatching = false;
        console.log('🥚 New egg ready!');
    }

    // ==========================================
    // Gift Popup
    // ==========================================

    showGiftPopup(user, gift, value) {
        const icon = this.giftIcons[gift] || '🎁';

        this.elements.giftIcon.textContent = icon;
        this.elements.giftName.textContent = gift;
        this.elements.giftUser.textContent = user;
        this.elements.giftValue.textContent = `+${value}%`;

        this.elements.giftSection.classList.remove('hidden');

        // Re-trigger animation
        const popup = document.getElementById('gift-popup');
        popup.style.animation = 'none';
        void popup.offsetWidth;
        popup.style.animation = 'slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        // Hide after delay
        clearTimeout(this._giftTimeout);
        this._giftTimeout = setTimeout(() => {
            this.elements.giftSection.classList.add('hidden');
        }, 4000);
    }

    // ==========================================
    // History
    // ==========================================

    addToHistory(user, gift, value) {
        const icon = this.giftIcons[gift] || '🎁';

        this.giftHistory.unshift({ user, gift, value, icon });

        // Keep only last 5
        if (this.giftHistory.length > 5) {
            this.giftHistory.pop();
        }

        this.renderHistory();
    }

    renderHistory() {
        this.elements.historyList.innerHTML = '';

        this.giftHistory.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <span class="history-icon">${item.icon}</span>
                <span class="history-user">${item.user}</span>
                <span class="history-value">+${item.value}%</span>
            `;
            this.elements.historyList.appendChild(el);
        });
    }

    // ==========================================
    // Stats
    // ==========================================

    updateStats() {
        this.elements.statTotal.textContent = this.totalGifts;
        this.elements.statHatched.textContent = this.totalHatched;

        // Find top gifter
        let topGifter = '-';
        let topValue = 0;
        for (const [user, total] of Object.entries(this.gifterStats)) {
            if (total > topValue) {
                topValue = total;
                topGifter = user;
            }
        }
        this.elements.statTopGifter.textContent = topGifter;
    }

    // ==========================================
    // Audio
    // ==========================================

    playSound(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {
                // Audio play might fail without user interaction
            });
        }
    }

    // ==========================================
    // Background Particles
    // ==========================================

    initParticles() {
        const canvas = this.elements.particlesCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                color: `hsl(${Math.random() * 60 + 260}, 70%, 70%)`
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();

                p.x += p.speedX;
                p.y += p.speedY;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });

            ctx.globalAlpha = 1;
            requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
}

// ==========================================
// Initialize Game
// ==========================================

const game = new TikEggGame();

// Expose for WebSocket handler
window.TikEggGame = game;

// ==========================================
// Demo / Test Mode
// ==========================================

// Uncomment below to test without WebSocket:
// setInterval(() => {
//     const users = ['Samad Jr', 'Maria', 'Pedro', 'Ana', 'Lucas'];
//     const gifts = ['Rose', 'Heart', 'Finger Heart', 'Doughnut', 'Galaxy'];
//     game.processGift({
//         user: users[Math.floor(Math.random() * users.length)],
//         gift: gifts[Math.floor(Math.random() * gifts.length)],
//         value: Math.floor(Math.random() * 10) + 1
//     });
// }, 3000);
