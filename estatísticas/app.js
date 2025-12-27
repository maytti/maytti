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


// Variável global para armazenar os dados carregados
let jogosData = [];

// Referências para as instâncias dos gráficos
let chartLancamentoInstance = null;
let chartZeradoInstance = null;
let chartNotasInstance = null;
let chartGenerosInstance = null;
let chartPlatformInstance = null;
let statusChart = null;


// --- 1. FUNÇÕES DE CARREGAMENTO E INICIALIZAÇÃO ---

async function loadData() {
    try {
        const loadingIndicator = document.getElementById('loading-indicator');
        const contentGeral = document.getElementById('content-geral');
        const contentGraficos = document.getElementById('content-graficos');

        loadingIndicator.classList.remove('hidden');
        contentGeral.classList.add('hidden');
        contentGraficos.classList.add('hidden');

        const response = await fetch('../games1.json'); 
        if (!response.ok) {
            throw new Error(`Erro ao carregar jogos.json: ${response.statusText}`);
        }
        jogosData = await response.json();

        
        const stats = calculateGeneralStats(jogosData);
        renderGeneralStats(stats);
        
        loadingIndicator.classList.add('hidden');
        contentGeral.classList.remove('hidden');
        contentGraficos.classList.remove('hidden');
        
        renderAllCharts();

    } catch (error) {
        console.error("Erro ao carregar ou processar dados:", error);
        document.getElementById('loading-indicator').innerHTML = `<p class="text-red-500">❌ Erro ao carregar dados. Verifique o console.</p>`;
    }

}
// --- 2. FUNÇÕES DE AGREGAÇÃO DE DADOS ---
function calculateGeneralStats(data) {
    const currentYear = 2025; 
    
    if (!data || data.length === 0) {
        return { 
            totalJogos: 0, totalTime: 0, avgNota: 0, avgConquistas: 0, jogosZerados: 0, 
            jogos100Percent: 0, gamesInPlaylist: 0, gamesCompletedThisYear: 0, mostPlayedPlatform: 'N/A',
            jogosDropados: 0
        };
    }

    const reviewedGames = data.filter(j => (j.nota_pessoal || 0) > 0);
    const totalTimeAll = data.reduce((sum, j) => sum + (j.tempo_jogo_horas || 0), 0);
    
    const timeTrackingGames = data.filter(j => (j.tempo_jogo_horas || 0) > 0);
    const totalTimeTracking = timeTrackingGames.reduce((sum, j) => sum + (j.tempo_jogo_horas || 0), 0);
    
    const achievementTrackingGames = data.filter(j => (j.conquistas_percentual || 0) > 0);
    const totalConquistasTracking = achievementTrackingGames.reduce((sum, j) => sum + (j.conquistas_percentual || 0), 0);
9
    const totalNotas = reviewedGames.reduce((sum, j) => sum + (j.nota_pessoal || 0), 0);
    const jogos100Percent = data.filter(j => isPlatinum(j.conquistas_percentual)).length;

    
    // --- NOVAS REGRAS DE CONTAGEM ---
    
    // Jogos Zerados: Soma "Zerado" + "Sem Fim"
    const jogosZerados = data.filter(j => j.status === "Zerado" || j.status === "Sem Fim"|| j.status === 'DLC' || j.status === 'Ports'|| j.status === 'Coleções').length;

    // Jogos Dropados: Apenas "Dropado"
    const jogosDropados = data.filter(j => j.status === "Dropado").length;

    // Jogos em Playlist: Tudo que NÃO for Zerado, Sem Fim ou Dropado
    const gamesInPlaylist = data.filter(j => 
        j.status !== "Zerado" && 
        j.status !== "Sem Fim" && 
        j.status !== "Dropado"&& 
         j.status !== "col"&& 
          j.status !== "DLC"&& 
           j.status !== "Ports"
    ).length; 

    const gamesCompletedThisYear = data.filter(j => j.data_zerado === currentYear).length; 

    const platformCounts = {};
    data.forEach(j => {
        if (j.plataforma) {
            platformCounts[j.plataforma] = (platformCounts[j.plataforma] || 0) + 1;
        }
    });
    let mostPlayedPlatform = 'N/A';
    let maxCount = 0;
    for (const platform in platformCounts) {
        if (platformCounts[platform] > maxCount) {
            maxCount = platformCounts[platform];
            mostPlayedPlatform = platform;
        }
    }
    
    return {
        totalJogos: data.length,
        avgNota: reviewedGames.length > 0 ? (totalNotas / reviewedGames.length).toFixed(1) : 0,
        jogosZerados: jogosZerados, // Agora inclui Sem Fim
        jogosDropados: jogosDropados, // Novo campo
        jogos100Percent: jogos100Percent,
        gamesInPlaylist: gamesInPlaylist, 
        gamesCompletedThisYear: gamesCompletedThisYear,
        mostPlayedPlatform: mostPlayedPlatform
    };
}
// Agregação dividida por status (Done vs Todo)
function aggregateByYearSplit(data, yearKey) {
    const aggregated = {};
    
    data
        .filter(j => j[yearKey] > 0)
        .forEach(jogo => {
            const ano = jogo[yearKey];

            if (!aggregated[ano]) {
                aggregated[ano] = { 
                    done: { count: 0, totalNota: 0, countNota: 0 },
                    drop: { count: 0, totalNota: 0, countNota: 0 },
                    todo: { count: 0, totalNota: 0, countNota: 0 }
                };
            }

            // Normalize status para evitar erro de capitalização ou espaços
            const status = (jogo.status || "").trim().toLowerCase();

            let group = "todo";
            if (["zerado","sem fim","dlc","ports","coleções"].includes(status)) {
                group = "done";
            } else if (status === "dropado") {
                group = "drop";
            }

            aggregated[ano][group].count++;
            aggregated[ano][group].totalTime += (jogo.tempo_jogo_horas || 0);

            if ((jogo.nota_pessoal || 0) > 0) {
                aggregated[ano][group].totalNota += jogo.nota_pessoal;
                aggregated[ano][group].countNota++;
            }
        });

    return Object.keys(aggregated).sort().map(ano => {
        const { done, drop, todo } = aggregated[ano];

        return {
            year: ano,
            done: {
                count: done.count,
                total_tempo: done.totalTime,
                avg_nota: done.countNota > 0 ? done.totalNota / done.countNota : 0
            },
            drop: {
                count: drop.count,
                total_tempo: drop.totalTime,
                avg_nota: drop.countNota > 0 ? drop.totalNota / drop.countNota : 0
            },
            todo: {
                count: todo.count,
                total_tempo: todo.totalTime,
                avg_nota: todo.countNota > 0 ? todo.totalNota / todo.countNota : 0
            }
        };
    });
}

