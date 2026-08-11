import { useRef, useState, useEffect } from 'react';
import './App.css';
import CampoAtributo from './components/atributos';
import TelaDeDados from './game';
import logo from "./assets/Logo.png";
import html2canvas from 'html2canvas';

function App() {
  const fichaRef = useRef(null);

  // Estado para controlar a tela ativa ('ficha' ou 'dados')
  const [telaAtiva, setTelaAtiva] = useState('ficha');

  // Estados dos campos textuais e globais da ficha
  const [jogador, setJogador] = useState('');
  const [idade, setIdade] = useState('');
  const [altura, setAltura] = useState('');
  const [posicao, setPosicao] = useState('');
  const [peDominante, setPeDominante] = useState('Direito');
  const [talento, setTalento] = useState('');
  const [arma, setArma] = useState('');
  const [ego, setEgo] = useState('');
  const [estilo, setEstilo] = useState('');

  // Estado para armazenar os valores base de cada atributo
  const [atributos, setAtributos] = useState({
    Carisma: 10,
    BolaParada: 10,
    Defesa: 10,
    Dominio: 10,
    Drible: 10,
    Finalizacao: 10,
    Frieza: 10,
    Fisico: 10,
    Interceptacao: 10,
    Passe: 10,
    Ritmo: 10,
  });

  // Lista de fichas salvas no localStorage
  const [fichasSalvas, setFichasSalvas] = useState([]);
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState('');

  // Carregar fichas salvas ao iniciar
  useEffect(() => {
    const fichasLocalStorage = JSON.parse(localStorage.getItem('bluelock_fichas')) || [];
    setFichasSalvas(fichasLocalStorage);
  }, []);

  const salvarComoImagem = async () => {
    if (!fichaRef.current) return;
    const canvas = await html2canvas(fichaRef.current);
    const imagem = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${jogador || "BlueLockCharacter"}.png`;
    link.href = imagem;
    link.click();
  };

  // Tabela de bônus por estilo
  const bonusPorEstilo = {
    "Caçador": { Defesa: 2, Ritmo: 2, Interceptacao: 1, Frieza: -1, Finalizacao: -1 },
    "Construtor": { Defesa: 2, Passe: 2, Interceptacao: 1, Ritmo: -1, Drible: -1 },
    "Xerife": { Defesa: 2, Fisico: 2, Carisma: 1, Ritmo: -1, Passe: -1 },
    "Defensivo": { Defesa: 2, Interceptacao: 2, Ritmo: 1, Finalizacao: -1, Drible: -1 },
    "Ofensivo": { Ritmo: 2, Passe: 2, Drible: 1, Defesa: -1, Interceptacao: -1 },
    "InvertidoL": { Interceptacao: 2, Passe: 2, Ritmo: 1, Fisico: -1, Finalizacao: -1 },
    "Armador": { Defesa: 2, Passe: 2, Frieza: 1, Ritmo: -1, Finalizacao: -1 },
    "Batedor": { Defesa: 2, Fisico: 2, Interceptacao: 1, Passe: -1, Drible: -1 },
    "Box-To-Box": { Defesa: 2, Ritmo: 2, Finalizacao: 1, Passe: -1, Drible: -1 },
    "Camisa 10": { Passe: 2, BolaParada: 2, Drible: 1, Defesa: -1, Fisico: -1 },
    "Tiki-Taka": { Passe: 2, Interceptacao: 2, Ritmo: 1, Finalizacao: -1, Fisico: -1 },
    "Motorzinho": { Ritmo: 2, Defesa: 2, Passe: 1, Finalizacao: -1, Frieza: -1 },
    "Driblador": { Drible: 2, Ritmo: 2, Frieza: 1, Finalizacao: -1, Passe: -1 },
    "InvertidoP": { Ritmo: 2, Finalizacao: 2, Drible: 1, Fisico: -1, Passe: -1 },
    "Agudo": { Ritmo: 2, Passe: 2, Drible: 1, Finalizacao: -1, Frieza: -1 },
    "Falso 9": { Finalizacao: 2, Passe: 2, Ritmo: 1, Fisico: -1, Defesa: -1 },
    "Pivo": { Dominio: 2, Finalizacao: 2, Fisico: 1, Ritmo: -1, Defesa: -1 },
    "Matador": { Frieza: 2, Finalizacao: 2, Fisico: 1, Drible: -1, Defesa: -1 },
  };

  const getAtributoFinal = (nomeAtributo) => {
    const valorBase = Number(atributos[nomeAtributo]) || 0;
    const estiloFormatado = estilo.trim();
    const bonusDoEstilo = bonusPorEstilo[estiloFormatado];
    
    let bonus = 0;
    if (bonusDoEstilo && bonusDoEstilo[nomeAtributo] !== undefined) {
      bonus = Number(bonusDoEstilo[nomeAtributo]);
    }

    return valorBase + bonus;
  };

  const calcularModificador = (nomeAtributo) => {
    const valorFinal = getAtributoFinal(nomeAtributo);
    if (isNaN(valorFinal)) return 0;
    
    if (valorFinal === 30) return 11;
    return Math.floor((valorFinal - 10) / 2) + 1;
  };

  const salvarNoLocalStorage = () => {
    if (!jogador.trim()) {
      alert("Preencha o campo JOGADOR (nome da ficha) antes de salvar!");
      return;
    }

    const dadosFicha = {
      id: fichaSelecionadaId || Date.now().toString(),
      jogador,
      idade,
      altura,
      posicao,
      peDominante,
      talento,
      arma,
      ego,
      estilo,
      atributos
    };

    let novasFichas;
    const indexExistente = fichasSalvas.findIndex(f => f.id === dadosFicha.id);

    if (indexExistente >= 0) {
      novasFichas = [...fichasSalvas];
      novasFichas[indexExistente] = dadosFicha;
    } else {
      novasFichas = [...fichasSalvas, dadosFicha];
    }

    setFichasSalvas(novasFichas);
    localStorage.setItem('bluelock_fichas', JSON.stringify(novasFichas));
    setFichaSelecionadaId(dadosFicha.id);
    alert(`Ficha de "${jogador}" salva com sucesso!`);
  };

  const carregarFicha = (id) => {
    setFichaSelecionadaId(id);
    if (!id) return;

    const ficha = fichasSalvas.find(f => f.id === id);
    if (ficha) {
      setJogador(ficha.jogador || '');
      setIdade(ficha.idade || '');
      setAltura(ficha.altura || '');
      setPosicao(ficha.posicao || '');
      setPeDominante(ficha.peDominante || 'Direito');
      setTalento(ficha.talento || '');
      setArma(ficha.arma || '');
      setEgo(ficha.ego || '');
      setEstilo(ficha.estilo || '');
      setAtributos(ficha.atributos || {
        Carisma: 10, BolaParada: 10, Defesa: 10, Dominio: 10,
        Drible: 10, Finalizacao: 10, Frieza: 10, Fisico: 10,
        Interceptacao: 10, Passe: 10, Ritmo: 10
      });
    }
  };

  const excluirFicha = () => {
    if (!fichaSelecionadaId) {
      alert("Selecione uma ficha salva para excluir.");
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir esta ficha?")) {
      const novasFichas = fichasSalvas.filter(f => f.id !== fichaSelecionadaId);
      setFichasSalvas(novasFichas);
      localStorage.setItem('bluelock_fichas', JSON.stringify(novasFichas));
      setFichaSelecionadaId('');
      alert("Ficha excluída com sucesso!");
    }
  };

  const novaFichaLimpa = () => {
    setFichaSelecionadaId('');
    setJogador('');
    setIdade('');
    setAltura('');
    setPosicao('');
    setPeDominante('Direito');
    setTalento('');
    setArma('');
    setEgo('');
    setEstilo('');
    setAtributos({
      Carisma: 10, BolaParada: 10, Defesa: 10, Dominio: 10,
      Drible: 10, Finalizacao: 10, Frieza: 10, Fisico: 10,
      Interceptacao: 10, Passe: 10, Ritmo: 10,
    });
  };

  const handleAtributoChange = (nome, valor) => {
    setAtributos((prev) => ({
      ...prev,
      [nome]: valor === '' ? '' : Number(valor)
    }));
  };

  return (
    <div className="app-container">
      {/* Cabeçalho para navegação entre telas */}
      <header className="cabecalho-navegacao">
        <button
          className={telaAtiva === 'ficha' ? 'btn-nav ativo' : 'btn-nav'}
          onClick={() => setTelaAtiva('ficha')}
        >
           Ficha de Personagem
        </button>
        <button
          className={telaAtiva === 'dados' ? 'btn-nav ativo' : 'btn-nav'}
          onClick={() => setTelaAtiva('dados')}
        >
           Rolar Dados
        </button>
      </header>

      {/* Renderização Condicional da Tela de Ficha */}
      {telaAtiva === 'ficha' && (
        <>
          <div className="painel-gerenciamento" style={{ marginBottom: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '8px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#aaa' }}>Carregar Ficha Salva:</label>
              <select 
                value={fichaSelecionadaId} 
                onChange={(e) => carregarFicha(e.target.value)}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff' }}
              >
                <option value="">-- Selecionar Ficha --</option>
                {fichasSalvas.map((f) => (
                  <option key={f.id} value={f.id}>{f.jogador || "Sem Nome"}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <button onClick={salvarNoLocalStorage} style={{ padding: '6px 12px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Salvar Ficha
              </button>
              <button onClick={novaFichaLimpa} style={{ padding: '6px 12px', background: '#0288d1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Nova Ficha
              </button>
              {fichaSelecionadaId && (
                <button onClick={excluirFicha} style={{ padding: '6px 12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Excluir
                </button>
              )}
            </div>
          </div>

          <section className="ficha" ref={fichaRef}>
            <section className='Topo'>
              <h1> Blue Lock: <strong>Egoist</strong> Character</h1>
              <div className='conteudo'>
                <div className='esquerda'>
                  <div className='campo'>
                    <label>JOGADOR</label>
                    <input 
                      type='text' 
                      value={jogador} 
                      onChange={(e) => setJogador(e.target.value)} 
                      placeholder="Nome do Jogador / Ficha"
                    />
                  </div>

                  <div className='linha'>
                    <div className='campo'>
                      <label>IDADE</label>
                      <input 
                        type='number' 
                        value={idade} 
                        onChange={(e) => setIdade(e.target.value)} 
                      />
                    </div>
                    <div className='campo'>
                      <label>ALTURA</label>
                      <input 
                        type='text' 
                        value={altura} 
                        onChange={(e) => setAltura(e.target.value)} 
                      />
                    </div>
                    <div className='campo'>
                      <label>POSIÇÃO</label>
                      <input 
                        type='text' 
                        value={posicao} 
                        onChange={(e) => setPosicao(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div className='direita'>
                  <div className='pe-dominante'>
                    <h3 className='titulo-direita'>Pé Dominante </h3>
                    <label> 
                      <input 
                        type='radio' 
                        name='pe' 
                        checked={peDominante === 'Direito'} 
                        onChange={() => setPeDominante('Direito')} 
                      /> Direito
                    </label>
                    <label> 
                      <input 
                        type='radio' 
                        name='pe' 
                        checked={peDominante === 'Esquerdo'} 
                        onChange={() => setPeDominante('Esquerdo')} 
                      /> Esquerdo
                    </label>
                    <label> 
                      <input 
                        type='radio' 
                        name='pe' 
                        checked={peDominante === 'Ambidestro'} 
                        onChange={() => setPeDominante('Ambidestro')} 
                      /> Ambidestro
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className='meio'>
              <div className='atributos-esquerda'>
                <CampoAtributo 
                  nome="Carisma" 
                  valor={atributos.Carisma} 
                  modificador={calcularModificador("Carisma")}
                  onChange={(e) => handleAtributoChange("Carisma", e.target.value)}
                />
                <CampoAtributo 
                  nome="Bola Parada" 
                  valor={atributos.BolaParada} 
                  modificador={calcularModificador("BolaParada")}
                  onChange={(e) => handleAtributoChange("BolaParada", e.target.value)}
                />
                <CampoAtributo 
                  nome="Defesa" 
                  valor={atributos.Defesa} 
                  modificador={calcularModificador("Defesa")}
                  onChange={(e) => handleAtributoChange("Defesa", e.target.value)}
                />
                <CampoAtributo 
                  nome="Domínio" 
                  valor={atributos.Dominio} 
                  modificador={calcularModificador("Dominio")}
                  onChange={(e) => handleAtributoChange("Dominio", e.target.value)}
                />
                <CampoAtributo 
                  nome="Drible" 
                  valor={atributos.Drible} 
                  modificador={calcularModificador("Drible")}
                  onChange={(e) => handleAtributoChange("Drible", e.target.value)}
                />
                <CampoAtributo 
                  nome="Finalização" 
                  valor={atributos.Finalizacao} 
                  modificador={calcularModificador("Finalizacao")}
                  onChange={(e) => handleAtributoChange("Finalizacao", e.target.value)}
                />
              </div>

              <div className='atributos-centro'>
                <img src={logo} alt="Imagem logo blue lock" />
              </div>

              <div className='atributos-direita'>
                <CampoAtributo 
                  nome="Frieza" 
                  valor={atributos.Frieza} 
                  modificador={calcularModificador("Frieza")}
                  onChange={(e) => handleAtributoChange("Frieza", e.target.value)}
                />
                <CampoAtributo 
                  nome="Físico" 
                  valor={atributos.Fisico} 
                  modificador={calcularModificador("Fisico")}
                  onChange={(e) => handleAtributoChange("Fisico", e.target.value)}
                />
                <CampoAtributo 
                  nome="Interceptação" 
                  valor={atributos.Interceptacao} 
                  modificador={calcularModificador("Interceptacao")}
                  onChange={(e) => handleAtributoChange("Interceptacao", e.target.value)}
                />
                <CampoAtributo 
                  nome="Passe" 
                  valor={atributos.Passe} 
                  modificador={calcularModificador("Passe")}
                  onChange={(e) => handleAtributoChange("Passe", e.target.value)}
                />
                <CampoAtributo 
                  nome="Ritmo" 
                  valor={atributos.Ritmo} 
                  modificador={calcularModificador("Ritmo")}
                  onChange={(e) => handleAtributoChange("Ritmo", e.target.value)}
                />
              </div>
            </section>

            <section className="Inferior">
              <div className="campo-grande">
                <label>TALENTO</label>
                <textarea 
                  rows="4" 
                  value={talento} 
                  onChange={(e) => setTalento(e.target.value)}
                ></textarea>
              </div>

              <div className="linha-inferior">
                <div className="campo-pequeno">
                  <label>ESTILO</label>
                  <input 
                    type="text" 
                    value={estilo} 
                    onChange={(e) => setEstilo(e.target.value)} 
                    placeholder="Ex: Caçador"
                  />
                </div>

                <div className="campo-grande">
                  <label>ARMA</label>
                  <textarea 
                    rows="4" 
                    value={arma} 
                    onChange={(e) => setArma(e.target.value)}
                  ></textarea>
                </div>

                <div className="campo-pequeno">
                  <label>EGO</label>
                  <input 
                    type="text" 
                    value={ego} 
                    onChange={(e) => setEgo(e.target.value)} 
                  />
                </div>
              </div>
            </section>
          </section>

          <button className="Salvar-imagem" onClick={salvarComoImagem} style={{ marginTop: '15px' }}>
            Salvar como PNG
          </button>
        </>
      )}

      {/* Renderização Condicional da Tela de Dados */}
      {telaAtiva === 'dados' && <TelaDeDados />}
    </div>
  );
}

export default App;