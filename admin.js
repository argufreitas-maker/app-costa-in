// =============================================================================
// COSTA IN BEACH BAR & CLUB — PAINEL DE GERÊNCIA & ADMIN (admin.js)
// -----------------------------------------------------------------------------
// Controla a inteligência operacional do restaurante de forma simples e intuitiva:
// 1. Navegação por abas: Monitor das 35 Mesas vs. Agenda de Reservas
// 2. Mapa visual interativo das 35 mesas (Floor Plan em tempo real)
// 3. Alarme sonoro sintetizado de restaurante (Web Audio API)
// 4. Gestão de reservas com disparo no WhatsApp (Boas-Vindas e Lembrete 1h antes)
// =============================================================================

const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('costa_in_sync') : null;
const TOTAL_MESAS = 35;
let somAtivado = true;
let abaAtiva = 'mesas'; // 'mesas' ou 'reservas'

// =============================================================================
// 1. CONTROLO DE ABAS INTUITIVAS NO ADMIN
// =============================================================================
function mudarAbaAdmin(aba) {
  abaAtiva = aba;

  // Botões
  const btnMesas = document.getElementById("tabBtnMesas");
  const btnReservas = document.getElementById("tabBtnReservas");
  const contentMesas = document.getElementById("tabContentMesas");
  const contentReservas = document.getElementById("tabContentReservas");

  if (aba === 'mesas') {
    if (btnMesas) btnMesas.classList.add("active");
    if (btnReservas) btnReservas.classList.remove("active");
    if (contentMesas) contentMesas.classList.add("active");
    if (contentReservas) contentReservas.classList.remove("active");
  } else {
    if (btnReservas) btnReservas.classList.add("active");
    if (btnMesas) btnMesas.classList.remove("active");
    if (contentReservas) contentReservas.classList.add("active");
    if (contentMesas) contentMesas.classList.remove("active");
  }
}

// =============================================================================
// 2. SINTETIZADOR DE SOM DE ALARME (Web Audio API)
// =============================================================================
function tocarAlertaSonoro() {
  if (!somAtivado) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primeiro tom: E5 (659.25 Hz)
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

    // Segundo tom: A5 (880.00 Hz)
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
    console.warn("Áudio aguardando interação no navegador:", err);
  }
}

function toggleAudioAlert() {
  somAtivado = !somAtivado;
  const icon = document.getElementById("soundIcon");
  const text = document.getElementById("soundText");
  if (somAtivado) {
    icon.textContent = "🔔";
    text.textContent = "Som: Ligado";
    tocarAlertaSonoro();
  } else {
    icon.textContent = "🔕";
    text.textContent = "Som: Silenciado";
  }
}

// =============================================================================
// 3. GESTÃO DE CHAMADAS & MAPA VISUAL DAS 35 MESAS (FLOOR PLAN)
// =============================================================================
function obterChamadas() {
  return JSON.parse(localStorage.getItem('costa_in_chamadas') || '[]');
}

function salvarChamadas(chamadas) {
  localStorage.setItem('costa_in_chamadas', JSON.stringify(chamadas));
}

/**
 * Renderiza o mapa visual das 35 mesas e a lista de chamadas ativas
 */
function renderizarChamadas() {
  const callsFeed = document.getElementById("callsFeedContainer");
  const floorplanGrid = document.getElementById("floorplanGrid");
  const countDisplay = document.getElementById("countActiveCalls");
  const badgeTabMesas = document.getElementById("badgeTabMesas");

  const todas = obterChamadas();
  const ativas = todas.filter(c => c.status === 'ativa');

  // Atualiza contadores
  if (countDisplay) countDisplay.textContent = ativas.length;
  if (badgeTabMesas) badgeTabMesas.textContent = ativas.length;

  // Mapa de quais mesas estão ativas no momento
  const mapaMesasChamando = {};
  ativas.forEach(c => {
    mapaMesasChamando[c.mesa] = c;
  });

  // 1. Renderiza a Grelha Visual das 35 Mesas (Floor Plan)
  if (floorplanGrid) {
    floorplanGrid.innerHTML = "";
    for (let i = 1; i <= TOTAL_MESAS; i++) {
      const mesaCard = document.createElement("div");
      const estaChamando = mapaMesasChamando[i];

      mesaCard.className = `floorplan-table ${estaChamando ? 'calling' : ''}`;
      mesaCard.innerHTML = `
        <span class="table-id-label">Mesa ${i}</span>
        <span class="table-status-label">${estaChamando ? '🚨 A Chamar' : 'Tranquilo'}</span>
      `;

      if (estaChamando) {
        mesaCard.title = `Clique para marcar a Mesa ${i} como atendida!`;
        mesaCard.addEventListener("click", () => {
          marcarMesaAtendida(estaChamando.id);
        });
      }

      floorplanGrid.appendChild(mesaCard);
    }
  }

  // 2. Renderiza os Banners de Chamadas Urgentes
  if (callsFeed) {
    if (ativas.length === 0) {
      callsFeed.innerHTML = `
        <div class="no-calls-box">
          <span class="no-calls-icon">✅</span>
          <h3>Sem chamadas pendentes no momento</h3>
          <p>Quando uma mesa carregar no botão redondo de chamada, o alarme tocará e a mesa piscará no mapa visual!</p>
        </div>
      `;
      return;
    }

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
            <span class="call-time-badge">🕒 Registada às ${chamada.hora}</span>
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
}

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

function limparTodasChamadas() {
  const chamadas = obterChamadas();
  chamadas.forEach(c => c.status = 'atendida');
  salvarChamadas(chamadas);
  renderizarChamadas();
}

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
// 4. GESTÃO DE RESERVAS DOS CLIENTES & DISPARO DE MENSAGENS NO WHATSAPP
// =============================================================================
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

function renderizarReservas() {
  const tbody = document.getElementById("reservasTableBody");
  const countToday = document.getElementById("countTodayReservations");
  const countPeople = document.getElementById("countTotalPeople");
  const badgeTabReservas = document.getElementById("badgeTabReservas");
  if (!tbody) return;

  const reservas = obterReservas();

  const filtradas = reservas.filter(r => {
    if (!filtroPesquisa) return true;
    const termo = filtroPesquisa.toLowerCase();
    return r.nome.toLowerCase().includes(termo) ||
           r.whatsapp.includes(termo) ||
           r.data.includes(termo) ||
           r.hora.includes(termo);
  });

  if (countToday) countToday.textContent = reservas.length;
  if (badgeTabReservas) badgeTabReservas.textContent = reservas.length;
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
// 5. REGISTO DE NOVA RESERVA MANUAL
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

const filterReservaInput = document.getElementById("filterReservaInput");
if (filterReservaInput) {
  filterReservaInput.addEventListener("input", (e) => {
    filtroPesquisa = e.target.value.trim();
    renderizarReservas();
  });
}

// =============================================================================
// 6. SINCRONIZAÇÃO EM TEMPO REAL
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

window.addEventListener('storage', (e) => {
  if (e.key === 'costa_in_chamadas' || e.key === 'costa_in_sync_ping') {
    tocarAlertaSonoro();
    renderizarChamadas();
  }
  if (e.key === 'costa_in_reservas') {
    renderizarReservas();
  }
});

window.addEventListener('click', (e) => {
  if (e.target === modalNovaReserva) fecharModalNovaReserva();
});

document.addEventListener("DOMContentLoaded", () => {
  renderizarChamadas();
  renderizarReservas();
});
