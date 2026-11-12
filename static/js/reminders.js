/**
 * PayPilot AI - Smart Payment Reminders Controller
 * Overdue & Upcoming categorization, AI Tone generator, Copy & WhatsApp integration
 */

let pendingData = { overdue: [], upcoming: [] };
let currentTab = 'overdue';
let selectedInvoice = null;
let currentTone = 'polite';

document.addEventListener('DOMContentLoaded', () => {
  initReminderEvents();
  loadReminders();
});

function initReminderEvents() {
  // Tabs
  const tabs = document.querySelectorAll('.reminder-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active', 'btn-primary');
        t.classList.add('btn-outline');
      });
      tab.classList.add('active', 'btn-primary');
      tab.classList.remove('btn-outline');
      currentTab = tab.getAttribute('data-tab');
      renderRemindersTable();
    });
  });

  // Tone Buttons
  const toneBtns = document.querySelectorAll('.tone-btn');
  toneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toneBtns.forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-outline');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-outline');
      currentTone = btn.getAttribute('data-tone');
      if (selectedInvoice) {
        generateAIReminder(selectedInvoice.invoice_number, currentTone);
      }
    });
  });

  // Copy button
  document.getElementById('btn-copy-reminder').addEventListener('click', () => {
    const text = document.getElementById('reminder-message').value;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        PayPilot.showToast('Reminder message copied to clipboard!', 'success');
      });
    }
  });

  // Email button
  document.getElementById('btn-send-email').addEventListener('click', () => {
    if (!selectedInvoice) return;
    const subject = encodeURIComponent(document.getElementById('reminder-subject').value);
    const body = encodeURIComponent(document.getElementById('reminder-message').value);
    window.location.href = `mailto:${selectedInvoice.customer_email}?subject=${subject}&body=${body}`;
  });

  // WhatsApp button
  document.getElementById('btn-share-whatsapp').addEventListener('click', () => {
    const text = encodeURIComponent(document.getElementById('reminder-message').value);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  });
}

async function loadReminders() {
  try {
    const res = await fetch('/api/reminders/pending');
    pendingData = await res.json();

    document.getElementById('count-overdue').textContent = pendingData.overdue.length;
    document.getElementById('count-upcoming').textContent = pendingData.upcoming.length;

    // Update banner
    const totalOverdue = pendingData.overdue.reduce((acc, curr) => acc + curr.total_amount, 0);
    const bannerTitle = document.getElementById('banner-overdue-title');
    const bannerSubtitle = document.getElementById('banner-overdue-subtitle');
    if (bannerTitle && bannerSubtitle) {
      bannerTitle.textContent = `${pendingData.overdue.length} Overdue Invoices Requiring Immediate Action`;
      bannerSubtitle.textContent = `Totaling ${PayPilot.formatCurrency(totalOverdue)} in past-due receivables. Dispatch tailored AI reminders to recover cash flow.`;
    }

    renderRemindersTable();

    // Auto select first invoice
    if (pendingData.overdue.length > 0) {
      selectInvoiceForReminder(pendingData.overdue[0]);
    } else if (pendingData.upcoming.length > 0) {
      selectInvoiceForReminder(pendingData.upcoming[0]);
    }

  } catch (err) {
    console.error('Error loading reminders:', err);
    PayPilot.showToast('Failed to load pending reminders: ' + err.message, 'error');
  }
}

function renderRemindersTable() {
  const tbody = document.getElementById('reminders-table-body');
  const items = currentTab === 'overdue' ? pendingData.overdue : pendingData.upcoming;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:28px; color:var(--text-muted);">No ${currentTab} invoices found. Great job!</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(inv => {
    const isSelected = selectedInvoice && selectedInvoice.id === inv.id;
    return `
      <tr style="${isSelected ? 'background:var(--primary-light); font-weight:600;' : ''}">
        <td style="font-family:'JetBrains Mono'; font-weight:700;">
          ${inv.invoice_number}
        </td>
        <td>
          <div style="font-weight:600;">${inv.customer_name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${inv.customer_email}</div>
        </td>
        <td style="font-size:0.84rem; color:${currentTab === 'overdue' ? 'var(--danger)' : 'var(--text-muted)'}; font-weight:600;">
          ${PayPilot.formatDate(inv.due_date)}
        </td>
        <td style="font-weight:700;">
          ${PayPilot.formatCurrency(inv.total_amount)}
        </td>
        <td>
          <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}" onclick='selectInvoiceById(${inv.id})'>
            <i class="fa-solid fa-pen-to-square"></i> Draft
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function selectInvoiceById(id) {
  const all = [...pendingData.overdue, ...pendingData.upcoming];
  const found = all.find(i => i.id === id);
  if (found) {
    selectInvoiceForReminder(found);
    renderRemindersTable();
  }
}

function autoSelectFirstOverdue() {
  if (pendingData.overdue.length > 0) {
    selectInvoiceForReminder(pendingData.overdue[0]);
    renderRemindersTable();
    // Default to firm tone for overdue
    const firmBtn = document.querySelector('.tone-btn[data-tone="firm"]');
    if (firmBtn) firmBtn.click();
  }
}

async function selectInvoiceForReminder(invoice) {
  selectedInvoice = invoice;
  document.getElementById('target-inv-label').textContent = `${invoice.invoice_number} (${invoice.customer_name})`;
  document.getElementById('target-inv-amount').textContent = PayPilot.formatCurrency(invoice.total_amount);

  // If overdue, default to firm if polite
  if (invoice.status === 'overdue' && currentTone === 'polite') {
    currentTone = 'firm';
    const firmBtn = document.querySelector('.tone-btn[data-tone="firm"]');
    if (firmBtn) {
      document.querySelectorAll('.tone-btn').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-outline');
      });
      firmBtn.classList.add('active', 'btn-primary');
      firmBtn.classList.remove('btn-outline');
    }
  }

  await generateAIReminder(invoice.invoice_number, currentTone);
}

async function generateAIReminder(invoiceNumber, tone) {
  document.getElementById('reminder-subject').value = 'Generating AI reminder...';
  document.getElementById('reminder-message').value = 'Consulting PayPilot AI message engine...';

  try {
    const res = await fetch('/api/ai/generate-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: invoiceNumber, tone: tone })
    });
    const data = await res.json();

    if (data.subject && data.message) {
      document.getElementById('reminder-subject').value = data.subject;
      document.getElementById('reminder-message').value = data.message;
    }
  } catch (err) {
    PayPilot.showToast('Error generating reminder: ' + err.message, 'error');
  }
}
