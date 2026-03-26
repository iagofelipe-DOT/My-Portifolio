import { supabase } from '../../../conn/SupabaseAPIconn.js';
import { requireAuth, initSiteAuth } from '../../common/auth.js';
import { loadSidebarComponent, initSidebarEvents } from '../../components/sidebar.js';
console.log('[createDeck.js] Loaded');

// --- Elementos do DOM ---
const el = id => document.getElementById(id);

const elements = {
  // Inputs do Formulário
  deckName: el('deckName'),
  deckDescription: el('deckDescription'),
  deckTags: el('deckTags'),
  isPublic: el('isPublic'),
  deckImage: el('deckImage'),
  imagePreview: el('imagePreview'),
  
  // Botões e Status
  submitBtn: el('submitBtn'),
  previewBtn: el('previewBtn'),
  status: el('status'),
  
  // Seleção de Flashcards
  cardSearch: el('cardSearch'),
  flashcardsList: el('flashcardsList'),
  selectedCount: el('selectedCount')
};

// --- Estado da Página ---
let currentPreviewUrl = null;
let availableFlashcards = []; // Todas as cartas carregadas da DB
let selectedFlashcardIds = new Set(); // IDs das cartas que o user escolheu

async function signOut(e) {
  e.preventDefault();
  await supabase.auth.signOut();
  window.location.href = '../home.html';
}
// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    const user = await initSiteAuth({ loginPath: '../../HTML/Register/Login.html' });
    const sidebarElements = await loadSidebarComponent();
    initSidebarEvents(sidebarElements, signOut,user);
    if (user) { 
        loadFlashcards(user.id); 
    }
  
});

// ==========================================
// LÓGICA 1: Carregar e Selecionar Cartas
// ==========================================

