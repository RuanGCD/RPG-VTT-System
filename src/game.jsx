import { useState, useEffect } from 'react';

// Tabela de bônus por estilo para cálculo do modificador final
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

export default function TelaDeDados() {
  const [fichas, setFichas] = useState([]);
  const [fichaAtivaId, setFichaAtivaId] = useState('');
  const [fichaSelecionada, setFichaSelecionada] = useState(null);

  // Estados de rolagem
  const [atributoSelecionado, setAtributoSelecionado] = useState('');
  const [tipoRolagem, setTipoRolagem] = useState('normal');
  const [modificadorManual, setModificadorManual] = useState(0);
  const [resultado, setResultado] = useState(null);

  // 1. Carrega as fichas salvas do localStorage (chave corrigida para 'bluelock_fichas')
  useEffect(() => {
    const fichasSalvas = localStorage.getItem('bluelock_fichas');
    const idAtivoSalvo = localStorage.getItem('fichaAtivaId');

    if (fichasSalvas) {
      try {
        const listaParseada = JSON.parse(fichasSalvas);
        setFichas(listaParseada);

        if (listaParseada.length > 0) {
          const idInicial = idAtivoSalvo || listaParseada[0].id;
          setFichaAtivaId(idInicial);
        }
      } catch (e) {
        console.error("Erro ao carregar fichas do localStorage:", e);
      }
    }
  }, []);

  // 2. Atualiza a ficha selecionada ao mudar de ID
  useEffect(() => {
    if (fichas.length > 0 && fichaAtivaId) {
      const encontrada = fichas.find((f) => f.id === fichaAtivaId);
      if (encontrada) {
        setFichaSelecionada(encontrada);
        const chavesAtributos = Object.keys(encontrada.atributos || {});
        if (chavesAtributos.length > 0) {
          setAtributoSelecionado(chavesAtributos[0]);
        }
      }
    } else {
      setFichaSelecionada(null);
      setAtributoSelecionado('Personalizado');
    }
  }, [fichaAtivaId, fichas]);

  const handleMudarFicha = (id) => {
    setFichaAtivaId(id);
    localStorage.setItem('fichaAtivaId', id);
  };

  // Funções de cálculo do modificador final (Atributo Base + Estilo -> Modificador)
  const calcularModificador = (nomeAtributo) => {
    if (!fichaSelecionada || !fichaSelecionada.atributos) return 0;

    const valorBase = Number(fichaSelecionada.atributos[nomeAtributo]) || 0;
    const estiloFormatado = (fichaSelecionada.estilo || '').trim();
    const bonusDoEstilo = bonusPorEstilo[estiloFormatado];

    let bonus = 0;
    if (bonusDoEstilo && bonusDoEstilo[nomeAtributo] !== undefined) {
      bonus = Number(bonusDoEstilo[nomeAtributo]);
    }

    const valorFinal = valorBase + bonus;
    if (isNaN(valorFinal)) return 0;
    if (valorFinal === 30) return 11;

    return Math.floor((valorFinal - 10) / 2) + 1;
  };

  const obterModificadorAtual = () => {
    if (atributoSelecionado === 'Personalizado') {
      return Number(modificadorManual) || 0;
    }
    return calcularModificador(atributoSelecionado);
  };

  const rolarDado = () => {
    const mod = obterModificadorAtual();
    const dadosRolados = [];
    const totalDados = tipoRolagem === 'normal' ? 1 : 2;

    for (let i = 0; i < totalDados; i++) {
      dadosRolados.push(Math.floor(Math.random() * 20) + 1);
    }

    let dadoEscolhido;
    if (tipoRolagem === 'desvantagem') {
      dadoEscolhido = Math.min(...dadosRolados);
    } else {
      dadoEscolhido = Math.max(...dadosRolados);
    }

    const totalFinal = dadoEscolhido + mod;

    setResultado({
      dadosRolados,
      dadoEscolhido,
      modificador: mod,
      atributoUsado: atributoSelecionado,
      totalFinal,
      tipoRolagem:
        tipoRolagem === 'vantagem'
          ? 'Vantagem'
          : tipoRolagem === 'desvantagem'
          ? 'Desvantagem'
          : 'Normal',
    });
  };

  return (
    <div className="container-dados">
      <h2>🎲 Lançador de Dados (D20)</h2>

      <div className="painel-inputs-dados">
        {/* Seletor de Ficha Ativa */}
        <div className="campo-dado">
          <label>Ficha do Personagem:</label>
          {fichas.length > 0 ? (
            <select
              value={fichaAtivaId}
              onChange={(e) => handleMudarFicha(e.target.value)}
            >
              {fichas.map((ficha) => (
                <option key={ficha.id} value={ficha.id}>
                  {ficha.jogador || 'Sem nome'}
                </option>
              ))}
            </select>
          ) : (
            <small style={{ color: '#aaa' }}>
              Nenhuma ficha salva encontrada. Crie e salve uma ficha no painel acima.
            </small>
          )}
        </div>

        {/* Seletor de Atributo */}
        <div className="campo-dado">
          <label>Atributo para Rolagem:</label>
          <select
            value={atributoSelecionado}
            onChange={(e) => setAtributoSelecionado(e.target.value)}
          >
            {fichaSelecionada && fichaSelecionada.atributos ? (
              Object.keys(fichaSelecionada.atributos).map((nomeAtributo) => {
                const mod = calcularModificador(nomeAtributo);
                return (
                  <option key={nomeAtributo} value={nomeAtributo}>
                    {nomeAtributo}: {mod >= 0 ? `+${mod}` : mod}
                  </option>
                );
              })
            ) : null}
            <option value="Personalizado">Outro (Modificador Manual)</option>
          </select>
        </div>

        {/* Modificador Manual */}
        {atributoSelecionado === 'Personalizado' && (
          <div className="campo-dado">
            <label>Valor do Modificador Manual:</label>
            <input
              type="number"
              value={modificadorManual}
              onChange={(e) => setModificadorManual(e.target.value)}
              placeholder="Ex: +3 ou -1"
            />
          </div>
        )}

        {/* Modo de Rolagem */}
        <div className="campo-dado">
          <label>Modo de Rolagem:</label>
          <select
            value={tipoRolagem}
            onChange={(e) => setTipoRolagem(e.target.value)}
          >
            <option value="normal">Normal (1d20)</option>
            <option value="vantagem">Vantagem (2d20 - Pega o Maior)</option>
            <option value="desvantagem">Desvantagem (2d20 - Pega o Menor)</option>
          </select>
        </div>

        <button className="btn-girar-dado" onClick={rolarDado}>
          Girar Dado 🎲
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="caixa-resultado-dado">
          <h3>Resultado da Rolagem</h3>
          <p>
            <strong>Modo:</strong> {resultado.tipoRolagem}
          </p>
          <p>
            <strong>Dados Rolados:</strong> [{resultado.dadosRolados.join(', ')}]
          </p>
          <p>
            <strong>Dado Selecionado:</strong> {resultado.dadoEscolhido}
          </p>
          <p>
            <strong>Modificador ({resultado.atributoUsado}):</strong>{' '}
            {resultado.modificador >= 0
              ? `+${resultado.modificador}`
              : resultado.modificador}
          </p>

          <div className="resultado-final-destaque">
            TOTAL: {resultado.totalFinal}
          </div>
        </div>
      )}
    </div>
  );
}