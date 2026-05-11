import React, { useState } from 'react';
import { RefreshCcw, Download, AlertTriangle, CheckCircle, Clock, ShieldCheck, LogOut, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8001'
  : `http://${window.location.hostname}:8001`;

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

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
