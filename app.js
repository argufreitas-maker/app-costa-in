// =============================================================================
// COSTA IN BEACH BAR & CLUB — APLICAÇÃO PÚBLICA (app.js)
// -----------------------------------------------------------------------------
// Este arquivo controla toda a lógica do cliente:
// 1. Catálogo e ementa digital com filtros e busca reativa
// 2. Sistema de chamada de garçom para as 35 mesas com alertas em tempo real
// 3. Sistema de reservas integrado com mensagens automáticas para o WhatsApp
// 4. Utilitários (cópia de Wi-Fi, menu móvel e modais interativos)
// =============================================================================

/**
 * CONFIGURAÇÕES GERAIS DO ESTABELECIMENTO
 * - WHATSAPP_BAR_NUMERO: Número de telefone oficial do balcão/gerente (com código do país).
 * - UBER_EATS_URL: Link direto da loja oficial do Costa In no Uber Eats Portugal.
 */
const WHATSAPP_BAR_NUMERO = "351912345678";
const UBER_EATS_URL = "https://www.ubereats.com/pt-en/store/costa-in-beach-club/j9DAntXeTrCOyTynN_Exfg?srsltid=AYCX9vIeUFoIWbxunwOSEhuOVMgpFiL8JHHTA4WefKUHWAuq8098JEnL";

/**
 * CANAL DE SINCRONIZAÇÃO EM TEMPO REAL (BroadcastChannel API)
 * Permite que a tela do cliente comunique instantaneamente com a tela do Admin
 * na mesma rede/navegador sem precisar recarregar ou fazer requisições lentas.
 */
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('costa_in_sync') : null;

// =============================================================================
// 1. BASE DE DADOS DO MENU DIGITAL
// -----------------------------------------------------------------------------
// Cada item contém identificador único, nome, categoria, preço formatado em Euros,
// descrição detalhada, imagem oficial hospedada na CDN do CloudFront e tag visual.
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
// 2. RENDERIZAÇÃO DA EMENTA & FILTROS DE PESQUISA
// -----------------------------------------------------------------------------
// Controla a exibição dinâmica dos pratos com base na categoria ativa e no termo
// digitado pelo cliente na barra de pesquisa.
// =============================================================================
const menuGrid = document.getElementById("menuGrid");
const menuSearchInput = document.getElementById("menuSearchInput");
const menuTabs = document.getElementById("menuTabs");

// Estado reativo da interface
let categoriaAtiva = "todos";
let termoBusca = "";

/**
 * Renderiza os pratos filtrados na tela dentro da grelha de produtos.
 */
