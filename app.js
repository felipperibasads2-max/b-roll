/* ==========================================
   B-ROLL DIRECTOR - CORE ENGINE
   JavaScript Client-Side para Edição e Sincronismo
   ========================================== */

// --- BANCO DE PALAVRAS-CHAVE PARA SUGESTÕES DE B-ROLL ---
const KEYWORDS_DB = {
    "inteligência artificial": { tag: "Tecnologia", suggestion: "Mostrar conexões de rede neural, animação de cérebro digital ou código binário." },
    "ia": { tag: "Tecnologia", suggestion: "Inserir arte conceitual de IA, robótica ou fluxos de dados rápidos." },
    "computador": { tag: "Hardware", suggestion: "Mostrar pessoa digitando em escritório moderno ou close na tela com códigos/linhas." },
    "computadores": { tag: "Hardware", suggestion: "Mostrar servidores de dados piscando ou ambiente de desenvolvimento." },
    "vendas": { tag: "Negócios", suggestion: "Exibir gráfico de crescimento com barras subindo ou transação em cartão." },
    "venda": { tag: "Negócios", suggestion: "Mostrar aperto de mãos corporativo ou contrato sendo assinado." },
    "gráficos": { tag: "Dados", suggestion: "Apresentar dashboards animados, tabelas de lucros ou infográficos." },
    "gráfico": { tag: "Dados", suggestion: "Exibir linhas de tendência subindo ou tela de análise financeira." },
    "lucro": { tag: "Finanças", suggestion: "Close em moedas caindo, notas de dinheiro ou gráficos de faturamento verde." },
    "dinheiro": { tag: "Finanças", suggestion: "Exibir cédulas, transação via aplicativo móvel ou moedas virtuais." },
    "crescimento": { tag: "Estratégia", suggestion: "Foguete decolando em desenho animado, ou planta germinando de forma acelerada." },
    "tecnologia": { tag: "Inovação", suggestion: "Mostrar óculos VR (realidade virtual), cidade futurista ou processadores." },
    "celular": { tag: "Dispositivo", suggestion: "Visão em primeira pessoa rolando um feed de aplicativo ou segurando smartphone." },
    "smartphone": { tag: "Dispositivo", suggestion: "Mão interagindo com tela touch brilhante ou smartphone em tripé." },
    "celulares": { tag: "Dispositivo", suggestion: "Grupo de pessoas olhando o celular ou mockups flutuando." },
    "equipe": { tag: "Pessoas", suggestion: "Reunião de brainstorming ativa, sorrisos em equipe ou pessoas batendo palmas." },
    "time": { tag: "Pessoas", suggestion: "Colaboradores trabalhando juntos em mesa redonda ou compartilhando telas." },
    "reunião": { tag: "Pessoas", suggestion: "Close em mãos anotando ideias em quadro branco ou videoconferência." },
    "marketing": { tag: "Mídias", suggestion: "Mostrar campanhas digitais rodando, funil de vendas ou posts em redes sociais." },
    "dados": { tag: "Análise", suggestion: "Números rolando em tela preta estilo Matrix ou cabos de rede conectados." },
    "segurança": { tag: "Proteção", suggestion: "Animação de cadeado fechando na tela ou escudo digital brilhando." },
    "ideia": { tag: "Criatividade", suggestion: "Lâmpada de filamento acendendo ou designer rascunhando em papel." },
    "ideias": { tag: "Criatividade", suggestion: "Pessoas escrevendo post-its coloridos em uma parede de vidro." },
    "design": { tag: "Criatividade", suggestion: "Cursor movendo no Figma/Photoshop ou desenho técnico em mesa digitalizadora." },
    "código": { tag: "Dev", suggestion: "Linhas de Javascript/CSS rolando rápido no terminal em modo escuro." },
    "programação": { tag: "Dev", suggestion: "Dedos ágeis digitando em teclado mecânico iluminado." },
    "site": { tag: "Web", suggestion: "Mockup 3D de site responsivo abrindo no navegador de um notebook." },
    "sites": { tag: "Web", suggestion: "Navegação fluida em páginas web de e-commerce." }
};

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const state = {
    // Arquivos e URLs
    arollFile: null,
    arollURL: null,
    arollDuration: 0,
    
    brolls: [], // Lista de mídias B-roll importadas: { id, name, url, duration }
    timelineBrolls: [], // Blocos inseridos na timeline: { id, start, duration, mediaId, mediaName }
    
    // Reprodução
    isPlaying: false,
    currentTime: 0,
    activeBrollBlock: null,
    
    // Zoom e Interface
    zoomLevel: 25, // Pixels por segundo
    selectedBlockId: null,
    
    // Roteiro
    scriptText: "",
    scriptWords: [], // Palavras mapeadas: { text, start, end, id }
    srtBlocks: [], // Legendas parseadas
    suggestions: [], // Sugestões geradas: { id, word, start, suggestion, tag, context }
    
    // Gravação
    isRendering: false,
    audioBuffer: null // Buffer do A-roll decodificado para o Waveform
};

// --- DOM ELEMENTS ---
const el = {
    // Vídeo
    arollVideo: document.getElementById('aroll-video'),
    brollVideo: document.getElementById('broll-video'),
    videoStage: document.getElementById('video-stage'),
    arollPlaceholder: document.getElementById('aroll-placeholder'),
    arollUpload: document.getElementById('aroll-upload'),
    layerIndicator: document.getElementById('layer-indicator'),
    
    // Controles
    btnPlayPause: document.getElementById('btn-play-pause'),
    btnStop: document.getElementById('btn-stop'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),
    timeDisplay: document.getElementById('time-display'),
    btnMute: document.getElementById('btn-mute'),
    volumeUpIcon: document.getElementById('volume-up-icon'),
    volumeMuteIcon: document.getElementById('volume-mute-icon'),
    volumeSlider: document.getElementById('volume-slider'),
    
    // Timeline
    timelineScroll: document.getElementById('timeline-scroll'),
    timelineRuler: document.getElementById('timeline-ruler'),
    timelineTracks: document.getElementById('timeline-tracks-container'),
    timelinePlayhead: document.getElementById('timeline-playhead'),
    trackArollContent: document.getElementById('track-aroll-content'),
    trackBrollContent: document.getElementById('track-broll-content'),
    arollTimelineBlock: document.getElementById('aroll-timeline-block'),
    waveformCanvas: document.getElementById('waveform-canvas'),
    zoomSlider: document.getElementById('zoom-slider'),
    btnClearBrolls: document.getElementById('btn-clear-brolls'),
    
    // Roteiro / Sugestões
    scriptText: document.getElementById('script-text'),
    btnProcessScript: document.getElementById('btn-process-script'),
    srtUpload: document.getElementById('srt-upload'),
    interactiveScriptBox: document.getElementById('interactive-script-box'),
    scriptWordsView: document.getElementById('script-words-view'),
    sugBadge: document.getElementById('sug-badge'),
    suggestionsContainer: document.getElementById('suggestions-container'),
    sugFrequency: document.getElementById('sug-frequency'),
    chkKeywordsOnly: document.getElementById('chk-keywords-only'),
    
    // Settings & IA avançada
    btnSettings: document.getElementById('btn-settings'),
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    cfgGeminiKey: document.getElementById('cfg-gemini-key'),
    cfgClaudeKey: document.getElementById('cfg-claude-key'),
    cfgGeminiModel: document.getElementById('cfg-gemini-model'),
    chkUseAdvancedAi: document.getElementById('chk-use-advanced-ai'),
    cfgFlowUrl: document.getElementById('cfg-flow-url'),
    cfgFlowHeaders: document.getElementById('cfg-flow-headers'),
    cfgFlowMode: document.getElementById('cfg-flow-mode'),
    cfgFlowPollingGroup: document.getElementById('cfg-flow-polling-group'),
    cfgFlowPollingUrl: document.getElementById('cfg-flow-polling-url'),
    
    // B-Roll Recursos
    brollUpload: document.getElementById('broll-upload'),
    brollMediaList: document.getElementById('broll-media-list'),
    brollCountBadge: document.getElementById('broll-count-badge'),
    
    // Exportação
    btnBrowserRender: document.getElementById('btn-browser-render'),
    btnExportEdl: document.getElementById('btn-export-edl'),
    btnFfmpegCopy: document.getElementById('btn-ffmpeg-copy'),
    ffmpegCommandText: document.getElementById('ffmpeg-command-text'),
    renderProgressWrapper: document.getElementById('render-progress-wrapper'),
    renderPct: document.getElementById('render-pct'),
    renderBarFill: document.getElementById('render-bar-fill'),
    
    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // Modals
    btnQuickGuide: document.getElementById('btn-quick-guide'),
    guideModal: document.getElementById('guide-modal'),
    btnCloseGuide: document.getElementById('btn-close-guide'),
    btnDismissGuide: document.getElementById('btn-dismiss-guide'),
    
    insertModal: document.getElementById('insert-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    modalTimeLabel: document.getElementById('modal-time-label'),
    modalBrollList: document.getElementById('modal-broll-list'),
    modalBrollUpload: document.getElementById('modal-broll-upload')
};

// Variavel temporaria para inserção via modal
let pendingInsertTime = 0;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupTabs();
    initCanvas();
    updateTimelineLayout();
    initCredentials();
});

// --- CANVAS SETUP ---
let rulerCtx = null;
let waveformCtx = null;

function initCanvas() {
    rulerCtx = el.timelineRuler.getContext('2d');
    waveformCtx = el.waveformCanvas.getContext('2d');
    
    // Redimensionar Canvas
    resizeRuler();
    window.addEventListener('resize', () => {
        resizeRuler();
        drawTimelineRuler();
        drawWaveform();
    });
}

