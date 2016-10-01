/**
 Copyright 2016 Irena Shaigorodsky or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 * - Web service: communicate with an external web service to get calendar data from the [Google API](https://developers.google.com/google-apps/calendar/)
 * - Multiple optional slots: has 3 slots (reminder type, first name, and date), where the user can provide 0, 1, 2, or 3 values, and assumes defaults for the unprovided values
 * - DATE slot: demonstrates date handling and formatted date responses appropriate for speech
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 *   If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
 *   examples section for sample interactions of these models.
 *
 * Examples:
 * One-shot model:
 *  User:  "Alexa, ask Google Birthday Reminder for the birthday of John"
 *  Alexa: "Saturday June 20th is the birthday of John Snow ..."
 * Dialog model:
 *  User:  "Alexa, open Google Birthday Reminder"
 *  Alexa: "Welcome to Google Birthday Reminder. What contact or date would you like reminders for?"
 *  User:  "John"
 *  Alexa: "Saturday June 20th is the birthday of John Snow ..."
 */

/**
 * App ID for the skill
 */
var APP_ID = '%%APP_ID%%'; // package script will fill in
var API_KEY = '%%API_KEY%%'; // package script will fill in
var alexaDateUtil = require('./alexaDateUtil');


/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * GoogleBirthdayReminder is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var GoogleBirthdayReminder = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
GoogleBirthdayReminder.prototype = Object.create(AlexaSkill.prototype);
GoogleBirthdayReminder.prototype.constructor = GoogleBirthdayReminder;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

GoogleBirthdayReminder.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

GoogleBirthdayReminder.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleHelpRequest(session, response, "Welcome to Google Birthday Reminder. ");
};