function aggregateByRating(data) {
    const ratingCounts = {};
    for (let i = 1; i <= 10; i++) {
        ratingCounts[i] = 0;
    }
    data.filter(j => (j.nota_pessoal || 0) > 0).forEach(j => {
        const note = Math.round(j.nota_pessoal);
        if (note >= 1 && note <= 10) {
            ratingCounts[note]++;
        }
    });
    return Object.keys(ratingCounts).map(note => ({
        note: note,
        count: ratingCounts[note]
    }));
}
function aggregateByGenre(data) {
    const genreCounts = {};
    data.forEach(j => {
        if (j.generos && Array.isArray(j.generos)) {
            j.generos.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
        }
    });
    return Object.keys(genreCounts).map(genre => ({
        genre: genre,
        count: genreCounts[genre]
    })).sort((a, b) => b.count - a.count);
}
function aggregateByPlatform(data) {
    const platformCounts = {};
    data.forEach(j => {
        if (j.plataforma) {
            platformCounts[j.plataforma] = (platformCounts[j.plataforma] || 0) + 1;
        }
    });
    return Object.keys(platformCounts).map(platform => ({
        platform: platform,
        count: platformCounts[platform]
    })).sort((a, b) => b.count - a.count);
}
// --- 3. RENDERIZAÇÃO ---

