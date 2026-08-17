import { useEffect, useState } from "react";
import { account, ID } from "../lib/appwrite";

const MAX_TENTATIVAS = 5;
const TEMPO_BLOQUEIO_SEGUNDOS = 60; // 1 minuto de bloqueio

export default function Auth({ onUsuarioAlterado }) {
  const [modoLogin, setModoLogin] = useState(true);

  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Estados da Trava de Segurança
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(0);

  // Verificação inicial de sessão
  useEffect(() => {
    checarUsuarioLogado();
  }, []);

  // Timer para decrementar o tempo de bloqueio
  useEffect(() => {
    let timer;
    if (tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
      }, 1000);
    } else if (tempoRestante === 0 && tentativasFalhas >= MAX_TENTATIVAS) {
      // Reseta as tentativas após o término do tempo
      setTentativasFalhas(0);
      setErro('');
    }
    return () => clearInterval(timer);
  }, [tempoRestante, tentativasFalhas]);

  const checarUsuarioLogado = async () => {
    try {
      const user = await account.get();
      if (onUsuarioAlterado) onUsuarioAlterado(user);
    } catch (e) {
      if (onUsuarioAlterado) onUsuarioAlterado(null);
    }
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await account.create(ID.unique(), email, password, nome);
      await account.createEmailPasswordSession(email, password);
      await checarUsuarioLogado();
      setEmail('');
      setPassword('');
      setNome('');
    } catch (err) {
      setErro(err.message || 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Impede o envio se estiver bloqueado
    if (tempoRestante > 0) return;

    setErro('');
    setCarregando(true);

    try {
      await account.createEmailPasswordSession(email, password);
      
      // Reseta o contador em caso de sucesso
      setTentativasFalhas(0);
      setTempoRestante(0);
      
      await checarUsuarioLogado();
      setEmail('');
      setPassword('');
    } catch (err) {
      // Se o próprio Appwrite bloquear por IP (código 429 - Rate Limit)
      if (err?.code === 429) {
        setTempoRestante(TEMPO_BLOQUEIO_SEGUNDOS);
        setErro(`Muitas tentativas detectadas pelo servidor. Aguarde ${TEMPO_BLOQUEIO_SEGUNDOS}s.`);
        return;
      }

      const novasTentativas = tentativasFalhas + 1;
      setTentativasFalhas(novasTentativas);

      if (novasTentativas >= MAX_TENTATIVAS) {
        setTempoRestante(TEMPO_BLOQUEIO_SEGUNDOS);
        setErro(`Limite de ${MAX_TENTATIVAS} tentativas excedido. Tente novamente em ${TEMPO_BLOQUEIO_SEGUNDOS} segundos.`);
      } else {
        const restantes = MAX_TENTATIVAS - novasTentativas;
        setErro(`E-mail ou senha incorretos! (${restantes} tentativa${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''})`);
      }
    } finally {
      setCarregando(false);
    }
  };

  const estaBloqueado = tempoRestante > 0;

  return (
    <div className="container-auth">
      <h2 className="auth-tittle">{modoLogin ? ' Entrar no Sistema' : ' Criar Nova Conta'}</h2>
      
      {erro && <div className="mensagem-erro-auth">{erro}</div>}

      <form onSubmit={modoLogin ? handleLogin : handleCadastrar}>
        {!modoLogin && (
          <div className="campo-auth">
            <label>Nickname:</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Isagi Yoichi"
              disabled={estaBloqueado}
            />
          </div>
        )}

        <div className="campo-auth">
          <label>E-mail:</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            disabled={estaBloqueado}
          />
        </div>

        <div className="campo-auth">
          <label>Senha:</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            disabled={estaBloqueado}
          />
        </div>

        <button 
          type="submit" 
          disabled={carregando || estaBloqueado} 
          className="btn-auth-submit"
        >
          {carregando
            ? 'Processando...'
            : estaBloqueado
            ? `Bloqueado (${tempoRestante}s)`
            : modoLogin
            ? 'Entrar'
            : 'Criar Conta'}
        </button>
      </form>

      <div className="toggle-auth-modo">
        <p>
          {modoLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
          <button
            type="button"
            className="btn-link-toggle"
            disabled={estaBloqueado}
            onClick={() => {
              setModoLogin(!modoLogin);
              setErro('');
            }}
          >
            {modoLogin ? ' Cadastre-se aqui' : ' Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}