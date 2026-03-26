import { supabase } from '../../../conn/SupabaseAPIconn.js';
import { initSiteAuth } from '../../common/auth.js';
import { loadSidebarComponent, initSidebarEvents } from '../../components/sidebar.js';

// URL da imagem padrão (Copiada do teu Supabase)
const DEFAULT_AVATAR_URL = 'https://wthlsjmxbhtnwacklwci.supabase.co/storage/v1/object/public/images/profile_pictures/Subsequent-stages-of-the-glider-pattern-on-Conways-Game-of-Life-cellular-automaton-grid_Q320.jpg';

const el = id => document.getElementById(id);

const elements = {
    usernameInput: el('usernameInput'),
    emailDisplay: el('emailDisplay'),
    profileImage: el('profileImage'),
    headerProfilePic: el('headerProfilePic'),
    avatarContainer: el('avatarContainer'),
    avatarInput: el('avatarInput'),
    saveBtn: el('saveBtn'),
    cancelBtn: el('cancelBtn'),
    statusMessage: el('statusMessage'),
    myDecksList: el('myDecksList'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    
    
};

let currentUser = null;
let newAvatarFile = null;
let myDecksCache = []; // Guarda os decks para filtrar sem recarregar

// Função de Logout (se ainda não tiveres no ficheiro)
async function signOut(e) {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '../../home.html'; // Ajusta o caminho para a home
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth (Mantém o que já tens)
    const currentUser = await initSiteAuth({ loginPath: '../../HTML/Register/Login.html' });

    // 2. CARREGAR A SIDEBAR NOVA (Isto substitui o initSidebar antigo)
    const sidebarElements = await loadSidebarComponent();
    initSidebarEvents(sidebarElements, signOut);

    // ... o resto do teu código (loadDeck, loadProfile, etc.) ...
});

// ==========================================
// CARREGAR DADOS
// ==========================================
async function loadMyProfile(user) {
    elements.emailDisplay.textContent = user.email;

    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        if (profile) {
            elements.usernameInput.value = profile.username || '';
            const avatar = profile.avatar_url || DEFAULT_AVATAR_URL;
            elements.profileImage.src = avatar;
            
            // Header
            if(elements.headerProfilePic) {
                elements.headerProfilePic.innerHTML = `<img src="${avatar}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        } else {
            elements.profileImage.src = DEFAULT_AVATAR_URL;
        }
    } catch (err) { console.error(err); }
}

async function loadMyDecks(userId) {
    try {
        const { data: decks, error } = await supabase
            .from('decks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        myDecksCache = decks || [];
        renderDecks(myDecksCache); // Mostra todos inicialmente

    } catch (err) {
        console.error(err);
        elements.myDecksList.innerHTML = '<p>Error loading decks.</p>';
    }
}

// ==========================================
// INTERAÇÃO E SALVAR
// ==========================================
function setupEventListeners() {
    // Troca de Foto
    elements.avatarContainer.addEventListener('click', () => elements.avatarInput.click());
    
    elements.avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newAvatarFile = file;
            elements.profileImage.src = URL.createObjectURL(file); // Preview
        }
    });

    // Salvar
    elements.saveBtn.addEventListener('click', saveProfileChanges);
    
    // Cancelar
    elements.cancelBtn.addEventListener('click', () => {
        if(confirm('Discard unsaved changes?')) window.location.reload();
    });

    // Abas de Filtro
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active de todos
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            // Adiciona ao clicado
            btn.classList.add('active');
            
            // Filtra
            const filter = btn.dataset.filter;
            filterDecks(filter);
        });
    });
}

function filterDecks(criteria) {
    if (criteria === 'all') {
        renderDecks(myDecksCache);
    } else if (criteria === 'public') {
        renderDecks(myDecksCache.filter(d => d.is_public));
    } else if (criteria === 'private') {
        renderDecks(myDecksCache.filter(d => !d.is_public));
    }
}

async function saveProfileChanges() {
    if (!currentUser) return;

    elements.saveBtn.disabled = true;
    elements.saveBtn.textContent = "Saving...";
    showMessage("");

    try {
        let finalAvatarUrl = elements.profileImage.src;
        // Se for blob (preview local), significa que não fizemos upload ainda
        if (finalAvatarUrl.startsWith('blob:') && !newAvatarFile) {
            // Caso raro, mantém o antigo
        } 
        else if (newAvatarFile) {
            showMessage("Uploading image...", "#64B5F6"); // Azul
            const fileExt = newAvatarFile.name.split('.').pop();
            const fileName = `avatar_${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `profile_pictures/${fileName}`; // Verifica se tens esta pasta no bucket 'images'

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, newAvatarFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            finalAvatarUrl = data.publicUrl;
        }

        // Atualizar Perfil
        const updates = {
            id: currentUser.id,
            username: elements.usernameInput.value.trim(),
            avatar_url: finalAvatarUrl,
            updated_at: new Date()
        };

        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;

        showMessage("Profile updated!", "#4CAF50"); // Verde
        setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
        console.error(err);
        showMessage("Error: " + err.message, "#ef5350"); // Vermelho
        elements.saveBtn.disabled = false;
        elements.saveBtn.textContent = "Save Changes";
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================
function showMessage(msg, color = "#fff") {
    elements.statusMessage.textContent = msg;
    elements.statusMessage.style.color = color;
}

function renderDecks(decks) {
    elements.myDecksList.innerHTML = '';
    if (!decks || decks.length === 0) {
        elements.myDecksList.innerHTML = "<p style='color:#888'>No decks found in this category.</p>";
        return;
    }

    decks.forEach(deck => {
        const card = document.createElement('div');
        card.className = 'deck-card';
        const bg = deck.thumbnail_url ? `url('${deck.thumbnail_url}')` : 'linear-gradient(135deg, #667eea, #764ba2)';
        
        // Badge
        const badgeText = deck.is_public ? 'PUBLIC' : 'PRIVATE';
        const badgeColor = deck.is_public ? '#4CAF50' : '#FF9800';

        card.innerHTML = `
            <div class="deck-thumb" style="background-image: ${bg}">
                <span style="position:absolute; top:8px; right:8px; background:${badgeColor}; color:#000; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">${badgeText}</span>
            </div>
            <div class="deck-info">
                <h4>${deck.name}</h4>
                <p>${deck.description || 'No description'}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
             window.location.href = `../Content/deck.html?id=${deck.id}`;
        });

        elements.myDecksList.appendChild(card);
    });
}


