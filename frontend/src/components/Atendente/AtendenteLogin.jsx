import React, { useState } from 'react';
import { Activity, Stethoscope, TestTubes, FileText, ChevronRight } from 'lucide-react';
import { API_URL, CLIENT_ID, SETORES } from '../../config';

const ICONS = { Activity, Stethoscope, TestTubes, FileText };

function AtendenteLogin({ onEntrar }) {
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

        {erro && <div className="atend-error-box">{erro}</div>}

        <div className="atend-setor-grid">
          {SETORES.map(({ cat, label, iconName, cor, corBg }) => {
            const Icon = ICONS[iconName];
            return (
              <button
                key={cat}
                className={`atend-setor-btn ${setorSelecionado === cat ? 'ativo' : ''}`}
                style={setorSelecionado === cat ? { borderColor: cor, background: corBg } : {}}
                onClick={() => setSetorSelecionado(cat)}
              >
                <Icon size={36} color={cor} />
                <span>{label}</span>
              </button>
            );
          })}
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

export default AtendenteLogin;