function renderizarMenu() {
  if (!menuGrid) return;
  menuGrid.innerHTML = "";

  // Filtra itens com base na categoria selecionada e texto de busca
  const filtrados = itensMenu.filter(item => {
    const matchCat = categoriaAtiva === "todos" || item.categoria.toLowerCase() === categoriaAtiva.toLowerCase();
    const matchBusca = termoBusca === "" || 
      item.nome.toLowerCase().includes(termoBusca) || 
      item.desc.toLowerCase().includes(termoBusca) ||
      item.categoria.toLowerCase().includes(termoBusca);
    return matchCat && matchBusca;
  });

  // Caso nenhum item corresponda à busca
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

  // Gera os cards HTML de cada prato
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

/**
 * Abre a loja oficial do Costa In no Uber Eats em uma nova aba
 */
function abrirUberEatsItem() {
  window.open(UBER_EATS_URL, "_blank");
}

// Ouvinte de clique nas abas de categorias
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

// Ouvinte de digitação no campo de pesquisa
if (menuSearchInput) {
  menuSearchInput.addEventListener("input", (e) => {
    termoBusca = e.target.value.trim().toLowerCase();
    renderizarMenu();
  });
}

// =============================================================================
// 3. SELETOR DE MESAS (1 A 35) & BOTÃO FLUTUANTE "CHAMAR GARÇOM"
// -----------------------------------------------------------------------------
// O Costa In possui aproximadamente 35 mesas entre esplanada e areia.
// Aqui geramos dinamicamente os 35 botões e emitimos o evento de alerta em tempo real.
// =============================================================================
const TOTAL_MESAS = 35;
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
 * Gera dinamicamente os 35 botões de mesa no modal de chamada
 * e detecta se o cliente já veio com a mesa pré-selecionada via URL (?mesa=15)
 */
function gerarBotoesMesa() {
  if (!tableGridContainer) return;
  tableGridContainer.innerHTML = "";

  // Verifica se há parâmetro "?mesa=X" na URL do QR Code
  const params = new URLSearchParams(window.location.search);
  const mesaUrl = params.get("mesa");

  for (let i = 1; i <= TOTAL_MESAS; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "table-chip";
    btn.textContent = `M${i}`;
    btn.title = `Mesa ${i}`;
    btn.dataset.mesa = i;

    // Se a mesa bater com o parâmetro da URL, já deixa selecionada
    if (mesaUrl && parseInt(mesaUrl, 10) === i) {
      btn.classList.add("selected");
      selectedTableInput.value = i;
      tableSelectedDisplay.textContent = `Mesa selecionada: MESA ${i} (via QR Code)`;
    }

    // Clique para escolher mesa manualmente
    btn.addEventListener("click", () => {
      document.querySelectorAll(".table-chip").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
      selectedTableInput.value = i;
      tableSelectedDisplay.textContent = `Mesa selecionada: MESA ${i}`;
    });

    tableGridContainer.appendChild(btn);
  }
}

// Abertura do modal de chamada
if (btnOpenCallModal) {
  btnOpenCallModal.addEventListener("click", () => {
    modalCallTable.style.display = "flex";
    callSuccessBox.style.display = "none";
    formCallWaiter.style.display = "block";
  });
}

// Fechamento do modal de chamada
if (btnCloseCallModal) {
  btnCloseCallModal.addEventListener("click", () => {
    fecharModalChamada();
  });
}

function fecharModalChamada() {
  if (modalCallTable) modalCallTable.style.display = "none";
}

/**
 * Submete o alerta de chamada de garçom para a mesa escolhida
 */
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

    // Objeto do alerta com carimbo de data/hora
    const novaChamada = {
      id: 'call_' + Date.now(),
      mesa: mesa,
      motivo: motivo,
      hora: horaFormatada,
      timestamp: Date.now(),
      status: 'ativa'
    };

    // 1. Armazena no localStorage do navegador para persistência
    const chamadasExistentes = JSON.parse(localStorage.getItem('costa_in_chamadas') || '[]');
    chamadasExistentes.unshift(novaChamada);
    localStorage.setItem('costa_in_chamadas', JSON.stringify(chamadasExistentes));

    // 2. Emite o evento em tempo real via BroadcastChannel para a tela do Admin
    if (syncChannel) {
      syncChannel.postMessage({ type: 'CHAMADA_MESA', payload: novaChamada });
    }
    // Disparo complementar para navegadores através do evento 'storage'
    localStorage.setItem('costa_in_sync_ping', JSON.stringify({ event: 'CHAMADA', time: Date.now(), mesa }));

    // 3. Exibe a tela amigável de sucesso para o cliente
    formCallWaiter.style.display = "none";
    callSuccessBox.style.display = "block";
    callSuccessMsg.innerHTML = `O alerta para a <strong>Mesa ${mesa}</strong> (${motivo}) foi enviado ao balcão! O nosso empregado de mesa já se dirige até si.`;
  });
}

// =============================================================================
// 4. FORMULÁRIO DE RESERVAS & INTEGRAÇÃO COM WHATSAPP
// -----------------------------------------------------------------------------
// Valida os dados da reserva, salva na base de dados local do restaurante
// e prepara a mensagem de boas-vindas requisitada pelo cliente.
// =============================================================================
const formReserva = document.getElementById("formReserva");
const modalReservaConfirmada = document.getElementById("modalReservaConfirmada");
const reservaSummaryBox = document.getElementById("reservaSummaryBox");
const btnOpenWhatsAppDirect = document.getElementById("btnOpenWhatsAppDirect");

// Impede que o cliente selecione datas no passado
const resDataInput = document.getElementById("resData");
if (resDataInput) {
  const hoje = new Date().toISOString().split("T")[0];
  resDataInput.min = hoje;
  resDataInput.value = hoje;
}

