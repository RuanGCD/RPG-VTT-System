import { useRef, useState } from 'react';
import './App.css'
import CampoAtributo from './components/atributos';
import logo from "./assets/Logo.png";
import html2canvas from 'html2canvas';

function App() {
  const fichaRef = useRef(null);
  const salvarComoImagem = async () => {
    if (!fichaRef.current) return;

    const canvas = await html2canvas(fichaRef.current);

    const imagem = canvas.toDataURL("image/png");

    const link = document.createElement("a");

    link.download = "BlueLockCharacter.png";
    link.href = imagem;

    link.click();
};

  return (
    <>
    <section className="ficha" ref={fichaRef}>
      <section className='Topo'>
        <h1> Blue Lock: <strong>Egoist</strong> Character</h1>
        <div className='conteudo'>
        <div className='esquerda'>

  <div className='campo'>
    <label>JOGADOR</label>
    <input type='text' />
  </div>

  <div className='linha'>

    <div className='campo'>
      <label>IDADE</label>
      <input type='number' />
    </div>

    <div className='campo'>
      <label>ALTURA</label>
      <input type='text' />
    </div>

    <div className='campo'>
      <label>POSIÇÃO</label>
      <input type='text' />
    </div>

  </div>

</div>

        <div className='direita'>
          <div className='pe-dominante'>
              <h3 className='titulo-direita'>Pé Dominante </h3>
              <label> <input type='radio' name='pe'/> Direito</label>
              <label> <input type='radio' name='pe'/> Esquerdo</label>
              <label> <input type='radio' name='pe'/> Ambidestro</label>
          </div>
        </div>
        </div>
      </section>

      <section className='meio'>
        <div className='atributos-esquerda'>
          <CampoAtributo nome="Carisma"/>
          <CampoAtributo nome="Bola Parada"/>
          <CampoAtributo nome="Defesa"/>
          <CampoAtributo nome="Dominio"/>
          <CampoAtributo nome="Drible"/>
          <CampoAtributo nome="Finalização"/>
        </div>
        <div className='atributos-centro'>
          <img src={logo} alt="Imagem logo blue lock" />
        </div>
        <div className='atributos-direita'>
          <CampoAtributo nome="Frieza"/>
          <CampoAtributo nome="Físico"/>
          <CampoAtributo nome="Interceptação"/>
          <CampoAtributo nome="Passe"/>
          <CampoAtributo nome="Ritmo"/>
        </div>
      </section>
      <section className="Inferior">

    <div className="campo-grande">
        <label>TALENTO</label>
        <textarea rows="4"></textarea>
    </div>

    <div className="linha-inferior">

        <div className="campo-pequeno">
            <label>ESTILO</label>
            <input type="text" />
        </div>

        <div className="campo-grande">
            <label>ARMA</label>
            <textarea rows="4"></textarea>
        </div>

        <div className="campo-pequeno">
            <label>EGO</label>
            <input type="text" />
        </div>

    </div>

</section>
</section>
<button className="Salvar-imagem" onClick={salvarComoImagem}>
    Salvar como PNG
</button>
    </>
  )
}

export default App
