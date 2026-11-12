/**
 * PayPilot AI - Settings Controller
 * PayPal Sandbox credentials, Gemini LLM settings, profile updates, demo reset
 */

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initSettingsEvents();
});

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();

    if (data.paypal_mode) document.getElementById('cfg-paypal-mode').value = data.paypal_mode;
    if (data.paypal_client_id) document.getElementById('cfg-paypal-client-id').value = data.paypal_client_id;
    if (data.paypal_client_secret_masked) {
      document.getElementById('cfg-paypal-client-secret').value = data.paypal_client_secret_masked;
    }
    if (data.business_currency) document.getElementById('cfg-paypal-currency').value = data.business_currency;

    if (data.gemini_api_key_masked) {
      document.getElementById('cfg-gemini-key').value = data.gemini_api_key_masked;
    }
    if (data.gemini_model) document.getElementById('cfg-gemini-model').value = data.gemini_model;

    if (data.business_name) document.getElementById('cfg-biz-name').value = data.business_name;
    if (data.business_email) document.getElementById('cfg-biz-email').value = data.business_email;
    if (data.default_tax_rate) document.getElementById('cfg-tax-rate').value = data.default_tax_rate;

  } catch (err) {
    console.error('Error loading settings:', err);
    PayPilot.showToast('Could not load current settings.', 'error');
  }
}

function initSettingsEvents() {
  // Save Settings
  document.getElementById('btn-save-settings').addEventListener('click', saveAllSettings);

  // Test AI Connection
  document.getElementById('btn-test-gemini').addEventListener('click', testAIConnection);

  // Reset Demo Data
  document.getElementById('btn-reset-demo-data').addEventListener('click', resetDemoData);

  // Clear LocalStorage
  document.getElementById('btn-clear-localstorage').addEventListener('click', () => {
    localStorage.clear();
    PayPilot.showToast('Browser LocalStorage cleared.', 'info');
    setTimeout(() => window.location.reload(), 500);
  });

  // Export JSON
  document.getElementById('btn-export-json').addEventListener('click', exportDatabaseJSON);
}

async function saveAllSettings() {
  const btn = document.getElementById('btn-save-settings');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  const payload = {
    paypal_mode: document.getElementById('cfg-paypal-mode').value,
    paypal_client_id: document.getElementById('cfg-paypal-client-id').value.trim(),
    paypal_client_secret: document.getElementById('cfg-paypal-client-secret').value.trim(),
    business_currency: document.getElementById('cfg-paypal-currency').value,
    gemini_api_key: document.getElementById('cfg-gemini-key').value.trim(),
    gemini_model: document.getElementById('cfg-gemini-model').value,
    business_name: document.getElementById('cfg-biz-name').value.trim(),
    business_email: document.getElementById('cfg-biz-email').value.trim(),
    default_tax_rate: document.getElementById('cfg-tax-rate').value.trim()
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      PayPilot.showToast('Settings saved successfully!', 'success');
      // Save theme & currency in LocalStorage as well
      localStorage.setItem('paypilot_currency', payload.business_currency);
    } else {
      PayPilot.showToast(result.error || 'Failed to save settings.', 'error');
    }
  } catch (err) {
    PayPilot.showToast('Save error: ' + err.message, 'error');
  } finally {
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Settings';
    btn.disabled = false;
  }
}

async function testAIConnection() {
  const resultBox = document.getElementById('test-gemini-result');
  resultBox.style.display = 'block';
  resultBox.style.background = 'var(--bg-tertiary)';
  resultBox.style.color = 'var(--text-main)';
  resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing AI financial engine response...';

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Ping! Test PayPilot Assistant connection.' })
    });
    const data = await res.json();

    if (data.reply) {
      resultBox.style.background = 'var(--success-light)';
      resultBox.style.color = 'var(--success)';
      resultBox.innerHTML = `
        <div style="font-weight:700;"><i class="fa-solid fa-circle-check"></i> Connection Successful!</div>
        <div style="font-size:0.78rem; margin-top:4px;">Engine: <b>${data.source}</b></div>
      `;
      PayPilot.showToast(`AI engine test passed (${data.source})`, 'success');
    } else {
      throw new Error(data.error || 'Empty reply');
    }
  } catch (err) {
    resultBox.style.background = 'var(--danger-light)';
    resultBox.style.color = 'var(--danger)';
    resultBox.innerHTML = `
      <div style="font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Test Notice:</div>
      <div style="font-size:0.78rem; margin-top:2px;">${err.message}</div>
    `;
  }
}

async function resetDemoData() {
  if (!confirm('This will reset all invoices, customers, and transactions to initial demo state. Continue?')) {
    return;
  }

  try {
    const res = await fetch('/api/data/reset-demo', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      PayPilot.showToast('Database reset to clean demo state!', 'success');
      setTimeout(() => window.location.href = '/dashboard', 600);
    }
  } catch (err) {
    PayPilot.showToast('Reset failed: ' + err.message, 'error');
  }
}

async function exportDatabaseJSON() {
  try {
    const [invRes, txnRes, custRes] = await Promise.all([
      fetch('/api/invoices'),
      fetch('/api/transactions'),
      fetch('/api/customers')
    ]);

    const invoices = await invRes.json();
    const transactions = await txnRes.json();
    const customers = await custRes.json();

    const fullExport = {
      platform: 'PayPilot AI',
      exported_at: new Date().toISOString(),
      invoices,
      transactions,
      customers
    };

    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PayPilot_Financial_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    PayPilot.showToast('Financial database exported as JSON!', 'success');
  } catch (err) {
    PayPilot.showToast('Export error: ' + err.message, 'error');
  }
}
