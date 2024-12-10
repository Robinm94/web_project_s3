require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const userRoutes = require("./routes/userRoutes");
const db = require("./db-operators/db-operations");
const database = require("./config/database");
const Airbnb = require("./models/airbnb");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const { body, query, param, validationResult } = require("express-validator");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/users", userRoutes);

// Custom middleware to authenticate using either JWT or API key
const authenticate = (req, res, next) => {
  passport.authenticate(
    ["jwt", "headerapikey"],
    { session: false },
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user = user;
      next();
    }
  )(req, res, next);
};

const authenticateUI = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.redirect("/airbnb/login");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.redirect("/airbnb/login");
    }
    req.user = decoded;
    next();
  });
};

const authenticateUINonRedirect = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      req.user = decoded;
    });
  }
  next();
};

// Role-based authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.some((role) => req.user.roles.includes(role))) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Only ${roles} are allowed to access this resource`,
      });
    }
    next();
  };
};

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

app.get("/", authenticateUINonRedirect, async function (req, res) {
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
      isAuthenticated: !!req.user,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/airbnb/login", (req, res) => {
  res.render("login");
});

app.post("/airbnb/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(400)
        .render("login", { error: "Invalid username or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res
        .status(400)
        .render("login", { error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.redirect("/");
  } catch (error) {
    res.status(500).render("login", { error: "Internal server error" });
  }
});

app.post("/airbnb/logout", (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.redirect("/");
});

app.get(
  "/airbnb/:listing_id",
  authenticateUINonRedirect,
  async function (req, res) {
    const id = req.params.listing_id;
    try {
      const listing = await db.getAirBnBById(id);
      if (!listing) {
        return res.status(404).send("Airbnb not found");
      }
      res.render("view", {
        listing: listing,
        isAuthenticated: !!req.user,
      });
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

//add new airbnb
app.get("/addnewairbnb/:step?", authenticateUI, function (req, res) {
  const step = parseInt(req.params.step) || 1;
  const formData = req.query;
  res.render(`addnewairbnb-step${step}`, {
    step: step,
    formData: formData,
    isAuthenticated: !!req.user,
  });
});

app.post("/addnewairbnb", authenticateUI, async function (req, res) {
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
    res.redirect("/");
  } catch (err) {
    console.error("Error saving Airbnb:", err);
    res.status(500).send(err);
  }
});

//update airbnb
app.get("/update/airbnb/:id", authenticateUI, async function (req, res) {
  try {
    const id = req.params.id;
    const listing = await db.getAirBnBById(id);
    if (!listing) {
      return res.status(404).send("Airbnb not found");
    }
    res.render("update", { listing, isAuthenticated: !!req.user });
  } catch (err) {
    console.error("Error fetching Airbnb for update:", err);
    res.status(500).send(err);
  }
});

app.post("/update/airbnb/:id", authenticateUI, async function (req, res) {
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

    res.redirect(`/airbnb/${id}`);
  } catch (err) {
    console.error("Error updating Airbnb:", err);
    res.status(500).send(err);
  }
});

//delete airbnb
app.post("/delete/airbnb/:id", authenticateUI, async function (req, res) {
  try {
    const id = req.params.id;
    const result = await db.deleteAirBnBById(id);
    res.redirect("/");
  } catch (err) {
    console.error(`Error deleting Airbnb with ID: ${id}`, err);
    res.status(500).send("Error deleting Airbnb");
  }
});

//search airbnb
app.get("/search", authenticateUINonRedirect, async function (req, res) {
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
      isAuthenticated: !!req.user,
    });
  } catch (err) {
    console.error("Error searching for Airbnb listings:", err);
    res.status(500).send("Error searching for Airbnb listings.");
  }
});

app.post(
  "/api/AirBnBs",
  authenticate,
  body("_id").isNumeric(),
  body("name").isString(),
  body("description").isString(),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
      }
      const existingAirBnB = await db.getAirBnBById(req.body._id);
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
  }
);

app.get(
  "/api/AirBnBs",
  query("page").isNumeric(),
  query("perPage").isNumeric(),
  query("property_type").optional().escape(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const page = parseInt(req.query.page);
    const perPage = parseInt(req.query.perPage);
    const property_type = req.query.property_type;

    try {
      const pageCount = await db.getPageCount(
        perPage,
        property_type ? { property_type: property_type } : {}
      );
      if (pageCount === 0) {
        return res.status(404).json({ error: "No AirBnBs found" });
      }
      if (page < 1) {
        return res.redirect(
          307,
          `/api/AirBnBs?page=1&perPage=${perPage}${
            property_type ? `&property_type=${property_type}` : ""
          }`
        );
      }
      if (page > pageCount) {
        return res.redirect(
          307,
          `/api/AirBnBs?page=${pageCount}&perPage=${perPage}${
            property_type ? `&property_type=${property_type}` : ""
          }`
        );
      }

      const airbnbs = await db.getAllAirBnBs(
        page,
        perPage,
        property_type ? { property_type: property_type } : {}
      );

      return res.json(airbnbs);
    } catch (err) {
      console.error("Error fetching AirBnBs:", err);
      res.status(500).json({ error: "Failed to fetch AirBnBs" });
    }
  }
);

app.get(
  "/api/AirBnBs/search",
  query("page").optional().isNumeric(),
  query("perPage").optional().isNumeric(),
  query("name").optional().escape(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const searchName = req.query.name || "";
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    try {
      const pageCount = await db.getPageCount(perPage, {
        name: { $regex: searchName, $options: "i" },
      });
      if (pageCount === 0) {
        return res.status(404).json({ error: "No AirBnBs found" });
      }
      if (page < 1) {
        return res.redirect(
          307,
          `/api/AirBnBs/search?page=1&perPage=${perPage}&name=${searchName}`
        );
      }
      if (page > pageCount) {
        return res.redirect(
          307,
          `/api/AirBnBs/search?page=${pageCount}&perPage=${perPage}&name=${searchName}`
        );
      }
      const airbnbs = await db.getAllAirBnBs(page, perPage, {
        name: { $regex: searchName, $options: "i" },
      });

      return res.json(airbnbs);
    } catch (err) {
      console.error("Error searching for Airbnb listings:", err);
      res.status(500).send("Error searching for Airbnb listings.");
    }
  }
);

app.get("/api/AirBnBs/:id", param("id").isNumeric(), async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send("Invalid ID");
  }
  const id = req.params.id;
  try {
    const airbnb = await db.getAirBnBById(id);
    if (!airbnb) {
      return res.status(404).json({ error: "Airbnb not found" });
    }
    const response = {
      name: airbnb.name,
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

app.put(
  "/api/AirBnBs/:id",
  authenticate,
  param("id").isNumeric(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid ID");
    }
    const id = req.params.id;
    try {
      const updatedAirbnb = await db.updateAirBnBById(req.body, id);
      res.status(200).json(updatedAirbnb);
    } catch (err) {
      console.error("Error updating Airbnb:", err);
      res.status(500).json({ error: "Failed to update Airbnb" });
    }
  }
);

app.delete(
  "/api/AirBnBs/:id",
  authenticate,
  authorize(["admin"]),
  param("id").isNumeric(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid ID");
    }
    const id = req.params.id;
    try {
      await db.deleteAirBnBById(id);
      res.status(200).send("Deleted Airbnb successfully");
    } catch (err) {
      console.error("Error deleting Airbnb:", err);
      res.status(500).json({ error: "Failed to delete Airbnb" });
    }
  }
);

app.get(
  "/api/AirBnBs/review/:id",
  param("id").isNumeric(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid ID");
    }
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
  }
);

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
