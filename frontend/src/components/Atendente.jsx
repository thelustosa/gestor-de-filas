import React, { useState, useEffect, useCallback } from 'react';
import { Ear, Landmark, CarFront, FileText, LogOut, BellRing, CheckCircle, RefreshCw, MessageSquare, Clock, Users, ChevronRight, History } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8001'
  : `http://${window.location.hostname}:8001`;

const CLIENT_ID = (() => {
  let id = sessionStorage.getItem('agr_client_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('agr_client_id', id);
  }
  return id;
})();

const SETORES = [
  { cat: 'O', label: 'Ouvidoria', icon: Ear, cor: '#3b82f6', corBg: 'rgba(59,130,246,0.12)' },
  { cat: 'F', label: 'Finanças', icon: Landmark, cor: '#10b981', corBg: 'rgba(16,185,129,0.12)' },
  { cat: 'C', label: 'Cadastro de Veículos e Empresas', icon: CarFront, cor: '#f59e0b', corBg: 'rgba(245,158,11,0.12)' },
  { cat: 'P', label: 'Protocolar Documentos', icon: FileText, cor: '#8b5cf6', corBg: 'rgba(139,92,246,0.12)' },
];

function formatarTempo(seg) {
  if (seg == null) return '—';
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatarHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─────────────────────────────────────────
//  ESTÁGIO 1 — Seleção de Setor e Guichê
// ─────────────────────────────────────────
function Login({ onEntrar }) {
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [guiche, setGuiche] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const setor = SETORES.find(s => s.cat === setorSelecionado);

  const handleEntrar = async () => {
    if (!setorSelecionado || !guiche.trim()) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`${API_URL}/atendente/validar/${guiche.trim()}?client_id=${CLIENT_ID}`);
      const data = await res.json();
      if (data.ocupado) {
        setErro(data.mensagem);
      } else {
        onEntrar(setorSelecionado, guiche.trim());
      }
    } catch {
      setErro("Erro ao validar guichê. Verifique a conexão.");
    }
    setLoading(false);
  };

  return (
    <div className="atend-login">
      <div className="atend-login-card">
        <h1 className="atend-login-title">Painel do Atendente</h1>
        <p className="atend-login-sub">Selecione seu setor e informe seu guichê</p>

        {erro && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '0.8rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>{erro}</div>}

        <div className="atend-setor-grid">
          {SETORES.map(({ cat, label, icon: Icon, cor, corBg }) => (
            <button
              key={cat}
              className={`atend-setor-btn ${setorSelecionado === cat ? 'ativo' : ''}`}
              style={setorSelecionado === cat ? { borderColor: cor, background: corBg } : {}}
              onClick={() => setSetorSelecionado(cat)}
            >
              <Icon size={36} color={cor} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="atend-guiche-row">
          <label htmlFor="guiche-input">Número do Guichê / Mesa (Apenas Números)</label>
          <input
            id="guiche-input"
            type="text"
            className="atend-input"
            placeholder="Ex: 1, 2, 3..."
            value={guiche}
            onChange={e => setGuiche(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <button
          className="atend-btn-entrar"
          disabled={!setorSelecionado || !guiche.trim() || loading}
          onClick={handleEntrar}
          style={setor ? { background: `linear-gradient(135deg, ${setor.cor}cc, ${setor.cor})` } : {}}
        >
          {loading ? 'Verificando...' : 'Entrar no Painel'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  ESTÁGIO 2 — Painel de Atendimento
// ─────────────────────────────────────────
function Painel({ categoria, guiche, onSair }) {
  const setor = SETORES.find(s => s.cat === categoria);
  const [senhaAtiva, setSenhaAtiva] = useState(null);
  const [fila, setFila] = useState({ total: 0, senhas: [] });
  const [historico, setHistorico] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [obsEditando, setObsEditando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const exibirMsg = (texto, tipo = 'ok') => {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 3000);
  };

  const buscarEstado = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/senha/atendente/${categoria}?guiche=${encodeURIComponent(guiche)}`);
      const data = await res.json();
      setSenhaAtiva(data.senha_ativa);
      setFila(data.fila || { total: 0, senhas: [] });
      setHistorico(data.historico || []);
      if (data.senha_ativa && !obsEditando) {
        setObservacao(data.senha_ativa.observacao || '');
      }
    } catch (e) {
      console.error(e);
    }
  }, [categoria, guiche, obsEditando]);

  useEffect(() => {
    buscarEstado();

    let ws = null;
    let reconnectTimeout = null;
    let reconnectDelay = 3000;

    const connectWS = () => {
      const wsUrl = API_URL.replace('http', 'ws') + '/ws/senhas?guiche=' + encodeURIComponent(guiche) + '&client_id=' + CLIENT_ID;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        reconnectDelay = 3000;
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.tipo === 'FILA_ATUALIZADA' || msg.tipo === 'NOVA_SENHA') {
          buscarEstado();
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [buscarEstado]);

  const chamarProxima = async () => {
    setLoading(true);
    if (observacao && senhaAtiva) await salvarObservacaoSilencioso();
    try {
      const res = await fetch(`${API_URL}/senha/chamar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, guiche }),
      });
      const data = await res.json();
      if (data.erro) { exibirMsg(data.erro, 'erro'); }
      else { setSenhaAtiva(data); setObservacao(data.observacao || ''); exibirMsg(`Senha ${data.id} chamada!`); }
    } catch { exibirMsg('Erro de conexão', 'erro'); }
    setLoading(false);
    buscarEstado();
  };

  const rechamar = async () => {
    try {
      await fetch(`${API_URL}/senha/rechamar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guiche }),
      });
      exibirMsg('Senha rechamada no painel!');
    } catch { exibirMsg('Erro de conexão', 'erro'); }
  };

  const finalizar = async () => {
    if (!window.confirm('Deseja realmente finalizar este atendimento?')) return;
    setLoading(true);
    if (observacao && senhaAtiva) await salvarObservacaoSilencioso();
    try {
      const res = await fetch(`${API_URL}/senha/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guiche }),
      });
      const data = await res.json();
      if (data.erro) { exibirMsg(data.erro, 'erro'); }
      else { setSenhaAtiva(null); setObservacao(''); exibirMsg('Atendimento finalizado!'); }
    } catch { exibirMsg('Erro de conexão', 'erro'); }
    setLoading(false);
    buscarEstado();
  };

  const salvarObservacaoSilencioso = async () => {
    if (!senhaAtiva) return;
    try {
      await fetch(`${API_URL}/senha/observacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_id: senhaAtiva.id, observacao }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const salvarObservacao = async () => {
    if (!senhaAtiva) return;
    try {
      await fetch(`${API_URL}/senha/observacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_id: senhaAtiva.id, observacao }),
      });
      setObsEditando(false);
      exibirMsg('Observação salva!');
    } catch {
      exibirMsg('Erro ao salvar', 'erro');
    }
  };

  const rechamarHistorico = async (id) => {
    if (observacao && senhaAtiva) await salvarObservacaoSilencioso();
    try {
      await fetch(`${API_URL}/senha/historico/rechamar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_id: id, guiche }),
      });
      exibirMsg('Senha rechamada do histórico!');
    } catch { exibirMsg('Erro de conexão', 'erro'); }
  };

  const editarObsHistorico = async (id, obsAtual) => {
    const novaObs = window.prompt(`Observação para a senha ${id}:`, obsAtual || '');
    if (novaObs === null) return; // Cancelou

    try {
      await fetch(`${API_URL}/senha/observacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_id: id, observacao: novaObs }),
      });
      exibirMsg('Observação do histórico salva!');
      buscarEstado();
    } catch { exibirMsg('Erro ao salvar', 'erro'); }
  };

  return (
    <div className="atend-painel">
      {/* Header */}
      <header className="atend-header" style={{ borderBottomColor: setor?.cor }}>
        <div className="atend-header-info">
          {setor && <setor.icon size={22} color={setor.cor} />}
          <span className="atend-header-setor" style={{ color: setor?.cor }}>{setor?.label}</span>
          <span className="atend-header-guiche">— Guichê {guiche}</span>
        </div>
        <button className="atend-btn-sair" onClick={onSair}>
          <LogOut size={16} /> Sair
        </button>
      </header>

      {/* Toast */}
      {msg && (
        <div className={`atend-toast ${msg.tipo}`}>{msg.texto}</div>
      )}

      <div className="atend-body">
        {/* Coluna principal */}
        <div className="atend-col-main">

          {/* Card Senha Ativa */}
          <div className="atend-card-senha">
            <div className="atend-card-senha-label">EM ATENDIMENTO</div>
            {senhaAtiva ? (
              <>
                <div className="atend-senha-numero" style={{ color: setor?.cor }}>
                  {senhaAtiva.id}
                  {senhaAtiva.preferencial && (
                    <span style={{ fontSize: '1rem', background: 'var(--preferencial)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', marginLeft: '1rem', verticalAlign: 'middle', textShadow: 'none', letterSpacing: 'normal' }}>
                      PREFERENCIAL
                    </span>
                  )}
                </div>
                <div className="atend-senha-meta">
                  <span><Clock size={14} /> Emitida: {formatarHora(senhaAtiva.horario_emissao)}</span>
                  <span><Clock size={14} /> Chamada: {formatarHora(senhaAtiva.horario_chamada)}</span>
                  <span>⏱ Espera: {formatarTempo(senhaAtiva.tempo_espera_seg)}</span>
                </div>
                {senhaAtiva.observacao && (
                  <div className="atend-obs-badge">Obs: {senhaAtiva.observacao}</div>
                )}
              </>
            ) : (
              <div className="atend-sem-senha">Nenhuma senha em atendimento</div>
            )}
          </div>

          {/* Ações */}
          <div className="atend-acoes">
            <button
              id="btn-chamar-proxima"
              className="atend-btn-acao primario"
              style={{ background: `linear-gradient(135deg, ${setor?.cor}bb, ${setor?.cor})` }}
              onClick={chamarProxima}
              disabled={loading || fila.total === 0}
            >
              <BellRing size={20} />
              Chamar Próxima
            </button>
            <button
              id="btn-rechamar"
              className="atend-btn-acao secundario"
              onClick={rechamar}
              disabled={!senhaAtiva}
            >
              <RefreshCw size={18} />
              Rechamar
            </button>
            <button
              id="btn-finalizar"
              className="atend-btn-acao perigo"
              onClick={finalizar}
              disabled={loading || !senhaAtiva}
            >
              <CheckCircle size={18} />
              Finalizar
            </button>
          </div>

          <div className="atend-card-obs">
            <div className="atend-card-obs-header">
              <MessageSquare size={16} /> Observação da Senha
            </div>
            <textarea
              className="atend-textarea"
              placeholder="Digite uma observação sobre este atendimento..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <aside className="atend-col-fila" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

          <div className="atend-fila-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
            <div className="atend-fila-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} />
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Fila</span>
              <span className="atend-fila-badge" style={{ background: setor?.cor, marginLeft: 'auto' }}>{fila.total}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {fila.total === 0 ? (
                <div className="atend-fila-vazia">Fila vazia</div>
              ) : (
                <div className="atend-fila-list">
                  {fila.senhas.map((s, i) => (
                    <div key={s.id} className="atend-fila-item">
                      <div className="atend-fila-pos">#{i + 1}</div>
                      <div className="atend-fila-info">
                        <strong style={{ color: setor?.cor }}>
                          {s.id}
                          {s.preferencial && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', background: 'var(--preferencial)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', verticalAlign: 'middle' }}>P</span>}
                        </strong>
                        <small>Emitida {formatarHora(s.horario_emissao)}</small>
                        {s.observacao && <small className="atend-fila-obs">Obs: {s.observacao}</small>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO HISTÓRICO */}
          <div className="atend-historico-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px', borderTop: '2px solid #e2e8f0' }}>
            <div className="atend-fila-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} />
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Histórico</span>
              <span className="atend-fila-badge" style={{ background: '#64748b', marginLeft: 'auto' }}>{historico.length}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {historico.length === 0 ? (
                <div className="atend-fila-vazia">Nenhum histórico</div>
              ) : (
                <div className="atend-fila-list">
                  {historico.map((s) => (
                    <div key={s.id} className="atend-fila-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0.8rem' }}>
                      <div className="atend-fila-info" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <strong style={{ color: '#1e293b', fontSize: '1rem' }}>
                            {s.id}
                            {s.preferencial && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'var(--preferencial)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem' }}>P</span>}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatarHora(s.horario_finalizacao)}</span>
                        </div>
                        {s.observacao && <small className="atend-fila-obs" style={{ display: 'block', marginTop: '0.3rem', color: '#d97706' }}>Obs: {s.observacao}</small>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', width: '100%' }}>
                        <button style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '600' }} onClick={() => rechamarHistorico(s.id)}>Rechamar</button>
                        <button style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '600' }} onClick={() => editarObsHistorico(s.id, s.observacao)}>Observação</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────
function Atendente() {
  const [sessao, setSessao] = useState(null); // { categoria, guiche }

  if (!sessao) {
    return <Login onEntrar={(cat, g) => setSessao({ categoria: cat, guiche: g })} />;
  }
  return <Painel categoria={sessao.categoria} guiche={sessao.guiche} onSair={() => setSessao(null)} />;
}

export default Atendente;
