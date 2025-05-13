# Airbnb Listings Web Application

A full-stack web application for viewing and managing Airbnb listings, built with Node.js, Express, MongoDB, and Handlebars.

## Features

- Browse Airbnb listings with pagination
- Search functionality to find specific listings
- User authentication system with login/logout
- Role-based access control for administrative functions
- Add, view, update, and delete Airbnb listings
- REST API with JWT and API key authentication
- GraphQL API for querying Airbnb data

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Handlebars (hbs) templating engine, CSS
- **Authentication**: JWT, Passport.js, bcrypt
- **APIs**: REST and GraphQL
- **Validation**: express-validator

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd web_project_s3
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   PORT=3000
   ```

4. Start the application:
   ```
   node app.js
   ```

## Project Structure

- `/config` - Configuration files for database and authentication
- `/db-operators` - Database operations
- `/graphql` - GraphQL schema definition
- `/models` - Mongoose data models
- `/public` - Static assets (CSS)
- `/routes` - Express route handlers
- `/views` - Handlebars templates
- `app.js` - Application entry point

## API Endpoints

### REST API

#### Airbnb Listings

- `GET /api/AirBnBs` - Get all Airbnb listings (paginated)
- `GET /api/AirBnBs/:id` - Get specific Airbnb listing
- `GET /api/AirBnBs/search` - Search Airbnb listings
- `POST /api/AirBnBs` - Add new Airbnb listing (requires authentication)
- `PUT /api/AirBnBs/:id` - Update Airbnb listing (requires authentication)
- `DELETE /api/AirBnBs/:id` - Delete Airbnb listing (requires admin role)

#### Reviews

- `GET /api/AirBnBs/review/:id` - Get reviews for a specific listing

#### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user
- `POST /api/users/logout` - Logout a user

### GraphQL API

Available at `/graphql` with the following queries:

- `airbnb(id: String)` - Get a specific Airbnb listing
- `airbnbs(limit: Int)` - Get multiple Airbnb listings

## Authentication

The application supports two authentication methods:

1. JWT tokens for web interface and API
2. API keys for programmatic access to the API

Admin users have additional permissions such as deleting listings.

## Web Interface

- `/` - Home page with listings (paginated)
- `/airbnb/login` - Login page
- `/airbnb/:listing_id` - View a specific listing
- `/search` - Search results page
- `/addnewairbnb` - Multi-step form to add a new listing
- `/update/airbnb/:id` - Update a listing

## Deployment

The project includes a Vercel configuration for easy deployment to Vercel's hosting platform.

## Live Demo

Visit the live application at: [Airbnb Listings App](https://web-project-s3-murex.vercel.app/)

## API Test and Documentation

Vist the API documentation at: [Postman Documenter](https://documenter.getpostman.com/view/14091899/2sAYBbd8zK)
