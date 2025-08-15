// Dark mode functionality

document.addEventListener('DOMContentLoaded', () => {
  // Apply dark mode if it's enabled in localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  const darkModeButton = document.getElementById('dark-mode-button');

  // Toggle dark mode on button click
  if (darkModeButton) {
    darkModeButton.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
  }
});

// Apply dark mode immediately if set
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}
