// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { runTransaction, getFirestore, collection, onSnapshot, getDocs, addDoc, doc, setDoc, getDoc, deleteDoc, updateDoc  } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnwQTaYuPYiB-k42IEe6QOJbssQGPHuvE",
  authDomain: "cards-d9c93.firebaseapp.com",
  projectId: "cards-d9c93",
  storageBucket: "cards-d9c93.firebasestorage.app",
  messagingSenderId: "84094276783",
  appId: "1:84094276783:web:802a618665d57d9553f05a",
  measurementId: "G-B2B8HEWGRD"
};

console.log("authentication expires 12/31/2025 -- go to firestore database -> rules to change");

var qinit = false;
var ainit = false;
var round_going = false;
var played = false;
var myName = "";
let myanswers = [];
let i_played = false;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized!");

// Firestore collection reference
const cardsCollection = collection(db, "cards");
const playersCollection = collection(db, "players");
const globalRef = doc(db, "globalVars", "czar"); // Reference to a document for global variables
const Aref = doc(db, "globalVars", "Answers");
const ansref = doc(db, "globalVars", "bestans");

/**
 * Sets the "answer" field in the "bestans" document.
 * @param {int} player - The answer to set.
 */
async function setBestAnswer(player) {
  try {
    await updateDoc(ansref, { player: player });
    console.log(`Best answer set to: ${player}`);
  } catch (error) {
    console.error("Error setting best answer:", error);
  }
}

/**
 * Retrieves the "answer" field from the "bestans" document.
 * @returns {Promise<string|null>} - The answer or null if not found.
 */
async function getBestAnswer() {
  try {
    const docSnap = await getDoc(ansref);
    if (docSnap.exists()) {
      return docSnap.data().player;
    } else {
      console.log("No such document!");
      return -1;
    }
  } catch (error) {
    console.error("Error getting best answer:", error);
    return -1;
  }
}

function listenForBestAnswer() {
  return onSnapshot(ansref, (docSnap) => {
    if (docSnap.exists()) {
      const newAnswer = docSnap.data().player;
      if (newAnswer == -1){
        return;
      }
      console.log("Best player updated:", newAnswer);
      document.getElementById("boardans" + newAnswer).classList.add("selected2");
      add_to_player_score(newAnswer);
        const topheader = document.getElementById("selectheader");
      topheader.textContent = players[newAnswer] + " wins the round."
    } else {
      console.log("Document does not exist!");
    }
  }, (error) => {
    console.error("Error listening for best answer updates:", error);
  });
}

function setGlobalVariable(field, value) {
  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(globalRef);
    if (!docSnap.exists()) {
      throw new Error("Document does not exist!");
    }

    // Update the field in the document
    transaction.update(globalRef, {
      [field]: value
    });
  }).then(() => {
    console.log(`Global variable ${field} updated safely to ${value}`);
  }).catch((error) => {
    console.error("Error in transaction: ", error);
  });
}



function setAnswer(idx, ans){
  let s = idx.toString();
  let str = "answer" + s;
  updateDoc(Aref, { [str]: ans})
    .then(() => {
      console.log(`answer${idx} set to ${ans}`);
    })
    .catch((error) => {
      console.error("error setting answer");
    });
  
}

function listenForCzarUpdate() {
  onSnapshot(globalRef, (docSnap) => {
      console.log("czar update snapshot triggered");
      if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.who !== undefined && data.who !== -1 && myName) {
              console.log("Czar updated:", data.who);
              updateCzarUI(data.who);
          }
      }
  });
}

function listenForAnsUpdate(){
  onSnapshot(Aref, (docSnap) => {
    console.log(`ans update triggered, round_going = ${round_going}`);
    if (!round_going || clearing){
      return;
    }
    let numplayed = 0;
    if(docSnap.exists()){
      const data = docSnap.data();
      const answerboard = document.getElementById("answerboard");
      answerboard.innerHTML = "";
      for(let i = 0; i < num_p; i++){
        let ansname = "answer" + i;
        console.log(`${ansname}: ${data[ansname].slice(0,-1)}`);
        
        if (data[ansname] != ""){
          let listitem = document.createElement("li");
          numplayed++;
          if (i == myidx){
            listitem.textContent = data[ansname].slice(0,-1);
          } else {
            listitem.textContent = "";
          }
          answerboard.appendChild(listitem);
          console.log("clearing status for idx:", i);
          document.getElementById("index" + i + status_id).textContent = "";
        }
      }
      if (numplayed >= num_p-1){
        console.log("clearing answer board");
        answerboard.innerHTML = "";
        start_czar();
      }
      console.log(`numplayed: ${numplayed}`);
    }
  });
}
var clearing = true;
listenForCzarUpdate();
clear();
listenForAnsUpdate();
listenForBestAnswer();
clearing = false;

