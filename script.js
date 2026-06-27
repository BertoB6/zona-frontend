// ==================== CONFIGURAÇÃO ====================
const API_URL = 'https://zona-backend-v3h1.onrender.com';

// ==================== VARIÁVEIS GLOBAIS ====================
let jogos = [];
let jogosFiltrados = [];
let jogoSelecionado = null;
let votosUsuario = JSON.parse(localStorage.getItem('votos') || '{}');
let currentSlide = 0;
let carouselInterval = null;

// ==================== ELEMENTOS DOM ====================
const container = document.getElementById('gamesGrid');
const destaqueSection = document.getElementById('destaqueSection');
const destaqueGrid = document.getElementById('destaqueGrid');
const bannerSection = document.getElementById('bannerSection');
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeMenu = document.getElementById('closeMenu');

// Elementos do menu
const menuHome = document.getElementById('menuHome');
const menuApresentacao = document.getElementById('menuApresentacao');
const menuSuporte = document.getElementById('menuSuporte');

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando...');
    carregarJogosAPI();
    initTheme();
    initMenu();
    initSearch();
});

// ==================== MODO ESCURO/CLARO ====================
function initTheme() {
    if (!themeToggle) return;
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '🌙';
    }
    themeToggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '☀️';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '🌙';
        }
    });
}

// ==================== MENU ====================
function initMenu() {
    if (menuBtn) menuBtn.addEventListener('click', function() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
    });
    if (closeMenu) closeMenu.addEventListener('click', fecharMenu);
    if (overlay) overlay.addEventListener('click', fecharMenu);
    if (menuHome) menuHome.addEventListener('click', function() { fecharMenu(); renderizarJogos(jogos); });
    if (menuApresentacao) menuApresentacao.addEventListener('click', function() { fecharMenu(); mostrarApresentacao(); });
    if (menuSuporte) menuSuporte.addEventListener('click', function() { fecharMenu(); mostrarSuporte(); });
}

function fecharMenu() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// ==================== BUSCA ====================
function initSearch() {
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const termo = e.target.value.trim();
            if (!termo) {
                jogosFiltrados = [...jogos];
            } else {
                jogosFiltrados = jogos.filter(function(jogo) {
                    return jogo.nome.toLowerCase().includes(termo.toLowerCase()) ||
                           jogo.categoria.toLowerCase().includes(termo.toLowerCase()) ||
                           jogo.plataforma.toLowerCase().includes(termo.toLowerCase());
                });
            }
            renderizarJogos(jogosFiltrados);
        });
    }
}

// ==================== CARREGAR JOGOS ====================
async function carregarJogosAPI() {
    try {
        console.log('Carregando jogos da API...');
        const response = await fetch(API_URL + '/api/jogos');
        if (!response.ok) throw new Error('Erro na resposta da API');
        const data = await response.json();
        console.log('Dados recebidos:', data);
        jogos = data.jogos || [];
        jogosFiltrados = [...jogos];
        renderizarJogos(jogosFiltrados);
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:50px;"><h3>❌ Erro ao carregar jogos</h3><p>Verifique sua conexão</p><button onclick="location.reload()" style="padding:10px 20px;background:#ff004f;border:none;border-radius:8px;color:white;cursor:pointer;">Tentar novamente</button></div>';
        }
    }
}

