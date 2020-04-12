const express = require("express");
const app = express();
const Discord = require("discord.js");
require("dotenv").config();

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/test", (request, response) => {
  response.send(testGenerateResponse());
});

// listen for requests
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

// Initialize Discord Bot
const bot = new Discord.Client();

const helpText =
  "Try typing\n" +
  "'!roll xdy' or '!roll xdy+z' or '!roll xdy-z'\n" +
  "where x, y, and z are integers\n\n" +
  "x represents the quantity of dice to roll (if you leave this blank, I'll assume you mean 1)\n" +
  "y represents the number of faces on those dice\n" +
  "z represents a modifier to add or subtract\n\n" +
  "For example, '!roll 2d6+2' will roll 2 dice, " +
  "each of which can return anything from 1 to 6, and then add 2 to the total of those 2 dice.\n\n" +
  "The number of dice and number of sides should both be at least 1, and less than 1000 (because that's just unnecessary, don't be silly).";

const formatText =
  "Please format the command as #d#, optionally with +# or -#, or use '!roll help' for more details";

const numbersTooLargeText =
  "Number of dice and number of faces of rolls must both be below 1000 (that's too much work, even for a robot)";

const triggerWord = "!roll";

const smallQuantityResultString = "${numberList}\nTotal: ${total}";
const smallQuantityResultStringNumberListRegex = /\$\{numberList\}/;
const smallQuantityResultStringTotalRegex = /\$\{total\}/;

const largeQuantityResultString =
  "Your total with ${quantity} d${size} rolls was ${total}";
const largeQuantityResultStringQuantityRegex = /\$\{quantity\}/;
const largeQuantityResultStringSizeRegex = /\$\{size\}/;
const largeQuantityResultStringTotalRegex = /\$\{total\}/;

const modifierIncludedResultString =
  "${baseString} ${modifierChar} ${modifier} = ${total}";
const modifierIncludedResultStringBaseStringRegex = /\$\{baseString\}/;
const modifierIncludedResultStringModifierCharRegex = /\$\{modifierChar\}/;
const modifierIncludedResultStringModifierRegex = /\$\{modifier\}/;
const modifierIncludedResultStringTotalRegex = /\$\{total\}/;

bot.on("ready", () => {
  console.log(`Dice Roll bot is ready`);
});

bot.on("message", async message => {
  if (message.author.bot) {
    return;
  }

  const response = generateResponse(message.content);
  if (response) {
    message.channel.send(response);
  }
});

bot.login(process.env.TOKEN);

function generateResponse(input) {
  var rollIndex = input.indexOf(triggerWord);
  if (rollIndex == -1) {
    return false;
  }

  input = input.slice(rollIndex + triggerWord.length).trim();

  if (checkPattern(input)) {
    const quantity = getQuantity(input);
    const size = getSize(input);
    const modifier = getModifier(input);

    if (quantity > 1000 || size > 1000) {
      return numbersTooLargeText;
    }

    const dice = rollDice(quantity, size);
    return buildResultFromDice(dice, size, modifier);
  } else if (input.toLowerCase().includes("help")) {
    return helpText;
  } else {
    return formatText;
  }
}

function checkPattern(input) {
  // Matches the #d# or #d#+# or #d#-# patterns
  // ([1-9][0-9]*)? : Optionally, an integer without leading 0s
  // \s*d\s* : The 'd' representing 'dice', surrounded by optional whitespace
  // [1-9][0-9]* : An integer without leading 0s
  // \s* : Optional whitespace
  // ([+-]\s*[0-9]+)? : Optionally, a '+' or '-', followed by optional whitespace, followed by an integer
  // i : Ignore case for the 'd'
  var dicePattern = /^(([1-9][0-9]*)?\s*d\s*[1-9][0-9]*)\s*([+-]\s*[0-9]+)?/i;
  return dicePattern.test(input);
}

function getQuantity(input) {
  // Find where in the string 'd'/'D' is. If it's at the beginning, no quantity was specified, so default to 1
  const dIndex = input.toLowerCase().indexOf("d");
  var quantity = 1;
  if (dIndex > 0) {
    quantity = parseInt(input, 10);
  }
  return quantity;
}

function getSize(input) {
  const dIndex = input.toLowerCase().indexOf("d");
  input = input.slice(dIndex + 1).trim();
  return parseInt(input, 10);
}

