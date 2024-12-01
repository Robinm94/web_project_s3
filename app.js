var express = require('express');
var mongoose = require('mongoose');
var app = express();
var database = require('./config/database');
var bodyParser = require('body-parser');
var Airbnb = require('./models/airbnb');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const path = require('path');
app.set('views', path.join(__dirname, 'views'));
const handlebars = require('express-handlebars');
app.engine(
    'hbs',
    handlebars.engine({
        extname: '.hbs',
        defaultLayout: 'main',
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
app.set('view engine', 'hbs');

mongoose.connect(database.url).then(
    () => {
        console.log('connected to mongodb database');
    },
    (err) => {
        console.error('fail to connect to database', err);
    }
);

app.get('/', async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const total = await Airbnb.countDocuments();
        const listings = await Airbnb.find().skip(skip).limit(limit);
        const totalPages = Math.ceil(total / limit);

        res.render('root', {
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

app.get('/api/airbnb/:listing_id', async function (req, res) {
    const id = req.params.listing_id;
    try {
        const listing = await Airbnb.findOne({ _id: id });
        if (!listing) {
            return res.status(404).send('Airbnb not found');
        }
        res.render('view', {
            listing: listing,
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

//add new airbnb
app.get('/addnewairbnb/:step?', function (req, res) {
    const step = parseInt(req.params.step) || 1;
    const formData = req.query;
    res.render(`addnewairbnb-step${step}`, {
        step: step,
        formData: formData,
    });
});

app.post('/addnewairbnb', async function (req, res) {
    try {
        const newAirbnb = new Airbnb({
            _id: req.body._id || new mongoose.Types.ObjectId().toString(),
            name: req.body.name,
            summary: req.body.summary,
            price: req.body.price,
            bedrooms: req.body.bedrooms,
            beds: req.body.beds,
            bathrooms: req.body.bathrooms,
            amenities: req.body.amenities ? req.body.amenities.split(',') : [],
        });

        await newAirbnb.save();
        console.log('New Airbnb saved successfully:', newAirbnb);
        res.redirect('/');
    } catch (err) {
        console.error('Error saving Airbnb:', err);
        res.status(500).send(err);
    }
});

//update airbnb
app.get('/update/airbnb/:id', async function (req, res) {
    try {
        const id = req.params.id;
        const listing = await Airbnb.findOne({ _id: id });
        if (!listing) {
            return res.status(404).send('Airbnb not found');
        }
        res.render('update', { listing });
    } catch (err) {
        console.error('Error fetching Airbnb for update:', err);
        res.status(500).send(err);
    }
});

app.post('/update/airbnb/:id', async function (req, res) {
    try {
        const id = req.params.id;

        const updatedData = {
            name: req.body.name,
            summary: req.body.summary,
            price: req.body.price,
            bedrooms: req.body.bedrooms,
            bathrooms: req.body.bathrooms,
            amenities: req.body.amenities ? req.body.amenities.split(',') : [],
        };

        await Airbnb.updateOne({ _id: id }, { $set: updatedData });

        console.log(`Updated Airbnb with ID: ${id}`);
        res.redirect(`/api/airbnb/${id}`);
    } catch (err) {
        console.error('Error updating Airbnb:', err);
        res.status(500).send(err);
    }
});



//delete airbnb
app.post('/delete/airbnb/:id', async function (req, res) {
    try {
        const id = req.params.id;
        const result = await Airbnb.deleteOne({ _id: id });
        console.log(`Deleted Airbnb with ID: ${id}`);
        res.redirect('/');
    } catch (err) {
        console.error(`Error deleting Airbnb with ID: ${id}`, err);
        res.status(500).send('Error deleting Airbnb');
    }
});

//search airbnb
app.get('/search', async function (req, res) {
    const searchName = req.query.name;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const total = await Airbnb.countDocuments({ name: { $regex: searchName, $options: 'i' } });
        const results = await Airbnb.find({ name: { $regex: searchName, $options: 'i' } })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        if (results.length === 0) {
            return res.status(404).send('No listings found with the provided name.');
        }

        res.render('search-results', {
            results,
            searchName,
            page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        });
    } catch (err) {
        console.error('Error searching for Airbnb listings:', err);
        res.status(500).send('Error searching for Airbnb listings.');
    }
});



const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('App listening on port: ' + port);
});