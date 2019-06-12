// dependencies
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("./models");
const PORT = 3000;
const app = express();

// data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static dir
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", {
  useNewUrlParser: true
});

// routes
// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios
    .get("https://www.thrillist.com/eat/atlanta/best-restaurants-atlanta")
    .then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);

      // Now, we grab every h2 within an article tag, and do the following:
      $("section.save-venue").each(function(i, element) {
        // console.log("this", this);
        // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .find("a")
          .text();
        result.link = $(this)
          .find("a")
          .attr("href");
        result.body = $(this)
          .children("p")
          .text();
        console.log("result - title/link/body", result.title);
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err.message);
          });
      });

      // Send a message to the client
      res.send("Scrape Complete");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  db.Article.findOne({
    _id: req.params.id
  })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        {
          _id: req.params.id
        },
        { $set: { note: dbNote._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
