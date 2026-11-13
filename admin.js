// =============================================================================
// COSTA IN BEACH BAR & CLUB — PAINEL DE GERÊNCIA & ADMIN (admin.js)
// -----------------------------------------------------------------------------
// Este arquivo controla a inteligência operacional do restaurante:
// 1. Monitor em tempo real de chamadas de garçom para as 35 mesas
// 2. Alarme sonoro sintetizado (sino de restaurante via Web Audio API)
// 3. Gestão completa de reservas com filtros e atualização de status
// 4. Integração com WhatsApp para disparo de Boas-Vindas e Lembretes de 1h antes
// 5. Sincronização multi-janela e multi-dispositivo em tempo real
// =============================================================================

/**
 * CANAL DE SINCRONIZAÇÃO EM TEMPO REAL (BroadcastChannel API)
 * Ouve os eventos disparados pelas mesas dos clientes (app.js)
 */
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('costa_in_sync') : null;

// Estado do som de alerta no painel administrativo
let somAtivado = true;

// =============================================================================
// 1. SINTETIZADOR DE SOM DE ALARME (Web Audio API)
// -----------------------------------------------------------------------------
// Emite um toque harmónico de dois tons (estilo sino de serviço de restaurante)
// sem necessidade de carregar ficheiros externos de áudio .mp3.
// =============================================================================
function tocarAlertaSonoro() {
  if (!somAtivado) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primeiro tom: E5 (659.25 Hz) com decaimento suave
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Segundo tom: A5 (880.00 Hz) para efeito duplo clássico
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.6);
    }, 150);

  } catch (err) {
    console.warn("Áudio suspenso aguardando interação do utilizador no navegador:", err);
  }
}

/**
 * Alterna entre ligar ou desligar o alarme sonoro
 */
function toggleAudioAlert() {
  somAtivado = !somAtivado;
  const icon = document.getElementById("soundIcon");
  const text = document.getElementById("soundText");
  if (somAtivado) {
    icon.textContent = "🔔";
    text.textContent = "Som: Ligado";
    tocarAlertaSonoro(); // Toca uma prévia para confirmar que está ativo
  } else {
    icon.textContent = "🔕";
    text.textContent = "Som: Silenciado";
  }
}

// =============================================================================
// 2. GESTÃO DE CHAMADAS DE MESA (1 A 35)
// -----------------------------------------------------------------------------
// Monitora quais mesas solicitaram garçom ou a conta, exibe o banner pulsante
// e permite ao gerente marcar a chamada como atendida.
// =============================================================================

/**
 * Lê as chamadas guardadas no localStorage
 */
function obterChamadas() {
  return JSON.parse(localStorage.getItem('costa_in_chamadas') || '[]');
}

/**
 * Atualiza o localStorage com o estado atualizado das chamadas
 */
function salvarChamadas(chamadas) {
  localStorage.setItem('costa_in_chamadas', JSON.stringify(chamadas));
}

/**
 * Renderiza o feed visual de chamadas ativas na tela do Admin
 */
function renderizarChamadas() {
  const callsFeed = document.getElementById("callsFeedContainer");
  const countDisplay = document.getElementById("countActiveCalls");
  if (!callsFeed) return;

  const todas = obterChamadas();
  const ativas = todas.filter(c => c.status === 'ativa');

  // Atualiza o contador de chamadas pendentes
  if (countDisplay) {
    countDisplay.textContent = ativas.length;
  }

  // Estado vazio: quando todas as mesas estão atendidas
  if (ativas.length === 0) {
    callsFeed.innerHTML = `
      <div class="no-calls-box">
        <span class="no-calls-icon">✅</span>
        <h3>Sem chamadas pendentes no momento</h3>
        <p>Quando uma das 35 mesas carregar no botão redondo de chamada, o alerta com som surgirá aqui imediatamente!</p>
      </div>
    `;
    return;
  }

  // Limpa o feed e renderiza os banners de cada mesa chamando
  callsFeed.innerHTML = "";

  ativas.forEach(chamada => {
    const banner = document.createElement("div");
    banner.className = "call-alert-banner";
    banner.innerHTML = `
      <div class="call-table-info">
        <div class="call-table-number">MESA ${chamada.mesa}</div>
        <div class="call-details">
          <h4>🚨 A MESA ${chamada.mesa} está a chamar!</h4>
          <p>Motivo: <strong>${chamada.motivo || 'Atendimento Geral'}</strong></p>
          <span class="call-time-badge">🕒 Chamada registada às ${chamada.hora}</span>
        </div>
      </div>
      <div class="call-actions">
        <button class="btn-attend-call" onclick="marcarMesaAtendida('${chamada.id}')">
          ✅ Atender Mesa ${chamada.mesa}
        </button>
      </div>
    `;
    callsFeed.appendChild(banner);
  });
}

