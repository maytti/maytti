document.addEventListener('DOMContentLoaded', () => {
    const favCards = document.querySelectorAll('.fav-card');
    let hoverCaption = document.getElementById('hover-caption');

    if (!hoverCaption) {
        hoverCaption = document.createElement('div');
        hoverCaption.id = 'hover-caption';
        docu
        ment.body.appendChild(hoverCaption);
    }
favCards.forEach(card => {

    card.addEventListener('mouseenter', (e) => {
        // sempre pega o valor ATUAL do data-title
        hoverCaption.textContent = card.getAttribute('data-title');
        hoverCaption.style.display = 'block';
        updateCaptionPosition(e);
    });

    card.addEventListener('mousemove', (e) => {
        updateCaptionPosition(e);
    });

    card.addEventListener('mouseleave', () => {
        hoverCaption.style.display = 'none';
    });
});


    function updateCaptionPosition(e) {
        const xOffset = 15; // Distância do cursor em X
        const yOffset = 15; // Distância do cursor em Y

        let x = e.clientX + xOffset;
        let y = e.clientY + yOffset;

        // Ajuste para evitar que a legenda saia da tela na direita
        const captionWidth = hoverCaption.offsetWidth;
        if (x + captionWidth > window.innerWidth) {
            x = e.clientX - captionWidth - xOffset;
        }

        // Ajuste para evitar que a legenda saia da tela na parte inferior
        const captionHeight = hoverCaption.offsetHeight;
        if (y + captionHeight > window.innerHeight) {
            y = e.clientY - captionHeight - yOffset;
        }

        hoverCaption.style.left = `${x}px`;
        hoverCaption.style.top = `${y}px`;
    }
});
// Seleciona todos os cards que possuem um data-title e que o hover é desejado
    const hoverElements = document.querySelectorAll(
        '.fav-card, .detail-fav-item, .tag-game-cap-item, .ost-link-card' // <-- Adicionado .ost-link-card
    );
    // ... (restante do código JS)

            // DEIXA A PÁGINA ATUAL SELECIONADA NA HEADER

(function markActiveNav() {
  document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.main-nav .nav-link');
    const currentPath = location.pathname.replace(/\/$/, ""); 
    links.forEach(a => {
      a.classList.remove('active');
      const target = a.getAttribute('data-target');
      const linkPath = a.pathname.replace(/\/$/, ""); 
      if (currentPath === linkPath) {
        a.classList.add('active');}
      else if (linkPath === '/' && currentPath === '') {
        a.classList.add('active');}
      else if (target && currentPath.includes(target)) {
        a.classList.add('active');
      }
    });
  });
})();

document.addEventListener("DOMContentLoaded", () => {
    // Lista de eventos raros
    const easterEggs = [
        {
            chance: 0.05, // 33% de chance
            action: () => {
                const card = document.querySelector('[data-title="Zelda"]');
                if (!card) return;

                card.querySelector("img").src = "/kissutina/favs/imagens/zelda1.png";
                card.querySelector(".fav-rank").textContent = "✨";
                card.dataset.title = "Definitivamente não é a Zelda";
            }
        },

                {
            chance: 0.25, // 33% de chance
            action: () => {
                const card = document.querySelector('[data-title="Zelda"]');
                if (!card) return;

                card.querySelector("img").src = "/kissutina/favs/imagens/zelda2.png";
                card.querySelector(".fav-rank").textContent = "✨";
                card.dataset.title = "Tetra";
            }
        },



    ];

    // Executa cada evento individualmente
    easterEggs.forEach(event => {
        if (Math.random() < event.chance) {
            event.action();
        }
    });
});