function clear(){
  clearing = true;
  for(let i = 0; i < 8; i++){
    setAnswer(i, "");
  }
  console.log("clearing answer board");
  const board = document.getElementById("answerboard").innerHTML = "";
  setBestAnswer(-1);
  clearing = false;
}


async function updateCzarUI(czar) {
  console.log("updating czar UI");
  if (rounds > 0){
    console.log("delaying");
    await delay(5000);
  }
  round_going = false;
  clear();
  const czarstatus = document.getElementById("index" + czar + status_id);
  const listItems = document.querySelectorAll('#statuslist li');
  console.log("setting status to playing");
  listItems.forEach(item => {
    item.textContent = "Playing";
  });
  console.log("setting status to card czar");
  czarstatus.textContent = "Card Czar";

  const qlist = document.getElementById("cuhdeyboahd");
  const topheader = document.getElementById("selectheader");
  const czarblock = document.getElementById("czarblock");
  if (czar == myidx){
    topheader.textContent = "You are the Card Czar."
    let li = document.createElement("li");
    li.textContent = "You are the Card Czar."
    czarblock.appendChild(li);
  } else {
    topheader.textContent = "Select a Card to Play."
    czarblock.innerHTML = "";
  }
  document.getElementById("GAME").style.display = "block";
  document.getElementById("gameScreen").style.display = "none";
  console.log(`starting round ${rounds}`);
  if(myczar != myidx && rounds > 0){
    get_new_answer();
  }

  myczar = czar;
  let question = document.createElement("li");
  console.log(`myczar: ${myczar}`);
  let index = Math.floor(rounds/num_p)*num_p + czar;
  rounds++;
  console.log(`index of question selected: ${index}`);
  let q = questions_list[index];
  console.log(`question selected ${q}`);
  qlist.innerHTML = "";
  question.textContent = q;
  qlist.appendChild(question);
  played = false;
  await delay(400);
  round_going = true;
}

// This function will handle updating the questions and answers
function handleSnapshot(querySnapshot) {
  console.log("Snapshot received!");

  // Update questions and answers
  if (qinit) {
    show_questions(querySnapshot);
  }
  if (ainit) {
    show_answers(querySnapshot);
  }
}

// Start listening for real-time updates
onSnapshot(cardsCollection, handleSnapshot, (error) => {
  console.error("Error fetching data: ", error); // Log any errors from onSnapshot
});

// Function to display questions
function show_questions(querySnapshot) {
  const questionList = document.getElementById("question");
  questionList.innerHTML = ""; // Clear existing questions

  let questions = [];

  // Ensure querySnapshot has docs and is valid
  if (querySnapshot && querySnapshot.docs) {
    querySnapshot.docs.forEach((doc) => { // Access docs array
      const q = doc.data().query;
      if (doc.data().type == 0) { // type == 0 for questions
        questions.push(q);
      }
    });

    questions.forEach(question => {
      const listItem = document.createElement("li");
      listItem.textContent = question;
      questionList.appendChild(listItem);
    });

    console.log("Questions updated from Firebase.");
  } else {
    console.error("QuerySnapshot is empty or not valid.");
  }
}

// Function to display answers
function show_answers(querySnapshot) {
  const answerList = document.getElementById("answers");
  answerList.innerHTML = ""; // Clear existing answers
  let answers = [];

  // Ensure querySnapshot has docs and is valid
  if (querySnapshot && querySnapshot.docs) {
    querySnapshot.docs.forEach((doc) => { // Access docs array
      const q = doc.data().query;
      if (doc.data().type == 1) { // type == 1 for answers
        answers.push(q);
      }
    });

    answers.forEach(answer => {
      const listItem = document.createElement("li");
      listItem.textContent = answer;
      answerList.appendChild(listItem);
    });

    console.log("Answers updated from Firebase.");
  } else {
    console.error("QuerySnapshot is empty or not valid.");
  }
}

