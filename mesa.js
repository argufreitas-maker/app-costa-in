// =============================================================================
// COSTA IN BEACH BAR — SISTEMA DE EMENTA DIGITAL E PEDIDOS DA MESA (mesa.js)
// -----------------------------------------------------------------------------
// Controla a experiência completa de auto-atendimento na mesa com Tailwind CSS:
// 1. Identificação automática da mesa (ex: ?mesa=15)
// 2. Catálogo gastronómico com filtros de categoria e busca instantânea
// 3. Sistema de carrinho interativo com soma em tempo real e quantidade (+ / -)
// 4. Envio do pedido da mesa diretamente para o balcão / Admin em tempo real
// 5. Botão flutuante de chamada de funcionário (CALL)
// =============================================================================

const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('costa_in_sync') : null;

// Base de Dados Oficial de Produtos do Costa in Beach Bar
const itensMenu = [
  {
    id: 1,
    nome: "Chocos Fritos à Setubalense",
    categoria: "Petiscos",
    precoNum: 12.50,
    preco: "12.50€",
    desc: "Choco fresco tenro, frito com polme crocante, acompanhado de maionese de alho e limão da praia.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7bf22938-6efb-432b-8ce4-8428edd068f8.jpeg",
    tag: "Especialidade"
  },
  {
    id: 2,
    nome: "Gambas ao Alho & Coentros",
    categoria: "Petiscos",
    precoNum: 13.90,
    preco: "13.90€",
    desc: "Gambas salteadas em azeite virgem extra, alho laminado, malagueta e coentros frescos da horta.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/ebe04665-e7f2-4e4e-8679-c4f14237f811.jpeg",
    tag: "Favorito"
  },
  {
    id: 3,
    nome: "Pica-Pau de Novilho",
    categoria: "Petiscos",
    precoNum: 11.50,
    preco: "11.50€",
    desc: "Tiras suculentas de novilho em molho apurado de cerveja, mostarda e picles artesanais.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7bf22938-6efb-432b-8ce4-8428edd068f8.jpeg",
    tag: "Praia"
  },
  {
    id: 4,
    nome: "Polvo à Lagareiro Costa In",
    categoria: "Pratos",
    precoNum: 17.50,
    preco: "17.50€",
    desc: "Polvo tenro assado no forno com batatas a murro, azeite virgem, alho confitado e grelos salteados.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7f4e0499-f35c-4fec-a4e7-69a370eb5e8b.jpeg",
    tag: "Chef's Choice"
  },
  {
    id: 5,
    nome: "Bife de Vazia Grelhado",
    categoria: "Pratos",
    precoNum: 16.00,
    preco: "16.00€",
    desc: "Corte nobre com manteiga de ervas da praia, servido com batata frita rústica e salada mista da estação.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/7f4e0499-f35c-4fec-a4e7-69a370eb5e8b.jpeg",
    tag: "Grelhado"
  },
  {
    id: 6,
    nome: "Pizza Costa In Especial",
    categoria: "Pizzas",
    precoNum: 13.50,
    preco: "13.50€",
    desc: "Molho de tomate fresco, mozzarella fior di latte, presunto ibérico, rúcula selvagem e lascas de parmesão.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/77c7336b-3959-4d14-812f-0f8b8b951a5c.jpeg",
    tag: "Artesanal"
  },
  {
    id: 7,
    nome: "Pizza Diavola Picante",
    categoria: "Pizzas",
    precoNum: 12.00,
    preco: "12.00€",
    desc: "Mozzarella fior di latte, salame picante italiano, orégãos e azeite perfumado com piripiri da Caparica.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/77c7336b-3959-4d14-812f-0f8b8b951a5c.jpeg",
    tag: "Picante"
  },
  {
    id: 8,
    nome: "Burger Gourmet Costa In",
    categoria: "Burgers",
    precoNum: 12.50,
    preco: "12.50€",
    desc: "Carne bovina 180g, queijo cheddar maturado, bacon crocante, cebola caramelizada e maionese trufada.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/crop-a8266a99-cc0c-4fb9-a9aa-31f64d62c3c0.jpeg",
    tag: "Best Seller"
  },
  {
    id: 9,
    nome: "Tosta Mista em Pão Alentejano",
    categoria: "Burgers",
    precoNum: 6.00,
    preco: "6.00€",
    desc: "Pão alentejano tostado no forno a lenha com generosas fatias de queijo flamengo e fiambre de peru fumado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/crop-44b48e91-3b0f-49a0-b4fa-8d4e4f7dafa4.jpeg",
    tag: "Clássico"
  },
  {
    id: 10,
    nome: "Salada de Polvo da Costa",
    categoria: "Saladas",
    precoNum: 13.00,
    preco: "13.00€",
    desc: "Polvo cozido no ponto, pimentos tricolores assados, cebola roxa, salsa fresca e azeite virgem com vinagre suave.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/3f013666-cb45-4543-bb2e-90e1a7738307.jpeg",
    tag: "Fresco"
  },
  {
    id: 11,
    nome: "Tagliatelle com Gambas ao Alho",
    categoria: "Pastas",
    precoNum: 14.50,
    preco: "14.50€",
    desc: "Massa fresca italiana salteada com camarões do Atlântico, tomate cereja confitado, manjericão e vinho branco.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/4764230c-1660-4584-9dee-2276d61021ac.jpeg",
    tag: "Pasta Fresca"
  },
  {
    id: 12,
    nome: "Caipirinha Tradicional de Lima",
    categoria: "Bebidas",
    precoNum: 7.00,
    preco: "7.00€",
    desc: "Cachaça brasileira premium, limas frescas maceradas com açúcar amarelo e gelo picado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/ebe04665-e7f2-4e4e-8679-c4f14237f811.jpeg",
    tag: "Sunset Drink"
  },
  {
    id: 13,
    nome: "Mojito Cubano com Hortelã",
    categoria: "Bebidas",
    precoNum: 7.50,
    preco: "7.50€",
    desc: "Rum branco caribenho, hortelã fresca da horta, lima espremida, água gaseificada e açúcar mascavado.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/ebe04665-e7f2-4e4e-8679-c4f14237f811.jpeg",
    tag: "Refrescante"
  },
  {
    id: 14,
    nome: "Cerveja Imperial 25cl (Super Bock)",
    categoria: "Bebidas",
    precoNum: 2.20,
    preco: "2.20€",
    desc: "Servida bem fresca em copo gelado à beira-mar.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/1d1ddb83-065b-4f1d-8e0c-fffc8f2f9fbe.jpeg",
    tag: "Pressão"
  },
  {
    id: 15,
    nome: "Cheesecake de Frutos Silvestres",
    categoria: "Sobremesas",
    precoNum: 5.50,
    preco: "5.50€",
    desc: "Base crocante de bolacha amanteigada, creme aveludado de queijo fresco e coulis caseiro de frutos vermelhos.",
    imagem: "https://dyj6gt4964deb.cloudfront.net/images/crop-c66c6848-9325-493b-959d-791c31da9ffe.jpeg",
    tag: "Sobremesa"
  }
];

