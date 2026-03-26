import { supabase } from '../../conn/SupabaseAPIconn.js';
import { initSiteAuth } from '../common/auth.js';
import { setupLiveSearch } from '././Content/dropdown.js';
import { loadSidebarComponent, initSidebarEvents } from '../components/sidebar.js';

console.log('[home.js] Carregado!');


const el = id => document.getElementById(id);

const elements = {
    recentList: el('recentList'),
    recommendedList: el('recommendedList'),
    statDecks: document.querySelector('.stat-card:nth-child(1) h3'),
    statCards: document.querySelector('.stat-card:nth-child(2) h3'),
     
    searchInput: el('searchInput'),
    searchBtn: el('searchActionBtn'),
    filterToggle: el('filterToggle'),
    filterDropdown: el('filterDropdown'),
    filterAll: el('filterAll'),
    filterOpts: document.querySelectorAll('.filter-opt')
};
console.log("Toggle Button:", elements.filterToggle);
console.log("Dropdown Menu:", elements.filterDropdown);

async function signOut() {

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Erro ao deslogar:", error.message);
        alert("Erro ao fazer logout.");
    } else {
        console.log("Usuário deslogado com sucesso.");
       
        window.location.href = '../HTML/Register/Login.html';
    }
}

// --- 2. INICIALIZAÇÃO (Ao carregar a página) ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[home.js] DOM Pronto. Iniciando...');
    
    const sidebarElements = await loadSidebarComponent(); 
    

    const user = await initSiteAuth({ loginPath: '../HTML/Register/Login.html' });
    
    if (sidebarElements) {
        initSidebarEvents(sidebarElements, signOut,user);
    }

    if (user) {
        loadUserStats(user.id);
        loadRecentlyViewed();
        loadRecommended(user.id);
    }


    if (elements.searchInput) {
        setupLiveSearch(elements.searchInput, elements.filterOpts, elements.filterAll);
    } else {
        console.error('[home.js] ERRO: Input #searchInput não encontrado.');
    }
});

function initUIEvents() {
    console.log("[home.js] Inicializando eventos de UI...");

    // --- Lógica da Sidebar ---
    const toggleSidebar = (show) => {
        if(show) { 
            elements.sidebar?.classList.add('active'); 
            elements.overlay?.classList.add('active'); 
        } else { 
            elements.sidebar?.classList.remove('active'); 
            elements.overlay?.classList.remove('active'); 
        }
    };

    if (elements.sidebarToggle) elements.sidebarToggle.addEventListener('click', () => toggleSidebar(true));
    if (elements.closeSidebar) elements.closeSidebar.addEventListener('click', () => toggleSidebar(false));
    if (elements.overlay) elements.overlay.addEventListener('click', () => toggleSidebar(false));

    const { filterToggle, filterDropdown } = elements;

    if (filterToggle && filterDropdown) {

        filterToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            filterDropdown.classList.toggle('show');
            console.log("[home.js] Toggle Filtros. Estado:", filterDropdown.classList.contains('show'));
        });

        // Fechar se clicar fora
        document.addEventListener('click', (e) => {
            if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.classList.remove('show');
            }
        });
    } else {
        console.warn("[home.js] Botão de filtros não encontrado no HTML.");
    }

    // --- Lógica dos Checkboxes (All vs Outros) ---
    if (elements.filterAll && elements.filterOpts) {
        // Se clicar em "All", desmarca os outros
        elements.filterAll.addEventListener('change', () => {
            if (elements.filterAll.checked) {
                elements.filterOpts.forEach(o => o.checked = false);
            }
        });

        // Se clicar nos outros, desmarca "All"
        elements.filterOpts.forEach(opt => {
            opt.addEventListener('change', () => {
                if (opt.checked) elements.filterAll.checked = false;
                
                // Se nenhum estiver marcado, volta a marcar "All"
                const anyChecked = Array.from(elements.filterOpts).some(o => o.checked);
                if (!anyChecked) elements.filterAll.checked = true;
            });
        });
    }
}

// --- 4. FUNÇÕES DE DADOS (Supabase) ---

async function loadUserStats(userId) {
    try {
        const { count: d } = await supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        const { count: c } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        if(elements.statDecks) elements.statDecks.textContent = d || 0;
        if(elements.statCards) elements.statCards.textContent = c || 0;
    } catch (e) { console.error(e); }
}

async function loadRecentlyViewed() {
    const lastId = localStorage.getItem('glider_last_deck_id');
    if (!lastId || !elements.recentList) return;
    
    const { data } = await supabase.from('decks').select('*').eq('id', lastId).single();
    if (data) {
        elements.recentList.innerHTML = '';
        elements.recentList.appendChild(createDeckCard(data));
    }
}

async function loadRecommended(userId) {
    if (!elements.recommendedList) return;
    const tag = localStorage.getItem('glider_last_tag');
    
    let q = supabase.from('decks').select('*').eq('is_public', true).neq('user_id', userId);
    if (tag) q = q.contains('tags', [tag]);
    else q = q.order('created_at', { ascending: false });
    
    const { data } = await q.limit(8);
    
    if (data && data.length > 0) {
        elements.recommendedList.innerHTML = '';
        data.forEach(d => elements.recommendedList.appendChild(createDeckCard(d)));
    } else {
        elements.recommendedList.innerHTML = '<p style="opacity:0.6; padding:10px;"> Cards which you may like will be shown here!.</p>';
    }
}

// --- 5. CRIAR CARTÃO (HTML) ---
function createDeckCard(deck) {
    const div = document.createElement('div');
    div.className = 'deck-card';
    
    const bg = deck.thumbnail_url 
        ? `url('${deck.thumbnail_url}')` 
        : 'linear-gradient(135deg, #667eea, #764ba2)';
        
    div.innerHTML = `
        <div class="deck-thumb" style="background-image: ${bg}"></div>
        <div class="deck-info">
            <h4>${deck.name}</h4>
            <p>${deck.description || ''}</p>
        </div>
    `;
    
    div.addEventListener('click', () => {
        // Salvar histórico
        localStorage.setItem('glider_last_deck_id', deck.id);
        if(deck.tags?.[0]) localStorage.setItem('glider_last_tag', deck.tags[0]);
        
        // Redirecionar
        window.location.href = `./Content/deck.html?id=${deck.id}`;
    });
    
    return div;
}