/*
 * The Game Project 7 - Make it Awesome
 *
 * Please note: I've reorganized the code a lot, as function declaration
 * hoisting (while useful) is in most scenarios considered to be a code smell.
 * The core game functions (preload, setup, draw, and event handlers) are now
 * at the bottom of the file.
 *
 * Additionally, I've changed some of the variables and functions to follow
 * a consistent naming scheme.
 *
 * For this final project, I was focused on these two extensions:
 * 1. Adding advanced graphics
 *    While I kept most of the broad aesthetic choices from previous projects,
 *    I added randomization for character skintone, more realistic animation for
 *    'spinning' coins, and enhancements to the canyons and overlays. I wantd to
 *    be judicious in where I applied algorithmic design rather than
 *    hand-coded curation, though. The positions of elements are all hardcoded,
 *    and were tweaked and playtested until they felt right.
 *
 *    In addition to the purely graphical changes, I added elements that would
 *    enhance 'game feel', such as horizontal and vertical inertia, hitboxes for
 *    more precise collision detection, and a debug mode (press shift to toggle)
 *    that allows the reviewer (and myself) to test the functionality of all of
 *    the game interactions.
 *
 * 2. Adding sound
 *    I'm a professional JavaScript developer, but I haven't had much opportunity
 *    to use sound on the web, particularly the kinds of short sound effects
 *    used in game design. I wanted to give a little extra oomph to specific
 *    actions without overwhelming the player, so I spent a lot of time
 *    sourcing the sound effects I used and applying them carefully. The hit
 *    and jump effects have a little bit of randomization, and the running effect
 *    has been throttled so it gives enough indication that the character is
 *    interacting with the world but (hopefully) not too much that it
 *    becomes annoying.
 *
 * One last note: I had originally intended to go above and beyond and implement
 * enemies and platforms, but the feedback from the midterms made me worried
 * that doing so would actually cost me point from my grade. I'm still not entirely
 * sure how to resolve the dichotomy between 'make it awesome' and 'follow the
 * specifications precisely,' and I know that a number of other students are
 * also worried about that. There are a lot of experienced programmers in the
 * course who are genuinely excited to apply our skills in new domains, especially
 * game design, and I hope you'll take that into account when evaluating us.
 */

// ----------------------------------
// Globals
// ----------------------------------
// - when the character moves left and right, apply a bit of acceleration
//   rather than using a constant speed
// - when falling and plummeting, also apply acceleration to the downward velocity
// - when plummeting, the left/right speed doesn't drop immediately to zero, but
//   rather decelerates very suddenly
const gravity = 0.4; // vertical acceleration
const inertia = 0.4; // horizontal acceleration
const plummetingInertia = inertia * 0.8; // deceleration when plummeting
const maxVelocity = 6;
const rotationSpeed = 0.16; // controls the 'rotation' effect of coins
// Game Over and Level Complete overlays
const overlayWidth = 400;
const overlayHeight = 150;
const maxLives = 3;
const characterSpawn = 50; // initial x position where the character spawns
const skyBlue = [100, 155, 255]; // color of the sky
// game world
const world = {
  width: 1024,
  height: 576,
  floor: 432,
  scroll: 0 // scroll position
};
// character skintones
const tones = [
  [255, 209, 171],
  [223, 162, 111],
  [179, 114, 61],
  [133, 73, 23],
  [82, 37, 0]
];

// Fonts and sounds
let font;
let sounds;
const playRunSound = throttleSound('run'); // function that's called when running

// hit shift to toggle the display of hitboxes on and off
let debug;
let character; // game character properties and hitbox
let score;
let lives;
// this will be false if player hits a game over or level complete screen
let isGameRunning;
// game objects
let trees;
let canyons;
let clouds;
let mountains;
let coins;
let flagpole;

// ----------------------------------
// Instantiate world objects
// ----------------------------------

// add hitboxes to canyon objects
function setCanyonValue (canyon) {
  // NOTE: the character's feet are 12px out from their body, so they don't
  // fall until both feet are 'over' the canyon. This nudge value is close to
  // the character hitbox's width minus 12px (it's actually slightly off,
  // becase that feels better when playing)
  const nudgeValue = 28;
  // 1px overlap when game character is on the ground + 6px since character's
  // hitbox is actually slightly above the ground
  const feetGap = 7;

  return {
    ...canyon,
    hitbox: {
      x: canyon.x - canyon.size / 2 + nudgeValue,
      y: world.floor - feetGap,
      width: canyon.size - nudgeValue * 2,
      height: world.height - world.floor + feetGap
    }
  };
}

