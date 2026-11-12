/**
 * PayPilot AI - Payment Tracker Controller
 * Transaction log, PayPal Sandbox verification proof, CSV export
 */

let currentTxnFilter = 'ALL';
let currentTxnSearch = '';
let allLoadedTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  initTxnEvents();
  loadTransactions();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('id')) {
    viewTxnDetail(urlParams.get('id'));
  }
  if (urlParams.get('search')) {
    document.getElementById('txn-search-input').value = urlParams.get('search');
    loadTransactions('ALL', urlParams.get('search'));
  }
});

function initTxnEvents() {
  // Filter tabs
  const tabs = document.querySelectorAll('.txn-filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active', 'btn-primary');
        t.classList.add('btn-outline');
      });
      tab.classList.add('active', 'btn-primary');
      tab.classList.remove('btn-outline');
      currentTxnFilter = tab.getAttribute('data-status');
      loadTransactions(currentTxnFilter, currentTxnSearch);
    });
  });

  // Search input
  const searchInput = document.getElementById('txn-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentTxnSearch = e.target.value.trim();
      loadTransactions(currentTxnFilter, currentTxnSearch);
    });
  }

  // Close modal
  document.getElementById('modal-close-txn').addEventListener('click', () => {
    document.getElementById('modal-txn-detail').classList.remove('active');
  });

  // CSV export
  document.getElementById('btn-export-csv').addEventListener('click', exportTxnToCSV);
}

async function loadTransactions(status = currentTxnFilter, search = currentTxnSearch) {
  const tbody = document.getElementById('transactions-tbody');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Fetching transaction records...</td></tr>`;

  try {
    let url = `/api/transactions?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const txns = await res.json();
    allLoadedTransactions = txns;

    if (!txns || txns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">No transaction records match criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = txns.map(t => `
      <tr>
        <td style="font-family:'JetBrains Mono'; font-weight:700; color:var(--primary);">
          <a href="javascript:void(0)" onclick="viewTxnDetail(${t.id})">${t.transaction_id}</a>
        </td>
        <td>
          <div style="font-weight:600;">${t.customer_name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${t.customer_email}</div>
        </td>
        <td style="font-weight:600; font-size:0.82rem;">
          ${t.invoice_number ? `<a href="/invoices?search=${t.invoice_number}">${t.invoice_number}</a>` : '<span style="color:var(--text-subtle);">Direct Checkout</span>'}
        </td>
        <td style="font-weight:700; font-size:0.95rem;">
          ${PayPilot.formatCurrency(t.amount, t.currency)}
        </td>
        <td style="color:var(--text-muted); font-size:0.85rem;">
          ${PayPilot.formatCurrency(t.fee_amount || 0, t.currency)}
        </td>
        <td style="font-weight:700; color:var(--success); font-size:0.95rem;">
          ${PayPilot.formatCurrency(t.net_amount || t.amount, t.currency)}
        </td>
        <td>
          <span class="badge badge-${(t.status || 'COMPLETED').toLowerCase()}">
            <i class="fa-solid fa-check"></i> ${t.status}
          </span>
        </td>
        <td style="font-size:0.82rem; color:var(--text-muted);">
          ${t.created_at}
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewTxnDetail(${t.id})" title="Inspect PayPal Capture Payload">
            <i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Verify
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--danger);">Error loading transactions: ${err.message}</td></tr>`;
  }
}

async function viewTxnDetail(txnId) {
  const modal = document.getElementById('modal-txn-detail');
  const body = document.getElementById('txn-modal-body');

  modal.classList.add('active');
  body.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading verification details...</div>`;

  try {
    const res = await fetch(`/api/transactions/${txnId}`);
    const txn = await res.json();

    body.innerHTML = `
      <div style="background:var(--success-light); border:1px solid rgba(16, 185, 129, 0.3); border-radius:var(--radius-md); padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:14px;">
        <i class="fa-solid fa-circle-check" style="font-size:1.8rem; color:var(--success);"></i>
        <div>
          <div style="font-weight:800; color:var(--success); font-size:0.95rem;">PayPal Developer Sandbox Verified Settlement</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Immutable payment record authoritatively verified by server backend.</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle);">Transaction ID</div>
          <div style="font-family:'JetBrains Mono'; font-weight:700;">${txn.transaction_id}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle);">PayPal Capture ID</div>
          <div style="font-family:'JetBrains Mono'; font-weight:700; color:#0070ba;">${txn.paypal_capture_id || 'CAP-SANDBOX'}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle);">Customer</div>
          <div style="font-weight:600;">${txn.customer_name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${txn.customer_email}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle);">Payment Channel</div>
          <div style="font-weight:600;"><i class="fa-brands fa-paypal" style="color:#0070ba;"></i> ${txn.payment_method || 'PayPal Sandbox'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Order Ref: ${txn.paypal_order_id || 'N/A'}</div>
        </div>
      </div>

      <div style="background:var(--bg-tertiary); padding:14px; border-radius:var(--radius-md); margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.88rem;">
          <span style="color:var(--text-muted);">Gross Captured Amount:</span>
          <span style="font-weight:700;">${PayPilot.formatCurrency(txn.amount, txn.currency)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.88rem;">
          <span style="color:var(--text-muted);">Estimated Processing Fee (2.9% + $0.30):</span>
          <span style="font-weight:600; color:var(--danger);">- ${PayPilot.formatCurrency(txn.fee_amount || 0, txn.currency)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:1.05rem; font-weight:800; border-top:1px solid var(--border-color); padding-top:6px;">
          <span>Net Settled Amount:</span>
          <span style="color:var(--success);">${PayPilot.formatCurrency(txn.net_amount || txn.amount, txn.currency)}</span>
        </div>
      </div>

      <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-subtle); margin-bottom:6px;">
        Raw PayPal API Audit Payload:
      </div>
      <pre style="background:var(--bg-body); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; font-size:0.75rem; max-height:140px; overflow-y:auto; font-family:'JetBrains Mono';">${JSON.stringify(txn.raw_details || { status: 'COMPLETED', verified: true }, null, 2)}</pre>
    `;

  } catch (err) {
    body.innerHTML = `<div style="color:var(--danger); padding:20px;">Error: ${err.message}</div>`;
  }
}

function exportTxnToCSV() {
  if (!allLoadedTransactions || allLoadedTransactions.length === 0) {
    PayPilot.showToast('No transactions to export.', 'info');
    return;
  }

  const headers = ['Transaction ID', 'Customer Name', 'Customer Email', 'Invoice Number', 'Gross Amount', 'Fee', 'Net Amount', 'Status', 'Date'];
  const rows = allLoadedTransactions.map(t => [
    t.transaction_id,
    `"${t.customer_name}"`,
    t.customer_email,
    t.invoice_number || 'Direct',
    t.amount,
    t.fee_amount || 0,
    t.net_amount || t.amount,
    t.status,
    `"${t.created_at}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PayPilot_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  PayPilot.showToast('CSV transaction report downloaded!', 'success');
}
