// =============================================================================
// COSTA IN BEACH BAR & CLUB — APLICAÇÃO PÚBLICA (app.js)
// -----------------------------------------------------------------------------
// Controla a experiência pública do cliente:
// 1. Catálogo e ementa digital com busca e filtros por categoria
// 2. Sistema de chamada de garçom para as 35 mesas (em tempo real)
// 3. NOVO FLUXO INTUITIVO DE RESERVAS EM 2 PASSOS:
//    - Passo 1: Seleção rápida no site (Data, Hora, Pessoas, Área)
//    - Passo 2: Modal simples para Nome, Email e WhatsApp
// 4. Integração automática com o WhatsApp e Uber Eats
// =============================================================================

/**
 * CONFIGURAÇÕES GERAIS DO ESTABELECIMENTO
 */
const WHATSAPP_BAR_NUMERO = "351912345678"; // Telemóvel / WhatsApp oficial do Costa In
const UBER_EATS_URL = "https://www.ubereats.com/pt-en/store/costa-in-beach-club/j9DAntXeTrCOyTynN_Exfg?srsltid=AYCX9vIeUFoIWbxunwOSEhuOVMgpFiL8JHHTA4WefKUHWAuq8098JEnL";

/**
 * CANAL DE SINCRONIZAÇÃO EM TEMPO REAL (BroadcastChannel API)
 */
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('costa_in_sync') : null;

