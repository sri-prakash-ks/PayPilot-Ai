/**
 * PayPilot AI - Customer Management Controller
 * Customer records, lifetime revenue, quick invoice shortcuts
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();

  const addBtn = document.getElementById('btn-add-customer');
  const modal = document.getElementById('modal-customer');
  const closeBtn = document.getElementById('modal-close-customer');
  const cancelBtn = document.getElementById('btn-cancel-customer');

  addBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  document.getElementById('create-customer-form').addEventListener('submit', handleAddCustomer);
});

async function loadCustomers() {
  const tbody = document.getElementById('customers-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Fetching client profiles...</td></tr>`;

  try {
    const res = await fetch('/api/customers');
    const customers = await res.json();

    if (!customers || customers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No customer profiles registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = customers.map(c => `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--text-main);">${c.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${c.address || 'Standard Client'}</div>
        </td>
        <td style="font-weight:600;">${c.company || 'Individual'}</td>
        <td style="font-size:0.85rem;">
          <a href="mailto:${c.email}">${c.email}</a>
        </td>
        <td style="font-size:0.85rem; color:var(--text-muted);">${c.phone || 'N/A'}</td>
        <td style="font-weight:700; color:var(--success);">
          ${PayPilot.formatCurrency(c.total_spent || c.paid_total || 0)}
        </td>
        <td style="font-weight:600; color:${c.pending_total > 0 ? 'var(--danger)' : 'var(--text-muted)'};">
          ${PayPilot.formatCurrency(c.pending_total || 0)}
        </td>
        <td style="font-weight:600; font-size:0.85rem;">
          <span class="badge" style="background:var(--bg-tertiary); color:var(--text-main);">${c.invoice_count || 0}</span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="invoiceCustomer('${escapeQuotes(c.name)}', '${escapeQuotes(c.email)}')" title="Generate Invoice for Client">
              <i class="fa-solid fa-file-circle-plus" style="color:var(--primary);"></i> Invoice
            </button>
            <button class="btn btn-sm btn-outline" style="color:var(--danger);" onclick="deleteCustomer(${c.id})" title="Delete Client Profile">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--danger);">Error: ${err.message}</td></tr>`;
  }
}

async function handleAddCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('cust-name').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const company = document.getElementById('cust-company').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();

  try {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, phone, address })
    });
    const data = await res.json();

    if (data.success) {
      PayPilot.showToast('Customer created successfully!', 'success');
      document.getElementById('modal-customer').classList.remove('active');
      document.getElementById('create-customer-form').reset();
      loadCustomers();
    } else {
      PayPilot.showToast(data.error || 'Failed to create customer.', 'error');
    }
  } catch (err) {
    PayPilot.showToast('Network error: ' + err.message, 'error');
  }
}

async function deleteCustomer(id) {
  if (!confirm('Are you sure you want to remove this customer record?')) return;

  try {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      PayPilot.showToast('Customer deleted.', 'info');
      loadCustomers();
    }
  } catch (err) {
    PayPilot.showToast('Error: ' + err.message, 'error');
  }
}

function invoiceCustomer(name, email) {
  window.location.href = `/invoices?create=true&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
}

function escapeQuotes(str) {
  return (str || '').replace(/'/g, "\\'");
}
