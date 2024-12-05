const express = require("express");
const mongoose = require("mongoose");
const app = express();
const database = require("./config/database");
const bodyParser = require("body-parser");
const Airbnb = require("./models/airbnb");
const db = require("./db-operators/db-operations");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
const handlebars = require("express-handlebars");
app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      inc: (value) => parseInt(value) + 1,
      dec: (value) => parseInt(value) - 1,
    },
  })
);
app.set("view engine", "hbs");

app.get("/", async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const total = await Airbnb.countDocuments();
    const listings = await db.getAllAirBnBs(page, limit);
    const totalPages = Math.ceil(total / limit);

    res.render("root", {
      listings,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/api/airbnb/:listing_id", async function (req, res) {
  const id = req.params.listing_id;
  try {
    const listing = await db.getAirBnBById(id);
    if (!listing) {
      return res.status(404).send("Airbnb not found");
    }
    res.render("view", {
      listing: listing,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

//add new airbnb
app.get("/addnewairbnb/:step?", function (req, res) {
  const step = parseInt(req.params.step) || 1;
  const formData = req.query;
  res.render(`addnewairbnb-step${step}`, {
    step: step,
    formData: formData,
  });
});

app.post("/addnewairbnb", async function (req, res) {
  try {
    const newAirbnb = new Airbnb({
      _id: req.body._id || new mongoose.Types.ObjectId().toString(),
      name: req.body.name,
      summary: req.body.summary,
      price: req.body.price,
      bedrooms: req.body.bedrooms,
      beds: req.body.beds,
      bathrooms: req.body.bathrooms,
      amenities: req.body.amenities ? req.body.amenities.split(",") : [],
    });

    await newAirbnb.save();
    console.log("New Airbnb saved successfully:", newAirbnb);
    res.redirect("/");
  } catch (err) {
    console.error("Error saving Airbnb:", err);
    res.status(500).send(err);
  }
});

//update airbnb
app.get("/update/airbnb/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const listing = await db.getAirBnBById(id);
    if (!listing) {
      return res.status(404).send("Airbnb not found");
    }
    res.render("update", { listing });
  } catch (err) {
    console.error("Error fetching Airbnb for update:", err);
    res.status(500).send(err);
  }
});

app.post("/update/airbnb/:id", async function (req, res) {
  try {
    const id = req.params.id;

    const updatedData = {
      name: req.body.name,
      summary: req.body.summary,
      price: req.body.price,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      amenities: req.body.amenities ? req.body.amenities.split(",") : [],
    };

    await db.updateAirBnBById(updatedData, id);

    console.log(`Updated Airbnb with ID: ${id}`);
    res.redirect(`/api/airbnb/${id}`);
  } catch (err) {
    console.error("Error updating Airbnb:", err);
    res.status(500).send(err);
  }
});

//delete airbnb
app.post("/delete/airbnb/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const result = await db.deleteAirBnBById(id);
    console.log(`Deleted Airbnb with ID: ${id}`);
    res.redirect("/");
  } catch (err) {
    console.error(`Error deleting Airbnb with ID: ${id}`, err);
    res.status(500).send("Error deleting Airbnb");
  }
});

//search airbnb
app.get("/search", async function (req, res) {
  const searchName = req.query.name;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const total = await Airbnb.countDocuments({
      name: { $regex: searchName, $options: "i" },
    });
    const results = await Airbnb.find({
      name: { $regex: searchName, $options: "i" },
    })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    if (results.length === 0) {
      return res.render("error", {
        error: "No listings found with the provided name.",
      });
    }

    res.render("search-results", {
      results,
      searchName,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    console.error("Error searching for Airbnb listings:", err);
    res.status(500).send("Error searching for Airbnb listings.");
  }
});

app.post("/api/AirBnBs", async function (req, res) {
  try {
    if (!req.body._id) {
      res.status(400).json({ error: "Airbnb ID is required" });
      return;
    }
    const existingAirBnB = await db.getAirBnBById(id);
    if (existingAirBnB) {
      res.status(400).json({ error: "Airbnb already exists" });
      return;
    }
    const newAirbnb = await db.addNewAirBnB(req.body);
    res.status(201).json(newAirbnb);
  } catch (err) {
    console.error("Error adding new Airbnb:", err);
    res.status(500).json({ error: "Failed to add new Airbnb" });
  }
});

app.get("/api/AirBnBs", async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const property_type = req.query.property_type;

  try {
    const airbnbs = await db.getAllAirBnBs(page, perPage, property_type);
    res.json(airbnbs);
  } catch (err) {
    console.error("Error fetching AirBnBs:", err);
    res.status(500).json({ error: "Failed to fetch AirBnBs" });
  }
});

app.get("/api/AirBnBs/:id", async function (req, res) {
  const id = req.params.id;
  try {
    const airbnb = await db.getAirBnBById(id);
    if (!airbnb) {
      return res.status(404).json({ error: "Airbnb not found" });
    }
    const response = {
      listing_url: airbnb.listing_url,
      description: airbnb.description,
      neighborhood_overview: airbnb.neighborhood_overview,
      cancellation_policy: airbnb.cancellation_policy,
      property_type: airbnb.property_type,
      room_type: airbnb.room_type,
      accommodates: airbnb.accommodates,
      price: airbnb.price,
      images: airbnb.images,
      review_score_value: airbnb.review_scores.review_scores_value,
    };
    res.json(response);
  } catch (err) {
    console.error("Error fetching Airbnb by ID:", err);
    res.status(500).json({ error: "Failed to fetch Airbnb" });
  }
});

app.put("/api/AirBnBs/:id", async function (req, res) {
  const id = req.params.id;
  try {
    const updatedAirbnb = await db.updateAirBnBById(req.body, id);
    res.status(200).json(updatedAirbnb);
  } catch (err) {
    console.error("Error updating Airbnb:", err);
    res.status(500).json({ error: "Failed to update Airbnb" });
  }
});

app.delete("/api/AirBnBs/:id", async function (req, res) {
  const id = req.params.id;
  try {
    await db.deleteAirBnBById(id);
    res.status(200).send("Deleted Airbnb successfully");
  } catch (err) {
    console.error("Error deleting Airbnb:", err);
    res.status(500).json({ error: "Failed to delete Airbnb" });
  }
});

app.get("/api/AirBnBs/review/:id", async function (req, res) {
  const id = req.params.id;
  try {
    const airbnb = await db.getAirBnBById(id);
    if (!airbnb) {
      return res.status(404).json({ error: "Airbnb not found" });
    }
    const response = {
      number_of_reviews: airbnb.number_of_reviews,
      first_review: airbnb.first_review,
      last_review: airbnb.last_review,
      reviews: airbnb.reviews.map((review) => ({
        review_date: review.date,
        comment: review.comments,
      })),
    };
    res.json(response);
  } catch (err) {
    console.error("Error fetching Airbnb reviews by ID:", err);
    res.status(500).json({ error: "Failed to fetch Airbnb reviews" });
  }
});

db.initialize(database.url)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(
      "Failed to start server due to database connection error:",
      err
    );
  });