let set = false;

function show_players(snapshot) {
  const playersList = document.getElementById("playersList");

  // Clear the existing list before rendering new players
  playersList.innerHTML = "";

  let num_players = 0;
  let num_ready = 0;

  snapshot.forEach((doc) => {
    const player = doc.data();  // Get the player data from Firestore
    const playerName = player.name;
    const playerStatus = player.status;
    

    // Display each player in the list
    if (playerName) {
      console.log(`Displaying box for player: ${playerName}`);

      // Check if the player already exists in the list
      let listItem = document.getElementById(playerName);

      // If the player does not exist, create a new list item
      if (!listItem) {
        listItem = document.createElement("li");
        listItem.id = playerName; // Assigning the player's name as ID to identify the player
        listItem.textContent = playerName;
        playersList.appendChild(listItem);
      }
      num_players = num_players + 1;

      // Change the player's name box color based on their status
      if (playerStatus === "ready") {
        num_ready = num_ready + 1;
        listItem.style.backgroundColor = "green"; // Turn the name box green if the player is ready
      } else {
        listItem.style.backgroundColor = "white"; // Default color (not ready)
      }
    }
    console.log(`Num_players: ${num_players}, num_ready: ${num_ready}`);
  });
  if(num_players == 1 && myName && !set){
    setGlobalVariable("who", -1); // only gets set by the first person
    set = true;
  }
  if (num_players == num_ready && num_ready > 0){
    start_game(snapshot);
  }
}


// Handle "Show Questions" button click
document.getElementById("displayQuestions").addEventListener("click", async () => {
  console.log("Button Clicked!");
  const querySnapshot = await getDocs(cardsCollection);  // Fetch data once when clicked
  qinit = true;
  show_questions(querySnapshot);  // Pass the fetched snapshot to the function
  document.getElementById("displayQuestions").style.display = 'none';
});

// Handle "Show Answers" button click
document.getElementById("displayAnswers").addEventListener("click", async () => {
  console.log("Button Clicked!");
  const querySnapshot = await getDocs(cardsCollection);  // Fetch data once when clicked
  ainit = true;
  show_answers(querySnapshot);  // Pass the fetched snapshot to the function
  document.getElementById("displayAnswers").style.display = 'none';
});

// Handle nickname submission
// Handle "Start Game" button click
document.getElementById("startButton").addEventListener("click", async () => {
  const playerName = document.getElementById("nicknameInput").value;
  
  if (!playerName.trim()) {
      alert("Please enter a nickname to start the game.");
      return;
  }

  myName = playerName;

  try {
      // Add the player to Firestore
      const playerRef = doc(collection(db, "players"), playerName); // Using name as the unique player ID
      addPlayer(playerName);

      console.log("Player added to Firestore:", playerName);

      // Proceed with game setup (e.g., show the game screen)
      document.getElementById("startScreen").style.display = "none"; // Hide start screen
      document.getElementById("GAME").style.display = "none";
      document.getElementById("gameScreen").style.display = "block"; // Show game screen
      const snapshot = await getDocs(playersCollection);  // Fetch data once when clicked
  } catch (error) {
      console.error("Error starting game: ", error);
  }
});


// Listen for player updates in real-time
// Listen for players and create their name boxes with a "Ready" button
// Assuming you have a way to identify the current player, 
// you can get their information (e.g., playerName) from sessionStorage, Firestore, etc.

