/**
 * PayPilot AI - Cash Flow Analyst Controller
 * P&L Charts, Expense Allocation Donut, Anomaly Detector, Strategic AI Insights
 */

let trendChart = null;
let donutChart = null;

document.addEventListener('DOMContentLoaded', () => {
  loadCashflowAnalytics();

  document.getElementById('btn-refresh-audit').addEventListener('click', () => {
    PayPilot.showToast('Re-running algorithmic cash flow audit...', 'info');
    loadCashflowAnalytics();
  });

  document.getElementById('btn-export-report').addEventListener('click', () => {
    window.print();
  });
});

async function loadCashflowAnalytics() {
  try {
    const res = await fetch('/api/ai/cashflow-analysis');
    const data = await res.json();

    const summary = data.summary;

    // 1. Metrics
    document.getElementById('cf-net-profit').textContent = PayPilot.formatCurrency(summary.net_profit);
    document.getElementById('cf-profit-margin').innerHTML = `<i class="fa-solid fa-chart-pie"></i> <span>Profit Margin: ${summary.profit_margin}%</span>`;
    document.getElementById('cf-burn-rate').textContent = PayPilot.formatCurrency(data.burn_rate);
    document.getElementById('cf-runway').textContent = `${data.runway_months} Mo`;
    document.getElementById('cf-locked-cash').textContent = PayPilot.formatCurrency(summary.overdue_amount);

    // 2. Trend Chart
    renderCashflowTrend();

    // 3. Donut Chart
    renderExpenseDonut(data.expenses_by_category);

    // 4. Anomalies
    renderAnomalies(data.anomalies);

    // 5. Recommendations
    renderRecommendations(data.recommendations);

  } catch (err) {
    console.error('Error loading analytics:', err);
    PayPilot.showToast('Failed to load cash flow analysis: ' + err.message, 'error');
  }
}

function renderCashflowTrend() {
  const ctx = document.getElementById('cashflowTrendChart');
  if (!ctx) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const income = [14200, 18600, 21400, 19800, 27800, 24884];
  const expenses = [4100, 4350, 5720, 4500, 7760, 7280];
  const net = income.map((inc, i) => inc - expenses[i]);

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Inflow (Revenue)',
          data: income,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5
        },
        {
          label: 'Outflow (Expenses)',
          data: expenses,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          borderWidth: 2
        },
        {
          label: 'Net Cash Flow',
          data: net,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: (v) => '$' + (v / 1000) + 'k'
          }
        }
      }
    }
  });
}

function renderExpenseDonut(categories) {
  const ctx = document.getElementById('expenseDonutChart');
  if (!ctx || !categories) return;

  const labels = categories.map(c => c.category);
  const values = categories.map(c => c.total);

  if (donutChart) donutChart.destroy();

  const colors = ['#0284c7', '#38bdf8', '#6366f1', '#f59e0b', '#10b981'];

  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111827' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false }
      }
    }
  });

  const legend = document.getElementById('expense-legend');
  if (legend) {
    legend.innerHTML = categories.map((c, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="width:10px; height:10px; background:${colors[i % colors.length]}; border-radius:2px;"></span>
          <span style="color:var(--text-muted);">${c.category}</span>
        </div>
        <span style="font-weight:700;">${PayPilot.formatCurrency(c.total)}</span>
      </div>
    `).join('');
  }
}

function renderAnomalies(anomalies) {
  const container = document.getElementById('anomalies-container');
  if (!container) return;

  container.innerHTML = anomalies.map(a => `
    <div style="background:var(--bg-tertiary); border-left:4px solid ${a.severity === 'medium' ? '#f59e0b' : '#38bdf8'}; border-radius:0 var(--radius-md) var(--radius-md) 0; padding:14px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="font-weight:700; font-size:0.9rem; color:var(--text-main);">${a.category}</span>
        <span style="font-size:0.75rem; font-weight:700; color:${a.severity === 'medium' ? '#b45309' : 'var(--primary)'}; text-transform:uppercase;">${a.severity} risk</span>
      </div>
      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:6px;">${a.detail}</p>
      <div style="font-size:0.75rem; font-weight:700; color:var(--danger);">${a.impact}</div>
    </div>
  `).join('');
}

function renderRecommendations(recommendations) {
  const container = document.getElementById('recommendations-container');
  if (!container) return;

  container.innerHTML = recommendations.map(r => `
    <div style="background:var(--primary-light); border:1px solid rgba(2, 132, 199, 0.2); border-radius:var(--radius-md); padding:14px;">
      <div style="font-weight:700; font-size:0.92rem; color:var(--primary); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
        <i class="fa-solid fa-arrow-trend-up"></i> ${r.title}
      </div>
      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:6px;">${r.description}</p>
      <div style="font-size:0.75rem; font-weight:700; color:var(--success);">Impact: ${r.potential_gain}</div>
    </div>
  `).join('');
}
