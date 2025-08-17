# 🎬 Sci-fi Movie Hub

A **Node.js + Express** web application for sci-fi movie fans to browse categories, join discussions, and share comments.  
Includes authentication, password encryption, session handling, and a simple MySQL backend.

---

## ✨ Features

- **User Authentication**
  - Sign up and log in with secure password hashing using `bcrypt`
  - Session-based authentication with `express-session`
  - Change password functionality
- **Discussion Board**
  - View movie categories and discussions
  - Create, update, and delete discussions (user-owned or admin)
  - Add, edit, and delete comments
- **Filtering**
  - Sort discussions and comments by newest or oldest
- **Dark Mode**
  - Toggle light/dark theme with preference saved in `localStorage`
- **Admin Privileges**
  - Admin can edit/delete any discussion or comment
- **Responsive Design**
  - Styled with Bootstrap for desktop & mobile

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** MySQL
- **Templating Engine:** EJS
- **Authentication:** express-session, bcrypt
- **Frontend:** Bootstrap, custom CSS, vanilla JavaScript
- **Other:** MySQL connection pooling

---

## 📂 Project Structure

```text
project/
├── public/ # Static files (CSS, JS, images)
│ ├── css/
│ ├── js/
│ └── img/
├── views/ # EJS templates
│ ├── partials/
│ └── *.ejs
├── dbPool.js # MySQL connection pool config
├── index.js # Main server file
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

1. Clone the Repository
   ```bash
   git clone https://github.com/your-username/sci-fi-movie-hub.git
   cd sci-fi-movie-hub

2. Install Dependencies
   ```bash
   npm install

3. Configure the Database  

   Create a MySQL database (e.g., `scifi_hub`).  

   Create the required tables:  

   ```sql
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     username VARCHAR(255) UNIQUE,
     password VARCHAR(255)
   );

   CREATE TABLE genres (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255)
   );

   CREATE TABLE discussions (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255),
     genre_id INT,
     user_id INT,
     FOREIGN KEY (genre_id) REFERENCES genres(id),
     FOREIGN KEY (user_id) REFERENCES users(id)
   );

   CREATE TABLE comments (
     id INT AUTO_INCREMENT PRIMARY KEY,
     text TEXT,
     discussion_id INT,
     user_id INT,
     FOREIGN KEY (discussion_id) REFERENCES discussions(id),
     FOREIGN KEY (user_id) REFERENCES users(id)
   );

  Add some sample genres:

  INSERT INTO genres (name) VALUES ('Space Opera'), ('Time Travel'), ('Alien Encounters');

  Update ```dbPool.js``` with your database credentials:

  const mysql = require("mysql");
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "your_password",
    database: "scifi_hub"
  });
  module.exports = pool;

4. Run the App
   ```bash
   node index.js

App will be available at http://localhost:3000


🚀 Future Improvements

  Add user avatars

  Pagination for discussions & comments

  Rich text editor for posts

  Search functionality


📜 License

  This project is licensed under the MIT License.
