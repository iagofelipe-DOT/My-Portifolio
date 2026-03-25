// createFlashcard.js
import { supabase } from '../../../conn/SupabaseAPIconn.js';
import { requireAuth, getUser, initSiteAuth } from '../../common/auth.js';
import { loadSidebarComponent, initSidebarEvents } from '../../components/sidebar.js';

// --- Helper para selecionar elementos ---
const el = id => document.getElementById(id);

// --- Elementos do Formulário ---
const answersArea = el('answersArea');
const answersCount = el('answersCount');
const multipleCorrect = el('multipleCorrect');
const imageFile = el('imageFile');
const imagePreview = el('imagePreview');
const submitBtn = el('submitBtn');
const previewBtn = el('previewBtn');
const status = el('status');

async function signOut(e) {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '../home.html';
  }
// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[createFlashcard.js] Loaded');

    // 1. Inicializa Autenticação
    // Ajuste os caminhos se necessário, baseado na sua estrutura de pastas
    // 1. Auth
    const currentUser = await initSiteAuth({ loginPath: '../../HTML/Register/Login.html' });

    // 2. CARREGAR A SIDEBAR NOVA (Isto substitui o initSidebar antigo)
    const sidebarElements = await loadSidebarComponent();
    initSidebarEvents(sidebarElements, signOut,user);

    // 3. Renderiza os inputs iniciais (padrão: 2 opções)
    if (answersCount && multipleCorrect) {
        createAnswerInputs(Number(answersCount.value), multipleCorrect.checked);
    }
});

// --- Lógica da Sidebar (ADICIONADO) ---


// --- Funções de Lógica do Flashcard ---

function createAnswerInputs(count, multiple) {
    if (!answersArea) return;
    
    answersArea.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '8px';
        wrapper.style.alignItems = 'center';
        wrapper.style.marginBottom = '8px';

        const choice = document.createElement('input');
        choice.type = multiple ? 'checkbox' : 'radio';
        choice.name = multiple ? `correct-${i}` : 'correct';
        choice.dataset.index = i;
        choice.style.marginRight = '6px';
        choice.style.cursor = 'pointer'; // Melhoria de UX

        // Se for radio, precisamos definir o value para saber qual foi escolhido
        if (!multiple) choice.value = String(i);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Answer ${i + 1}`;
        input.dataset.index = i;
        input.style.flex = '1';

        wrapper.appendChild(choice);
        wrapper.appendChild(input);
        answersArea.appendChild(wrapper);
    }

    // Limpeza de estados ao trocar de modo
    if (!multiple) {
        const boxes = answersArea.querySelectorAll('input[type="checkbox"]');
        boxes.forEach(b => b.checked = false);
    } else {
        const radios = answersArea.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
    }
}

function getFormData() {
    const name = el('setName').value.trim();
    const question = el('question').value.trim();
    const count = Number(answersCount.value);
    const multiple = multipleCorrect.checked;

    const answers = [];
    const wrappers = answersArea.querySelectorAll('div');
    wrappers.forEach((w, idx) => {
        const textInput = w.querySelector('input[type="text"]');
        const checker = w.querySelector(multiple ? 'input[type="checkbox"]' : 'input[type="radio"]');
        answers.push({
            text: textInput ? textInput.value.trim() : '',
            correct: !!(checker && checker.checked)
        });
    });

    return { name, question, answers, multiple, count };
}

function showStatus(msg, isError = false) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = isError ? '#ffcccc' : '#bfe3a7';
}

function clearStatus() {
    if (status) status.textContent = '';
}

// --- Event Listeners ---

if (imageFile) {
    imageFile.addEventListener('change', () => {
        const f = imageFile.files && imageFile.files[0];
        if (!f) {
            imagePreview.innerHTML = '';
            imagePreview.setAttribute('aria-hidden', 'true');
            return;
        }
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        img.style.maxWidth = '140px';
        img.style.maxHeight = '120px';
        img.style.borderRadius = '6px';
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);
        imagePreview.setAttribute('aria-hidden', 'false');
    });
}

if (answersCount) {
    answersCount.addEventListener('change', () => createAnswerInputs(Number(answersCount.value), multipleCorrect.checked));
}

if (multipleCorrect) {
    multipleCorrect.addEventListener('change', () => createAnswerInputs(Number(answersCount.value), multipleCorrect.checked));
}

if (previewBtn) {
    previewBtn.addEventListener('click', () => {
        const { name, question, answers } = getFormData();
        // validação rápida
        if (!name || !question) {
            showStatus('Name and question required', true);
            return;
        }
        console.log({ name, question, answers });
        showStatus('Preview printed to console');
        setTimeout(clearStatus, 2200);
    });
}

// --- Upload e Envio ---

async function uploadImageFile(file) {
    if (!file) return null;
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const path = `flashcards/${id}_${file.name.replace(/\s+/g,'_')}`;
    
    showStatus('Uploading image...');
    
    const { data, error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    
    const urlResp = await supabase.storage.from('images').getPublicUrl(path);
    return urlResp?.data?.publicUrl || null;
}

if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        clearStatus();
        const { name, question, answers } = getFormData();

        // Validação básica
        if (!name) return showStatus('Set name required', true);
        if (!question) return showStatus('Question required', true);
        if (answers.length < 2) return showStatus('At least two answers required', true);
        if (answers.some(a => !a.text)) return showStatus('All answers must have text', true);
        if (!answers.some(a => a.correct)) return showStatus('Select at least one correct answer', true);

        submitBtn.disabled = true;
        showStatus('Saving flashcard...');

        try {
            let imageUrl = null;
            const file = imageFile.files && imageFile.files[0];
            if (file) {
                imageUrl = await uploadImageFile(file);
            }

            // Inserir na tabela 'flashcards' do Supabase
            const user = await requireAuth(); // redireciona se não estiver logado
            if (!user) return; 

            const payload = {
                name,
                question,
                answers,
                image_url: imageUrl,
                user_id: user.id
            };
            
            const { error } = await supabase.from('flashcards').insert([payload]);

            if (error) throw error;

            showStatus('Flashcard saved successfully!');
            
            // Resetar formulário
            el('setName').value = '';
            el('question').value = '';
            imageFile.value = '';
            imagePreview.innerHTML = '';
            createAnswerInputs(2, false);

        } catch (err) {
            console.error(err);
            showStatus(`Error: ${err.message || err}`, true);
        } finally {
            submitBtn.disabled = false;
            setTimeout(clearStatus, 3000);
        }
    });
}