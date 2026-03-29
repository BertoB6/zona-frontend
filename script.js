// ==================== LISTA DE 12 JOGOS ====================
const jogos = [
    {
        id: 1,
        nome: "Mortal Kombat 11",
        categoria: "Luta",
        plataforma: "PSP",
        imagem: "mortal1",
        download: "checkout.html",
        pago: true,
        preco: "25 MT"
    },
    {
        id: 2,
        nome: "Need for Speed",
        categoria: "Corrida",
        plataforma: "PSP",
        imagem: "need1",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    },
    {
        id: 3,
        nome: "FC Mobile 24",
        categoria: "Futebol",
        plataforma: "PSP",
        imagem: "Fc1",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    },
    {
        id: 4,
        nome: "Naruto Shippuden Ultimate Ninja",
        categoria: "Luta",
        plataforma: "PSP",
        imagem: "naruto1",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    },
    {
        id: 5,
        nome: "EA FC 26",
        categoria: "Futebol",
        plataforma: "PSP",
        imagem: "Eafc1",
        download: "checkout.html",
        pago: true,
        preco: "25 MT"
    },
    {
        id: 6,
        nome: "God of War - Ghost of Sparta",
        categoria: "Aventura",
        plataforma: "PSP",
        imagem: "Godof",
        download: "checkout.html",
        pago: true,
        preco: "25 MT"
    },
    {
        id: 7,
        nome: "Dream League Soccer Mod",
        categoria: "Futebol",
        plataforma: "APK Android",
        imagem: "Dls1",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    },
    {
        id: 8,
        nome: "Dream League Soccer Mod Real Madrid",
        categoria: "Futebol",
        plataforma: "APK Android",
        imagem: "dls2",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    },
    {
        id: 9,
        nome: "FIFA 21 Mod 14",
        categoria: "Futebol",
        plataforma: "APK Android",
        imagem: "Fifa1",
        download: "checkout.html",
        pago: true,
        preco: "25 MT"
    },
    {
        id: 10,
        nome: "eFootball 26 Mod Africa",
        categoria: "Futebol",
        plataforma: "APK Android",
        imagem: "Efootball1",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    },
    {
        id: 11,
        nome: "DFL 26",
        categoria: "Futebol",
        plataforma: "APK Android",
        imagem: "DFL26",
        download: "checkout.html",
        pago: true,
        preco: "25 MT"
    },
    {
        id: 12,
        nome: "James Bond",
        categoria: "Missão",
        plataforma: "PSP",
        imagem: "james1",
        download: "compartilhar.html",
        pago: false,
        preco: ""
    }
];

// Variáveis globais
let jogosFiltrados = [...jogos];
let jogoSelecionado = null;

// Elementos DOM
const container = document.getElementById("games");
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const closeMenu = document.getElementById("closeMenu");
const searchBtn = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const searchInput = document.getElementById("searchInput");
const popup = document.getElementById("popup");
const priceText = document.getElementById("priceText");
const btnDownloadPremium = document.getElementById("btnDownloadPremium");

// Elementos do menu
const menuHome = document.getElementById("menuHome");
const menuApresentacao = document.getElementById("menuApresentacao");
const menuSuporte = document.getElementById("menuSuporte");

// ==================== FUNÇÕES PRINCIPAIS ====================

// Função para renderizar jogos no grid 2x2
function renderizarJogos(jogosArray) {
    if (!container) return;
    
    container.innerHTML = "";
    
    if (jogosArray.length === 0) {
        container.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 50px;"><h3>🔍 Nenhum jogo encontrado</h3><p>Tente outra busca</p></div>';
        return;
    }
    
    jogosArray.forEach(jogo => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Definir ícone da plataforma
        const plataformaIcon = jogo.plataforma === "APK Android" ? "📱" : "🎮";
        
        // CORREÇÃO: caminho correto das imagens na pasta imagens/
        const imagemPath = `imagens/${jogo.imagem}.jpg`;
        
        card.innerHTML = `
            <img src="${imagemPath}" alt="${jogo.nome}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(jogo.nome)}'">
            <h3>${jogo.nome}</h3>
            <div>
                <span class="categoria">${jogo.categoria}</span>
                <span class="plataforma">${plataformaIcon} ${jogo.plataforma}</span>
            </div>
            <button class="btn" data-id="${jogo.id}">Download</button>
        `;
        
        const btn = card.querySelector('.btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            baixar(jogo);
        });
        
        container.appendChild(card);
    });
}

// Função principal de download
function baixar(jogo) {
    if (jogo.pago) {
        // Jogo pago: abre popup com preço
        jogoSelecionado = jogo;
        if (popup && priceText) {
            priceText.innerHTML = `${jogo.preco}<br><span style="font-size: 0.9rem; color: #888;">${jogo.nome}</span>`;
            popup.style.display = "flex";
        }
    } else {
        // Jogo grátis: redireciona para compartilhar.html
        if (jogo.download && jogo.download !== "#") {
            window.location.href = jogo.download;
        } else {
            alert(`Acesso a ${jogo.nome} requer partilha!\n\nVocê será redirecionado para a página de compartilhamento.`);
            window.location.href = "compartilhar.html";
        }
    }
}

// Função para baixar jogo premium após confirmação
function baixarPremium() {
    if (jogoSelecionado && jogoSelecionado.download) {
        window.open(jogoSelecionado.download, "_blank");
        fecharPopup();
    } else {
        alert("Link de download indisponível no momento.");
    }
}

// Fechar popup
function fecharPopup() {
    if (popup) {
        popup.style.display = "none";
    }
    jogoSelecionado = null;
}