document.getElementById("readyButton").addEventListener("click", async () => {
  if (!myName) {
    console.log("Player name not found!");
    return;
  }

  try {
    // Get the player document to check its current state
    const playerRef = doc(db, "players", myName);
    const playerSnapshot = await getDoc(playerRef);

    if (!playerSnapshot.exists()) {
      console.log("Player not found in Firestore.");
      return;
    }

    // Check the current status before updating
    const playerData = playerSnapshot.data();
    const currentStatus = playerData.status;

    // If already ready, show a message and stop further actions
    if (currentStatus === "ready") {
      console.log("You are already ready!");
      return;
    }

    // Update the player's status to "ready" in Firestore
    await setDoc(playerRef, { status: "ready" }, { merge: true });

    console.log(`${myName} is now ready!`);

    const readyButton = document.getElementById("readyButton");
    readyButton.innerText = "Waiting for others...";
    readyButton.style.opacity = 0.5;  // Make the button fade
    readyButton.disabled = true;  // Optionally, disable the button

    // Update the UI (like showing the green box)
    const snapshot = await getDocs(playersCollection);  // Fetch all players once again to update
    show_players(snapshot);  // Call the function to update the UI with the new status

  } catch (error) {
    console.error("Error updating player status: ", error);
  }
});

setTimeout(() => {
  console.log("This runs after 3 seconds");
}, 6000); // 3000 milliseconds = 3 seconds

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById("confirmButton").addEventListener("click", async () => {
  played = true;
  const confirmButton = document.getElementById("confirmButton");
  confirmButton.innerText = "Confirm Selection";
  confirmButton.style.opacity = 0.5;  // Make the button fade
  confirmButton.disabled = true;  // Optionally, disable the button
  let q = "";
  
  if(myidx != myczar){
    const answer = document.getElementById("myAnswers");
    document.querySelectorAll(".selected").forEach(item => {
      q = item.textContent;
      answer.removeChild(item);
      console.log(`card containing question ${q} removed`);
    });
    setAnswer(myidx, q + myidx);
    const topheader = document.getElementById("selectheader");
    topheader.textContent = "Waiting for players...";
  } else {
    console.log("czar has confirmed an answer");
    const selectedItems = document.querySelectorAll(".selected2");

    for (const item of selectedItems) {  // Using for...of instead of forEach
      console.log(`answer id: ${item.id}`);
      let num = Number((item.id).slice(8)); // Extracts substring from index 8
      console.log(`num selected: ${num}`);
      setBestAnswer(num);
      let nextczar = (myczar + 1) % num_p;
      setGlobalVariable("who", nextczar);
      round_going = true;
    }

  }
});






// Listen for player updates in real-time and update UI
onSnapshot(playersCollection, (snapshot) => {
  console.log("snapshot triggered");
  show_players(snapshot);
  console.log("Player list updated.");
});

document.getElementById("submitQuery").addEventListener("click", async (event) => {
  event.preventDefault(); // Prevent page refresh

  // Get values from input
  const entryText = document.getElementById("queryInput").value;
  const entryType = document.getElementById("entryType").value; // 0 = Question, 1 = Answer
  const t = parseInt(entryType);

  if (entryText.trim() === "") {
      alert("Please enter a question or answer.");
      return;
  }

  try {
      // Add to Firestore
      if (t == 0 && !qinit){
        qinit = true;
        document.getElementById("displayQuestions").style.display = 'none';
      } else if (t == 1 && !ainit){
        ainit = true;
        document.getElementById("displayAnswers").style.display = 'none';
      }
      await addDoc(collection(db, "cards"), {
          query: entryText,
          type: t
      });

      console.log("Entry added!");
      //alert("Entry successfully added!");

      // Clear form
      document.getElementById("queryInput").value = "";

  } catch (error) {
      console.error("Error adding entry: ", error);
  }
});

const auth = getAuth(app);

// // Handling user sign-in and sign-out
window.addEventListener('beforeunload', async (event) => {
  event.preventDefault();  // For Chrome

  // Get current user
  const user = auth.currentUser;
  const playerId = user ? user.uid : "unique_player_id"; // Use unique ID if no user is logged in
  const playerRef = doc(db, "players", myName);

  // Remove player from Firestore
  deleteDoc(playerRef);

  console.log("Player removed from Firestore");

});

// Add player to Firestore
async function addPlayer(name) {
  try {
    // Use the player's name directly as the document ID
    const playerRef = doc(db, "players", name);  // Document path is "players/{name}"
    await setDoc(playerRef, {
      name: name,   // Store player's name
      status: "active", // Initial status could be "active"
    });

    console.log("Player added to Firestore!");
  } catch (error) {
    console.error("Error adding player: ", error);
  }
}

