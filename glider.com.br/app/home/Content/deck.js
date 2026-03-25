import { supabase } from '../../../conn/SupabaseAPIconn.js';
import { initSiteAuth } from '../../common/auth.js';
import { loadSidebarComponent, initSidebarEvents } from '../../components/sidebar.js';
const el = id => document.getElementById(id);

// Elementos
const elements = {
    // Header Info
    deckTitle: el('deckTitle'),
    deckDescription: el('deckDescription'),
    deckCover: el('deckCover'),
    deckCoverFallback: el('deckCoverFallback'),
    creatorName: el('creatorName'),
    creatorAvatar: el('creatorAvatar'),
    cardCount: el('cardCount'),
    
    // Actions
    studyBtn: el('studyBtn'), // O botão verde principal
    ownerControls: el('ownerControls'),
    deleteDeckBtn: el('deleteDeckBtn'),
    
    // Lists
    cardsList: el('cardsList'),
};

// Obter ID do Deck
const urlParams = new URLSearchParams(window.location.search);
const deckId = urlParams.get('id');

let currentDeck = null;
async function signOut() {
    // 1. Invoca a função signOut do Supabase. Por padrão, termina todas as sessões.
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Erro ao deslogar:", error.message);
        alert("Erro ao fazer logout.");
    } else {
        console.log("Usuário deslogado com sucesso.");
        // Opcional: Redirecionar para a página de login ou home
        window.location.href = '../HTML/Register/Login.html';
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth
    const user = await initSiteAuth({ loginPath: '../../HTML/Register/Login.html' });

    // 2. CARREGAR A SIDEBAR NOVA (Isto substitui o initSidebar antigo)
    const sidebarElements = await loadSidebarComponent();
    initSidebarEvents(sidebarElements, signOut,user);

    if (!deckId) {
        elements.cardsList.innerHTML = "<p style='padding:20px; color:#ff6b6b'>No deck ID provided.</p>";
        return;
    }

    // 2. Carregar Dados
    await loadDeckDetails(deckId, user);
    await loadDeckCards(deckId);
});

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

async function loadDeckDetails(id, user) {
    try {
        const { data: deck, error } = await supabase
            .from('decks')
            .select('*, profiles:user_id (username, avatar_url)')
            .eq('id', id)
            .single();

        if (error) throw error;
        currentDeck = deck;

        // Preencher Texto
        elements.deckTitle.textContent = deck.name;
        elements.deckDescription.textContent = deck.description || "No description provided.";
        
        // Imagem
        if (deck.thumbnail_url) {
            elements.deckCover.src = deck.thumbnail_url;
            elements.deckCover.style.display = 'block';
            elements.deckCoverFallback.style.display = 'none';
        } else {
            elements.deckCover.style.display = 'none';
            elements.deckCoverFallback.style.display = 'block';
        }

        // Criador
        if (deck.profiles) {
            elements.creatorName.textContent = deck.profiles.username || "Unknown";
            if (deck.profiles.avatar_url) {
                elements.creatorAvatar.src = deck.profiles.avatar_url;
                elements.creatorAvatar.style.display = 'block';
            }
            elements.creatorName.onclick = () => {
                window.location.href = `../Profiles/viewProfile.html?id=${deck.user_id}`;
            };
        }

        // Dono do Deck?
        if (user && user.id === deck.user_id) {
            elements.ownerControls.style.display = "flex";
            setupOwnerActions(deck.id);
        }

        // --- AQUI ESTÁ A MUDANÇA ---
        // O botão "Study Now" agora faz o download silencioso
        elements.studyBtn.onclick = () => {
            downloadDeck(currentDeck);
        };

    } catch (err) {
        console.error(err);
        elements.deckTitle.textContent = "Error loading deck";
    }
}

// Função de Download (JSON)
function downloadDeck(deckData) {
    if (!deckData) return;
    
    // Prepara os dados
    const jsonString = JSON.stringify(deckData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Cria link temporário e clica nele
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckData.name.replace(/\s+/g, '_')}_StudyData.json`;
    document.body.appendChild(a);
    a.click();
    
    // Limpeza
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function loadDeckCards(id) {
    try {
        // Tenta buscar da junção
        let { data: links, error } = await supabase
            .from('deck_flashcards')
            .select('flashcard_id, flashcards(*)')
            .eq('deck_id', id);

        // Se falhar, tenta direto
        if (!links || links.length === 0) {
             const { data: directCards } = await supabase
                .from('flashcards')
                .select('*')
                .eq('deck_id', id);
             
             if (directCards) links = directCards.map(c => ({ flashcards: c }));
        }

        const cards = links ? links.map(l => l.flashcards).filter(Boolean) : [];
        
        // Se quisermos incluir as cartas no download também (Opcional, mas recomendado)
        if (currentDeck) {
            currentDeck.cards = cards; 
        }

        elements.cardCount.textContent = `${cards.length} Cards`;
        renderCardsList(cards);

    } catch (err) {
        console.error(err);
    }
}

function renderCardsList(cards) {
    elements.cardsList.innerHTML = '';

    if (!cards || cards.length === 0) {
        elements.cardsList.innerHTML = "<p style='color:#888; padding:10px;'>This deck is empty.</p>";
        return;
    }

    cards.forEach((card, index) => {
        const row = document.createElement('div');
        row.className = 'flashcard-row no-select';

        row.innerHTML = `
            <span class="fc-number">${index + 1}</span>
            <div class="fc-question">${card.question}</div>
            <div class="fc-preview">Click to view details</div> 
        `;

        // Clicar na linha leva ao detalhe
        row.addEventListener('click', () => {
            window.location.href = `../Content/flashcard.html?id=${card.id}`;
        });

        elements.cardsList.appendChild(row);
    });
}

function setupOwnerActions(deckId) {
    elements.deleteDeckBtn.addEventListener('click', async () => {
        if (confirm("Delete this deck? This cannot be undone.")) {
            try {
                await supabase.from('decks').delete().eq('id', deckId);
                window.location.href = '../profile/ownProfile.html';
            } catch (err) { alert(err.message); }
        }
    });
    
    document.getElementById('editDeckBtn').onclick = () => {
        alert("Edit functionality coming soon.");
    };
}
