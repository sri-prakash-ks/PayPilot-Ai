/**
 * PayPilot AI - Invoices Controller
 * AI Item Generator, Auto-calculating line items, PDF downloads, PayPal link generation
 */

let currentFilterStatus = 'all';
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initInvoiceEvents();
  loadInvoices();

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('create') === 'true') {
    openCreateInvoiceModal();
  }
  if (urlParams.get('search')) {
    document.getElementById('invoice-search-input').value = urlParams.get('search');
    loadInvoices('all', urlParams.get('search'));
  }
});

function initInvoiceEvents() {
  // New invoice button
  const newBtn = document.getElementById('btn-new-invoice');
  if (newBtn) newBtn.addEventListener('click', () => openCreateInvoiceModal());

  // Close modals
  document.getElementById('modal-close-invoice').addEventListener('click', closeCreateInvoiceModal);
  document.getElementById('btn-cancel-invoice').addEventListener('click', closeCreateInvoiceModal);
  document.getElementById('modal-close-preview').addEventListener('click', closePreviewModal);

  // Filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active', 'btn-primary');
        t.classList.add('btn-outline');
      });
      tab.classList.add('active', 'btn-primary');
      tab.classList.remove('btn-outline');
      currentFilterStatus = tab.getAttribute('data-status');
      loadInvoices(currentFilterStatus, currentSearchQuery);
    });
  });

  // Search input
  const searchInput = document.getElementById('invoice-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      loadInvoices(currentFilterStatus, currentSearchQuery);
    });
  }

  // Add line item button
  document.getElementById('btn-add-item').addEventListener('click', () => {
    addLineItem();
  });

  // AI item generator button
  document.getElementById('btn-run-ai-generator').addEventListener('click', runAIItemGenerator);
  const openAIPromptBtn = document.getElementById('btn-open-ai-prompt');
  if (openAIPromptBtn) {
    openAIPromptBtn.addEventListener('click', () => {
      openCreateInvoiceModal();
      document.getElementById('ai-invoice-prompt').focus();
    });
  }

  // Tax rate input change
  document.getElementById('inv-tax-rate').addEventListener('input', recalculateTotals);

  // Form submit
  document.getElementById('create-invoice-form').addEventListener('submit', handleInvoiceSubmit);
}