// Identificação da Mesa Atual
const params = new URLSearchParams(window.location.search);
const mesaParam = params.get("mesa");
const NUMERO_MESA = mesaParam ? parseInt(mesaParam, 10) : 15;

// Estado do Carrinho da Mesa (armazenado por mesa)
let carrinhoMesa = JSON.parse(localStorage.getItem(`costa_in_cart_mesa_${NUMERO_MESA}`) || "{}");
let categoriaAtiva = "todos";
let termoBusca = "";

// Elementos DOM
const menuGrid = document.getElementById("menuGrid");
const menuSearchInput = document.getElementById("menuSearchInput");
const menuTabsContainer = document.getElementById("menuTabs");
const floatingCartBar = document.getElementById("floatingCartBar");
const cartBadgeCount = document.getElementById("cartBadgeCount");
const cartTotalBar = document.getElementById("cartTotalBar");
const navCartCount = document.getElementById("navCartCount");

// Drawer do Carrinho
const cartDrawer = document.getElementById("cartDrawer");
const cartDrawerBackdrop = document.getElementById("cartDrawerBackdrop");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartEmptyState = document.getElementById("cartEmptyState");
const cartDrawerSubtotal = document.getElementById("cartDrawerSubtotal");
const cartDrawerTotal = document.getElementById("cartDrawerTotal");
const cartObservations = document.getElementById("cartObservations");
const btnEnviarPedido = document.getElementById("btnEnviarPedido");

