const Discord = require('discord.js');
require('dotenv').config();

const bot = new Discord.Client();

bot.on("message", async (message) => {
    if(message.content.substring(0, 5).toLowerCase() != "!roll") return;
    if(message.author.bot) return;
    
    var input = message.content.slice(5).trim();

    var dicePattern = new RegExp("^[1-9][0-9]*[dD][1-9][0-9]*$");
    if (dicePattern.test(input)) {
        message.channel.send(rollDice(input));
        return;
    }
    else if (input.toLowerCase() == "help") {
        message.channel.send("Enter '!roll xdy', where x and y are integers. x represents the quantity of dice to roll, and y represents the number of faces on those dice. For example, '!roll 2d6' will roll 2 dice, each of which can return any value between 1 and 6 inclusive. If the quantity of dice is greater than 10, the return value will simply be the average of the rolls. The quantity and size must both be strictly positive, and less than 1000.");
        return;
    }
    else {
        message.channel.send("Please format input as #d#, or use '!roll help' for more details");
        return;
    }
});

bot.login(process.env.TOKEN);

function rollDice (input) {
    var dIndex = input.toLowerCase().indexOf("d");

    var quantity = parseInt(input);
    input = input.slice(dIndex + 1);
    var size = parseInt(input);

    if (quantity >= 1000 || size >= 1000) {
        return "Quantity and size of rolls must both be below 1000";
    }

    if (quantity > 10) {
        var total = 0;
        for (var i = 0 ; i < quantity ; i++) {
            var result = Math.floor(Math.random() * size) + 1;
            total += result;
        }
        var average = total / quantity;
        return "Your average roll with " + quantity + " d" + size + " rolls was " + average;
    }
    else {
        var returnString = "";
        for (var i = 0 ; i < quantity ; i++) {
            var result = Math.floor(Math.random() * size) + 1;
            returnString += result;
            if (i != quantity - 1) {
                returnString += "\n";
            }
        }
        return returnString;
    }
}