async function loadInvoices(status = currentFilterStatus, search = currentSearchQuery) {
  const tbody = document.getElementById('invoices-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Fetching invoices...</td></tr>`;

  try {
    let url = `/api/invoices?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const invoices = await res.json();

    if (!invoices || invoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No matching invoices found.</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const isPaid = inv.status === 'paid';
      const isOverdue = inv.status === 'overdue';
      const payUrl = `${window.location.origin}/pay/${inv.invoice_number}`;

      return `
        <tr>
          <td style="font-family:'JetBrains Mono', monospace; font-weight:700;">
            <a href="javascript:void(0)" onclick="viewInvoiceDetail(${inv.id})">${inv.invoice_number}</a>
          </td>
          <td>
            <div style="font-weight:600;">${inv.customer_name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${inv.customer_email}</div>
          </td>
          <td style="font-size:0.84rem; color:var(--text-muted);">${PayPilot.formatDate(inv.issue_date)}</td>
          <td style="font-size:0.84rem; font-weight:600; color:${isOverdue ? 'var(--danger)' : 'var(--text-main)'};">
            ${PayPilot.formatDate(inv.due_date)}
          </td>
          <td style="font-weight:700; font-size:0.95rem;">
            ${PayPilot.formatCurrency(inv.total_amount)}
          </td>
          <td>
            <span class="badge badge-${inv.status}">
              ${inv.status === 'paid' ? '<i class="fa-solid fa-check"></i>' : ''}
              ${inv.status}
            </span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="btn btn-sm btn-outline" onclick="copyPaymentLink('${payUrl}')" title="Copy PayPal Checkout Link">
                <i class="fa-regular fa-copy"></i> Copy Link
              </button>
              <a href="/pay/${inv.invoice_number}" target="_blank" class="btn btn-sm btn-secondary" title="Open Customer Payment Portal">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-outline" onclick="viewInvoiceDetail(${inv.id})" title="View Invoice & Details">
                <i class="fa-solid fa-eye"></i>
              </button>
              <a href="/api/invoices/${inv.id}/pdf" class="btn btn-sm btn-outline" title="Download Official PDF Invoice">
                <i class="fa-solid fa-file-pdf" style="color:var(--danger);"></i>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--danger);">Error loading invoices: ${err.message}</td></tr>`;
  }
}

function openCreateInvoiceModal() {
  const modal = document.getElementById('modal-invoice');
  modal.classList.add('active');

  // Default due date: today + 14 days
  const today = new Date();
  today.setDate(today.getDate() + 14);
  document.getElementById('inv-due-date').value = today.toISOString().split('T')[0];

  // If items empty, add one default row
  const container = document.getElementById('items-container');
  if (container.children.length === 0) {
    addLineItem('Professional Software & FinTech Consulting', 1, 1500.00);
  }
}

function closeCreateInvoiceModal() {
  document.getElementById('modal-invoice').classList.remove('active');
}

function closePreviewModal() {
  document.getElementById('modal-invoice-preview').classList.remove('active');
}

function addLineItem(desc = '', qty = 1, price = 0) {
  const container = document.getElementById('items-container');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.style.cssText = 'display:grid; grid-template-columns: 3fr 1fr 1.5fr 1.5fr 40px; gap:10px; align-items:center;';

  row.innerHTML = `
    <input type="text" class="form-control item-desc" placeholder="Item description / service" value="${desc}" required>
    <input type="number" class="form-control item-qty" placeholder="Qty" min="1" step="1" value="${qty}" required>
    <input type="number" class="form-control item-price" placeholder="Price ($)" min="0" step="0.01" value="${price}" required>
    <div class="item-line-total" style="font-weight:700; text-align:right; font-size:0.9rem; color:var(--text-main);">$0.00</div>
    <button type="button" class="btn btn-sm btn-outline" style="color:var(--danger); padding:8px;" onclick="removeLineItem(this)">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  // Attach auto-recalculation listeners
  row.querySelector('.item-qty').addEventListener('input', recalculateTotals);
  row.querySelector('.item-price').addEventListener('input', recalculateTotals);

  container.appendChild(row);
  recalculateTotals();
}

function removeLineItem(btn) {
  const container = document.getElementById('items-container');
  if (container.children.length > 1) {
    btn.closest('.item-row').remove();
    recalculateTotals();
  } else {
    PayPilot.showToast('At least one line item is required.', 'error');
  }
}

function recalculateTotals() {
  const rows = document.querySelectorAll('.item-row');
  let subtotal = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const lineTotal = qty * price;
    row.querySelector('.item-line-total').textContent = PayPilot.formatCurrency(lineTotal);
    subtotal += lineTotal;
  });

  const taxRate = parseFloat(document.getElementById('inv-tax-rate').value) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  document.getElementById('calc-subtotal').textContent = PayPilot.formatCurrency(subtotal);
  document.getElementById('calc-tax').textContent = PayPilot.formatCurrency(taxAmount);
  document.getElementById('calc-total').textContent = PayPilot.formatCurrency(totalAmount);
}

async function runAIItemGenerator() {
  const prompt = document.getElementById('ai-invoice-prompt').value.trim();
  if (!prompt) {
    PayPilot.showToast('Please type a brief project description for the AI.', 'info');
    return;
  }

  const btn = document.getElementById('btn-run-ai-generator');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/ai/generate-invoice-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();

    if (data.items && Array.isArray(data.items)) {
      const container = document.getElementById('items-container');
      container.innerHTML = '';
      data.items.forEach(item => {
        addLineItem(item.description, item.quantity || 1, item.unit_price || 0);
      });
      PayPilot.showToast('AI structured line items generated successfully!', 'success');
    }
  } catch (err) {
    PayPilot.showToast('Error generating AI items: ' + err.message, 'error');
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

async function handleInvoiceSubmit(e) {
  e.preventDefault();

  const customer_name = document.getElementById('inv-customer-name').value.trim();
  const customer_email = document.getElementById('inv-customer-email').value.trim();
  const due_date = document.getElementById('inv-due-date').value;
  const tax_rate = parseFloat(document.getElementById('inv-tax-rate').value) || 0;
  const notes = document.getElementById('inv-notes').value.trim();

  const items = [];
  document.querySelectorAll('.item-row').forEach(row => {
    items.push({
      description: row.querySelector('.item-desc').value.trim(),
      quantity: parseFloat(row.querySelector('.item-qty').value) || 1,
      unit_price: parseFloat(row.querySelector('.item-price').value) || 0
    });
  });

  const saveBtn = document.getElementById('btn-save-invoice');
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name,
        customer_email,
        due_date,
        tax_rate,
        notes,
        items
      })
    });
    const result = await res.json();

    if (result.success) {
      PayPilot.showToast(`Invoice ${result.invoice_number} generated!`, 'success');
      closeCreateInvoiceModal();
      document.getElementById('create-invoice-form').reset();
      loadInvoices();
      // Prompt to view
      viewInvoiceDetail(result.invoice_id);
    } else {
      PayPilot.showToast(result.error || 'Failed to create invoice.', 'error');
    }
  } catch (err) {
    PayPilot.showToast('Network error: ' + err.message, 'error');
  } finally {
    saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Generate & Save Invoice';
    saveBtn.disabled = false;
  }
}

async function viewInvoiceDetail(invoiceId) {
  const modal = document.getElementById('modal-invoice-preview');
  const body = document.getElementById('preview-modal-content');
  const footer = document.getElementById('preview-modal-footer');

  modal.classList.add('active');
  body.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching invoice details...</div>`;

  try {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    const inv = await res.json();
    const payUrl = `${window.location.origin}/pay/${inv.invoice_number}`;

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:16px;">
        <div>
          <div style="font-size:1.4rem; font-weight:800; color:var(--text-main);">${inv.invoice_number}</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">Issue Date: ${PayPilot.formatDate(inv.issue_date)} • Due: ${PayPilot.formatDate(inv.due_date)}</div>
        </div>
        <span class="badge badge-${inv.status}" style="font-size:0.85rem; padding:6px 14px;">
          ${inv.status.toUpperCase()}
        </span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
        <div style="background:var(--bg-tertiary); padding:16px; border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle); margin-bottom:4px;">Billed To:</div>
          <div style="font-weight:700; font-size:1rem;">${inv.customer_name}</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">${inv.customer_email}</div>
        </div>
        <div style="background:var(--bg-tertiary); padding:16px; border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle); margin-bottom:4px;">PayPal Payment Status:</div>
          <div style="font-weight:700; font-size:1rem; color:var(--primary);">
            <i class="fa-brands fa-paypal"></i> ${inv.status === 'paid' ? 'Paid & Verified' : 'Awaiting Payment'}
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Capture ID: ${inv.paypal_capture_id || 'Not Yet Settled'}</div>
        </div>
      </div>

      <!-- Itemized Table -->
      <table class="data-table" style="margin-bottom:20px;">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items.map(it => `
            <tr>
              <td>${it.description}</td>
              <td style="text-align:right;">${it.quantity}</td>
              <td style="text-align:right;">${PayPilot.formatCurrency(it.unit_price)}</td>
              <td style="text-align:right; font-weight:700;">${PayPilot.formatCurrency(it.total)}</td>
            </tr>
          `).join('')}
          <tr style="background:var(--bg-tertiary);">
            <td colspan="3" style="text-align:right; font-weight:600;">Subtotal:</td>
            <td style="text-align:right; font-weight:700;">${PayPilot.formatCurrency(inv.subtotal)}</td>
          </tr>
          <tr style="background:var(--bg-tertiary);">
            <td colspan="3" style="text-align:right; font-weight:600;">Tax (${inv.tax_rate}%):</td>
            <td style="text-align:right; font-weight:700;">${PayPilot.formatCurrency(inv.tax_amount)}</td>
          </tr>
          <tr style="background:var(--primary-light);">
            <td colspan="3" style="text-align:right; font-weight:800; font-size:1rem; color:var(--primary);">TOTAL:</td>
            <td style="text-align:right; font-weight:800; font-size:1.1rem; color:var(--primary);">${PayPilot.formatCurrency(inv.total_amount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Copyable Payment Link Box -->
      <div style="border:1px dashed var(--border-color); border-radius:var(--radius-md); padding:14px; background:var(--bg-card); margin-bottom:14px;">
        <label style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">
          Direct Client PayPal Payment Link:
        </label>
        <div style="display:flex; gap:8px;">
          <input type="text" readonly value="${payUrl}" class="form-control" style="font-family:'JetBrains Mono'; font-size:0.82rem; background:var(--bg-tertiary);">
          <button class="btn btn-outline btn-sm" onclick="copyPaymentLink('${payUrl}')">
            <i class="fa-regular fa-copy"></i> Copy
          </button>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <a href="/api/invoices/${inv.id}/pdf" class="btn btn-outline">
        <i class="fa-solid fa-file-pdf" style="color:var(--danger);"></i> Download PDF
      </a>
      <a href="/pay/${inv.invoice_number}" target="_blank" class="btn btn-primary">
        <i class="fa-solid fa-credit-card"></i> Open Payment Portal
      </a>
    `;

  } catch (err) {
    body.innerHTML = `<div style="color:var(--danger); padding:20px;">Failed to load invoice: ${err.message}</div>`;
  }
}

function copyPaymentLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    PayPilot.showToast('PayPal payment link copied to clipboard!', 'success');
  }).catch(() => {
    PayPilot.showToast('Could not copy link.', 'error');
  });
}
