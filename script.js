const todoList = document.getElementById("todoList");
const newTodo = document.getElementById("newTodo");
const addTodo = document.getElementById("addTodo");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const streakText = document.getElementById("streakText");

const reflectionModal = document.getElementById("reflectionModal");
const openReflection = document.getElementById("openReflection");
const cancelReflection = document.getElementById("cancelReflection");
const saveReflection = document.getElementById("saveReflection");
const reflectionInput = document.getElementById("reflectionInput");
const resetDay = document.getElementById("resetDay");

const timerDisplay = document.getElementById("timer");
const startStop = document.getElementById("startStop");
const resetTimer = document.getElementById("resetTimer");
const toggleMode = document.getElementById("toggleMode");
const modeText = document.getElementById("modeText");

let focusTime = 25, breakTime = 5;
let isFocus = true;
let running = false;
let secondsLeft = focusTime * 60;
let timerInterval = null;

function todayKey() {
  return new Date().toISOString().slice(0,10);
}

// Local storage
let todos = JSON.parse(localStorage.getItem("df_todos") || "{}");
let reflections = JSON.parse(localStorage.getItem("df_reflections") || "{}");

// ---------- TO-DO ----------
function renderTodos() {
  const list = todos[todayKey()] || [];
  todoList.innerHTML = "";
  list.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = item.done ? "done" : "";
    const span = document.createElement("span");
    span.textContent = item.text;
    span.onclick = () => toggleDone(i);
    const del = document.createElement("button");
    del.textContent = "Hapus";
    del.onclick = () => deleteTodo(i);
    li.append(span, del);
    todoList.append(li);
  });
  updateProgress();
}

function addTodoItem() {
  const text = newTodo.value.trim();
  if (!text) return;
  const key = todayKey();
  todos[key] = todos[key] || [];
  todos[key].push({ text, done: false });
  localStorage.setItem("df_todos", JSON.stringify(todos));
  newTodo.value = "";
  renderTodos();
}

function toggleDone(i) {
  const key = todayKey();
  todos[key][i].done = !todos[key][i].done;
  localStorage.setItem("df_todos", JSON.stringify(todos));
  renderTodos();
}

function deleteTodo(i) {
  const key = todayKey();
  todos[key].splice(i, 1);
  localStorage.setItem("df_todos", JSON.stringify(todos));
  renderTodos();
}

function updateProgress() {
  const key = todayKey();
  const list = todos[key] || [];
  if (list.length === 0) {
    progressBar.style.width = "0%";
    progressText.textContent = "Belum ada tugas.";
    streakText.textContent = `Streak: ${calcStreak()} hari`;
    return;
  }
  const done = list.filter(t => t.done).length;
  const percent = Math.round((done / list.length) * 100);
  progressBar.style.width = percent + "%";
  progressText.textContent = `${percent}% selesai`;
  streakText.textContent = `Streak: ${calcStreak()} hari`;
}

function calcStreak() {
  let s = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0,10);
    const hasRef = Boolean(reflections[key]);
    const hasTodoDone = (todos[key] || []).some(t => t.done);
    if (hasRef || hasTodoDone) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}

addTodo.onclick = addTodoItem;
renderTodos();

// ---------- REFLEKSI ----------
openReflection.onclick = () => reflectionModal.style.display = "flex";
cancelReflection.onclick = () => reflectionModal.style.display = "none";
saveReflection.onclick = () => {
  const key = todayKey();
  reflections[key] = reflectionInput.value.trim();
  localStorage.setItem("df_reflections", JSON.stringify(reflections));
  reflectionInput.value = "";
  reflectionModal.style.display = "none";
};

// otomatis popup jam 21:00
(function schedulePopup() {
  const now = new Date();
  const key = todayKey();
  if (!reflections[key]) {
    if (now.getHours() >= 21) reflectionModal.style.display = "flex";
    else {
      const target = new Date();
      target.setHours(21, 0, 0, 0);
      const ms = target - now;
      setTimeout(() => reflectionModal.style.display = "flex", ms);
    }
  }
})();

resetDay.onclick = () => {
  const key = todayKey();
  delete todos[key];
  delete reflections[key];
  localStorage.setItem("df_todos", JSON.stringify(todos));
  localStorage.setItem("df_reflections", JSON.stringify(reflections));
  renderTodos();
};

// ---------- TIMER ----------
const focusInput = document.getElementById("focusTime");
const breakInput = document.getElementById("breakTime");

function updateTimerDisplay() {
  const min = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const sec = (secondsLeft % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${min}:${sec}`;
  modeText.textContent = isFocus ? "Mode: Fokus" : "Mode: Istirahat";
}

function startTimer() {
  if (running) {
    clearInterval(timerInterval);
    running = false;
    startStop.textContent = "Mulai";
  } else {
    running = true;
    startStop.textContent = "Pause";
    timerInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        isFocus = !isFocus;
        secondsLeft = (isFocus ? focusTime : breakTime) * 60;
        alert(isFocus ? "Waktu Fokus!" : "Istirahat dulu.");
      }
      updateTimerDisplay();
    }, 1000);
  }
}

function resetTimerFn() {
  clearInterval(timerInterval);
  running = false;
  startStop.textContent = "Mulai";
  secondsLeft = (isFocus ? focusTime : breakTime) * 60;
  updateTimerDisplay();
}

function toggleModeFn() {
  isFocus = !isFocus;
  resetTimerFn();
}

focusInput.onchange = () => {
  focusTime = Math.max(1, Number(focusInput.value) || 25);
  resetTimerFn();
};
breakInput.onchange = () => {
  breakTime = Math.max(1, Number(breakInput.value) || 5);
  resetTimerFn();
};

startStop.onclick = startTimer;
resetTimer.onclick = resetTimerFn;
toggleMode.onclick = toggleModeFn;

updateTimerDisplay();
