const express = require("express");
const app = express();
const session = require("express-session");
const mysql = require("mysql");
const pool = require("./dbPool.js");
const bcrypt = require("bcrypt");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Top Secret!",
    resave: true,
    saveUninitialized: true,
    cookie: {
      // richard added
      secure: false, // Set to true in production
      maxAge: 3600000, // 1 hour
    },
  }),
);

// Added this to check the session data in the server console
app.use((req, res, next) => {
  console.log("Session Data:", req.session);
  next();
});

// Updated this
app.get("/", (req, res) => {
  const query = "SELECT * FROM genres";
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching genres:", err);
      return;
    }
    const username = req.session.user ? req.session.user.username : null;
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.render("home", { genres: results, username, successMessage });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", { loginError: true });
  }

  if (username === "admin" && password === "secret") {
    req.session.user = { username };
    return res.redirect("/");
  }

  const query = "SELECT * FROM users WHERE username = ?";
  pool.query(query, [username], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.render("login", { loginError: true });
    }

    if (results.length === 0) {
      return res.render("login", { loginError: true });
    }
    const user = results[0];

    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.render("login", { loginError: true });
    }
    req.session.user = user;
    res.redirect("/");
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return;
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("signup", { signupError: "All fields are required." });
  }

  const checkUserQuery = "SELECT * FROM users WHERE username = ?";
  pool.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error("Error checking username:", err);
      return res.render("signup", {
        signupError: "Server error. Please try again later.",
      });
    }

    if (results.length > 0) {
      return res.render("signup", {
        signupError: "Username already exists. Please choose another username.",
      });
    }

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.render("signup", { signupError: true });
      }

      const query = "INSERT INTO users (username, password) VALUES (?, ?)";
      pool.query(query, [username, hash], (err, results) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.render("signup", { signupError: true });
        }
        req.session.user = { username };
        req.session.successMessage = "Sign up successful! Welcome!";
        res.redirect("/");
      });
    });
  });
});

function isLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/discussions", isLoggedIn, (req, res) => {
  const query = "SELECT * FROM discussions";
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching discussions:", err);
      return;
    }
    res.render("discussions", { discussions: results });
  });
});

app.get("/category/:id", (req, res) => {
  const id = req.params.id;
  const filter = req.query.filter || 'recent';
  let order = "DESC";

  if (filter === "oldest") {
    order = "ASC";
  }
  
  const query = `SELECT * FROM discussions WHERE genre_id = ? ORDER BY id ${order}`;
  
  pool.query(query, id, (err, results) => {
    if (err) {
      console.error("Error fetching discussions:", err);
      return;
    }
    const categoryQuery = "SELECT * FROM genres WHERE id = ?";
    pool.query(categoryQuery, id, (err, categoryResults) => {
      if (err) {
        console.error("Error fetching category:", err);
        return;
      }
      const isLoggedIn = isUserLoggedIn(req);

      res.render("category", {
        category: categoryResults[0],
        discussions: results,
        isLoggedIn: isLoggedIn,
        userId: req.session.user
          ? req.session.user.username === "admin"
            ? "admin"
            : req.session.user.id
          : null,
      });
    });
  });
});

app.post("/category/:id/new-discussion", (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const user = req.session.user.id;
  const query = "INSERT INTO discussions (title, genre_id, user_id) VALUES (?, ?, ?)";
  pool.query(query, [title, id, user], (err, results) => {
    if (err) {
      console.error("Error creating discussion:", err);
      return;
    }
    res.redirect(`/category/${id}`);
  });
});

app.get("/discussion/:id", (req, res) => {
  const id = req.params.id;
  const filter = req.query.filter || 'recent';
  let order = "DESC";

  if (filter === "oldest") {
    order = "ASC";
  }
  
  const discussionQuery = "SELECT * FROM discussions WHERE id = ?";
  pool.query(discussionQuery, id, (err, discussionResults) => {
    if (err) {
      console.error("Error fetching discussion:", err);
      return;
    }
    const commentsQuery = `SELECT * FROM comments WHERE discussion_id = ? ORDER BY id ${order}`;
    pool.query(commentsQuery, id, (err, commentsResults) => {
      if (err) {
        console.error("Error fetching comments:", err);
        return;
      }
      const isLoggedIn = isUserLoggedIn(req); 
      res.render("discussion", {
        discussion: discussionResults[0],
        comments: commentsResults,
        isLoggedIn: isLoggedIn,
        userId: req.session.user
          ? req.session.user.username === "admin"
            ? "admin"
            : req.session.user.id
          : null,
      });
    });
  });
});

app.post("/discussion/:id/new-comment", (req, res) => {
  const id = req.params.id;
  const text = req.body.text;
  const user = req.session.user.id; // Inserting user id to comments table
  const query =
    "INSERT INTO comments (text, discussion_id, user_id) VALUES (?, ?, ?)";
  pool.query(query, [text, id, user], (err, results) => {
    if (err) {
      console.error("Error creating comment:", err);
      return;
    }
    res.redirect(`/discussion/${id}`);
  });
});