function resizeRuler() {
    const parent = el.timelineRuler.parentElement;
    el.timelineRuler.width = parent.clientWidth;
    el.timelineRuler.height = parent.clientHeight;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Guias Modais
    el.btnQuickGuide.addEventListener('click', () => showModal(el.guideModal));
    el.btnCloseGuide.addEventListener('click', () => hideModal(el.guideModal));
    el.btnDismissGuide.addEventListener('click', () => hideModal(el.guideModal));
    
    // Upload de A-Roll
    el.arollUpload.addEventListener('change', handleArollUpload);
    el.arollPlaceholder.addEventListener('dragover', (e) => { e.preventDefault(); el.arollPlaceholder.style.borderColor = varColor('primary'); });
    el.arollPlaceholder.addEventListener('dragleave', () => { el.arollPlaceholder.style.borderColor = ''; });
    el.arollPlaceholder.addEventListener('drop', (e) => {
        e.preventDefault();
        el.arollPlaceholder.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) {
            el.arollUpload.files = e.dataTransfer.files;
            handleArollUpload();
        }
    });

    // Upload de B-Rolls
    el.brollUpload.addEventListener('change', handleBrollUpload);
    el.modalBrollUpload.addEventListener('change', handleModalBrollUpload);
    
    // Playback Controls
    el.btnPlayPause.addEventListener('click', togglePlay);
    el.btnStop.addEventListener('click', stopPlayback);
    el.arollVideo.addEventListener('timeupdate', handleVideoTimeUpdate);
    el.arollVideo.addEventListener('ended', () => {
        state.isPlaying = false;
        updatePlayButtons();
    });

    // Sincronizar vídeo B-roll
    el.brollVideo.addEventListener('loadedmetadata', () => {
        if (state.isPlaying && !el.arollVideo.paused) {
            el.brollVideo.play().catch(e => console.log("Erro auto-play B-roll:", e));
        }
    });
    
    // Volume / Mute
    el.btnMute.addEventListener('click', toggleMute);
    el.volumeSlider.addEventListener('input', handleVolumeChange);

    // Zoom Timeline
    el.zoomSlider.addEventListener('input', (e) => {
        state.zoomLevel = parseInt(e.target.value);
        updateTimelineLayout();
    });
    
    // Limpar Timeline
    el.btnClearBrolls.addEventListener('click', clearAllTimelineBrolls);

    // Processamento do Roteiro
    el.btnProcessScript.addEventListener('click', processRawScript);
    el.srtUpload.addEventListener('change', handleSrtUpload);
    el.sugFrequency.addEventListener('change', generateBrollSuggestions);
    el.chkKeywordsOnly.addEventListener('change', generateBrollSuggestions);

    // Timeline Drag / Interaction
    setupTimelineInteraction();

    // Modals
    el.btnCloseModal.addEventListener('click', () => hideModal(el.insertModal));
    
    // Settings Modal
    el.btnSettings.addEventListener('click', () => showModal(el.settingsModal));
    el.btnCloseSettings.addEventListener('click', () => hideModal(el.settingsModal));
    el.cfgFlowMode.addEventListener('change', toggleFlowPollingView);
    el.btnSaveSettings.addEventListener('click', () => {
        localStorage.setItem('cfg_gemini_key', el.cfgGeminiKey.value.trim());
        localStorage.setItem('cfg_claude_key', el.cfgClaudeKey.value.trim());
        localStorage.setItem('cfg_gemini_model', el.cfgGeminiModel.value);
        localStorage.setItem('cfg_flow_url', el.cfgFlowUrl.value.trim());
        localStorage.setItem('cfg_flow_headers', el.cfgFlowHeaders.value.trim());
        localStorage.setItem('cfg_flow_mode', el.cfgFlowMode.value);
        localStorage.setItem('cfg_flow_polling_url', el.cfgFlowPollingUrl.value.trim());
        hideModal(el.settingsModal);
    });
    
    // Exportação
    el.btnExportEdl.addEventListener('click', exportEDL);
    el.btnFfmpegCopy.addEventListener('click', copyFfmpegCommand);
    el.btnBrowserRender.addEventListener('click', startBrowserRender);
}

function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

// --- CONTROLES DE TABS ---
function setupTabs() {
    el.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            const parent = btn.closest('.panel');
            
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetPane = document.getElementById(tabId);
            if (targetPane) targetPane.classList.add('active');
        });
    });
}

// --- CARREGAMENTO DE ARQUIVOS ---

// 1. A-Roll (Avatar Principal)
async function handleArollUpload() {
    const file = el.arollUpload.files[0];
    if (!file) return;

    state.arollFile = file;
    if (state.arollURL) URL.revokeObjectURL(state.arollURL);
    state.arollURL = URL.createObjectURL(file);
    
    el.arollPlaceholder.classList.add('hidden');
    el.arollVideo.src = state.arollURL;
    el.arollVideo.load();

    // Carregar informações iniciais
    el.arollVideo.onloadedmetadata = () => {
        state.arollDuration = el.arollVideo.duration;
        el.arollTimelineBlock.classList.remove('hidden');
        el.arollTimelineBlock.querySelector('.block-title').textContent = file.name;
        
        // Habilitar botões
        el.btnPlayPause.disabled = false;
        el.btnStop.disabled = false;
        el.btnBrowserRender.disabled = false;
        el.btnExportEdl.disabled = false;
        el.btnFfmpegCopy.disabled = false;
        
        updateTimelineLayout();
        
        // Iniciar extração de Waveform em Background
        extractAudioWaveform(file);
    };
}

// 2. B-Rolls (Biblioteca)
function handleBrollUpload() {
    const files = el.brollUpload.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        addBrollToLibrary(file);
    }
    el.brollUpload.value = ''; // Limpar input
}

function addBrollToLibrary(file) {
    const id = 'broll_' + Math.random().toString(36).substr(2, 9);
    const url = URL.createObjectURL(file);
    
    // Criar elemento temporário de vídeo para ler a duração
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
        const broll = {
            id: id,
            name: file.name,
            url: url,
            duration: tempVideo.duration,
            file: file
        };
        state.brolls.push(broll);
        updateBrollMediaList();
        updateModalBrollList();
    };
}

// Upload de B-roll através do Modal de Inserção Rápida
function handleModalBrollUpload() {
    const file = el.modalBrollUpload.files[0];
    if (!file) return;

    const id = 'broll_' + Math.random().toString(36).substr(2, 9);
    const url = URL.createObjectURL(file);
    
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
        const broll = {
            id: id,
            name: file.name,
            url: url,
            duration: tempVideo.duration,
            file: file
        };
        state.brolls.push(broll);
        updateBrollMediaList();
        updateModalBrollList();
        
        // Inserir automaticamente este recém-carregado
        insertBrollAtTime(id, pendingInsertTime);
        hideModal(el.insertModal);
    };
    el.modalBrollUpload.value = '';
}