let players = [];
let scores = [];
let questions_list = [];
let answers_list = [];
let num_p = 0;
let num_q = 0;
let num_a = 0;
let rounds = 0;
const name_id = ",.<>_";
const score_id = ":;{{_";
const status_id = "~__(&";
let myidx = -1;
let myczar = -1;

let cardsused = 0;

async function start_game(snapshot){
  // If you know the value won't change during the transaction
  if(myidx != -1){
    return;
  }
  //sometimes this function fires twice
  console.log("opening start game function");
  document.getElementById("gameScreen").style.display = "none"; // hide game screen
  const querySnapshot = await getDocs(cardsCollection);
  
  if (!myName || myName.trim() === ""){
    document.getElementById("startScreen").style.display = "none"; // Hide start screen
    document.getElementById("blank").style.display = "block";
    return;
  } else {
    document.getElementById("GAME").style.display = "block";
  }

  const playersList2 = document.getElementById("playersList2");
  const scorelist = document.getElementById("scorelist");
  const statuslist = document.getElementById("statuslist");
  playersList2.innerHTML = "";
  scorelist.innerHTML = "";
  statuslist.innerHTML = "";
  var idx = 0;
  num_p = 0;
  players = [];
  scores = [];
  questions_list = [];
  answers_list = [];
  num_p = 0;
  num_q = 0;
  snapshot.forEach((doc) => {
    const player = doc.data();  // Get the player data from Firestore
    const playerName = player.name;
    
    // Display each player in the list
    if (playerName) {
      num_p += 1;
      console.log("adding", playerName, "to list");
      players.push(playerName);
      scores.push(0);
      let listItem = document.createElement("li");
      listItem.id = "index" + idx + name_id; // Assigning the player's name as ID to identify the player
      listItem.textContent = playerName;
      playersList2.appendChild(listItem);
      let scoreItem = document.createElement("li");
      scoreItem.id = "index" + idx + score_id;
      scoreItem.textContent = 0;
      scorelist.appendChild(scoreItem);
      let statusItem = document.createElement("li");
      statusItem.id = "index" + idx + status_id;
      statusItem.textContent = "";
      statuslist.appendChild(statusItem);
      if (playerName == myName) {
        myidx = idx;
      }
      idx+=1;
    }
    const confirmButton = document.getElementById("confirmButton");
    confirmButton.innerText = "Confirm Selection";
    confirmButton.style.opacity = 0.5;  // Make the button fade
    confirmButton.disabled = true;  // Optionally, disable the button
  });

  querySnapshot.forEach((doc) => {
    const card = doc.data();  // Get the player data from Firestore
    const q = card.query;
    const t = card.type;
      
      // Display each player in the list
    if (q) {
      console.log("adding", q, "to list");
      if (t == 0){
        questions_list.push(q);
        num_q += 1;
      } else if (t == 1){
        answers_list.push(q);
        num_a += 1;
      }
    }
  });
  console.log("num_p: ", num_p);
  console.log(`myidx: ${myidx}`);
  let czar = Math.floor(Math.random() * num_p);
  if(myidx == 0){
    console.log("Setting czar:", czar);
    setGlobalVariable("who", czar);
  }
  for(let i = 0; i < 10 && i < num_a; i++){
    let index = i*num_p + myidx;
    if(index >= num_a){
      break;
    }
    cardsused++;
    myanswers.push(index);
  }
  display_my_answers();
}

function display_my_answers(){
  const myA = document.getElementById("myAnswers");
  for(let i = 0; i < myanswers.length; i++){
    let listitem = document.createElement("li");
    listitem.id = "myanswer" + i;
    listitem.textContent = answers_list[myanswers[i]];
    listitem.classList.add("selectable");
    myA.appendChild(listitem);
  }
  document.querySelectorAll(".selectable").forEach(item => {
    item.addEventListener("click", function() {
      console.log("answer clicked");
      // Remove 'selected' class from all items
      if(myidx == myczar || played){
        return;
      }
      console.log("new answer selected");
      document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
      const confirmButton = document.getElementById("confirmButton");
      confirmButton.innerText = "Confirm Selection";
      confirmButton.style.opacity = 1;  // Make the button fade
      confirmButton.disabled = false;  // Optionally, disable the button
      
      // Add 'selected' class to the clicked item
      this.classList.add("selected");
    });
  });
  round_going = true;
}