// Modal de Sucesso
const orderSuccessModal = document.getElementById("orderSuccessModal");
const orderSuccessSummary = document.getElementById("orderSuccessSummary");

// =============================================================================
// RENDERIZAÇÃO DO MENU COM LAYOUT MODERNO (TAILWIND CSS)
// =============================================================================
function renderizarMenuMesa() {
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
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <span class="text-5xl block mb-3">🔍</span>
        <h4 class="text-lg font-bold text-plum font-serif mb-1">Nenhum prato ou bebida encontrado</h4>
        <p class="text-sm text-olive/80">Tente procurar com outro termo ou selecione a categoria "Todos".</p>
      </div>
    `;
    return;
  }

  filtrados.forEach(item => {
    const card = document.createElement("article");
    card.className = "bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group";

    const qtdNoCarrinho = carrinhoMesa[item.id] ? carrinhoMesa[item.id].qtd : 0;

    let botaoAcaoHtml = "";
    if (qtdNoCarrinho === 0) {
      botaoAcaoHtml = `
        <button onclick="adicionarAoCarrinho(${item.id})" class="bg-lavender hover:bg-lavender-dark text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-lavender/30 transition-all active:scale-95">
          <span>+ Adicionar</span>
        </button>
      `;
    } else {
      botaoAcaoHtml = `
        <div class="bg-mint border border-lavender/40 rounded-xl flex items-center p-1 gap-2 shadow-inner">
          <button onclick="diminuirQtd(${item.id})" class="w-7 h-7 bg-white text-plum rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm active:scale-90">-</button>
          <span class="font-black text-plum text-sm px-1">${qtdNoCarrinho}</span>
          <button onclick="aumentarQtd(${item.id})" class="w-7 h-7 bg-lavender text-white rounded-lg font-black text-sm flex items-center justify-center hover:bg-lavender-dark transition-colors shadow-sm active:scale-90">+</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="relative h-44 w-full rounded-2xl overflow-hidden mb-3 bg-slate-100">
          <img src="${item.imagem}" alt="${item.nome}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <span class="absolute top-2.5 left-2.5 bg-plum/90 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            ${item.tag || item.categoria}
          </span>
        </div>
        <div class="px-1">
          <h4 class="text-base font-extrabold text-plum font-serif leading-snug group-hover:text-lavender transition-colors mb-1">
            ${item.nome}
          </h4>
          <p class="text-xs text-olive/80 line-clamp-2 leading-relaxed mb-3">
            ${item.desc}
          </p>
        </div>
      </div>

      <div class="pt-2 px-1 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div>
          <span class="text-xs text-slate-400 block font-medium">Preço</span>
          <span class="text-lg font-black text-plum font-serif">${item.preco}</span>
        </div>
        <div id="action-item-${item.id}">
          ${botaoAcaoHtml}
        </div>
      </div>
    `;

    menuGrid.appendChild(card);
  });
}

// =============================================================================
// GESTÃO DO CARRINHO COM SISTEMA DE SOMA EM TEMPO REAL
// =============================================================================

function salvarCarrinho() {
  localStorage.setItem(`costa_in_cart_mesa_${NUMERO_MESA}`, JSON.stringify(carrinhoMesa));
  atualizarIndicadoresCarrinho();
}

function adicionarAoCarrinho(itemId) {
  const item = itensMenu.find(i => i.id === itemId);
  if (!item) return;

  if (carrinhoMesa[itemId]) {
    carrinhoMesa[itemId].qtd += 1;
  } else {
    carrinhoMesa[itemId] = {
      id: item.id,
      nome: item.nome,
      precoNum: item.precoNum,
      precoFormatado: item.preco,
      imagem: item.imagem,
      qtd: 1
    };
  }

  tocarFeedbackClique();
  salvarCarrinho();
  renderizarMenuMesa();
}

function aumentarQtd(itemId) {
  if (carrinhoMesa[itemId]) {
    carrinhoMesa[itemId].qtd += 1;
    tocarFeedbackClique();
    salvarCarrinho();
    renderizarMenuMesa();
    renderizarDrawerCarrinho();
  }
}

function diminuirQtd(itemId) {
  if (carrinhoMesa[itemId]) {
    carrinhoMesa[itemId].qtd -= 1;
    if (carrinhoMesa[itemId].qtd <= 0) {
      delete carrinhoMesa[itemId];
    }
    salvarCarrinho();
    renderizarMenuMesa();
    renderizarDrawerCarrinho();
  }
}

function removerItemCarrinho(itemId) {
  delete carrinhoMesa[itemId];
  salvarCarrinho();
  renderizarMenuMesa();
  renderizarDrawerCarrinho();
}

function calcularTotaisCarrinho() {
  let totalItens = 0;
  let valorTotal = 0;

  Object.values(carrinhoMesa).forEach(item => {
    totalItens += item.qtd;
    valorTotal += (item.precoNum * item.qtd);
  });

  return {
    totalItens,
    valorTotal: valorTotal.toFixed(2),
    valorTotalFormatado: valorTotal.toFixed(2) + "€"
  };
}

function atualizarIndicadoresCarrinho() {
  const { totalItens, valorTotalFormatado } = calcularTotaisCarrinho();

  if (navCartCount) navCartCount.textContent = totalItens;

  if (floatingCartBar) {
    if (totalItens > 0) {
      floatingCartBar.classList.remove("hidden");
      floatingCartBar.classList.add("flex");
      if (cartBadgeCount) cartBadgeCount.textContent = totalItens;
      if (cartTotalBar) cartTotalBar.textContent = valorTotalFormatado;
    } else {
      floatingCartBar.classList.add("hidden");
      floatingCartBar.classList.remove("flex");
    }
  }
}

// =============================================================================
// GAVETA / DRAWER DO CARRINHO (SLIDE-UP MODAL)
// =============================================================================

function abrirCarrinho() {
  renderizarDrawerCarrinho();
  if (cartDrawer && cartDrawerBackdrop) {
    cartDrawerBackdrop.classList.remove("hidden");
    cartDrawer.classList.remove("translate-y-full");
    document.body.style.overflow = "hidden";
  }
}

function fecharCarrinho() {
  if (cartDrawer && cartDrawerBackdrop) {
    cartDrawer.classList.add("translate-y-full");
    setTimeout(() => {
      cartDrawerBackdrop.classList.add("hidden");
      document.body.style.overflow = "";
    }, 250);
  }
}

function renderizarDrawerCarrinho() {
  const itens = Object.values(carrinhoMesa);
  const { totalItens, valorTotalFormatado } = calcularTotaisCarrinho();

  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";

  if (itens.length === 0) {
    if (cartEmptyState) cartEmptyState.classList.remove("hidden");
    if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = "0.00€";
    if (cartDrawerTotal) cartDrawerTotal.textContent = "0.00€";
    if (btnEnviarPedido) btnEnviarPedido.disabled = true;
    return;
  }

  if (cartEmptyState) cartEmptyState.classList.add("hidden");
  if (btnEnviarPedido) btnEnviarPedido.disabled = false;

  itens.forEach(item => {
    const itemSubtotal = (item.precoNum * item.qtd).toFixed(2);
    const row = document.createElement("div");
    row.className = "flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2.5";
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.imagem}" alt="${item.nome}" class="w-14 h-14 object-cover rounded-xl border border-slate-200">
        <div>
          <h5 class="text-sm font-extrabold text-plum font-serif leading-tight">${item.nome}</h5>
          <span class="text-xs text-olive font-semibold block">${item.precoFormatado} unid.</span>
          <span class="text-xs font-black text-lavender block mt-0.5">Subtotal: ${itemSubtotal}€</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="bg-white border border-slate-200 rounded-xl flex items-center p-1 gap-2 shadow-sm">
          <button onclick="diminuirQtd(${item.id})" class="w-6 h-6 bg-slate-100 text-plum rounded-lg font-black text-xs flex items-center justify-center hover:bg-slate-200">-</button>
          <span class="font-black text-plum text-xs px-1">${item.qtd}</span>
          <button onclick="aumentarQtd(${item.id})" class="w-6 h-6 bg-lavender text-white rounded-lg font-black text-xs flex items-center justify-center hover:bg-lavender-dark">+</button>
        </div>
        <button onclick="removerItemCarrinho(${item.id})" class="text-slate-400 hover:text-red-500 p-1 text-sm transition-colors" title="Remover item">🗑️</button>
      </div>
    `;
    cartItemsContainer.appendChild(row);
  });

  if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = valorTotalFormatado;
  if (cartDrawerTotal) cartDrawerTotal.textContent = valorTotalFormatado;
}

