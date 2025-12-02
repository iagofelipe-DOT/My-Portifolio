// --- CONFIGURAÇÃO DO SUPABASE ---

const SUPABASE_URL = 'https://wthlsjmxbhtnwacklwci.supabase.co'; // Pegue em Settings > API
const SUPABASE_KEY = 'sb_publishable_47AI3d72L4BwpftH8YL59A_C_4drqpw'; // Pegue em Settings > API

// A biblioteca carregada no HTML cria um objeto global chamado 'supabase'
const { createClient } = supabase;

// Inicializa a conexão
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FIM DA CONFIGURAÇÃO ---


// --- TESTE DE CONEXÃO (Pode apagar depois) ---
async function testarConexao() {
    console.log("Testando conexão...");
    
    // Tenta buscar algo da tabela profiles (mesmo que esteja vazia)
    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Erro na conexão:", error.message);
        alert("Erro ao conectar! Verifique o console (F12)");
    } else {
        console.log("Conexão bem sucedida!", data);
        alert("Supabase conectado com sucesso!");
    }
}

// Chama o teste assim que a página carrega
testarConexao();