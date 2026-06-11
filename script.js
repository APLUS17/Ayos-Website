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
   INBOUND LEAD CATCHER CHATBOT
   Adapted for Ayo Omoloja
═══════════════════════════════════════════════════ */

// Hook messages rotating logic
let activeHookIdx = 4; // Start at "Open to new projects. Let's talk."
const hookMsgs = document.querySelectorAll('.hook-msg');
const ecHook = document.getElementById('ec-hook');
const ecPanel = document.getElementById('ec-panel');
const ecBackdrop = document.getElementById('ec-backdrop');
const ecCloseBtn = document.querySelector('.ec-close-btn');
const ecMsgs = document.getElementById('ec-msgs');
const ecIn = document.getElementById('ec-in');
const ecSend = document.getElementById('ec-send');

function rotateHook() {
  if (!ecHook || ecHook.classList.contains('panel-open')) return;
  hookMsgs.forEach(m => m.classList.remove('active'));
  activeHookIdx = (activeHookIdx + 1) % hookMsgs.length;
  if (hookMsgs[activeHookIdx]) {
    hookMsgs[activeHookIdx].classList.add('active');
  }
}
setInterval(rotateHook, 4000);

// Chatbot State and Setup
let chatbotState = {
  step: 'service', // service, problem, timeline, name, email, done
  data: {
    service: '',
    problem: '',
    timeline: '',
    name: '',
    email: '',
    score: ''
  }
};

// Webhook config
const WEBHOOK_URL = 'https://primary-production-c22f.up.railway.app/webhook/lead-catcher';

// Toggle Chat
function toggleChat() {
  if (!ecPanel) return;
  const isOpen = ecPanel.classList.toggle('open');
  ecHook.classList.toggle('panel-open', isOpen);
  ecBackdrop.classList.toggle('show', isOpen);
  
  if (isOpen && ecMsgs.children.length === 0) {
    startChatbot();
  }
}

function closeChat() {
  if (!ecPanel) return;
  ecPanel.classList.remove('open');
  ecHook.classList.remove('panel-open');
  ecBackdrop.classList.remove('show');
}

if (ecHook) {
  ecHook.addEventListener('click', (e) => {
    if (e.target.classList.contains('ec-close-btn')) return;
    toggleChat();
  });
}

if (ecCloseBtn) {
  ecCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeChat();
  });
}

if (ecBackdrop) {
  ecBackdrop.addEventListener('click', closeChat);
}

// Typing indicator helper
function showTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'ec-typ-wrap';
  wrap.innerHTML = '<div class="ec-typ"><span></span><span></span><span></span></div>';
  ecMsgs.appendChild(wrap);
  ecMsgs.scrollTop = ecMsgs.scrollHeight;
  return wrap;
}

// Add bot message
function addBotMessage(text, delay = 800) {
  return new Promise((resolve) => {
    const indicator = showTypingIndicator();
    setTimeout(() => {
      indicator.remove();
      const m = document.createElement('div');
      m.className = 'ec-m bot';
      m.innerHTML = `<div class="ec-bub">${text}</div>`;
      ecMsgs.appendChild(m);
      ecMsgs.scrollTop = ecMsgs.scrollHeight;
      resolve();
    }, delay);
  });
}

// Add user message
function addUserMessage(text) {
  const m = document.createElement('div');
  m.className = 'ec-m usr';
  m.innerHTML = `<div class="ec-bub">${text}</div>`;
  ecMsgs.appendChild(m);
  ecMsgs.scrollTop = ecMsgs.scrollHeight;
}

// Show chips
function showChips(options, onClickCallback) {
  const wrap = document.createElement('div');
  wrap.className = 'ec-chips-wrap';
  const chips = document.createElement('div');
  chips.className = 'ec-chips';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'ec-chip';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      Array.from(chips.children).forEach(c => {
        c.disabled = true;
        if (c === btn) c.classList.add('sel');
      });
      onClickCallback(opt);
    });
    chips.appendChild(btn);
  });
  wrap.appendChild(chips);
  ecMsgs.appendChild(wrap);
  ecMsgs.scrollTop = ecMsgs.scrollHeight;
}

async function startChatbot() {
  chatbotState.step = 'service';
  ecMsgs.innerHTML = '';
  ecIn.disabled = true;
  ecIn.placeholder = 'Choose an option above…';
  
  await addBotMessage("Hey. I am Ayo's assistant.");
  await addBotMessage("What are you looking to get help with?");
  
  showChips(
    ["AI Automation", "24/7 AI Agent", "UI/UX Design", "Website", "Consulting", "Something else"],
    handleServiceSelected
  );
}

async function handleServiceSelected(service) {
  chatbotState.data.service = service;
  addUserMessage(service);
  
  chatbotState.step = 'problem';
  
  await addBotMessage("Awesome. Can you describe the problem you're looking to solve or the service you need?");
  
  ecIn.disabled = false;
  ecIn.placeholder = 'Type your problem description…';
  ecIn.focus();
}

async function handleProblemSubmitted(problem) {
  chatbotState.data.problem = problem;
  addUserMessage(problem);
  
  ecIn.value = '';
  ecIn.disabled = true;
  ecIn.placeholder = 'Choose a timeline above…';
  
  chatbotState.step = 'timeline';
  
  await addBotMessage("Got it. What is your timeline for this project?");
  
  showChips(
    ["ASAP", "1–3 months", "Exploring"],
    handleTimelineSelected
  );
}

