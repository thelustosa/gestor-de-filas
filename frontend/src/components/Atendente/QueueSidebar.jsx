import React from 'react';
import { Users, History } from 'lucide-react';
import { formatarHora } from '../../utils/formatters';

function QueueSidebar({ fila, historico, setor, onRechamarHistorico, onEditarObsHistorico }) {
  return (
    <aside className="atend-col-fila" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

      {/* SEÇÃO FILA ATUAL */}
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
                      {s.preferencial && <span className="badge-preferencial">P</span>}
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
                <div key={s.id} className="atend-fila-item historico-item">
                  <div className="atend-fila-info" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <strong style={{ color: '#1e293b', fontSize: '1rem' }}>
                        {s.id}
                        {s.preferencial && <span className="badge-preferencial-small">P</span>}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatarHora(s.horario_finalizacao)}</span>
                    </div>
                    {s.observacao && <small className="atend-fila-obs historico-obs">Obs: {s.observacao}</small>}
                  </div>
                  <div className="atend-historico-acoes">
                    <button className="btn-historico" onClick={() => onRechamarHistorico(s.id)}>Rechamar</button>
                    <button className="btn-historico" onClick={() => onEditarObsHistorico(s.id, s.observacao)}>Obs</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default QueueSidebar;