async function loadFlashcards(userId) {
    if (!elements.flashcardsList) return;

    try {
        // Busca cartas: Públicas OU do próprio utilizador
        const { data, error } = await supabase
            .from('flashcards')
            .select('id, question, name, user_id, is_public')
            .or(`is_public.eq.true,user_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(100); // Traz as 100 mais recentes

        if (error) throw error;

        availableFlashcards = data;
        renderFlashcardsList(availableFlashcards);

    } catch (err) {
        console.error('Error loading cards:', err);
        elements.flashcardsList.innerHTML = '<div style="color:#d9534f; text-align:center; padding:10px;">Error loading cards.</div>';
    }
}

function renderFlashcardsList(cards) {
    if (!elements.flashcardsList) return;
    elements.flashcardsList.innerHTML = '';

    if (cards.length === 0) {
        elements.flashcardsList.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No flashcards found.</div>';
        return;
    }

    cards.forEach(card => {
        // Container do item
        const item = document.createElement('div');
        item.className = 'flashcard-item'; // Podes estilizar isto no CSS
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.padding = '10px';
        item.style.borderBottom = '1px solid #eee';
        item.style.backgroundColor = '#fff';

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = card.id;
        checkbox.style.marginRight = '12px';
        checkbox.style.cursor = 'pointer';

        // Manter estado selecionado se filtrar
        if (selectedFlashcardIds.has(card.id)) {
            checkbox.checked = true;
        }

        // Evento de Seleção
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedFlashcardIds.add(card.id);
            } else {
                selectedFlashcardIds.delete(card.id);
            }
            updateSelectedCount();
        });

        // Informação da Carta (Texto)
        const info = document.createElement('div');
        info.innerHTML = `
            <div style="font-weight:600; font-size:14px; color:#333;">${card.name || 'Untitled Set'}</div>
            <div style="font-size:12px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:320px;">
                ${card.question}
            </div>
        `;

        item.appendChild(checkbox);
        item.appendChild(info);
        elements.flashcardsList.appendChild(item);
    });
}

// Filtro de Pesquisa
if (elements.cardSearch) {
    elements.cardSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = availableFlashcards.filter(c => 
            (c.name && c.name.toLowerCase().includes(term)) || 
            (c.question && c.question.toLowerCase().includes(term))
        );
        renderFlashcardsList(filtered);
    });
}

function updateSelectedCount() {
    if (elements.selectedCount) {
        elements.selectedCount.textContent = selectedFlashcardIds.size;
    }
}

// ==========================================
// LÓGICA 2: Upload de Imagem
// ==========================================

if (elements.deckImage) {
    elements.deckImage.addEventListener('change', () => {
      const file = elements.deckImage.files?.[0];
      
      // Limpa memória anterior
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = null;
      }
      elements.imagePreview.innerHTML = '';

      if (!file) {
        elements.imagePreview.setAttribute('aria-hidden', 'true');
        return;
      }

      // Validação simples
      if (!file.type.startsWith('image/')) {
        showStatus('Invalid image file', true);
        return;
      }

      // Mostra preview
      currentPreviewUrl = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.src = currentPreviewUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';
      
      elements.imagePreview.appendChild(img);
      elements.imagePreview.setAttribute('aria-hidden', 'false');
    });
}

async function uploadImageFile(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${fileExt}`;
  const path = `decks/${userId}/${fileName}`; // Organiza por pasta do user

  const { error } = await supabase.storage.from('images').upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

// ==========================================
// LÓGICA 3: Salvar Deck (Submit)
// ==========================================

if (elements.submitBtn) {
    elements.submitBtn.addEventListener('click', async () => {
      clearStatus();
      
      // 1. Verifica Autenticação
      const user = await requireAuth('../../HTML/Register/Login.html');
      if (!user) return;

      // 2. Validação Básica
      const name = elements.deckName.value.trim();
      if (!name) return showStatus('Deck name is required', true);

      elements.submitBtn.disabled = true;
      elements.submitBtn.textContent = 'Creating...';

      try {
        // 3. Upload da Imagem (se existir)
        let thumbnailUrl = null;
        if (elements.deckImage.files?.[0]) {
          thumbnailUrl = await uploadImageFile(elements.deckImage.files[0], user.id);
        }

        // 4. Inserir Deck na Tabela 'decks'
        const deckPayload = {
          name: name,
          description: elements.deckDescription.value.trim(),
          is_public: elements.isPublic.checked,
          tags: parseTags(elements.deckTags.value),
          thumbnail_url: thumbnailUrl,
          user_id: user.id
        };

        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .insert([deckPayload])
          .select()
          .single();

        if (deckError) throw deckError;

        // 5. Inserir Ligações na Tabela 'deck_flashcards'
        if (selectedFlashcardIds.size > 0) {
            showStatus('Deck created. Adding cards...');
            
            // Cria array de objetos { deck_id, flashcard_id }
            const links = Array.from(selectedFlashcardIds).map(cardId => ({
                deck_id: deckData.id,
                flashcard_id: cardId
            }));

            const { error: linkError } = await supabase
                .from('deck_flashcards')
                .insert(links);

            if (linkError) {
                console.error('Link Error:', linkError);
                showStatus('Deck created, but some cards failed to link.', true);
            }
        }

        showStatus('Deck created successfully!', false);
        
        // Redireciona
        setTimeout(() => {
          window.location.href = '../home.html';
        }, 1500);

      } catch (err) {
        console.error(err);
        showStatus(`Error: ${err.message || err}`, true);
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = 'Create Deck';
      }
    });
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function initSidebar() {
    const toggle = (isActive) => {
        if (isActive) {
            elements.sidebar?.classList.add('active');
            elements.overlay?.classList.add('active');
        } else {
            elements.sidebar?.classList.remove('active');
            elements.overlay?.classList.remove('active');
        }
    };

    if (elements.sidebarToggle) elements.sidebarToggle.addEventListener('click', () => toggle(true));
    if (elements.closeSidebar) elements.closeSidebar.addEventListener('click', () => toggle(false));
    if (elements.overlay) elements.overlay.addEventListener('click', () => toggle(false));
}

function showStatus(msg, isError = false) {
  if (elements.status) {
    elements.status.textContent = msg;
    elements.status.style.color = isError ? '#ff6b6b' : '#51cf66';
  }
}

function clearStatus() {
  if (elements.status) elements.status.textContent = '';
}

function parseTags(tagString) {
  if (!tagString) return null;
  return tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);
}