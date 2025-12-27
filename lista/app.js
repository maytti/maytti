// ===============================
// ELEMENTOS PRINCIPAIS DO DOM
// ===============================

// Pega o elemento visual onde a capa do jogo aparece quando passa o mouse.
const GAME_COVER_PREVIEW = document.getElementById('game-cover-preview');

// Pega a <img> dentro desse preview (para trocar a imagem na hora do hover).
const PREVIEW_IMAGE = document.getElementById('preview-image');

// Variável global que vai guardar TODOS os jogos carregados do games.json.
let gamesData = [];

// ===============================
// FILTROS INICIAIS DA PÁGINA
// ===============================

// Esse objeto representa todos os filtros ativos no momento.
// É assim que a página começa carregada: nada filtrado.
let currentFilter = {
    search: '',              // Filtrar pelo nome do jogo
    is_100_percent: false,   // Mostrar apenas platinas (100%)
    status: 'Tudo',          // Filtrar por status (Jogando, Zerado, etc.)
    platform: 'Tudo',        // Filtrar pela plataforma
    min_score: '0',          // Nota exata
    played_year: 'Tudo',     // Filtrar ano em que o jogo foi zerado
    release_year: '',        // Filtrar ano de lançamento
    genre_search: ''         // Busca por gênero
};

// Ordenação inicial: título crescente
let currentSort = 'titulo_asc';

// ===============================
// MAPA DE STATUS DO DOM
// ===============================

// Cada chave representa um status de jogo, e o valor é o container no HTML
// onde os jogos desse status serão colocados.
const STATUS_MAP = {
    'Jogando': document.getElementById('games-jogando'),
    'Zerado': document.getElementById('games-zerados'),
    'Pausado': document.getElementById('games-pausado'),
    'Dropado': document.getElementById('games-dropados'),
    'Backlog': document.getElementById('games-backlog'),
    'Playlist': document.getElementById('games-playlist'),
    'Sem Fim': document.getElementById('games-semfim'),
    'DLC': document.getElementById('games-dlc'),
    'Ports': document.getElementById('games-ports'),
    'Fangames': document.getElementById('games-fangames'),
    'Coleções': document.getElementById('games-col'),
};

// Esse trecho verifica se algum desses IDs não existe no HTML.
// Caso falte algum container, mostra um aviso no console.
Object.entries(STATUS_MAP).forEach(([k, el]) => {
    if (!el) console.warn(`Aviso: container do status "${k}" não encontrado no DOM.`);
});

// ===============================
// CORES DAS NOTAS
// ===============================

// Cada nota de 0 a 10 tem uma cor específica (usada no quadradinho da nota).
const SCORE_COLORS = {
    0:  '#313336',
    1:  '#9A1E2F', 
    2:  '#C9364C', 
    3:  '#D9651C', 
    4:  '#E99C2E', 
    5:  '#E0B547',
    6:  '#6DAE4F',
    7:  '#429352', 
    8:  '#3D7791',
    9:  '#4F4EAD', 
    10: '#5E4FAF', 
    11: '#332585ff'
};


// Retorna a cor correta para uma nota.
// Se a nota não existir, usa cor de 0.
function getScoreColor(nota) {
    const n = Number(nota);
    const scoreKey = (n >= 1 && n <= 11) ? n : 0;
    return SCORE_COLORS[scoreKey];
}

// FUNÇÃO DE DATA
function extractYear(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
}

// ===============================
// CRIAÇÃO VISUAL DE UM JOGO
// ===============================

function isPlatinum(valor) {
    if (typeof valor === "number") return valor === 100;

    if (typeof valor === "string") {
        if (valor.includes("/")) {
            const [a, b] = valor.split("/").map(Number);
            return !isNaN(a) && !isNaN(b) && a === b;
        }
        return Number(valor) === 100;
    }

    return false;
}


