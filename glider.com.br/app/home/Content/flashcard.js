import { supabase } from '../../../conn/SupabaseAPIconn.js';
import { initSiteAuth } from '../../common/auth.js';
import { loadSidebarComponent, initSidebarEvents } from '../../components/sidebar.js';

const el = id => document.getElementById(id);

const elements = {
    imageContainer: el('imageContainer'),
    cardImage: el('cardImage'),
    cardQuestion: el('cardQuestion'),
    answersGrid: el('answersGrid'),
    cardTags: el('cardTags'), // NOVO: Container das tags
    downloadBtn: el('downloadCardBtn'),
    backBtn: el('backBtn'),
    
    
};

const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('id');
let currentCardData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await initSiteAuth({ loginPath: '../../HTML/Register/Login.html' });

    // 2. CARREGAR A SIDEBAR NOVA (Isto substitui o initSidebar antigo)
    const sidebarElements = await loadSidebarComponent();
    initSidebarEvents(sidebarElements, signOut,user);

    if (!cardId) {
        elements.cardQuestion.textContent = "Error: No card ID provided.";
        return;
    }

    loadFlashcard(cardId);
});

async function loadFlashcard(id) {
    try {
        const { data: card, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        currentCardData = card;

        // 1. Botão Voltar Inteligente
        if (card.deck_id) {
            elements.backBtn.onclick = () => window.location.href = `deck.html?id=${card.deck_id}`;
        } else {
            elements.backBtn.onclick = () => window.history.back();
        }

        // 2. Imagem
        if (card.image_url) {
            elements.cardImage.src = card.image_url;
            elements.imageContainer.style.display = 'block';
        } else {
            elements.imageContainer.style.display = 'none';
        }

        // 3. Tags (NOVO)
        renderTags(card.tags);

        // 4. Pergunta
        elements.cardQuestion.textContent = card.question;

        // 5. Respostas
        renderAnswers(card.answers);

    } catch (err) {
        console.error(err);
        elements.cardQuestion.textContent = "Error loading card.";
    }
}

function renderTags(tags) {
    // Limpa tags antigas
    elements.cardTags.innerHTML = ''; 

    // Verifica se tags existem e se é um array com items
    if (tags && Array.isArray(tags) && tags.length > 0) {
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-pill';
            span.textContent = `#${tag}`;
            elements.cardTags.appendChild(span);
        });
        elements.cardTags.style.display = 'flex';
    } else {
        elements.cardTags.style.display = 'none';
    }
}

function renderAnswers(answersData) {
    elements.answersGrid.innerHTML = '';
    let answers = [];

    // Parse se vier como string JSON do banco
    if (typeof answersData === 'string') {
        try { answers = JSON.parse(answersData); } catch(e) { answers = []; }
    } else {
        answers = answersData || [];
    }

    answers.forEach(ans => {
        const div = document.createElement('div');
        div.className = 'answer-box';
        
        // Se a resposta for um objeto {text: '...', correct: true}, mostra só o texto
        // Se for string direta, mostra a string
        div.textContent = ans.text ? ans.text : ans;
        
        elements.answersGrid.appendChild(div);
    });
}

// Lógica de Download
if (elements.downloadBtn) {
    elements.downloadBtn.addEventListener('click', () => {
        if (!currentCardData) return;
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentCardData, null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = `flashcard_${cardId}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    });
}