// add default values and hitboxes to coin objects
function setCoinValue (coin) {
  coin = {
    ...coin,
    // we're adding these properties here rather than copying+pasting in
    // every coin object
    rotation: 0,
    rotationDirection: 'shrink',
    isFound: false,
    width: coin.size,
    // override y value, setting it based on the floor position
    y: world.floor - coin.y
  };

  coin.hitbox = {
    x: coin.x - coin.size / 2,
    y: coin.y - coin.size / 2,
    width: coin.size,
    height: coin.size
  };

  return coin;
}

// initialize the world objects and player character
function initializeGame () {
  trees = [
    // Screen 1
    { x: 200 },
    { x: 620 },
    { x: 855 },
    // Screen 2
    { x: 1224 },
    { x: 1648 },
    { x: 1879 },
    // Screen 3
    { x: 2243 },
    { x: 2686 },
    { x: 2887 },
    // Screen 4
    { x: 3272 },
    { x: 3772 }
  ];

  clouds = [
    // screen 1
    { x: 85, y: 90, size: 1 },
    { x: 420, y: 150, size: 0.85 },
    { x: 700, y: 50, size: 0.7 },
    { x: 820, y: 80, size: 0.75 },
    // screen 2
    { x: 1109, y: 90, size: 1.1 },
    { x: 1444, y: 150, size: 0.85 },
    { x: 1724, y: 50, size: 0.74 },
    { x: 1844, y: 80, size: 0.79 },
    // screen 3
    { x: 2133, y: 90, size: 0.8 },
    { x: 2475, y: 150, size: 1 },
    { x: 2700, y: 50, size: 0.8 },
    { x: 2850, y: 120, size: 1 },
    // screen 4
    { x: 3157, y: 90, size: 1.2 },
    { x: 3392, y: 150, size: 0.85 },
    { x: 3772, y: 50, size: 0.7 }
  ];

  mountains = [
    // screen 1
    { x: 5 },
    { x: 320 },
    { x: 647, hasDoor: true },
    // screen 2
    { x: 1029 },
    { x: 1340, hasDoor: true },
    { x: 1671 },
    // screen 3
    { x: 2055 }
  ];

  canyons = [
    // screen 1
    { x: 275, size: 80 },
    { x: 550, size: 80 },
    { x: 940, size: 100 },
    // screen 2
    { x: 1299, size: 80 },
    { x: 1574, size: 100 },
    { x: 1964, size: 90 },
    // screen 3
    { x: 2323, size: 100 },
    { x: 2598, size: 110 },
    { x: 2988, size: 130 }
  ].map(setCanyonValue);

  coins = [
    // screen 1
    { x: 275, y: 60, size: 20 },
    { x: 550, y: 60, size: 25 },
    { x: 920, y: 60, size: 30 },
    { x: 964, y: 52, size: 35 },
    { x: 1000, y: 25, size: 32 },
    // screen 2
    { x: 1299, y: 60, size: 25 },
    { x: 1554, y: 60, size: 35 },
    { x: 1598, y: 52, size: 35 },
    { x: 1634, y: 25, size: 35 },
    { x: 1964, y: 60, size: 25 },
    // screen 3
    { x: 2303, y: 60, size: 25 },
    { x: 2343, y: 60, size: 25 },
    { x: 2598, y: 60, size: 40 },
    { x: 2988, y: 70, size: 40 }
  ].map(setCoinValue);

  flagpole = {
    x: 3148,
    height: world.floor - 160,
    flagHeight: world.floor - 155,
    offset: 0,
    offsetDirection: 'down',
    isFound: false
  };

  flagpole.hitbox = {
    x: flagpole.x - 2.5,
    y: flagpole.height,
    width: 60,
    height: 160
  };

  // set the number of lives
  lives = maxLives;
}

