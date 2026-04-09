<script>
    export let linkFotoPerfil;
</script>

<header class="cabecalho">

        <div class="avatar" style="background-image: url('{linkFotoPerfil}'); background-size: cover; background-position: center;"></div>
        <div class="info-perfil">

          <h1>Iago Felipe</h1>
          <p>Foco Técnico/Hardware: Desenvolvedor, criador de projetos DIY e amante de homelabbing</p>
        
        </div>

</header>

<style>
    
  .cabecalho {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #fff;
    height: 120px;
    box-sizing: border-box;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px solid #fff;
    margin-right: 20px;
    background-color: #222;
  }

  .info-perfil h1 {
    margin: 0;
    font-size: 20px;
    letter-spacing: 1px;
  }

  .info-perfil p {
    margin: 5px 0 0 0;
    font-size: 12px;
    color: #aaa;
  }

</style>