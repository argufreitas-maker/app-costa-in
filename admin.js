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

  const btnMesas = document.getElementById("tabBtnMesas");
  const btnReservas = document.getElementById("tabBtnReservas");
  const btnPedidos = document.getElementById("tabBtnPedidos");
  const contentMesas = document.getElementById("tabContentMesas");
  const contentReservas = document.getElementById("tabContentReservas");
  const contentPedidos = document.getElementById("tabContentPedidos");

  [btnMesas, btnReservas, btnPedidos].forEach(b => { if (b) b.classList.remove("active"); });
  [contentMesas, contentReservas, contentPedidos].forEach(c => { if (c) c.classList.remove("active"); });

  if (aba === 'mesas') {
    if (btnMesas) btnMesas.classList.add("active");
    if (contentMesas) contentMesas.classList.add("active");
  } else if (aba === 'pedidos') {
    if (btnPedidos) btnPedidos.classList.add("active");
    if (contentPedidos) contentPedidos.classList.add("active");
    renderizarPedidos();
  } else {
    if (btnReservas) btnReservas.classList.add("active");
    if (contentReservas) contentReservas.classList.add("active");
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
// 6. SINCRONIZAÇÃO EM TEMPO REAL MULTI-DISPOSITIVOS (Cross-Device Cloud Sync)
// =============================================================================

function exibirToastAlerta(chamada) {
  let toastContainer = document.getElementById("adminToastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "adminToastContainer";
    toastContainer.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 12px; max-width: 380px; width: calc(100% - 40px);";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.style.cssText = "background: #ef4444; color: #ffffff; padding: 16px 20px; border-radius: 16px; box-shadow: 0 12px 30px rgba(239, 68, 68, 0.45); border: 2px solid #ffffff; display: flex; align-items: center; justify-content: space-between; gap: 14px; animation: slideInDown 0.4s ease;";
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.8rem;">🛎️</span>
      <div>
        <strong style="font-size: 1.1rem; display: block;">MESA ${chamada.mesa} A CHAMAR!</strong>
        <span style="font-size: 0.85rem; opacity: 0.95;">Motivo: ${chamada.motivo || 'Atendimento'} (${chamada.hora})</span>
      </div>
    </div>
    <button style="background: #ffffff; color: #ef4444; border: none; padding: 8px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; font-size: 0.85rem; white-space: nowrap;">Atender</button>
  `;

  toast.querySelector("button").onclick = () => {
    marcarMesaAtendida(chamada.id);
    toast.remove();
  };

  toastContainer.appendChild(toast);

  // Remove automaticamente após 12 segundos
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }
  }, 12000);
}

// 1. Canal local BroadcastChannel (mesmo navegador, abas diferentes)
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { type, payload } = event.data || {};
    if (type === 'CHAMADA_MESA') {
      tocarAlertaSonoro();
      renderizarChamadas();
      if (payload) exibirToastAlerta(payload);
    } else if (type === 'NOVO_PEDIDO_MESA') {
      tocarAlertaSonoro();
      renderizarPedidos();
      if (payload) exibirToastPedido(payload);
    } else if (type === 'NOVA_RESERVA') {
      tocarAlertaSonoro();
      renderizarReservas();
    }
  };
}

// 2. Storage Event (mesmo navegador, páginas locais)
window.addEventListener('storage', (e) => {
  if (e.key === 'costa_in_chamadas' || e.key === 'costa_in_sync_ping') {
    tocarAlertaSonoro();
    renderizarChamadas();
  }
  if (e.key === 'costa_in_pedidos') {
    renderizarPedidos();
  }
  if (e.key === 'costa_in_reservas') {
    renderizarReservas();
  }
});

function exibirToastPedido(pedido) {
  let toastContainer = document.getElementById("adminToastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "adminToastContainer";
    toastContainer.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 12px; max-width: 400px; width: calc(100% - 40px);";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.style.cssText = "background: #957fef; color: #ffffff; padding: 16px 20px; border-radius: 16px; box-shadow: 0 12px 30px rgba(149, 127, 239, 0.45); border: 2px solid #ffffff; display: flex; align-items: center; justify-content: space-between; gap: 14px; animation: slideInDown 0.4s ease;";
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.8rem;">🍽️</span>
      <div>
        <strong style="font-size: 1.05rem; display: block;">NOVO PEDIDO: MESA ${pedido.mesa}!</strong>
        <span style="font-size: 0.82rem; opacity: 0.95;">${pedido.totalItens} itens • Total: ${pedido.valorTotalFormatado}</span>
      </div>
    </div>
    <button style="background: #ffffff; color: #513b56; border: none; padding: 8px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">Ver Comanda</button>
  `;

  toast.querySelector("button").onclick = () => {
    mudarAbaAdmin('pedidos');
    toast.remove();
  };

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }
  }, 14000);
}

// Gestão de Comandas & Pedidos das Mesas
function obterPedidos() {
  return JSON.parse(localStorage.getItem('costa_in_pedidos') || '[]');
}

function salvarPedidos(pedidos) {
  localStorage.setItem('costa_in_pedidos', JSON.stringify(pedidos));
}

