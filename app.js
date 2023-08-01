require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");

var auth = 0;

const homeStartingContent =
  "Welcome to our vibrant home page, where captivating stories and insightful articles come to life! Here, you'll find a curated collection of blog posts from our talented community of writers, covering a diverse range of topics and genres. Scroll through the latest updates and immerse yourself in a world of knowledge, creativity, and inspiration. Whether you're seeking travel adventures, thought-provoking discussions, or heartwarming tales, our home page has something special for every curious mind. Enjoy your journey through the realm of captivating stories and enriching content. Happy reading!";
const aboutContent =
  "Welcome to our blog website! We are a passionate team of creators, led by Adheesh Nayak (email: adheesh@zxxx.com), dedicated to providing you with an enriching and immersive blogging experience. Our platform, built with Express, MongoDB, and EJS, serves as a simple yet powerful space for users to create, read, update, and delete blog posts, all while maintaining data integrity and security through Mongoose and MongoDB integration.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const userStartingContent =
  "Risus pretium quam vulputate dignissim suspendisse in est ante in. Cursus mattis molestie a iaculis. Pellentesque diam volutpat commodo sed egestas egestas fringilla. Egestas purus viverra accumsan in nisl nisi";
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/blogPostDB2");

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const postSchema = mongoose.Schema({
  postTitle: String,
  postContent: String,
  date: String,
  username: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId, // here you set the author ID
    required: true,
  },
});

const CommentSchema = mongoose.Schema({
  username: String,
  comment: String,
  postId: {
    type: mongoose.Schema.Types.ObjectId, // here you set the author ID
    required: true,
  },
});

const Post = new mongoose.model("Post", postSchema);
const Comment = new mongoose.model("Comment", CommentSchema);

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    Post.find()
      .then((posts) => {
        res.render("home", {
          homeStartingContent: homeStartingContent,
          posts: posts,
          auth: 1,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    User.find();
    Post.find()
      .then((posts) => {
        res.render("home", {
          homeStartingContent: homeStartingContent,
          posts: posts,
          auth: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/userposts", (req, res) => {
  if (req.isAuthenticated()) {
    userId = req.user.id;
    Post.find({ userId: userId }).then((posts) => {
      res.render("userposts", {
        userStartingContent: userStartingContent,
        posts: posts,
        auth: 1,
        username: req.user.username,
      });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/allposts/:userName", (req, res) => {
  if (req.isAuthenticated()) {
    auth = 1;
  } else {
    auth = 0;
  }
  userName = req.params.userName;
  Post.find({ username: userName }).then((posts) => {
    res.render("allposts", {
      posts: posts,
      auth: auth,
      username: userName,
    });
  });
});

app.get("/about", (req, res) => {
  if (req.isAuthenticated()) {
    auth = 1;
  }
  res.render("about", { aboutContent: aboutContent, auth: auth });
});

app.get("/contact", (req, res) => {
  if (req.isAuthenticated()) {
    auth = 1;
  } else {
    auth = 0;
  }
  res.render("contact", { contactContent: contactContent, auth: auth });
});

app.get("/compose", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("compose", { auth: 1 });
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", (req, res) => {
  if (req.isAuthenticated()) {
    userId = req.user.id;
    let blog = new Post({
      postTitle: req.body.blogTitle,
      postContent: req.body.blogText,
      date: String(new Date().toLocaleDateString("en-UK")),
      username: req.user.username,
      userId: userId,
    });
    blog
      .save()
      .then(() => {
        res.redirect("/userposts");
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/comment/:postId", (req, res) => {
  postId = req.params.postId;
  if (req.isAuthenticated()) {
    let comment = new Comment({
      username: req.user.username,
      comment: req.body.commentText,
      postId: postId,
    });
    comment
      .save()
      .then(() => {
        res.redirect("/posts/" + postId);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/posts/:postId", (req, res) => {
  if (req.isAuthenticated()) {
    auth = 1;
  } else {
    auth = 0;
  }
  let postId = req.params.postId;
  Post.findOne({ _id: postId })
    .then((post) => {
      Comment.find({ postId: postId })
        .then((comments) => {
          res.render("post", {
            postTitle: post.postTitle,
            postContent: post.postContent,
            postId: postId,
            user: post.username,
            date: post.date,
            auth: auth,
            comments: comments,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

//login and logout
app.get("/login", (req, res) => {
  res.render("login", { auth: 0 });
});

app.post("/login", (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    console.log(err);
  });
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register", { auth: 0 });
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});

app.get("/delete/:postId", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.postId;
    Post.deleteOne({ _id: postId })
      .then(() => {
        res.redirect("/userposts");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/update/:postId", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.postId;
    // console.log(mongoose.isObjectIdOrHexString(postId))
    Post.findOne({ _id: postId })
      .then((post) => {
        res.render("update", {
          postTitle: post.postTitle,
          postContent: post.postContent,
          postId: postId,
          auth: 1,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/update/:postId", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.postId;
    const blogTitle = req.body.blogTitle;
    const blogText = req.body.blogText;
    // console.log(mongoose.isObjectIdOrHexString(postId))
    Post.updateOne(
      {
        _id: postId,
      },
      {
        postTitle: blogTitle,
        postContent: blogText,
      }
    )
      .then(() => {
        res.redirect("/userposts");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/login");
  }
});

app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