function getModifier(input) {
  const plusIndex = input.toLowerCase().indexOf("+");
  const minusIndex = input.toLowerCase().indexOf("-");

  var modifier = 0;
  if (plusIndex != -1) {
    input = input.slice(plusIndex + 1).trim();
    modifier = parseInt(input, 10);
  } else if (minusIndex != -1) {
    input = input.slice(minusIndex + 1).trim();
    modifier = parseInt(input, 10) * -1;
  }

  return modifier;
}

function rollDice(quantity, size) {
  var results = [];
  for (var i = 0; i < quantity; i++) {
    results.push(getRandomInteger(1, size));
  }
  return results;
}

function buildResultFromDice(dice, size, modifier) {
  var total = 0;
  var returnString = "";
  for (var i = 0; i < dice.length; i++) {
    total += dice[i];

    if (dice.length <= 10) {
      returnString += dice[i];
      if (i != dice.length - 1) {
        returnString += ", ";
      }
    }
  }

  if (dice.length > 10) {
    total += modifier;
    returnString = largeQuantityResultString
      .replace(largeQuantityResultStringQuantityRegex, dice.length)
      .replace(largeQuantityResultStringSizeRegex, size)
      .replace(largeQuantityResultStringTotalRegex, total - modifier);
    if (modifier != 0) {
      returnString = addModifierToReturnString(returnString, modifier, total);
    }
    return returnString;
  } else {
    if (modifier == 0) {
      if (dice.length == 1) {
        return total;
      } else {
        return smallQuantityResultString
          .replace(smallQuantityResultStringNumberListRegex, returnString)
          .replace(smallQuantityResultStringTotalRegex, total);
      }
    } else {
      total += modifier;
      if (dice.length > 1) {
        returnString = smallQuantityResultString
          .replace(smallQuantityResultStringNumberListRegex, returnString)
          .replace(smallQuantityResultStringTotalRegex, total - modifier);
      }
      return addModifierToReturnString(returnString, modifier, total);
    }
  }
}

function addModifierToReturnString(baseString, modifier, total) {
  if (modifier == 0) {
    return baseString;
  }
  var modifierChar = modifier > 0 ? "+" : "-";
  return modifierIncludedResultString
    .replace(modifierIncludedResultStringBaseStringRegex, baseString)
    .replace(modifierIncludedResultStringModifierCharRegex, modifierChar)
    .replace(modifierIncludedResultStringModifierRegex, Math.abs(modifier))
    .replace(modifierIncludedResultStringTotalRegex, total);
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * max) + min;
}

// TESTING