function createGameRow(game) {

    // Cria o elemento visual do jogo (linha principal)
    const row = document.createElement('div');
    row.classList.add('game-row');
    row.setAttribute('data-game-id', game.id ?? '');

    // Pega a cor da nota
    const scoreColor = getScoreColor(game.nota_pessoal);


        // Verifica se o jogo é platinado
    // Conteúdo do progresso
    const isPlat = isPlatinum(game.conquistas_percentual);

const progressContent = isPlat ? '🏆' : `${game.conquistas_percentual ?? 0}`;
const trophyClass = isPlat ? 'trophy-bg' : '';



    // Gêneros formatados
    const generosText = Array.isArray(game.generos)
        ? game.generos.join(', ')
        : (game.generos || '—');

    // HTML da linha principal
    row.innerHTML = `
        <div class="col-icon">
            <img src="${game.icone_url || ''}" alt="${(game.titulo || '').replace(/"/g, '')} ícone">
        </div>

        <div class="col-title">
            ${game.titulo || '—'}
        </div>

        <div class="col-score">
            <span class="data-highlight" style="background-color: ${scoreColor};">
                ${game.nota_pessoal ?? '—'}
            </span>
        </div>

        <div class="col-year">
            <span class="data-highlight">${game.ano_lancamento ?? '—'}</span>
        </div>

        <div class="col-dif">
            <span class="data-highlight ${trophyClass}">
                ${progressContent}
            </span>
    `;

    // Conteúdo extra que aparece ao clicar
    const reviewContent = document.createElement('div');
    reviewContent.classList.add('review-content');
    reviewContent.id = `review-${game.id ?? Math.random().toString(36).slice(2)}`;

    reviewContent.innerHTML = `
      <div class="review-text">${game.review || ''}</div>

      <div class="review-info">
  <p><i class="fas fa-desktop"></i> ${game.plataforma || '—'}</p>
  <p><i class="fas fa-puzzle-piece"></i> ${generosText}</p>

  <!-- DATA ZERADO -->
  <p><i class="fas fa-calendar-alt"></i> ${game.data_zerado ?? '—'}</p>

    <!-- DATA ZERADO -->
  <p><i class="fas fa-calendar-alt"></i> ${game.dificuldade ?? '—'}</p>

</div>

    `


    // ===============================
    // EVENTO: HOVER PARA MOSTRAR CAPA
    // ===============================
    row.addEventListener('mouseenter', () => {

        if (!GAME_COVER_PREVIEW || !PREVIEW_IMAGE) return;

        // Troca a imagem
        PREVIEW_IMAGE.src = game.capa_url || '';

        // Mostra visualmente
        GAME_COVER_PREVIEW.classList.add('show');

        const parent = GAME_COVER_PREVIEW.parentElement;
        if (!parent) return;

        // Calcula posição vertical do preview
        const rowRect = row.getBoundingClientRect();
        const wrapperRect = parent.getBoundingClientRect();

        const previewHeight =
            GAME_COVER_PREVIEW.offsetHeight ||
            GAME_COVER_PREVIEW.getBoundingClientRect().height ||
            200;

        let coverTopPosition =
            (rowRect.top - wrapperRect.top) +
            (rowRect.height / 2) -
            (previewHeight / 2);

        GAME_COVER_PREVIEW.style.top = `${coverTopPosition}px`;

        // Alinha à esquerda da linha
        const leftBase = (rowRect.left || 0) - (wrapperRect.left || 0);
        GAME_COVER_PREVIEW.style.left =
            `${leftBase - (GAME_COVER_PREVIEW.offsetWidth || 300) - 16}px`;
    });

    // Evento para sumir com o preview
    row.addEventListener('mouseleave', () => {
        if (!GAME_COVER_PREVIEW || !PREVIEW_IMAGE) return;

        GAME_COVER_PREVIEW.classList.remove('show');

        // Pequeno atraso para evitar piscadas
        setTimeout(() => {
            if (!GAME_COVER_PREVIEW.classList.contains('show')) {
                PREVIEW_IMAGE.src = '';
            }
        }, 350);
    });

    // Evento de clique para mostrar/esconder review
    row.addEventListener('click', () => {
        reviewContent.classList.toggle('show');
    });

    // Agrupa a linha + review em um fragmento
    const fragment = document.createDocumentFragment();
    fragment.appendChild(row);
    fragment.appendChild(reviewContent);

    return fragment;
}

// ===============================
// FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO
// ===============================