// =============================================================================
// 1. BASE DE DADOS DO MENU DIGITAL (Com fotos oficiais)
// =============================================================================
const itensMenu = [
  {
    id: 1,
    nome: "Chocos Fritos à Setubalense",
    categoria: "Petiscos",
    preco: "12.50€",
    desc: "Choco fresco tenro, frito com polme crocante, acompanhado de maionese de alho e limão da praia.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7bf22938-6efb-432b-8ce4-8428edd068f8.jpeg",
    tag: "Especialidade"
  },
  {
    id: 2,
    nome: "Gambas ao Alho & Coentros",
    categoria: "Petiscos",
    preco: "13.90€",
    desc: "Gambas salteadas em azeite virgem extra, alho laminado, malagueta e coentros frescos.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/ebe04665-e7f2-4e4e-8679-c4f14237f811.jpeg",
    tag: "Favorito"
  },
  {
    id: 3,
    nome: "Pica-Pau de Novilho",
    categoria: "Petiscos",
    preco: "11.50€",
    desc: "Tiras suculentas de novilho em molho apurado de cerveja, mostarda e picles caseiros.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7bf22938-6efb-432b-8ce4-8428edd068f8.jpeg",
    tag: "Praia"
  },
  {
    id: 4,
    nome: "Polvo à Lagareiro Costa In",
    categoria: "Pratos",
    preco: "17.50€",
    desc: "Polvo tenro assado no forno com batatas a murro, muito azeite, alho e grelos salteados.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7f4e0499-f35c-4fec-a4e7-69a370eb5e8b.jpeg",
    tag: "Chef's Choice"
  },
  {
    id: 5,
    nome: "Bife de Vazia Grelhado",
    categoria: "Pratos",
    preco: "16.00€",
    desc: "Corte nobre com manteiga de ervas da praia, servido com batata frita rústica e salada mista.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7f4e0499-f35c-4fec-a4e7-69a370eb5e8b.jpeg",
    tag: "Grelhado"
  },
  {
    id: 6,
    nome: "Pizza Costa In Especial",
    categoria: "Pizzas",
    preco: "13.50€",
    desc: "Molho de tomate fresco, mozzarella fior di latte, presunto ibérico, rúcula e lascas de parmesão.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/77c7336b-3959-4d14-812f-0f8b8b951a5c.jpeg",
    tag: "Artesanal"
  },
  {
    id: 7,
    nome: "Pizza Diavola Picante",
    categoria: "Pizzas",
    preco: "12.00€",
    desc: "Mozzarella, salame picante italiano, orégãos e azeite de piripiri da Caparica.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/77c7336b-3959-4d14-812f-0f8b8b951a5c.jpeg",
    tag: "Picante"
  },
  {
    id: 8,
    nome: "Burger Gourmet Costa In",
    categoria: "Burgers",
    preco: "12.50€",
    desc: "Carne bovina 180g, queijo cheddar maturado, bacon crocante, cebola caramelizada e maionese trufada.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/crop-a8266a99-cc0c-4fb9-a9aa-31f64d62c3c0.jpeg",
    tag: "Best Seller"
  },
  {
    id: 9,
    nome: "Tosta Mista em Pão Alentejano",
    categoria: "Burgers",
    preco: "6.00€",
    desc: "Pão alentejano tostado na brasa, fatias generosas de queijo flamengo e fiambre de peru fumado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/crop-44b48e91-3b0f-49a0-b4fa-8d4e4f7dafa4.jpeg",
    tag: "Clássico"
  },
  {
    id: 10,
    nome: "Salada de Polvo da Costa",
    categoria: "Saladas",
    preco: "13.00€",
    desc: "Polvo cozido no ponto, pimentos coloridos, cebola roxa, salsa fresca e azeite virgem com vinagre suave.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/3f013666-cb45-4543-bb2e-90e1a7738307.jpeg",
    tag: "Fresco"
  },
  {
    id: 11,
    nome: "Tagliatelle com Gambas ao Alho",
    categoria: "Pastas",
    preco: "14.50€",
    desc: "Massa fresca salteada com camarões, tomate cereja confitado, manjericão e vinho branco da região.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/4764230c-1660-4584-9dee-2276d61021ac.jpeg",
    tag: "Pasta Fresca"
  },
  {
    id: 12,
    nome: "Caipirinha Tradicional de Lima",
    categoria: "Bebidas",
    preco: "7.00€",
    desc: "Cachaça brasileira premium, limas frescas maceradas com açúcar amarelo e gelo picado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/ebe04665-e7f2-4e4e-8679-c4f14237f811.jpeg",
    tag: "Sunset Drink"
  },
  {
    id: 13,
    nome: "Mojito Cubano com Hortelã",
    categoria: "Bebidas",
    preco: "7.50€",
    desc: "Rum branco, hortelã fresca da horta, lima espremida, água gaseificada e açúcar mascavado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/ebe04665-e7f2-4e4e-8679-c4f14237f811.jpeg",
    tag: "Refrescante"
  },
  {
    id: 14,
    nome: "Cerveja Imperial 25cl (Super Bock)",
    categoria: "Bebidas",
    preco: "2.20€",
    desc: "Servida bem fresca em copo gelado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/1d1ddb83-065b-4f1d-8e0c-fffc8f2f9fbe.jpeg",
    tag: "Pressão"
  },
  {
    id: 15,
    nome: "Cheesecake de Frutos Silvestres",
    categoria: "Sobremesas",
    preco: "5.50€",
    desc: "Base crocante de bolacha amanteigada, creme aveludado e coulis caseiro de frutos vermelhos.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/crop-c66c6848-9325-493b-959d-791c31da9ffe.jpeg",
    tag: "Sobremesa"
  }
];

// =============================================================================
// 2. RENDERIZAÇÃO DA EMENTA & FILTROS
// =============================================================================
const menuGrid = document.getElementById("menuGrid");
const menuSearchInput = document.getElementById("menuSearchInput");
const menuTabs = document.getElementById("menuTabs");

let categoriaAtiva = "todos";
let termoBusca = "";