/**
 * Marca uma mesa específica como atendida e silencia o seu alerta
 */
function marcarMesaAtendida(chamadaId) {
  const chamadas = obterChamadas();
  const index = chamadas.findIndex(c => c.id === chamadaId);
  if (index !== -1) {
    chamadas[index].status = 'atendida';
    chamadas[index].atendidaEm = new Date().toLocaleTimeString('pt-PT');
    salvarChamadas(chamadas);
    renderizarChamadas();
  }
}

/**
 * Limpa todas as chamadas ativas de uma vez só
 */
function limparTodasChamadas() {
  const chamadas = obterChamadas();
  chamadas.forEach(c => c.status = 'atendida');
  salvarChamadas(chamadas);
  renderizarChamadas();
}

/**
 * Função de demonstração/teste para simular uma chamada de mesa instantânea
 */
function simularChamadaMesa(numeroMesa = 15) {
  const horaAtual = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const novaChamada = {
    id: 'call_' + Date.now(),
    mesa: numeroMesa,
    motivo: "Pedido da Conta & Sobremesa",
    hora: horaAtual,
    timestamp: Date.now(),
    status: 'ativa'
  };

  const chamadas = obterChamadas();
  chamadas.unshift(novaChamada);
  salvarChamadas(chamadas);

  tocarAlertaSonoro();
  renderizarChamadas();
}

// =============================================================================
// 3. GESTÃO DE RESERVAS DOS CLIENTES & DISPARO DE MENSAGENS NO WHATSAPP
// -----------------------------------------------------------------------------
// Exibe a tabela de agendamentos, contagem de clientes e botões inteligentes
// para disparar mensagens formatadas diretamente para o telemóvel do cliente.
// =============================================================================

/**
 * Recupera as reservas existentes ou carrega dados iniciais de demonstração
 */
function obterReservas() {
  const dadosIniciais = [
    {
      id: 'res_demo_1',
      nome: 'Francisca Silva',
      whatsapp: '+351912345678',
      email: 'francisca@email.com',
      data: '15/11/2026',
      dataIso: '2026-11-15',
      hora: '13:00',
      pessoas: '4',
      zona: 'Esplanada Vista Mar',
      obs: 'Mesa de frente para o mar comemorando aniversário',
      status: 'Pendente',
      criadaEm: new Date().toISOString()
    },
    {
      id: 'res_demo_2',
      nome: 'Gonçalo Ribeiro',
      whatsapp: '+351963214587',
      email: 'goncalo@email.com',
      data: '15/11/2026',
      dataIso: '2026-11-15',
      hora: '17:30',
      pessoas: '2',
      zona: 'Pé na Areia',
      obs: 'Mesa para ver o pôr do sol',
      status: 'Confirmada',
      criadaEm: new Date().toISOString()
    }
  ];

  const armazenadas = localStorage.getItem('costa_in_reservas');
  if (!armazenadas) {
    localStorage.setItem('costa_in_reservas', JSON.stringify(dadosIniciais));
    return dadosIniciais;
  }
  return JSON.parse(armazenadas);
}

function salvarReservas(reservas) {
  localStorage.setItem('costa_in_reservas', JSON.stringify(reservas));
}

let filtroPesquisa = "";

/**
 * Renderiza as reservas na tabela com filtros e métricas atualizadas
 */