function renderGeneralStats(stats) {
    const container = document.getElementById('stats-container');
    container.innerHTML = ''; 

    // Lista atualizada com 10 itens (incluindo Dropados)
    const statsList = [
        { label: "Total de Jogos", value: stats.totalJogos, icon: "🎮", tailwind: 'indigo-500' },
        { label: "Total de Platinas", value: stats.jogos100Percent, icon: "🥇", tailwind: 'amber-500' }, 
        { label: "Zerados em 2025", value: stats.gamesCompletedThisYear, icon: "📅", tailwind: 'blue-500' }, 
        { label: "Nota Média", value: stats.avgNota, icon: "⭐", tailwind: 'pink-500' },


    ];

    statsList.forEach(stat => {
        const card = document.createElement('div');
        card.className = `data-card p-4 rounded-lg bg-card-bg transition duration-300 hover:scale-[1.02] transform border-l-4 border-${stat.tailwind}`;
        card.innerHTML = `
            <div class="text-3xl mb-1">${stat.icon}</div>
            <p class="text-sm font-medium text-gray-400 truncate">${stat.label}</p>
            <p class="text-2xl font-extrabold text-white truncate" title="${stat.value}">${stat.value}</p>
        `;
        container.appendChild(card);
    });
}
function createChart(ctx, chartType, data, options, chartInstanceRef) {
    const instance = chartInstanceRef.current; 
    if (instance) {
        instance.destroy();
    }
    const newChart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
    });
    chartInstanceRef.current = newChart; 
    return newChart;
}
function generateColors(count) {
    const colors = ['#9A1E2F', '#C9364C', '#D9651C', '#E99C2E', '#E0B547', '#6DAE4F', '#429352', '#3D7791', '#4F4EAD', '#754FAB'];
    return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
}
// Gráfico de Barras Empilhadas (Ano)
function renderYearChart(canvasId, yearKey, metric) {
    if (jogosData.length === 0) return;

    const splitData = aggregateByYearSplit(jogosData, yearKey);
    
    let dataKey;
    let labelMain;
    let yAxisTitle;
    
    if (metric === 'count') {
        dataKey = 'count';
        labelMain = "Quantidade";
        yAxisTitle = 'Número de Jogos';
    } else if (metric === 'avg_nota') {
        dataKey = 'avg_nota';
        labelMain = "Nota Média";
        yAxisTitle = 'Nota';
    } else { 
        dataKey = 'total_tempo'; 
        labelMain = "Tempo Total (h)"; 
        yAxisTitle = 'Tempo em Horas';
    }
    
    const selectElement = document.getElementById(canvasId.replace('chart', 'select'));
    if (selectElement) {
        const avgTimeOption = selectElement.querySelector('option[value="avg_tempo"]');
        if (avgTimeOption) {
            avgTimeOption.value = "total_tempo";
            avgTimeOption.textContent = "Tempo Total (Horas)";
        }
    }

    const labels = splitData.map(d => d.year);
    const isLine = (dataKey === 'avg_nota');
    const chartType = isLine ? 'line' : 'bar';

    const datasets = [
        {
            label: `Zerados (${labelMain})`,
            data: splitData.map(d => d.done[dataKey]),
            backgroundColor: isLine ? 'rgba(16, 185, 129, 0.2)' : '#00C878', // Emerald
            borderColor: '#10b981',
            borderWidth: isLine ? 3 : 0,
            stack: 'stack0',
            borderRadius: 2
        },{
            label: `Playlist (${labelMain})`,
            data: splitData.map(d => d.todo[dataKey]),
            backgroundColor: isLine ? 'rgba(79, 70, 229, 0.2)' : '#6A5ACD', // Indigo
            borderColor: '#4f46e5',
            borderWidth: isLine ? 3 : 0,
            stack: 'stack0', 
            borderRadius: 2
        },{
            label: `Dropados (${labelMain})`,
            data: splitData.map(d => d.drop[dataKey]),
            backgroundColor: isLine ? 'rgba(79, 70, 229, 0.2)' : '#FF5A5A', // Indigo
            borderColor: '#e546cbff',
            borderWidth: isLine ? 3 : 0,
            stack: 'stack0', 
            borderRadius: 2
        }
    ];

    const ctx = document.getElementById(canvasId).getContext('2d');
    const instanceRef = canvasId === 'chartLancamento' ? { current: chartLancamentoInstance } : { current: chartZeradoInstance };

    const newChart = createChart(ctx, chartType, {
        labels: labels,
        datasets: datasets
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, labels: { color: '#e5e7eb' } },
            title: { display: false }
        },
        scales: {
            x: {
                title: { display: true, text: 'Ano', color: '#9ca3af' },
                ticks: { color: '#e5e7eb' },
                grid: { color: '#374151' },
                stacked: !isLine 
            },
            y: {
                title: { display: true, text: yAxisTitle, color: '#9ca3af' },
                ticks: { color: '#e5e7eb', beginAtZero: true },
                grid: { color: '#374151' },
                stacked: !isLine,
                suggestedMax: dataKey === 'avg_nota' ? 10 : undefined
            }
        }
    }, instanceRef);

    if (canvasId === 'chartLancamento') chartLancamentoInstance = newChart;
    if (canvasId === 'chartZerado') chartZeradoInstance = newChart;
}

