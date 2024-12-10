const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: ["user"] },
  apiKey: { type: String, required: true, unique: true },
});

// Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10); // Generate salt
      this.password = await bcrypt.hash(this.password, salt); // Hash the password
    }
    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

module.exports = mongoose.model("User", UserSchema);