// =============================================================================
// CONFIRMAÇÃO E ENVIO DO PEDIDO DA MESA
// =============================================================================

function enviarPedidoMesa() {
  const itens = Object.values(carrinhoMesa);
  if (itens.length === 0) {
    alert("O seu pedido está vazio. Adicione pratos ou bebidas antes de enviar.");
    return;
  }

  const { totalItens, valorTotal, valorTotalFormatado } = calcularTotaisCarrinho();
  const obs = cartObservations ? cartObservations.value.trim() : "";
  const horaFormatada = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  const novoPedido = {
    id: 'ord_' + Date.now(),
    mesa: NUMERO_MESA,
    itens: itens,
    totalItens,
    valorTotal,
    valorTotalFormatado,
    obs,
    hora: horaFormatada,
    timestamp: Date.now(),
    status: 'pendente'
  };

  // 1. Guarda na lista de pedidos no LocalStorage
  const pedidosExistentes = JSON.parse(localStorage.getItem('costa_in_pedidos') || '[]');
  pedidosExistentes.unshift(novoPedido);
  localStorage.setItem('costa_in_pedidos', JSON.stringify(pedidosExistentes));

  // 2. Dispara no canal de sincronização local (BroadcastChannel)
  if (syncChannel) {
    syncChannel.postMessage({ type: 'NOVO_PEDIDO_MESA', payload: novoPedido });
  }
  localStorage.setItem('costa_in_sync_ping', JSON.stringify({ event: 'PEDIDO', time: Date.now(), mesa: NUMERO_MESA }));

  // 3. Dispara na Nuvem em Tempo Real (Cross-device para iPhone 15 -> Computador)
  try {
    fetch('https://ntfy.sh/costa_in_beach_bar_sync_caparica', {
      method: 'POST',
      headers: {
        'Title': `🍽️ NOVO PEDIDO DA MESA ${NUMERO_MESA}`,
        'Priority': 'urgent',
        'Tags': 'plate,bell'
      },
      body: JSON.stringify({ type: 'NOVO_PEDIDO_MESA', payload: novoPedido })
    }).catch(() => {});
  } catch (err) {}

  // 4. Som de sucesso
  tocarFeedbackSucesso();

  // 5. Limpa o carrinho da mesa atual
  carrinhoMesa = {};
  salvarCarrinho();
  renderizarMenuMesa();
  fecharCarrinho();

  // 6. Exibe a tela de confirmação
  exibirModalSucessoPedido(novoPedido);
}

