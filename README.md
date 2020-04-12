Discord Dice Roll Bot
==========================

A Discord bot that logs into the server specified by the `TOKEN` in the .env file. Uses the Javascript `Math.random()` function to simulate
dice rolls whenever a message in the server begins with the activation phrase `!roll`.

The input after the `!roll` command should match the pattern `#d#` or `#d#+#` or `#d#-#` where `#` are any integers between 0 and 1000.
The first integer represents the number of dice to roll (if it is omitted, it is considered to be 1), the second represents the number 
of faces on those dice, and the third (if a third is included) represents a single number to add to the total after all of the dice have been rolled.
