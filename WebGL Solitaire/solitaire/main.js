import * as THREE from './three.module.js';
import HighScores from './highscores.js';
import GameUI from './gameUI.js';
import StartDialog from './startDialog.js';
import GameScreens from './gameScreens.js';
import AudioManager from './audioManager.js';

let scene, camera, renderer;
let selectedCard = null;
let selectedCards = []; // For moving multiple cards
let offset = new THREE.Vector3();
let planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const loader = new THREE.TextureLoader();
const tableauPiles = [];
const foundationPiles = [];
let stockBack = null;
let cardBackTexture = null;

const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = Array.from({ length: 13 }, (_, i) => ({
  rank: i + 1,
  label: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][i]
}));

let deck = [];
suits.forEach(suit => {
  ranks.forEach(({ rank, label }) => {
    deck.push({ name: `${label}_of_${suit}.png`, rank, suit });
  });
});

// Initialize piles
for (let i = 0; i < 7; i++) {
  tableauPiles.push({ x: -9 + i * 3, y: 2, cards: [] });
}

for (let i = 0; i < 4; i++) {
  foundationPiles.push({ x: 4 + i * 3, y: 6, cards: [], suit: null });
}

const stockPile = { x: -8, y: 6, cards: [] };
const wastePile = { x: -5, y: 6, cards: [] };

// Game state and animation system variables
let animationMixer;
const animations = [];
const ANIMATION_DURATION = 0.1; 

let gameUI;
let highScores;
let playerName;
let gameScreens;
let audioManager;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x003300);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 12;
  camera.position.y = 1;

  const canvas = document.getElementById("gameCanvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.AmbientLight(0xffffff));

  // Load card back texture first
  loader.load('cards/back.png', (texture) => {
    cardBackTexture = texture;
    dealInitialCards();
  });

  // Create foundation pile placeholders
  foundationPiles.forEach((pile) => {
    const geometry = new THREE.PlaneGeometry(2, 3);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x888888, 
      transparent: true, 
      opacity: 0.2 
    });
    const slot = new THREE.Mesh(geometry, material);
    slot.position.set(pile.x, pile.y, 0);
    slot.userData.isDropZone = true;
    slot.userData.foundationPile = pile;
    slot.name = 'foundation_zone';
    pile.zone = slot;
    scene.add(slot);
  });

  setupAnimations();

  // Create stock pile back
  const geometry = new THREE.PlaneGeometry(2, 3);
  const material = new THREE.MeshBasicMaterial({ map: cardBackTexture });
  stockBack = new THREE.Mesh(geometry, material);
  stockBack.position.set(stockPile.x, stockPile.y, 0);
  stockBack.name = 'stock_back';
  stockBack.userData.isAnimating = false;
  scene.add(stockBack);

  highScores = new HighScores();
  gameScreens = new GameScreens(
    () => {
      // Play Again
      location.reload();
    },
    () => {
      // Quit - close only the current tab
      window.location.href = "about:blank";
    }
  );
  
  // Show start dialog
  new StartDialog((name) => {
    playerName = name;
    gameUI = new GameUI(highScores);
    gameUI.startGame();
  });

  audioManager = new AudioManager();
  audioManager.initializeAudio();
}

function dealInitialCards() {
  deck = deck.sort(() => Math.random() - 0.5);
  let deckIndex = 0;

  // Deal to tableau piles
  for (let i = 0; i < 7; i++) {
    const pile = tableauPiles[i];
    for (let j = 0; j <= i; j++) {
      const cardInfo = deck[deckIndex++];
      const x = pile.x;
      const y = pile.y - j * 0.5;
      const z = 0.1 + (j * 0.01);

      createCard(cardInfo, x, y, z, pile, j < i);
    }
  }

  // Remaining cards go to stock pile
  for (; deckIndex < deck.length; deckIndex++) {
    stockPile.cards.push(deck[deckIndex]);
  }
}

