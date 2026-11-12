/**
 * PayPilot AI - Assistant Controller
 * Conversational FinTech Chatbot, Gemini LLM Backend, Markdown Renderer
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const chips = document.querySelectorAll('.prompt-chip');
  const clearBtn = document.getElementById('btn-clear-chat');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (message) {
      sendMessage(message);
      input.value = '';
    }
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      sendMessage(prompt);
    });
  });

  clearBtn.addEventListener('click', () => {
    const container = document.getElementById('chat-messages-area');
    container.innerHTML = `
      <div class="chat-bubble-wrap ai">
        <div class="chat-avatar ai"><i class="fa-solid fa-robot"></i></div>
        <div>
          <div class="chat-bubble">
            Chat cleared. How can I assist with your business finances today?
          </div>
          <span class="chat-timestamp">Just now</span>
        </div>
      </div>
    `;
    PayPilot.showToast('Conversation cleared', 'info');
  });
});

async function sendMessage(text) {
  const container = document.getElementById('chat-messages-area');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Append User Bubble
  const userWrap = document.createElement('div');
  userWrap.className = 'chat-bubble-wrap user';
  userWrap.innerHTML = `
    <div class="chat-avatar user"><i class="fa-solid fa-user"></i></div>
    <div>
      <div class="chat-bubble">${escapeHtml(text)}</div>
      <span class="chat-timestamp">${now}</span>
    </div>
  `;
  container.appendChild(userWrap);

  // 2. Append Typing Indicator
  const typingWrap = document.createElement('div');
  typingWrap.className = 'chat-bubble-wrap ai typing-indicator-wrap';
  typingWrap.innerHTML = `
    <div class="chat-avatar ai"><i class="fa-solid fa-robot"></i></div>
    <div>
      <div class="chat-bubble" style="display:flex; align-items:center; gap:6px;">
        <span class="typing-dot" style="width:6px; height:6px; background:var(--primary); border-radius:50%; animation:pulse-green 1s infinite;"></span>
        <span style="font-size:0.84rem; color:var(--text-muted);">PayPilot AI is analyzing financial context...</span>
      </div>
    </div>
  `;
  container.appendChild(typingWrap);
  container.scrollTop = container.scrollHeight;

  // 3. Query Backend
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    typingWrap.remove();

    if (data.reply) {
      // Update engine label
      const engineLabel = document.getElementById('ai-engine-status');
      if (engineLabel) {
        engineLabel.textContent = `Powered by ${data.source}`;
      }

      const aiWrap = document.createElement('div');
      aiWrap.className = 'chat-bubble-wrap ai';
      aiWrap.innerHTML = `
        <div class="chat-avatar ai"><i class="fa-solid fa-robot"></i></div>
        <div>
          <div class="chat-bubble">${formatMarkdown(data.reply)}</div>
          <span class="chat-timestamp">${data.timestamp || now} • <span style="color:var(--primary);">${data.source}</span></span>
        </div>
      `;
      container.appendChild(aiWrap);
    } else {
      throw new Error(data.error || 'No response from assistant');
    }
  } catch (err) {
    typingWrap.remove();
    const errWrap = document.createElement('div');
    errWrap.className = 'chat-bubble-wrap ai';
    errWrap.innerHTML = `
      <div class="chat-avatar ai" style="background:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <div>
        <div class="chat-bubble" style="color:var(--danger);">Error communicating with AI engine: ${err.message}</div>
      </div>
    `;
    container.appendChild(errWrap);
  }

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = text;

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Headers
  formatted = formatted.replace(/^### (.*$)/gim, '<h4 style="margin:8px 0 4px 0; color:var(--text-main); font-size:1rem;">$1</h4>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h3 style="margin:10px 0 6px 0; color:var(--text-main); font-size:1.1rem;">$1</h3>');

  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:var(--bg-card); padding:2px 6px; border-radius:4px; font-family:monospace; font-size:0.85em;">$1</code>');

  // Bullet items
  formatted = formatted.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-bottom:4px;">$1</li>');
  formatted = formatted.replace(/(<li.*<\/li>)/gims, '<ul style="margin:6px 0 6px 20px; padding:0;">$1</ul>');

  // Numbered items
  formatted = formatted.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li style="margin-bottom:4px;"><b>$1.</b> $2</li>');

  // Paragraph line breaks
  formatted = formatted.replace(/\n\n/g, '<br><br>');

  return formatted;
}
