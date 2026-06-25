// ==================== CONFIGURAÇÃO DO BACKEND ====================
const API_URL = 'https://zona-backend-v3h1.onrender.com';

// ==================== CARREGAR JOGOS DO BACKEND ====================
let jogos = [];
let jogosFiltrados = [];
let jogoSelecionado = null;

// Elementos DOM
const container = document.getElementById("games");
const destaqueSection = document.getElementById("destaqueSection");
const destaqueGrid = document.getElementById("destaqueGrid");
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

// Função para renderizar jogos (com destaque separado)
function renderizarJogos(jogosArray) {
    if (!container) return;
    
    // Separar jogos em destaque (máximo 3)
    const jogosDestaque = jogosArray.filter(jogo => jogo.destaque === true).slice(0, 3);
    const jogosNormais = jogosArray.filter(jogo => jogo.destaque !== true);
    
    // Renderizar seção de destaque
    if (jogosDestaque.length > 0 && destaqueSection && destaqueGrid) {
        destaqueSection.style.display = 'block';
        destaqueGrid.innerHTML = '';
        
        jogosDestaque.forEach(jogo => {
            const card = criarCard(jogo, true);
            destaqueGrid.appendChild(card);
        });
    } else if (destaqueSection) {
        destaqueSection.style.display = 'none';
    }
    
    // Renderizar jogos normais
    container.innerHTML = "";
    
    if (jogosNormais.length === 0 && jogosDestaque.length === 0) {
        container.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 50px;"><h3>🔍 Nenhum jogo encontrado</h3><p>Tente outra busca</p></div>';
        return;
    }
    
    jogosNormais.forEach(jogo => {
        const card = criarCard(jogo, false);
        container.appendChild(card);
    });
}

// Função para criar um card de jogo
function criarCard(jogo, isDestaque) {
    const card = document.createElement('div');
    card.className = 'card';
    if (isDestaque) card.classList.add('destaque-card');
    
    const plataformaIcon = jogo.plataforma === "APK Android" ? "📱" : "🎮";
    
    // Primeiro tenta carregar do backend, depois do front-end
    const imagemBackend = `${API_URL}/imagens/${jogo.imagem}.jpg`;
    const imagemFrontend = `imagens/${jogo.imagem}.jpg`;
    
    card.innerHTML = `
        <img src="${imagemBackend}" 
             alt="${jogo.nome}" 
             loading="lazy" 
             onerror="this.src='${imagemFrontend}'; this.onerror=null;">
        <h3>${jogo.nome}</h3>
        <div>
            <span class="categoria">${jogo.categoria}</span>
            <span class="plataforma">${plataformaIcon} ${jogo.plataforma}</span>
        </div>
        <div class="info-extra">
            <span class="tamanho">📦 ${jogo.tamanho || 'Tamanho não informado'}</span>
            ${jogo.destaque ? '<span class="destaque-badge">⭐ Destaque</span>' : ''}
        </div>
        <button class="btn" data-id="${jogo.id}">Download</button>
    `;
    
    const btn = card.querySelector('.btn');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        baixar(jogo);
    });
    
    return card;
}

// ==================== SISTEMA DE LEADS COM VALIDADE DE 25 DIAS ====================

// Função principal de download com verificação obrigatória
function baixar(jogo) {
    if (jogo.pago) {
        // Jogo pago: checkout
        jogoSelecionado = jogo;
        if (popup && priceText) {
            priceText.innerHTML = `${jogo.preco}<br><span style="font-size: 0.9rem; color: #888;">${jogo.nome}</span>`;
            popup.style.display = "flex";
        }
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
    // Não faz nada - o modal é obrigatório
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
            // Mostrar aviso sutil no console ou criar notificação
            console.log(`⚠️ A sua verificação expira em ${diasRestantes} dia(s).`);
            
            // Opcional: criar notificação visual
            const notificacao = document.createElement('div');
            notificacao.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #ffaa00;
                color: #0a0a0a;
                padding: 10px 20px;
                border-radius: 10px;
                font-weight: bold;
                z-index: 9999;
                font-size: 0.8rem;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5);
                animation: fadeInUp 0.5s ease;
            `;
            notificacao.textContent = `⚠️ A sua verificação expira em ${diasRestantes} dia(s). Preencha novamente para continuar.`;
            document.body.appendChild(notificacao);
            
            setTimeout(() => {
                notificacao.style.transition = 'opacity 0.5s';
                notificacao.style.opacity = '0';
                setTimeout(() => notificacao.remove(), 500);
            }, 5000);
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
                // Expirou, limpar dados
                localStorage.removeItem('lead_dado');
                localStorage.removeItem('lead_data');
                localStorage.removeItem('lead_nome');
                localStorage.removeItem('lead_email');
                localStorage.removeItem('lead_whatsapp');
                console.log('🔐 Verificação expirada. Pedir novamente os dados.');
            } else if (diferencaDias >= 20) {
                // Avisar que está a expirar
                verificarExpiracaoLead();
            }
        }
    }
}

function baixarPremium() {
    if (jogoSelecionado && jogoSelecionado.download) {
        window.open(jogoSelecionado.download, "_blank");
        fecharPopup();
    } else {
        alert("Link de download indisponível no momento.");
    }
}

function fecharPopup() {
    if (popup) {
        popup.style.display = "none";
    }
    jogoSelecionado = null;
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

function toggleSearchBar() {
    searchBar.classList.toggle('active');
    if (searchBar.classList.contains('active')) {
        searchInput.focus();
    }
}

function fecharBarraPesquisa() {
    searchBar.classList.remove('active');
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
                        const cards = document.querySelectorAll('.card');
                        for (let card of cards) {
                            if (card.querySelector('h3')?.innerText === nomeJogo) {
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

if (searchBtn) searchBtn.addEventListener('click', toggleSearchBar);
if (searchInput) searchInput.addEventListener('input', (e) => buscarJogos(e.target.value));

if (menuHome) menuHome.addEventListener('click', mostrarHome);
if (menuApresentacao) menuApresentacao.addEventListener('click', mostrarApresentacao);
if (menuSuporte) menuSuporte.addEventListener('click', mostrarSuporte);

if (btnDownloadPremium) btnDownloadPremium.addEventListener('click', baixarPremium);

if (popup) {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) fecharPopup();
    });
}

document.addEventListener('click', (e) => {
    if (searchBar.classList.contains('active')) {
        if (!searchBar.contains(e.target) && e.target !== searchBtn) {
            fecharBarraPesquisa();
        }
    }
});

// ==================== INICIALIZAÇÃO ====================
carregarJogosAPI();
carregarJogoPorURL();
verificarLeadAoCarregar();