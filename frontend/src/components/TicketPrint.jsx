import React from 'react';

const TicketPrint = ({ senha }) => {
  if (!senha) return null;

  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
  const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="ticket-print-container">
      <div className="ticket-header">
        {/* Usamos a logo com tamanho e posição definidos profissionalmente */}
        <img src="/logo/logo.png" alt="Logomarca AGR" className="ticket-logo" />
        <h2 className="ticket-agency-name">AGÊNCIA GOIANA DE REGULAÇÃO</h2>
        <p className="ticket-agency-sub">CONTROLE E FISCALIZAÇÃO</p>
      </div>
      
      <div className="ticket-divider"></div>
      
      <div className="ticket-body">
        <p className="ticket-greeting">SENHA DE ATENDIMENTO</p>
        <h3 className="ticket-cat">{senha.catNome}</h3>
        
        {/* A caixa principal da senha */}
        <div className="ticket-number-box">
          <h1 className="ticket-number">{senha.id}</h1>
        </div>
        
        <p className="ticket-tipo" style={{ 
          background: senha.tipoNome === 'Preferencial' ? '#000' : 'transparent',
          color: senha.tipoNome === 'Preferencial' ? '#fff' : '#000',
          padding: senha.tipoNome === 'Preferencial' ? '4px 0' : '0',
          display: 'inline-block',
          width: '100%'
        }}>
          ATENDIMENTO {senha.tipoNome.toUpperCase()}
        </p>
      </div>
      
      <div className="ticket-divider"></div>
      
      <div className="ticket-footer">
        <div className="ticket-datetime">
          <span>Data: {dataFormatada}</span>
          <span>Hora: {horaFormatada}</span>
        </div>
        <p className="ticket-wait">AGUARDE SER CHAMADO NO PAINEL</p>
      </div>
    </div>
  );
};

export default TicketPrint;
