'use strict';

// Imports dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()); // creates express http server
const request = require('request');

const APP_ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const LISTEN_PORT = process.env.PORT || 1337;

// Sets server port and logs message on success
app.listen(LISTEN_PORT, () => console.log('webhook is listening ' + LISTEN_PORT));

app.get('/webhook', (req, res) => {
    res.status(200).send('This is app2');
});