app.get("/commentUpdate", isLoggedIn, (req, res) => {
  const comment_id = req.query.comment_id;
  const query = "SELECT * FROM comments WHERE id = ?";
  pool.query(query, comment_id, (err, results) => {
    if (err) {
      console.error("Error fetching comment:", err);
      return;
    }
    res.render("updateComment", { comment: results });
  });
});

app.post("/commentUpdate/:id", isLoggedIn, (req, res) => {
  const discussion_id = req.body.discussion_id;
  const comment_id = req.params.id;
  const text = req.body.text;
  const query = "UPDATE comments SET text = ? WHERE id = ?";
  pool.query(query, [text, comment_id], (err, results) => {
    if (err) {
      console.error("Error updating comment:", err);
      return;
    }
    const commentsQuery = "SELECT * FROM comments WHERE discussion_id = ?";
    pool.query(commentsQuery, discussion_id, (err, commentsResults) => {
      if (err) {
        console.error("Error fetching comments:", err);
        return;
      }
      const discussionQuery = "SELECT * FROM discussions WHERE id = ?";
      pool.query(discussionQuery, discussion_id, (err, discussionResults) => {
        if (err) {
          console.error("Error fetching discussion:", err);
          return;
        }
        const isLoggedIn = isUserLoggedIn(req);
        res.render("discussion", {
          discussion: discussionResults[0],
          comments: commentsResults,
          isLoggedIn: isLoggedIn,  
          userId: req.session.user ? (req.session.user.username === 'admin' ? 'admin' : req.session.user.id) : null
        });
      });
    });
  });
});

app.get("/commentDelete", isLoggedIn, (req, res) => {
  const discussion_id = req.query.discussion_id;
  const comment_id = req.query.comment_id;
  const query = "DELETE FROM comments WHERE id = ?";
  pool.query(query, comment_id, (err, results) => {
    if (err) {
      console.error("Error deleting comment:", err);
      return;
    }
    res.redirect(`/discussion/${discussion_id}`);
  });
});

app.get("/discussionUpdate", isLoggedIn, (req, res) => {
  const discussion_id = req.query.discussion_id;
  const query = "SELECT * FROM discussions WHERE id = ?";
  pool.query(query, discussion_id, (err, results) => {
    if (err) {
      console.error("Error fetching discussion:", err);
      return;
    }
    res.render("updateDiscussion", { discussion: results });
  });
});

app.post("/discussionUpdate/:id", isLoggedIn, (req, res) => {
  const discussionId = req.params.id;
  const title = req.body.title;
  const genre_id = req.body.genre_id;
  const query = "UPDATE discussions SET title = ? WHERE id = ?";
  pool.query(query, [title, discussionId], (err, results) => {
    if (err) {
      console.error("Error updating discussion:", err);
      return;
    }
    const discussionQuery = "SELECT * FROM discussions WHERE genre_id = ?";
    pool.query(discussionQuery, genre_id, (err, discussionResults) => {
      if (err) {
        console.error("Error fetching discussion:", err);
        return;
      }
      const genreQuery = "SELECT * FROM genres WHERE id = ?";
      pool.query(genreQuery, genre_id, (err, genreResults) => {
        if (err) {
          console.error("Error fetching genre:", err);
          return;
        }
        const isLoggedIn = isUserLoggedIn(req);
        res.render("category", {
          category: genreResults[0],
          discussions: discussionResults,
          isLoggedIn: isLoggedIn,
          userId: req.session.user ? (req.session.user.username === 'admin' ? 'admin' : req.session.user.id) : null
        });
      });
    });
  });
});

app.get("/discussionDelete", isLoggedIn, (req, res) => {
  const genre_id = req.query.genre_id;
  const discussion_id = req.query.discussion_id;
  const commentQuery = "DELETE FROM comments WHERE discussion_id = ?";
  pool.query(commentQuery, discussion_id, (err, results) => {
    if (err) {
      console.error("Error deleting comments:", err);
      return;
    }
    const discussionQuery = "DELETE FROM discussions WHERE id = ?";
    pool.query(discussionQuery, discussion_id, (err, results) => {
      if (err) {
        console.error("Error deleting discussion:", err);
        return;
      }
      res.redirect(`/category/${genre_id}`);
    });
  });
});

app.get("/changePassword", isLoggedIn, (req, res) => {
  const username = req.session.user ? req.session.user.username : null;
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;
  res.render("changePassword", { username, message: successMessage });
});

app.post("/changePassword", isLoggedIn, (req, res) => {
  const username = req.session.user ? req.session.user.username : null;
  const new_password = req.body.new_password;
  const saltRounds = 10;
  bcrypt.hash(new_password, saltRounds, (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
      return;
    }
    const Query = "UPDATE users SET password = ? WHERE username = ?";
    pool.query(Query, [hash, username], (err, pwdResults) => {
      if (err) {
        console.error("Error updating password:", err);
        return;
      }
      req.session.successMessage = "Password updated successfully!";
      res.redirect("/changePassword");
    });
  });
});

//functions
async function executeSQL(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
} //executeSQL

// Function to check if a user is logged in
function isUserLoggedIn(req) {
  return !!req.session.user;
}

//server listener
app.listen(3000, () => {
  console.log("server started");
});