// ==================== RENDERIZAR JOGOS ====================
function renderizarJogos(jogosArray) {
    if (!container) return;
    if (!jogosArray || jogosArray.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:50px;"><h3>🔍 Nenhum jogo encontrado</h3></div>';
        return;
    }

    // ============================================================
    // 1. BANNER (carrossel) - PRIMEIRO
    // ============================================================
    const banners = jogosArray.filter(function(j) { return j.banner === true; }).slice(0, 5);
    if (banners.length > 0 && bannerSection && carouselTrack) {
        bannerSection.style.display = 'block';
        carouselTrack.innerHTML = '';
        carouselDots.innerHTML = '';
        banners.forEach(function(jogo, index) {
            var imgUrl = jogo.imagem && jogo.imagem.startsWith('http') ? jogo.imagem : (API_URL + '/imagens/' + jogo.imagem + '.jpg');
            var slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = '<img src="' + imgUrl + '" onerror="this.src=\'https://via.placeholder.com/1200x200?text=' + encodeURIComponent(jogo.nome) + '\'"><div class="carousel-caption"><h3>' + jogo.nome + '</h3><button class="btn-download ' + (jogo.pago ? 'btn-paid' : 'btn-free') + '" onclick="window.location.href=\'' + (jogo.pago ? 'checkout.html?jogo=' + jogo.id : 'download.html?jogo=' + jogo.id) + '\'">' + (jogo.pago ? '💰 Comprar' : '⬇️ Download') + '</button></div>';
            carouselTrack.appendChild(slide);
            var dot = document.createElement('div');
            dot.className = 'dot';
            dot.onclick = function() { irParaSlide(index); };
            carouselDots.appendChild(dot);
        });
        currentSlide = 0;
        atualizarDots();
        if (carouselInterval) clearInterval(carouselInterval);
        carouselInterval = setInterval(function() {
            var slides = document.querySelectorAll('.carousel-slide');
            if (slides.length > 0) irParaSlide(currentSlide + 1);
        }, 5000);
        if (prevBtn) prevBtn.onclick = function() { irParaSlide(currentSlide - 1); };
        if (nextBtn) nextBtn.onclick = function() { irParaSlide(currentSlide + 1); };
    } else if (bannerSection) {
        bannerSection.style.display = 'none';
    }

    // ============================================================
    // 2. DESTAQUES (fixados) - SEGUNDO
    // ============================================================
    const destaques = jogosArray.filter(function(j) { return j.destaque === true; }).slice(0, 3);
    if (destaques.length > 0 && destaqueSection && destaqueGrid) {
        destaqueSection.style.display = 'block';
        destaqueGrid.innerHTML = '';
        destaques.forEach(function(jogo) {
            destaqueGrid.appendChild(criarCard(jogo, true));
        });
    } else if (destaqueSection) {
        destaqueSection.style.display = 'none';
    }

    // ============================================================
    // 3. JOGOS NORMAIS (ordenados por likes: do maior para o menor) - TERCEIRO
    // ============================================================
    var normais = jogosArray.filter(function(j) { return j.destaque !== true; });

    // ORDENAR POR LIKES (maior para menor)
    normais.sort(function(a, b) {
        return (b.likes || 0) - (a.likes || 0);
    });

    container.innerHTML = '';
    if (normais.length === 0 && destaques.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:50px;"><h3>🔍 Nenhum jogo encontrado</h3></div>';
        return;
    }

    normais.forEach(function(jogo) {
        container.appendChild(criarCard(jogo, false));
    });
}

// ==================== FUNÇÕES DO CARROSSEL ====================
function irParaSlide(index) {
    var slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    currentSlide = index;
    if (carouselTrack) carouselTrack.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    atualizarDots();
}

function atualizarDots() {
    var dots = document.querySelectorAll('.dot');
    dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === currentSlide);
    });
}

// ==================== CRIAR CARD ====================
function criarCard(jogo, isDestaque) {
    var card = document.createElement('div');
    card.className = 'game-card';
    if (isDestaque) card.classList.add('destaque-card');

    var imgUrl = jogo.imagem && jogo.imagem.startsWith('http') ? jogo.imagem : (API_URL + '/imagens/' + jogo.imagem + '.jpg');
    var badgeClass = jogo.pago ? 'badge-paid' : 'badge-free';
    var badgeText = jogo.pago ? '💰 ' + jogo.preco : '🎁 Grátis';
    var isLiked = votosUsuario[jogo.id] === 'like';
    var isDisliked = votosUsuario[jogo.id] === 'dislike';

    card.innerHTML = '<div class="price-badge ' + badgeClass + '">' + badgeText + '</div>' +
        '<img src="' + imgUrl + '" alt="' + jogo.nome + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/400x300?text=' + encodeURIComponent(jogo.nome) + '\'" onclick="window.location.href=\'download.html?jogo=' + jogo.id + '\'">' +
        '<div class="game-info">' +
            '<div class="game-title" onclick="window.location.href=\'download.html?jogo=' + jogo.id + '\'">' + jogo.nome + '</div>' +
            '<div class="game-desc">' + (jogo.descricao_curta || jogo.categoria) + '</div>' +
            '<div class="rating">' +
                '<button class="like-btn ' + (isLiked ? 'active' : '') + '" onclick="votar(' + jogo.id + ', \'like\', event)">👍 <span>' + (jogo.likes || 0) + '</span></button>' +
                '<button class="dislike-btn ' + (isDisliked ? 'active' : '') + '" onclick="votar(' + jogo.id + ', \'dislike\', event)">👎 <span>' + (jogo.dislikes || 0) + '</span></button>' +
            '</div>' +
            '<div class="size">📦 ' + (jogo.tamanho || 'Tamanho não informado') + '</div>' +
            '<button class="btn-download ' + (jogo.pago ? 'btn-paid' : 'btn-free') + '" onclick="baixarJogo(' + jogo.id + ')">' + (jogo.pago ? '💰 Comprar ' + jogo.preco : '⬇️ Baixar Grátis') + '</button>' +
        '</div>';

    return card;
}