function createCard(cardInfo, x, y, z, pile, faceDown = false) {
  const geometry = new THREE.PlaneGeometry(2, 3);
  const material = new THREE.MeshBasicMaterial({ 
    map: faceDown ? cardBackTexture : null
  });

  if (!faceDown) {
    loader.load(`cards/${cardInfo.name}`, (texture) => {
      material.map = texture;
      material.needsUpdate = true;
    });
  }

  const card = new THREE.Mesh(geometry, material);
  
  // Adjust Z position for foundation piles
  if (foundationPiles.includes(pile)) {
    z = 0.1 + (pile.cards.length * 0.01); // Increase Z for each card in foundation pile
  }
  
  card.position.set(x, y, z);
  card.userData = {
    rank: cardInfo.rank,
    suit: cardInfo.suit,
    name: cardInfo.name,
    color: ['hearts', 'diamonds'].includes(cardInfo.suit) ? 'red' : 'black',
    pile,
    faceDown,
    originalPosition: new THREE.Vector3(x, y, z),
  };
  pile.cards.push(card);
  scene.add(card);
  return card;
}

function isValidTableauMove(card, targetPile) {
  const topCard = targetPile.cards[targetPile.cards.length - 1];
  
  if (!topCard) {
    return card.userData.rank === 13; // Only King on empty tableau
  }

  if (topCard.userData.faceDown) return false;

  return (card.userData.color !== topCard.userData.color && 
          card.userData.rank === topCard.userData.rank - 1);
}

function isValidFoundationMove(card, targetPile) {
  // Can only move single cards to foundation
  if (selectedCards.length > 1) return false;

  const topCard = targetPile.cards[targetPile.cards.length - 1];
  
  if (!topCard) {
    // Empty foundation pile - only accept Ace
    if (card.userData.rank === 1) {
      targetPile.suit = card.userData.suit; // Set the suit when first ace is placed
      return true;
    }
    return false;
  }

  // Non-empty foundation pile - must match suit and be next rank
  return (card.userData.suit === targetPile.suit && 
          card.userData.rank === topCard.userData.rank + 1);
}

function moveCards(cards, targetPile) {
  const oldPile = cards[0].userData.pile;
  const startIndex = oldPile.cards.indexOf(cards[0]);
  
  // Remove cards from old pile
  oldPile.cards.splice(startIndex, cards.length);

  // Add to new pile
  cards.forEach((card, index) => {
    targetPile.cards.push(card);
    card.userData.pile = targetPile;
    
    // Update position based on pile type
    if (targetPile === wastePile) {
      // Waste pile - offset to the right
      const offset = (targetPile.cards.length - 1) * 0.3;
      card.position.set(
        wastePile.x + offset,
        wastePile.y,
        0.1 + ((targetPile.cards.length - 1) * 0.01)
      );
    } else if (foundationPiles.includes(targetPile)) {
      // Foundation pile - stack exactly on top with increasing Z
      card.position.set(
        targetPile.x,
        targetPile.y,
        0.1 + (targetPile.cards.length * 0.01)
      );
    } else {
      // Tableau pile - cascade down with proper z-indexing
      const totalIndex = targetPile.cards.length - cards.length + index;
      card.position.set(
        targetPile.x,                // X position stays constant
        targetPile.y - (totalIndex * 0.5), // Y position moves down consistently
        0.1 + (totalIndex * 0.01)        // Z increases with each card
      );
    }
    
    card.userData.originalPosition = card.position.clone();
  });

  // After moving cards, update the positions of all cards in the target tableau pile
  if (!foundationPiles.includes(targetPile) && targetPile !== wastePile) {
    updateTableauPilePositions(targetPile);
  }

  // Reveal top card of old pile if needed
  if (oldPile.cards.length > 0) {
    const topCard = oldPile.cards[oldPile.cards.length - 1];
    if (topCard.userData.faceDown) {
      flipCard(topCard);
    }
  }

  if (gameUI) gameUI.incrementMoves();

  // Play sound if moving to foundation pile
  if (foundationPiles.includes(targetPile)) {
    audioManager.playFoundationSound();
  }
}

