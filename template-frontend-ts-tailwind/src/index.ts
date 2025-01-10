function redirectToLogin() {
    const currentFile = window.location.pathname.split('/').pop();
  
    if (currentFile !== 'login.html') {
      window.location.href = 'login.html';
    }
  }
  
  // Call the function when the script loads
  redirectToLogin();