// Atualizar listagem visual de B-rolls
function updateBrollMediaList() {
    el.brollCountBadge.textContent = state.brolls.length;
    
    if (state.brolls.length === 0) {
        el.brollMediaList.innerHTML = `
            <div class="empty-state">
                <p>Nenhum vídeo de B-Roll carregado.</p>
                <span class="subtext">Adicione seus arquivos de apoio (.mp4, .webm) para arrastar até a linha de tempo.</span>
            </div>
        `;
        return;
    }

    el.brollMediaList.innerHTML = '';
    state.brolls.forEach(b => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-id', b.id);
        
        card.innerHTML = `
            <div class="media-thumb">
                <video src="${b.url}" muted></video>
            </div>
            <div class="media-info">
                <span class="media-name" title="${b.name}">${b.name}</span>
                <span class="media-duration">${formatTimecode(b.duration)}</span>
            </div>
            <button class="btn-delete-media" title="Remover recurso">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;

        // Delete Handler
        card.querySelector('.btn-delete-media').addEventListener('click', (e) => {
            e.stopPropagation();
            removeBrollFromLibrary(b.id);
        });

        // Drag Handler
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', b.id);
            card.classList.add('dragging-card');
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging-card');
        });

        // Preview no mouse hover
        const video = card.querySelector('video');
        card.addEventListener('mouseenter', () => { video.play().catch(() => {}); });
        card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });

        el.brollMediaList.appendChild(card);
    });
}

function removeBrollFromLibrary(id) {
    // Remover da lista de recursos
    state.brolls = state.brolls.filter(b => b.id !== id);
    
    // Remover da timeline todos os blocos usando este recurso
    state.timelineBrolls = state.timelineBrolls.filter(tb => tb.mediaId !== id);
    
    updateBrollMediaList();
    updateModalBrollList();
    drawTimelineBrolls();
    updateExporterData();
}

// --- MOTOR DE SINCRONISMO DE VÍDEO (REPLAY ENGINE) ---

function togglePlay() {
    if (!state.arollFile) return;
    
    if (state.isPlaying) {
        el.arollVideo.pause();
        el.brollVideo.pause();
        state.isPlaying = false;
    } else {
        el.arollVideo.play().catch(err => console.log(err));
        state.isPlaying = true;
    }
    updatePlayButtons();
}

function stopPlayback() {
    el.arollVideo.pause();
    el.arollVideo.currentTime = 0;
    el.brollVideo.pause();
    el.brollVideo.currentTime = 0;
    state.isPlaying = false;
    updatePlayButtons();
    updatePlayheadPosition(0);
}

function updatePlayButtons() {
    if (state.isPlaying) {
        el.playIcon.style.display = 'none';
        el.pauseIcon.style.display = 'block';
    } else {
        el.playIcon.style.display = 'block';
        el.pauseIcon.style.display = 'none';
    }
}

function toggleMute() {
    el.arollVideo.muted = !el.arollVideo.muted;
    if (el.arollVideo.muted) {
        el.volumeUpIcon.style.display = 'none';
        el.volumeMuteIcon.style.display = 'block';
    } else {
        el.volumeUpIcon.style.display = 'block';
        el.volumeMuteIcon.style.display = 'none';
    }
}

function handleVolumeChange(e) {
    const vol = e.target.value / 100;
    el.arollVideo.volume = vol;
    if (vol === 0) {
        el.arollVideo.muted = true;
        el.volumeUpIcon.style.display = 'none';
        el.volumeMuteIcon.style.display = 'block';
    } else {
        el.arollVideo.muted = false;
        el.volumeUpIcon.style.display = 'block';
        el.volumeMuteIcon.style.display = 'none';
    }
}

// GERENCIADOR DE REPRODUÇÃO DUAL LAYER EM TEMPO REAL
function handleVideoTimeUpdate() {
    const time = el.arollVideo.currentTime;
    state.currentTime = time;
    
    // Atualizar tempo no painel
    el.timeDisplay.textContent = `${formatTimecode(time)} / ${formatTimecode(state.arollDuration)}`;
    
    // Mover playhead na timeline
    updatePlayheadPosition(time);

    // Realçar palavra atual no roteiro
    highlightCurrentScriptWord(time);

    // Encontrar se há algum B-roll agendado neste segundo
    const activeBlock = state.timelineBrolls.find(b => time >= b.start && time < (b.start + b.duration));

    if (activeBlock) {
        // Encontrar mídia correspondente
        const media = state.brolls.find(m => m.id === activeBlock.mediaId);
        
        if (media) {
            state.activeBrollBlock = activeBlock;
            el.layerIndicator.style.display = 'flex';
            el.layerIndicator.innerHTML = `<span class="indicator-dot broll"></span> B-Roll (${media.name})`;
            
            // Se mudou de cena ou ainda não carregou o B-roll
            if (el.brollVideo.src !== media.url) {
                el.brollVideo.src = media.url;
                el.brollVideo.load();
                el.brollVideo.classList.add('visible');
            }

            // Sincronizar tempo do B-roll: tempo atual do A-roll menos início do bloco
            const offset = time - activeBlock.start;
            const brollTime = offset % media.duration; // Fazer loop caso o bloco de B-roll dure mais que o arquivo
            
            if (Math.abs(el.brollVideo.currentTime - brollTime) > 0.15) {
                el.brollVideo.currentTime = brollTime;
            }

            // Sincronizar estado de pause/play
            if (el.arollVideo.paused) {
                if (!el.brollVideo.paused) el.brollVideo.pause();
            } else {
                if (el.brollVideo.paused) {
                    el.brollVideo.play().catch(e => console.log(e));
                }
            }
        }
    } else {
        // Sem B-roll ativo: Ocultar camada de sobreposição
        state.activeBrollBlock = null;
        el.layerIndicator.style.display = 'flex';
        el.layerIndicator.innerHTML = `<span class="indicator-dot aroll"></span> A-Roll (Avatar)`;
        
        if (el.brollVideo.classList.contains('visible')) {
            el.brollVideo.classList.remove('visible');
            el.brollVideo.pause();
            el.brollVideo.src = '';
        }
    }
}

// --- PROCESSADOR DE ROTEIRO & IA SUGGESTIONS ---

// Processar roteiro colado como texto livre
function processRawScript() {
    const text = el.scriptText.value.trim();
    if (!text) return;

    state.scriptText = text;
    state.srtBlocks = []; // Limpar SRT
    
    // Mapear roteiro estimando timestamps
    // Heygen WPM médio: ~140 palavras por minuto (2.33 palavras por segundo)
    const words = text.split(/\s+/);
    const totalWords = words.length;
    const duration = state.arollDuration || 60; // Fallback para 60s
    
    state.scriptWords = words.map((w, index) => {
        const start = (index / totalWords) * duration;
        const end = ((index + 1) / totalWords) * duration;
        return {
            id: 'word_' + index,
            text: w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""),
            rawText: w,
            start: start,
            end: end
        };
    });

    if (el.chkUseAdvancedAi.checked) {
        analyzeScriptWithGemini(text);
    } else {
        renderInteractiveScript();
        generateBrollSuggestions();
        el.interactiveScriptBox.classList.remove('hidden');
    }
}

// Processar arquivo de legendas SRT/VTT carregado
function handleSrtUpload() {
    const file = el.srtUpload.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        parseSRT(text);
        
        // Sincronizar roteiro
        renderInteractiveScript();
        generateBrollSuggestions();
        
        el.interactiveScriptBox.classList.remove('hidden');
    };
    reader.readAsText(file);
}

function parseSRT(data) {
    // Normalizar quebras de linha
    const cleanData = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = cleanData.split('\n\n');
    
    state.srtBlocks = [];
    state.scriptWords = [];
    
    let wordIndex = 0;
    
    blocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
            // Parser de tempo: 00:00:02,130 --> 00:00:05,400
            const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/g);
            if (timeMatch && timeMatch.length >= 2) {
                const start = timeStringToSeconds(timeMatch[0]);
                const end = timeStringToSeconds(timeMatch[1]);
                const text = lines.slice(2).join(' ');
                
                state.srtBlocks.push({ start, end, text });
                
                // Mapear palavras individuais proporcionalmente dentro do bloco
                const words = text.split(/\s+/);
                const blockDuration = end - start;
                
                words.forEach((w, wIdx) => {
                    const wStart = start + (wIdx / words.length) * blockDuration;
                    const wEnd = start + ((wIdx + 1) / words.length) * blockDuration;
                    
                    state.scriptWords.push({
                        id: 'word_' + wordIndex++,
                        text: w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""),
                        rawText: w,
                        start: wStart,
                        end: wEnd
                    });
                });
            }
        }
    });

    // Atualizar textarea com o texto completo
    el.scriptText.value = state.scriptWords.map(w => w.rawText).join(' ');
}

function timeStringToSeconds(str) {
    const parts = str.replace(',', '.').split(':');
    const hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseFloat(parts[2]);
    return hrs * 3600 + mins * 60 + secs;
}

// Renderizar painel de roteiro interativo
function renderInteractiveScript() {
    el.scriptWordsView.innerHTML = '';
    state.scriptWords.forEach(w => {
        const span = document.createElement('span');
        span.className = 'script-word';
        span.id = w.id;
        span.textContent = w.rawText + ' ';
        span.setAttribute('data-time', w.start);
        
        // Destacar palavra-chave
        const norm = w.text.toLowerCase();
        if (KEYWORDS_DB[norm]) {
            span.classList.add('keyword-highlight');
            span.title = `Sugestão: ${KEYWORDS_DB[norm].suggestion}`;
        }

        // Clique na palavra busca o player de vídeo
        span.addEventListener('click', () => {
            el.arollVideo.currentTime = w.start;
            if (!state.isPlaying) {
                handleVideoTimeUpdate();
            }
        });

        el.scriptWordsView.appendChild(span);
    });
}

function highlightCurrentScriptWord(time) {
    // Remover destaque anterior
    document.querySelectorAll('.script-word.active-playing').forEach(el => el.classList.remove('active-playing'));
    
    // Encontrar palavra correspondente
    const currentWord = state.scriptWords.find(w => time >= w.start && time < w.end);
    if (currentWord) {
        const element = document.getElementById(currentWord.id);
        if (element) {
            element.classList.add('active-playing');
            // Auto scroll suave do roteiro
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Colorir de verde palavras que já possuem B-roll inserido sobre elas
    state.scriptWords.forEach(w => {
        const span = document.getElementById(w.id);
        if (!span) return;
        const hasBroll = state.timelineBrolls.some(b => w.start >= b.start && w.start < (b.start + b.duration));
        if (hasBroll) {
            span.classList.add('has-broll');
        } else {
            span.classList.remove('has-broll');
        }
    });
}

// GERADOR DE SUGESTÕES DE B-ROLL BASEADO EM ROTEIRO
function generateBrollSuggestions() {
    if (state.scriptWords.length === 0) return;

    const container = el.suggestionsContainer;
    container.innerHTML = '';
    state.suggestions = [];

    const frequency = el.sugFrequency.value; // high (5s), medium (8s), low (12s)
    const minInterval = frequency === 'high' ? 5 : frequency === 'medium' ? 8 : 12;
    const keywordsOnly = el.chkKeywordsOnly.checked;

    let lastSuggestionTime = -minInterval; // Permitir sugestão logo no início

    state.scriptWords.forEach((word, index) => {
        const wordNorm = word.text.toLowerCase();
        const kwMatch = KEYWORDS_DB[wordNorm];

        // Decidir se criamos sugestão aqui
        const timeDiff = word.start - lastSuggestionTime;
        const isTimeMatch = timeDiff >= minInterval;

        if (kwMatch || (!keywordsOnly && isTimeMatch)) {
            // Obter contexto (4 palavras antes e depois)
            const startIdx = Math.max(0, index - 4);
            const endIdx = Math.min(state.scriptWords.length, index + 5);
            const contextText = state.scriptWords.slice(startIdx, endIdx).map(w => w.rawText).join(' ');
            
            const sug = {
                id: 'sug_' + index,
                word: word.rawText,
                start: word.start,
                tag: kwMatch ? kwMatch.tag : "Dinâmica",
                suggestion: kwMatch ? kwMatch.suggestion : "Inserir cena de corte de apoio para dar ritmo ao avatar falando.",
                context: `"... ${contextText} ..."`
            };

            state.suggestions.push(sug);
            lastSuggestionTime = word.start;
        }
    });

    el.sugBadge.textContent = state.suggestions.length;

    if (state.suggestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma sugestão encontrada.</p>
                <span class="subtext">Experimente desmarcar "Apenas Palavras-Chave" ou escrever um texto maior.</span>
            </div>
        `;
        return;
    }

    state.suggestions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.setAttribute('data-time', s.start);
        
        card.innerHTML = `
            <div class="sug-header">
                <span class="sug-tag">${s.tag}</span>
                <span class="sug-time">⏱️ ${formatTimecode(s.start)}</span>
            </div>
            <div class="sug-text">Termo: <strong>${s.word}</strong></div>
            <div class="sug-context">${s.context}</div>
            <div class="sug-text" style="color:var(--text-muted); font-size:11px;">💡 ${s.suggestion}</div>
            <div class="sug-actions">
                <button class="btn btn-sm btn-primary btn-add-sug">+ Inserir B-Roll</button>
            </div>
        `;

        // Ir para o tempo no player ao clicar no card
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-sug')) return;
            el.arollVideo.currentTime = s.start;
            handleVideoTimeUpdate();
            // Highlight
            document.querySelectorAll('.suggestion-card').forEach(c => c.classList.remove('active-sug'));
            card.classList.add('active-sug');
        });

        // Evento do botão Inserir
        card.querySelector('.btn-add-sug').addEventListener('click', (e) => {
            e.stopPropagation();
            openInsertModal(s.start);
        });

        container.appendChild(card);
    });
}

// --- MODAL DE SELEÇÃO RÁPIDA DE B-ROLL ---

function openInsertModal(time) {
    pendingInsertTime = time;
    el.modalTimeLabel.textContent = formatTimecode(time);
    updateModalBrollList();
    showModal(el.insertModal);
}

function updateModalBrollList() {
    const list = el.modalBrollList;
    list.innerHTML = '';

    if (state.brolls.length === 0) {
        list.innerHTML = `
            <p style="font-size:11px; color:var(--text-muted); text-align:center; padding: 12px 0;">
                Nenhum B-Roll na biblioteca. Importe um arquivo abaixo ou na aba Recursos.
            </p>
        `;
        return;
    }

    state.brolls.forEach(b => {
        const item = document.createElement('div');
        item.className = 'modal-selector-item';
        item.innerHTML = `
            <span>${b.name}</span>
            <span class="modal-selector-duration">${formatTimecode(b.duration)}</span>
        `;
        
        item.addEventListener('click', () => {
            insertBrollAtTime(b.id, pendingInsertTime);
            hideModal(el.insertModal);
        });
        
        list.appendChild(item);
    });
}

function insertBrollAtTime(mediaId, time) {
    const media = state.brolls.find(b => b.id === mediaId);
    if (!media) return;

    // Criar bloco de B-roll (Padrão 3 segundos ou o tamanho do arquivo)
    const duration = Math.min(3, media.duration);
    
    // Evitar sobreposição perfeita no mesmo start de outro bloco
    let start = time;
    while (state.timelineBrolls.some(b => Math.abs(b.start - start) < 0.2)) {
        start += 0.5; // Deslocar levemente
    }

    const block = {
        id: 'block_' + Math.random().toString(36).substr(2, 9),
        start: start,
        duration: duration,
        mediaId: mediaId,
        mediaName: media.name
    };

    state.timelineBrolls.push(block);
    
    // Ordenar timeline por ordem de entrada
    state.timelineBrolls.sort((a,b) => a.start - b.start);
    
    drawTimelineBrolls();
    updateExporterData();
    el.btnClearBrolls.disabled = false;
}

// --- LINHA DE TEMPO (TIMELINE DRAWING & LOGIC) ---

function updateTimelineLayout() {
    const duration = state.arollDuration || 60;
    const trackWidth = duration * state.zoomLevel;
    
    // Ajustar larguras
    el.trackArollContent.style.width = trackWidth + 'px';
    el.trackBrollContent.style.width = trackWidth + 'px';
    el.timelineRuler.width = trackWidth;
    
    // Atualizar bloco visual do A-roll
    if (state.arollFile) {
        el.arollTimelineBlock.style.width = trackWidth + 'px';
        el.arollTimelineBlock.style.left = '0px';
    }

    // Desenhar régua e waveform
    drawTimelineRuler();
    drawWaveform();
    
    // Reposicionar blocos de B-roll e playhead
    drawTimelineBrolls();
    updatePlayheadPosition(state.currentTime);
}

// Desenhar régua de tempo no topo da Timeline
function drawTimelineRuler() {
    if (!rulerCtx) return;
    
    const w = el.timelineRuler.width;
    const h = el.timelineRuler.height;
    
    rulerCtx.clearRect(0, 0, w, h);
    rulerCtx.strokeStyle = 'rgba(255,255,255,0.15)';
    rulerCtx.fillStyle = 'rgba(255,255,255,0.4)';
    rulerCtx.font = '10px Outfit, sans-serif';
    rulerCtx.lineWidth = 1;
    
    const seconds = state.arollDuration || 60;
    
    // Frequência das marcações baseada no zoom
    let step = 1;
    if (state.zoomLevel < 15) step = 10;
    else if (state.zoomLevel < 35) step = 5;
    else if (state.zoomLevel < 60) step = 2;

    for (let i = 0; i <= seconds; i += 1) {
        const x = i * state.zoomLevel;
        
        rulerCtx.beginPath();
        if (i % step === 0) {
            // Major Tick
            rulerCtx.moveTo(x, h);
            rulerCtx.lineTo(x, h - 12);
            rulerCtx.stroke();
            // Texto
            rulerCtx.fillText(formatTimecodeShort(i), x + 4, 14);
        } else {
            // Minor Tick
            rulerCtx.moveTo(x, h);
            rulerCtx.lineTo(x, h - 6);
            rulerCtx.stroke();
        }
    }
}

// Atualizar cursor de tempo (Playhead)
function updatePlayheadPosition(time) {
    const x = time * state.zoomLevel;
    el.timelinePlayhead.style.transform = `translateX(${x}px)`;
}

// Desenhar waveform de áudio no fundo do A-roll
function drawWaveform() {
    if (!waveformCtx || !state.audioBuffer) {
        // Mock de onda estilizada sutil caso não tenha áudio real decodificado
        drawMockWaveform();
        return;
    }
    
    const canvas = el.waveformCanvas;
    canvas.width = el.trackArollContent.clientWidth;
    canvas.height = el.trackArollContent.clientHeight;
    
    const w = canvas.width;
    const h = canvas.height;
    waveformCtx.clearRect(0, 0, w, h);
    
    const buffer = state.audioBuffer;
    const rawData = buffer.getChannelData(0); // Canal esquerdo
    const samples = w; // Um pixel por barra de waveform
    const blockSize = Math.floor(rawData.length / samples);
    
    waveformCtx.fillStyle = 'rgba(99, 102, 241, 0.22)';
    waveformCtx.beginPath();
    
    for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[blockStart + j]);
        }
        let avg = sum / blockSize;
        let barHeight = avg * h * 2.5; // Amplificar visualmente
        barHeight = Math.min(barHeight, h - 10);
        
        const x = i;
        const y = (h - barHeight) / 2;
        waveformCtx.fillRect(x, y, 1, barHeight);
    }
}

function drawMockWaveform() {
    const canvas = el.waveformCanvas;
    canvas.width = el.trackArollContent.clientWidth;
    canvas.height = el.trackArollContent.clientHeight;
    
    const w = canvas.width;
    const h = canvas.height;
    waveformCtx.clearRect(0, 0, w, h);
    
    waveformCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const totalBars = w / 4;
    
    for (let i = 0; i < totalBars; i++) {
        // Gerar ruído pseudo-aleatório baseado no índice para estabilidade no redesenho
        const val = Math.sin(i * 0.1) * Math.cos(i * 0.05);
        const barHeight = Math.abs(val) * (h - 20) + 5;
        const x = i * 4;
        const y = (h - barHeight) / 2;
        waveformCtx.fillRect(x, y, 2, barHeight);
    }
}

// Extração de waveform via Web Audio API em background
async function extractAudioWaveform(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Usar AudioContext offline para não atrapalhar a reprodução ativa
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        
        // Decodificar áudio
        offlineCtx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
            state.audioBuffer = decodedBuffer;
            drawWaveform();
        }, (err) => {
            console.log("Erro decodificando áudio para waveform:", err);
            drawWaveform(); // Fallback para mock
        });
    } catch(e) {
        console.log("Falha geral ao extrair waveform:", e);
        drawWaveform(); // Fallback para mock
    }
}

// Renderizar blocos de B-roll na timeline
function drawTimelineBrolls() {
    el.trackBrollContent.innerHTML = '';
    
    state.timelineBrolls.forEach(block => {
        const div = document.createElement('div');
        div.className = 'broll-block';
        div.setAttribute('data-id', block.id);
        
        // Posicionar baseado no zoom
        div.style.left = (block.start * state.zoomLevel) + 'px';
        div.style.width = (block.duration * state.zoomLevel) + 'px';
        
        if (state.selectedBlockId === block.id) {
            div.classList.add('selected');
        }

        if (block.generating) {
            div.classList.add('generating');
            div.innerHTML = `
                <span class="broll-block-label" style="font-style: italic; color: #a5b4fc;">⚡ Gerando via Flow...</span>
            `;
        } else {
            div.innerHTML = `
                <div class="broll-resizer broll-resizer-left"></div>
                <span class="broll-block-label">${block.mediaName}</span>
                <div class="broll-resizer broll-resizer-right"></div>
            `;
        }

        el.trackBrollContent.appendChild(div);
    });
}

function clearAllTimelineBrolls() {
    if (confirm("Deseja mesmo excluir todas as cenas de B-roll da linha do tempo?")) {
        state.timelineBrolls = [];
        state.selectedBlockId = null;
        drawTimelineBrolls();
        updateExporterData();
        el.btnClearBrolls.disabled = true;
    }
}

// --- INTERAÇÕES DE DRAG & DROP E RESIZE NA TIMELINE ---

function setupTimelineInteraction() {
    let activeAction = null; // 'dragging', 'resizing-left', 'resizing-right', 'playhead-scrub'
    let targetBlockId = null;
    let startX = 0;
    let startLeft = 0;
    let startWidth = 0;
    let timelineRect = null;

    // Clique e arrasto geral na Timeline track
    el.timelineTracks.addEventListener('mousedown', (e) => {
        timelineRect = el.timelineTracks.getBoundingClientRect();
        const scrollLeft = el.timelineScroll.scrollLeft;
        
        // Determinar coordenadas relativas à track de conteúdo
        const clickX = e.clientX - timelineRect.left + scrollLeft;
        
        // Caso 1: Clique no handle do playhead
        if (e.target.classList.contains('playhead-handle') || e.target.closest('.timeline-ruler')) {
            activeAction = 'playhead-scrub';
            seekPlayheadFromMouse(e);
            return;
        }

        // Caso 2: Interações com os blocos de B-roll
        const blockEl = e.target.closest('.broll-block');
        if (blockEl) {
            targetBlockId = blockEl.getAttribute('data-id');
            state.selectedBlockId = targetBlockId;
            drawTimelineBrolls(); // destacar selecionado

            const block = state.timelineBrolls.find(b => b.id === targetBlockId);
            if (!block || block.generating) return;

            startX = e.clientX;
            startLeft = block.start * state.zoomLevel;
            startWidth = block.duration * state.zoomLevel;

            if (e.target.classList.contains('broll-resizer-left')) {
                activeAction = 'resizing-left';
            } else if (e.target.classList.contains('broll-resizer-right')) {
                activeAction = 'resizing-right';
            } else {
                activeAction = 'dragging';
            }
            return;
        }

        // Caso 3: Clique no espaço vazio da track - Move Playhead
        if (e.target.closest('.track-timeline-content')) {
            activeAction = 'playhead-scrub';
            seekPlayheadFromMouse(e);
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!activeAction) return;

        if (activeAction === 'playhead-scrub') {
            seekPlayheadFromMouse(e);
            return;
        }

        const block = state.timelineBrolls.find(b => b.id === targetBlockId);
        if (!block) return;

        const deltaX = e.clientX - startX;

        if (activeAction === 'dragging') {
            const newLeft = Math.max(0, startLeft + deltaX);
            block.start = newLeft / state.zoomLevel;
            
            // Travar no final do A-roll
            if (block.start + block.duration > state.arollDuration) {
                block.start = state.arollDuration - block.duration;
            }
        } 
        else if (activeAction === 'resizing-right') {
            const newWidth = Math.max(10, startWidth + deltaX); // largura mínima de 10px (~0.4s)
            block.duration = newWidth / state.zoomLevel;

            // Encurtar para não passar da duração total
            if (block.start + block.duration > state.arollDuration) {
                block.duration = state.arollDuration - block.start;
            }
        } 
        else if (activeAction === 'resizing-left') {
            const newLeft = Math.max(0, startLeft + deltaX);
            // Evitar empurrar além da borda direita do bloco
            const maxLeft = (startLeft + startWidth) - 10;
            const cappedLeft = Math.min(newLeft, maxLeft);
            
            const newWidth = (startLeft + startWidth) - cappedLeft;
            
            block.start = cappedLeft / state.zoomLevel;
            block.duration = newWidth / state.zoomLevel;
        }

        drawTimelineBrolls();
        updateExporterData();
    });

    window.addEventListener('mouseup', () => {
        if (activeAction) {
            activeAction = null;
            targetBlockId = null;
            state.timelineBrolls.sort((a,b) => a.start - b.start);
            updateExporterData();
        }
    });

    // Tecla Delete/Backspace para apagar bloco selecionado
    window.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedBlockId) {
            // Evitar apagar se o usuário estiver digitando no script editor
            if (document.activeElement === el.scriptText) return;

            state.timelineBrolls = state.timelineBrolls.filter(b => b.id !== state.selectedBlockId);
            state.selectedBlockId = null;
            drawTimelineBrolls();
            updateExporterData();
            if (state.timelineBrolls.length === 0) el.btnClearBrolls.disabled = true;
        }
    });

    // --- SUPORTE A DRAG & DROP DO MENU LATERAL PARA A TIMELINE ---
    el.trackBrollContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.trackBrollContent.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
    });

    el.trackBrollContent.addEventListener('dragleave', () => {
        el.trackBrollContent.style.backgroundColor = '';
    });

    el.trackBrollContent.addEventListener('drop', (e) => {
        e.preventDefault();
        el.trackBrollContent.style.backgroundColor = '';
        
        const mediaId = e.dataTransfer.getData('text/plain');
        if (!mediaId) return;

        const timelineRect = el.trackBrollContent.getBoundingClientRect();
        const scrollLeft = el.timelineScroll.scrollLeft;
        const dropX = e.clientX - timelineRect.left + scrollLeft;
        const dropTime = dropX / state.zoomLevel;

        insertBrollAtTime(mediaId, dropTime);
    });

    function seekPlayheadFromMouse(e) {
        if (!timelineRect) timelineRect = el.timelineTracks.getBoundingClientRect();
        const scrollLeft = el.timelineScroll.scrollLeft;
        const x = Math.max(0, e.clientX - timelineRect.left - 120 + scrollLeft); // 120px é a largura do track-info
        const time = Math.min(state.arollDuration, x / state.zoomLevel);
        
        el.arollVideo.currentTime = time;
        if (!state.isPlaying) {
            handleVideoTimeUpdate();
        }
    }
}

// --- MÓDULO DE EXPORTAÇÃO ---

// Atualiza comandos e dados dos exportadores
function updateExporterData() {
    generateFfmpegCommand();
}