// Handles repositioning of cards in tableau piles
function updateTableauPilePositions(pile) {
  pile.cards.forEach((card, index) => {
    card.position.set(
      pile.x,                // X position stays constant
      pile.y - (index * 0.5), // Y position cascades down
      0.1 + (index * 0.01)   // Z increases with each card
    );
    card.userData.originalPosition = card.position.clone();
  });
}

function flipCard(card) {
  card.userData.faceDown = false;
  loader.load(`cards/${deck.find(c => c.rank === card.userData.rank && c.suit === card.userData.suit).name}`, 
    (texture) => {
      card.material.map = texture;
      card.material.needsUpdate = true;
    }
  );
}

// Initializes the animation system
function setupAnimations() {
  animationMixer = new THREE.AnimationMixer(scene);
}

// Handles smooth card movement animations
function animateCardMovement(card, targetPosition, onComplete) {
  const startPosition = card.position.clone();
  const positionKF = new THREE.VectorKeyframeTrack(
    '.position',
    [0, ANIMATION_DURATION],
    [
      startPosition.x, startPosition.y, startPosition.z,
      targetPosition.x, targetPosition.y, targetPosition.z
    ]
  );

  const clip = new THREE.AnimationClip('move', ANIMATION_DURATION, [positionKF]);
  const action = animationMixer.clipAction(clip, card);
  action.clampWhenFinished = true;
  action.loop = THREE.LoopOnce;
  
  action.play();
  
  // Clean up animation when done and explicitly set final position
  setTimeout(() => {
    action.stop();
    animationMixer.uncacheClip(clip);
    // Explicitly set the final position
    card.position.copy(targetPosition);
    card.userData.originalPosition.copy(targetPosition);
    if (onComplete) onComplete();
  }, ANIMATION_DURATION * 1000);
}

// Handles card flip animations with texture updates
function animateCardFlip(card, onComplete) {
  const startRotation = card.rotation.y;
  const rotationKF = new THREE.NumberKeyframeTrack(
    '.rotation[y]',
    [0, ANIMATION_DURATION/2, ANIMATION_DURATION],
    [startRotation, Math.PI/2, Math.PI]
  );

  const clip = new THREE.AnimationClip('flip', ANIMATION_DURATION, [rotationKF]);
  const action = animationMixer.clipAction(clip, card);
  action.clampWhenFinished = true;
  action.loop = THREE.LoopOnce;
  
  // At halfway point, change the texture
  setTimeout(() => {
    card.material.map = cardBackTexture;
    card.material.needsUpdate = true;
  }, ANIMATION_DURATION * 500); // Half duration in milliseconds

  action.play();
  
  setTimeout(() => {
    action.stop();
    animationMixer.uncacheClip(clip);
    if (onComplete) onComplete();
  }, ANIMATION_DURATION * 1000);
}