function renderizarMenu() {
  if (!menuGrid) return;
  menuGrid.innerHTML = "";

  const filtrados = itensMenu.filter(item => {
    const matchCat = categoriaAtiva === "todos" || item.categoria.toLowerCase() === categoriaAtiva.toLowerCase();
    const matchBusca = termoBusca === "" || 
      item.nome.toLowerCase().includes(termoBusca) || 
      item.desc.toLowerCase().includes(termoBusca) ||
      item.categoria.toLowerCase().includes(termoBusca);
    return matchCat && matchBusca;
  });

  if (filtrados.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <p style="font-size: 2rem; margin-bottom: 8px;">🍽️</p>
        <h4>Nenhum prato ou bebida encontrado com esse critério.</h4>
        <p>Tente procurar por outro termo ou selecione "Todos".</p>
      </div>
    `;
    return;
  }

  filtrados.forEach(item => {
    const card = document.createElement("article");
    card.className = "menu-item-card";
    card.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}" class="menu-item-img" loading="lazy">
      <div class="menu-item-details">
        <div>
          <div class="menu-item-top">
            <h4 class="menu-item-title">${item.nome}</h4>
            <span class="menu-item-price">${item.preco}</span>
          </div>
          <p class="menu-item-desc">${item.desc}</p>
        </div>
        <div class="menu-item-footer">
          <span class="menu-item-tag">${item.tag || item.categoria}</span>
          <button class="btn-ubereats-sm" style="font-size:0.75rem;" onclick="abrirUberEatsItem()">
            🛵 No Uber Eats
          </button>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

function abrirUberEatsItem() {
  window.open(UBER_EATS_URL, "_blank");
}

if (menuTabs) {
  menuTabs.addEventListener("click", (e) => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    categoriaAtiva = pill.dataset.category || "todos";
    renderizarMenu();
  });
}

if (menuSearchInput) {
  menuSearchInput.addEventListener("input", (e) => {
    termoBusca = e.target.value.trim().toLowerCase();
    renderizarMenu();
  });
}

// =============================================================================
// 3. BOTÃO "CHAMAR GARÇOM" — EXCLUSIVO PARA O QR CODE DA MESA (NÃO NO SITE PÚBLICO)
// -----------------------------------------------------------------------------
// O botão redondo flutuante NÃO aparece para visitantes comuns no site público.
// Ele surge APENAS quando o cliente acede através do QR Code da mesa (ex: ?mesa=15).
// =============================================================================
const TOTAL_MESAS = 35;
const floatingCallContainer = document.getElementById("floatingCallContainer");
const callBtnText = document.getElementById("callBtnText");
const tableGridContainer = document.getElementById("tableGridContainer");
const selectedTableInput = document.getElementById("selectedTableNumber");
const tableSelectedDisplay = document.getElementById("tableSelectedDisplay");
const modalCallTable = document.getElementById("modalCallTable");
const btnOpenCallModal = document.getElementById("btnOpenCallModal");
const btnCloseCallModal = document.getElementById("btnCloseCallModal");
const formCallWaiter = document.getElementById("formCallWaiter");
const callSuccessBox = document.getElementById("callSuccessBox");
const callSuccessMsg = document.getElementById("callSuccessMsg");

/**
 * Verifica se a página foi aberta através do QR Code de uma mesa (ex: ?mesa=15).
 * Se SIM: exibe o botão flutuante redondo de chamada exclusivo para essa mesa.
 * Se NÃO: mantém o botão completamente oculto para o público em geral.
 */
function verificarAcessoMesaQrCode() {
  const params = new URLSearchParams(window.location.search);
  const mesaUrl = params.get("mesa");

  if (mesaUrl) {
    const numMesa = parseInt(mesaUrl, 10);
    if (!isNaN(numMesa) && numMesa >= 1 && numMesa <= TOTAL_MESAS) {
      // 1. Torna o botão redondo de chamada visível apenas para esta mesa
      if (floatingCallContainer) {
        floatingCallContainer.style.display = "block";
      }
      if (callBtnText) {
        callBtnText.textContent = `M${numMesa}`;
      }
      if (selectedTableInput) {
        selectedTableInput.value = numMesa;
      }
      if (tableSelectedDisplay) {
        tableSelectedDisplay.innerHTML = `Mesa identificada: <strong>MESA ${numMesa}</strong> (via QR Code)`;
      }

      // 2. Exibe uma barra amigável no topo do site identificando a mesa
      const topBar = document.querySelector(".top-announcement");
      if (topBar) {
        const mesaBadge = document.createElement("div");
        mesaBadge.style.cssText = "background: #ffb43f; color: #0c2331; font-weight: 800; font-size: 0.8rem; padding: 4px 12px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 6px; margin-left: 10px;";
        mesaBadge.innerHTML = `📍 Mesa ${numMesa} Ativa`;
        const container = topBar.querySelector(".announcement-content");
        if (container) container.appendChild(mesaBadge);
      }
    }
  } else {
    // Acesso normal pelo site público: garante que o botão não aparece
    if (floatingCallContainer) {
      floatingCallContainer.style.display = "none";
    }
  }
}

function gerarBotoesMesa() {
  if (!tableGridContainer) return;
  tableGridContainer.innerHTML = "";

  const params = new URLSearchParams(window.location.search);
  const mesaUrl = params.get("mesa");

  for (let i = 1; i <= TOTAL_MESAS; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "table-chip";
    btn.textContent = `M${i}`;
    btn.title = `Mesa ${i}`;
    btn.dataset.mesa = i;

    if (mesaUrl && parseInt(mesaUrl, 10) === i) {
      btn.classList.add("selected");
      selectedTableInput.value = i;
    }

    btn.addEventListener("click", () => {
      document.querySelectorAll(".table-chip").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
      selectedTableInput.value = i;
      tableSelectedDisplay.innerHTML = `Mesa selecionada: <strong>MESA ${i}</strong>`;
    });

    tableGridContainer.appendChild(btn);
  }
}

if (btnOpenCallModal) {
  btnOpenCallModal.addEventListener("click", () => {
    modalCallTable.style.display = "flex";
    callSuccessBox.style.display = "none";
    formCallWaiter.style.display = "block";
  });
}

if (btnCloseCallModal) {
  btnCloseCallModal.addEventListener("click", () => {
    fecharModalChamada();
  });
}

function fecharModalChamada() {
  if (modalCallTable) modalCallTable.style.display = "none";
}

if (formCallWaiter) {
  formCallWaiter.addEventListener("submit", (e) => {
    e.preventDefault();
    const mesa = selectedTableInput.value;
    if (!mesa) {
      alert("Por favor, selecione o número da sua mesa (1 a 35).");
      return;
    }

    const motivo = document.getElementById("callReason").value || "Atendimento";
    const horaAtual = new Date();
    const horaFormatada = horaAtual.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const novaChamada = {
      id: 'call_' + Date.now(),
      mesa: mesa,
      motivo: motivo,
      hora: horaFormatada,
      timestamp: Date.now(),
      status: 'ativa'
    };

    const chamadasExistentes = JSON.parse(localStorage.getItem('costa_in_chamadas') || '[]');
    chamadasExistentes.unshift(novaChamada);
    localStorage.setItem('costa_in_chamadas', JSON.stringify(chamadasExistentes));

    if (syncChannel) {
      syncChannel.postMessage({ type: 'CHAMADA_MESA', payload: novaChamada });
    }
    localStorage.setItem('costa_in_sync_ping', JSON.stringify({ event: 'CHAMADA', time: Date.now(), mesa }));

    formCallWaiter.style.display = "none";
    callSuccessBox.style.display = "block";
    callSuccessMsg.innerHTML = `O alerta para a <strong>Mesa ${mesa}</strong> (${motivo}) foi enviado ao balcão! O nosso empregado de mesa já se dirige até si.`;
  });
}

// =============================================================================
// 4. NOVO FLUXO DE RESERVAS INTUITIVO EM 2 PASSOS
// -----------------------------------------------------------------------------
// Passo 1: O cliente seleciona a Data, Hora, Pessoas e Área diretamente no card
// Passo 2: Ao clicar em "Avançar", abre o modal simples pedindo apenas Nome, WhatsApp e Email
// =============================================================================
const quickDateInput = document.getElementById("quickDate");
const quickTimeInput = document.getElementById("quickTime");
const quickPeopleInput = document.getElementById("quickPeople");
const quickZoneInput = document.getElementById("quickZone");
const btnAvancarReserva = document.getElementById("btnAvancarReserva");

const modalFormularioReserva = document.getElementById("modalFormularioReserva");
const btnCloseReservaModal = document.getElementById("btnCloseReservaModal");
const bookingMiniSummary = document.getElementById("bookingMiniSummary");
const formReservaSimples = document.getElementById("formReservaSimples");

const modalReservaConfirmada = document.getElementById("modalReservaConfirmada");
const reservaSummaryBox = document.getElementById("reservaSummaryBox");
const btnOpenWhatsAppDirect = document.getElementById("btnOpenWhatsAppDirect");

// Preenche a data mínima como hoje
if (quickDateInput) {
  const hoje = new Date().toISOString().split("T")[0];
  quickDateInput.min = hoje;
  quickDateInput.value = hoje;
}

// Dados temporários da reserva (Passo 1)
let reservaEmAndamento = {
  data: '',
  dataIso: '',
  hora: '',
  pessoas: '',
  zona: ''
};

// Passo 1: Ao clicar em "Continuar com os Dados de Contacto"
if (btnAvancarReserva) {
  btnAvancarReserva.addEventListener("click", () => {
    const dataIso = quickDateInput ? quickDateInput.value : '';
    const hora = quickTimeInput ? quickTimeInput.value : '';
    const pessoas = quickPeopleInput ? quickPeopleInput.value : '2';
    const zona = quickZoneInput ? quickZoneInput.value : 'Esplanada Vista Mar';

    if (!dataIso || !hora) {
      alert("Por favor, selecione a data e o horário desejados.");
      return;
    }

    const partes = dataIso.split("-");
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;

    // Guarda dados do Passo 1
    reservaEmAndamento = {
      data: dataFormatada,
      dataIso,
      hora,
      pessoas,
      zona
    };

    // Atualiza o resumo no topo do modal
    if (bookingMiniSummary) {
      bookingMiniSummary.innerHTML = `
        <span>📅 <strong>${dataFormatada}</strong> às <strong>${hora}</strong> • 👥 <strong>${pessoas} pessoa(s)</strong> (${zona})</span>
      `;
    }

    // Abre o modal simples de identificação (Passo 2)
    if (modalFormularioReserva) {
      modalFormularioReserva.style.display = "flex";
      const campoNome = document.getElementById("resNome");
      if (campoNome) campoNome.focus();
    }
  });
}

// Fechamento do modal de identificação
if (btnCloseReservaModal) {
  btnCloseReservaModal.addEventListener("click", () => {
    fecharModalFormularioReserva();
  });
}

function fecharModalFormularioReserva() {
  if (modalFormularioReserva) modalFormularioReserva.style.display = "none";
}

// Passo 2: Ao submeter o formulário de contacto
if (formReservaSimples) {
  formReservaSimples.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("resNome").value.trim();
    const whatsapp = document.getElementById("resWhatsapp").value.trim();
    const email = document.getElementById("resEmail").value.trim();
    const obs = document.getElementById("resObs").value.trim();

    if (!nome || !whatsapp || !email) {
      alert("Por favor, preencha o Nome, WhatsApp e Email.");
      return;
    }

    // Payload final combinando Passo 1 e Passo 2
    const novaReserva = {
      id: 'res_' + Date.now(),
      nome,
      whatsapp,
      email,
      data: reservaEmAndamento.data,
      dataIso: reservaEmAndamento.dataIso,
      hora: reservaEmAndamento.hora,
      pessoas: reservaEmAndamento.pessoas,
      zona: reservaEmAndamento.zona,
      obs,
      status: 'Pendente',
      criadaEm: new Date().toISOString()
    };

    // 1. Guarda na base local
    const reservasExistentes = JSON.parse(localStorage.getItem('costa_in_reservas') || '[]');
    reservasExistentes.unshift(novaReserva);
    localStorage.setItem('costa_in_reservas', JSON.stringify(reservasExistentes));

    // 2. Notifica o Admin em tempo real
    if (syncChannel) {
      syncChannel.postMessage({ type: 'NOVA_RESERVA', payload: novaReserva });
    }
    localStorage.setItem('costa_in_sync_ping', JSON.stringify({ event: 'RESERVA', time: Date.now() }));

    // 3. Monta a mensagem combinada para o WhatsApp
    const textoMensagem = encodeURIComponent(
      `Olá ${nome}! Agendamento marcado.\n` +
      `📅 Data: ${novaReserva.data} às ${novaReserva.hora}\n` +
      `👥 Pessoas: ${novaReserva.pessoas} (${novaReserva.zona})\n\n` +
      `Obrigado pelo agendamento, te aguardamos no Costa In Beach Bar! Mais tarde confirmo o agendamento com você!`
    );

    const linkWhatsApp = `https://wa.me/${WHATSAPP_BAR_NUMERO}?text=${textoMensagem}`;

    // Fecha o modal de preenchimento
    fecharModalFormularioReserva();

    // Preenche o modal de confirmação final
    if (reservaSummaryBox) {
      reservaSummaryBox.innerHTML = `
        <p><strong>👤 Cliente:</strong> ${nome}</p>
        <p><strong>📱 Telemóvel:</strong> ${whatsapp}</p>
        <p><strong>📅 Data & Hora:</strong> ${novaReserva.data} às ${novaReserva.hora}</p>
        <p><strong>👥 Lugares:</strong> ${novaReserva.pessoas} pessoas (${novaReserva.zona})</p>
        ${obs ? `<p><strong>📝 Nota:</strong> ${obs}</p>` : ''}
      `;
    }

    if (btnOpenWhatsAppDirect) {
      btnOpenWhatsAppDirect.href = linkWhatsApp;
    }

    if (modalReservaConfirmada) {
      modalReservaConfirmada.style.display = "flex";
    }

    formReservaSimples.reset();
  });
}

