/**
 * Contentsathi Unified Website Widget
 * Captures leads and showcases latest social content.
 * 
 * Usage:
 *   <script src="https://contentsathi.com/embed/widget.js"
 *     data-apikey="YOUR_SITE_API_KEY"
 *     data-host="https://contentsathi.com"
 *     data-primary-color="#6366f1"
 *     data-show-posts="true"
 *     data-title="Contentsathi Connect"
 *   ></script>
 */
(function () {
  "use strict";

  // Configuration from script tag
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  var CONFIG = {
    apiKey: currentScript.getAttribute("data-apikey") || "",
    userId: currentScript.getAttribute("data-user-id") || "",
    host: currentScript.getAttribute("data-host") || window.location.origin,
    color: currentScript.getAttribute("data-primary-color") || "#8b5cf6",
    title: currentScript.getAttribute("data-title") || "Contentsathi Connect",
    showPosts: currentScript.getAttribute("data-show-posts") !== "false",
    position: currentScript.getAttribute("data-position") || "right",
  };

  if (!CONFIG.apiKey && !CONFIG.userId) {
    console.warn("[Contentsathi] Missing data-apikey on script tag.");
  }

  // Inject Premium CSS
  var style = document.createElement("style");
  style.textContent = `
    :root { --cs-primary: ${CONFIG.color}; --cs-blur: 12px; }
    .cs-fab {
      position: fixed; bottom: 24px; ${CONFIG.position === 'left' ? 'left: 24px;' : 'right: 24px;'}
      width: 64px; height: 64px; border-radius: 20px;
      background: var(--cs-primary); color: white;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      border: none; cursor: pointer; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      overflow: hidden;
    }
    .cs-fab:hover { transform: scale(1.05) translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    .cs-fab svg { width: 30px; height: 30px; transition: transform 0.4s; }
    .cs-fab.open svg { transform: rotate(90deg) scale(0.8); }

    .cs-panel {
      position: fixed; bottom: 100px; ${CONFIG.position === 'left' ? 'left: 24px;' : 'right: 24px;'}
      width: 380px; max-width: calc(100vw - 48px); max-height: 600px;
      background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(var(--cs-blur));
      -webkit-backdrop-filter: blur(var(--cs-blur));
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      z-index: 2147483646; overflow: hidden;
      display: flex; flex-col: column; flex-direction: column;
      transform: translateY(30px) scale(0.9); opacity: 0; pointer-events: none;
      transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .cs-panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; }

    .cs-header { background: var(--cs-primary); padding: 24px; color: white; position: relative; }
    .cs-header h3 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .cs-header p { margin: 4px 0 0; opacity: 0.8; font-size: 13px; font-weight: 500; }
    
    .cs-tabs { display: flex; background: rgba(0,0,0,0.05); padding: 4px; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .cs-tab { flex: 1; padding: 10px; text-align: center; font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 12px; color: #666; transition: all 0.2s; }
    .cs-tab.active { background: white; color: var(--cs-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .cs-content { overflow-y: auto; padding: 24px; flex: 1; }
    .cs-form-group { margin-bottom: 16px; }
    .cs-form-group label { display: block; font-size: 11px; font-weight: 800; color: #999; text-transform: uppercase; margin-bottom: 6px; }
    .cs-form-group input, .cs-form-group textarea {
      width: 100%; border: 2px solid #f1f5f9; background: #f8fafc;
      padding: 12px 16px; border-radius: 14px; font-size: 14px; font-weight: 500;
      outline: none; transition: all 0.2s; box-sizing: border-box;
    }
    .cs-form-group input:focus { border-color: var(--cs-primary); background: white; }
    
    .cs-submit-btn {
      width: 100%; background: var(--cs-primary); color: white; border: none;
      padding: 16px; border-radius: 16px; font-size: 15px; font-weight: 800;
      cursor: pointer; transition: all 0.3s; transform: perspective(1px) translateZ(0);
    }
    .cs-submit-btn:hover { filter: brightness(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .cs-submit-btn:active { transform: scale(0.98); }
    .cs-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .cs-posts-list { display: flex; flex-direction: column; gap: 16px; }
    .cs-post-card { 
      background: white; border-radius: 18px; padding: 16px; border: 1px solid #f1f5f9;
      transition: all 0.2s; cursor: pointer; text-decoration: none; display: block;
    }
    .cs-post-card:hover { transform: translateY(-2px); border-color: var(--cs-primary); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
    .cs-post-card h4 { margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #1e293b; color: var(--cs-primary); }
    .cs-post-card p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
    .cs-post-card .meta { margin-top: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #cbd5e1; }

    .cs-success-view { text-align: center; padding: 40px 0; }
    .cs-success-icon { width: 64px; height: 64px; background: #22c55e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }

    .cs-pulse {
      animation: cs-pulse-animation 2s infinite;
    }
    @keyframes cs-pulse-animation {
      0% { box-shadow: 0 0 0 0px ${CONFIG.color}44; }
      100% { box-shadow: 0 0 0 20px ${CONFIG.color}00; }
    }
  `;
  document.head.appendChild(style);

  // Widget State
  var state = { isOpen: false, activeTab: CONFIG.showPosts ? 'posts' : 'inquiry' };

  // Create UI Elements
  var fab = document.createElement("button");
  fab.className = "cs-fab cs-pulse";
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>';
  document.body.appendChild(fab);

  var panel = document.createElement("div");
  panel.className = "cs-panel";
  panel.innerHTML = `
    <div class="cs-header">
      <h3 id="cs-title-text">${CONFIG.title}</h3>
      <p id="cs-subtitle-text">Your AI content companion</p>
    </div>
    ${CONFIG.showPosts ? `
    <div class="cs-tabs">
      <div class="cs-tab ${state.activeTab === 'posts' ? 'active' : ''}" data-tab="posts">Updates</div>
      <div class="cs-tab ${state.activeTab === 'inquiry' ? 'active' : ''}" data-tab="inquiry">Enquire</div>
    </div>
    ` : ''}
    <div class="cs-content" id="cs-main-content">
      <div id="cs-view-posts" style="display: ${state.activeTab === 'posts' ? 'block' : 'none'}">
        <div class="cs-posts-list" id="cs-posts-container">
          <div style="text-align:center; padding: 40px; color: #94a3b8;"><div class="cs-loader">Loading updates...</div></div>
        </div>
      </div>
      <div id="cs-view-inquiry" style="display: ${state.activeTab === 'inquiry' ? 'block' : 'none'}">
        <form id="cs-inquiry-form">
          <div class="cs-form-group">
            <label>Full Name</label>
            <input type="text" id="cs-name" placeholder="John Doe" required />
          </div>
          <div class="cs-form-group">
            <label>WhatsApp Number</label>
            <input type="tel" id="cs-phone" placeholder="+91 98765 43210" required />
          </div>
          <div class="cs-form-group">
            <label>I'm interested in...</label>
            <textarea id="cs-notes" rows="2" placeholder="Tell us more..."></textarea>
          </div>
          <button type="submit" class="cs-submit-btn" id="cs-btn-text">Submit Inquiry</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Toggle Function
  function toggle() {
    state.isOpen = !state.isOpen;
    fab.classList.toggle('open', state.isOpen);
    panel.classList.toggle('open', state.isOpen);
    if (state.isOpen) {
      fab.classList.remove('cs-pulse');
      if (CONFIG.showPosts) fetchPosts();
    }
  }
  
  fab.onclick = toggle;

  // Tab Functionality
  panel.querySelectorAll('.cs-tab').forEach(tab => {
    tab.onclick = function() {
      panel.querySelectorAll('.cs-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      state.activeTab = target;
      document.getElementById('cs-view-posts').style.display = target === 'posts' ? 'block' : 'none';
      document.getElementById('cs-view-inquiry').style.display = target === 'inquiry' ? 'block' : 'none';
      
      var title = document.getElementById('cs-title-text');
      var sub = document.getElementById('cs-subtitle-text');
      if (target === 'posts') {
        title.innerText = "Latest Updates";
        sub.innerText = "Fresh from our desk";
      } else {
        title.innerText = CONFIG.title;
        sub.innerText = "Get in touch with us";
      }
    };
  });

  // Fetch Posts
  function fetchPosts() {
    var container = document.getElementById('cs-posts-container');
    fetch(`${CONFIG.host}/api/widget/posts?apiKey=${CONFIG.apiKey}&userId=${CONFIG.userId}`)
      .then(r => r.json())
      .then(data => {
        if (!data || data.length === 0 || data.error) {
          container.innerHTML = '<div style="text-align:center; padding: 40px; color: #94a3b8;">No updates found.</div>';
          return;
        }
        container.innerHTML = data.map(post => `
          <a href="${post.url || '#'}" target="_blank" class="cs-post-card">
            <h4>${post.title}</h4>
            <p>${post.bodyPreview}</p>
            <div class="meta">${post.platform} • ${new Date(post.publishedAt).toLocaleDateString()}</div>
          </a>
        `).join('');
      })
      .catch(() => {
        container.innerHTML = '<div style="text-align:center; padding: 40px; color: #94a3b8;">Failed to load updates.</div>';
      });
  }

  // Submit Inquiry
  var form = document.getElementById('cs-inquiry-form');
  form.onsubmit = function(e) {
    e.preventDefault();
    var btn = document.getElementById('cs-btn-text');
    var originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Submitting...";

    var payload = {
      apiKey: CONFIG.apiKey,
      userId: CONFIG.userId,
      name: document.getElementById('cs-name').value,
      phone: document.getElementById('cs-phone').value,
      notes: document.getElementById('cs-notes').value,
      source: "website_widget"
    };

    fetch(`${CONFIG.host}/api/widget/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.getElementById('cs-main-content').innerHTML = `
          <div class="cs-success-view">
            <div class="cs-success-icon">✓</div>
            <h3>Thank You!</h3>
            <p>We've received your inquiry and will message you on WhatsApp shortly.</p>
          </div>
        `;
        setTimeout(toggle, 5000);
      } else {
        toastError(data.error || "Submission failed");
        btn.disabled = false;
        btn.innerText = originalText;
      }
    })
    .catch(() => {
      toastError("Network error. Try again.");
      btn.disabled = false;
      btn.innerText = originalText;
    });
  };

  function toastError(msg) {
    alert(msg); // Keep it simple for widget, but alert is effective.
  }

})();
