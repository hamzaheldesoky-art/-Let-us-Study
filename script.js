
/* =========================================
   ذاكر صح - JavaScript
   ========================================= */

// البيانات الأساسية
let tasks = JSON.parse(localStorage.getItem("zakkerTasks")) || [];
let flashcards = JSON.parse(localStorage.getItem("zakkerFlashcards")) || [];
let quizQuestions = JSON.parse(localStorage.getItem("zakkerQuiz")) || [];
let studyData = JSON.parse(localStorage.getItem("zakkerStudyData")) || {
  totalMinutes: 0,
  sessions: 0,
  daily: {}
};

let currentFilter = "all";
let currentCardIndex = 0;
let isCardFlipped = false;

// بيانات الاختبار
let currentQuizIndex = 0;
let currentQuizScore = 0;
let selectedAnswer = null;

// بيانات المؤقت
let timerSeconds = 25 * 60;
let timerInitialSeconds = 25 * 60;
let timerInterval = null;
let isTimerRunning = false;
let currentTimerMode = "focus";

// =========================================
// عند تحميل الصفحة
// =========================================

document.addEventListener("DOMContentLoaded", function () {
  setupNavigation();
  setupFilters();
  setupTimerModes();
  setTodayDate();
  updateAllUI();
});

// =========================================
// شاشة الترحيب
// =========================================

function enterApp() {
  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  updateAllUI();
}