// this is called whenever the character dies or finishes the level
function startGame () {
  // reset the game score
  score = 0;

  // reset the scroll position
  world.scroll = 0;

  // reset the coins and other agents
  coins.forEach((c) => (c.isFound = false));

  // reset the character
  character = {
    x: characterSpawn,
    y: world.floor,
    skintone: random(tones), // randomize the character skintone
    // toggled when the player moves
    isLeft: false,
    isRight: false,
    isFalling: false,
    isPlummeting: false,
    // toggled when the player dies
    isAlive: true,
    // horizontal and vertical velocity determine how far the
    // character should move each frame
    horizontalVelocity: 0,
    verticalVelocity: 0
  };

  // position of the character in relation to world objects.
  // used for collision detection
  character.worldX = character.x - world.scroll;

  // the character hitbox is used to determine whether they've
  // interacted with world objects
  character.hitbox = {
    x: character.worldX - 22,
    y: character.y - 70,
    width: 42,
    height: 64
  };

  // reset the flagpole
  flagpole.isFound = false;

  // unpause everything
  isGameRunning = true;
}

// ---------------------
// Sound functions
// ---------------------

// function that plays all game sounds. hits and jumps are randomized
function playSound (name, volume = 1) {
  let sound;

  if (['hit', 'jump'].includes(name)) {
    // play a random hit or jump sound
    sound = sounds[name]();
  } else {
    sound = sounds[name];
  }

  sound.setVolume(volume);
  sound.play();
}

// simple throttling function for playing sounds
function throttleSound (name, volume, wait = 300) {
  let throttled;

  return () => {
    if (!throttled && isGameRunning) {
      playSound(name, volume);
      throttled = true;
      setTimeout(() => {
        throttled = false;
      }, wait);
    }
  };
}

// ----------------------------------
// Move agents
// ----------------------------------

function calculateHorizontalVelocity (agent) {
  if (agent.isPlummeting || flagpole.isFound) {
    // horizontal velocity drops when plummeting OR when we've hit the flagpole
    agent.horizontalVelocity =
      agent.horizontalVelocity - plummetingInertia > 0
        ? agent.horizontalVelocity - plummetingInertia
        : 0;
  } else if (agent.horizontalVelocity < maxVelocity) {
    // otherwise the velocity increases up to the maximum
    agent.horizontalVelocity += inertia;
  } else {
    // velocity is at maximum
    agent.horizontalVelocity = maxVelocity;
  }
}

function moveLeft (agent) {
  calculateHorizontalVelocity(agent);

  if (agent === character && agent.x < world.width * 0.2 && world.scroll < 0) {
    // scroll left
    world.scroll += agent.horizontalVelocity;
  } else if (agent === character && agent.x <= 24) {
    // don't allow the player to scroll left past the beginning of the level
    agent.x = 24;
  } else {
    // move left
    agent.x -= agent.horizontalVelocity;
  }
}

function moveRight (agent) {
  calculateHorizontalVelocity(agent);

  if (agent === character && agent.x > world.width * 0.8) {
    // scroll right
    world.scroll -= agent.horizontalVelocity;
  } else {
    // move right
    agent.x += agent.horizontalVelocity;
  }
}

// when the game character is above the floor, they are considered to be falling
function checkFalling (agent) {
  agent.isFalling = agent.y < world.floor;
}

function jump (agent) {
  // give them an initial boost up and a large (negative) vertical velocity.
  // this will drop to zero and they'll start falling down, based on gravity
  agent.verticalVelocity = -7;
  agent.y -= 3;
}

function fallDown (agent) {
  if (agent.y + agent.verticalVelocity < world.floor) {
    // fall when we're above the floor
    agent.verticalVelocity += gravity;
    agent.y += agent.verticalVelocity;
  } else {
    // stop falling when we've hit the floor
    agent.y = world.floor;
  }
}

function plummetDown (agent) {
  // keep plummeting forever
  agent.verticalVelocity += gravity;
  agent.y += agent.verticalVelocity;
}

// determines whether we should play a running sound
function isRunning () {
  return (character.isLeft || character.isRight) && !character.isFalling;
}

// move the player character or another agent.
// an agent is any game object that is able to move
function move (agent) {
  if (!isGameRunning) {
    return; // don't calculate any movement if game is paused
  }

  // logic to make an agent rise and fall
  checkFalling(agent);

  // logic to make an agent move or the background scroll
  if (agent.isLeft) {
    moveLeft(agent);
  } else if (agent.isRight) {
    moveRight(agent);
  } else {
    // reset the velocity
    agent.horizontalVelocity = 0;
  }

  // logic to make an agent fall or plummet
  if (agent.isFalling) {
    fallDown(agent);
  } else if (agent.isPlummeting) {
    plummetDown(agent);
  } else {
    // on the ground, safe and sound
    agent.verticalVelocity = 0;
  }

  // once velocities and stats toggles have been set, move the character
  if (agent === character) {
    // play a running sound
    if (isRunning()) {
      playRunSound();
    }
    // update real position of the character for collision detection
    agent.worldX = agent.x - world.scroll;

    // update the character hitbox for collision detection
    agent.hitbox.x = agent.worldX - 22;
    agent.hitbox.y = agent.y - 70;
  } else {
    // update other agents' hitboxes for collision detection
    agent.hitbox.x = agent.x - agent.hitbox.width / 2;
    agent.hitbox.y = agent.y - agent.hitbox.height;
  }
}

