// Fixed offers - cannot be customized (10 segments)
const segments = [
    { label: '10% OFF', color: '#1E293B' },
    { label: '25% OFF', color: '#0F172A' },
    { label: '20% OFF', color: '#334155' },
    { label: 'Free Gift', color: '#059669' },
    { label: '5% OFF', color: '#475569' },
    { label: '50% OFF', color: '#047857' },
    { label: 'Better Luck', color: '#CBD5E1' },
    { label: '15% OFF', color: '#1E293B' },
    { label: '30% OFF', color: '#64748B' },
    { label: 'Free Shipping', color: '#059669' }
];

// Wheel state
let currentAngle = 0;
let isSpinning = false;
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');

// Audio context for sound effects
let audioContext = null;
let lastTickAngle = 0;

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play tick sound
function playTickSound() {
    if (!audioContext) initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

// Play win sound
function playWinSound() {
    if (!audioContext) initAudio();
    
    // Play a cheerful melody
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }, index * 100);
    });
}

// Check if user already spun
function hasUserSpun() {
    return localStorage.getItem('hasSpun') === 'true';
}

// Mark user as spun
function markUserSpun() {
    localStorage.setItem('hasSpun', 'true');
    localStorage.setItem('spinDate', new Date().toISOString());
}

// Show already spun message
function showAlreadySpun() {
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<span>Already Spun</span>';
    spinBtn.style.opacity = '0.7';

    // Show message below button
    const container = document.querySelector('.wheel-container');
    let msg = document.querySelector('.spun-msg');
    if (!msg) {
        msg = document.createElement('p');
        msg.className = 'spun-msg';
        msg.style.cssText = 'color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;';
        container.appendChild(msg);
    }
    msg.textContent = 'You have already spun the wheel.';
}

// Initialize
function init() {
    drawWheel();
    setupEventListeners();

    // Initialize Lucide icons
    lucide.createIcons();

    // Initialize history display
    updateHistoryDisplay();

    // Check if already spun
    if (hasUserSpun()) {
        showAlreadySpun();
    }
}

// Draw the wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const anglePerSegment = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    segments.forEach((segment, index) => {
        const startAngle = currentAngle + index * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = getContrastColor(segment.color);
        ctx.font = '17px Montserrat, sans-serif';
        ctx.fillText(segment.label, radius - 25, 5);
        ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
}

// Get contrast color for text
function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#212529' : '#ffffff';
}

// Spin the wheel
function spin() {
    if (isSpinning) return;

    // Check if already spun
    if (hasUserSpun()) {
        showAlreadySpun();
        return;
    }

    // Initialize audio on first user interaction
    initAudio();
    
    isSpinning = true;
    lastTickAngle = 0;

    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;

    // Random spin parameters
    const minSpins = 5;
    const maxSpins = 10;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const finalAngle = spins * 2 * Math.PI;
    const duration = 4000;
    const startTime = performance.now();
    const startAngle = currentAngle;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentAngle = startAngle + finalAngle * easeOut;
        drawWheel();

        // Play tick sound when crossing segment boundaries
        const anglePerSegment = (2 * Math.PI) / segments.length;
        const currentSegment = Math.floor(currentAngle / anglePerSegment);
        if (currentSegment > lastTickAngle) {
            playTickSound();
            lastTickAngle = currentSegment;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            playWinSound();
            showResult();
            showAlreadySpun();
        }
    }

    requestAnimationFrame(animate);
}

// Get winning segment - pointer is at top (270 degrees / 3π/2)
function getWinningSegment() {
    const anglePerSegment = (2 * Math.PI) / segments.length;
    // Pointer is at 270 degrees (3π/2), which is -π/2
    // The angle pointing to the pointer in the wheel's rotated frame
    const pointerAngle = (3 * Math.PI / 2 - currentAngle) % (2 * Math.PI);
    const normalizedAngle = pointerAngle < 0 ? pointerAngle + 2 * Math.PI : pointerAngle;
    const winningIndex = Math.floor(normalizedAngle / anglePerSegment) % segments.length;
    return segments[winningIndex];
}

// Show result
function showResult() {
    const winner = getWinningSegment();
    const resultOverlay = document.getElementById('resultOverlay');
    const resultText = document.getElementById('resultText');

    resultText.textContent = winner.label;
    resultText.style.color = winner.color;
    resultOverlay.classList.add('active');

    // Trigger confetti
    fireConfetti();

    // Mark as spun
    markUserSpun();

    // Store result in localStorage for record
    const history = JSON.parse(localStorage.getItem('spinHistory') || '[]');
    history.unshift({
        prize: winner.label,
        color: winner.color,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('spinHistory', JSON.stringify(history.slice(0, 10)));
    
    // Update history display
    updateHistoryDisplay();
}

// Close result
function closeResult() {
    const resultOverlay = document.getElementById('resultOverlay');
    resultOverlay.classList.remove('active');
}

// Confetti animation
function fireConfetti() {
    const colors = ['#2C3E50', '#34495E', '#2980B9', '#1ABC9C', '#5D6D7E', '#85929E', '#2E4053', '#3498DB'];
    const confettiCount = 150;
    const confetti = [];
    
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 1) * 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
    
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1000';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let animationFrame = 0;
    const duration = 180; // frames
    
    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // gravity
            p.vx *= 0.99; // air resistance
            p.rotation += p.rotationSpeed;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });
        
        animationFrame++;
        
        if (animationFrame < duration) {
            requestAnimationFrame(animateConfetti);
        } else {
            document.body.removeChild(canvas);
        }
    }
    
    animateConfetti();
}

// Update history display
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('historyContainer');
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('spinHistory') || '[]');
    
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">No spins yet</p>';
        return;
    }
    
    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-color" style="background-color: ${item.color}"></div>
            <div class="history-info">
                <span class="history-prize">${item.prize}</span>
                <span class="history-date">${item.date}</span>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('spinBtn').addEventListener('click', spin);
    document.getElementById('closeBtn').addEventListener('click', closeResult);

    // Close overlay on backdrop click
    document.getElementById('resultOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'resultOverlay') {
            closeResult();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeResult();
        }
    });
}

// Start - wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