function renderRatingChart() {
    if (jogosData.length === 0) return;

    const ratingData = aggregateByRating(jogosData);
    const labels = ratingData.map(d => d.note);
    const dataValues = ratingData.map(d => d.count);

    const ctx = document.getElementById('chartNotas').getContext('2d');
    chartNotasInstance = createChart(ctx, 'bar', {
        labels: labels,
        datasets: [{
            label: 'Quantidade de Jogos',
            data: dataValues,
            backgroundColor: generateColors(labels.length),
            borderRadius: 6
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: {
                title: { display: true, text: 'Nota Pessoal (1-10)', color: '#9ca3af' },
                ticks: { color: '#e5e7eb' },
                grid: { color: '#374151' }
            },
            y: {
                title: { display: true, text: 'Número de Jogos', color: '#9ca3af' },
                ticks: { color: '#e5e7eb', stepSize: 1, beginAtZero: true },
                grid: { color: '#374151' }
            }
        }
    }, { current: chartNotasInstance });
}

function renderGenreChart(limit = 10) {
    if (jogosData.length === 0) return;

    let genreData = aggregateByGenre(jogosData);

    // ordenar antes (caso não esteja)
    genreData.sort((a, b) => b.count - a.count);

    // aplicar limite
    let filtered = limit === "all" ? genreData : genreData.slice(0, Number(limit));

    const labels = filtered.map(d => d.genre);
    const dataValues = filtered.map(d => d.count);

    const ctx = document.getElementById('chartGeneros').getContext('2d');

    chartGenerosInstance = createChart(ctx, 'doughnut', {
        labels: labels,
        datasets: [{
            label: 'Quantidade',
            data: dataValues,
            backgroundColor: generateColors(labels.length),
            hoverOffset: 8,
            borderWidth: 0
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#e5e7eb' }
            },
            title: { display: false }
        }
    }, { current: chartGenerosInstance });
}

document.getElementById("genreLimit").addEventListener("change", function () {
    renderGenreChart(this.value);
});



function renderPlatformChart(limit = 10) {
    if (jogosData.length === 0) return;

    let platformData = aggregateByPlatform(jogosData);

    // Remover plataformas inválidas
    platformData = platformData.filter(d => {
        if (!d.platform) return false;
        const p = d.platform.trim().toLowerCase();
        return p !== "nenhuma" && p !== "nenhum" && p !== "none" && p !== "n/a";
    });

    // Ordenar por quantidade
    platformData.sort((a, b) => b.count - a.count);

    // Aplicar limite (ou todos)
    let filtered =
        limit === "all"
            ? platformData
            : platformData.slice(0, Number(limit));

    const labels = filtered.map(d => d.platform);
    const dataValues = filtered.map(d => d.count);

    const canvas = document.getElementById('chartPlatform');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Destruir instância antiga
    if (chartPlatformInstance) {
        try { chartPlatformInstance.destroy(); } catch (e) {}
    }

    chartPlatformInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: dataValues,
                backgroundColor: generateColors(labels.length),
                hoverOffset: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#e5e7eb' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((s, v) => s + v, 0);
                            const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

document.getElementById("platformLimit")
    .addEventListener("change", function () {
        renderPlatformChart(this.value);
    });



function renderStatusChart() {
    if (jogosData.length === 0) return;

    const statusData = aggregateByStatus(jogosData);
    let labels = Object.keys(statusData);
    let dataValues = Object.values(statusData);

    // --- Ordenação decrescente ---
    const combined = labels.map((label, i) => ({
        label,
        value: dataValues[i]
    }));

    combined.sort((a, b) => b.value - a.value);

    labels = combined.map(item => item.label);
    dataValues = combined.map(item => item.value);
    // ------------------------------

    const canvas = document.getElementById('chartStatus');
    if (!canvas) {
        console.error("Canvas chartStatus NÃO encontrado no HTML!");
        return;
    }

    const ctx = canvas.getContext('2d');

    statusChart = createChart(ctx, 'bar', {
        labels: labels,
        datasets: [{
            label: 'Quantidade de Jogos',
            data: dataValues,
            backgroundColor: generateColors(labels.length),
            borderRadius: 6
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: {
                title: { display: true, text: 'Status', color: '#9ca3af' },
                ticks: { color: '#e5e7eb' },
                grid: { color: '#374151' }
            },
            y: {
                title: { display: true, text: 'Quantidade', color: '#9ca3af' },
                ticks: { color: '#e5e7eb', stepSize: 1, beginAtZero: true },
                grid: { color: '#374151' }
            }
        }
    }, { current: statusChart });
}
function aggregateByStatus(data) {
    const result = {};

    data.forEach(j => {
        const status = j.status || "Sem status";
        result[status] = (result[status] || 0) + 1;
    });

    return result;
}
function renderAllCharts() {
    renderYearChart('chartLancamento', 'ano_lancamento', 'count');
    renderYearChart('chartZerado', 'data_zerado', 'count');

    renderRatingChart();
    renderGenreChart(10);
    renderPlatformChart(10);

    // ---- ADICIONE ISSO ----
const statusCounts = aggregateByStatus(jogosData);
renderStatusChart();

}
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    const selLanc = document.getElementById('select-lancamento');
    if(selLanc) {
        selLanc.addEventListener('change', () => {
            let val = selLanc.value;
            if (val === 'avg_tempo') val = 'total_tempo';
            renderYearChart('chartLancamento', 'ano_lancamento', val);
        });
    }

    const selZer = document.getElementById('select-zerado');
    if(selZer) {
        selZer.addEventListener('change', () => {
            let val = selZer.value;
            if (val === 'avg_tempo') val = 'total_tempo';
            renderYearChart('chartZerado', 'data_zerado', val);
        });
    }
});
(function markActiveNav() {
  // Garante que o DOM carregou (caso o script esteja no <head>)
  document.addEventListener('DOMContentLoaded', () => {
      
    const links = document.querySelectorAll('.main-nav .nav-link');
    
    // Normaliza o path atual (remove barra no final para evitar erros de comparação)
    const currentPath = location.pathname.replace(/\/$/, ""); 

    links.forEach(a => {
      a.classList.remove('active');
      
      // Pega o data-target original
      const target = a.getAttribute('data-target');
      
      // A MÁGICA: a.pathname pega o caminho resolvido absoluto do link, não o texto relativo
      const linkPath = a.pathname.replace(/\/$/, ""); 

      // Debug: Abre o console (F12) para ver o que está sendo comparado se der erro
      // console.log('Atual:', currentPath, '| Link:', linkPath);

      // 1. Comparação Exata (Ideal para index.html e links diretos)
      if (currentPath === linkPath) {
        a.classList.add('active');
      }
      // 2. Se o link for a raiz "/" e estivermos na raiz
      else if (linkPath === '/' && currentPath === '') {
        a.classList.add('active');
      }
      // 3. Sua lógica original do data-target (se a URL contiver a palavra "favoritos")
      else if (target && currentPath.includes(target)) {
        a.classList.add('active');
      }
    });
  });
})();