const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const HeaderAPIKeyStrategy =
  require("passport-headerapikey").HeaderAPIKeyStrategy;
const User = require("../models/user"); // Adjust the path to your User model

// JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    User.findById(jwtPayload.id)
      .then((user) => {
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      })
      .catch((err) => done(err, false));
  })
);

// API key strategy
passport.use(
  new HeaderAPIKeyStrategy(
    { header: "x-api-key", prefix: "" },
    false,
    (apiKey, done) => {
      User.findOne({ apiKey: apiKey })
        .then((user) => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch((err) => done(err, false));
    }
  )
);

module.exports = passport;
