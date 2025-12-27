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

window.addEventListener("load", () => {
    document.querySelectorAll(".track").forEach(track => {
        // re-trigger animation
        track.style.animation = "none";
        void track.offsetWidth; // força recalcular layout
        track.style.animation = "";
    });
});
