// Login.js - Supabase email/password sign-in
import { supabase } from '../../../conn/SupabaseAPIconn.js';

console.log('[Login.js] Loaded, supabase:', !!supabase);

const el = id => document.getElementById(id);

function initStatus() {
  let status = el('status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'status';
    status.style.cssText = 'margin:12px 0;padding:8px;border-radius:4px;color:#bfe3a7;';
    const container = el('credentialsContainer');
    if (container) {
      container.appendChild(status);
      console.log('[Login.js] Created status element');
    }
  }
  return status;
}

let status = null;

function showStatus(msg, isError = false) {
  if (!status) status = initStatus();
  if (status) {
    status.textContent = msg;
    status.style.color = isError ? '#ffcccc' : '#bfe3a7';
  }
  console.log('[Login.js]', isError ? 'ERROR' : 'OK', msg);
}

function clearStatus() {
  if (status) status.textContent = '';
}

function setupLoginButton() {
  const btn = el('loginbtn');
  if (!btn) {
    console.error('[Login.js] loginbtn not found in DOM');
    return;
  }
  
  console.log('[Login.js] Attaching click listener to loginbtn');
  
  btn.addEventListener('click', async () => {
    const email = el('emailField').value.trim();
    const password = el('passwordField').value.trim();

    if (!email || !password) {
      return showStatus('Email and password required', true);
    }

    btn.disabled = true;
    showStatus('Signing in...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // check if user is confirmed
      if (data?.user?.email_confirmed_at) {
        showStatus('Signed in! Redirecting...');
        // redirect to home after a short delay so user sees confirmation
        setTimeout(() => {
          // check for 'next' query param to redirect back to where user came from
          const params = new URLSearchParams(window.location.search);
          const next = params.get('next');
          // use absolute path from repo root
          window.location.href = next ? decodeURIComponent(next) : '/app/home/home.html';
        }, 800);
      } else {
        showStatus('Please confirm your email before signing in.', true);
      }
    } catch (err) {
      console.error('login error', err);
      showStatus(`Error: ${err.message || err}`, true);
    } finally {
      btn.disabled = false;
    }
  });
}

function setupAutoRedirect() {
  // Optional: check if already signed in and redirect
  (async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      console.log('[Login.js] Already signed in, redirecting to home');
      // already signed in, redirect to home
      window.location.href = '/app/home/home.html';
    }
  })();
}

// Wait for DOM to be ready then setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupLoginButton();
    setupAutoRedirect();
  });
  console.log('[Login.js] Added DOMContentLoaded listener');
} else {
  setupLoginButton();
  setupAutoRedirect();
  console.log('[Login.js] DOM already ready, setup immediately');
}