// ----------------------------------
// Check agent intersections
// ----------------------------------

// In the previous game projects, I used p5js's dist() to determine whether the
// character was interacting with the canyons or collectables, but for the final
// game project I learned how to code simple hitboxes.
//
// This fixes a lot of edge cases around both canyons and collectables, including
// when the character approaches them from odd angles. Because my collectables
// are rotating coins, I also wanted the hitboxes to take into account their
// rotation, which would have been difficult to simulate with the simpler dist()
// pattern.
//
// It also allows me to calculate the intersections between the player character
// and any other agents (game objects that move), e.g. enemies.
//
// Press shift to toggle debug mode, which will draw the hitboxes on the screen.
function isIntersecting (hitbox1, hitbox2) {
  return (
    // top of hitbox1
    hitbox1.y < hitbox2.y + hitbox2.height &&
    // right of hitbox1
    hitbox1.x + hitbox1.width > hitbox2.x &&
    // bottom of hitbox1
    hitbox1.y + hitbox1.height > hitbox2.y &&
    // left of hitbox1
    hitbox1.x < hitbox2.x + hitbox2.width
  );
}

// determine if the first agent has a greater bottom hitbox gap than any
// other side. if so, it means they've 'jumped on' the second agent
function hasGreaterBottomGap (hitbox1, hitbox2) {
  const topGap = hitbox2.y + hitbox2.height - hitbox1.y;
  const rightGap = hitbox1.x + hitbox1.width - hitbox2.x;
  const bottomGap = hitbox1.y + hitbox1.height - hitbox2.y;
  const leftGap = hitbox2.x + hitbox2.width - hitbox1.x;

  return bottomGap > topGap && bottomGap > rightGap && bottomGap > leftGap;
}

function findCoin (coin) {
  if (!coin.isFound) {
    playSound('coin');
  }
  coin.isFound = true;
}

function findFlagpole () {
  if (!flagpole.isFound) {
    playSound('win', 0.25);
  }
  flagpole.isFound = true;
}

function setPlummeting (agent) {
  if (!agent.isPlummeting && agent === character) {
    playSound('lose', 0.4);
  }
  agent.isPlummeting = true;
}

// This function handles ALL of our intersection checking:
// - stuff that only the player character can interact with:
//   - coins, flagpole, other agents
// - stuff that all agents can interact with:
//    - canyons, falling off the screen
function checkintersections (agents) {
  agents.forEach((agent) => {
    if (agent === character) {
      // check if player character is intersecting with any coins
      coins.some((coin) => {
        if (isIntersecting(agent.hitbox, coin.hitbox)) {
          findCoin(coin);
        }
      });

      // check if player character is intersecting with flagpole
      if (isIntersecting(agent.hitbox, flagpole.hitbox)) {
        findFlagpole();
      }

      // check if player character is intersecting with any other agents
      agents.some((otherAgent) => {
        if (
          agent !== otherAgent &&
          isIntersecting(agent.hitbox, otherAgent.hitbox)
        ) {
          // determine who killed whom
          if (hasGreaterBottomGap(agent.hitbox, otherAgent.hitbox)) {
            otherAgent.isAlive = false;
          } else {
            agent.isAlive = false;
          }
        }
      });
    }

    // check if agent is intersecting with any canyons
    canyons.some((canyon) => {
      if (isIntersecting(agent.hitbox, canyon.hitbox)) {
        setPlummeting(agent);
        return true; // exit early, since we don't need to check other canyons
      }
    });

    // check if agent has fallen off the screen
    if (agent.y >= world.height) {
      agent.isAlive = false;
    }
  });
}

// ----------------------------------
// Handle score, player death, level completion, and game over states
// ----------------------------------

