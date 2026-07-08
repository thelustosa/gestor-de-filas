import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';

const SLIDE_DURATION = 20000;

function TVDisplay() {
  const [news, setNews] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [senhaStatus, setSenhaStatus] = useState({ senha_atual: null, historico: [] });
  const [ultimaSenhaChamada, setUltimaSenhaChamada] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState('');
  
  const progressBarRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Notícias (Polling reduzido a cada 60s, pois backend faz cache)
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/noticias`);
        if (!res.ok) throw new Error('Falha na API');
        const data = await res.json();
        
        setNews(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar notícias", err);
        setLoading(false);
      }
    };
    
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSenhas = async () => {
    try {
      const res = await fetch(`${API_URL}/senha/status`);
      const data = await res.json();
      setSenhaStatus(data);
    } catch (err) {
      console.error("Erro ao buscar status inicial das senhas", err);
    }
  };

  // WebSocket para Senhas e Efeitos Sonoros
  useEffect(() => {
    let isMounted = true;
    fetchSenhas(); // Busca inicial
    let ws = null;
    let reconnectTimeout = null;
    let reconnectDelay = 3000; // Backoff exponencial

    const connectWS = () => {
      const wsUrl = API_URL.replace('http', 'ws') + '/ws/senhas';
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        reconnectDelay = 3000; // Reset ao conectar
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.tipo === 'NOVA_SENHA' || msg.tipo === 'FILA_ATUALIZADA') {
          if (isMounted) fetchSenhas(); // Sincroniza a tela
        }

        if (msg.tipo === 'NOVA_SENHA' && msg.data) {
          // 1. Tocar o som
          const audio = new Audio('/audio/chamada.mp3');
          audio.play().catch(e => console.log('Erro ao tocar áudio (interação do usuário pode ser necessária):', e));

          // 2. Voz Sintética (Speech Synthesis)
          setTimeout(() => {
            if ('speechSynthesis' in window) {
              const senhaId = msg.data.id;
              const guiche = msg.data.guiche;
              
              // Ex: FP001 -> "F, Preferencial, zero, zero, um"
              const letraCat = senhaId.charAt(0);
              const isPref = msg.data.preferencial;
              const tipoStr = isPref ? "Preferencial" : "Normal";
              const numeros = senhaId.substring(2).split('').join(' ');
              
              const texto = `Senha, ${letraCat}, ${tipoStr}, ${numeros}, guichê, ${guiche}`;
              
              const utterance = new SpeechSynthesisUtterance(texto);
              utterance.lang = 'pt-BR';
              utterance.rate = 0.9;
              window.speechSynthesis.speak(utterance);
            }
          }, 1500);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        // Backoff exponencial: 3s → 6s → 12s → max 30s
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
  }, []);

  // Lógica do Carrossel
  useEffect(() => {
    if (news.length === 0) return;

    // Reinicia barra de progresso
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'none';
      progressBarRef.current.style.width = '0%';
      
      setTimeout(() => {
        if (progressBarRef.current) {
          progressBarRef.current.style.transition = `width ${SLIDE_DURATION}ms linear`;
          progressBarRef.current.style.width = '100%';
        }
      }, 50);
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % news.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [currentSlide, news]);

  if (loading) {
    return (
      <div id="loader">
        <div className="spinner"></div>
        <p style={{ color: 'white' }}>Iniciando Goiás News TV...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="loader">
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  const currentNewsItem = news.length > 0 ? news[currentSlide] : null;

  return (
    <div className="app-layout">
      {/* SECTION TOP */}
      <div className="top-section">
        {/* Main News */}
        <main className="main-content">
          <img src="/logo/goias.png" alt="Governo de Goiás" className="tv-logo-top-left" />
          
          {currentNewsItem && (
            <>
              <div 
                className="slide-bg" 
                style={{ backgroundImage: `url('${currentNewsItem.imagem}')` }}
              ></div>
              
              <div className="slide-content">
                <h2>{currentNewsItem.titulo}</h2>
              </div>
            </>
          )}

          <div className="progress-container">
            <div ref={progressBarRef} className="progress-bar"></div>
          </div>
        </main>

        {/* Sidebar Historico */}
        <aside className="sidebar">
          <div className="sidebar-header">ÚLTIMAS CHAMADAS</div>
          <div className="sidebar-list">
            {senhaStatus.historico.map((item, idx) => (
                <div key={idx} className="sidebar-item">
                  <span>Guichê {item.guiche}</span>
                  <strong>{item.senha}</strong>
                </div>
            ))}
            {senhaStatus.historico.length === 0 && (
              <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>
                Nenhuma senha no histórico
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* FOOTER SENHA */}
      <footer className="footer-senha">
        <div className="senha-label">SENHA<br />ATUAL</div>
        <div className="senha-display">
          <span className="senha-numero">
            {senhaStatus.senha_atual ? senhaStatus.senha_atual.senha : '---'}
          </span>
          <span className="senha-guiche">
            {senhaStatus.senha_atual ? `Guichê ${senhaStatus.senha_atual.guiche}` : 'Aguardando'}
          </span>
        </div>
        <div className="current-time">{time}</div>
      </footer>
    </div>
  );
}

export default TVDisplay;
