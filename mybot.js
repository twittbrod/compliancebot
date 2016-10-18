var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

var util = require('util');
var request = require('request');

require('should');

var app_url = process.env.APP_URL + "/flint";
console.log("app_url: " + app_url);
//console.log("process.env.TOKEN_SPARK_BOT: " + process.env.TOKEN_SPARK_BOT);
var token_spark = process.env.TOKEN_SPARK_BOT;
console.log("token_spark: " + token_spark);

// flint options
var config = {
    webhookUrl: app_url,
    token: process.env.TOKEN_SPARK_BOT,
    port: 8080,
    removeWebhooksOnStart: false,
    maxConcurrent: 5,
    minTime: 50
};

// init flint
var flint = new Flint(config);
flint.start();

// add flint event listeners
flint.on('message', function(bot, trigger, id) {
    flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
});

flint.on('initialized', function() {
    flint.debug('initialized %s rooms', flint.bots.length);
});

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

// start express server
var server = app.listen(config.port, function () {
    flint.debug('Flint listening on port %s', config.port);
});


// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
    flint.debug('stoppping...');
    server.close();
    flint.stop().then(function() {
        process.exit();
    });
});



flint.hears('/getroomdetails', function(bot, trigger) {
    getRoomDetails(trigger.roomId, token_spark, function(error, roomObj) {
        console.log("roomObj: ");
        console.log(roomObj);
        bot.say(roomObj);
    });
});


// announce bot presence in room
flint.hears('/marco', function(bot, trigger) {
    bot.say('polo');
});
// announce bot presence in room
flint.hears('marco', function(bot, trigger) {
    bot.say('polo');
});


// documenting the bot - general
flint.hears('/help', function(bot, trigger) {
    bot.say('I am the demo bot.  I am a living bot that will grow to satisfy many use cases.  If you have an idea and wonder what I can, ask.  Here are my commands:');
    bot.say('  - /help - you should have this one figured out already');
    bot.say('  - /marco - the bot will reply with polo.  Use this command to ask all (Tim Wittbrod developed) bots in the room to announce themselves.');
    bot.say("  - /getroomdetails - return the Spark room details of a hard coded room ID");
});




flint.hears('/addcompliance', function(bot, trigger) {
    // get regex as string
    var str = trigger.args[1];
    console.log('trigger.args[1]: ' + str);

    // convert string to regex
        // store as string -- convert to regex at evaluation time

    // store regex
    console.log('bot.recall(1): ' + bot.recall('1'));
    for (var i=1; bot.recall(i.toString()); i++) {
        console.log(i);
        bot.say('Index: ' + i + '   ' + bot.recall(i.toString()));
    }
    console.log('out of loop i: ' + i);
    bot.store(i.toString(), str);
});


// list the compliance regular expressions that are in effect
flint.hears('/listcompliance', function(bot, trigger) {
    console.log('bot.recall(1): ' + bot.recall('1'));
    // the first item in the compliance list is 1 (as a string)
    if (bot.recall('1')) {
        for (var i=1; bot.recall(i.toString()); i++) {
            console.log(i);
            bot.say(i + '   ' + bot.recall(i.toString()));
        }
    } else {
        bot.say('Compliance list is empty.');
    }
});


// remove the selected compliance regular expression
flint.hears('/removecompliance', function(bot, trigger) {
    var nextkey = 0;
    var thiskey = trigger.args[1];
    console.log('thiskey: ' + thiskey);
    console.log('bot.recall(thiskey): ' + bot.recall(thiskey));

    // if thiskey is defined then delete it and rotate any subsequent keys up
    if (bot.recall(thiskey)) {
        nextkey = parseInt(thiskey) + 1;
        console.log('nextkey: ' + nextkey);
        console.log('bot.recall(nextkey.toString()): ' + bot.recall(nextkey.toString()));

        // if nextkey is defined, copy its value to this key
        for (var x=nextkey; bot.recall(x.toString()); x++) {
            console.log('bot.recall(x.toString()): ' + bot.recall(x.toString()));
            thiskey = x - 1;
            console.log('thiskey: ' + thiskey);
            // copy nextkey to thiskey
            bot.store(thiskey.toString(), bot.recall(x.toString()));
        }

        // loop ended when nextkey is no longer define, so delete thiskey
        thiskey = x - 1;
        bot.forget(thiskey.toString());

    } else { // else thiskey is not defined...
        bot.say(trigger.args[1] + 'is not defined.');
    }

    // show list of compliance regular expressions
    for (var i=1; bot.recall(i.toString()); i++) {
        console.log(i);
        bot.say(i + '   ' + bot.recall(i.toString()));
    }
});