function handleConsequences () {
  if (!character.isAlive && lives >= 1) {
    // the character has died, but there are still enough lives to keep playing!
    lives -= 1;
    startGame();
  } else if (lives === 0) {
    // the character has died, and there are no more lives
    isGameRunning = false;
    drawGameOver();
  }

  if (flagpole.isFound) {
    // the character found the flagpole, good job!
    isGameRunning = false;
    drawLevelComplete();
  }

  // update the score
  score = coins.filter((c) => c.isFound).length;
}

// ----------------------------------
// Draw hitboxes (in debug mode)
// ----------------------------------

function drawHitbox ({ x, y, width, height }, color) {
  strokeWeight(1);
  stroke(...color);
  noFill();
  rect(x, y, width, height);
}

// ----------------------------------
// Draw world objects
// ----------------------------------

function drawBackground () {
  // sky
  background(...skyBlue);

  if (debug) {
    // draw a simple ground
    strokeWeight(2);
    stroke(100);
    noFill();
    line(0, world.floor, world.width, world.floor);
    return; // don't draw anything else in debug mode
  }

  // real ground
  noStroke();
  fill(0, 155, 0);
  rect(0, world.floor, world.width, world.height - world.floor);
}

function drawClouds () {
  clouds.forEach(({ x, y, size }) => {
    if (debug) {
      return; // don't draw the clouds in debug mode
    }

    // x is the left side, y is the top
    noStroke();
    fill(150);
    ellipse(x, y + 20, size * 120, size * 85);
    ellipse(x + 30, y, size * 100, size * 90);
    ellipse(x + 30, y + 50, size * 115, size * 60);
    ellipse(x + 60, y + 20, size * 90, size * 90);
    ellipse(x + 100, y, size * 80, size * 80);
    ellipse(x + 120, y + 40, size * 100, size * 80);
    fill(190);
    ellipse(x + 10, y + 25, size * 120, size * 85);
    ellipse(x + 45, y + 5, size * 100, size * 90);
    ellipse(x + 33, y + 53, size * 115, size * 60);
    ellipse(x + 73, y + 27, size * 90, size * 90);
    ellipse(x + 105, y, size * 80, size * 80);
    ellipse(x + 120, y + 45, size * 110, size * 70);
  });
}

function drawMountains () {
  mountains.forEach(({ x, hasDoor = false }) => {
    if (debug) {
      return; // don't draw the mountains in debug mode
    }

    // x is the left side
    const y = world.floor;
    const size = 185; // all of the mountains are the same size
    const doorSize = size / 6;

    noStroke();
    fill(120);
    triangle(x, y, x + size - 135, y - 152, x + size - 85, y); // left
    triangle(x + size - 95, y, x + size - 45, y - 162, x + size, y); // right
    fill(130);
    triangle(x + size - 160, y, x + size - 100, y - 210, x + size - 25, y); // center

    if (hasDoor) {
      // speak friend, and enter
      fill(80);
      rect(x + size - 110, y - doorSize, doorSize, doorSize);
      ellipse(
        x + size - 110 + doorSize / 2,
        y - doorSize - 2,
        doorSize,
        doorSize
      );
    }
  });
}

function drawTrees () {
  trees.forEach(({ x }) => {
    if (debug) {
      return; // don't draw the trees in debug mode
    }

    // x is the center of the tree
    const y = world.floor;

    noStroke();
    fill(87, 44, 7);
    rect(x - 20, y - 80, 43, 80);
    // branches
    stroke(87, 44, 7);
    strokeWeight(10);
    line(x + 23, y - 75, x + 58, y - 100); // right
    strokeWeight(15);
    line(x - 17, y - 75, x - 42, y - 110); // left
    strokeWeight(20);
    line(x - 2, y - 70, x + 23, y - 125); // center
    // negative space between branches
    noStroke();
    fill(100, 155, 255);
    triangle(x - 34, y - 110, x + 15, y - 115, x - 12, y - 72);
    triangle(x + 24, y - 110, x + 11, y - 72, x + 51, y - 100);
    // leaves
    noStroke();
    fill(0, 96, 24);
    ellipse(x - 48, y - 110, 53, 43);
    ellipse(x - 27, y - 122, 72, 62);
    ellipse(x + 3, y - 130, 84, 70);
    ellipse(x + 18, y - 118, 60, 50);
    ellipse(x + 40, y - 125, 52, 47);
    ellipse(x + 58, y - 107, 46, 40);
  });
}

