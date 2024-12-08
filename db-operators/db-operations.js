const mongoose = require("mongoose");
const Airbnb = require("../models/airbnb");

module.exports = {
  async initialize(connectionString) {
    try {
      await mongoose.connect(connectionString);
      console.log("Database connection successful");
    } catch (err) {
      console.error("Database connection error:", err);
      throw err;
    }
  },

  async addNewAirBnB(data) {
    const newAirBnB = new Airbnb(data);
    try {
      const result = await newAirBnB.save();
      console.log("New AirBnB added:", result);
      return result;
    } catch (err) {
      console.error("Error adding new AirBnB:", err);
      throw err;
    }
  },

  async getAirBnBById(Id) {
    try {
      const result = await Airbnb.findById(Id);
      if (!result) {
        throw new Error("AirBnB not found");
      }
      return result;
    } catch (err) {
      console.error("Error fetching AirBnB by ID:", err);
      throw err;
    }
  },

  async getAirBnBExistsById(Id) {
    try {
      const result = await Airbnb.findById(Id);
      if (!result) {
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error fetching AirBnB by ID:", err);
      throw err;
    }
  },

  async updateAirBnBById(data, Id) {
    try {
      const result = await Airbnb.findByIdAndUpdate(Id, data, {
        new: true,
        overwrite: true,
      });
      if (!result) {
        throw new Error("AirBnB not found");
      }
      console.log("AirBnB updated:", result);
      return result;
    } catch (err) {
      console.error("Error updating AirBnB by ID:", err);
      throw err;
    }
  },

  async deleteAirBnBById(Id) {
    try {
      const result = await Airbnb.findByIdAndDelete(Id);
      if (!result) {
        throw new Error("AirBnB not found");
      }
      console.log("AirBnB deleted:", result);
      return result;
    } catch (err) {
      console.error("Error deleting AirBnB by ID:", err);
      throw err;
    }
  },

  async getAllAirBnBs(page, perPage, query) {
    try {
      const results = await Airbnb.find(query)
        .sort({ _id: 1 })
        .skip((page - 1) * perPage)
        .limit(perPage);
      return results;
    } catch (err) {
      console.error("Error fetching AirBnBs:", err);
      throw err;
    }
  },

  async getPageCount(perPage, query) {
    try {
      const total = await Airbnb.countDocuments(query);
      return Math.ceil(total / perPage);
    } catch (err) {
      console.error("Error fetching page count:", err);
      throw err;
    }
  },
};