// Modify the handleStockClick function
function handleStockClick() {
  if (stockPile.cards.length === 0) {
    stockBack.userData.isAnimating = true;
    
    const wasteCards = [...wastePile.cards].reverse();
    let currentIndex = 0;
    const totalCards = wasteCards.length;
    
    function recycleNextCard() {
      if (currentIndex >= totalCards) {
        // All cards have been recycled
        wastePile.cards = [];
        stockPile.cards = wasteCards.map(card => ({
          name: card.userData.name,
          rank: card.userData.rank,
          suit: card.userData.suit
        }));
        
        // Remove the animated cards from the scene
        wasteCards.forEach(card => {
          scene.remove(card);
        });
        
        stockBack.visible = true;
        stockBack.userData.isAnimating = false;
        return;
      }

      const card = wasteCards[currentIndex];
      const finalPosition = new THREE.Vector3(
        stockPile.x,
        stockPile.y,
        0.1 + (currentIndex * 0.01)
      );

      // Update the card's userData immediately
      card.userData.pile = stockPile;
      card.userData.originalPosition = finalPosition.clone();
      
      // Single combined animation for movement and flip
      const startPosition = card.position.clone();
      const positionTrack = new THREE.VectorKeyframeTrack(
        '.position',
        [0, ANIMATION_DURATION],
        [
          startPosition.x, startPosition.y, startPosition.z,
          finalPosition.x, finalPosition.y, finalPosition.z
        ]
      );

      const rotationTrack = new THREE.NumberKeyframeTrack(
        '.rotation[y]',
        [0, ANIMATION_DURATION],
        [0, Math.PI]
      );

      const clip = new THREE.AnimationClip('recycleMove', ANIMATION_DURATION, [positionTrack, rotationTrack]);
      const action = animationMixer.clipAction(clip, card);
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;

      // Change texture halfway through
      setTimeout(() => {
        card.material.map = cardBackTexture;
        card.material.needsUpdate = true;
      }, ANIMATION_DURATION * 500);

      action.play();

      // Ensure final position and cleanup
      setTimeout(() => {
        action.stop();
        animationMixer.uncacheClip(clip);
        card.position.copy(finalPosition);
        currentIndex++;
        if (currentIndex < totalCards) {
          setTimeout(recycleNextCard, 0);
        } else {
          // After all cards are recycled, store their info and clean up
          stockPile.cards = wasteCards.map(card => ({
            name: card.userData.name,
            rank: card.userData.rank,
            suit: card.userData.suit
          }));
          wastePile.cards = [];
          wasteCards.forEach(card => scene.remove(card));
          stockBack.visible = true;
          stockBack.userData.isAnimating = false;
        }
      }, ANIMATION_DURATION * 1000);
    }

    // Start the recycling process
    if (wasteCards.length > 0) {
      recycleNextCard();
    } else {
      // Reset if waste pile is empty
      stockBack.userData.isAnimating = false;
      stockBack.visible = false;
    }
    
    return;
  }

  // Prevent clicking if animation is in progress
  if (stockBack.userData.isAnimating) {
    return;
  }

  const cardInfo = stockPile.cards.pop();
  if (cardInfo) {
    // Load the texture first
    loader.load(`cards/${cardInfo.name}`, (texture) => {
      const offset = wastePile.cards.length * 0.3;
      const finalPosition = new THREE.Vector3(
        wastePile.x + offset,
        wastePile.y,
        0.1 + (wastePile.cards.length * 0.01)
      );
      
      // Create the card material with the loaded texture
      const geometry = new THREE.PlaneGeometry(2, 3);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        side: THREE.DoubleSide
      });
      
      // Create the card mesh at the stock pile position
      const card = new THREE.Mesh(geometry, material);
      card.position.set(stockPile.x, stockPile.y, 0.1);
      
      // Set up card data
      card.userData = {
        rank: cardInfo.rank,
        suit: cardInfo.suit,
        name: cardInfo.name,
        color: ['hearts', 'diamonds'].includes(cardInfo.suit) ? 'red' : 'black',
        pile: wastePile,
        faceDown: false,
        originalPosition: finalPosition.clone()
      };
      
      // Add to scene and waste pile
      scene.add(card);
      wastePile.cards.push(card);
      
      // Animate to final position
      animateCardMovement(card, finalPosition, () => {
        updateWastePilePositions();
      });
    });
  }

  stockBack.visible = stockPile.cards.length > 0;
}

// Maintains proper card positioning in the waste pile
function updateWastePilePositions() {
  wastePile.cards.forEach((card, index) => {
    const position = new THREE.Vector3(
      wastePile.x + (index * 0.3),
      wastePile.y,
      0.1 + (index * 0.01)
    );
    card.position.copy(position);
    card.userData.originalPosition.copy(position);
  });
}