function renderizarReservas() {
  const tbody = document.getElementById("reservasTableBody");
  const countToday = document.getElementById("countTodayReservations");
  const countPeople = document.getElementById("countTotalPeople");
  if (!tbody) return;

  const reservas = obterReservas();

  // Filtragem por texto
  const filtradas = reservas.filter(r => {
    if (!filtroPesquisa) return true;
    const termo = filtroPesquisa.toLowerCase();
    return r.nome.toLowerCase().includes(termo) ||
           r.whatsapp.includes(termo) ||
           r.data.includes(termo) ||
           r.hora.includes(termo);
  });

  // Atualiza métricas no topo do painel
  if (countToday) countToday.textContent = reservas.length;
  if (countPeople) {
    const totalPessoas = reservas.reduce((acc, r) => acc + parseInt(r.pessoas || 2, 10), 0);
    countPeople.textContent = totalPessoas;
  }

  tbody.innerHTML = "";

  if (filtradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Nenhuma reserva encontrada com o filtro atual.
        </td>
      </tr>
    `;
    return;
  }

  // Gera as linhas da tabela
  filtradas.forEach(res => {
    const tr = document.createElement("tr");

    let statusClass = "status-pendente";
    if (res.status === 'Confirmada') statusClass = "status-confirmada";
    if (res.status === 'Cancelada') statusClass = "status-cancelada";

    const telNumeros = (res.whatsapp || "").replace(/\D/g, "");

    tr.innerHTML = `
      <td>
        <strong>${res.data}</strong><br>
        <span style="color: var(--color-coral); font-weight: 700;">${res.hora}</span>
      </td>
      <td>
        <strong>${res.nome}</strong><br>
        <small style="color: var(--text-muted);">${res.email || 'Sem email'}</small>
        ${res.obs ? `<br><small style="color: var(--text-secondary); font-style: italic;">"${res.obs}"</small>` : ''}
      </td>
      <td>
        <a href="https://wa.me/${telNumeros}" target="_blank" style="color: #16a34a; font-weight: 700;">
          📱 ${res.whatsapp}
        </a>
      </td>
      <td><strong>${res.pessoas}</strong> pessoas</td>
      <td><span style="font-size:0.85rem; color: var(--color-ocean-deep); font-weight: 600;">${res.zona || 'Geral'}</span></td>
      <td>
        <span class="status-badge ${statusClass}">${res.status}</span>
      </td>
      <td>
        <div class="action-buttons-cell">
          <button class="btn-wa-welcome" title="Enviar confirmação de boas-vindas" onclick="enviarMensagemBoasVindas('${res.id}')">
            📲 Boas-Vindas
          </button>
          <button class="btn-wa-ai" title="Disparar confirmação de 1h antes (IA)" onclick="enviarLembrete1HoraAntes('${res.id}')">
            🤖 Lembrete 1h Antes
          </button>
          <button class="btn-table-cancel" title="Alterar status" onclick="alternarStatusReserva('${res.id}')">
            ${res.status === 'Confirmada' ? 'Desfazer' : 'Confirmar'}
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * 1. MENSAGEM DE BOAS-VINDAS IMEDIATA NO WHATSAPP
 * Requisitada: "Ola Francisca Agendamento marcado. Obrigado pelo agendamento, te aguardamos! Mais tarde confirmo o agendamento com voce !"
 */
function enviarMensagemBoasVindas(reservaId) {
  const reservas = obterReservas();
  const res = reservas.find(r => r.id === reservaId);
  if (!res) return;

  const telefone = res.whatsapp.replace(/\D/g, "");
  const texto = encodeURIComponent(
    `Olá ${res.nome}! Agendamento marcado.\n` +
    `Data: ${res.data} às ${res.hora} para ${res.pessoas} pessoas no Costa In Beach Bar.\n\n` +
    `Obrigado pelo agendamento, te aguardamos! Mais tarde confirmo o agendamento com você!`
  );

  window.open(`https://wa.me/${telefone}?text=${texto}`, "_blank");
}

/**
 * 2. MENSAGEM DO AGENTE / IA DE 1 HORA ANTES NO WHATSAPP
 * Dispara lembrete amigável solicitando confirmação de presença do cliente
 */
function enviarLembrete1HoraAntes(reservaId) {
  const reservas = obterReservas();
  const res = reservas.find(r => r.id === reservaId);
  if (!res) return;

  const telefone = res.whatsapp.replace(/\D/g, "");
  const texto = encodeURIComponent(
    `Olá ${res.nome}! Aqui é do Costa In Beach Bar 🌊☀️\n\n` +
    `A sua reserva é daqui a 1 hora (às ${res.hora}) para ${res.pessoas} pessoas (${res.zona || 'Esplanada'}).\n\n` +
    `A sua mesa já está a ser preparada! Gostaríamos de confirmar se já está a caminho.\n` +
    `Por favor responda a esta mensagem com "SIM" para confirmar a sua chegada. Te aguardamos!`
  );

  window.open(`https://wa.me/${telefone}?text=${texto}`, "_blank");
}

/**
 * Alterna o status da reserva entre Pendente e Confirmada
 */
function alternarStatusReserva(reservaId) {
  const reservas = obterReservas();
  const res = reservas.find(r => r.id === reservaId);
  if (!res) return;

  if (res.status === 'Confirmada') {
    res.status = 'Pendente';
  } else {
    res.status = 'Confirmada';
  }

  salvarReservas(reservas);
  renderizarReservas();
}

// =============================================================================
// 4. REGISTO DE NOVA RESERVA MANUAL
// -----------------------------------------------------------------------------
// Permite ao gerente registar uma reserva recebida por chamada telefónica ou presencialmente.
// =============================================================================
const modalNovaReserva = document.getElementById("modalNovaReservaManual");
const formManualReserva = document.getElementById("formManualReserva");
const manDataInput = document.getElementById("manData");

if (manDataInput) {
  manDataInput.value = new Date().toISOString().split("T")[0];
}

function abrirModalNovaReserva() {
  if (modalNovaReserva) modalNovaReserva.style.display = "flex";
}

function fecharModalNovaReserva() {
  if (modalNovaReserva) modalNovaReserva.style.display = "none";
}

if (formManualReserva) {
  formManualReserva.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("manNome").value.trim();
    const whatsapp = document.getElementById("manWhatsapp").value.trim();
    const email = document.getElementById("manEmail").value.trim();
    const data = document.getElementById("manData").value;
    const hora = document.getElementById("manHora").value;
    const pessoas = document.getElementById("manPessoas").value;
    const zona = document.getElementById("manZona").value;
    const obs = document.getElementById("manObs").value.trim();

    const partes = data.split("-");
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;

    const nova = {
      id: 'res_' + Date.now(),
      nome,
      whatsapp,
      email,
      data: dataFormatada,
      dataIso: data,
      hora,
      pessoas,
      zona,
      obs,
      status: 'Confirmada',
      criadaEm: new Date().toISOString()
    };

    const reservas = obterReservas();
    reservas.unshift(nova);
    salvarReservas(reservas);

    fecharModalNovaReserva();
    formManualReserva.reset();
    renderizarReservas();
  });
}

