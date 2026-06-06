/* ═══════════════════════════════════════════════════
   LIVE CLOCK IN NAV
═══════════════════════════════════════════════════ */
const navTime = document.getElementById('navTime');
const footerClock = document.getElementById('footerClock');

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  
  const timeStr = `${h}:${m} ${ampm}`;
  if (navTime) navTime.textContent = timeStr;
  if (footerClock) footerClock.textContent = timeStr;
}
updateClock();
setInterval(updateClock, 10000);

/* ═══════════════════════════════════════════════════
   HAMBURGER MENU
═══════════════════════════════════════════════════ */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const menuBackdrop = document.getElementById('menuBackdrop');

function openMobileMenu() {
  mobileMenu.classList.add('open');
  menuBackdrop.classList.add('visible');
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  menuBackdrop.classList.remove('visible');
}

if (hamburger) {
  hamburger.addEventListener('click', openMobileMenu);
}
if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', closeMobileMenu);
}
if (menuBackdrop) {
  menuBackdrop.addEventListener('click', closeMobileMenu);
}

// Automatically close mobile menu when scaling up to desktop view
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMobileMenu();
  }
});

// Close mobile menu on link click
if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
}

/* ═══════════════════════════════════════════════════
   STICKY NAV SHADOW (Removed since nav is absolute)
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SLIDING NAV PILL HOVER ANIMATION
═══════════════════════════════════════════════════ */
const navLinksContainer = document.querySelector('.nav-links');
const navHoverPill = document.getElementById('navHoverPill');
const navItems = navLinksContainer ? navLinksContainer.querySelectorAll('a') : [];

if (navLinksContainer && navHoverPill) {
  navItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      const rect = item.getBoundingClientRect();
      const parentRect = navLinksContainer.getBoundingClientRect();
      const left = rect.left - parentRect.left;
      
      navHoverPill.style.width = `${rect.width}px`;
      navHoverPill.style.left = `${left}px`;
      navHoverPill.style.opacity = '1';
      navHoverPill.style.transform = 'scale(1)';
    });
  });

  navLinksContainer.addEventListener('mouseleave', () => {
    navHoverPill.style.opacity = '0';
    navHoverPill.style.transform = 'scale(0.9)';
  });
}

/* ═══════════════════════════════════════════════════
   SCROLL FADE-UP ANIMATIONS
═══════════════════════════════════════════════════ */
const fadeEls = document.querySelectorAll(
  '.case-item, .how-step-card, .project-card, .hero-floating-card'
);
fadeEls.forEach(el => el.classList.add('fade-up'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => observer.observe(el));

/* ═══════════════════════════════════════════════════
   TICKER BAR — rotate messages
═══════════════════════════════════════════════════ */
const tickerMessages = [
  "Open to new projects. Let's talk.",
  "Want to save 10+ hours a week with AI?",
  "I build automations that work while you sleep.",
  "Got a repetitive workflow? Let's automate it.",
];
const tickerBarText = document.getElementById('tickerBarText');
let tickerIdx = 0;
if (tickerBarText) {
  setInterval(() => {
    tickerBarText.style.opacity = '0';
    setTimeout(() => {
      tickerIdx = (tickerIdx + 1) % tickerMessages.length;
      tickerBarText.textContent = tickerMessages[tickerIdx];
      tickerBarText.style.opacity = '0.75';
    }, 300);
  }, 4000);
  tickerBarText.style.transition = 'opacity 0.3s ease';
}

/* ═══════════════════════════════════════════════════
   ASSISTANT WIDGET
═══════════════════════════════════════════════════ */
const assistantBtn   = document.getElementById('assistantBtn');
const assistantPanel = document.getElementById('assistantPanel');
const apClose        = document.getElementById('apClose');
const bubbleRow      = document.getElementById('bubbleRow');
const msgOptions     = document.getElementById('msgOptions');
const assistantInput = document.getElementById('assistantInput');
const apSend         = document.getElementById('apSend');
const messages       = document.getElementById('assistantMessages');

const replies = {
  'ai-automation': [
    "Great choice! I specialize in building AI workflows that run 24/7.",
    "I typically use n8n, OpenAI, and custom APIs. Want to tell me more about your use case?"
  ],
  'ai-agent': [
    "AI agents are my favourite thing to build.",
    "They can handle lead gen, customer support, data extraction — you name it. What's your business?"
  ],
  'fullstack': [
    "I build full-stack apps with React, Next.js, Node.js, and Supabase.",
    "Do you have a project in mind, or need a full build from scratch?"
  ],
  'consulting': [
    "I offer strategy sessions to map out your automation roadmap.",
    "Usually 60 minutes — we audit your workflows and identify the biggest wins. Interested?"
  ],
  'other': [
    "No worries! Tell me what's on your mind.",
    "You can also just email me directly at ayo@example.com"
  ]
};

// Open / close panel
assistantBtn.addEventListener('click', () => {
  assistantPanel.classList.toggle('open');
  bubbleRow.style.display = assistantPanel.classList.contains('open') ? 'none' : 'flex';
});

apClose.addEventListener('click', () => {
  assistantPanel.classList.remove('open');
  bubbleRow.style.display = 'flex';
});

// Option buttons
msgOptions.querySelectorAll('.msg-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.reply;

    // Add user message
    addMessage(btn.textContent, 'user');

    // Hide options
    msgOptions.style.display = 'none';

    // Enable input
    assistantInput.disabled = false;
    assistantInput.placeholder = 'Type your message…';

    // Typing indicator then reply
    const typing = addMessage('…', 'bot');
    setTimeout(() => {
      typing.remove();
      const replyMsgs = replies[key] || ["Thanks for reaching out!", "Let me connect you with Ayo."];
      replyMsgs.forEach((text, i) => {
        setTimeout(() => addMessage(text, 'bot'), i * 600);
      });
    }, 800);
  });
});

// Send custom message
function sendMessage() {
  const val = assistantInput.value.trim();
  if (!val) return;
  addMessage(val, 'user');
  assistantInput.value = '';
  const typing = addMessage('…', 'bot');
  setTimeout(() => {
    typing.remove();
    addMessage("Thanks! Ayo will get back to you shortly. You can also email directly at ayo@example.com", 'bot');
  }, 1000);
}

apSend.addEventListener('click', sendMessage);
assistantInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function addMessage(text, type) {
  const div = document.createElement('div');
  div.className = `msg msg-${type === 'user' ? 'user' : 'bot'}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

/* ═══════════════════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════════════════ */
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Sending…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = '✓ Message Sent!';
    btn.style.background = '#22c55e';
    btn.style.borderColor = '#22c55e';
    e.target.reset();
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.disabled = false;
    }, 3000);
  }, 1200);
}
