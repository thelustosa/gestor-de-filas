import React, { useState, useEffect } from 'react';
import { RefreshCcw, Download, AlertTriangle, CheckCircle, Clock, ShieldCheck, LogOut, FileSpreadsheet, Monitor, UserCheck, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async (isMounted = true) => {
    try {
      const res = await fetch(`${API_URL}/admin/stats?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (isMounted) setStats(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    let isMounted = true;
    fetchStats(isMounted);
    const timer = setInterval(() => fetchStats(isMounted), 5000);
    
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const exibirMsg = (texto, tipo = 'ok') => {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ ATENÇÃO: Tem certeza que deseja RESETAR todas as senhas e contadores?\n\nIsso apagará todas as filas e reiniciará a contagem das senhas para 001. Esta ação não pode ser desfeita.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/reset`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'ok') {
        exibirMsg('Sistema resetado com sucesso!', 'ok');
      } else {
        exibirMsg('Erro ao resetar sistema.', 'erro');
      }
    } catch (err) {
      exibirMsg('Erro de conexão com o servidor.', 'erro');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = `${API_URL}/admin/export`;
    exibirMsg('Relatório gerado com sucesso!');
  };

  return (
    <div className="atend-painel">
      {/* Header Estilo Atendente */}
      <header className="atend-header" style={{ borderBottomColor: '#1e293b' }}>
        <div className="atend-header-info">
          <ShieldCheck size={22} color="#1e293b" />
          <span className="atend-header-setor" style={{ color: '#1e293b' }}>Painel Administrativo</span>
          <span className="atend-header-guiche">— Gestão de Filas</span>
        </div>
        <button className="atend-btn-sair" onClick={() => navigate('/tv')}>
          <LogOut size={16} /> Sair
        </button>
      </header>

      {/* Toast Estilo Atendente */}
      {msg && (
        <div className={`atend-toast ${msg.tipo === 'erro' ? 'erro' : ''}`}>
          {msg.tipo === 'erro' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {msg.texto}
        </div>
      )}

      <div className="atend-body" style={{ justifyContent: 'center' }}>
        <div className="atend-col-main" style={{ maxWidth: '800px', flex: 'none', width: '100%' }}>
          
          {/* Card de Boas Vindas / Status */}
          <div className="atend-card-senha">
            <div className="atend-card-senha-label">STATUS DO SISTEMA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="admin-status-badge">
                <span className="admin-dot"></span> Online
              </div>
              <div className="atend-senha-meta">
                <span><Clock size={14} /> Último acesso: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <p style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Bem-vindo ao painel de controle. Aqui você pode gerenciar o estado global das filas e extrair relatórios de produtividade.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Bloco de Reset */}
            <div className="atend-card-obs" style={{ padding: '2rem' }}>
              <div className="atend-card-obs-header">
                <RefreshCcw size={18} /> Controle de Ciclo
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1.5rem 0' }}>
                Zere todas as senhas pendentes e reinicie os contadores diários. Recomendado realizar no início de cada turno.
              </p>
              <button 
                className="atend-btn-acao perigo" 
                style={{ width: '100%', height: '50px', background: '#fef2f2', border: '1px solid #fee2e2' }}
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? <RefreshCcw size={20} className="spin" /> : <RefreshCcw size={20} />}
                Zerar Sistema Completo
              </button>
            </div>

            {/* Bloco de Exportação */}
            <div className="atend-card-obs" style={{ padding: '2rem' }}>
              <div className="atend-card-obs-header">
                <FileSpreadsheet size={18} /> Dados e Relatórios
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1.5rem 0' }}>
                Baixe o histórico completo de atendimentos em formato CSV para abertura em Excel. Inclui horários de espera e atendimento.
              </p>
              <button 
                className="atend-btn-acao secundario" 
                style={{ width: '100%', height: '50px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}
                onClick={handleExport}
              >
                <Download size={20} />
                Exportar Planilha (CSV)
              </button>
            </div>
          </div>

          {/* Monitoramento de Guichês */}
          <div className="atend-card-obs" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <div className="atend-card-obs-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Monitor size={18} /> Monitoramento de Guichês em Tempo Real
              </div>
              <button 
                onClick={async () => {
                  if(window.confirm('Deseja limpar todos os guichês do monitoramento? (Isso removerá atendimentos "fantasm" mas não zera as senhas)')) {
                    await fetch(`${API_URL}/admin/reset-guiches`, { method: 'POST' });
                    fetchStats();
                  }
                }}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <RefreshCcw size={12} /> Limpar Monitoramento
              </button>
            </div>
            
            {!stats ? (
              <p style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Carregando estatísticas...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                {Object.entries(stats).map(([catId, cat]) => (
                  <div key={catId} style={{ border: '1px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '0.8rem 1.2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#1e293b' }}>{cat.nome}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{cat.ativos} ativos / {cat.total} total</span>
                    </div>
                    
                    <div style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                      {cat.lista.length === 0 ? (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum guichê registrado hoje.</span>
                      ) : (
                        cat.lista.map(g => (
                          <div 
                            key={g.id} 
                            style={{ 
                              padding: '0.6rem 1rem', 
                              borderRadius: '0.8rem', 
                              background: g.online ? '#f0fdf4' : '#f8fafc',
                              border: `1px solid ${g.online ? '#bbf7d0' : '#e2e8f0'}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              minWidth: '140px'
                            }}
                          >
                            {g.online ? <UserCheck size={16} color="#16a34a" /> : <UserX size={16} color="#94a3b8" />}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: g.online ? '#166534' : '#475569' }}>Guichê {g.id}</span>
                              <span style={{ fontSize: '0.7rem', color: g.ocupado ? '#d97706' : '#94a3b8' }}>
                                {g.ocupado ? `Atendendo: ${g.senha_atual}` : (g.online ? 'Livre' : 'Desconectado')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé de Informação */}
          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            AGR - Agência Goiana de Regulação | Sistema de Atendimento v2.0
          </div>

        </div>
      </div>

      <style jsx>{`
        .admin-status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f0fdf4;
          color: #16a34a;
          padding: 0.3rem 0.8rem;
          border-radius: 2rem;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid #dcfce7;
        }

        .admin-dot {
          width: 8px;
          height: 8px;
          background: #16a34a;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 5px #16a34a;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .atend-toast {
           display: flex;
           align-items: center;
           gap: 0.7rem;
        }
      `}</style>
    </div>
  );
};

export default Admin;
