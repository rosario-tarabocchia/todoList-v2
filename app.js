//jshint esversion:6

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

const mongoUrl = process.env.MONGOLAB_URI;


mongoose.connect(mongoUrl);


const itemsSchema = new mongoose.Schema({

  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const todoOne = new Item({
  name: "Welcome To Your TO DO List.",
});

const todoTwo = new Item({
  name: "Press + to add an item.",
});

const todoThree = new Item({
  name: "Check box to delete and item.",
})

const defaultItems = [todoOne, todoTwo, todoThree];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

  Item.find({}, function(err, results) {

    if (results.length === 0) {

      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        };
      });
      res.redirect("/")
    } else {

      res.render("list", {
        listTitle: "Today",
        newListItems: results
      });
    }
  });
});

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);


  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        console.log("IN FOUND LIST");
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save().then(function(savedData){

          console.log("Doesnt Exist");

          res.redirect("/" + customListName);

        });



      } else {

        console.log("List already used.");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });


      }
    }

  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newListItem = new Item({
    name: itemName

  });

  if (listName === "Today") {
    newListItem.save().then(function(savedData) {
      res.redirect("/");
    });


  } else {

    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(newListItem);
      foundList.save().then(function(savedData) {
        res.redirect("/" + listName);

      });



    });

  }



});

app.post("/delete", function(req, res) {
  console.log(req.body.checkbox);

  const checkedID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({_id: checkedID}, function(err) {
      if (!err) {
        console.log("Success");
        res.redirect("/");
      }
    });

  } else {

    console.log("Getting Here");

    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedID}}}, function(err, foundList){
        if (!err) {

          console.log("Getting Here?");
          res.redirect("/" + listName);

        } else {

          console.log(err);
        }
      });
    }
});

// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