// Buscar jogos em tempo real
function buscarJogos(termo) {
    if (!termo.trim()) {
        jogosFiltrados = [...jogos];
    } else {
        jogosFiltrados = jogos.filter(jogo => 
            jogo.nome.toLowerCase().includes(termo.toLowerCase()) ||
            jogo.categoria.toLowerCase().includes(termo.toLowerCase()) ||
            jogo.plataforma.toLowerCase().includes(termo.toLowerCase())
        );
    }
    renderizarJogos(jogosFiltrados);
}

// Funções do menu
function mostrarHome() {
    renderizarJogos(jogos);
    fecharMenu();
    fecharBarraPesquisa();
}

function mostrarApresentacao() {
    const totalPSP = jogos.filter(j => j.plataforma === "PSP").length;
    const totalAPK = jogos.filter(j => j.plataforma === "APK Android").length;
    
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
            <h2 style="color: #ff004f; margin-bottom: 20px;">📖 Sobre a ZonaXP</h2>
            <div style="background: #111; padding: 30px; border-radius: 15px; border: 1px solid #ff004f;">
                <p style="margin-bottom: 15px; line-height: 1.6;">A ZonaXP é uma plataforma dedicada à distribuição de jogos para PSP e dispositivos mobile.</p>
                <p style="margin-bottom: 15px; line-height: 1.6;">Nosso objetivo é oferecer os melhores jogos de forma prática e segura para nossa comunidade.</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
                    <div style="background: rgba(255,0,79,0.2); padding: 10px 20px; border-radius: 10px;">
                        <span style="font-size: 2rem;">🎮</span>
                        <p style="font-size: 1.5rem; font-weight: bold;">${totalPSP}</p>
                        <p>Jogos PSP</p>
                    </div>
                    <div style="background: rgba(0,255,156,0.2); padding: 10px 20px; border-radius: 10px;">
                        <span style="font-size: 2rem;">📱</span>
                        <p style="font-size: 1.5rem; font-weight: bold;">${totalAPK}</p>
                        <p>APK Mobile</p>
                    </div>
                </div>
                <p style="color: #00ff9c;">🎮 Total: ${jogos.length} jogos disponíveis!</p>
            </div>
        </div>
    `;
    fecharMenu();
    fecharBarraPesquisa();
}

function mostrarSuporte() {
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
            <h2 style="color: #ff004f; margin-bottom: 20px;">🛡️ Suporte ZonaXP</h2>
            <div style="background: #111; padding: 30px; border-radius: 15px; border: 1px solid #ff004f;">
                <p style="margin-bottom: 20px;">Precisa de ajuda? Entre em contato conosco:</p>
                <p style="margin-bottom: 15px;">📧 Email: suporte@zonaxp.com</p>
                <p style="margin-bottom: 15px;">📱 WhatsApp: <a href="https://wa.me/258858112264" target="_blank" style="color: #00ff9c;">+258 85 811 2264</a></p>
                <p style="margin-bottom: 15px;">📺 Canal no WhatsApp: <a href="https://wa.me/258858112264" target="_blank" style="color: #00ff9c;">Clique aqui</a></p>
                <hr style="margin: 20px 0; border-color: #333;">
                <p style="color: #888;">💡 Dúvidas sobre downloads? Nos chame no WhatsApp!</p>
                <p style="color: #888; margin-top: 10px;">🎮 Para jogos PSP: Use o emulador PPSSPP</p>
                <p style="color: #888;">📱 Para APK: Instale diretamente no Android</p>
            </div>
        </div>
    `;
    fecharMenu();
    fecharBarraPesquisa();
}

// ==================== FUNÇÕES DE UI ====================

// Abrir/fechar menu lateral
function abrirMenu() {
    sideMenu.classList.add('active');
    overlay.classList.add('active');
}

function fecharMenu() {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
}

// Abrir/fechar barra de pesquisa
function toggleSearchBar() {
    searchBar.classList.toggle('active');
    if (searchBar.classList.contains('active')) {
        searchInput.focus();
        if (searchInput.value === '') {
            renderizarJogos(jogos);
        }
    }
}

function fecharBarraPesquisa() {
    searchBar.classList.remove('active');
    if (searchInput) {
        searchInput.value = '';
        renderizarJogos(jogos);
    }
}

// ==================== EVENTOS ====================

// Menu
if (menuBtn) {
    menuBtn.addEventListener('click', abrirMenu);
}

if (closeMenu) closeMenu.addEventListener('click', fecharMenu);
if (overlay) overlay.addEventListener('click', fecharMenu);

// Pesquisa
if (searchBtn) {
    searchBtn.addEventListener('click', toggleSearchBar);
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        buscarJogos(e.target.value);
    });
}

// Opções do menu
if (menuHome) menuHome.addEventListener('click', mostrarHome);
if (menuApresentacao) menuApresentacao.addEventListener('click', mostrarApresentacao);
if (menuSuporte) menuSuporte.addEventListener('click', mostrarSuporte);

// Botão de download premium
if (btnDownloadPremium) {
    btnDownloadPremium.addEventListener('click', baixarPremium);
}

// Fechar popup ao clicar fora
if (popup) {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            fecharPopup();
        }
    });
}

// Fechar barra de pesquisa ao clicar fora
document.addEventListener('click', (e) => {
    if (searchBar.classList.contains('active')) {
        if (!searchBar.contains(e.target) && e.target !== searchBtn) {
            fecharBarraPesquisa();
        }
    }
});

// ==================== INICIALIZAÇÃO ====================
renderizarJogos(jogos);