function drawCanyons () {
  canyons.forEach(({ x, size, hitbox }) => {
    // x is the center
    const halfWidth = size / 2;
    const ground = world.floor;

    if (debug) {
      // simple canyon debug visuals
      noFill();
      stroke(200, 200, 0);
      triangle(x - halfWidth, ground, x + halfWidth, ground, x, ground + 300);
      drawHitbox(hitbox, [255, 255, 0]);
      return; // don't draw anything else in debug mode
    }

    // real canyon
    noStroke();
    fill(67);
    triangle(x - halfWidth, ground, x + halfWidth, ground, x, ground + 300);
    fill(46);
    triangle(
      x - halfWidth + 6,
      ground,
      x + halfWidth - 7,
      ground,
      x,
      ground + 300
    );
    fill(...skyBlue);
    triangle(
      x - halfWidth + 10,
      ground,
      x + halfWidth - 12,
      ground,
      x,
      ground + 290
    );
  });
}

// coins 'rotate' by shrinking and growing their widths
function rotateCoin (coin) {
  if (coin.isFound) {
    return; // if we've already found this coin, don't bother rotating
  }

  if (coin.width >= coin.size) {
    coin.rotationDirection = 'shrink';
  } else if (coin.width <= 4) {
    coin.rotationDirection = 'grow';
  }

  if (coin.rotationDirection === 'grow') {
    coin.rotation -= rotationSpeed;
  } else {
    coin.rotation += rotationSpeed;
  }

  coin.width = coin.size - coin.rotation;
}

// coin hitboxes must be updated with their width in the draw loop
function updateCoinHitbox (coin) {
  coin.hitbox = {
    ...coin.hitbox,
    x: coin.x - coin.width / 2,
    width: coin.width
  };
}

function drawCoin ({ x, y, size, width, rotation, isFound, hitbox }) {
  if (isFound) {
    return; // don't draw coins we've already found
  }

  if (debug) {
    // simple coin debug view
    drawHitbox(hitbox, [0, 0, 255]);
    return; // don't draw real coins in debug mode
  }

  // as coins 'rotate', the outer stroke gets thicker and the inner stroke
  // gets thinner, giving the illusion of rotation along the z axis
  const maxRotation = size - 4;
  const outerStroke = 1 + norm(rotation, 0, maxRotation) * 4;
  const innerStroke = 4 - norm(rotation, 0, maxRotation) * 4;

  // x is the center, y is the center
  // outer edge
  stroke(214, 175, 34);
  strokeWeight(outerStroke);
  noFill();
  ellipse(x, y, width, size);
  // inner edge
  stroke(255, 204, 22);
  strokeWeight(innerStroke);
  ellipse(x, y, width - 5, size - 5);
}

function drawCoins () {
  // iterate through each coin, rotating, updating, and drawing it
  coins.forEach((coin) => {
    rotateCoin(coin);
    updateCoinHitbox(coin);
    drawCoin(coin);
  });
}

// lower the flag when we've reached it
function lowerFlag () {
  const speed = 1.4;

  if (flagpole.isFound && flagpole.flagHeight + speed < world.floor - 60) {
    flagpole.flagHeight += speed;
  } else if (flagpole.isFound) {
    flagpole.flagHeight = world.floor - 60;
  } else {
    flagpole.flagHeight = flagpole.height + 5;
  }
}

// give the flag a nice ripple effect
function rippleFlag () {
  if (flagpole.offset > 5) {
    flagpole.offsetDirection = 'down';
  } else if (flagpole.offset < -4) {
    flagpole.offsetDirection = 'up';
  }

  if (flagpole.offsetDirection === 'down') {
    flagpole.offset -= 0.3;
  } else {
    flagpole.offset += 0.3;
  }
}

function drawFlagpole () {
  if (debug) {
    // simple flag debug view
    drawHitbox(flagpole.hitbox, [186, 19, 19]);
    return; // don't draw the real flag in debug mode
  }

  // set some state for drawing
  lowerFlag(flagpole);
  rippleFlag(flagpole);

  // draw the real flag
  noStroke();
  // flag itself
  fill(186, 19, 19);
  triangle(
    flagpole.x,
    flagpole.flagHeight,
    flagpole.x,
    flagpole.flagHeight + 40,
    flagpole.x + 60,
    flagpole.flagHeight + 20 + flagpole.offset
  );
  // pole
  fill(100);
  rect(flagpole.x - 2.5, flagpole.height, 5, 160);
  // base
  fill(69);
  rect(flagpole.x - 20, world.floor - 10, 40, 10);
  rect(flagpole.x - 10, world.floor - 20, 20, 10);
}

