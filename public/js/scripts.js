document
  .getElementById("loginForm")
  .addEventListener("submit", function (event) {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      event.preventDefault();
      alert("Please fill out all fields.");
      return;
    }
  });

document
  .getElementById("signupForm")
  .addEventListener("submit", function (event) {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      event.preventDefault();
      alert("Please fill out all fields.");
      return;
    }
  });
