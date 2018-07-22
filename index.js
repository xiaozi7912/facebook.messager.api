'use strict';

// Imports dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()); // creates express http server
const request = require('request');

const APP_ACCESS_TOKEN = process.env.APP_ACCESS_TOKEN;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = FACEBOOK_PAGE_ACCESS_TOKEN;

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
    let body = req.body;
    console.log(body);

    // Checks this is an event from a page subscription
    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            console.log("entry.id : " + entry.id);
            if (entry.changes != undefined) {
                handleChanges(entry.changes)
            } else if (entry.messaging != undefined) {
                handleMessaging(entry.messaging);
            }
        });

        // // Iterates over each entry - there may be multiple if batched
        // body.entry.forEach(function(entry) {
        //     console.log("entry.id : " + entry.id);
        //     if (entry.changes != undefined) {
        //         entry.changes.forEach(function(change) {
        //             console.log(change);
        //         });
        //     }

        //     // Gets the message. entry.messaging is an array, but
        //     // will only ever contain one message, so we get index 0
        //     let webhook_event = entry.messaging[0];
        //     console.log(webhook_event);

        //     // Get the sender PSID
        //     let sender_psid = webhook_event.sender.id;
        //     console.log('Sender PSID: ' + sender_psid);

        //     // Check if the event is a message or postback and
        //     // pass the event to the appropriate handler function
        //     if (webhook_event.message) {
        //         handleMessage(sender_psid, webhook_event.message);
        //     } else if (webhook_event.postback) {
        //         handlePostback(sender_psid, webhook_event.postback);
        //     }
        // });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

function handleChanges(changes) {
    console.log('handleChanges');
    console.log(changes);

    let event = changes[0];

    if (event.field === 'feed') {
        if (event.value.verb === 'add') {
            if (event.value.item === 'post') {
                let object_id = event.value.post_id;
                let message = event.value.message;
                let response = {
                    "message": `Your comment is ${message}`
                };

                sendPrivateReplies(object_id, response);
            } else if (event.value.item === 'comment') {
                let comment_id = event.value.comment_id;
                let object_id = comment_id;
                let message = event.value.message;
                let response = {
                    "message": `Your comment is ${message}`
                };

                sendPrivateReplies(object_id, response);
            } else if (item === 'reaction') {
                let object_id = event.value.post_id;
                let message = event.value.reaction_type;
                let response = {
                    "message": `Your comment is ${message}`
                };
            }
        }
    }
}

function handleMessaging(messaging) {
    console.log('handleMessaging');
    console.log(messaging);

    let event = messaging[0];
    let sender_psid = event.sender.id;
    console.log('Sender PSID: ' + sender_psid);

    if (event.message) {
        handleMessage(sender_psid, event.message);
    } else if (event.postback) {
        handlePostback(sender_psid, event.postback);
    }
}

function sendPrivateReplies(object_id, response) {
    console.log('sendPrivateReplies');
    console.log('object_id : ' + object_id);
    console.log(response);
    let url = `https://graph.facebook.com//v3.0/${object_id}/private_replies`;

    request({
        "uri": url,
        "qs": {
            "access_token": FACEBOOK_PAGE_ACCESS_TOKEN
        },
        "method": "POST",
        "form": response
    }, (err, res, body) => {
        if (!err) {
            console.log(body);
            console.log('message sent!');
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
    console.log('handleMessage');
    console.log('handleMessage received_message : ' + received_message);
    console.log('handleMessage received_message.text : ' + received_message.text);
    let response;

    // Check if the message contains text
    if (received_message.text == 'hello') {

        // Create the payload for a basic text message
        response = {
            "text": 'hi'
        }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    console.log('handlePostback');
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    console.log('callSendAPI');
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {
            "access_token": FACEBOOK_PAGE_ACCESS_TOKEN
        },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log(body);
            console.log('message sent!');
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}