// =========================================
// التنقل بين الصفحات
// =========================================

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(function (button) {
    button.addEventListener("click", function () {
      const page = button.dataset.page;
      showPage(page);

      // إغلاق القائمة على الموبايل
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.remove("active-page");
  });

  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.classList.remove("active");
  });

  const selectedPage = document.getElementById(pageId);
  if (selectedPage) {
    selectedPage.classList.add("active-page");
  }

  const selectedNav = document.querySelector(`[data-page="${pageId}"]`);
  if (selectedNav) {
    selectedNav.classList.add("active");
  }

  const titles = {
    dashboard: ["أهلًا بيك، يا بطل! 👋", "جاهز تحقق إنجاز جديد النهارده؟"],
    subjects: ["موادي ومهامي 📚", "نظّم دروسك ومهامك في مكان واحد."],
    focus: ["مؤقت التركيز ⏱️", "ركّز في مذاكرتك وخد فترات راحة منتظمة."],
    flashcards: ["كروت المراجعة 🧠", "اختبر ذاكرتك وراجع المعلومات المهمة."],
    quiz: ["اختبر نفسك ✍️", "راجع معلوماتك من خلال أسئلة قصيرة."],
    statistics: ["إحصائياتك 📊", "شوف تطورك وإنجازاتك في المذاكرة."],
    settings: ["الإعدادات ⚙️", "خصص تجربتك في «ذاكر صح»."]
  };

  if (titles[pageId]) {
    document.getElementById("pageTitle").textContent = titles[pageId][0];
    document.getElementById("pageSubtitle").textContent = titles[pageId][1];
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================
// القائمة الجانبية
// =========================================

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// =========================================
// المهام
// =========================================

function setTodayDate() {
  const dateInput = document.getElementById("taskDate");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

function addTask() {
  const name = document.getElementById("taskName").value.trim();
  const subject = document.getElementById("taskSubject").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const date = document.getElementById("taskDate").value;

  if (!name || !subject) {
    showNotification("من فضلك اكتب اسم المهمة والمادة ⚠️");
    return;
  }

  const newTask = {
    id: Date.now(),
    name: name,
    subject: subject,
    priority: priority,
    date: date,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveData();

  closeModal("taskModal");
  clearTaskForm();
  updateAllUI();
  showNotification("تمت إضافة المهمة بنجاح 🎉");
}

function clearTaskForm() {
  document.getElementById("taskName").value = "";
  document.getElementById("taskSubject").value = "";
  document.getElementById("taskPriority").value = "medium";
  setTodayDate();
}

function toggleTask(id) {
  const task = tasks.find(function (item) {
    return item.id === id;
  });

  if (task) {
    task.completed = !task.completed;
    saveData();
    updateAllUI();

    if (task.completed) {
      showNotification("أحسنت! أنجزت مهمة جديدة 💪");
    }
  }
}

function deleteTask(id) {
  if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
    tasks = tasks.filter(function (task) {
      return task.id !== id;
    });

    saveData();
    updateAllUI();
    showNotification("تم حذف المهمة 🗑️");
  }
}

function getPriorityText(priority) {
  const priorities = {
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة"
  };
  return priorities[priority] || "متوسطة";
}

function createTaskHTML(task) {
  return `
    <div class="task-item">
      <button class="task-check ${task.completed ? "checked" : ""}"
        onclick="toggleTask(${task.id})"></button>

      <div class="task-info">
        <strong class="${task.completed ? "done" : ""}">${escapeHTML(task.name)}</strong>
        <small>${escapeHTML(task.subject)} • ${getPriorityText(task.priority)}</small>
      </div>

      <span class="task-priority ${task.priority}"></span>

      <div class="task-actions">
        <button class="task-action-btn" onclick="deleteTask(${task.id})" title="حذف">🗑️</button>
      </div>
    </div>
  `;
}

function renderDashboardTasks() {
  const container = document.getElementById("dashboardTasks");

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 25px;">
        <div style="font-size: 30px;">📝</div>
        <p>مفيش مهام لسه، أضف أول مهمة ليك!</p>
        <button class="primary-btn" onclick="openModal('taskModal')">إضافة مهمة</button>
      </div>
    `;
    return;
  }

  const sortedTasks = [...tasks]
    .sort(function (a, b) {
      return Number(a.completed) - Number(b.completed);
    })
    .slice(0, 5);

  container.innerHTML = sortedTasks.map(createTaskHTML).join("");
}

function renderAllTasks() {
  const container = document.getElementById("allTasksList");

  let filteredTasks = tasks;

  if (currentFilter === "pending") {
    filteredTasks = tasks.filter(function (task) {
      return !task.completed;
    });
  }

  if (currentFilter === "completed") {
    filteredTasks = tasks.filter(function (task) {
      return task.completed;
    });
  }

  if (filteredTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div>📋</div>
        <h3>لا توجد مهام هنا</h3>
        <p>أضف مهمة جديدة وابدأ إنجازاتك.</p>
        <button class="primary-btn" onclick="openModal('taskModal')">إضافة مهمة</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredTasks.map(createTaskHTML).join("");
}

function setupFilters() {
  document.querySelectorAll(".filter-tab").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".filter-tab").forEach(function (tab) {
        tab.classList.remove("active");
      });

      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderAllTasks();
    });
  });
}

// =========================================
// كروت المراجعة
// =========================================

function addFlashcard() {
  const question = document.getElementById("flashcardQuestion").value.trim();
  const answer = document.getElementById("flashcardAnswer").value.trim();

  if (!question || !answer) {
    showNotification("من فضلك اكتب السؤال والإجابة ⚠️");
    return;
  }

  flashcards.push({
    id: Date.now(),
    question: question,
    answer: answer
  });

  saveData();
  closeModal("flashcardModal");

  document.getElementById("flashcardQuestion").value = "";
  document.getElementById("flashcardAnswer").value = "";

  currentCardIndex = flashcards.length - 1;
  updateFlashcardsUI();
  showNotification("تمت إضافة كارت المراجعة 🧠");
}

function updateFlashcardsUI() {
  document.getElementById("flashcardCount").textContent = flashcards.length;

  const empty = document.getElementById("flashcardEmpty");
  const viewer = document.getElementById("flashcardViewer");

  if (flashcards.length === 0) {
    empty.classList.remove("hidden");
    viewer.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  viewer.classList.remove("hidden");
  renderCurrentFlashcard();
}

function renderCurrentFlashcard() {
  if (flashcards.length === 0) return;

  const card = flashcards[currentCardIndex];

  document.getElementById("currentCardNum").textContent = currentCardIndex + 1;
  document.getElementById("totalCardNum").textContent = flashcards.length;
  document.getElementById("cardQuestion").textContent = card.question;
  document.getElementById("cardAnswer").textContent = card.answer;

  isCardFlipped = false;
  document.getElementById("flashcard").classList.remove("flipped");
}

function flipCard() {
  if (flashcards.length === 0) return;

  isCardFlipped = !isCardFlipped;
  document.getElementById("flashcard").classList.toggle("flipped", isCardFlipped);
}

function nextCard() {
  if (flashcards.length === 0) return;

  currentCardIndex = (currentCardIndex + 1) % flashcards.length;
  renderCurrentFlashcard();
}

function previousCard() {
  if (flashcards.length === 0) return;

  currentCardIndex =
    (currentCardIndex - 1 + flashcards.length) % flashcards.length;

  renderCurrentFlashcard();
}

function shuffleFlashcards() {
  if (flashcards.length < 2) {
    showNotification("أضف كروت أكتر عشان تخلطها 🔀");
    return;
  }

  flashcards.sort(function () {
    return Math.random() - 0.5;
  });

  currentCardIndex = 0;
  updateFlashcardsUI();
  showNotification("تم خلط الكروت 🔀");
}

// =========================================
// الاختبارات
// =========================================

function addQuizQuestion() {
  const question = document.getElementById("quizQuestion").value.trim();
  const options = [
    document.getElementById("quizOption1").value.trim(),
    document.getElementById("quizOption2").value.trim(),
    document.getElementById("quizOption3").value.trim(),
    document.getElementById("quizOption4").value.trim()
  ];
  const correct = Number(document.getElementById("quizCorrect").value);

  if (!question || options.some(function (option) { return !option; })) {
    showNotification("من فضلك املأ السؤال وكل الاختيارات ⚠️");
    return;
  }

  quizQuestions.push({
    id: Date.now(),
    question: question,
    options: options,
    correct: correct
  });

  saveData();
  closeModal("quizModal");

  document.getElementById("quizQuestion").value = "";
  document.getElementById("quizOption1").value = "";
  document.getElementById("quizOption2").value = "";
  document.getElementById("quizOption3").value = "";
  document.getElementById("quizOption4").value = "";

  updateQuizUI();
  showNotification("تمت إضافة السؤال ✍️");
}

function updateQuizUI() {
  document.getElementById("quizQuestionCount").textContent = quizQuestions.length;
}

function startQuiz() {
  if (quizQuestions.length === 0) {
    showNotification("أضف سؤالًا واحدًا على الأقل لبدء الاختبار ⚠️");
    return;
  }

  currentQuizIndex = 0;
  currentQuizScore = 0;
  selectedAnswer = null;

  document.getElementById("quizStart").classList.add("hidden");
  document.getElementById("quizResult").classList.add("hidden");
  document.getElementById("quizArea").classList.remove("hidden");

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const question = quizQuestions[currentQuizIndex];

  selectedAnswer = null;

  document.getElementById("quizProgressText").textContent =
    `السؤال ${currentQuizIndex + 1} من ${quizQuestions.length}`;

  document.getElementById("quizScoreText").textContent =
    `النتيجة: ${currentQuizScore}`;

  document.getElementById("quizQuestionNumber").textContent =
    String(currentQuizIndex + 1).padStart(2, "0");

  document.getElementById("quizQuestionText").textContent = question.question;

  document.getElementById("quizProgressBar").style.width =
    `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`;

  const optionsContainer = document.getElementById("quizOptions");

  optionsContainer.innerHTML = question.options.map(function (option, index) {
    return `
      <button class="quiz-option" onclick="selectQuizAnswer(${index})">
        ${String.fromCharCode(65 + index)}. ${escapeHTML(option)}
      </button>
    `;
  }).join("");

  document.getElementById("nextQuestionBtn").disabled = true;
  document.getElementById("nextQuestionBtn").textContent =
    currentQuizIndex === quizQuestions.length - 1
      ? "إنهاء الاختبار ✓"
      : "السؤال التالي ←";
}

function selectQuizAnswer(index) {
  if (selectedAnswer !== null) return;

  selectedAnswer = index;

  const question = quizQuestions[currentQuizIndex];
  const options = document.querySelectorAll(".quiz-option");

  options.forEach(function (option, optionIndex) {
    option.disabled = true;

    if (optionIndex === question.correct) {
      option.classList.add("correct");
    }

    if (optionIndex === index && index !== question.correct) {
      option.classList.add("wrong");
    }
  });

  if (index === question.correct) {
    currentQuizScore++;
    showNotification("إجابة صحيحة! 🎉");
  } else {
    showNotification("الإجابة الصحيحة اتوضحت باللون الأخضر 💡");
  }

  document.getElementById("quizScoreText").textContent =
    `النتيجة: ${currentQuizScore}`;

  document.getElementById("nextQuestionBtn").disabled = false;
}

function nextQuestion() {
  if (selectedAnswer === null) return;

  if (currentQuizIndex < quizQuestions.length - 1) {
    currentQuizIndex++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("quizResult").classList.remove("hidden");

  document.getElementById("finalScore").textContent = currentQuizScore;
  document.querySelector(".result-score small").textContent =
    ` / ${quizQuestions.length}`;

  const percentage = Math.round(
    (currentQuizScore / quizQuestions.length) * 100
  );

  let message = "محتاج مراجعة أكتر، وإنت تقدر 💪";

  if (percentage >= 80) {
    message = "ممتاز! مستواك رائع جدًا 🏆";
  } else if (percentage >= 50) {
    message = "أحسنت! استمر في المراجعة 🌟";
  }

  document.getElementById("resultMessage").textContent = message;
}

function resetQuiz() {
  document.getElementById("quizResult").classList.add("hidden");
  document.getElementById("quizStart").classList.remove("hidden");
}

// =========================================
// مؤقت التركيز
// =========================================

function setupTimerModes() {
  document.querySelectorAll(".timer-mode").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".timer-mode").forEach(function (mode) {
        mode.classList.remove("active");
      });

      button.classList.add("active");

      const minutes = Number(button.dataset.minutes);
      currentTimerMode = minutes === 25 ? "focus" : "break";

      resetTimer(minutes);
    });
  });
}

function resetTimer(minutes = 25) {
  clearInterval(timerInterval);
  isTimerRunning = false;

  timerInitialSeconds = minutes * 60;
  timerSeconds = timerInitialSeconds;

  document.getElementById("timerStartBtn").textContent = "▶";
  updateTimerDisplay();
}

function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    document.getElementById("timerStartBtn").textContent = "▶";
    return;
  }

  isTimerRunning = true;
  document.getElementById("timerStartBtn").textContent = "⏸";

  timerInterval = setInterval(function () {
    timerSeconds--;

    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      document.getElementById("timerStartBtn").textContent = "▶";

      if (currentTimerMode === "focus") {
        studyData.totalMinutes += 25;
        studyData.sessions++;
        saveData();
        updateAllUI();
        showNotification("أحسنت! خلصت جلسة تركيز 🎉");
      } else {
        showNotification("انتهت الراحة، جاهز ترجع للمذاكرة؟ 💪");
      }

      resetTimer();
    }
  }, 1000);
}

function skipTimer() {
  resetTimer();
  showNotification("تم تخطي المؤقت ⏭️");
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  document.getElementById("timerDisplay").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = (timerSeconds / timerInitialSeconds) * 360;

  document.getElementById("timerRing").style.background =
    `conic-gradient(var(--primary) ${progress}deg, #eeeaff ${progress}deg)`;

  document.getElementById("timerLabel").textContent =
    currentTimerMode === "focus" ? "وقت التركيز" : "وقت الراحة";
}

// =========================================
// الإحصائيات
// =========================================

function updateStatistics() {
  const completed = tasks.filter(function (task) {
    return task.completed;
  }).length;

  const progress = tasks.length > 0
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  document.getElementById("todayHours").innerHTML =
    `${(studyData.totalMinutes / 60).toFixed(1)} <small>ساعة</small>`;

  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("subjectsCount").textContent = getUniqueSubjects().length;
  document.getElementById("studyStreak").textContent =
    studyData.sessions > 0 ? "1" : "0";

  document.getElementById("progressPercent").textContent = `${progress}%`;

  document.getElementById("progressCircle").style.background =
    `conic-gradient(var(--primary) ${progress * 3.6}deg, #eeeaff ${progress * 3.6}deg)`;

  document.getElementById("progressMessage").textContent =
    progress === 100 && tasks.length > 0
      ? "ممتاز! خلصت كل مهامك 🎉"
      : progress > 0
        ? "استمر، إنت بتتقدم بشكل رائع 💪"
        : "ابدأ أول مهمة ليومك 💪";

  document.getElementById("subjectPageCount").textContent = getUniqueSubjects().length;
  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("subjectCompleted").textContent = completed;

  document.getElementById("totalStudyHours").textContent =
    (studyData.totalMinutes / 60).toFixed(1);

  document.getElementById("statsCompleted").textContent = completed;
  document.getElementById("statsFlashcards").textContent = flashcards.length;
  document.getElementById("sessionCount").textContent =
    `${Math.min(studyData.sessions, 4)} / 4`;

  document.getElementById("sessionBar").style.width =
    `${Math.min((studyData.sessions / 4) * 100, 100)}%`;

  updateChart();
  updateAchievements();
}

function getUniqueSubjects() {
  return [...new Set(tasks.map(function (task) {
    return task.subject;
  }))];
}

function updateChart() {
  const chart = document.getElementById("studyChart");

  const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  const values = days.map(function (day, index) {
    return index === 6 ? studyData.totalMinutes / 60 : 0;
  });

  const maxValue = Math.max(...values, 1);

  chart.innerHTML = days.map(function (day, index) {
    const height = Math.max((values[index] / maxValue) * 100, 4);

    return `
      <div class="chart-column">
        <div class="chart-bar" style="height: ${height}%"></div>
        <span>${day}</span>
      </div>
    `;
  }).join("");
}

function updateAchievements() {
  const completed = tasks.filter(function (task) {
    return task.completed;
  }).length;

  document.getElementById("achievement1").classList.toggle("unlocked", tasks.length >= 1);
  document.getElementById("achievement2").classList.toggle("unlocked", completed >= 5);
  document.getElementById("achievement3").classList.toggle("unlocked", flashcards.length >= 5);
  document.getElementById("achievement4").classList.toggle("unlocked", studyData.sessions >= 1);
}

// =========================================
// الوضع الليلي
// =========================================

function toggleDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  document.body.classList.toggle("dark-mode", toggle.checked);
  localStorage.setItem("zakkerDarkMode", toggle.checked);
}

function loadDarkMode() {
  const isDark = localStorage.getItem("zakkerDarkMode") === "true";
  document.body.classList.toggle("dark-mode", isDark);
  document.getElementById("darkModeToggle").checked = isDark;
}

// =========================================
// النوافذ المنبثقة
// =========================================

function openModal(modalId) {
  document.getElementById(modalId).classList.add("open");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("open");
}

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("open");
  }
});

// =========================================
// الحفظ والبيانات
// =========================================

function saveData() {
  localStorage.setItem("zakkerTasks", JSON.stringify(tasks));
  localStorage.setItem("zakkerFlashcards", JSON.stringify(flashcards));
  localStorage.setItem("zakkerQuiz", JSON.stringify(quizQuestions));
  localStorage.setItem("zakkerStudyData", JSON.stringify(studyData));
}

function clearAllData() {
  if (confirm("⚠️ هل أنت متأكد؟ سيتم حذف كل المهام والكروت والإحصائيات.")) {
    tasks = [];
    flashcards = [];
    quizQuestions = [];
    studyData = {
      totalMinutes: 0,
      sessions: 0,
      daily: {}
    };

    saveData();
    updateAllUI();
    showNotification("تم مسح جميع البيانات 🗑️");
  }
}

// =========================================
// تحديث الواجهة بالكامل
// =========================================

function updateAllUI() {
  renderDashboardTasks();
  renderAllTasks();
  updateFlashcardsUI();
  updateQuizUI();
  updateStatistics();
  loadDarkMode();
}

// =========================================
// أدوات مساعدة
// =========================================

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimeout);

  window.toastTimeout = setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}