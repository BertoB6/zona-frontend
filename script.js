// ==================== CONFIGURAÇÃO DO BACKEND ====================
const API_URL = 'https://zona-backend-v3h1.onrender.com';

// ==================== CARREGAR JOGOS DO BACKEND ====================
let jogos = [];
let jogosFiltrados = [];
let jogoSelecionado = null;

// Elementos DOM - CORRIGIDOS para o index.html atual
const container = document.getElementById("gamesGrid");
const destaqueSection = document.getElementById("destaqueSection");
const destaqueGrid = document.getElementById("destaqueGrid");
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const closeMenu = document.getElementById("closeMenu");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

// Elementos do menu
const menuHome = document.getElementById("menuHome");
const menuApresentacao = document.getElementById("menuApresentacao");
const menuSuporte = document.getElementById("menuSuporte");

// ==================== FUNÇÕES PRINCIPAIS ====================

// Carregar jogos da API
async function carregarJogosAPI() {
    try {
        console.log('Carregando jogos da API...');
        const response = await fetch(`${API_URL}/api/jogos`);
        const data = await response.json();
        console.log('Dados recebidos:', data);
        jogos = data.jogos;
        jogosFiltrados = [...jogos];
        renderizarJogos(jogosFiltrados);
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 50px;"><h3>❌ Erro ao carregar jogos</h3><p>Verifique se o backend está funcionando</p></div>';
        }
    }
}


// Função para renderizar jogos (ordenado por likes apenas)
function renderizarJogos(jogosArray) {
    if (!container) return;
    
    // Ordenar por likes (do maior para o menor)
    const jogosOrdenados = [...jogosArray].sort((a, b) => {
        return (b.likes || 0) - (a.likes || 0);
    });
    
    container.innerHTML = "";
    if (jogosOrdenados.length === 0) {
        container.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 50px;"><h3>🔍 Nenhum jogo encontrado</h3><p>Tente outra busca</p></div>';
        return;
    }
    
    jogosOrdenados.forEach(jogo => {
        const card = criarCard(jogo, false);
        container.appendChild(card);
    });
    
    // Esconder seção de destaques (já que não precisas dela)
    if (destaqueSection) {
        destaqueSection.style.display = 'none';
    }
}

// Função para criar um card de jogo - CORRIGIDA
function criarCard(jogo, isDestaque) {
    const card = document.createElement('div');
    card.className = 'game-card';
    if (isDestaque) card.classList.add('destaque-card');
    
    const plataformaIcon = jogo.plataforma === "APK Android" ? "📱" : "🎮";
    
    // Verificar se a imagem é URL externa ou nome de arquivo
    let imagemUrl;
    if (jogo.imagem && jogo.imagem.startsWith('http')) {
        imagemUrl = jogo.imagem;
    } else {
        imagemUrl = `${API_URL}/imagens/${jogo.imagem}.jpg`;
    }
    
    const badgeClass = jogo.pago ? 'badge-paid' : 'badge-free';
    const badgeText = jogo.pago ? `💰 ${jogo.preco}` : '🎁 Grátis';
    
    card.innerHTML = `
        <div class="price-badge ${badgeClass}">${badgeText}</div>
        <img src="${imagemUrl}" alt="${jogo.nome}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(jogo.nome)}'">
        <div class="game-info">
            <div class="game-title">${jogo.nome}</div>
            <div class="game-desc">${jogo.descricao_curta || jogo.categoria}</div>
            <div class="rating">
                <button class="like-btn" data-id="${jogo.id}" data-tipo="like">👍 <span>${jogo.likes || 0}</span></button>
                <button class="dislike-btn" data-id="${jogo.id}" data-tipo="dislike">👎 <span>${jogo.dislikes || 0}</span></button>
            </div>
            <div class="size">📦 ${jogo.tamanho || 'Tamanho não informado'}</div>
            <button class="btn-download ${jogo.pago ? 'btn-paid' : 'btn-free'}" data-id="${jogo.id}">
                ${jogo.pago ? `💰 Comprar ${jogo.preco}` : '⬇️ Baixar Grátis'}
            </button>
        </div>
    `;
    
    // Evento do botão de download
    const btn = card.querySelector('.btn-download');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        baixar(jogo);
    });
    
    // Eventos de like/dislike
    const likeBtn = card.querySelector('.like-btn');
    const dislikeBtn = card.querySelector('.dislike-btn');
    
    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            votar(jogo.id, 'like');
        });
    }
    if (dislikeBtn) {
        dislikeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            votar(jogo.id, 'dislike');
        });
    }
    
    return card;
}

