import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ear, Landmark, CarFront, FileText, LogOut, BellRing, CheckCircle, RefreshCw, MessageSquare, Clock } from 'lucide-react';
import { API_URL, CLIENT_ID, SETORES } from '../../config';
import { formatarTempo, formatarHora } from '../../utils/formatters';
import QueueSidebar from './QueueSidebar';

const ICONS = { Ear, Landmark, CarFront, FileText };

function AtendentePainel({ categoria, guiche, onSair }) {
  const setorInfo = SETORES.find(s => s.cat === categoria);
  const SetorIcon = ICONS[setorInfo?.iconName] || Ear;

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

  const wsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    buscarEstado();

    let ws = null;
    let reconnectTimeout = null;
    let reconnectDelay = 3000;

    const connectWS = () => {
      const wsUrl = API_URL.replace('http', 'ws') + '/ws/senhas?guiche=' + encodeURIComponent(guiche) + '&client_id=' + CLIENT_ID + '&categoria=' + categoria;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => { reconnectDelay = 3000; };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.tipo === 'FILA_ATUALIZADA' || msg.tipo === 'NOVA_SENHA') {
          if (isMounted) buscarEstado();
        }
      };
      ws.onclose = () => {
        if (!isMounted) return;
        reconnectTimeout = setTimeout(connectWS, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connectWS();
    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [buscarEstado, guiche, categoria]);

  const handleSair = () => {
    if (wsRef.current) wsRef.current.close();
    onSair();
  };

  const salvarObservacaoSilencioso = async () => {
    if (!senhaAtiva) return;
    try {
      await fetch(`${API_URL}/senha/observacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_id: senhaAtiva.id, observacao }),
      });
    } catch (e) { console.error(e); }
  };

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
      else { 
        setSenhaAtiva(data); 
        setObservacao(data.observacao || ''); 
        exibirMsg(`Senha ${data.id} chamada!`); 
      }
    } catch { exibirMsg('Erro de conexão', 'erro'); }
    setLoading(false);
    buscarEstado();
  };

  const rechamar = async () => {
    try {
      await fetch(`${API_URL}/senha/rechamar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, guiche }),
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
        body: JSON.stringify({ categoria, guiche }),
      });
      const data = await res.json();
      if (data.erro) { exibirMsg(data.erro, 'erro'); }
      else { 
        setSenhaAtiva(null); 
        setObservacao(''); 
        exibirMsg('Atendimento finalizado!'); 
      }
    } catch { exibirMsg('Erro de conexão', 'erro'); }
    setLoading(false);
    buscarEstado();
  };

  const rechamarHistorico = async (id) => {
    if (observacao && senhaAtiva) await salvarObservacaoSilencioso();
    try {
      await fetch(`${API_URL}/senha/historico/rechamar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_id: id, categoria, guiche }),
      });
      exibirMsg('Senha rechamada do histórico!');
    } catch { exibirMsg('Erro de conexão', 'erro'); }
  };

  const editarObsHistorico = async (id, obsAtual) => {
    const novaObs = window.prompt(`Observação para a senha ${id}:`, obsAtual || '');
    if (novaObs === null) return;
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
      <header className="atend-header" style={{ borderBottomColor: setorInfo?.cor }}>
        <div className="atend-header-info">
          <SetorIcon size={22} color={setorInfo?.cor} />
          <span className="atend-header-setor" style={{ color: setorInfo?.cor }}>{setorInfo?.label}</span>
          <span className="atend-header-guiche">— Guichê {guiche}</span>
        </div>
        <button className="atend-btn-sair" onClick={handleSair}>
          <LogOut size={16} /> Sair
        </button>
      </header>

      {msg && <div className={`atend-toast ${msg.tipo}`}>{msg.texto}</div>}

      <div className="atend-body">
        <div className="atend-col-main">
          <div className="atend-card-senha">
            <div className="atend-card-senha-label">EM ATENDIMENTO</div>
            {senhaAtiva ? (
              <>
                <div className="atend-senha-numero" style={{ color: setorInfo?.cor }}>
                  {senhaAtiva.id}
                  {senhaAtiva.preferencial && <span className="badge-preferencial-main">PREFERENCIAL</span>}
                </div>
                <div className="atend-senha-meta">
                  <span><Clock size={14} /> Emitida: {formatarHora(senhaAtiva.horario_emissao)}</span>
                  <span><Clock size={14} /> Chamada: {formatarHora(senhaAtiva.horario_chamada)}</span>
                  <span>⏱ Espera: {formatarTempo(senhaAtiva.tempo_espera_seg)}</span>
                </div>
                {senhaAtiva.observacao && <div className="atend-obs-badge">Obs: {senhaAtiva.observacao}</div>}
              </>
            ) : (
              <div className="atend-sem-senha">Nenhuma senha em atendimento</div>
            )}
          </div>

          <div className="atend-acoes">
            <button className="atend-btn-acao primario" style={{ background: `linear-gradient(135deg, ${setorInfo?.cor}bb, ${setorInfo?.cor})` }} onClick={chamarProxima} disabled={loading || fila.total === 0}>
              <BellRing size={20} /> Chamar Próxima
            </button>
            <button className="atend-btn-acao secundario" onClick={rechamar} disabled={!senhaAtiva}>
              <RefreshCw size={18} /> Rechamar
            </button>
            <button className="atend-btn-acao perigo" onClick={finalizar} disabled={loading || !senhaAtiva}>
              <CheckCircle size={18} /> Finalizar
            </button>
          </div>

          <div className="atend-card-obs">
            <div className="atend-card-obs-header"><MessageSquare size={16} /> Observação da Senha</div>
            <textarea
              className="atend-textarea"
              placeholder="Digite uma observação sobre este atendimento..."
              value={observacao}
              onChange={e => { setObservacao(e.target.value); setObsEditando(true); }}
              onBlur={() => { salvarObservacaoSilencioso(); setObsEditando(false); }}
              disabled={loading}
            />
          </div>
        </div>

        <QueueSidebar 
          fila={fila} 
          historico={historico} 
          setor={setorInfo} 
          onRechamarHistorico={rechamarHistorico}
          onEditarObsHistorico={editarObsHistorico}
        />
      </div>
    </div>
  );
}

export default AtendentePainel;