// ------------------------------
// Player character render functions
// ------------------------------

function body (x, y) {
  noStroke();
  fill(113, 65, 244); // purple
  triangle(x, y - 5, x - 15, y - 45, x + 15, y - 45);
}

function head (x, y, skintone, tilt = 0) {
  // head
  noStroke();
  fill(...skintone);
  ellipse(x, y - 58, 15);
  // helmet
  noStroke();
  fill(221, 191, 17); // yellow
  arc(x, y - 60, 20, 20, PI + tilt, 0 + tilt);
}

function arms (x, y, tilt = 0, offsetX = 0, offsetY = 0) {
  stroke(0);
  strokeWeight(1);
  fill(255);
  // left arm
  ellipse(x - 17 - offsetX, y - 30 + tilt - offsetY, 8, 8);
  // right arm
  ellipse(x + 17 + offsetX, y - 30 - tilt - offsetY, 8, 8);
}

function legs (x, y, tilt = 0, offsetX = 0, offsetY = 0) {
  noStroke();
  fill(94, 61, 25);
  // left leg
  ellipse(x - 12 - offsetX, y - 10 + tilt - offsetY, 8, 8);
  // right leg
  ellipse(x + 12 + offsetX, y - 10 - tilt - offsetY, 8, 8);
}

function drawCharacter () {
  const {
    x,
    y,
    skintone,
    hitbox,
    isLeft,
    isRight,
    isFalling,
    isPlummeting
  } = character;

  if (debug) {
    // simple character debug view
    drawHitbox(
      {
        ...hitbox,
        // when drawing the hitbox for the character, we need to use its
        // actual x value, not the value we use to determine intersections
        x: x - 22
      },
      [0, 255, 0]
    );
    return; // don't draw the real character in debug mode
  }

  if (isLeft && (isFalling || isPlummeting)) {
    // jumping left
    body(x, y);
    head(x, y, skintone, PI / 8);
    arms(x, y, -4, 3, 4);
    legs(x, y, -2, 6, 3);
  } else if (isRight && (isFalling || isPlummeting)) {
    // jumping right
    body(x, y);
    head(x, y, skintone, -PI / 8);
    arms(x, y, 4, 3, 4);
    legs(x, y, 2, 6, 3);
  } else if (isLeft) {
    // walking left
    body(x, y);
    head(x, y, skintone, PI / 10);
    arms(x, y, -4);
    legs(x, y, -1);
  } else if (isRight) {
    // walking right
    body(x, y);
    head(x, y, skintone, -PI / 10);
    arms(x, y, 4);
    legs(x, y, 1);
  } else if (isFalling || isPlummeting) {
    // jumping forward
    body(x, y);
    head(x, y, skintone);
    arms(x, y, 0, 3, 8);
    legs(x, y, 0, 6, 5);
  } else {
    // standing (forward)
    body(x, y);
    head(x, y, skintone);
    arms(x, y);
    legs(x, y);
  }
}

// ------------------------------
// Game UI render functions
// ------------------------------

// hearts are used to represent lives
function drawHeart (index) {
  const offset = index * 40;

  noStroke();
  fill(255, 0, 0);
  ellipse(offset + 30, 60, 15, 15);
  ellipse(offset + 40, 60, 15, 15);
  triangle(offset + 23, 63, offset + 47, 63, offset + 35, 75);
}

function drawScoreboard () {
  noStroke();
  textSize(36);
  fill(0);
  text(`SCORE: ${score}`, 20, 40);

  // I use a lot of lodash in my day-to-day work, so I miss the fact that
  // JavaScript doesn't have a native range() function.
  // This is the vanilla equivalent, generating an array between [0, lives)
  // (exclusive, hence the parens in the notation above)
  [...new Array(lives).keys()].forEach(drawHeart);
}

// draw an overlay in the middle of the screen, returning the x and y values
// we'll use to draw text inside of it
function drawOverlay (strokeColor, fillColor) {
  const x = world.width / 2 - overlayWidth / 2;
  const y = world.height / 2 - overlayHeight / 2;

  strokeWeight(4);
  stroke(...strokeColor);
  fill(...fillColor);
  rect(x, y, overlayWidth, overlayHeight);

  return { x, y };
}

