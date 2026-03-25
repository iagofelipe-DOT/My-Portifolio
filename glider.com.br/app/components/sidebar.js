// Esta função carrega HTML e CSS automaticamente
export async function loadSidebarComponent() {
    try {
        const basePath = new URL('.', import.meta.url).href; 
        const htmlUrl = new URL('./sidebar.html', import.meta.url).href;
        const cssUrl = new URL('./sidebar.css', import.meta.url).href;

        console.log(" Carregando Sidebar de:", htmlUrl);

        if (!document.querySelector(`link[href="${cssUrl}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssUrl;
            document.head.appendChild(link);
            console.log(" CSS da Sidebar injetado.");
        }

        // 3. BUSCAR E INJETAR O HTML
        const response = await fetch(htmlUrl);
        if (!response.ok) throw new Error(`Erro ${response.status} ao buscar sidebar.html`);
        
        const html = await response.text();
        // Insere no início do body
        document.body.insertAdjacentHTML('afterbegin', html);
        console.log(" HTML da Sidebar injetado.");

        return {
            sidebar: document.getElementById('sidebar'),
            overlay: document.getElementById('sidebarOverlay'),
            closeSidebar: document.getElementById('closeSidebar'),

            sidebarToggle: document.getElementById('sidebarToggle'), 
            logoutBtn: document.getElementById('logoutBtn')
        };

    } catch (error) {
        console.error(" ERRO CRÍTICO NA SIDEBAR:", error);
        return null;
    }
}

// Ligar os cliques
export function initSidebarEvents(elements, onLogout, user) {
    if (!elements || !elements.sidebar) {
        console.error("Elementos da sidebar não encontrados. O HTML carregou?");
        return;
    }
    const profileLink = document.getElementById('sidebarProfileLink'); //sidebar.html
    if (user && profileLink) {
        const currentHref = profileLink.getAttribute('href');
        // Verifica se já não tem o ID para não duplicar
        if (!currentHref.includes('?id=')) {
            profileLink.href = `${currentHref}?id=${user.id}`;
        }
    }
    const toggle = (show) => {
        if (show) {
            elements.sidebar.classList.add('active');
            elements.overlay.classList.add('active');
        } else {
            elements.sidebar.classList.remove('active');
            elements.overlay.classList.remove('active');
        }
    };

    // Ligar eventos se os botões existirem
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede cliques duplos estranhos
            toggle(true);
        });
    } else {
        console.warn(" Botão 'sidebarToggle' (Menu ☰) não encontrado no Header.");
    }

    if (elements.closeSidebar) elements.closeSidebar.addEventListener('click', () => toggle(false));
    if (elements.overlay) elements.overlay.addEventListener('click', () => toggle(false));
    
    if (elements.logoutBtn && onLogout) {
        elements.logoutBtn.addEventListener('click', onLogout);
    }
}