// ==================== VOTAR ====================
async function votar(jogoId, tipo, event) {
    if (event) event.stopPropagation();
    var jogo = jogos.find(function(j) { return j.id === jogoId; });
    if (!jogo) return;

    var votoAtual = votosUsuario[jogoId];

    if (votoAtual === tipo) {
        delete votosUsuario[jogoId];
        if (tipo === 'like') jogo.likes--;
        else jogo.dislikes--;
    } else {
        if (votoAtual === 'like') jogo.likes--;
        if (votoAtual === 'dislike') jogo.dislikes--;
        votosUsuario[jogoId] = tipo;
        if (tipo === 'like') jogo.likes++;
        else jogo.dislikes++;
    }

    localStorage.setItem('votos', JSON.stringify(votosUsuario));

    try {
        await fetch(API_URL + '/api/avaliacao/' + jogoId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likes: jogo.likes, dislikes: jogo.dislikes })
        });
    } catch (e) { console.error('Erro ao salvar voto:', e); }

    renderizarJogos(jogosFiltrados);
}

// ==================== BAIXAR JOGO ====================
function baixarJogo(id) {
    var jogo = jogos.find(function(j) { return j.id === id; });
    if (!jogo) return;
    if (jogo.pago) {
        window.location.href = 'checkout.html?jogo=' + id;
    } else {
        window.location.href = 'download.html?jogo=' + id;
    }
}

// ==================== APRESENTAÇÃO ====================
function mostrarApresentacao() {
    var totalPSP = jogos.filter(function(j) { return j.plataforma === 'PSP'; }).length;
    var totalAPK = jogos.filter(function(j) { return j.plataforma === 'APK Android'; }).length;
    if (container) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;"><h2 style="color:#ff004f;">📖 Sobre a ZonaXP</h2><div style="background:#111;padding:20px;border-radius:15px;margin-top:15px;"><p>Plataforma de distribuição de jogos para PSP, PS2, PC e APK Android.</p><p>🎮 ' + totalPSP + ' jogos PSP | 📱 ' + totalAPK + ' jogos APK</p><p>Total: ' + jogos.length + ' jogos disponíveis!</p></div></div>';
        if (destaqueSection) destaqueSection.style.display = 'none';
        if (bannerSection) bannerSection.style.display = 'none';
    }
    fecharMenu();
}

function mostrarSuporte() {
    if (container) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;"><h2 style="color:#ff004f;">🛡️ Suporte</h2><div style="background:#111;padding:20px;border-radius:15px;margin-top:15px;"><p>📧 Email: suporte@zonaxp.com</p><p>📱 WhatsApp: +258 85 811 2264</p><p>📢 Canal: <a href="https://whatsapp.com/channel/0029Vb7YAqi3bbV9tuuiyC1p" target="_blank" style="color:#00ff9c;">Clique aqui</a></p></div></div>';
        if (destaqueSection) destaqueSection.style.display = 'none';
        if (bannerSection) bannerSection.style.display = 'none';
    }
    fecharMenu();
}

// ==================== EXPOR FUNÇÕES GLOBAIS ====================
window.votar = votar;
window.baixarJogo = baixarJogo;
window.irParaSlide = irParaSlide;