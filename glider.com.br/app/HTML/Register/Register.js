// Register.js - Supabase email/password sign-up
import { supabase } from '../../../conn/SupabaseAPIconn.js';

console.log('[Register.js] Loaded, supabase:', !!supabase);

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
      console.log('[Register.js] Created status element');
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
  console.log('[Register.js]', isError ? 'ERROR' : 'OK', msg);
}

function clearStatus() {
  if (status) status.textContent = '';
}

function setupRegisterButton() {
  const btn = el('registerbtn');
  if (!btn) {
    console.error('[Register.js] registerbtn not found in DOM');
    return;
  }
  
  console.log('[Register.js] Attaching click listener to registerbtn');
  
  btn.addEventListener('click', async () => {
    const email = el('emailField').value.trim();
    const password = el('passwordField').value.trim();
    const username = el('usernameField').value.trim();

    if (!email || !password || !username) {
      return showStatus('All fields required', true);
    }

    if (password.length < 6) {
      return showStatus('Password must be at least 6 characters', true);
    }

    btn.disabled = true;
    showStatus('Registering...');

    try {
      // sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;

      // check if email needs confirmation
      if (data?.user?.identities?.length === 0) {
        showStatus('Email already registered. Try logging in instead.');
      } else {
        showStatus('Registration successful! Check your email for confirmation link.');
        // optional: redirect to login after a delay
        setTimeout(() => {
          window.location.href = './Login.html';
        }, 2000);
      }
    } catch (err) {
      console.error('register error', err);
      showStatus(`Error: ${err.message || err}`, true);
    } finally {
      btn.disabled = false;
    }
  });
}

// Wait for DOM to be ready then setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupRegisterButton);
  console.log('[Register.js] Added DOMContentLoaded listener');
} else {
  setupRegisterButton();
  console.log('[Register.js] DOM already ready, setup immediately');
}
