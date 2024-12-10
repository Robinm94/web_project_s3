const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
} = require("graphql");
const Airbnb = require("../models/airbnb");

const ImageType = new GraphQLObjectType({
  name: "Image",
  fields: () => ({
    thumbnail_url: { type: GraphQLString },
    medium_url: { type: GraphQLString },
    picture_url: { type: GraphQLString },
    xl_picture_url: { type: GraphQLString },
  }),
});

const HostType = new GraphQLObjectType({
  name: "Host",
  fields: () => ({
    host_id: { type: GraphQLString },
    host_name: { type: GraphQLString },
    host_since: { type: GraphQLString },
    host_location: { type: GraphQLString },
    host_about: { type: GraphQLString },
    host_response_time: { type: GraphQLString },
    host_response_rate: { type: GraphQLString },
    host_is_superhost: { type: GraphQLString },
    host_thumbnail_url: { type: GraphQLString },
    host_picture_url: { type: GraphQLString },
    host_neighbourhood: { type: GraphQLString },
    host_listings_count: { type: GraphQLFloat },
    host_total_listings_count: { type: GraphQLFloat },
    host_verifications: { type: new GraphQLList(GraphQLString) },
    host_has_profile_pic: { type: GraphQLString },
    host_identity_verified: { type: GraphQLString },
  }),
});

const AddressType = new GraphQLObjectType({
  name: "Address",
  fields: () => ({
    street: { type: GraphQLString },
    suburb: { type: GraphQLString },
    government_area: { type: GraphQLString },
    market: { type: GraphQLString },
    country: { type: GraphQLString },
    country_code: { type: GraphQLString },
    location: {
      type: new GraphQLObjectType({
        name: "Location",
        fields: () => ({
          type: { type: GraphQLString },
          coordinates: { type: new GraphQLList(GraphQLFloat) },
        }),
      }),
    },
  }),
});

const AvailabilityType = new GraphQLObjectType({
  name: "Availability",
  fields: () => ({
    availability_30: { type: GraphQLFloat },
    availability_60: { type: GraphQLFloat },
    availability_90: { type: GraphQLFloat },
    availability_365: { type: GraphQLFloat },
  }),
});

const ReviewScoresType = new GraphQLObjectType({
  name: "ReviewScores",
  fields: () => ({
    review_scores_accuracy: { type: GraphQLFloat },
    review_scores_cleanliness: { type: GraphQLFloat },
    review_scores_checkin: { type: GraphQLFloat },
    review_scores_communication: { type: GraphQLFloat },
    review_scores_location: { type: GraphQLFloat },
    review_scores_value: { type: GraphQLFloat },
    review_scores_rating: { type: GraphQLFloat },
  }),
});

const ReviewType = new GraphQLObjectType({
  name: "Review",
  fields: () => ({
    _id: { type: GraphQLString },
    date: { type: GraphQLString },
    reviewer_id: { type: GraphQLString },
    reviewer_name: { type: GraphQLString },
    comments: { type: GraphQLString },
  }),
});

const AirbnbType = new GraphQLObjectType({
  name: "Airbnb",
  fields: () => ({
    _id: { type: GraphQLString },
    listing_url: { type: GraphQLString },
    name: { type: GraphQLString },
    summary: { type: GraphQLString },
    space: { type: GraphQLString },
    description: { type: GraphQLString },
    neighborhood_overview: { type: GraphQLString },
    notes: { type: GraphQLString },
    transit: { type: GraphQLString },
    access: { type: GraphQLString },
    interaction: { type: GraphQLString },
    house_rules: { type: GraphQLString },
    property_type: { type: GraphQLString },
    room_type: { type: GraphQLString },
    bed_type: { type: GraphQLString },
    minimum_nights: { type: GraphQLString },
    maximum_nights: { type: GraphQLString },
    cancellation_policy: { type: GraphQLString },
    last_scraped: { type: GraphQLString },
    calendar_last_scraped: { type: GraphQLString },
    first_review: { type: GraphQLString },
    last_review: { type: GraphQLString },
    accommodates: { type: GraphQLFloat },
    bedrooms: { type: GraphQLFloat },
    beds: { type: GraphQLFloat },
    number_of_reviews: { type: GraphQLFloat },
    bathrooms: { type: GraphQLFloat },
    amenities: { type: new GraphQLList(GraphQLString) },
    price: { type: GraphQLFloat },
    security_deposit: { type: GraphQLFloat },
    cleaning_fee: { type: GraphQLFloat },
    extra_people: { type: GraphQLFloat },
    guests_included: { type: GraphQLFloat },
    images: { type: ImageType },
    host: { type: HostType },
    address: { type: AddressType },
    availability: { type: AvailabilityType },
    review_scores: { type: ReviewScoresType },
    reviews: { type: new GraphQLList(ReviewType) },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    airbnb: {
      type: AirbnbType,
      args: { id: { type: GraphQLString } },
      resolve(parent, args) {
        return Airbnb.findById(args.id);
      },
    },
    airbnbs: {
      type: new GraphQLList(AirbnbType),
      args: { limit: { type: GraphQLInt } },
      resolve(parent, args) {
        return Airbnb.find({}).limit(args.limit || 10);
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});