// 1. EDL (Edit Decision List)
function exportEDL() {
    if (state.timelineBrolls.length === 0) {
        alert("Adicione alguns blocos de B-roll na timeline antes de exportar.");
        return;
    }

    const prjName = state.arollFile ? state.arollFile.name.replace(/\.[^/.]+$/, "") : "HeyGen_Project";
    let edl = `TITLE: ${prjName}_B-ROLL\nFCM: NON-DROP FRAME\n\n`;

    // EDL segue o formato de eventos de entrada e saída
    // Cada evento tem duas linhas: A-roll na base, depois B-roll
    let eventNum = 1;
    
    // Escrever A-Roll inicial
    let lastTime = 0;
    
    state.timelineBrolls.forEach((b, idx) => {
        const media = state.brolls.find(m => m.id === b.mediaId);
        const mediaName = media ? media.name.replace(/\.[^/.]+$/, "") : "BROLL";
        
        const evStr = String(eventNum++).padStart(3, '0');
        
        // 1. Corte do A-roll principal
        const arollIn = formatTimecodeEDL(lastTime);
        const arollOut = formatTimecodeEDL(b.start);
        edl += `${evStr}  AX       V     C        ${arollIn} ${arollOut} ${arollIn} ${arollOut}\n`;
        edl += `* FROM CLIP: ${state.arollFile ? state.arollFile.name : "avatar.mp4"}\n\n`;
        
        // 2. Inserção do B-roll sobreposto
        const evStrB = String(eventNum++).padStart(3, '0');
        const brollSrcIn = formatTimecodeEDL(0);
        const brollSrcOut = formatTimecodeEDL(b.duration);
        const brollRecIn = formatTimecodeEDL(b.start);
        const brollRecOut = formatTimecodeEDL(b.start + b.duration);
        
        edl += `${evStrB}  002      V     C        ${brollSrcIn} ${brollSrcOut} ${brollRecIn} ${brollRecOut}\n`;
        edl += `* FROM CLIP: ${media ? media.name : "broll.mp4"}\n\n`;
        
        lastTime = b.start + b.duration;
    });

    // Corte final do A-roll
    if (lastTime < state.arollDuration) {
        const evStr = String(eventNum++).padStart(3, '0');
        const arollIn = formatTimecodeEDL(lastTime);
        const arollOut = formatTimecodeEDL(state.arollDuration);
        edl += `${evStr}  AX       V     C        ${arollIn} ${arollOut} ${arollIn} ${arollOut}\n`;
        edl += `* FROM CLIP: ${state.arollFile ? state.arollFile.name : "avatar.mp4"}\n\n`;
    }

    // Download
    const blob = new Blob([edl], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prjName}_broll_edit.edl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 2. Comando FFmpeg
function generateFfmpegCommand() {
    if (!state.arollFile || state.timelineBrolls.length === 0) {
        el.ffmpegCommandText.value = "Adicione o vídeo do avatar e configure os B-rolls na timeline.";
        return;
    }

    // Construção do comando FFmpeg com complex_filter
    // Exemplo para um B-roll: ffmpeg -i aroll.mp4 -i broll1.mp4 -filter_complex "[0:v][1:v] overlay=enable='between(t,2,5)' [outv]" -map "[outv]" -map 0:a output.mp4
    let inputs = `-i "${state.arollFile.name}"`;
    let filter = "";
    
    // Agrupar inputs de B-roll únicos
    const uniqueBrollMediaIds = [...new Set(state.timelineBrolls.map(b => b.mediaId))];
    const mediaIdToIndex = {};
    
    uniqueBrollMediaIds.forEach((id, idx) => {
        const media = state.brolls.find(m => m.id === id);
        if (media) {
            inputs += ` -i "${media.name}"`;
            mediaIdToIndex[id] = idx + 1; // 0 é o A-roll
        }
    });

    let lastOutputLabel = "[0:v]";
    state.timelineBrolls.forEach((b, idx) => {
        const inputIdx = mediaIdToIndex[b.mediaId];
        const nextLabel = `[v_out${idx}]`;
        
        // Loop/trim B-roll se o bloco for maior que o clipe
        // Overlay filter habilitado apenas na janela 'between(t, start, end)'
        filter += `${lastOutputLabel}[${inputIdx}:v] overlay=enable='between(t,${b.start.toFixed(2)},${(b.start+b.duration).toFixed(2)})':eof_action=pass`;
        
        if (idx === state.timelineBrolls.length - 1) {
            filter += ` [outv]`;
        } else {
            filter += ` ${nextLabel}; `;
            lastOutputLabel = nextLabel;
        }
    });

    const cmd = `ffmpeg ${inputs} -filter_complex "${filter}" -map "[outv]" -map 0:a -c:v libx264 -crf 18 -pix_fmt yuv420p "output_com_brolls.mp4"`;
    
    el.ffmpegCommandText.value = cmd;
    el.ffmpegCommandText.classList.remove('hidden');
}

function copyFfmpegCommand() {
    el.ffmpegCommandText.select();
    document.execCommand('copy');
    
    const origText = el.btnFfmpegCopy.innerHTML;
    el.btnFfmpegCopy.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Copiado!
    `;
    setTimeout(() => { el.btnFfmpegCopy.innerHTML = origText; }, 2000);
}

// 3. Renderização e Gravação Local (Canvas + Web Audio)
async function startBrowserRender() {
    if (!state.arollFile) return;
    if (state.isRendering) return;

    state.isRendering = true;
    el.btnBrowserRender.disabled = true;
    el.renderProgressWrapper.classList.remove('hidden');

    const aVideo = el.arollVideo;
    const bVideo = el.brollVideo;
    
    // Parar qualquer execução ativa
    stopPlayback();

    // Configurar Canvas de Renderização oculto
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = 1280; // Renderizar em HD 720p
    renderCanvas.height = 720;
    const ctx = renderCanvas.getContext('2d');

    // Capturar Stream de Vídeo do Canvas (30 FPS)
    const stream = renderCanvas.captureStream(30);

    // Capturar Áudio do A-roll via Web Audio API para juntar ao vídeo gravado
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioContext.createMediaStreamDestination();
    
    // Conectar áudio do vídeo no gravador
    const sourceNode = audioContext.createMediaElementSource(aVideo);
    
    // Dividir áudio em 2: um para a gravação (full) e outro silenciado para o usuário não escutar eco
    const recorderGain = audioContext.createGain();
    recorderGain.gain.value = 1.0;
    sourceNode.connect(recorderGain);
    recorderGain.connect(dest);

    const speakerGain = audioContext.createGain();
    speakerGain.gain.value = 0.0; // Mudo nos autofalantes
    sourceNode.connect(speakerGain);
    speakerGain.connect(audioContext.destination);

    // Adicionar faixa de áudio no stream gravado
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
        stream.addTrack(audioTrack);
    }

    // Configurar MediaRecorder
    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        // Gravação concluída: baixar arquivo
        const blob = new Blob(chunks, { type: 'video/webm' });
        const downloadUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'render_final_brolls.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Restaurar estado do áudio
        sourceNode.disconnect();
        speakerGain.disconnect();
        recorderGain.disconnect();
        audioContext.close();

        // Recarregar os vídeos na UI
        aVideo.src = state.arollURL;
        aVideo.load();
        
        state.isRendering = false;
        el.btnBrowserRender.disabled = false;
        el.renderProgressWrapper.classList.add('hidden');
    };

    // Iniciar gravação e reprodução do A-roll
    mediaRecorder.start();
    aVideo.currentTime = 0;
    aVideo.play();

    // Loop de renderização no Canvas
    function renderLoop() {
        if (!state.isRendering) return;

        const time = aVideo.currentTime;
        const pct = (time / state.arollDuration) * 100;
        
        // Atualizar barra de progresso na UI
        el.renderPct.textContent = `${Math.min(100, Math.round(pct))}%`;
        el.renderBarFill.style.width = `${pct}%`;

        if (aVideo.ended || time >= state.arollDuration) {
            mediaRecorder.stop();
            aVideo.pause();
            return;
        }

        // Checar se há B-roll sobreposto ativo no frame atual
        const activeBlock = state.timelineBrolls.find(b => time >= b.start && time < (b.start + b.duration));

        if (activeBlock) {
            const media = state.brolls.find(m => m.id === activeBlock.mediaId);
            if (media) {
                // Configurar src do b-roll se for diferente
                if (bVideo.src !== media.url) {
                    bVideo.src = media.url;
                    bVideo.load();
                }
                
                const offset = time - activeBlock.start;
                bVideo.currentTime = offset % media.duration;

                if (bVideo.paused) {
                    bVideo.play().catch(() => {});
                }

                // Desenhar frame do B-roll no canvas
                ctx.drawImage(bVideo, 0, 0, renderCanvas.width, renderCanvas.height);
            } else {
                ctx.drawImage(aVideo, 0, 0, renderCanvas.width, renderCanvas.height);
            }
        } else {
            // Desenhar A-roll (Avatar)
            ctx.drawImage(aVideo, 0, 0, renderCanvas.width, renderCanvas.height);
            if (!bVideo.paused) bVideo.pause();
        }

        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
}

// --- UTILS / MODALS ---

function showModal(modalEl) {
    modalEl.classList.remove('hidden');
}

function hideModal(modalEl) {
    modalEl.classList.add('hidden');
}

function getProxyUrl(url) {
    // Se estiver rodando em localhost tradicional (porta 8000), não usamos o proxy local 
    // pois o python -m http.server não interpreta rotas de API da Vercel.
    const isLocalhostTraditional = window.location.hostname === 'localhost' && window.location.port === '8000';
    if (isLocalhostTraditional) {
        return url;
    }
    // Caso contrário (Vercel ou vercel dev no localhost), usa o proxy serverless nativo
    return `/api/vertex-proxy?url=${encodeURIComponent(url)}`;
}


// Formatador: 00:00.00 (Minutos:Segundos.Centésimos)
function formatTimecode(secs) {
    if (isNaN(secs)) return '00:00.00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

// Formatador Simplificado: 00:00 (Minutos:Segundos)
function formatTimecodeShort(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Formatador EDL: 00:00:00:00 (HH:MM:SS:FF - onde FF são frames a 30fps)
function formatTimecodeEDL(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const f = Math.floor((secs % 1) * 30); // 30 FPS base
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

// --- NOVOS MÉTODOS PARA INTEGRAÇÃO COM GEMINI ---

const DEFAULT_GEMINI_KEY = 'AIzaSyDjzWzg9aiOkGqJwSLpwhzxwWarl6n5cc0';
const DEFAULT_CLAUDE_KEY = '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';

function initCredentials() {
    if (!localStorage.getItem('cfg_gemini_key')) {
        localStorage.setItem('cfg_gemini_key', DEFAULT_GEMINI_KEY);
    }
    if (!localStorage.getItem('cfg_claude_key')) {
        localStorage.setItem('cfg_claude_key', DEFAULT_CLAUDE_KEY);
    }
    if (!localStorage.getItem('cfg_gemini_model')) {
        localStorage.setItem('cfg_gemini_model', 'gemini-2.5-flash');
    }
    
    // Flow Defaults
    const currentFlowUrl = localStorage.getItem('cfg_flow_url');
    if (!currentFlowUrl || currentFlowUrl === '' || currentFlowUrl.includes('veo-2.0-generate-video') || currentFlowUrl.includes('extrator-de-comentarios')) {
        localStorage.setItem('cfg_flow_url', 'https://us-central1-aiplatform.googleapis.com/v1/projects/extrator-de-comentsrios/locations/us-central1/publishers/google/models/veo-2.0-generate-001:predictLongRunning');
        localStorage.setItem('cfg_flow_mode', 'async');
    }



    if (!localStorage.getItem('cfg_flow_headers')) {
        localStorage.setItem('cfg_flow_headers', '{\n  "Content-Type": "application/json"\n}');
    }
    if (!localStorage.getItem('cfg_flow_polling_url')) {
        localStorage.setItem('cfg_flow_polling_url', '');
    }

    
    el.cfgGeminiKey.value = localStorage.getItem('cfg_gemini_key');
    el.cfgClaudeKey.value = localStorage.getItem('cfg_claude_key');
    el.cfgGeminiModel.value = localStorage.getItem('cfg_gemini_model');
    el.cfgFlowUrl.value = localStorage.getItem('cfg_flow_url');
    el.cfgFlowHeaders.value = localStorage.getItem('cfg_flow_headers');
    el.cfgFlowMode.value = localStorage.getItem('cfg_flow_mode');
    el.cfgFlowPollingUrl.value = localStorage.getItem('cfg_flow_polling_url');
    
    toggleFlowPollingView();
}

function toggleFlowPollingView() {
    if (el.cfgFlowMode.value === 'async') {
        el.cfgFlowPollingGroup.classList.remove('hidden');
    } else {
        el.cfgFlowPollingGroup.classList.add('hidden');
    }
}


async function analyzeScriptWithGemini(text) {
    const geminiKey = localStorage.getItem('cfg_gemini_key') || '';
    const model = localStorage.getItem('cfg_gemini_model') || 'gemini-2.5-flash';
    const duration = state.arollDuration || 60;

    if (!geminiKey) {
        alert("Chave do Gemini não configurada. Por favor, abra as configurações.");
        el.chkUseAdvancedAi.checked = false;
        processRawScript();
        return;
    }

    el.suggestionsContainer.innerHTML = `
        <div class="sug-loading-container">
            <div class="sug-spinner"></div>
            <p>Analisando roteiro com a inteligência do Gemini...</p>
            <span style="font-size:10px; color:var(--text-muted);">Isso pode levar alguns segundos</span>
        </div>
    `;
    
    const btnSugTab = document.querySelector('[data-tab="tab-suggestions"]');
    if (btnSugTab) btnSugTab.click();

    const promptText = `Você é um diretor criativo de vídeo especialista em pós-produção. 
Analise o roteiro a seguir em português, falado por um avatar digital. O vídeo tem uma duração total de ${duration.toFixed(1)} segundos.
Seu objetivo é sugerir momentos específicos e estratégicos para inserir cenas de B-roll (apoio visual) de modo a tornar o vídeo dinâmico e reter a atenção do público.

Você deve retornar obrigatoriamente um objeto JSON contendo uma lista de sugestões. O objeto JSON deve ter a propriedade "sugestoes" contendo o array.
Cada item da lista "sugestoes" deve ser um objeto JSON contendo exatamente os seguintes campos em português:
- "tempo": número decimal em segundos representando quando a palavra-chave é pronunciada no vídeo (distribuídos de forma proporcional entre 0 e ${duration.toFixed(1)} segundos). Mantenha um espaçamento mínimo de 3 a 5 segundos entre as sugestões.
- "palavra": a palavra ou termo curto do roteiro que ativa essa sugestão.
- "categoria": categoria temática da cena de B-roll (ex: "Tecnologia", "Negócios", "Finanças", "Criatividade", "Hardware", "Web", "Estilo de Vida").
- "contexto": trecho de frase (até 6 palavras) ao redor do termo chave.
- "sugestao": descrição em português do que deve ser exibido visualmente na cena de apoio.
- "prompt": um prompt de vídeo (em inglês) extremamente detalhado e profissional para ser inserido em geradores de IA (como Runway Gen-3, Luma Dream Machine, Sora ou Kling) para gerar essa cena. Descreva o estilo (cinemático, fotorrealista, 3d, etc.), detalhes do assunto, iluminação (neon, volumétrica, backlight), movimentos de câmera suaves (slow zoom, panning, push in) e atmosfera.

Exemplo de formato esperado:
{
  "sugestoes": [
    {
      "tempo": 5.2,
      "palavra": "inteligência artificial",
      "categoria": "Tecnologia",
      "contexto": "falando sobre inteligência artificial no mercado",
      "sugestao": "Circuito eletrônico brilhando com luzes de neon azul.",
      "prompt": "Cinematic shot of a complex microchip circuit board glowing with blue neon pulses, abstract representation of AI, slow macro lens panning, high detail, photorealistic, 4k"
    }
  ]
}

Roteiro a ser analisado:
"${text}"`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const response = await fetch(getProxyUrl(url), {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resData = await response.json();
        const jsonText = resData.candidates[0].content.parts[0].text.trim();
        const parsedData = JSON.parse(jsonText);

        if (parsedData && parsedData.sugestoes) {
            state.suggestions = parsedData.sugestoes.map((s, idx) => ({
                id: 'sug_ai_' + idx,
                word: s.palavra,
                start: parseFloat(s.tempo),
                tag: s.categoria,
                suggestion: s.sugestao,
                context: s.contexto ? `"... ${s.contexto} ..."` : "",
                prompt: s.prompt
            }));

            state.suggestions.sort((a, b) => a.start - b.start);
            mapWordsWithAiSuggestions(text);
            
            renderInteractiveScript();
            renderAiSuggestions();
            el.interactiveScriptBox.classList.remove('hidden');
        } else {
            throw new Error("Formato JSON inválido retornado pelo Gemini.");
        }

    } catch (err) {
        console.error("Erro na análise do Gemini:", err);
        alert(`Ocorreu um erro ao chamar a IA do Gemini: ${err.message}. Voltando para a análise local simplificada.`);
        el.chkUseAdvancedAi.checked = false;
        
        // Re-processar roteiro localmente
        state.suggestions = [];
        processRawScript();
    }
}

function mapWordsWithAiSuggestions(text) {
    if (state.suggestions.length === 0) return;
    
    state.suggestions.forEach(sug => {
        const wordNorm = sug.word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const match = state.scriptWords.find(w => w.text.toLowerCase() === wordNorm);
        if (match) {
            match.start = sug.start;
            match.end = sug.start + 0.8;
        }
    });
    
    for (let i = 1; i < state.scriptWords.length - 1; i++) {
        const prev = state.scriptWords[i-1];
        const next = state.scriptWords[i+1];
        const curr = state.scriptWords[i];
        
        if (curr.start < prev.start || curr.start > next.start) {
            curr.start = prev.end + 0.1;
            curr.end = curr.start + (next.start - curr.start) / 2;
        }
    }
}

function renderAiSuggestions() {
    const container = el.suggestionsContainer;
    container.innerHTML = '';
    
    el.sugBadge.textContent = state.suggestions.length;

    if (state.suggestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma sugestão encontrada.</p>
            </div>
        `;
        return;
    }

    state.suggestions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.setAttribute('data-time', s.start);
        
        let promptHtml = '';
        if (s.prompt) {
            promptHtml = `
                <div class="sug-prompt-box">
                    <div class="sug-prompt-header">
                        <span>🎬 Prompt de Geração IA (Inglês)</span>
                        <button class="btn-copy-prompt" data-prompt="${encodeURIComponent(s.prompt)}">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copiar Prompt
                        </button>
                    </div>
                    <div class="sug-prompt-text">${s.prompt}</div>
                </div>
            `;
        }

        const flowUrl = localStorage.getItem('cfg_flow_url') || '';
        let flowButtonHtml = '';
        if (s.prompt) {
            flowButtonHtml = `
                <button class="btn btn-sm btn-flow-generate btn-generate-flow" data-prompt="${encodeURIComponent(s.prompt)}" data-time="${s.start}" data-word="${encodeURIComponent(s.word)}">
                    ⚡ Gerar no Flow
                </button>
            `;
        }

        card.innerHTML = `
            <div class="sug-header">
                <span class="sug-tag">${s.tag}</span>
                <span class="sug-time">⏱️ ${formatTimecode(s.start)}</span>
            </div>
            <div class="sug-text">Termo: <strong>${s.word}</strong></div>
            ${s.context ? `<div class="sug-context">${s.context}</div>` : ''}
            <div class="sug-text" style="color:var(--text-main); font-size:12px; margin-top: 4px;">💡 ${s.suggestion}</div>
            ${promptHtml}
            <div class="sug-actions" style="margin-top: 8px; gap: 8px; display: flex;">
                ${flowButtonHtml}
                <button class="btn btn-sm btn-primary btn-add-sug">+ Inserir B-Roll</button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-sug') || e.target.closest('.btn-copy-prompt') || e.target.closest('.btn-generate-flow')) return;
            el.arollVideo.currentTime = s.start;
            handleVideoTimeUpdate();
            document.querySelectorAll('.suggestion-card').forEach(c => c.classList.remove('active-sug'));
            card.classList.add('active-sug');
        });

        card.querySelector('.btn-add-sug').addEventListener('click', (e) => {
            e.stopPropagation();
            openInsertModal(s.start);
        });

        if (s.prompt) {
            const btnFlow = card.querySelector('.btn-generate-flow');
            if (btnFlow) {
                btnFlow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const promptVal = decodeURIComponent(btnFlow.getAttribute('data-prompt'));
                    const timeVal = parseFloat(btnFlow.getAttribute('data-time'));
                    const wordVal = decodeURIComponent(btnFlow.getAttribute('data-word'));
                    triggerGoogleFlowGeneration(promptVal, timeVal, wordVal, btnFlow);
                });
            }

            card.querySelector('.btn-copy-prompt').addEventListener('click', (e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                const promptVal = decodeURIComponent(btn.getAttribute('data-prompt'));
                
                navigator.clipboard.writeText(promptVal).then(() => {
                    const origHtml = btn.innerHTML;
                    btn.innerHTML = `
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Copiado!
                    `;
                    btn.style.color = '#34d399';
                    setTimeout(() => {
                        btn.innerHTML = origHtml;
                        btn.style.color = '';
                    }, 1500);
                }).catch(err => {
                    console.error("Erro de cópia:", err);
                });
            });
        }

        container.appendChild(card);
    });
}

async function triggerGoogleFlowGeneration(prompt, time, word, buttonEl) {
    const flowUrl = localStorage.getItem('cfg_flow_url') || '';
    if (!flowUrl) {
        alert("Antes de disparar a geração, configure a URL do seu Endpoint nas Configurações (⚙️).");
        showModal(el.settingsModal);
        return;
    }

    buttonEl.disabled = true;
    buttonEl.innerHTML = '⚡ Inicializando...';

    // 1. Criar um bloco B-roll temporário (Placeholder) na linha do tempo
    const blockId = 'flow_block_' + Math.random().toString(36).substr(2, 9);
    const block = {
        id: blockId,
        start: time,
        duration: 5, // Padrão: Veo gera vídeos de 5 segundos
        mediaId: '',
        mediaName: `Gerando: "${word}"...`,
        generating: true
    };
    
    state.timelineBrolls.push(block);
    state.timelineBrolls.sort((a, b) => a.start - b.start);
    drawTimelineBrolls();
    
    // 2. Mapeamento do Payload para Vertex AI (GCP) vs Webhook genérico
    const isVertexAI = flowUrl.includes('aiplatform.googleapis.com');
    let payload = {};
    let isAsyncMode = localStorage.getItem('cfg_flow_mode') === 'async';

    if (isVertexAI) {
        // Vertex AI API exige formato structured "instances" e "parameters"
        payload = {
            instances: [
                {
                    prompt: prompt
                }
            ],
            parameters: {
                aspectRatio: "16:9",
                durationSeconds: 5
            }
        };
        // Vertex AI Veo é estritamente assíncrono (gera um Long Running Operation - LRO)
        isAsyncMode = true;
    } else {
        // Formato padrão plano
        payload = {
            prompt: prompt,
            duration: 5,
            aspect_ratio: "16:9",
            timestamp: time,
            keyword: word
        };
    }

    let headers = {};
    try {
        headers = JSON.parse(localStorage.getItem('cfg_flow_headers') || '{}');
    } catch(e) {
        console.error("Erro parsing headers:", e);
    }

    // 3. Disparar Requisição
    fetch(getProxyUrl(flowUrl), {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`Status de erro HTTP: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (!isAsyncMode) {
            // Modo Síncrono: a resposta traz a URL direta do vídeo gerado
            const videoUrl = data.url || data.video_url || data.video || (typeof data === 'string' ? data : '');
            if (videoUrl) {
                finishFlowGeneration(blockId, videoUrl, word);
                buttonEl.innerHTML = '⚡ Concluído!';
                buttonEl.style.background = 'var(--accent)';
                setTimeout(() => {
                    buttonEl.innerHTML = '⚡ Gerar no Flow';
                    buttonEl.style.background = '';
                    buttonEl.disabled = false;
                }, 2000);
            } else {
                throw new Error("URL do vídeo não encontrada no JSON retornado pela API.");
            }
        } else {
            // Modo Assíncrono (Vertex AI ou Flow com fila de tarefas)
            // No Vertex AI, a resposta é um objeto contendo o campo "name" representando a operação (ex: projects/.../locations/us-central1/operations/...)
            const taskId = isVertexAI ? data.name : (data.task_id || data.id || data.taskId);
            if (taskId) {
                startFlowPolling(blockId, taskId, word, buttonEl);
            } else {
                throw new Error("ID de tarefa (task_id / name) não retornado pela API de geração assíncrona.");
            }
        }
    })
    .catch(err => {
        console.error("Erro de geração no Flow:", err);
        alert(`Falha ao disparar a geração de vídeo: ${err.message}`);
        
        // Remover bloco placeholder da timeline
        state.timelineBrolls = state.timelineBrolls.filter(b => b.id !== blockId);
        drawTimelineBrolls();
        buttonEl.disabled = false;
        buttonEl.innerHTML = '⚡ Gerar no Flow';
    });
}

