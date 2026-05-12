import React, { useState } from 'react';
import AtendenteLogin from './Atendente/AtendenteLogin';
import AtendentePainel from './Atendente/AtendentePainel';

/**
 * Componente principal do Atendente.
 * Gerencia a troca entre a tela de Login (Seleção de Setor/Guichê) 
 * e o Painel de Atendimento propriamente dito.
 */
function Atendente() {
  const [sessao, setSessao] = useState(null); // { categoria, guiche }

  if (!sessao) {
    return (
      <AtendenteLogin 
        onEntrar={(cat, g) => setSessao({ categoria: cat, guiche: g })} 
      />
    );
  }

  return (
    <AtendentePainel 
      categoria={sessao.categoria} 
      guiche={sessao.guiche} 
      onSair={() => setSessao(null)} 
    />
  );
}

export default Atendente;