// all messages that do not match a command
//  #perform compliance check#
// (change * below to #)
flint.hears(/.$/, function(bot, trigger) {
    var compliant = true;
    var myregex = new RegExp('');
    var check = '';
    var msg = trigger.text;
    console.log('msg: ' + msg);

    // retrieve regex
    for (var key=1; bot.recall(key.toString()); key++) {
        console.log('compliance check: ' + key);
//        bot.say(i + '   ' + bot.recall(i.toString()));
        myregex = new RegExp(bot.recall(key.toString()));
        console.log('myregex: ' + myregex);

        // apply regex to replace instance in string
        msg = msg.replace(myregex, "XXXXXXXXX");
        console.log('key: ' + key + '  msg: ' + msg);
    }

    // check if message changed
    console.log('out of foor loop.  msg: ' + msg);
    console.log('trigger.text: ' + trigger.text);
    if (msg != trigger.text) {
        // if new message does not match original, then it changed -- non-compliant
        // delete the message and restate the message
        bot.say('You can not say that!');

        // delete the message
        console.log('trigger.id: ' + trigger.id);
        request({
                url: "https://api.ciscospark.com/v1/messages/" + trigger.id,
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token_spark,
                    "Content-Type": "application/json"
                }  //headers
            },  //request parameters - delete message
            function (error, response, body) {
                if(error) {
                    console.log("delete error: " + error);
                } else {
                    console.log("delete body: " + body);
                }
            } //function - request delete message
        ); //request - delete message

        // restate the message
        console.log('restate the message now');
        bot.say(trigger.personDisplayName + ": " + msg);
    }



    // compare regex for all parts of message
/*        for (var argpart=0; i < trigger.args.length; argpart++) {
            myregex = new RegExp(trigger.args[argpart]);
            console.log('myregex: ' + myregex);
            check = trigger.args[argpart].match(myregex);
            console.log('check: ' + check);
            if (check.length > 0) {
                trigger.args[argpart] = "XXXXXXXXXXX";
                console.log('match! ' + trigger.args[argpart]);
                compliant = false;
            }
        }
    }

    // delete/mask if match
    if (compliant == false) {
        bot.say('You can not say that!');
        request({
                url: "https://api.ciscospark.com/v1/messages/" + messageList.items[i].id,
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token_spark,
                    "Content-Type": "application/json"
                }  //headers
            },  //request parameters - delete message
            function (error, response, body) {
                if(error) {
                    console.log("delete error: " + error);
                } else {
                    console.log("delete body: " + body);
                }
            } //function - request delete message
        ); //request - delete message
        bot.say(trigger.personDisplayName + ": " + trigger.args);
    }
*/
});




flint.hears('/compliancetest', function(bot, trigger) {
    // get regex as string
    // generic 16 digit numberic code: [0-9]{16}
    console.log("/compliance");
    bot.say("test starting");
    var str1 = "[0-9]{16}";
    console.log("str1: " + str1);

    // convert string to regex
    var myregex = new RegExp(str1);
    console.log("myregex : " + myregex);

    // compare regex
    var str2 = "1234567890123456";
    var res = str2.match(myregex);
    console.log("str2: " + str2);
    console.log("res: " + res);

    var str3 = "123456789012345";
    res = str3.match(myregex);
    console.log("str3: " + str3);
    console.log("res: " + res);

    var str4 = "123456789o123456";
    res = str4.match(myregex);
    console.log("str4: " + str4);
    console.log("res: " + res);

    var str5 = "123456789 123456";
    res = str5.match(myregex);
    console.log("str5: " + str5);
    console.log("res: " + res);


    bot.say("test done");

    // delete/mask if match

});

function getRoomDetails(roomId, tokenSpark, callback) {
    console.log("getRoomDetails(" + roomId + ", " + tokenSpark + ")");
    console.log("Received room id: " + roomId);
    var apiUrl = "https://api.ciscospark.com/v1/rooms/" + roomId;
    console.log("apiUrl: " + apiUrl);
    request({
            url: apiUrl,
            method: "GET",
            headers: {
                "Authorization": "Bearer " + tokenSpark,
                "Content-Type": "application/json"
            }, //headers
            qs: {
                showSipAddress: "true"
            } //qs
        }, //request
        function (error, response, body) {
            if(error) {
                console.log("Room detail retrieval error: " +  error);
            } else {
                console.log("body: ");
                console.log(body);
//                return body;
            } //else
            callback(error, body);
        } //function
    ); //request
} //function getRoomDetails