function exibirModalSucessoPedido(pedido) {
  if (!orderSuccessModal) return;

  if (orderSuccessSummary) {
    let itensHtml = pedido.itens.map(it => `
      <div class="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
        <span class="font-bold text-plum">${it.qtd}x ${it.nome}</span>
        <span class="font-black text-lavender">${(it.precoNum * it.qtd).toFixed(2)}€</span>
      </div>
    `).join("");

    orderSuccessSummary.innerHTML = `
      <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-3 text-left">
        <div class="flex justify-between text-xs font-semibold text-olive mb-2">
          <span>Mesa ${pedido.mesa}</span>
          <span>Registado às ${pedido.hora}</span>
        </div>
        ${itensHtml}
        ${pedido.obs ? `<p class="text-xs text-slate-500 mt-2 italic bg-white p-2 rounded-lg border border-slate-200"><strong>Obs:</strong> "${pedido.obs}"</p>` : ''}
        <div class="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 text-sm font-black text-plum">
          <span>Total do Pedido:</span>
          <span class="text-base text-lavender">${pedido.valorTotalFormatado}</span>
        </div>
      </div>
    `;
  }

  orderSuccessModal.classList.remove("hidden");
  orderSuccessModal.classList.add("flex");
}

function fecharModalSucessoPedido() {
  if (orderSuccessModal) {
    orderSuccessModal.classList.add("hidden");
    orderSuccessModal.classList.remove("flex");
  }
}

// =============================================================================
// BOTÃO FLUTUANTE DE CHAMAR O GARÇOM (CALL)
// =============================================================================