// game over overlay
function drawGameOver () {
  const { x, y } = drawOverlay([161, 16, 0], [0, 0, 0]);

  noStroke();
  fill(255);
  textSize(100);
  text('GAME OVER', x + 20, y + 80);
  textSize(39);
  text('PRESS SPACE TO CONTINUE', x + 20, y + 126);
}

// level complete overlay
function drawLevelComplete () {
  const { x, y } = drawOverlay([197, 71, 255], [105, 2, 153]);

  noStroke();
  fill(255);
  textSize(65);
  text('LEVEL COMPLETE', x + 20, y + 65);
  textSize(39);
  text('PRESS SPACE TO CONTINUE', x + 20, y + 121);
}

// ---------------------
// Core game functions
// ---------------------

// preload the font and sounds, so they'll be available in the setup() function
// note: all of the following functions are used by p5js but not referenced in
// this file, so I've included the following eslint comments in front of them:
// eslint-disable-next-line no-unused-vars
function preload () {
  font = loadFont('VT323-Regular.ttf'); // '8-bit' font

  soundFormats('mp3', 'wav');
  sounds = {
    // played when collecting a coin
    coin: loadSound('sounds/coin.mp3'),
    // played when an agent hits another agent
    // (note: currently unused, as the only agent is the character)
    hits: [
      loadSound('sounds/hit1.mp3'),
      loadSound('sounds/hit2.mp3'),
      loadSound('sounds/hit3.mp3')
    ],
    // played when the character jumps
    jumps: [loadSound('sounds/jump1.mp3'), loadSound('sounds/jump2.mp3')],
    // played when plummeting off the screen
    lose: loadSound('sounds/lose.wav'),
    // played when the character runs
    run: loadSound('sounds/run.wav'),
    // played when the flag is found
    win: loadSound('sounds/win.wav')
  };

  // convenience methods to play random hits and jumps
  sounds.hit = () => random(sounds.hits);
  sounds.jump = () => random(sounds.jumps);
}

// create the canvas and initialize game objects
// eslint-disable-next-line no-unused-vars
function setup () {
  createCanvas(world.width, world.height);

  // load the font
  textFont(font);

  // initialize game objects
  initializeGame();

  // start the game!
  startGame();
}

// on every frame, draw the background, world objects, and character
// eslint-disable-next-line no-unused-vars
function draw () {
  drawBackground();

  push();
  translate(world.scroll, 0);

  // world objects are drawn between the push() and pop() functions so they'll scroll
  drawClouds();
  drawMountains();
  drawTrees();
  drawCanyons();
  drawCoins();
  drawFlagpole();

  pop();

  // character and scoreboard do not scroll with world objects
  drawCharacter();
  drawScoreboard();

  // handle player movement
  // this would be where we'd also handle other agent movement
  move(character);

  // check intersections
  checkintersections([character]); // agents would be added to this array

  // handle player death, level completion, and other game states
  handleConsequences();
}

// ---------------------
// Key control functions
// ---------------------

// eslint-disable-next-line no-unused-vars
function keyPressed () {
  // restart the game if space is pressed on either overlay
  if (keyCode === 32 && !isGameRunning) {
    lives = maxLives;
    startGame();
    return; // prevent the character from jumping when we restart the game
  }

  if (!isGameRunning) {
    return; // don't handle any other input
  }

  // 37 -> left arrow
  if (keyCode === 37) {
    character.isLeft = true;
  }

  // 39 -> right arrow
  if (keyCode === 39) {
    character.isRight = true;
  }

  // 32 -> space, 38 -> up arrow
  // character can only jump when they're on the ground!
  if ([32, 38].includes(keyCode) && character.y === world.floor) {
    jump(character);
    playSound('jump', 0.8);
  }

  // 16 -> shift
  // toggle debug mode on and off
  if (keyCode === 16) {
    debug = !debug;
  }
}

// eslint-disable-next-line no-unused-vars
function keyReleased () {
  if (!isGameRunning) {
    return; // don't handle any input
  }

  // 37 -> left arrow
  if (keyCode === 37) {
    character.isLeft = false;
  }

  // 39 -> right arrow
  if (keyCode === 39) {
    character.isRight = false;
  }
}

/**
 * CREDITS
 *
 * SOUND EFFECTS
 * Swiss Arcade Game Entertainment
 * sauer2
 *
 * ART AND PROGRAMMING
 * Nelson Pecora
 *
 * SPECIAL THANKS TO
 * Miyamoto Shigeru
 */