function get_new_answer(){
  let index = cardsused*num_p + myidx;
  if(index >= num_a){
    return;
  }
  const myanswers = document.getElementById("myAnswers");
  let listitem = document.createElement("li");
  listitem.id = "myanswer" + cardsused;
  listitem.textContent = answers_list[index];
  listitem.classList.add("selectable");
  myanswers.appendChild(listitem);
  listitem.addEventListener("click", function() {
    console.log("brand new answer clicked");
    document.querySelectorAll(".selectable").forEach(el => el.classList.remove("selected"));
    const confirmButton = document.getElementById("confirmButton");
    confirmButton.innerText = "Confirm Selection";
    confirmButton.style.opacity = 1;  // Make the button fade
    confirmButton.disabled = false;  // Optionally, disable the button
    
    // Add 'selected' class to the clicked item
    this.classList.add("selected");
  });
  cardsused++;
}
// function start_round(){

// }

async function start_czar() {
  i_played = false;
  round_going = false;
  console.log("czar actions starting");
  display_board_answers();
}

function add_to_player_score(idx){
  console.log(`adding 1 to ${idx}'s score`);
  let playerName = players[idx];
  scores[idx] = scores[idx] + 1;
  let id = "index" + idx + score_id;
  let p = document.getElementById(id);

  if(p){
    let str = p.textContent;
    let num = +str;
    num += 1;
    p.textContent = num;
    console.log(`${idx}'s score updated to ${num}`);
  }
}

async function getAnswer(idx) {
  try {
    const docSnap = await getDoc(Aref); // Get the document snapshot
    if (docSnap.exists()) {
      let s = idx.toString();
      let str = "answer" + s;
      let ans = docSnap.data()[str]; // Dynamically access the field
      console.log(`answer${idx}: ${ans}`);
      return ans; // Return the answer if needed
    } else {
      console.log("Document does not exist.");
      return null;
    }
  } catch (error) {
    console.error("Error getting answer:", error);
    return null;
  }
}

async function display_board_answers(){
  const topheader = document.getElementById("selectheader");
  if(myidx == myczar){
    topheader.textContent = "Select a winning card.";
  } else {
    topheader.textContent = "Waiting for players...";
  }
  const answerboard = document.getElementById("answerboard");
  let answers = [];
  for(let i = 0; i < num_p; i++){
    if(i == myczar){
      continue;
    }
    
    // let listitem = document.createElement("li");
    // listitem.id = "boardans" + i;
    let ans = await(getAnswer(i));
    answers.push(ans);
    // listitem.textContent = ans;
    // if(myidx == myczar){
    //   listitem.classList.add("selectable2");
    // }
    // answerboard.appendChild(listitem);
  }
  answers = deterministicShuffle(answers, myczar*1983 % 67);
  answers.forEach(str => {
    console.log("string selected:", str);
    let newStr = str.slice(0, -1);
    console.log("new string:", newStr);
    let idx = str.slice(-1);
    let listitem = document.createElement("li");
    listitem.id = "boardans" + idx;
    listitem.textContent = newStr;
    if(myidx == myczar){
      listitem.classList.add("selectable2");
    }
    console.log("adding answer to answerboard");
    answerboard.appendChild(listitem);
  });
  document.querySelectorAll(".selectable2").forEach(item => {
    item.addEventListener("click", function() {
      // Remove 'selected' class from all items
      if(myidx != myczar){
        return;
      }
      console.log("new answer selected");
      document.querySelectorAll(".selectable2").forEach(el => el.classList.remove("selected2"));
      const confirmButton = document.getElementById("confirmButton");
      confirmButton.innerText = "Confirm Selection";
      confirmButton.style.opacity = 1;  // Make the button fade
      confirmButton.disabled = false;  // Optionally, disable the button
      
      // Add 'selected' class to the clicked item
      this.classList.add("selected2");
    });
  });
}

function deterministicShuffle(array, seed) {
  return array
      .map((item) => ({ item, hash: hashFunction(item, seed) }))
      .sort((a, b) => a.hash - b.hash)
      .map(({ item }) => item);
}

function hashFunction(str, seed) {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 1000000007;
  }
  return hash;
}