function abrirModalChamada() {
  const modal = document.getElementById("modalCallTable");
  const form = document.getElementById("formCallWaiter");
  const successBox = document.getElementById("callSuccessBox");
  const selectedTableInput = document.getElementById("selectedTableNumber");
  const tableSelectedDisplay = document.getElementById("tableSelectedDisplay");

  if (!modal) return;

  if (selectedTableInput) selectedTableInput.value = NUMERO_MESA;
  if (tableSelectedDisplay) tableSelectedDisplay.innerHTML = `Mesa ${NUMERO_MESA}`;

  modal.style.display = "flex";
  if (successBox) successBox.style.display = "none";
  if (form) form.style.display = "block";
}

function fecharModalChamada() {
  const modal = document.getElementById("modalCallTable");
  if (modal) modal.style.display = "none";
}

const formCallWaiter = document.getElementById("formCallWaiter");
if (formCallWaiter) {
  formCallWaiter.addEventListener("submit", (e) => {
    e.preventDefault();
    const motivo = document.getElementById("callReason") ? document.getElementById("callReason").value : "Atendimento";
    const horaAtual = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const novaChamada = {
      id: 'call_' + Date.now(),
      mesa: NUMERO_MESA,
      motivo: motivo,
      hora: horaAtual,
      timestamp: Date.now(),
      status: 'ativa'
    };

    const chamadasExistentes = JSON.parse(localStorage.getItem('costa_in_chamadas') || '[]');
    chamadasExistentes.unshift(novaChamada);
    localStorage.setItem('costa_in_chamadas', JSON.stringify(chamadasExistentes));

    if (syncChannel) {
      syncChannel.postMessage({ type: 'CHAMADA_MESA', payload: novaChamada });
    }
    localStorage.setItem('costa_in_sync_ping', JSON.stringify({ event: 'CHAMADA', time: Date.now(), mesa: NUMERO_MESA }));

    try {
      fetch('https://ntfy.sh/costa_in_beach_bar_sync_caparica', {
        method: 'POST',
        headers: { 'Title': `🚨 Chamada da Mesa ${NUMERO_MESA}`, 'Priority': 'urgent', 'Tags': 'bell' },
        body: JSON.stringify({ type: 'CHAMADA_MESA', payload: novaChamada })
      }).catch(() => {});
    } catch (err) {}

    tocarFeedbackSucesso();

    formCallWaiter.style.display = "none";
    const callSuccessBox = document.getElementById("callSuccessBox");
    if (callSuccessBox) callSuccessBox.style.display = "block";
    const callSuccessMsg = document.getElementById("callSuccessMsg");
    if (callSuccessMsg) {
      callSuccessMsg.innerHTML = `O alerta para a <strong>Mesa ${NUMERO_MESA}</strong> (${motivo}) foi enviado ao balcão! O funcionário já se dirige até si.`;
    }
  });
}

// Feedback acústico suave (Web Audio API)
function tocarFeedbackClique() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {}
}

function tocarFeedbackSucesso() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
}

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

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Atualiza número da mesa no cabeçalho
  const topbarText = document.getElementById("topbarTableText");
  if (topbarText) {
    topbarText.textContent = `Mesa ${NUMERO_MESA} Conectada`;
  }
  const heroTableTitle = document.getElementById("heroTableTitle");
  if (heroTableTitle) {
    heroTableTitle.textContent = `Ementa da Mesa ${NUMERO_MESA}`;
  }

  // Filtros de Categoria
  if (menuTabsContainer) {
    menuTabsContainer.addEventListener("click", (e) => {
      const pill = e.target.closest(".cat-pill-tw");
      if (!pill) return;
      document.querySelectorAll(".cat-pill-tw").forEach(p => {
        p.classList.remove("active", "bg-lavender", "text-white", "shadow-md");
        p.classList.add("bg-white", "text-plum", "border", "border-slate-200");
      });
      pill.classList.add("active", "bg-lavender", "text-white", "shadow-md");
      pill.classList.remove("bg-white", "text-plum", "border", "border-slate-200");
      categoriaAtiva = pill.dataset.category || "todos";
      renderizarMenuMesa();
    });
  }

  // Pesquisa
  if (menuSearchInput) {
    menuSearchInput.addEventListener("input", (e) => {
      termoBusca = e.target.value.trim().toLowerCase();
      renderizarMenuMesa();
    });
  }

  renderizarMenuMesa();
  atualizarIndicadoresCarrinho();
});