const testCases = [
  generateTest(1, getQuantity("d6"), 1),
  generateTest(2, getQuantity("1d6"), 1),
  generateTest(3, getQuantity("3d6"), 3),
  generateTest(4, getQuantity("12d6"), 12),
  generateTest(5, getQuantity("d6+4"), 1),
  generateTest(6, getQuantity("1d6+4"), 1),
  generateTest(7, getQuantity("3d6+4"), 3),
  generateTest(8, getQuantity("12d6+4"), 12),
  generateTest(9, getQuantity("d6-4"), 1),
  generateTest(10, getQuantity("1d6-4"), 1),
  generateTest(11, getQuantity("3d6-4"), 3),
  generateTest(12, getQuantity("12d6-4"), 12),
  generateTest(13, getQuantity("12 d 6 - 4"), 12),

  generateTest(14, getSize("d6"), 6),
  generateTest(15, getSize("1d6"), 6),
  generateTest(16, getSize("3d6"), 6),
  generateTest(17, getSize("12d6"), 6),
  generateTest(18, getSize("d6+4"), 6),
  generateTest(19, getSize("1d6+4"), 6),
  generateTest(20, getSize("3d6+4"), 6),
  generateTest(21, getSize("12d6+4"), 6),
  generateTest(22, getSize("d6-4"), 6),
  generateTest(23, getSize("1d6-4"), 6),
  generateTest(24, getSize("3d6-4"), 6),
  generateTest(25, getSize("12d6-4"), 6),
  generateTest(26, getSize("12 d 6 - 4"), 6),

  generateTest(27, getModifier("d6"), 0),
  generateTest(28, getModifier("1d6"), 0),
  generateTest(29, getModifier("3d6"), 0),
  generateTest(30, getModifier("12d6"), 0),
  generateTest(31, getModifier("d6+4"), 4),
  generateTest(32, getModifier("1d6+4"), 4),
  generateTest(33, getModifier("3d6+4"), 4),
  generateTest(34, getModifier("12d6+4"), 4),
  generateTest(35, getModifier("d6-4"), -4),
  generateTest(36, getModifier("1d6-4"), -4),
  generateTest(37, getModifier("3d6-4"), -4),
  generateTest(38, getModifier("12d6-4"), -4),
  generateTest(39, getModifier("12 d 6 - 4"), -4),

  generateTest(40, buildResultFromDice([5], 6, 0), "5"),
  generateTest(41, buildResultFromDice([5, 4, 2], 6, 0), "5, 4, 2\nTotal: 11"),
  generateTest(
    42,
    buildResultFromDice([5, 4, 2, 1, 3, 6, 4, 2, 1, 6, 2, 5], 6, 0),
    "Your total with 12 d6 rolls was 41"
  ),
  generateTest(43, buildResultFromDice([5], 6, 4), "5 + 4 = 9"),
  generateTest(
    44,
    buildResultFromDice([5, 4, 2], 6, 4),
    "5, 4, 2\nTotal: 11 + 4 = 15"
  ),
  generateTest(
    45,
    buildResultFromDice([5, 4, 2, 1, 3, 6, 4, 2, 1, 6, 2, 5], 6, 4),
    "Your total with 12 d6 rolls was 41 + 4 = 45"
  ),
  generateTest(46, buildResultFromDice([5], 6, -4), "5 - 4 = 1"),
  generateTest(
    47,
    buildResultFromDice([5, 4, 2], 6, -4),
    "5, 4, 2\nTotal: 11 - 4 = 7"
  ),
  generateTest(
    48,
    buildResultFromDice([5, 4, 2, 1, 3, 6, 4, 2, 1, 6, 2, 5], 6, -4),
    "Your total with 12 d6 rolls was 41 - 4 = 37"
  ),

  generateTest(49, checkPattern("12 d 6 - 4"), true),
  generateTest(50, checkPattern("12 D 6 - 4"), true),
  generateTest(51, checkPattern("3D4-5"), true),
  generateTest(52, checkPattern("3de4"), false),
  generateTest(53, checkPattern("0d5"), false),
  generateTest(54, checkPattern("5d0"), false),
  generateTest(55, checkPattern("5d6+0"), true),

  generateTest(56, generateResponse("d20"), false),
  generateTest(57, generateResponse("!roll help"), helpText),
  generateTest(58, generateResponse("!roll 3e4"), formatText),
  generateTest(59, generateResponse("!roll 1111d4"), numbersTooLargeText),
  generateTest(60, generateResponse("!roll 1d1111"), numbersTooLargeText),
  generateTest(61, generateResponse("!roll d1"), "1"),
  generateTest(62, generateResponse("!roll 1d1"), "1"),
  generateTest(63, generateResponse("!roll 3d1"), "1, 1, 1\nTotal: 3"),
  generateTest(
    64,
    generateResponse("!roll 12d1"),
    "Your total with 12 d1 rolls was 12"
  ),
  generateTest(65, generateResponse("!roll d1+4"), "1 + 4 = 5"),
  generateTest(66, generateResponse("!roll 1d1+4"), "1 + 4 = 5"),
  generateTest(
    67,
    generateResponse("!roll 3d1+4"),
    "1, 1, 1\nTotal: 3 + 4 = 7"
  ),
  generateTest(
    68,
    generateResponse("!roll 12d1+4"),
    "Your total with 12 d1 rolls was 12 + 4 = 16"
  ),
  generateTest(69, generateResponse("!roll d1-4"), "1 - 4 = -3"),
  generateTest(70, generateResponse("!roll 1d1-4"), "1 - 4 = -3"),
  generateTest(
    71,
    generateResponse("!roll 3d1-4"),
    "1, 1, 1\nTotal: 3 - 4 = -1"
  ),
  generateTest(
    72,
    generateResponse("!roll 12d1-4"),
    "Your total with 12 d1 rolls was 12 - 4 = 8"
  ),
  generateTest(
    73,
    generateResponse("!roll 12 d 1 - 4"),
    "Your total with 12 d1 rolls was 12 - 4 = 8"
  )
];

function testGenerateResponse() {
  var success = true;
  var failedCases = [];
  for (var i = 0; i < testCases.length; i++) {
    if (testCases[i].actualOutput != testCases[i].expectedOutput) {
      success = false;
      failedCases.push(testCases[i]);
    }
  }

  if (success) {
    return true;
  } else {
    return failedCases;
  }
}

function generateTest(id, actualOutput, expectedOutput) {
  return {
    id: id,
    actualOutput: actualOutput,
    expectedOutput: expectedOutput
  };
}