async function handleTimelineSelected(timeline) {
  chatbotState.data.timeline = timeline;
  addUserMessage(timeline);
  
  if (timeline === "ASAP") chatbotState.data.score = "Hot";
  else if (timeline === "1–3 months") chatbotState.data.score = "Warm";
  else chatbotState.data.score = "Cold";
  
  chatbotState.step = 'name';
  
  await addBotMessage("Perfect. Lastly, what's your name and email so Ayo can follow up?");
  await addBotMessage("Please enter your name:");
  
  ecIn.disabled = false;
  ecIn.placeholder = 'Enter your name…';
  ecIn.focus();
}

async function handleNameSubmitted(name) {
  chatbotState.data.name = name;
  addUserMessage(name);
  
  chatbotState.step = 'email';
  
  ecIn.value = '';
  await addBotMessage(`Thanks ${name}! Now, please enter your email address:`);
  
  ecIn.placeholder = 'Enter your email…';
  ecIn.focus();
}

async function handleEmailSubmitted(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    addUserMessage(email);
    ecIn.value = '';
    await addBotMessage("That doesn't look like a valid email address. Please try again:");
    return;
  }
  
  chatbotState.data.email = email;
  addUserMessage(email);
  
  chatbotState.step = 'done';
  ecIn.value = '';
  ecIn.disabled = true;
  ecIn.placeholder = 'Chat completed';
  
  const indicator = showTypingIndicator();
  
  await submitLead(chatbotState.data);
  
  indicator.remove();
  
  const ok = document.createElement('div');
  ok.className = 'ec-ok';
  ok.innerHTML = `
    <div class="ec-ok-star">✦</div>
    <h3>Thanks for reaching out!</h3>
    <p>Ayo will get back to you in under 5 seconds (check your inbox!).</p>
  `;
  ecMsgs.appendChild(ok);
  ecMsgs.scrollTop = ecMsgs.scrollHeight;
}

async function submitLead(data) {
  const payload = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  console.log("Submitting Lead data:", payload);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log("Webhook response status:", response.status);
  } catch (error) {
    console.error("Webhook submission failed:", error);
  }
}

function handleTextSubmit() {
  const val = ecIn.value.trim();
  if (!val) return;
  
  if (chatbotState.step === 'problem') {
    handleProblemSubmitted(val);
  } else if (chatbotState.step === 'name') {
    handleNameSubmitted(val);
  } else if (chatbotState.step === 'email') {
    handleEmailSubmitted(val);
  }
}

if (ecSend) {
  ecSend.addEventListener('click', handleTextSubmit);
}
if (ecIn) {
  ecIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleTextSubmit();
  });
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

/* ═══════════════════════════════════════════════════
   CUSTOM CURSOR (Glitch Effect Translation)
═══════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if it is a desktop device (has hover capability)
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cursorEl = document.createElement("div");
  cursorEl.id = "custom-cursor";
  document.body.appendChild(cursorEl);

  let mouseX = 0;
  let mouseY = 0;
  let isVisible = false;
  let isHovering = false;
  let clickScale = 1;

  const state = {
    distanceX: 0,
    distanceY: 0,
    distance: 0,
    pointerX: 0,
    pointerY: 0,
    previousPointerX: 0,
    previousPointerY: 0,
  };

  const updateCursorPosition = () => {
    const size = isHovering ? 30 : 15;
    const finalScale = clickScale;
    
    // Position offset centers the cursor circle
    cursorEl.style.transform = `translate3d(${mouseX - size / 2}px, ${mouseY - size / 2}px, 0) scale(${finalScale})`;
    
    // Calculate shadow shift for glitch colors, capped between -10px and 10px
    const distanceX = Math.min(Math.max(state.distanceX, -10), 10);
    const distanceY = Math.min(Math.max(state.distanceY, -10), 10);
    
    // Shadow 1: cyan (#00feff), Shadow 2: red/pink (#ff4f71)
    cursorEl.style.boxShadow = `${distanceX}px ${distanceY}px 0 #00feff, ${-distanceX}px ${-distanceY}px 0 #ff4f71`;
  };

  document.addEventListener("mousemove", (event) => {
    state.previousPointerX = state.pointerX;
    state.previousPointerY = state.pointerY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    
    state.distanceX = state.previousPointerX - state.pointerX;
    state.distanceY = state.previousPointerY - state.pointerY;

    mouseX = event.clientX;
    mouseY = event.clientY;

    if (!isVisible) {
      isVisible = true;
      cursorEl.style.opacity = "1";
    }

    // Hover state verification
    const target = event.target;
    if (target) {
      const isInteractive = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.onclick !== null || 
        target.closest("a") !== null || 
        target.closest("button") !== null || 
        target.classList.contains("ec-chip") || 
        target.classList.contains("footer-cta-btn") ||
        window.getComputedStyle(target).cursor === "pointer";
      
      if (isInteractive !== isHovering) {
        isHovering = isInteractive;
        if (isHovering) {
          cursorEl.classList.add("hovering");
        } else {
          cursorEl.classList.remove("hovering");
        }
      }
    }

    requestAnimationFrame(updateCursorPosition);
  });

  document.addEventListener("mouseleave", () => {
    isVisible = false;
    cursorEl.style.opacity = "0";
  });

  document.addEventListener("mousedown", () => {
    clickScale = 0.75;
    requestAnimationFrame(updateCursorPosition);
  });

  document.addEventListener("mouseup", () => {
    clickScale = 1;
    requestAnimationFrame(updateCursorPosition);
  });
});