GoogleBirthdayReminder.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
GoogleBirthdayReminder.prototype.intentHandlers = {
    "OneshotReminderIntent": function (intent, session, response) {
        handleOneshotReminderRequest(intent, session, response);
    },

    "DialogReminderIntent": function (intent, session, response) {
        // Determine if this turn is for name, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var firstNameSlot = intent.slots.FirstName;
        var dateSlot = intent.slots.Date;
        var typeSlot = intent.slots.Reminder;
        console.log("DialogReminderIntent firstNameSlot: " + firstNameSlot
            + ", dateSlot:" + dateSlot + ", " + "typeSlot: " + typeSlot);
        handleDialogRequest(intent,session,response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        console.log("Help");
        handleHelpRequest(session, response, "");
    },

    "AMAZON.StartOverIntent": function (intent, session, response) {
        console.log("Help");
        handleHelpRequest(session, response, "");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        console.log("Goodbye");
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        console.log("Goodbye");
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.NextIntent": function (intent, session, response) {
        console.log("Next");
        if (session.attributes.currentReminder !== null && session.attributes.currentReminder !== undefined)
        {
            session.attributes.currentReminder = session.attributes.currentReminder + 1;
        }
        handleReminderRequest(session,response);
    },

    "AMAZON.PreviousIntent": function (intent, session, response) {
        console.log("Previous");
        if (session.attributes.currentReminder !== null && session.attributes.currentReminder !== undefined)
        {
            session.attributes.currentReminder = session.attributes.currentReminder - 1;
        }
        handleReminderRequest(session,response);
    }
};

// -------------------------- GoogleBirthdayReminder Domain Specific Business Logic --------------------------

function handleHelpRequest(session, response, welcomePropmt) {
    console.log("handleHelpRequest");

    if (getAccessToken(session)) {
        var helpPrompt = "What contact or date would you like reminders for?",
            speechOutput = {
                speech: welcomePropmt
                + helpPrompt,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            },
            repromptOutput = {
                speech: "I can lead you through providing a name or "
                + "date to find reminders, "
                + "or you can simply open Google Birthday Reminder and ask a question like, "
                + "get birthdays for Saturday. ",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
        response.ask(speechOutput, repromptOutput);
    } else {
        var helpPrompt = "What Google account would you like reminders for?",
            speechOutput = {
                speech: welcomePropmt
                + helpPrompt,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            },
            repromptOutput = {
                speech: "To get started with the reminders I can lead you through linking "
                + "your Google account with the Amazon one, "
                + "just open Alexa companion app on your device and click the link on my home card. ",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
        response.askWithCard(speechOutput, repromptOutput, undefined, undefined, undefined, undefined, "LinkAccount");
    }

};

function getAccessToken(session) {
    return (session && session.user && session.user.accessToken) ? session.user.accessToken : undefined;
}

function handleDialogRequest(intent, session, response) {
    console.log("handleDialogRequest");
    var nameState = getNameStateFromIntentOrSession(intent, session),
        date = getDateFromIntentOrSession(intent, session),
        reminderType = getTypeFromIntentOrSession(intent, session),
        repromptText,
        speechOutput;
    console.log("nameState:" + nameState.firstName );
    if (nameState.error && !date.displayDate) {
        repromptText = "Currently, I find reminders for contact name or date: "
            + "What name should I look up?";
        // if we received no value for name and date, repeat it to the user, otherwise we received an empty slot
        speechOutput =  "I'm sorry, I need date or name to look up " + reminderType + ". ";
        response.ask(speechOutput, repromptText);
        return;
    }
    // if we don't have a date yet, go to date. If we have a date, we perform the final request
    if (date.displayDate || nameState.name) {
        getFinalResponse(nameState.name, date.rowDate, reminderType, response, session);
    } else {
        // set name and type in session and prompt for date
        speechOutput = "For which date ?";
        repromptText = "For what date would you like " + reminderType  + "?";

        response.ask(speechOutput, repromptText);
    }
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Google Birthday Reminder and get birthdays for Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotReminderRequest(intent, session, response) {
    console.log("handleOneshotRequest");

    // Determine name, date, and type using default if none provided
    var nameState = getNameStateFromIntentOrSession(intent, session),
        date = getDateFromIntentOrSession(intent, session),
        reminderType = getTypeFromIntentOrSession(intent, session),
        repromptText,
        speechOutput;
    if (nameState.error && !date.displayDate) {
        repromptText = "Currently, I find reminders for contact name or date: "
            + "What name should I look up?";
        // if we received no value for name and date, repeat it to the user, otherwise we received an empty slot
        speechOutput =  "I'm sorry, I need date or name to look up " + reminderType + ". ";
        response.ask(speechOutput, repromptText);
        return;
    }

    // Determine  date
    if (!date.displayDate) {
        // Invalid date. set name in session and prompt for date
        repromptText = "Please try again saying for which day, for example, Saturday. "
            + "For which date would you like " + reminderType +"?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // all slots filled, either from the user or by default values. Move to final request
    getFinalResponse(nameState.name, date.rowDate, reminderType, response, session);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalResponse(name, date, reminderType, response, session) {
    console.log("getFinalResponse: name=" + name + ", date="+date+", type="+reminderType);

    try
    {
        // Issue the request, and respond to the user
        makeReminderRequest(getAccessToken(session), name, date, reminderType, function apiResponseCallback(err, apiResponse) {
            var speechOutput;

            if (err) {
                console.log("makeReminderRequest err" + err);
                speechOutput = "Sorry, the GoogleAPI service is experiencing a problem. Please try again later";
                response.tell(speechOutput)
                return;
            } else {
                // TODO
                console.log("makeReminderRequest apiResponse" + apiResponse);
                session.attributes.reminders = apiResponse.items;
                session.attributes.currentReminder = 0;

                handleReminderRequest(session,response, true);
            }

        });
    }
    catch(err)
    {
        console.log("makeReminderRequest err" + err);
        speechOutput = "Sorry, the GoogleAPI service is experiencing a problem. Please try again later";
        response.tell(speechOutput)
        return;
    }
}

function handleReminderRequest(session, response, firstTime)
{

    var speechOutput = "";
    var repromptSpeech = "";
    // TODO fix
    if (firstTime)
    {
        if (session.attributes.Date.displayDate)
        {
            speechOutput = "On " + session.attributes.Date.displayDate + " "
        }
        if (session.attributes.reminderType)
        {
            speechOutput = speechOutput
                + session.attributes.reminderType + " "
        }
        if (session.attributes.name)
        {
            speechOutput = speechOutput
            + "for " + session.attributes.name + ",  ";
        }
    }

    console.log("reminders.length: " + (session.attributes.reminders ? session.attributes.reminders.length : -1));
    console.log("currentReminder: " + session.attributes.currentReminder);
    if (!session.attributes.reminders || session.attributes.reminders.length == 0 ||
        session.attributes.currentReminder == null || session.attributes.currentReminder === undefined
        || session.attributes.currentReminder < 0
        || session.attributes.reminders.length <= session.attributes.currentReminder
        || !session.attributes.reminders[session.attributes.currentReminder])
    {
        console.log("Not found");
        if (firstTime)
        {
            session.attributes.currentReminder = 0;
            speechOutput = speechOutput + " reminders not found";
            repromptSpeech = "Stop?";
        }
        else if (session.attributes.reminders && session.attributes.reminders.length && session.attributes.currentReminder !== undefined
            && session.attributes.currentReminder >= 0 && session.attributes.reminders.length > session.attributes.currentReminder)
        {
            var reminder = session.attributes.reminders[session.attributes.currentReminder];
            var reminders = session.attributes.reminders;
            speechOutput = "Sorry, no more " +  session.attributes.reminderType;
            repromptSpeech = ((reminders.length + 1 > session.attributes.currentReminder) ? "Next, " : "" )
                + (session.attributes.currentReminder > 0? "Previous," :"")  ;
        }
        response.ask(speechOutput, repromptSpeech)
    }
    else if (session.attributes.reminders && session.attributes.reminders.length && session.attributes.currentReminder !== undefined
        && session.attributes.currentReminder >= 0 && session.attributes.reminders.length > session.attributes.currentReminder)
    {
        console.log("found");
        var reminder = session.attributes.reminders[session.attributes.currentReminder];
        var reminders = session.attributes.reminders;
        var photo = reminder.gadget.preferences["goo.contactsPhotoUrl"];
/*        var photo = 'https://www.google.com/m8/feeds/photos/media/default/contactId/' +
            reminder.gadget.preferences["goo.contactsContactId"];
*/
        speechOutput = speechOutput + reminder.summary;

        repromptSpeech = ((reminders.length + 1 > session.attributes.currentReminder) ? "Next, " : "" )
            + (session.attributes.currentReminder > 0? "Previous," :"") ;

        var cardTitle = reminder.summary;

        var cardContent = cardTitle;

        response.askWithCard(speechOutput, repromptSpeech, cardTitle,cardContent,
            photo, photo)
    }
};

/**
 * Gets the name from the intent, or returns an error
 */
function getNameStateFromIntentOrSession(intent, session, assignDefault) {
    console.log("getNameStateFromIntentOrSession");
    var firstNameSlot = intent.slots.FirstName;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    var firstName = (firstNameSlot && firstNameSlot.value) ? firstNameSlot.value : session.attributes.firstName;
    session.attributes.firstName = firstName;
    console.log("firstName:"+firstName);
    if (!firstName ) {
        return {
            error: true
        }
    } else {
        // lookup the name.
        return {
            firstName: firstName,
            name: firstName
        }
    }
}

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getDateFromIntentOrSession(intent, session) {
    console.log("getDateFromIntent");

    var dateSlot = intent.slots["Date"];
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    var displayDate = null;
    var requestDateParam = null;
    var rowDate = null;

    if (dateSlot && dateSlot.value) {
        var date = new Date(dateSlot.value);

        // format the request date like YYYYMMDD
        var month = (date.getMonth() + 1);
        month = month < 10 ? '0' + month : month;
        var dayOfMonth = date.getDate();
        dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;
        var requestDay = "begin_date=" + date.getFullYear() + month + dayOfMonth
            + "&range=24";

        displayDate = alexaDateUtil.getFormattedDate(date);
        requestDateParam = requestDay;
        rowDate = date;
    }
    else if (session.attributes.Date && session.attributes.Date.displayDate
        && session.attributes.Date.requestDateParam)
    {
        displayDate = session.attributes.Date.displayDate;
        requestDateParam= session.attributes.Date.requestDateParam;
        rowDate=session.attributes.Date.rowDate;
    }
    else
    {
        // default to today
        // displayDate = "Today";
        // requestDateParam= "date=today";
    }
    session.attributes.Date = {
        displayDate: displayDate,
        requestDateParam: requestDateParam,
        rowDate: rowDate
    };
    console.log("alexa date" + session.attributes.Date.displayDate);
    return session.attributes.Date;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var reminderService = new GoogleBirthdayReminder();
    reminderService.execute(event, context);
};

/**
 * Gets the type from the intent, or default value
 */
function getTypeFromIntentOrSession(intent, session) {
    console.log("getTypeStateFromIntentOrSession");
    var reminderSlot = intent.slots.Reminder;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    var reminderType = (reminderSlot && reminderSlot.value) ? reminderSlot.value : session.attributes.reminderType;
    session.attributes.reminderType = reminderType;
    console.log("reminderType:"+reminderType);
    if (!reminderType ) {
            // For sample skill, default to reminders.
            return "reminders";

    } else {
        // lookup the reminder type.
        return reminderType;
    }
};

//-------------------------- GoogleAPI Calls --------------------------
//var request = require('request');
var http = require('https');

function makeReminderRequest(token, name, date, reminderType, apiResponseCallback) {
    var toDate =  new Date();
    toDate.setTime(date.getTime() + 1*24*60*60*1000);

    console.log("date:"+date);
// Set the headers
    var headers = {
        'Authorization': 'Bearer ' + token
    }

// Configure the request
    var options = {
        host: "www.googleapis.com",
        port:"443",
        path:'/calendar/v3/calendars/%23contacts%40group.v.calendar.google.com/events?'+
            'timeMax=' + toDate.toISOString() + '&timeMin=' + date.toISOString() +'&key=' + API_KEY,
        method: 'GET',
        headers: headers
    }

    console.log("https://"+options.host+":"+options.port+options.path);
    console.log('Authorization:' + headers['Authorization']);

// Start the request
    var req = http.request(options, function (res) {
        var googleResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            apiResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            console.log('data: ' + data);
            googleResponseString += data;
        });

        res.on('end', function () {
            var googleResponseObject = JSON.parse(googleResponseString);

            if (googleResponseObject.error) {
                console.log("Google error: " + googleResponseObject.error.message);
                apiResponseCallback(new Error(googleResponseObject.error.message));
            } else {
                apiResponseCallback(null, googleResponseObject);
            }
        });
    });
    req.on('error', function (e) {
        console.log("Communications error: " + e.message);
        apiResponseCallback(new Error(e.message));
    });
    req.end();
};