// ==================== SISTEMA DE LIKES ====================
let votosUsuario = JSON.parse(localStorage.getItem('votos') || '{}');

async function votar(jogoId, tipo) {
    const jogo = jogos.find(j => j.id === jogoId);
    if (!jogo) return;
    
    const votoAtual = votosUsuario[jogoId];
    
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
        await fetch(`${API_URL}/api/avaliacao/${jogoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likes: jogo.likes, dislikes: jogo.dislikes })
        });
    } catch (error) {
        console.error('Erro ao salvar voto:', error);
    }
    
    renderizarJogos(jogosFiltrados);
}

// ==================== SISTEMA DE LEADS COM VALIDADE DE 25 DIAS ====================

// Função principal de download com verificação obrigatória
function baixar(jogo) {
    if (jogo.pago) {
        // Jogo pago: checkout
        jogoSelecionado = jogo;
        alert(`💰 Jogo Premium: ${jogo.nome}\nPreço: ${jogo.preco}\n\nVocê será redirecionado para o pagamento.`);
        window.location.href = `checkout.html?jogo=${jogo.id}`;
    } else {
        // Jogo grátis: verificar se o lead é válido
        const leadValido = verificarLeadValido();
        
        if (leadValido) {
            // Lead válido, vai direto para download
            window.location.href = `download.html?jogo=${jogo.id}`;
        } else {
            // Lead expirado ou inexistente, mostrar modal
            mostrarModalLead(jogo);
        }
    }
}

// Verificar se o lead está válido (preenchido e dentro dos 25 dias)
function verificarLeadValido() {
    const leadDado = localStorage.getItem('lead_dado');
    const leadData = localStorage.getItem('lead_data');
    
    if (leadDado !== 'true' || !leadData) {
        return false;
    }
    
    // Calcular dias desde o preenchimento
    const dataPreenchimento = new Date(leadData);
    const hoje = new Date();
    const diferencaDias = Math.floor((hoje - dataPreenchimento) / (1000 * 60 * 60 * 24));
    
    // Se passaram mais de 25 dias, o lead expirou
    if (diferencaDias >= 25) {
        // Limpar dados antigos
        localStorage.removeItem('lead_dado');
        localStorage.removeItem('lead_data');
        localStorage.removeItem('lead_nome');
        localStorage.removeItem('lead_email');
        localStorage.removeItem('lead_whatsapp');
        return false;
    }
    
    return true;
}

// Mostrar modal com formulário obrigatório
function mostrarModalLead(jogo) {
    // Verificar se o modal já existe
    if (document.getElementById('leadModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'leadModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    // Verificar se já existe lead expirado para mostrar mensagem
    const leadExpirado = localStorage.getItem('lead_dado') === 'true' && !verificarLeadValido();
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #111, #1a1a1a); border-radius: 20px; padding: 30px; max-width: 400px; width: 90%; border: 1px solid #ff004f; text-align: center;">
            <h3 style="color: #ff004f; margin-bottom: 5px;">${leadExpirado ? '🔄 Verificação Expirada' : '🔐 Verificação Obrigatória'}</h3>
            <p style="color: #ffaa00; font-size: 0.8rem; margin-bottom: 10px;">⏳ Válido por 25 dias</p>
            <p style="color: #ccc; margin-bottom: 20px; font-size: 0.9rem;">
                ${leadExpirado ? 'A sua verificação expirou. Preencha novamente para continuar a baixar jogos.' : 'Preencha os dados abaixo para acessar o jogo <strong>' + jogo.nome + '</strong>'}
            </p>
            
            <div style="margin-bottom: 15px;">
                <input type="text" id="leadNome" placeholder="Seu nome completo" style="width:100%; padding:12px; background:#0a0a0a; border:1px solid #333; border-radius:10px; color:white; margin-bottom:10px;" value="${localStorage.getItem('lead_nome') || ''}">
                <input type="email" id="leadEmail" placeholder="Seu email" style="width:100%; padding:12px; background:#0a0a0a; border:1px solid #333; border-radius:10px; color:white; margin-bottom:10px;" value="${localStorage.getItem('lead_email') || ''}">
                <input type="text" id="leadWhatsapp" placeholder="WhatsApp (ex: 841234567)" style="width:100%; padding:12px; background:#0a0a0a; border:1px solid #333; border-radius:10px; color:white;" value="${localStorage.getItem('lead_whatsapp') || ''}">
            </div>
            
            <button id="btnEnviarLead" style="width:100%; padding:14px; background: linear-gradient(90deg, #00ff9c, #00cc7a); border: none; border-radius:10px; color: #0a0a0a; font-weight: bold; cursor: pointer; font-size: 1rem;">
                📤 Continuar para Download
            </button>
            
            <p style="margin-top: 12px; font-size: 0.65rem; color: #666;">
                Ao continuar, concorda em fornecer os dados para acesso aos jogos.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btnEnviarLead').onclick = function() {
        enviarLead(jogo);
    };
}

// Fechar modal (não é possível fechar sem preencher)
function fecharModalLead() {
    alert('⚠️ Por favor, preencha os dados para continuar.');
}

// Enviar lead e salvar com data
async function enviarLead(jogo) {
    const nome = document.getElementById('leadNome').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    const whatsapp = document.getElementById('leadWhatsapp').value.trim();
    
    if (!nome || !email || !whatsapp) {
        alert('⚠️ Preencha todos os campos!');
        return;
    }
    
    // Validar WhatsApp (número moçambicano)
    const whatsappLimpo = whatsapp.replace(/\s/g, '');
    if (!/^[8|7][0-9]{8}$/.test(whatsappLimpo)) {
        alert('⚠️ Número de WhatsApp inválido! Use 84xxxxxxx ou 87xxxxxxx');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: nome,
                email: email,
                whatsapp: whatsappLimpo,
                jogoInteresse: jogo.nome
            })
        });
        
        const result = await response.json();
        
        if (result.sucesso) {
            // Salvar dados com data atual
            const dataAtual = new Date().toISOString();
            localStorage.setItem('lead_dado', 'true');
            localStorage.setItem('lead_data', dataAtual);
            localStorage.setItem('lead_nome', nome);
            localStorage.setItem('lead_email', email);
            localStorage.setItem('lead_whatsapp', whatsappLimpo);
            
            // Fechar modal
            const modal = document.getElementById('leadModal');
            if (modal) modal.remove();
            
            // Redirecionar para download
            window.location.href = `download.html?jogo=${jogo.id}`;
        } else {
            alert('❌ Erro ao salvar dados. Tente novamente.');
        }
    } catch (error) {
        alert('❌ Erro de conexão. Tente novamente.');
    }
}

// Mostrar aviso de expiração (5 dias antes)
function verificarExpiracaoLead() {
    const leadDado = localStorage.getItem('lead_dado');
    const leadData = localStorage.getItem('lead_data');
    
    if (leadDado === 'true' && leadData) {
        const dataPreenchimento = new Date(leadData);
        const hoje = new Date();
        const diferencaDias = Math.floor((hoje - dataPreenchimento) / (1000 * 60 * 60 * 24));
        const diasRestantes = 25 - diferencaDias;
        
        if (diasRestantes > 0 && diasRestantes <= 5) {
            console.log(`⚠️ A sua verificação expira em ${diasRestantes} dia(s).`);
        }
    }
}

// Verificar ao carregar a página se o lead expirou
function verificarLeadAoCarregar() {
    const leadDado = localStorage.getItem('lead_dado');
    if (leadDado === 'true') {
        const leadData = localStorage.getItem('lead_data');
        if (leadData) {
            const dataPreenchimento = new Date(leadData);
            const hoje = new Date();
            const diferencaDias = Math.floor((hoje - dataPreenchimento) / (1000 * 60 * 60 * 24));
            
            if (diferencaDias >= 25) {
                localStorage.removeItem('lead_dado');
                localStorage.removeItem('lead_data');
                localStorage.removeItem('lead_nome');
                localStorage.removeItem('lead_email');
                localStorage.removeItem('lead_whatsapp');
                console.log('🔐 Verificação expirada.');
            } else if (diferencaDias >= 20) {
                verificarExpiracaoLead();
            }
        }
    }
}

// ==================== BUSCA ====================

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

// ==================== FUNÇÕES DO MENU ====================

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
                <p style="margin-bottom: 15px;">📺 Canal no WhatsApp: <a href="https://whatsapp.com/channel/0029Vb7YAqi3bbV9tuuiyC1p" target="_blank" style="color: #00ff9c;">Clique aqui</a></p>
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

function abrirMenu() {
    sideMenu.classList.add('active');
    overlay.classList.add('active');
}

function fecharMenu() {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
}

function fecharBarraPesquisa() {
    if (searchInput) {
        searchInput.value = '';
    }
}

// ==================== URL PARAMETER ====================

function carregarJogoPorURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const jogoSlug = urlParams.get('jogo');
    
    if (jogoSlug) {
        const waitForJogos = setInterval(() => {
            if (jogos.length > 0) {
                clearInterval(waitForJogos);
                
                const slugMap = {
                    'need-for-speed': 'Need for Speed',
                    'fc-mobile-24': 'FC Mobile 24',
                    'naruto-shippuden': 'Naruto Shippuden Ultimate Ninja',
                    'mortal-kombat-11': 'Mortal Kombat 11',
                    'ea-fc-26': 'EA FC 26',
                    'god-of-war': 'God of War - Ghost of Sparta',
                    'dream-league-mod': 'Dream League Soccer Mod',
                    'dls-real-madrid': 'Dream League Soccer Mod Real Madrid',
                    'fifa-21-mod': 'FIFA 21 Mod 14',
                    'efootball-26': 'eFootball 26 Mod Africa',
                    'dfl-26': 'DFL 26',
                    'james-bond': 'James Bond',
                    'dragon-ball-shin-budokai-8': 'Dragon Ball Shin Budokai 8',
                    'spider-man-friend-or-foe': 'Spider Man Friend or Foe',
                    'spider-man-3': 'Spider Man3'
                };
                
                const nomeJogo = slugMap[jogoSlug];
                if (nomeJogo) {
                    setTimeout(() => {
                        const cards = document.querySelectorAll('.game-card');
                        for (let card of cards) {
                            if (card.querySelector('.game-title')?.innerText === nomeJogo) {
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                card.style.border = '2px solid #00ff9c';
                                card.style.transform = 'scale(1.02)';
                                setTimeout(() => {
                                    card.style.border = '';
                                    card.style.transform = '';
                                }, 3000);
                                break;
                            }
                        }
                    }, 1000);
                }
            }
        }, 100);
    }
}

// ==================== EVENTOS ====================

if (menuBtn) menuBtn.addEventListener('click', abrirMenu);
if (closeMenu) closeMenu.addEventListener('click', fecharMenu);
if (overlay) overlay.addEventListener('click', fecharMenu);

if (searchInput) searchInput.addEventListener('input', (e) => buscarJogos(e.target.value));

if (menuHome) menuHome.addEventListener('click', mostrarHome);
if (menuApresentacao) menuApresentacao.addEventListener('click', mostrarApresentacao);
if (menuSuporte) menuSuporte.addEventListener('click', mostrarSuporte);

// ==================== INICIALIZAÇÃO ====================
carregarJogosAPI();
carregarJogoPorURL();
verificarLeadAoCarregar();