// ============================================================
// Costa In Beach Bar — app.js
// ============================================================

// 1. Dados do Bar / Balcão
const NUMERO_BAR = "351912345678"; // Substitui pelo número de WhatsApp do estabelecimento
const LINK_GOOGLE_REVIEW = "https://g.page/r/SEU_LINK_AQUI/review"; // Link de avaliação do Google

// 2. Base de dados da ementa
//    Cada item pode ter: id, nome, categoria, preco, desc, emoji
const pratos = [
  {
    id: 1,
    nome: "Tosta Mista em Pão Alentejano",
    categoria: "Petiscos",
    preco: "5.50€",
    desc: "Queijo, fiambre e manteiga de ervas.",
    emoji: "🥪"
  },
  {
    id: 2,
    nome: "Chocos Fritos à Setubalense",
    categoria: "Petiscos",
    preco: "11.00€",
    desc: "Acompanha maionese de alho.",
    emoji: "🦑"
  },
  {
    id: 3,
    nome: "Cerveja Imperial 20cl",
    categoria: "Bebidas",
    preco: "1.80€",
    desc: "Bem fresquinha.",
    emoji: "🍺"
  },
  {
    id: 4,
    nome: "Caipirinha Tradicional",
    categoria: "Bebidas",
    preco: "6.50€",
    desc: "Cachaça, lima e açúcar amarelo.",
    emoji: "🍹"
  },
  {
    id: 5,
    nome: "Salada de Polvo da Costa",
    categoria: "Pratos",
    preco: "12.50€",
    desc: "Polvo fresco, cebola, pimentos e azeite virgem.",
    emoji: "🐙"
  }
];

// 3. Tag visual por categoria
function getTag(categoria) {
  const tags = {
    "Petiscos": { label: "Petisco", css: "menu-tag-petisco" },
    "Bebidas":  { label: "Bebida",  css: "menu-tag-bebida"  },
    "Pratos":   { label: "Prato",   css: "menu-tag-prato"   }
  };
  const t = tags[categoria] || { label: categoria, css: "" };
  return `<span class="menu-tag ${t.css}">${t.label}</span>`;
}

// 4. Renderizar itens na página
const menuList = document.getElementById("menuList");

function renderMenu(itens) {
  menuList.innerHTML = "";

  if (itens.length === 0) {
    menuList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌊</div>
        <p>Nenhum item nesta categoria de momento.</p>
      </div>`;
    return;
  }

  itens.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="menu-card-left">
        <div class="menu-emoji">${item.emoji || "🍽️"}</div>
        <div class="menu-info">
          <h4>${item.nome}</h4>
          <p>${item.desc}</p>
        </div>
      </div>
      <div class="menu-price-wrap">
        <span class="menu-price">${item.preco}</span>
        ${getTag(item.categoria)}
      </div>
    `;
    menuList.appendChild(card);
  });
}

// 5. Filtrar por Categoria
function filtrarMenu(categoria) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  event.target.classList.add("active");

  if (categoria === "todos") {
    renderMenu(pratos);
  } else {
    const filtrados = pratos.filter(item => item.categoria === categoria);
    renderMenu(filtrados);
  }
}

// 6. Controlo dos Modais
function abrirModalChamar() {
  document.getElementById("modalChamar").style.display = "flex";
}

function abrirModalAvaliacao() {
  document.getElementById("modalAvaliacao").style.display = "flex";
}

function fecharModais() {
  document.getElementById("modalChamar").style.display = "none";
  document.getElementById("modalAvaliacao").style.display = "none";
}

// Fechar modal ao clicar fora do conteúdo
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) fecharModais();
});

// 7. Ação: Chamar para Retirar via WhatsApp
function enviarChamadaWhatsApp() {
  const cliente = document.getElementById("identificacaoCliente").value.trim();
  if (!cliente) {
    alert("Por favor, indica a tua mesa ou nome.");
    return;
  }
  const mensagem = encodeURIComponent(
    `🛎️ Olá! O pedido da ${cliente} está pronto para retirar. — Costa In Beach Bar`
  );
  window.open(`https://wa.me/${NUMERO_BAR}?text=${mensagem}`, "_blank");
  fecharModais();
  document.getElementById("identificacaoCliente").value = "";
}

// 8. Ação: Enviar Agradecimento + Link Google Review
function enviarLinkAvaliacao() {
  const telefone = document.getElementById("telefoneCliente").value.trim().replace(/\D/g, "");
  if (!telefone) {
    alert("Por favor, insere o telemóvel do cliente.");
    return;
  }
  const textoAgradecimento = encodeURIComponent(
    `🌊☀️ Muito obrigado pela tua visita ao Costa In Beach Bar!\n` +
    `A tua opinião é fundamental para nós. Podes deixar uma avaliação rápida no Google? Leva menos de 1 minuto:\n` +
    `${LINK_GOOGLE_REVIEW}`
  );
  window.open(`https://wa.me/${telefone}?text=${textoAgradecimento}`, "_blank");
  fecharModais();
  document.getElementById("telefoneCliente").value = "";
}

// Inicializar
renderMenu(pratos);
