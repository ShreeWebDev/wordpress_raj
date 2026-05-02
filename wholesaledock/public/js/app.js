// Global utility functions for Wholesaledock

// AJAX helper
async function apiCall(url, method = 'GET', data = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const r = await fetch(url, opts);
  return r.json();
}

// Show toast notification
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `alert alert-${type === 'error' ? 'danger' : type} d-flex align-items-center gap-2 shadow`;
  toast.style.cssText = 'min-width:280px;max-width:380px;animation:slideIn 0.3s ease;';
  toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// CBM calculator
function calcCbm(l, b, h) {
  const lv = parseFloat(l) || 0, bv = parseFloat(b) || 0, hv = parseFloat(h) || 0;
  if (lv && bv && hv) return ((lv / 100) * (bv / 100) * (hv / 100)).toFixed(4);
  return '';
}

// Attach CBM auto-calc to dimension inputs
function initCbmCalc(lInput, bInput, hInput, cbmOutput) {
  [lInput, bInput, hInput].forEach(el => {
    if (el) el.addEventListener('input', () => {
      const v = calcCbm(lInput?.value, bInput?.value, hInput?.value);
      if (cbmOutput) cbmOutput.value = v;
    });
  });
}

// Confirm dialog
function confirmAction(message, callback) {
  if (confirm(message)) callback();
}

// Format date
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format number
function fmtNum(n, dec = 2) {
  const v = parseFloat(n);
  return isNaN(v) ? '—' : v.toFixed(dec);
}

// Slide-in animation
const style = document.createElement('style');
style.textContent = '@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
document.head.appendChild(style);
