import { supabase } from '../../../conn/SupabaseAPIconn.js';
import { initSiteAuth } from '../../common/auth.js';
import { loadSidebarComponent, initSidebarEvents } from '../../components/sidebar.js';


// --- CONFIGURAÇÃO ---
// COLA AQUI O TEU LINK DO SUPABASE QUE COPIASTE
const DEFAULT_AVATAR_URL = 'https://wthlsjmxbhtnwacklwci.supabase.co/storage/v1/object/public/images/profile_pictures/Subsequent-stages-of-the-glider-pattern-on-Conways-Game-of-Life-cellular-automaton-grid_Q320.jpg'; 

const el = id => document.getElementById(id);

// ... (resto das constantes e inicialização igual) ...

// ==========================================
// FUNÇÕES DE DADOS (SUPABASE)
// ==========================================

async function loadProfileData(userId) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn("Perfil não encontrado.", error.message);
            elements.profileName.textContent = "Unknown User";
            // Usa a imagem do Supabase como fallback
            elements.profileImage.src = DEFAULT_AVATAR_URL; 
            return;
        }

        if (profile) {
            elements.profileName.textContent = profile.username || "Unnamed User";
            
            // LÓGICA INTELIGENTE:
            if (profile.avatar_url) {
                elements.profileImage.src = profile.avatar_url;
            } else {
                // Se o user existe mas não tem foto, usa a do Supabase
                elements.profileImage.src = DEFAULT_AVATAR_URL;
            }
            
            elements.followersCount.textContent = "0 Followers"; 
        }

    } catch (err) {
        console.error("Erro crítico:", err);
        // Mesmo no erro crítico, tentamos mostrar a imagem padrão
        elements.profileImage.src = DEFAULT_AVATAR_URL;
    }
}
// Elementos da Página
const elements = {
    profileName: el('profileName'),
    profileImage: el('profileImage'),
    deckCount: el('deckCount'),
    followersCount: el('followersCount'),
    publicDecksList: el('publicDecksList'),
    followBtn: el('followBtn'),
    
};

// Pega o ID da URL (ex: .../viewProfile.html?id=USUARIO_XYZ)
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('id');

async function signOut(e) {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '../home.html';
  }
  
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa Autenticação (Quem está a ver?)
    const currentUser = await initSiteAuth({ loginPath: '../../HTML/Register/Login.html' });

    // 2. CARREGAR A SIDEBAR NOVA (Isto substitui o initSidebar antigo)
    const sidebarElements = await loadSidebarComponent();
    initSidebarEvents(sidebarElements, signOut);

    // 3. Validação Básica
    if (!targetUserId) {
        elements.profileName.textContent = "User not found";
        elements.publicDecksList.innerHTML = "<p style='padding:20px; color:#bbb'>No user ID provided in URL.</p>";
        return;
    }

    // 4. Se eu estiver a ver o meu próprio perfil
    if (currentUser && currentUser.id === targetUserId) {
        configureOwnerView();
    } else {
        configureVisitorView(); // Lógica de "Seguir" (Futuro)
    }

    // 5. Carregar Dados Reais
    loadProfileData(targetUserId);
    loadPublicDecks(targetUserId);
});

// ==========================================
// FUNÇÕES DE DADOS (SUPABASE)
// ==========================================

async function loadPublicDecks(userId) {
    try {
        const { data: decks, error } = await supabase
            .from('decks')
            .select('*')
            .eq('user_id', userId)
            .eq('is_public', true) // Apenas decks públicos!
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Atualiza o contador no header
        const count = decks ? decks.length : 0;
        elements.deckCount.textContent = `${count} Public Decks`;

        // Renderiza a lista
        renderDecks(decks);

    } catch (err) {
        console.error("Erro ao carregar decks:", err);
        elements.publicDecksList.innerHTML = "<p style='color:#ff6b6b'>Error loading decks.</p>";
    }
}

function renderDecks(decks) {
    elements.publicDecksList.innerHTML = '';

    if (!decks || decks.length === 0) {
        elements.publicDecksList.innerHTML = "<p style='color:#888; font-style:italic;'>This user hasn't published any decks yet.</p>";
        return;
    }

    decks.forEach(deck => {
        // Cria o cartão usando a estrutura do CSS novo
        const card = document.createElement('div');
        card.className = 'deck-card';
        
        // Imagem ou Gradiente padrão se não houver capa
        const bg = deck.thumbnail_url 
            ? `url('${deck.thumbnail_url}')` 
            : 'linear-gradient(135deg, #667eea, #764ba2)';

        card.innerHTML = `
            <div class="deck-thumb" style="background-image: ${bg}"></div>
            <div class="deck-info">
                <h4>${deck.name}</h4>
                <p>${deck.description || 'No description provided.'}</p>
            </div>
        `;

        // Clique: Redireciona para o Deck
        card.addEventListener('click', () => {
            window.location.href = `../Content/deck.html?id=${deck.id}`;
        });

        elements.publicDecksList.appendChild(card);
    });
}

// ==========================================
// FUNÇÕES DE INTERFACE
// ==========================================

function configureOwnerView() {
    // Se for o dono do perfil, muda o botão "Follow" para "Edit Profile"
    if (elements.followBtn) {
        elements.followBtn.textContent = "Edit Profile";
        elements.followBtn.style.backgroundColor = "#555"; // Cor diferente
        elements.followBtn.onclick = () => {
            window.location.href = "ownProfile.html";
        };
    }
}

function configureVisitorView() {
    // Lógica para seguir o utilizador (placeholder)
    if (elements.followBtn) {
        elements.followBtn.onclick = () => {
            alert("Follow functionality coming soon!");
        };
    }
}