function fecharModalReserva() {
  if (modalReservaConfirmada) modalReservaConfirmada.style.display = "none";
}

// Fechamento ao clicar fora do conteúdo
window.addEventListener("click", (e) => {
  if (e.target === modalCallTable) fecharModalChamada();
  if (e.target === modalFormularioReserva) fecharModalFormularioReserva();
  if (e.target === modalReservaConfirmada) fecharModalReserva();
});

// =============================================================================
// 5. UTILITÁRIOS: COPIAR SENHA DO WI-FI & MENU MOBILE
// =============================================================================
function copiarSenhaWifi() {
  const senha = "costain09";
  navigator.clipboard.writeText(senha).then(() => {
    const msg = document.getElementById("wifiCopiedMsg");
    if (msg) {
      msg.style.display = "inline-block";
      setTimeout(() => { msg.style.display = "none"; }, 3000);
    }
  }).catch(() => {
    alert("Senha do Wi-Fi: costain09");
  });
}

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileDrawer = document.getElementById("mobileDrawer");

if (mobileMenuBtn && mobileDrawer) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileDrawer.classList.toggle("open");
  });

  mobileDrawer.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileDrawer.classList.remove("open");
    });
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  renderizarMenu();
  gerarBotoesMesa();
  verificarAcessoMesaQrCode(); // Ativa o botão de chamar apenas se estiver num QR Code de mesa
});
