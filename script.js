const circles = document.querySelectorAll(".circle");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const roundDisplay = document.getElementById("round");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const livesDisplay = document.getElementById("lives");
const message = document.getElementById("message");

const quizModal = document.getElementById("quizModal");
const quizTitle = document.getElementById("quizTitle");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const nextChallengeBtn = document.getElementById("nextChallengeBtn");

const gameOverModal = document.getElementById("gameOverModal");
const gameOverText = document.getElementById("gameOverText");

let gamePattern = [];
let userPattern = [];
let round = 0;
let score = 0;
let lives = 3;
let bestScore = Number(localStorage.getItem("brainChallengeBestScore")) || 0;

let canClick = false;
let gameStarted = false;
let waitingForChallenge = false;

bestScoreDisplay.textContent = bestScore;

function updateUI() {
  roundDisplay.textContent = round;
  scoreDisplay.textContent = score;
  bestScoreDisplay.textContent = bestScore;
  livesDisplay.textContent = "❤".repeat(lives);
}

function setMessage(text) {
  message.textContent = text;
}

function disableCircles() {
  circles.forEach((circle) => circle.classList.add("disabled"));
}

function enableCircles() {
  circles.forEach((circle) => circle.classList.remove("disabled"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("brainChallengeBestScore", bestScore);
  }
  updateUI();
}

function getRandomCircle() {
  return Math.floor(Math.random() * circles.length);
}

function getUniquePatternStep() {
  let newStep = getRandomCircle();
  while (gamePattern.length > 0 && newStep === gamePattern[gamePattern.length - 1]) {
    newStep = getRandomCircle();
  }
  return newStep;
}

async function flashCircle(index) {
  const circle = circles[index];
  circle.classList.add("active");
  await sleep(500);
  circle.classList.remove("active");
  await sleep(180);
}

async function showPattern() {
  canClick = false;
  disableCircles();
  clearCircleStates();

  setMessage("Watch the pattern carefully...");
  await sleep(700);

  for (let i = 0; i < gamePattern.length; i++) {
    await flashCircle(gamePattern[i]);
  }

  setMessage("Now repeat the pattern.");
  enableCircles();
  canClick = true;
}

function clearCircleStates() {
  circles.forEach((circle) => {
    circle.classList.remove("active", "user-click", "wrong");
  });
}

function loseLife() {
  lives--;
  updateUI();

  if (lives <= 0) {
    endGame();
  }
}

function endGame() {
  canClick = false;
  gameStarted = false;
  waitingForChallenge = false;
  disableCircles();
  saveBestScore();
  gameOverText.textContent = `You reached Round ${round} with Score ${score}.`;
  gameOverModal.classList.remove("hidden");
}

function startGame() {
  gamePattern = [];
  userPattern = [];
  round = 0;
  score = 0;
  lives = 3;
  canClick = false;
  gameStarted = true;
  waitingForChallenge = false;

  clearCircleStates();
  updateUI();
  setMessage("Game started!");
  nextRound();
}

function restartGame() {
  gamePattern = [];
  userPattern = [];
  round = 0;
  score = 0;
  lives = 3;
  canClick = false;
  gameStarted = false;
  waitingForChallenge = false;

  clearCircleStates();
  enableCircles();
  updateUI();

  quizModal.classList.add("hidden");
  gameOverModal.classList.add("hidden");
  setMessage("Game reset. Press Start to play again.");
}

function nextRound() {
  if (!gameStarted) return;

  round++;
  userPattern = [];
  gamePattern.push(getUniquePatternStep());

  score += 10;
  updateUI();

  showPattern();
}

function shouldShowFixedBonusRound() {
  return round > 0 && round % 3 === 0;
}

function shouldShowRandomSurprise() {
  return round > 1 && Math.random() < 0.25;
}

function openQuizModal() {
  quizModal.classList.remove("hidden");
}

function closeQuizModal() {
  quizModal.classList.add("hidden");
}

function createOptionButton(text, isCorrect, rewardType) {
  const button = document.createElement("button");
  button.className = "option-btn";
  button.textContent = text;

  button.addEventListener("click", async () => {
    Array.from(quizOptions.children).forEach(btn => btn.disabled = true);

    if (isCorrect) {
      if (rewardType === "bonus") {
        score += 50;
        setMessage("Correct bonus answer! +50 points");
      } else {
        score += 30;
        setMessage("Correct surprise answer! +30 points");
      }
    } else {
      setMessage("Wrong answer! You lost 1 life.");
      loseLife();
      if (lives <= 0) {
        closeQuizModal();
        return;
      }
    }

    updateUI();
    nextChallengeBtn.classList.remove("hidden");
  });

  quizOptions.appendChild(button);
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function buildMathQuiz() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;

  quizTitle.textContent = "Bonus Math Quiz";
  quizQuestion.textContent = `What is ${num1} + ${num2}?`;
  quizOptions.innerHTML = "";
  nextChallengeBtn.classList.add("hidden");

  const options = shuffleArray([
    answer,
    answer + 1,
    answer - 1 >= 0 ? answer - 1 : answer + 2
  ]);

  options.forEach((option) => {
    createOptionButton(option, option === answer, "bonus");
  });
}

function buildPuzzleQuiz() {
  const start = Math.floor(Math.random() * 5) + 1;
  const answer = start + 8;

  quizTitle.textContent = "Surprise Puzzle";
  quizQuestion.textContent = `Find the missing number:\n${start}, ${start + 2}, ${start + 4}, ${start + 6}, ?`;
  quizOptions.innerHTML = "";
  nextChallengeBtn.classList.add("hidden");

  const options = shuffleArray([
    answer,
    answer + 2,
    answer - 2
  ]);

  options.forEach((option) => {
    createOptionButton(option, option === answer, "surprise");
  });
}

function launchChallenge(type) {
  canClick = false;
  disableCircles();
  waitingForChallenge = true;

  if (type === "bonus") {
    buildMathQuiz();
  } else {
    buildPuzzleQuiz();
  }

  openQuizModal();
}

async function handleAfterCorrectRound() {
  canClick = false;
  setMessage("Correct pattern!");

  await sleep(700);

  if (shouldShowFixedBonusRound()) {
    launchChallenge("bonus");
    return;
  }

  if (shouldShowRandomSurprise()) {
    launchChallenge("surprise");
    return;
  }

  nextRound();
}

async function handleUserClick(index) {
  if (!canClick || waitingForChallenge) return;

  userPattern.push(index);

  const clickedCircle = circles[index];
  clickedCircle.classList.add("user-click");

  setTimeout(() => {
    clickedCircle.classList.remove("user-click");
  }, 250);

  const currentStep = userPattern.length - 1;

  if (userPattern[currentStep] !== gamePattern[currentStep]) {
    canClick = false;
    clickedCircle.classList.add("wrong");
    setMessage("Wrong pattern! You lost 1 life.");
    loseLife();

    if (lives > 0) {
      await sleep(1200);
      clearCircleStates();
      userPattern = [];
      showPattern();
    }
    return;
  }

  if (userPattern.length === gamePattern.length) {
    await handleAfterCorrectRound();
  }
}

circles.forEach((circle) => {
  circle.addEventListener("click", () => {
    const index = Number(circle.dataset.index);
    handleUserClick(index);
  });
});

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    startGame();
  } else {
    setMessage("Game is already running. Finish this round or restart.");
  }
});

restartBtn.addEventListener("click", restartGame);
playAgainBtn.addEventListener("click", () => {
  gameOverModal.classList.add("hidden");
  startGame();
});

nextChallengeBtn.addEventListener("click", () => {
  closeQuizModal();
  waitingForChallenge = false;

  if (gameStarted && lives > 0) {
    nextRound();
  }
});

disableCircles();
updateUI();