async function renderGames(data = gamesData) {

    // Se ainda não carregou o JSON, carrega
    if (data.length === 0) {
        try {
            const response = await fetch('../games1.json');
            gamesData = await response.json();
            data = gamesData;
        } catch (error) {
            console.error('Erro ao carregar games.json:', error);
            return;
        }
    }



    

    // Cria uma cópia filtrável
    let filteredGames = data.slice();

    // ===============================
    // APLICANDO FILTROS
    // ===============================

    // Busca por título
    if (currentFilter.search) {
        const searchTerm = currentFilter.search.toLowerCase();
        filteredGames =
            filteredGames.filter(game =>
                (game.titulo || '').toLowerCase().includes(searchTerm)
            );
    }
    if (currentFilter.is_100_percent) {
    filteredGames = filteredGames.filter(game =>
        isPlatinum(game.conquistas_percentual)
    );
}


    // Filtro de Dificuldade
if (currentFilter.difficulty && currentFilter.difficulty !== 'Tudo') {
    const targetDifficulty = currentFilter.difficulty.toString().toUpperCase();
    filteredGames = filteredGames.filter(game => {
        return game.dificuldade && game.dificuldade.toUpperCase() === targetDifficulty;
    });
}




    // Filtro por status
    if (currentFilter.status && currentFilter.status !== 'Tudo') {
        filteredGames = filteredGames.filter(game => {
            const gameStatus =
                (game.status === 'Platinado' || game.status === 'Zerado')
                ? 'Zerado'
                : (game.status || '');
            return gameStatus === currentFilter.status;
        });
    }

    // Filtro por plataforma
    if (currentFilter.platform && currentFilter.platform !== 'Tudo') {
        const target = currentFilter.platform.toLowerCase();
        filteredGames = filteredGames.filter(game => {
            if (!game.plataforma) return false;
            return game.plataforma.toLowerCase().includes(target);
        });
    }

    // Filtro por nota exata
    if (currentFilter.min_score && currentFilter.min_score !== '0') {
        const targetScore = parseInt(currentFilter.min_score, 10);
        if (!isNaN(targetScore)) {
            filteredGames = filteredGames.filter(game => {
                const gScore = parseInt(game.nota_pessoal, 10);
                return !isNaN(gScore) && gScore === targetScore;
            });
        }
    }

    // Ano zerado
    if (currentFilter.played_year && currentFilter.played_year !== 'Tudo') {
        const targetYear = parseInt(currentFilter.played_year, 10);
        if (!isNaN(targetYear)) {
            filteredGames = filteredGames.filter(game => {
                const year = extractYear(game.data_zerado);
                return year === targetYear;
            });
        }
    }

    // Ano de lançamento
    if (currentFilter.release_year &&
        currentFilter.release_year.toString().trim() !== '') {

        const searchTerm = currentFilter.release_year.toString().trim();

        filteredGames = filteredGames.filter(game => {
            if (game.ano_lancamento === undefined || game.ano_lancamento === null)
                return false;

            return game.ano_lancamento.toString().trim() === searchTerm;
        });
    }


    
    // Gêneros
    if (currentFilter.genre_search &&
        currentFilter.genre_search.trim() !== '') {

        const gTerm = currentFilter.genre_search.toLowerCase();

        filteredGames = filteredGames.filter(game => {
            if (!game.generos) return false;

            if (Array.isArray(game.generos)) {
                return game.generos.some(gn =>
                    gn.toLowerCase().includes(gTerm)
                );
            } else {
                return game.generos.toLowerCase().includes(gTerm);
            }
        });
    }

    // ===============================
    // ORDENAR RESULTADOS
    // ===============================

    filteredGames.sort((a, b) => {

        const parts = currentSort.split('_');
        const direction = parts.pop(); // asc ou desc
        const key = parts.join('_');

        // Ordenação por título
        if (key === 'titulo') {
            const valA = (a.titulo || '').toLowerCase();
            const valB = (b.titulo || '').toLowerCase();
            return direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        let valA = 0, valB = 0;

        // Ordenação por nota
        if (key === 'nota_pessoal') {
            valA = parseFloat(a.nota_pessoal) || 0;
            valB = parseFloat(b.nota_pessoal) || 0;
        }

        // Ordenação por ano
        else if (key === 'ano_lancamento') {
            valA = parseInt(a.ano_lancamento, 10) || 0;
            valB = parseInt(b.ano_lancamento, 10) || 0;
        }

        // Ordenar por data zerado
        else if (key === 'data_zerado') {
            const timeA = parseDateToTimestamp(a.data_zerado);
            const timeB = parseDateToTimestamp(b.data_zerado);
            valA = isNaN(timeA) ? 0 : timeA;
            valB = isNaN(timeB) ? 0 : timeB;
        }

        else if (key === 'dificuldade') {
    const order = ['','C', 'B', 'A', 'AA', 'AAA'];

    const idxA = order.indexOf(a.dificuldade);
    const idxB = order.indexOf(b.dificuldade);

    // colocar itens sem dificuldade no final
    valA = idxA === -1 ? -1 : idxA;
    valB = idxB === -1 ? -1 : idxB;
}

        

        else return 0;

        return direction === 'asc' ? (valA - valB) : (valB - valA);


        


    });



    // ===============================
    // LIMPAR LISTAS / PREPARAR SEÇÕES
    // ===============================

    Object.values(STATUS_MAP).forEach(container => {
        if (!container) return;

        const section = container.closest('.status-section');
        if (section) section.classList.add('hidden');

        container.innerHTML = '';
    });

    // Agrupar jogos por status final
    const gamesByStatus = {};

    filteredGames.forEach(game => {
        const status =
            (game.status === 'Platinado' || game.status === 'Zerado')
            ? 'Zerado'
            : (game.status || 'Outro');

        if (!gamesByStatus[status]) gamesByStatus[status] = [];
        gamesByStatus[status].push(game);
    });

    // Colocar cada jogo no seu container
    Object.keys(gamesByStatus).forEach(statusKey => {

        const gamesList = gamesByStatus[statusKey];
        const targetContainer = STATUS_MAP[statusKey];

        if (targetContainer && gamesList.length > 0) {

            gamesList.forEach(game => {
                targetContainer.appendChild(createGameRow(game));
            });

            const section = targetContainer.closest('.status-section');
            if (section) section.classList.remove('hidden');
        }
    });

    // Contador total
    const totalEl = document.getElementById('total-games');
    if (totalEl) {
        totalEl.textContent = `Total: ${filteredGames.length} Jogos Filtrados`;
    }
}

// ===============================
// LISTENERS DOS FILTROS
// ===============================

function initializeListeners() {

    // Filtro: busca por texto
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilter.search = e.target.value;
            renderGames(gamesData);
        });
    }

        const difficultySelect = document.getElementById('difficulty-filter-select');
    if (difficultySelect) {
        difficultySelect.addEventListener('change', (e) => {
            currentFilter.difficulty = e.target.value;
            renderGames(gamesData);
        });
    }


    // Filtro: apenas 100%
    const toggleButton = document.getElementById('toggle-100-percent');

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            currentFilter.is_100_percent = !currentFilter.is_100_percent;

            toggleButton.dataset.active = currentFilter.is_100_percent ? "1" : "0";

            toggleButton.textContent = currentFilter.is_100_percent
                ? 'Mostrando apenas Platinas'
                : 'Mostrar apenas Platinas';

            renderGames();
        });
    }







    // Filtro por status
    const statusSelect = document.getElementById('status-filter-select');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            currentFilter.status = e.target.value;
            renderGames(gamesData);
        });
    }

    // Filtro por plataforma
    const platformSelect = document.getElementById('platform-filter-select');
    if (platformSelect) {
        platformSelect.addEventListener('change', (e) => {
            currentFilter.platform = e.target.value;
            renderGames(gamesData);
        });
    }

    // Filtro por nota
    const minScoreSelect = document.getElementById('min-score-filter-select');
    if (minScoreSelect) {
        minScoreSelect.addEventListener('change', (e) => {
            currentFilter.min_score = e.target.value;
            renderGames(gamesData);
        });
    }

    // Filtro por ano zerado
    const playedYearSelect = document.getElementById('played-year-filter-select');
    if (playedYearSelect) {
        playedYearSelect.addEventListener('change', (e) => {
            currentFilter.played_year = e.target.value;
            renderGames(gamesData);
        });
    }

    // Filtro por gênero
    const genreInput = document.getElementById('genre-search-input');
    if (genreInput) {
        genreInput.addEventListener('input', (e) => {
            currentFilter.genre_search = e.target.value;
            renderGames(gamesData);
        });
    }

    // Filtro por ano de lançamento
    const releaseYearInput = document.getElementById('release-year-input');
    if (releaseYearInput) {
        releaseYearInput.addEventListener('input', (e) => {
            currentFilter.release_year = e.target.value;
            renderGames(gamesData);
        });
    }

    // Ordenação
    const sortSelect = document.getElementById('sort-filter-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderGames(gamesData);
        });
    }
}

// ===============================
// INICIALIZAÇÃO GERAL DA PÁGINA
// ===============================

(async () => {
    await renderGames();     // Carrega tudo e renderiza
    initializeListeners();   // Ativa filtros
})();

// ===============================
// DESTACAR NAV ATUAL
// ===============================

// Marca o item atual no menu superior
(function markActiveNav() {
    const links = document.querySelectorAll('.main-nav .nav-link');
    const path = location.pathname || '/';

    links.forEach(a => {
        a.classList.remove('active');

        const href = a.getAttribute('href') || '';
        const target = a.getAttribute('data-target') || '';

        if (href !== '/' && href !== '' && path.startsWith(href)) {
            a.classList.add('active');
        }
        else if (href === '/' && path === '/') {
            a.classList.add('active');
        }
        else if (target && path.includes(target)) {
            a.classList.add('active');
        }
    });
})();