function finishFlowGeneration(blockId, videoUrl, keyword) {
    const libraryId = 'flow_media_' + Math.random().toString(36).substr(2, 9);
    
    // Injetar o recurso na biblioteca local
    const broll = {
        id: libraryId,
        name: `Veo_${keyword.replace(/\s+/g, '_')}.mp4`,
        url: videoUrl,
        duration: 5
    };
    
    state.brolls.push(broll);
    updateBrollMediaList();
    
    // Atualizar o bloco placeholder da timeline para um bloco real ativo
    const block = state.timelineBrolls.find(b => b.id === blockId);
    if (block) {
        block.generating = false;
        block.mediaId = libraryId;
        block.mediaName = broll.name;
    }
    
    drawTimelineBrolls();
    updateExporterData();
    el.btnClearBrolls.disabled = false;
}

function translateGcsUrl(gcsUri) {
    if (!gcsUri || !gcsUri.startsWith('gs://')) return gcsUri;
    const parts = gcsUri.substring(5).split('/');
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    return `https://storage.googleapis.com/${bucket}/${path}`;
}

function startFlowPolling(blockId, taskId, keyword, buttonEl) {
    const flowUrl = localStorage.getItem('cfg_flow_url') || '';
    const isVertexAI = flowUrl.includes('aiplatform.googleapis.com');
    let pollingUrl = '';
    let pollingMethod = 'GET';
    let pollingBody = null;

    if (isVertexAI) {
        // No Vertex AI, usamos o endpoint :fetchPredictOperation via POST
        pollingUrl = flowUrl.replace(':predictLongRunning', ':fetchPredictOperation');
        pollingMethod = 'POST';
        pollingBody = JSON.stringify({ operationName: taskId });
    } else {
        const pollingTemplate = localStorage.getItem('cfg_flow_polling_url') || '';
        if (!pollingTemplate) {
            alert("Tarefa criada, mas nenhuma URL de consulta (polling) foi definida nas configurações.");
            state.timelineBrolls = state.timelineBrolls.filter(b => b.id !== blockId);
            drawTimelineBrolls();
            buttonEl.disabled = false;
            buttonEl.innerHTML = '⚡ Gerar no Flow';
            return;
        }
        pollingUrl = pollingTemplate.replace('{task_id}', taskId);
    }

    let attempts = 0;
    const intervalId = setInterval(() => {
        attempts++;
        // Timeout de 10 minutos (120 tentativas a cada 5s)
        if (attempts > 120) {
            clearInterval(intervalId);
            alert("A geração do vídeo expirou após 10 minutos.");
            state.timelineBrolls = state.timelineBrolls.filter(b => b.id !== blockId);
            drawTimelineBrolls();
            buttonEl.disabled = false;
            buttonEl.innerHTML = '⚡ Gerar no Flow';
            return;
        }

        buttonEl.innerHTML = `⚡ Processando (${attempts * 5}s)...`;

        let headers = {};
        try {
            headers = JSON.parse(localStorage.getItem('cfg_flow_headers') || '{}');
        } catch(e) {}

        fetch(getProxyUrl(pollingUrl), {
            method: pollingMethod,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: pollingBody
        })
        .then(res => {
            if (!res.ok) throw new Error("Erro na consulta da tarefa de vídeo.");
            return res.json();
        })
        .then(data => {
            if (isVertexAI) {
                // Tratar resposta do Long-Running Operation (LRO) do GCP
                if (data.error) {
                    clearInterval(intervalId);
                    throw new Error(data.error.message || "A geração do vídeo falhou no GCP.");
                }
                
                if (data.done === true) {
                    clearInterval(intervalId);
                    let videoUrl = '';
                    if (data.response) {
                        if (data.response.generatedVideos && data.response.generatedVideos[0]) {
                            const gcsUri = data.response.generatedVideos[0].video.uri;
                            videoUrl = translateGcsUrl(gcsUri);
                        } else if (data.response.videos && data.response.videos[0]) {
                            const videoObj = data.response.videos[0];
                            if (videoObj.bytesBase64Encoded) {
                                const mimeType = videoObj.mimeType || 'video/mp4';
                                videoUrl = `data:${mimeType};base64,${videoObj.bytesBase64Encoded}`;
                            } else if (videoObj.gcsUri) {
                                videoUrl = translateGcsUrl(videoObj.gcsUri);
                            }
                        }
                    }
                    
                    if (videoUrl) {
                        finishFlowGeneration(blockId, videoUrl, keyword);
                        buttonEl.innerHTML = '⚡ Concluído!';
                        buttonEl.style.background = 'var(--accent)';
                        setTimeout(() => {
                            buttonEl.innerHTML = '⚡ Gerar no Flow';
                            buttonEl.style.background = '';
                            buttonEl.disabled = false;
                        }, 2000);
                    } else {
                        throw new Error("Geração concluída, mas a URL ou os bytes do vídeo não foram encontrados na resposta.");
                    }
                }
            } else {
                // Tratar webhook genérico
                const status = String(data.status || data.state).toLowerCase();
                const videoUrl = data.url || data.video_url || data.result;

                if (status === 'completed' || status === 'success' || status === 'done' || videoUrl) {
                    clearInterval(intervalId);
                    if (videoUrl) {
                        finishFlowGeneration(blockId, videoUrl, keyword);
                        buttonEl.innerHTML = '⚡ Concluído!';
                        buttonEl.style.background = 'var(--accent)';
                        setTimeout(() => {
                            buttonEl.innerHTML = '⚡ Gerar no Flow';
                            buttonEl.style.background = '';
                            buttonEl.disabled = false;
                        }, 2000);
                    } else {
                        throw new Error("Geração concluída, mas o link do vídeo não foi retornado.");
                    }
                } else if (status === 'failed' || status === 'error') {
                    clearInterval(intervalId);
                    throw new Error("A tarefa falhou ou retornou erro no servidor.");
                }
            }
        })
        .catch(err => {
            clearInterval(intervalId);
            console.error("Erro consultando status:", err);
            alert(`Erro na geração: ${err.message}`);
            
            // Remover do timeline
            state.timelineBrolls = state.timelineBrolls.filter(b => b.id !== blockId);
            drawTimelineBrolls();
            buttonEl.disabled = false;
            buttonEl.innerHTML = '⚡ Gerar no Flow';
        });
    }, 5000);
}

