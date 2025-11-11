// ===== Daily Focus App =====

// === Inisialisasi Data ===
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let reflections = JSON.parse(localStorage.getItem("reflections")) || [];

// === Elemen DOM ===
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const progressBar = document.getElementById("progress-bar");
const reflectBtn = document.getElementById("reflect-btn");
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

let timer;
let seconds = 0;
let isRunning = false;

// === Fungsi Render To-Do List ===
function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todos[index].done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;
    if (todo.done) span.style.textDecoration = "line-through";

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.classList.add("delete-btn");
    delBtn.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });

  updateProgress();
}

// === Simpan dan Progress ===
function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function updateProgress() {
  if (todos.length === 0) {
    progressBar.style.width = "0%";
    return;
  }
  const doneCount = todos.filter(t => t.done).length;
  const percent = (doneCount / todos.length) * 100;
  progressBar.style.width = percent + "%";
}

// === Tambah Tugas ===
addBtn.addEventListener("click", () => {
  const newTask = todoInput.value.trim();
  if (newTask === "") return;
  todos.push({ text: newTask, done: false });
  saveTodos();
  todoInput.value = "";
  renderTodos();
});

// === Refleksi Harian ===
reflectBtn.addEventListener("click", () => {
  const answer = prompt("Apa pencapaian kecilmu hari ini?");
  if (answer) {
    reflections.push({ date: new Date().toLocaleDateString(), text: answer });
    localStorage.setItem("reflections", JSON.stringify(reflections));
    alert("Refleksimu disimpan. Bagus!");
  }
});

// === Timer Mode Fokus ===
function updateTimerDisplay() {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDisplay.textContent =
    String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

startBtn.addEventListener("click", () => {
  if (!isRunning) {
    isRunning = true;
    timer = setInterval(() => {
      seconds++;
      updateTimerDisplay();
    }, 1000);
  }
});

pauseBtn.addEventListener("click", () => {
  clearInterval(timer);
  isRunning = false;
});

resetBtn.addEventListener("click", () => {
  clearInterval(timer);
  isRunning = false;
  seconds = 0;
  updateTimerDisplay();
});

// === Pop-up Refleksi Malam Otomatis (jam 21.00) ===
function checkReflectionTime() {
  const now = new Date();
  if (now.getHours() === 21 && now.getMinutes() === 0) {
    const answer = prompt("Apa pencapaian kecilmu hari ini?");
    if (answer) {
      reflections.push({ date: new Date().toLocaleDateString(), text: answer });
      localStorage.setItem("reflections", JSON.stringify(reflections));
    }
  }
}
setInterval(checkReflectionTime, 60000); // cek tiap menit

// === Awal ===
renderTodos();
updateTimerDisplay();