if (formReserva) {
  formReserva.addEventListener("submit", (e) => {
    e.preventDefault();

    // Captura os dados preenchidos no formulário
    const nome = document.getElementById("resNome").value.trim();
    const whatsapp = document.getElementById("resWhatsapp").value.trim();
    const email = document.getElementById("resEmail").value.trim();
    const data = document.getElementById("resData").value;
    const hora = document.getElementById("resHora").value;
    const pessoas = document.getElementById("resPessoas").value;
    const zona = document.getElementById("resZona").value;
    const obs = document.getElementById("resObs").value.trim();

    if (!nome || !whatsapp || !data || !hora) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Formata a data para padrão europeu (DD/MM/AAAA)
    const partesData = data.split("-");
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

    // Monta o payload estruturado da reserva
    const novaReserva = {
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
      status: 'Pendente',
      criadaEm: new Date().toISOString()
    };

    // 1. Salva a nova reserva no localStorage
    const reservasExistentes = JSON.parse(localStorage.getItem('costa_in_reservas') || '[]');
    reservasExistentes.unshift(novaReserva);
    localStorage.setItem('costa_in_reservas', JSON.stringify(reservasExistentes));

    // 2. Notifica o Admin instantaneamente
    if (syncChannel) {
      syncChannel.postMessage({ type: 'NOVA_RESERVA', payload: novaReserva });
    }
    localStorage.setItem('costa_in_sync_ping', JSON.stringify({ event: 'RESERVA', time: Date.now() }));

    // 3. Monta a mensagem personalizada solicitada para o WhatsApp:
    // "Ola Francisca Agendamento marcado. Obrigado pelo agendamento, te aguardamos! Mais tarde confirmo o agendamento com voce !"
    const textoMensagem = encodeURIComponent(
      `Olá ${nome}! Agendamento marcado.\n` +
      `📅 Data: ${dataFormatada} às ${hora}\n` +
      `👥 Pessoas: ${pessoas} (${zona})\n\n` +
      `Obrigado pelo agendamento, te aguardamos no Costa In Beach Bar! Mais tarde confirmo o agendamento com você!`
    );

    // Link oficial da API do WhatsApp (wa.me)
    const linkWhatsApp = `https://wa.me/${WHATSAPP_BAR_NUMERO}?text=${textoMensagem}`;

    // Preenche o resumo no modal de confirmação
    if (reservaSummaryBox) {
      reservaSummaryBox.innerHTML = `
        <p><strong>👤 Cliente:</strong> ${nome}</p>
        <p><strong>📱 Telemóvel:</strong> ${whatsapp}</p>
        <p><strong>📅 Data & Hora:</strong> ${dataFormatada} às ${hora}</p>
        <p><strong>👥 Lugares:</strong> ${pessoas} pessoas (${zona})</p>
        ${obs ? `<p><strong>📝 Nota:</strong> ${obs}</p>` : ''}
      `;
    }

    if (btnOpenWhatsAppDirect) {
      btnOpenWhatsAppDirect.href = linkWhatsApp;
    }

    // Exibe o modal na tela
    if (modalReservaConfirmada) {
      modalReservaConfirmada.style.display = "flex";
    }

    formReserva.reset();
  });
}

/**
 * Fecha o modal de confirmação de reserva
 */
function fecharModalReserva() {
  if (modalReservaConfirmada) modalReservaConfirmada.style.display = "none";
}

// Fechamento de qualquer modal ao clicar fora da caixa de diálogo
window.addEventListener("click", (e) => {
  if (e.target === modalCallTable) fecharModalChamada();
  if (e.target === modalReservaConfirmada) fecharModalReserva();
});

// =============================================================================
// 5. RECURSO INTERATIVO: COPIAR SENHA DO WI-FI
// -----------------------------------------------------------------------------
// Permite ao cliente na praia copiar a senha do Wi-Fi oficial ("costain09") com 1 toque.
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

// =============================================================================
// 6. MENU RESPONSIVO MOBILE (GAVETA DE NAVEGAÇÃO)
// =============================================================================
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileDrawer = document.getElementById("mobileDrawer");

if (mobileMenuBtn && mobileDrawer) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileDrawer.classList.toggle("open");
  });

  // Fecha a gaveta ao clicar em qualquer link
  mobileDrawer.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileDrawer.classList.remove("open");
    });
  });
}

// =============================================================================
// 7. INICIALIZAÇÃO DA APLICAÇÃO AO CARREGAR A PÁGINA
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderizarMenu();
  gerarBotoesMesa();
});