function getCardsBelow(card) {
  const pile = card.userData.pile;
  const index = pile.cards.indexOf(card);
  
  // If card is from waste pile, only return that card
  if (pile === wastePile) {
    return [card];
  }
  
  // Otherwise return all cards below as before
  return pile.cards.slice(index);
}

// Event Listeners
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0 && intersects[0].object.name === 'stock_back' && !stockBack.userData.isAnimating) {
    handleStockClick();
  }
});

window.addEventListener('mousedown', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj.userData.isDropZone || obj.name === 'stock_back' || obj.userData.faceDown) return;

    const pile = obj.userData.pile;
    
    // For waste pile, only allow selecting the top card (first position)
    if (pile === wastePile && obj !== pile.cards[pile.cards.length - 1]) {
      return;
    }

    selectedCard = obj;
    selectedCards = getCardsBelow(selectedCard);
    const intersectPoint = intersects[0].point;
    offset.copy(selectedCard.position).sub(intersectPoint);
  }
});

window.addEventListener('mousemove', (event) => {
  if (!selectedCard) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersectPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, intersectPoint);
  
  const basePosition = intersectPoint.clone().add(offset);
  selectedCards.forEach((card, index) => {
    card.position.copy(basePosition).add(new THREE.Vector3(
      0,                // No X offset
      -index * 0.5,    // Consistent Y spacing
      1.0 + (index * 0.01) // Higher Z while dragging, with consistent increment
    ));
  });
});

window.addEventListener('mouseup', () => {
  if (!selectedCard) return;

  // Get mouse position in 3D space
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  
  // Find the closest pile (including foundation piles) to the mouse position
  let closestPile = null;
  let minDist = Infinity;
  let isFoundation = false;

  // Check foundation piles
  for (const pile of foundationPiles) {
    const dist = Math.abs(selectedCard.position.x - pile.x) + 
                Math.abs(selectedCard.position.y - pile.y);
    if (dist < minDist) {
      // Only consider this pile if it's close enough
      if (dist < 3) {
        minDist = dist;
        closestPile = pile;
        isFoundation = true;
      }
    }
  }

  // Check tableau piles if we haven't found a close foundation pile
  if (!isFoundation) {
    tableauPiles.forEach(pile => {
      const dist = Math.abs(selectedCard.position.x - pile.x);
      if (dist < minDist) {
        minDist = dist;
        closestPile = pile;
      }
    });
  }

  // Try to place the card(s)
  if (closestPile) {
    if (isFoundation) {
      // Foundation pile placement
      if (isValidFoundationMove(selectedCard, closestPile)) {
        moveCards([selectedCard], closestPile);
        if (checkWinCondition()) {
          showWinMessage();
        }
        selectedCard = null;
        selectedCards = [];
        return;
      }
    } else {
      // Tableau pile placement
      if (minDist < 2 && isValidTableauMove(selectedCard, closestPile)) {
        moveCards(selectedCards, closestPile);
        selectedCard = null;
        selectedCards = [];
        return;
      }
    }
  }

  // Invalid move, return cards to original position
  selectedCards.forEach(card => {
    if (card.userData.originalPosition) {
      card.position.copy(card.userData.originalPosition);
    }
  });
  
  selectedCard = null;
  selectedCards = [];
});

function checkWinCondition() {
  return foundationPiles.every(pile => pile.cards.length === 13);
}

function showWinMessage() {
  gameUI.stopTimer();
  const time = gameUI.getElapsedTime();
  const moves = gameUI.moveCount;
  
  audioManager.playWinMusic();
  
  const madeHighScores = highScores.addScore(playerName, time, moves);
  gameScreens.showWinScreen(playerName, time, moves, madeHighScores, highScores.getScores());
}

// Modify the animate function to update animations and background animation
function animate() {
  requestAnimationFrame(animate);
  
  // Update animations
  if (animationMixer) {
    animationMixer.update(1/60); // Assuming 60fps
  }
  
  renderer.render(scene, camera);
}

init();
animate();