function renderizarPedidos() {
  const container = document.getElementById("ordersFeedContainer");
  const badge = document.getElementById("badgeTabPedidos");
  const pedidos = obterPedidos();
  const pendentes = pedidos.filter(p => p.status === 'pendente');

  if (badge) badge.textContent = pendentes.length;
  if (!container) return;

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="no-calls-box">
        <span class="no-calls-icon">🍽️</span>
        <h3>Nenhum pedido de mesa no momento</h3>
        <p>Quando os clientes na mesa 15 (ou qualquer mesa) escolherem itens e confirmarem o carrinho na ementa digital, a comanda completa surgirá aqui com aviso sonoro!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  pedidos.forEach(pedido => {
    const isPendente = pedido.status === 'pendente';
    const card = document.createElement("div");
    card.className = `order-comanda-card ${isPendente ? 'order-pending' : 'order-delivered'}`;

    let itensListHtml = pedido.itens.map(it => `
      <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed rgba(81,59,86,0.1); font-size: 0.86rem;">
        <span><strong>${it.qtd}x</strong> ${it.nome}</span>
        <span style="font-weight: 700; color: var(--color-lavender);">${(it.precoNum * it.qtd).toFixed(2)}€</span>
      </li>
    `).join("");

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid rgba(81,59,86,0.08); padding-bottom: 8px;">
        <div>
          <span style="background: var(--color-lavender); color: #fff; font-weight: 900; font-size: 0.8rem; padding: 4px 12px; border-radius: 999px;">MESA ${pedido.mesa}</span>
          <span style="font-size: 0.78rem; color: var(--color-olive); margin-left: 8px;">🕒 ${pedido.hora}</span>
        </div>
        <span style="font-size: 0.76rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; ${isPendente ? 'background: #fef3c7; color: #b45309;' : 'background: #d1fae5; color: #065f46;'}">
          ${isPendente ? '⏳ Em Preparação' : '✅ Entregue'}
        </span>
      </div>

      <ul style="list-style: none; padding: 0; margin: 0 0 12px 0;">
        ${itensListHtml}
      </ul>

      ${pedido.obs ? `<div style="background: #fffbeb; padding: 8px 12px; border-radius: 8px; font-size: 0.78rem; color: #b45309; margin-bottom: 12px; border-left: 3px solid #f59e0b;"><strong>Obs:</strong> "${pedido.obs}"</div>` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid rgba(81,59,86,0.08); padding-top: 10px; margin-top: auto;">
        <div>
          <span style="font-size: 0.75rem; color: var(--color-olive); display: block;">Total da Mesa</span>
          <strong style="font-size: 1.25rem; color: var(--color-plum); font-family: var(--font-serif);">${pedido.valorTotalFormatado}</strong>
        </div>
        <div>
          ${isPendente ? `
            <button onclick="marcarPedidoEntregue('${pedido.id}')" style="background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.82rem; shadow: 0 2px 8px rgba(16,185,129,0.3);">
              ✓ Entregar à Mesa
            </button>
          ` : `
            <span style="color: #10b981; font-weight: 800; font-size: 0.82rem;">Entregue à Mesa</span>
          `}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function marcarPedidoEntregue(pedidoId) {
  const pedidos = obterPedidos();
  const idx = pedidos.findIndex(p => p.id === pedidoId);
  if (idx !== -1) {
    pedidos[idx].status = 'entregue';
    salvarPedidos(pedidos);
    renderizarPedidos();
  }
}

function limparTodosPedidos() {
  const pedidos = obterPedidos().filter(p => p.status === 'pendente');
  salvarPedidos(pedidos);
  renderizarPedidos();
}

// 3. Nuvem em Tempo Real (Cross-Device: iPhone 15 -> Computador / Tablet)
try {
  const cloudStream = new EventSource('https://ntfy.sh/costa_in_beach_bar_sync_caparica/sse');
  cloudStream.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data);
      if (raw && raw.message) {
        const payloadData = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
        if (payloadData && payloadData.type === 'CHAMADA_MESA') {
          const chamada = payloadData.payload;
          const chamadas = obterChamadas();
          if (!chamadas.some(c => c.id === chamada.id)) {
            chamadas.unshift(chamada);
            salvarChamadas(chamadas);
            tocarAlertaSonoro();
            renderizarChamadas();
            exibirToastAlerta(chamada);
          }
        } else if (payloadData && payloadData.type === 'NOVO_PEDIDO_MESA') {
          const pedido = payloadData.payload;
          const pedidos = obterPedidos();
          if (!pedidos.some(p => p.id === pedido.id)) {
            pedidos.unshift(pedido);
            salvarPedidos(pedidos);
            tocarAlertaSonoro();
            renderizarPedidos();
            exibirToastPedido(pedido);
          }
        } else if (payloadData && payloadData.type === 'NOVA_RESERVA') {
          const reserva = payloadData.payload;
          const reservas = obterReservas();
          if (!reservas.some(r => r.id === reserva.id)) {
            reservas.unshift(reserva);
            salvarReservas(reservas);
            tocarAlertaSonoro();
            renderizarReservas();
          }
        }
      }
    } catch (parseErr) {
      console.warn("Stream payload parse:", parseErr);
    }
  };
} catch (streamErr) {
  console.warn("Cloud stream notice:", streamErr);
}

// Desbloqueia áudio no primeiro toque/clique do utilizador
window.addEventListener('click', () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const tempCtx = new AudioContext();
      if (tempCtx.state === 'suspended') tempCtx.resume();
    }
  } catch (e) {}
}, { once: true });

window.addEventListener('click', (e) => {
  if (e.target === modalNovaReserva) fecharModalNovaReserva();
});

document.addEventListener("DOMContentLoaded", () => {
  renderizarChamadas();
  renderizarReservas();
});
