<script>
// @ts-nocheck

  import { supabase } from '$lib/supabase.js';
  import { onMount } from 'svelte';


  let listaMidias = [];
  let carregando = true;

  onMount(async () => {

    const { data, error } = await supabase.storage.from('general-media').list();

    if (error) {
      console.error("Erro ao buscar mídias:", error);
      return;
    }

    if (data) {
      
      listaMidias = data
        .filter(arquivo => arquivo.name !== '.emptyFolderPlaceholder') // O Supabase cria isso as vezes
        .map(arquivo => {
          const { data: linkData } = supabase.storage.from('general-media').getPublicUrl(arquivo.name);
          return {
            nome: arquivo.name,
            url: linkData.publicUrl
          };
        });
    }
    carregando = false;
  });
</script>

<div class="conteudo-midia">
  <h2>Mídias</h2>
  <hr>  
  {#if carregando}

    <p>Carregando galeria do Supabase...</p>

  {:else if listaMidias.length === 0}

    <p>O bucket está vazio!</p>

  {:else}
    
    <div class="galeria-grid">

      {#each listaMidias as midia}

        <div class="quadrado-midia">

          <div class="imagem-bg" style="background-image: url('{midia.url}');"></div>
          
          <div class="legenda">{midia.nome}</div>

        </div>

      {/each}
    </div>

  {/if}
</div>

<style>
 .conteudo-midia {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 20px;
    box-sizing: border-box;
    overflow:hidden;
    display: block;
  }

  .conteudo-midia h2 {
    margin-top: 0;
    margin-bottom: 20px;
  }

  .galeria-grid {
    display: flex;
    flex-wrap: nowrap; 
    gap: 20px;
    margin-top: 15px;
    width: 100%; 
    overflow-x: auto; 
    padding-bottom: 15px; 
  }

  .quadrado-midia {
    width: 160px;
    height: 160px;
    flex-shrink: 0; 
    position: relative;
    border: 1px solid #fff;
    border-radius: 10px;
    overflow: hidden;
    background-color: #111;
  }

  .imagem-bg {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: transform 0.3s;
  }

  .quadrado-midia:hover .imagem-bg {
    transform: scale(1.05); 
  }

  .legenda {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 12px;
    padding: 8px;
    box-sizing: border-box;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s;
  }


  .quadrado-midia:hover .legenda {
    opacity: 1;
  }

</style>