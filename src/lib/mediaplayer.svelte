<script>
// @ts-nocheck

import { supabase } from '$lib/supabase.js'; 
import { onMount } from 'svelte';

  let playlist = []; 
  let musicaAtualIndex = 0; 

  let musicaAtual = null; 
  let elementoAudio; 

  onMount(async () =>{
    // Busca de Playlist
    const { data: arquivosMusica, error } = await supabase.storage.from('general-media').list();
    
    if (arquivosMusica && !error) {
      // Filtra de arquivos de áudio (.mp3, .wav, etc)
      let audios = arquivosMusica.filter(arq => arq.name.endsWith('.mp3') || arq.name.endsWith('.wav'));
      
      if (audios.length > 0) {
        // Shuffle
        // Organiza o array aleatoriamente
        audios = audios.sort(() => Math.random() - 0.5);

        playlist = audios.map(arq => {
          
          const { data } = supabase.storage.from('general-media').getPublicUrl(arq.name);

          // Limpa a extensão (.mp3 ou .wav) para o nome ficar bonito na tela
          let nomeLimpo = arq.name.replace('.mp3', '').replace('.wav', '');
          
          return {
            nome: nomeLimpo,
            url: data.publicUrl
          };
        });

        musicaAtual = playlist[0];
      }
    }
})
  function tocarProxima() {

    if (playlist.length === 0) return; 
    
    musicaAtualIndex = (musicaAtualIndex + 1) % playlist.length;
    musicaAtual = playlist[musicaAtualIndex];
    
    setTimeout(() => {

        if (elementoAudio){ 
            elementoAudio.pause();
            elementoAudio.load();
            elementoAudio.play().catch(e => console.log("Aguardando interação do usuário."));
        }
    }, 50);
  }


</script>

  <div class="player-musica" style="margin-top: auto; padding: 10px; width: 100%; box-sizing: border-box;">

    <p style="font-size: 10px; text-align: center; margin-bottom: 5px; nowrap; overflow: hidden; text-overflow: ellipsis;">Tocando agora: <strong>{musicaAtual?.nome}</strong></p>
    
    <button on:click={tocarProxima} class="btn-pular" title="Pular música" style="background: transparent; border: none; color: white; cursor: pointer;">
        <svg viewBox="0 0 24 24" width="18" fill="currentColor">
          <path d="M6 18L14.5 12L6 6V18ZM16 6V18H18V6H16Z" />
        </svg>
      </button>

    {#if musicaAtual}
    <audio 
      bind:this={elementoAudio} 
      controls src={musicaAtual.url} 
      style="width: 100%; height: 35px; outline: none;">
        Seu navegador não suporta áudio.
    </audio>
    {/if}

  </div>
