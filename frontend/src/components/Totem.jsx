import React, { useState } from 'react';
import { Ear, Landmark, CarFront, FileText } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:8001' 
  : `http://${window.location.hostname}:8001`;

function Totem() {
  const [senha, setSenha] = useState(null);
  const [erro, setErro] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [loading, setLoading] = useState(false);

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
      setCategoriaSelecionada(null); // Reseta a tela

      // Auto close modal
      setTimeout(() => {
        setSenha(null);
      }, 5000);

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
          <button className="btn-totem btn-ouvidoria" onClick={() => setCategoriaSelecionada({ cat: 'O', nome: 'Ouvidoria' })}>
            <Ear size={80} color="#3b82f6" />
          Ouvidoria
        </button>
        <button className="btn-totem btn-financas" onClick={() => setCategoriaSelecionada({ cat: 'F', nome: 'Finanças' })}>
          <Landmark size={80} color="#10b981" />
          Finanças
        </button>
        <button className="btn-totem btn-cadastro" onClick={() => setCategoriaSelecionada({ cat: 'C', nome: 'Cadastro de Veículos' })}>
          <CarFront size={80} color="#f59e0b" />
          Cadastro de Veículos<br />e Empresas
        </button>
        <button className="btn-totem btn-protocolo" onClick={() => setCategoriaSelecionada({ cat: 'P', nome: 'Protocolar Documentos' })}>
          <FileText size={80} color="#8b5cf6" />
          Protocolar<br />Documentos
        </button>
      </div>
      )}

      {categoriaSelecionada && !senha && !erro && (
        <div className="totem-tipo-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '800px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>{categoriaSelecionada.nome}</h2>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button 
              className="btn-totem" 
              style={{ flex: 1, borderColor: '#D4A017', background: 'rgba(212, 160, 23, 0.1)' }} 
              onClick={() => retirarSenha('P')}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Preferencial'}
            </button>
            <button 
              className="btn-totem" 
              style={{ flex: 1, borderColor: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)' }} 
              onClick={() => retirarSenha('N')}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Normal'}
            </button>
          </div>
          <button 
            style={{ padding: '1rem', background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', borderRadius: '1rem', fontSize: '1.2rem', cursor: 'pointer', marginTop: '1rem' }} 
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
    </div>
  );
}

export default Totem;
