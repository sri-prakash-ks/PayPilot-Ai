/**
 * PayPilot AI - Dashboard Controller
 * Metric cards, Chart.js financial charts, AI Insights, Recent Transactions
 */

let revenueChartInstance = null;

async function loadDashboard() {
  try {
    const res = await fetch('/api/stats/dashboard');
    const data = await res.json();

    // 1. Metric Cards
    document.getElementById('stat-total-revenue').textContent = PayPilot.formatCurrency(data.total_revenue);
    document.getElementById('stat-payments-received').textContent = PayPilot.formatCurrency(data.total_payments_amount);
    document.getElementById('stat-payments-count').textContent = `${data.total_payments_count} settled orders`;
    document.getElementById('stat-pending-amount').textContent = PayPilot.formatCurrency(data.pending_amount);
    document.getElementById('stat-pending-count').textContent = `${data.pending_count} awaiting settlement`;
    document.getElementById('stat-total-txns').textContent = data.total_transactions;

    // Update overdue badge
    const badge = document.getElementById('overdue-badge-count');
    if (badge) badge.textContent = data.pending_count;

    // 2. Render Chart.js
    renderRevenueChart(data.monthly_chart);

    // 3. Render AI Insights
    renderAIInsights(data.ai_insights);

    // 4. Render Recent Transactions
    renderRecentTransactions(data.recent_transactions);

  } catch (err) {
    console.error('Error loading dashboard stats:', err);
    PayPilot.showToast('Could not load dashboard data. Check server logs.', 'error');
  }
}

function renderRevenueChart(monthlyData) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const labels = monthlyData.map(d => d.month);
  const revenueValues = monthlyData.map(d => d.revenue);
  const expenseValues = monthlyData.map(d => d.expenses);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Revenue ($)',
          data: revenueValues,
          backgroundColor: '#0284c7',
          borderRadius: 6,
          barThickness: 20
        },
        {
          label: 'Expenses ($)',
          data: expenseValues,
          backgroundColor: isDark ? '#334155' : '#cbd5e1',
          borderRadius: 6,
          barThickness: 20
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: function(val) { return '$' + (val / 1000) + 'k'; }
          }
        }
      }
    }
  });
}

function renderAIInsights(insights) {
  const container = document.getElementById('ai-insights-container');
  if (!container) return;

  if (!insights || insights.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No current alerts. Finances look optimal!</div>`;
    return;
  }

  container.innerHTML = insights.map(item => `
    <div class="ai-insight-card">
      <div class="ai-insight-icon" style="background:${item.type === 'opportunity' ? 'var(--primary)' : item.type === 'warning' ? '#f59e0b' : '#10b981'};">
        <i class="fa-solid ${item.icon}"></i>
      </div>
      <div>
        <div class="ai-insight-title">${item.title}</div>
        <div class="ai-insight-desc">${item.description}</div>
      </div>
    </div>
  `).join('');
}

function renderRecentTransactions(transactions) {
  const tbody = document.getElementById('recent-transactions-tbody');
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No transactions recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td style="font-family:'JetBrains Mono', monospace; font-weight:600; font-size:0.82rem;">
        <span style="color:var(--primary);">${t.transaction_id}</span>
      </td>
      <td>
        <div style="font-weight:600;">${t.customer_name}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${t.customer_email}</div>
      </td>
      <td style="font-weight:600; font-size:0.82rem;">
        ${t.invoice_number ? `<a href="/invoices?search=${t.invoice_number}">${t.invoice_number}</a>` : '<span style="color:var(--text-subtle);">Direct Checkout</span>'}
      </td>
      <td style="font-weight:700; color:var(--text-main);">
        ${PayPilot.formatCurrency(t.amount, t.currency || 'USD')}
      </td>
      <td>
        <span class="badge badge-${(t.status || 'COMPLETED').toLowerCase()}">
          <i class="fa-solid fa-check"></i> ${t.status}
        </span>
      </td>
      <td style="font-size:0.82rem; color:var(--text-muted);">
        <i class="fa-brands fa-paypal" style="color:#0070ba; margin-right:4px;"></i> ${t.payment_method || 'PayPal'}
      </td>
      <td style="font-size:0.82rem; color:var(--text-muted);">
        ${PayPilot.formatDate(t.created_at)}
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="window.location.href='/transactions?id=${t.id}'" title="View PayPal Capture Details">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Details
        </button>
      </td>
    </tr>
  `).join('');
}

// Reload charts when theme changes to adjust grid line colors
window.addEventListener('storage', (e) => {
  if (e.key === 'paypilot_theme') {
    loadDashboard();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});
