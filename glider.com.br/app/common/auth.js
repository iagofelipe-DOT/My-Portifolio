// app/common/auth.js
import { supabase } from '../../conn/SupabaseAPIconn.js';

// Returns current user object or null
export async function getUser() {
    try {
        const { data } = await supabase.auth.getUser();
        return data?.user || null;
    } catch (e) {
        console.error('getUser error', e);
        return null;
    }
}

// If not signed-in, redirect to login. Returns user or null.
export async function requireAuth(redirectTo = '/app/HTML/Register/Login.html') {
    const user = await getUser();
    if (!user) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        const joinChar = redirectTo.includes('?') ? '&' : '?';
        window.location.href = `${redirectTo}${joinChar}next=${next}`;
        return null;
    }
    return user;
}

// Subscribe to auth state changes and call callback(event, session)
export function onAuthChange(cb) {
    return supabase.auth.onAuthStateChange((event, session) => cb(event, session));
}

// Initialize site-wide auth behavior
export async function initSiteAuth({ siteTitleId = 'siteTitle', loginPath = '/app/HTML/Register/Login', homePath = '/app/home/home.html' } = {s}) {
    const user = await getUser();
    const titleEl = document.getElementById(siteTitleId);
    
    if (titleEl) {
        titleEl.style.cursor = 'pointer';
        titleEl.onclick = () => { window.location.href = user ? homePath : loginPath; };
    }

    // Keep header link updated on auth changes
    onAuthChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            window.location.reload();
        }
    });

    return user;
}