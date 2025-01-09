document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.sidebar-link');
    const currentPath = window.location.pathname;
  
    links.forEach(link => {
      if (link.getAttribute('href') === currentPath.slice(1)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });