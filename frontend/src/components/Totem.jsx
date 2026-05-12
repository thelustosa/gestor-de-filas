import React, { useState, useEffect } from 'react';
import { Ear, Landmark, CarFront, FileText } from 'lucide-react';
import TicketPrint from './TicketPrint';
import { API_URL, SETORES } from '../config';

const ICONS = { Ear, Landmark, CarFront, FileText };

function Totem() {
  const [senha, setSenha] = useState(null);
  const [erro, setErro] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (senha) {
      setTimeout(() => { window.print(); }, 100);
    }
  }, [senha]);

  const retirarSenha = async (tipo) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/senha/gerar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: categoriaSelecionada.cat, tipo })
      });
      if (!res.ok) throw new Error('Falha na resposta do servidor');
      const data = await res.json();

      setSenha({ 
        id: data.id, 
        catNome: categoriaSelecionada.nome, 
        tipoNome: tipo === 'P' ? 'Preferencial' : 'Normal' 
      });
      setErro(null);
      setCategoriaSelecionada(null); 

      setTimeout(() => { setSenha(null); }, 5000);

    } catch (e) {
      setErro('Sistema temporariamente indisponível. Tente novamente.');
      setTimeout(() => setErro(null), 4000);
    }
    setLoading(false);
  };

  return (
    <div className="totem-layout">
      
      {!senha && !erro && <h1 className="totem-title">Retire sua Senha</h1>}

      {!categoriaSelecionada && !senha && !erro && (
        <div className="totem-grid">
          {SETORES.map((setor) => {
            const Icon = ICONS[setor.iconName];
            return (
              <button 
                key={setor.cat}
                className={`btn-totem btn-${setor.iconName.toLowerCase()}`} 
                onClick={() => setCategoriaSelecionada({ cat: setor.cat, nome: setor.label })}
              >
                <Icon size={80} color={setor.cor} />
                {setor.label}
              </button>
            );
          })}
        </div>
      )}

      {categoriaSelecionada && !senha && !erro && (
        <div className="totem-tipo-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '800px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>{categoriaSelecionada.nome}</h2>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button 
              className="btn-totem btn-preferencial-totem" 
              style={{ flex: 1, borderColor: '#D4A017', background: 'rgba(212, 160, 23, 0.1)' }} 
              onClick={() => retirarSenha('P')}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Preferencial'}
            </button>
            <button 
              className="btn-totem btn-normal-totem" 
              style={{ flex: 1, borderColor: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)' }} 
              onClick={() => retirarSenha('N')}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Normal'}
            </button>
          </div>
          <button 
            className="btn-voltar-totem"
            onClick={() => setCategoriaSelecionada(null)}
          >
            ← Voltar
          </button>
        </div>
      )}

      {(senha || erro) && (
        <div className="modal-overlay">
          <div className="modal-content" style={erro ? { border: '4px solid #ef4444' } : {}}>
            {erro ? (
              <>
                <h2 style={{ color: '#ef4444' }}>Ocorreu um Erro</h2>
                <p style={{ fontSize: '1.5rem', color: '#64748b', marginTop: '1rem' }}>
                  {erro}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ color: '#64748b', fontSize: '1.8rem', textTransform: 'uppercase' }}>
                  {senha.catNome} — <span style={{ color: senha.tipoNome === 'Preferencial' ? '#D4A017' : 'inherit' }}>{senha.tipoNome}</span>
                </h2>
                <div className="modal-senha" style={{ color: senha.tipoNome === 'Preferencial' ? '#D4A017' : 'var(--primary)' }}>{senha.id}</div>
                <p style={{ fontSize: '1.5rem', color: '#64748b' }}>
                  Por favor, aguarde ser chamado no painel.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Componente Invisível que só aparece na Impressora Térmica */}
      <TicketPrint senha={senha} />
    </div>
  );
}

export default Totem;