// Filtro de pesquisa rápida na tabela de reservas
const filterReservaInput = document.getElementById("filterReservaInput");
if (filterReservaInput) {
  filterReservaInput.addEventListener("input", (e) => {
    filtroPesquisa = e.target.value.trim();
    renderizarReservas();
  });
}

// =============================================================================
// 5. OUVINTES DE SINCRONIZAÇÃO EM TEMPO REAL
// -----------------------------------------------------------------------------
// Garante que o painel receba o sinal sonoro e atualize na hora em que o cliente agir
// =============================================================================
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { type } = event.data || {};
    if (type === 'CHAMADA_MESA') {
      tocarAlertaSonoro();
      renderizarChamadas();
    } else if (type === 'NOVA_RESERVA') {
      tocarAlertaSonoro();
      renderizarReservas();
    }
  };
}

// Sincronização via evento 'storage' para máxima compatibilidade entre abas
window.addEventListener('storage', (e) => {
  if (e.key === 'costa_in_chamadas' || e.key === 'costa_in_sync_ping') {
    tocarAlertaSonoro();
    renderizarChamadas();
  }
  if (e.key === 'costa_in_reservas') {
    renderizarReservas();
  }
});

// Fechar modais ao clicar no fundo escuro
window.addEventListener('click', (e) => {
  if (e.target === modalNovaReserva) fecharModalNovaReserva();
});

// Inicialização automática ao carregar o painel
document.addEventListener("DOMContentLoaded", () => {
  renderizarChamadas();
  renderizarReservas();
});
