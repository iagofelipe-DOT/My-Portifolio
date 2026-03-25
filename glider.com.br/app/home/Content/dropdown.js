import { supabase } from '../../../conn/SupabaseAPIconn.js';

const resultsContainer = document.getElementById('searchResults');
let debounceTimer;

export function setupLiveSearch(searchInput, filterOpts, filterAll) {
    console.log("[Dropdown] Iniciando setup..."); // LOG 1

    if (!searchInput) {
        console.error("[Dropdown] Erro: Input de pesquisa não encontrado!");
        return;
    }
    if (!resultsContainer) {
        console.error("[Dropdown] Erro: Container de resultados (searchResults) não encontrado!");
        return;
    }

    console.log("[Dropdown] Live Search ativado com sucesso!"); // LOG 2

    // Ouvinte: Quando escreves
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        console.log(`[Dropdown] Usuário digitou: "${query}"`); // LOG 3

        clearTimeout(debounceTimer);

        if (query.length < 2) {
            resultsContainer.classList.remove('show');
            resultsContainer.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            console.log("[Dropdown] Executando busca no Supabase..."); // LOG 4
            performLiveSearch(query, getActiveFilters(filterOpts, filterAll));
        }, 500);
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!resultsContainer.contains(e.target) && e.target !== searchInput) {
            resultsContainer.classList.remove('show');
        }
    });
}

function getActiveFilters(filterOpts, filterAll) {
    if (filterAll && filterAll.checked) return ['all'];
    const active = [];
    if (filterOpts) {
        filterOpts.forEach(opt => { if (opt.checked) active.push(opt.value); });
    }
    return active.length > 0 ? active : ['all'];
}

async function performLiveSearch(query, filters) {
    resultsContainer.innerHTML = '<div style="padding:15px; color:#bbb; text-align:center;">Searching...</div>';
    resultsContainer.classList.add('show');

    try {
        let results = [];

        if (filters.includes('all') || filters.includes('decks')) {
            const { data: decks, error } = await supabase
                .from('decks')
                .select('*')
                .eq('is_public', true)
                .ilike('name', `%${query}%`)
                .limit(5);

            if (error) {
                console.error("[Dropdown] Erro Supabase:", error); // LOG ERRO
            } else {
                console.log("[Dropdown] Resultados encontrados:", decks); // LOG SUCESSO
                if (decks) results = [...results, ...decks.map(d => ({ ...d, type: 'Deck' }))];
            }
        }

        renderResults(results);

    } catch (err) {
        console.error("[Dropdown] Erro Crítico:", err);
        resultsContainer.innerHTML = '<div style="padding:15px; color:#ff6b6b; text-align:center;">Error.</div>';
    }
}

function renderResults(results) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:15px; color:#bbb; text-align:center;">No results found.</div>';
        return;
    }

    results.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        const bgImage = item.thumbnail_url 
            ? `url('${item.thumbnail_url}')` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

        div.innerHTML = `
            <div class="result-thumb" style="background-image: ${bgImage}"></div>
            <div class="result-info">
                <h4>${item.name} <span style="font-size:10px; background:#4CAF50; color:#fff; padding:2px 5px; border-radius:4px; margin-left:5px;">${item.type}</span></h4>
                <p>${item.description || ''}</p>
            </div>
        `;

        div.addEventListener('click', () => {
            if (item.type === 'Deck') {
                window.location.href = `./Content/deck.html?id=${item.id}`;
            }
        });

        resultsContainer.appendChild(div);
    });
}