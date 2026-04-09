<script>
// @ts-nocheck

import { onMount } from 'svelte';

  let meusRepositorios = [];
  const usuarioGithub = 'iagofelipe-DOT';

  onMount(async () => {
    
    try{

        const resposta = await fetch(`https://api.github.com/users/${usuarioGithub}/repos`);
        const dados = await resposta.json();
        meusRepositorios = dados;

    } catch(erro) {
        console.error("Erro ao buscar no GitHub:", erro);
    }
  
  });

</script>

{#if meusRepositorios.length === 0}
  <p>Buscando projetos no GitHub...</p>
{:else}
  
  <div class="grid-projetos">
    
    {#each meusRepositorios as repo}
      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" class="cartao-projeto">
        
        <div class="foto-repo" style="background-image: url({repo.owner.avatar_url});"></div>
        
        <div class="dados-repo">
          <h3>{repo.name}</h3>
          <p>Criado em: {new Date(repo.created_at).toLocaleDateString('pt-BR')}</p>
          <p>{repo.language || 'Várias linguagens'}</p>
        </div>
        
      </a>
    {/each}
    
  </div>

{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=VT323&display=swap');

  p, h3{
    font-family: 'VT323', sans-serif;
    font-weight: 0;
  }

  .grid-projetos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 15px;
    padding-bottom: 20px;
    padding-top: 30px;
  }

  .cartao-projeto {
    display: flex;
    flex-direction: column;
    background-color: #000;
    border: 1px solid #fff;
    border-radius: 30px 30px 0 0;
    overflow: hidden;
    text-decoration: none;
    color: #fff;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cartao-projeto:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);
  }

  .foto-repo {
    height: 120px; 
    background-size: cover;
    background-position: center;
    background-color: #222; 
    border-bottom: 1px solid #fff;
  }

  .dados-repo {
    height: auto;
    gap: 1px;
    padding: 10px;
  }

</style>