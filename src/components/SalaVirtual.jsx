import { useState, useEffect, useRef } from 'react';
import {
  criarSalaNoAppwrite,
  carregarDadosDaSala,
  atualizarEstadoDaSala,
  deletarSalaDoBanco,
  uploadArquivoStorage,
  salvarRecursoNoBanco,
  limparRecursosDaSala,
  carregarMensagensDaSala,
  enviarMensagemNoBanco,
  clientAppwrite
} from '../services/vttservice';
import './SalaVirtual.css';

const TAMANHO_CELULA = 16.5;
const METROS_POR_CELULA = 1.5;

function SalaVirtual({ usuario, salaAtiva, setSalaAtiva }) {
  const [codigoSala, setCodigoSala] = useState('');
  const [documentIdSala, setDocumentIdSala] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [salasCriadas, setSalasCriadas] = useState([]);
  const [salasEntradas, setSalasEntradas] = useState([]);

  const [mapaFundo, setMapaFundo] = useState('');
  const [tokensNoMapa, setTokensNoMapa] = useState([]);

  useEffect(() => {
    tokensRef.current = tokensNoMapa;
  }, [tokensNoMapa]);

  const [folhetoEmExibicao, setFolhetoEmExibicao] = useState(null);

  const [zoomMapa, setZoomMapa] = useState(1);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const pontoInicioRef = useRef({ x: 0, y: 0 });

  const [tokenArrastando, setTokenArrastando] = useState(null);
  const viewportRef = useRef(null);
  const imgMapaRef = useRef(null);
  const mapaConteudoRef = useRef(null);
  const tokensRef = useRef([]);
  const tokenArrastandoRef = useRef(null);

  const [abaRecursos, setAbaRecursos] = useState('tokens');
  const [recursos, setRecursos] = useState({ tokens: [], folhetos: [], mapas: [] });

  const [mensagens, setMensagens] = useState([]);
  const [textoMsg, setTextoMsg] = useState('');
  const [listaFichas, setListaFichas] = useState([]);
  const [fichaSelecionadaIndex, setFichaSelecionadaIndex] = useState(0);
  const [fichaAtiva, setFichaAtiva] = useState(null);
  const [atributoSelecionado, setAtributoSelecionado] = useState('');
  const [modoVantagem, setModoVantagem] = useState('normal');

  const [gavetaAberta, setGavetaAberta] = useState(false);

  useEffect(() => {
    setSalasCriadas(JSON.parse(localStorage.getItem('vtt_salas_criadas')) || []);
    setSalasEntradas(JSON.parse(localStorage.getItem('vtt_salas_entradas')) || []);

    const fichasGuardadas = JSON.parse(localStorage.getItem('bluelock_fichas')) || [];
    setListaFichas(fichasGuardadas);
    if (fichasGuardadas.length > 0) {
      setFichaSelecionadaIndex(0);
      setFichaAtiva(fichasGuardadas[0]);
    }
  }, []);

  // CARREGAMENTO INICIAL DA SALA E MENSAGENS 
  useEffect(() => {
    if (!salaAtiva) {
      setDocumentIdSala(null);
      setMapaFundo('');
      setTokensNoMapa([]);
      setRecursos({ tokens: [], folhetos: [], mapas: [] });
      setMensagens([]);
      return;
    }

    const inicializarSala = async () => {
      setCarregando(true);
      try {
        const salaDoc = await carregarDadosDaSala(salaAtiva);
        if (salaDoc) {
          setDocumentIdSala(salaDoc.$id);
          setMapaFundo(salaDoc.mapa_url || '');
          setFolhetoEmExibicao(salaDoc.folheto_url || null);

          if (salaDoc.tokens) {
            try {
              const tokensCarregados = JSON.parse(salaDoc.tokens);
              setTokensNoMapa(tokensCarregados);
            } catch {
              setTokensNoMapa([]);
            }
          }

          setRecursos({
            tokens: Array.isArray(salaDoc.recursos_tokens) ? salaDoc.recursos_tokens : [],
            folhetos: Array.isArray(salaDoc.recursos_folhetos) ? salaDoc.recursos_folhetos : [],
            mapas: Array.isArray(salaDoc.recursos_mapas) ? salaDoc.recursos_mapas : []
          });

          // Carregar histórico de mensagens persistido
          const msgsIniciais = await carregarMensagensDaSala(salaAtiva);
          setMensagens(msgsIniciais);

        } else {
          alert(`Sala ${salaAtiva} não foi encontrada.`);
          removerSalaDoHistorico(salaAtiva);
          setSalaAtiva(null);
        }
      } catch (err) {
        console.error("Erro ao carregar sala:", err);
      } finally {
        setCarregando(false);
      }
    };

    inicializarSala();
  }, [salaAtiva]);

  // ESCUTAR SINCRONIZAÇÃO EM TEMPO REAL (APPWRITE REALTIME) 
  useEffect(() => {
    if (!documentIdSala || !salaAtiva) return;

    const unsubscribe = clientAppwrite.subscribe(
      [
        `databases.6a7e41b20037ce22279c.collections.salas.documents.${documentIdSala}`,
        `databases.6a7e41b20037ce22279c.collections.mensagens.documents`
      ],
      (response) => {
        if (response.channels.some(c => c.includes(documentIdSala))) {
          const payload = response.payload;

          if (payload.mapa_url !== undefined) {
            setMapaFundo(payload.mapa_url);
          }
          if (payload.folheto_url !== undefined) {
             setFolhetoEmExibicao(payload.folheto_url || null);
          }
          if (payload.tokens !== undefined) {
            try {
              const novosTokens = JSON.parse(payload.tokens);
              // Atualiza apenas se o usuário local não estiver arrastando no momento
              if (!tokenArrastandoRef.current) {
                setTokensNoMapa(novosTokens);
              }
            } catch (e) {
              console.error("Erro ao processar tokens recebidos em tempo real", e);
            }
          }

          setRecursos({
            tokens: Array.isArray(payload.recursos_tokens) ? payload.recursos_tokens : [],
            folhetos: Array.isArray(payload.recursos_folhetos) ? payload.recursos_folhetos : [],
            mapas: Array.isArray(payload.recursos_mapas) ? payload.recursos_mapas : []
          });
        }

        if (response.channels.some(c => c.includes('mensagens'))) {
          const novaMsg = response.payload;
          if (novaMsg.sala_id === salaAtiva) {
            setMensagens(prev => {
              if (prev.some(m => m.$id === novaMsg.$id)) return prev;
              return [...prev, novaMsg];
            });
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [documentIdSala, salaAtiva]);

  // CONTROLES DE NAVEGAÇÃO / PAN E ZOOM
  const toggleGaveta = () => {
    if (window.innerWidth <= 768) setGavetaAberta(!gavetaAberta);
  };

  const handleZoomIn = () => setZoomMapa(prev => Math.min(prev + 0.2, 4));
  const handleZoomOut = () => setZoomMapa(prev => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => {
    setZoomMapa(1);
    setPosicao({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const sensibilidade = 0.0015;
    const delta = -e.deltaY * sensibilidade;
    setZoomMapa((zoomAtual) => Math.min(Math.max(zoomAtual + delta, 0.4), 4));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 2) return; // Apenas botão direito arrasta a câmera
    if (e.target.closest('.token-wrapper') || e.target.closest('.token-controles')) return;

    if (gavetaAberta) setGavetaAberta(false);
    setArrastando(true);
    pontoInicioRef.current = { x: e.clientX - posicao.x, y: e.clientY - posicao.y };
  };

  const handleMouseMove = (e) => {
    const arraste = tokenArrastandoRef.current;

    if (arraste && imgMapaRef.current) {
      const rectMapa = mapaConteudoRef.current.getBoundingClientRect();

      const larguraMapa = rectMapa.width;
      const alturaMapa = rectMapa.height;

      const mouseX = e.clientX - rectMapa.left;
      const mouseY = e.clientY - rectMapa.top;

      // Calcula a posição do token em pixels
      const novoXPx = mouseX - arraste.offsetX;
      const novoYPx = mouseY - arraste.offsetY;

      // Converte para porcentagem
      const novoXPct = (novoXPx / larguraMapa) * 100;
      const novoYPct = (novoYPx / alturaMapa) * 100;

      const tamanhoPct = arraste.tamanhoPct || 5;

      // Centros para a linha de distância
      const xOrigemCentroPct =
        arraste.xOrigemPct + tamanhoPct / 2;

      const yOrigemCentroPct =
        arraste.yOrigemPct + tamanhoPct / 2;

      const xAtualCentroPct =
        novoXPct + tamanhoPct / 2;

      const yAtualCentroPct =
        novoYPct + tamanhoPct / 2;

      // Distância real
      const larguraMapaPx =
        imgMapaRef.current.naturalWidth || larguraMapa;

      const alturaMapaPx =
        imgMapaRef.current.naturalHeight || alturaMapa;

      const deltaX =
        ((novoXPct - arraste.xOrigemPct) / 100) *
        larguraMapaPx;

      const deltaY =
        ((novoYPct - arraste.yOrigemPct) / 100) *
        alturaMapaPx;

      const distanciaPx =
        Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const distanciaQuadrados =
        distanciaPx / TAMANHO_CELULA;

      const distanciaMetros =
        distanciaQuadrados * METROS_POR_CELULA;

      const novoArraste = {
        ...arraste,
        xAtualPct: novoXPct,
        yAtualPct: novoYPct,
        xOrigemCentroPct,
        yOrigemCentroPct,
        xAtualCentroPct,
        yAtualCentroPct,
        distanciaMetros: distanciaMetros.toFixed(1),
        distanciaQuadrados: distanciaQuadrados.toFixed(1)
      };
      // Atualiza a referência imediatamente
      tokenArrastandoRef.current = novoArraste;
      // Atualiza a interface
      setTokenArrastando(novoArraste);
      // Atualiza a posição visual
      setTokensNoMapa(prev =>
        prev.map(t =>
          t.id === arraste.id
            ? {
              ...t,
              x: novoXPct,
              y: novoYPct
            }
            : t
        )
      );

      return;
    }

    if (arrastando) {
      setPosicao({
        x: e.clientX - pontoInicioRef.current.x,
        y: e.clientY - pontoInicioRef.current.y
      });
    }
  };

  const handleMouseUp = async (e) => {
    const arraste = tokenArrastandoRef.current;

    if (arraste) {
      const tokensFinais = tokensRef.current.map(token =>
        token.id === arraste.id
          ? {
            ...token,
            x: arraste.xAtualPct,
            y: arraste.yAtualPct
          }
          : token
      );
      // Atualiza imediatamente a referência
      tokensRef.current = tokensFinais;
      // Atualiza a tela
      setTokensNoMapa(tokensFinais);
      // Finaliza o arraste
      tokenArrastandoRef.current = null;
      setTokenArrastando(null);
      // SALVA A POSIÇÃO FINAL CORRETA NO APPWRITE
      if (documentIdSala) {
        await atualizarEstadoDaSala(documentIdSala, {
          tokens: JSON.stringify(tokensFinais)
        });
      }
    }

    if (e?.button === 2 || arrastando) {
      setArrastando(false);
    }
  };

  const handleTokenMouseDown = (e, token) => {
    e.stopPropagation();

    if (e.button !== 0) return;
    if (!mapaConteudoRef.current) return;

    const rect = mapaConteudoRef.current.getBoundingClientRect();

    // Posição do token dentro do mapa
    const tokenX = (token.x || 0) / 100 * rect.width;
    const tokenY = (token.y || 0) / 100 * rect.height;

    // Posição do mouse dentro do mapa
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dadosArraste = {
      id: token.id,

      xOrigemPct: token.x || 0,
      yOrigemPct: token.y || 0,

      xAtualPct: token.x || 0,
      yAtualPct: token.y || 0,

      tamanhoPct: token.tamanho || 5,

      offsetX: mouseX - tokenX,
      offsetY: mouseY - tokenY,

      distanciaMetros: '0.0',
      distanciaQuadrados: '0.0'
    };

    setTokenArrastando(dadosArraste);
    tokenArrastandoRef.current = dadosArraste;
  };

  const alterarTamanhoToken = async (e, idToken, delta) => {
    e.stopPropagation();
    const novosTokens = tokensNoMapa.map(token => {
      if (token.id === idToken) {
        const novoTamanho = Math.max(1, Math.min(30, (token.tamanho || 5) + delta));
        return { ...token, tamanho: novoTamanho };
      }
      return token;
    });

    setTokensNoMapa(novosTokens);
    if (documentIdSala) {
      await atualizarEstadoDaSala(documentIdSala, { tokens: JSON.stringify(novosTokens) });
    }
  };

  const removerTokenDoMapa = async (e, idToken) => {
    e.stopPropagation();
    const novosTokens = tokensNoMapa.filter(token => token.id !== idToken);
    setTokensNoMapa(novosTokens);
    if (documentIdSala) {
      await atualizarEstadoDaSala(documentIdSala, { tokens: JSON.stringify(novosTokens) });
    }
  };

  const salvarSalaNoHistorico = (codigo, tipo) => {
    const chave = tipo === 'criada' ? 'vtt_salas_criadas' : 'vtt_salas_entradas';
    const lista = JSON.parse(localStorage.getItem(chave)) || [];
    if (!lista.includes(codigo)) {
      const nova = [codigo, ...lista];
      localStorage.setItem(chave, JSON.stringify(nova));
      if (tipo === 'criada') setSalasCriadas(nova);
      else setSalasEntradas(nova);
    }
  };

  const removerSalaDoHistorico = (codigo) => {
    const criadas = (JSON.parse(localStorage.getItem('vtt_salas_criadas')) || []).filter(c => c !== codigo);
    const entradas = (JSON.parse(localStorage.getItem('vtt_salas_entradas')) || []).filter(c => c !== codigo);
    localStorage.setItem('vtt_salas_criadas', JSON.stringify(criadas));
    localStorage.setItem('vtt_salas_entradas', JSON.stringify(entradas));
    setSalasCriadas(criadas);
    setSalasEntradas(entradas);
  };

  const handleUploadMapa = async (e) => {
    const file = e.target.files[0];
    if (!file || !documentIdSala) return;

    setCarregando(true);
    try {
      const { fileId, url } = await uploadArquivoStorage(file);

      await salvarRecursoNoBanco('MAPAS', {
        sala_id: salaAtiva,
        nome: file.name,
        imagem_url: String(url),
        file_id: fileId
      });

      const novosMapas = [...recursos.mapas, url];
      setMapaFundo(url);
      setRecursos(prev => ({ ...prev, mapas: novosMapas }));
      setPosicao({ x: 0, y: 0 });

      await atualizarEstadoDaSala(documentIdSala, {
        mapa_url: url,
        recursos_mapas: novosMapas
      });
    } catch (err) {
      console.error("Erro no upload do mapa:", err);
      alert("Erro ao enviar o mapa.");
    } finally {
      setCarregando(false);
    }
  };

  const handleUploadRecursoLateral = async (e) => {
    const file = e.target.files[0];
    if (!file || !documentIdSala) return;

    setCarregando(true);
    try {
      const { fileId, url } = await uploadArquivoStorage(file);

      await salvarRecursoNoBanco(abaRecursos, {
        sala_id: salaAtiva,
        file_id: fileId,
        imagem_url: url,
        nome: file.name
      });

      const listaAtual = recursos[abaRecursos] || [];
      const novaLista = [...listaAtual, url];
      setRecursos(prev => ({ ...prev, [abaRecursos]: novaLista }));

      const campoSala = `recursos_${abaRecursos}`;
      await atualizarEstadoDaSala(documentIdSala, { [campoSala]: novaLista });
    } catch (err) {
      console.error(`Erro no upload de ${abaRecursos}:`, err);
      alert(`Erro ao enviar o recurso.`);
    } finally {
      setCarregando(false);
    }
  };

  const handleCliqueRecurso = async (url) => {
    if (abaRecursos === 'mapas') {
      setMapaFundo(url);
      setPosicao({ x: 0, y: 0 });
      if (documentIdSala) await atualizarEstadoDaSala(documentIdSala, { mapa_url: url });
    } else if (abaRecursos === 'tokens') {
      // Adiciona o token centralizado usando coordenadas relativas em porcentagem
      const novoToken = { id: Date.now(), url: url, x: 45, y: 45, tamanho: 6 };
      const novosTokens = [...tokensNoMapa, novoToken];
      setTokensNoMapa(novosTokens);
      if (documentIdSala) {
        await atualizarEstadoDaSala(documentIdSala, { tokens: JSON.stringify(novosTokens) });
      }
    } else if (abaRecursos === 'folhetos') {
      setFolhetoEmExibicao(url);

      if (documentIdSala) {
      await atualizarEstadoDaSala(documentIdSala, {
      folheto_url: url
    });
  }
}
  };

  const excluirSala = async (cod) => {
    const codigoTarget = cod || salaAtiva;
    if (!codigoTarget) return;

    if (!window.confirm(`Deseja DELETAR a sala ${codigoTarget} e TODOS os seus arquivos/recursos?`)) return;

    setCarregando(true);
    try {
      const salaDoc = await carregarDadosDaSala(codigoTarget);
      await limparRecursosDaSala(codigoTarget, salaDoc);

      if (salaDoc?.$id) {
        await deletarSalaDoBanco(salaDoc.$id);
      }

      removerSalaDoHistorico(codigoTarget);
      if (salaAtiva === codigoTarget) setSalaAtiva(null);
      alert(`Sala ${codigoTarget} e todos os seus recursos foram excluídos com sucesso!`);
    } catch (err) {
      console.error("Erro ao excluir sala:", err);
      alert("Erro ao excluir sala.");
    } finally {
      setCarregando(false);
    }
  };

  const criarNovaSala = async () => {
    const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    const mestreId = usuario?.$id || usuario?.id || 'anonimo';
    setCarregando(true);
    try {
      const doc = await criarSalaNoAppwrite(novoCodigo, mestreId);
      setDocumentIdSala(doc.$id);
      salvarSalaNoHistorico(novoCodigo, 'criada');
      setSalaAtiva(novoCodigo);
    } catch (err) {
      alert("Erro ao criar sala.");
    } finally {
      setCarregando(false);
    }
  };

  const entrarNaSala = async (codigo) => {
    const cod = (codigo || codigoSala).trim().toUpperCase();
    if (!cod) return alert("Digite um código!");

    setCarregando(true);
    const existe = await carregarDadosDaSala(cod);
    setCarregando(false);

    if (!existe) return alert("Sala não encontrada.");

    salvarSalaNoHistorico(cod, 'entrada');
    setSalaAtiva(cod);
  };

  // CHAT E ROLAGENS
  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!textoMsg.trim() || !salaAtiva) return;

    const novaMensagem = {
      sala_id: salaAtiva,
      autor: usuario?.name || usuario?.email || 'Jogador',
      texto: textoMsg,
      tipo: 'chat'
    };

    setTextoMsg('');
    await enviarMensagemNoBanco(novaMensagem);
  };

  const rolarDadoEEnviar = async () => {
    if (!atributoSelecionado || !fichaAtiva || !salaAtiva) return alert("Selecione ficha e atributo!");
    const valorBase = Number(fichaAtiva.atributos?.[atributoSelecionado]) || 10;
    const mod = Math.floor((valorBase - 10) / 2) + 1;
    let d1 = Math.floor(Math.random() * 20) + 1;
    let d2 = Math.floor(Math.random() * 20) + 1;
    let dado = d1;
    if (modoVantagem === 'vantagem') dado = Math.max(d1, d2);
    if (modoVantagem === 'desvantagem') dado = Math.min(d1, d2);

    const mensagemRolagem = {
      sala_id: salaAtiva,
      autor: fichaAtiva.jogador || 'Personagem',
      texto: `Rolou ${atributoSelecionado}: d20 (${dado}) + mod (${mod > 0 ? '+' + mod : mod}) = Total: ${dado + mod}`,
      tipo: 'rolagem'
    };

    await enviarMensagemNoBanco(mensagemRolagem);
  };
  const fecharFolheto = async () => {
  setFolhetoEmExibicao(null);

  if (documentIdSala) {
    await atualizarEstadoDaSala(documentIdSala, {
      folheto_url: null
    });
  }
};

  if (!salaAtiva) {
    return (
      <div className="container-lobby">
        <div className="box-lobby">
          <h2>Painel da Sala Virtual</h2>
          <p className="subtitulo-lobby">Crie uma nova sessão ou entre em uma sala existente</p>

          <button className="btn-criar-lobby" onClick={criarNovaSala} disabled={carregando}>
            {carregando ? 'Carregando...' : '➕ Criar Nova Sala (Mestre)'}
          </button>

          <div className="divisor-lobby">
            <span>ou entre por código</span>
          </div>

          <div className="form-entrar-lobby">
            <input
              type="text"
              placeholder="Ex: A1B2C3"
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button onClick={() => entrarNaSala()} disabled={carregando}>
              Entrar
            </button>
          </div>

          {(salasCriadas.length > 0 || salasEntradas.length > 0) && (
            <div className="historico-lobby">
              {salasCriadas.length > 0 && (
                <div className="grupo-historico">
                  <h3>Suas Salas (Mestre)</h3>
                  <div className="lista-cards-sala">
                    {salasCriadas.map((cod) => (
                      <div key={cod} className="card-sala">
                        <span className="cod-sala">{cod}</span>
                        <div className="acoes-card">
                          <button className="btn-entrar-card" onClick={() => setSalaAtiva(cod)}>Entrar</button>
                          <button className="btn-excluir-card" onClick={() => excluirSala(cod)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {salasEntradas.length > 0 && (
                <div className="grupo-historico">
                  <h3>Salas Recentes</h3>
                  <div className="lista-cards-sala">
                    {salasEntradas.map((cod) => (
                      <div key={cod} className="card-sala">
                        <span className="cod-sala">{cod}</span>
                        <button className="btn-entrar-card" onClick={() => setSalaAtiva(cod)}>Entrar</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sala-container">
      <header className="sala-header">
        <h2>CÓDIGO: <span className="codigo-destaque">{salaAtiva}</span></h2>
        <div>
          <button onClick={() => excluirSala(salaAtiva)} className="btn-excluir-sala">Excluir</button>
          <button onClick={() => setSalaAtiva(null)} className="btn-sair-sala">Sair</button>
        </div>
      </header>

      {folhetoEmExibicao && (
        <div className="modal-folheto" onClick={fecharFolheto}>
          <div className="conteudo-modal">
            <img src={folhetoEmExibicao} alt="Folheto Ampliado" />
            <p>Clique para fechar</p>
          </div>
        </div>
      )}

      <div className="sala-grid">
        <section className="area-mapa">
          <div className="painel-controles-mapa">
            <div className="controles-zoom">
              <button onClick={handleZoomIn} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Zoom +</button>
              <button onClick={handleZoomOut} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Zoom -</button>
              <button onClick={handleResetZoom} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Reset ({Math.round(zoomMapa * 100)}%)</button>
            </div>

            <label className="btn-upload">
              {carregando ? '...' : 'Upload Mapa'}
              <input type="file" accept="image/*" onChange={handleUploadMapa} hidden disabled={carregando} />
            </label>
          </div>

          <div
            ref={viewportRef}
            className="viewport-mapa-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheel}
            style={{
              overflow: 'hidden',
              width: '100%',
              height: 'calc(100% - 50px)',
              position: 'relative',
              border: '1px solid #333',
              cursor: tokenArrastando ? 'move' : arrastando ? 'grabbing' : 'grab',
              userSelect: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              ref={mapaConteudoRef}
              className="viewport-mapa"
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translate(${posicao.x}px, ${posicao.y}px) scale(${zoomMapa})`,
                transformOrigin: 'center center'
              }}
            >
              {!mapaFundo ? (
                <div style={{ display: 'flex', width: '600px', height: '400px', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="placeholder-mapa">Nenhum mapa carregado. Adicione uma imagem acima!</p>
                </div>
              ) : (
                <img
                  ref={imgMapaRef}
                  src={mapaFundo}
                  alt="Mapa de Fundo"
                  draggable={false}
                  style={{
                    display: 'block',
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Linha Guia do Arraste de Token */}
              {tokenArrastando && (
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 20
                  }}
                >
                  <line
                    x1={`${tokenArrastando.xOrigemCentroPct}%`}
                    y1={`${tokenArrastando.yOrigemCentroPct}%`}
                    x2={`${tokenArrastando.xAtualCentroPct}%`}
                    y2={`${tokenArrastando.yAtualCentroPct}%`}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={`${tokenArrastando.xOrigemCentroPct}%`}
                    cy={`${tokenArrastando.yOrigemCentroPct}%`}
                    r="4"
                    fill="#ffffff"
                  />
                </svg>
              )}

              {/* Renderização Sincronizada dos Tokens */}
              {tokensNoMapa.map((token) => {
                const tamanho = token.tamanho || 5;
                const estaSendoArrastado = tokenArrastando?.id === token.id;

                return (
                  <div
                    key={token.id}
                    className="token-wrapper"
                    onMouseDown={(e) => handleTokenMouseDown(e, token)}
                    style={{
                      position: 'absolute',
                      left: `${token.x}%`,
                      top: `${token.y}%`,
                      width: `${tamanho}%`,
                      aspectRatio: '1/1',
                      display: 'inline-block',
                      cursor: 'grab',
                      zIndex: estaSendoArrastado ? 30 : 5
                    }}
                  >
                    {estaSendoArrastado && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-45px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.85)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                          pointerEvents: 'none',
                          textAlign: 'center',
                          border: '1px solid #555'
                        }}
                      >
                        <div>{tokenArrastando.distanciaMetros} m</div>
                        <div style={{ fontSize: '9px', color: '#aaa' }}>{tokenArrastando.distanciaQuadrados} qd</div>
                      </div>
                    )}

                    <img
                      src={token.url}
                      alt="Token"
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid #00d2ff',
                        objectFit: 'cover',
                        display: 'block',
                        pointerEvents: 'none'
                      }}
                    />
                    <div
                      className="token-controles"
                      style={{
                        position: 'absolute',
                        top: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '2px',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        zIndex: 10
                      }}
                    >
                      <button onClick={(e) => alterarTamanhoToken(e, token.id, 1)} title="Aumentar" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', padding: '0 4px', fontSize: '10px' }}>+</button>
                      <button onClick={(e) => alterarTamanhoToken(e, token.id, -1)} title="Diminuir" style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', padding: '0 4px', fontSize: '10px' }}>-</button>
                      <button onClick={(e) => removerTokenDoMapa(e, token.id)} title="Remover" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', padding: '0 4px', fontSize: '10px' }}>x</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className={`area-lateral ${gavetaAberta ? 'aberta' : ''}`}>
          <div className="painel-recursos" onClick={toggleGaveta}>
            <div className="abas-recursos">
              <button className={abaRecursos === 'tokens' ? 'ativa' : ''} onClick={(e) => { e.stopPropagation(); setAbaRecursos('tokens'); }}>Tokens</button>
              <button className={abaRecursos === 'folhetos' ? 'ativa' : ''} onClick={(e) => { e.stopPropagation(); setAbaRecursos('folhetos'); }}>Folhetos</button>
              <button className={abaRecursos === 'mapas' ? 'ativa' : ''} onClick={(e) => { e.stopPropagation(); setAbaRecursos('mapas'); }}>Mapas</button>
            </div>

            <div style={{ marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
              <label className="btn-upload-recurso" style={{ display: 'block', textAlign: 'center', background: '#22c55e', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                {carregando ? '...' : `Add ${abaRecursos}`}
                <input type="file" accept="image/*" onChange={handleUploadRecursoLateral} hidden disabled={carregando} />
              </label>
            </div>

            <div className="galeria-recursos">
              {(!recursos[abaRecursos] || recursos[abaRecursos].length === 0) ? (
                <p style={{ color: '#666', fontSize: '11px', gridColumn: '1/-1', textAlign: 'center' }}>Vazio.</p>
              ) : (
                recursos[abaRecursos].map((url, idx) => (
                  <div key={idx} className="item-galeria" onClick={(e) => { e.stopPropagation(); handleCliqueRecurso(url); }}>
                    <img src={url} alt="Recurso" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="painel-ficha-rapida" onClick={toggleGaveta}>
            <h3>Ficha Ativa</h3>
            {listaFichas.length > 0 && (
              <>
                <select value={fichaSelecionadaIndex} onChange={(e) => { setFichaSelecionadaIndex(Number(e.target.value)); setFichaAtiva(listaFichas[e.target.value]); }} onClick={(e) => e.stopPropagation()}>
                  {listaFichas.map((f, i) => <option key={i} value={i}>{f.jogador || `Ficha ${i + 1}`}</option>)}
                </select>
                <div className="controles-rolagem-rapida">
                  <select value={atributoSelecionado} onChange={(e) => setAtributoSelecionado(e.target.value)} onClick={(e) => e.stopPropagation()}>
                    <option value="">-- Atributo --</option>
                    {fichaAtiva?.atributos && Object.keys(fichaAtiva.atributos).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select value={modoVantagem} onChange={(e) => setModoVantagem(e.target.value)} onClick={(e) => e.stopPropagation()}>
                    <option value="normal">Normal</option>
                    <option value="vantagem">Vantagem</option>
                    <option value="desvantagem">Desvantagem</option>
                  </select>
                  <button onClick={(e) => { e.stopPropagation(); rolarDadoEEnviar(); }} className="btn-rolar-sala">Rolar</button>
                </div>
              </>
            )}
          </div>

          <div className="painel-chat" onClick={toggleGaveta}>
            <h3>Chat</h3>
            <div className="historico-chat">
              {mensagens.map((msg, idx) => (
                <div key={msg.$id || idx} className={`mensagem ${msg.tipo}`}>
                  <strong>{msg.autor}: </strong><span>{msg.texto}</span>
                </div>
              ))}
            </div>
            <form onSubmit={enviarMensagem} className="form-chat" onClick={(e) => e.stopPropagation()}>
              <input type="text" placeholder="Msg..." value={textoMsg} onChange={(e) => setTextoMsg(e.target.value)} />
              <button type="submit">Enviar</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SalaVirtual;