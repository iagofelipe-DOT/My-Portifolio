
<svelte:head>

  <title>Felp knows how to code</title> 
  <link rel="icon" href="/logo.gif" /> 

</svelte:head>

<script>
// @ts-nocheck

import GitAPI from '$lib/gitAPI.svelte';
import Header from '$lib/header.svelte';
import Media from '$lib/media.svelte';
import Mediaplayer from '$lib/mediaplayer.svelte';
import { supabase } from '$lib/supabase.js'; 
import { onMount } from 'svelte';
import { fade, fly } from 'svelte/transition';
import './layout.css';

  
  let abaAtiva = 'sobre-mim';
  let conteudoCentral = 'sobre-mim';
  let alturaAbaDinamica = '0px';

  let telaPronta = false
  let linkFotoPerfil = '';
  let linkFundo = '';
  let textoIntroducao = "Carregando bio..."

  onMount(async () => { 
    telaPronta = true 
    const { data, error } = await supabase
      .from('perfil')
      .select('introducao')
      .limit(1)
      .single();

    if (data && !error) {
      textoIntroducao = data.introducao;
    }
  });

  function carregarImagens(){
    
    //nome do arquivo da foto de perfil (profile.png) no bucket (portfolio-assets)
    const { data: profileData } = supabase.storage
      .from('portfolio-assets')
      .getPublicUrl('profile.png');

    linkFotoPerfil = profileData.publicUrl;


    const { data: backgroundData } = supabase.storage

      .from('portfolio-assets')
      .getPublicUrl('background.jpg');

    linkFundo = backgroundData.publicUrl;

  }
  
  function mudarAba(nomeDaAba) {

    // Toggle logic
    if (abaAtiva === nomeDaAba && (nomeDaAba === 'midia' || nomeDaAba === 'contato')) {
      abaAtiva = ''; 
      alturaAbaDinamica = '0px'; 
      return; 
    }
    abaAtiva = nomeDaAba;

    if (nomeDaAba === 'sobre-mim' || nomeDaAba === 'posts' || nomeDaAba === 'projetos') {
      conteudoCentral = nomeDaAba;
    }

    if (nomeDaAba === 'sobre-mim') {
      alturaAbaDinamica = '0px'; 
    } else if (nomeDaAba === 'posts') {
      alturaAbaDinamica = '0px';
    } else if (nomeDaAba === 'projetos') {
      alturaAbaDinamica = '0px'; 
    } else if (nomeDaAba === 'midia') {
      alturaAbaDinamica = '800px'; 
    } else if (nomeDaAba === 'contato') {
      alturaAbaDinamica = '100px';
    }

  }
  
  carregarImagens();

</script>

<div class="pagina-fundo" style="background-image: url('{linkFundo}'); background-size: contain; background-position: right bottom; background-repeat: no-repeat;">
  {#if telaPronta}
  <div class="portfolio-container" in:fly={{ y: 100, duration: 1000}}>
    
    <aside class="menu-lateral">
      <div class="espaco-topo-menu"></div>
      
      <div class="lista-abas">
        <button class:ativo={abaAtiva === 'sobre-mim'} on:click={() => mudarAba('sobre-mim')}>Sobre Mim </button>
        <button class:ativo={abaAtiva === 'posts'} on:click={() => mudarAba('posts')}>Posts</button>
        <button class:ativo={abaAtiva === 'projetos'} on:click={() => mudarAba('projetos')}>Projetos</button>
        <button class:ativo={abaAtiva === 'midia'} on:click={() => mudarAba('midia')}>Mídia</button>
        <button class:ativo={abaAtiva === 'contato'} on:click={() => mudarAba('contato')}>Contato</button>
      </div>

      
    </aside>
    
    <main class="conteudo-principal">
      
    <Header linkFotoPerfil={linkFotoPerfil}/>

      <section class="sobre-mim-texto" transition:fade={{ duration: 300 }}>

        {#if conteudoCentral === 'posts'}

          <div class="conteudo-posts">

            <h2>Posts</h2>
            <hr>
            <p>Ainda não está pronto :( </p>
            <p>Escuta essa música enquanto não termino!</p>
            <Mediaplayer/>

          </div>
          
        {:else if conteudoCentral === 'sobre-mim' }

          <h2>Desenvolvedor Jr. | Foco em Java, Web e Automação</h2>
          <hr>
          
          {#each textoIntroducao.split('\n') as paragrafo}
            
            {#if paragrafo.trim() !== ''}
              <p>{paragrafo}</p>
            {/if}
          
          {/each}

        {:else if conteudoCentral === 'projetos'}
          <h2 style="font-family: 'VT323', sans-serif;font-weight: 0; font-style: normal; letter-spacing:20px;">Whereas disregard and contempt for human rights have resulted</h2>
          <hr>
          <GitAPI/>

        {/if}

      </section>

      <section class="aba-dinamica" style="height: {alturaAbaDinamica};">
        
        {#if abaAtiva === 'midia'}

          <Media/>

        {:else if abaAtiva === 'contato'}
          
          <div class="conteudo-contato" style="padding: 20px; display: flex; gap: 20px; align-items: center;">
            
            <a href="https://github.com/iagofelipe-DOT" target="_blank" rel= 'noopener noreferrer' aria-label="Github" style="width: 40px; color: #fff;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
            
            <a href="https://wa.me/5531989535820" target="_blank" rel= 'noopener noreferrer' aria-label="WhatsApp" style="width: 40px; color: #fff;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></a>
            
            <a href="https://www.instagram.com/felpd3v/" target="_blank" rel= 'noopener noreferrer' aria-label="Instagram" style="width: 40px; color: #fff;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
            
            <a href="https://discord.gg/" target="_blank" rel= 'noopener noreferrer' aria-label="Discord" style="width: 40px; color: #fff;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.05.05 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg></a>
          
          </div>
        
        {:else if abaAtiva !== 'sobre-mim' && abaAtiva !== 'posts' && abaAtiva !== 'projetos'}

          <div class="conteudo-generico" style="padding: 20px;">

            <p>Você clicou na aba: <strong>{abaAtiva}</strong>.</p>

          </div>

        {/if}
        
      </section>
    </main>
  </div>
  {/if}
</div>
