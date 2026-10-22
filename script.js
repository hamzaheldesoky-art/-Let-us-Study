
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

// نظام الحسابات المحلي
let currentUser = JSON.parse(localStorage.getItem("zakkerCurrentUser")) || null;
let users = JSON.parse(localStorage.getItem("zakkerUsers")) || {};

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
    ai: ["المساعد الذكي 🤖", "لخّص دروسك وأنشئ أسئلة تلقائيًا."],
    schedule: ["الجدول الأسبوعي 📅", "خطط لمذاكرتك خلال الأسبوع."],
    plan: ["مولد خطة المذاكرة 📋", "أنشئ خطة توزيع للمواد والامتحانات."],
    settings: ["الإعدادات ⚙️", "خصص تجربتك في Let Us Study."]
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
  updateAccountUI();
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

// =========================================
// نظام الحسابات المحلي
// =========================================

function openAccountModal() {
  updateAccountUI();
  openModal("accountModal");
}

function updateAccountUI() {
  const loggedOut = document.getElementById("accountLoggedOut");
  const loggedIn = document.getElementById("accountLoggedIn");
  const display = document.getElementById("currentUserDisplay");

  if (currentUser) {
    loggedOut.classList.add("hidden");
    loggedIn.classList.remove("hidden");
    document.getElementById("loggedInUsername").textContent = currentUser;
    if (display) display.textContent = currentUser;
  } else {
    loggedOut.classList.remove("hidden");
    loggedIn.classList.add("hidden");
    if (display) display.textContent = "غير مسجل";
  }
}

function registerOrLogin() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!username || !password) {
    showNotification("من فضلك أدخل اسم المستخدم وكلمة المرور ⚠️");
    return;
  }

  if (users[username]) {
    // Login
    if (users[username].password !== password) {
      showNotification("كلمة المرور غير صحيحة ⚠️");
      return;
    }
    // Save current data to previous user if any
    if (currentUser) {
      saveUserData(currentUser);
    }
    currentUser = username;
    loadUserData(username);
    showNotification(`مرحبًا بعودتك، ${username}! 👋`);
  } else {
    // Register
    if (currentUser) {
      saveUserData(currentUser);
    }
    users[username] = { password: password, data: null };
    currentUser = username;
    // Keep current data as the new user's data
    saveUserData(username);
    showNotification(`تم إنشاء الحساب: ${username} 🎉`);
  }

  localStorage.setItem("zakkerCurrentUser", JSON.stringify(currentUser));
  localStorage.setItem("zakkerUsers", JSON.stringify(users));
  closeModal("accountModal");
  updateAccountUI();
  updateAllUI();
}

function logout() {
  if (currentUser) {
    saveUserData(currentUser);
  }
  currentUser = null;
  localStorage.removeItem("zakkerCurrentUser");
  // Reset to empty or keep last? For simplicity reset
  tasks = [];
  flashcards = [];
  quizQuestions = [];
  studyData = { totalMinutes: 0, sessions: 0, daily: {} };
  saveData();
  updateAccountUI();
  updateAllUI();
  showNotification("تم تسجيل الخروج 👋");
  closeModal("accountModal");
}

function saveUserData(username) {
  if (!username || !users[username]) return;
  users[username].data = {
    tasks: tasks,
    flashcards: flashcards,
    quizQuestions: quizQuestions,
    studyData: studyData
  };
  localStorage.setItem("zakkerUsers", JSON.stringify(users));
}

function loadUserData(username) {
  if (!users[username] || !users[username].data) {
    tasks = [];
    flashcards = [];
    quizQuestions = [];
    studyData = { totalMinutes: 0, sessions: 0, daily: {} };
  } else {
    const data = users[username].data;
    tasks = data.tasks || [];
    flashcards = data.flashcards || [];
    quizQuestions = data.quizQuestions || [];
    studyData = data.studyData || { totalMinutes: 0, sessions: 0, daily: {} };
  }
  saveData(); // also save to the global keys for compatibility
}

// Override saveData to also save to current user
const originalSaveData = saveData;
saveData = function() {
  originalSaveData();
  if (currentUser) {
    saveUserData(currentUser);
  }
};

// =========================================
// تصدير واستيراد البيانات (للمزامنة بين الأجهزة)
// =========================================

function exportData() {
  const exportObj = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    currentUser: currentUser,
    tasks: tasks,
    flashcards: flashcards,
    quizQuestions: quizQuestions,
    studyData: studyData,
    users: users // optional, for full backup
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `let-us-study-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification("تم تصدير البيانات بنجاح 📤");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.tasks) tasks = data.tasks;
      if (data.flashcards) flashcards = data.flashcards;
      if (data.quizQuestions) quizQuestions = data.quizQuestions;
      if (data.studyData) studyData = data.studyData;
      if (data.users) users = data.users;
      if (data.currentUser) {
        currentUser = data.currentUser;
        localStorage.setItem("zakkerCurrentUser", JSON.stringify(currentUser));
      }
      saveData();
      updateAllUI();
      updateAccountUI();
      showNotification("تم استيراد البيانات بنجاح 📥");
    } catch (err) {
      showNotification("ملف غير صالح ⚠️");
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // reset
}

// =========================================
// الذكاء الاصطناعي
// =========================================

function generateSummary() {
  const text = document.getElementById("aiLessonText").value.trim();
  if (!text) {
    showNotification("من فضلك الصق نص الدرس أولاً ⚠️");
    return;
  }

  const output = document.getElementById("aiOutput");
  const title = document.getElementById("aiOutputTitle");
  const content = document.getElementById("aiOutputContent");

  title.textContent = "📝 الملخص";
  content.textContent = "جاري التلخيص...";
  output.style.display = "block";

  // تلخيص محلي: استخراج أهم الجمل
  const sentences = text
    .replace(/\n+/g, ". ")
    .split(/[.!؟]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25);

  const unique = [...new Set(sentences)];
  const top = unique.slice(0, 7);

  let summary = top.length
    ? top.map((s, i) => `${i + 1}. ${s}`).join("\n\n")
    : "النص قصير جدًا لإنشاء ملخص مفصل.";

  content.textContent = summary;
}

function generateQuestions() {
  const text = document.getElementById("aiLessonText").value.trim();
  if (!text) {
    showNotification("من فضلك الصق نص الدرس أولاً ⚠️");
    return;
  }

  const output = document.getElementById("aiOutput");
  const title = document.getElementById("aiOutputTitle");
  const content = document.getElementById("aiOutputContent");

  title.textContent = "❓ أسئلة المراجعة";
  content.textContent = "جاري إنشاء الأسئلة...";
  output.style.display = "block";

  // استخراج كلمات ومفاهيم مهمة
  const words = text
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 4);

  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  const sentences = text.split(/[.!؟]\s+/).filter(s => s.length > 30);

  let questions = "";

  // أسئلة إكمال
  sentences.slice(0, 3).forEach((s, i) => {
    const parts = s.split(" ");
    if (parts.length > 6) {
      const blankIndex = Math.floor(parts.length / 2);
      const answer = parts[blankIndex];
      parts[blankIndex] = "______";
      questions += `${i + 1}. أكمل: ${parts.join(" ")}\nالإجابة: ${answer}\n\n`;
    }
  });

  // أسئلة صح أو خطأ
  sentences.slice(3, 6).forEach((s, i) => {
    questions += `${questions.split("\n\n").length}. صح أم خطأ: ${s.trim()}\n(راجع النص للتأكد)\n\n`;
  });

  // أسئلة عن الكلمات المفتاحية
  keywords.slice(0, 3).forEach((kw, i) => {
    questions += `${questions.split("\n\n").length}. ما المقصود بـ "${kw}" حسب النص؟\n\n`;
  });

  content.textContent = questions || "لم أتمكن من استخراج أسئلة. جرب نص أطول.";
}

function copyAIOutput() {
  const content = document.getElementById("aiOutputContent").textContent;
  navigator.clipboard.writeText(content).then(() => {
    showNotification("تم نسخ النتيجة 📋");
  }).catch(() => {
    showNotification("فشل النسخ");
  });
}

// Load on start
document.addEventListener("DOMContentLoaded", function () {
  updateAccountUI();
  if (currentUser) {
    loadUserData(currentUser);
  }
  initExtraFeatures();
});

// =========================================
// المميزات الإضافية
// =========================================

let scheduleData = JSON.parse(localStorage.getItem("zakkerSchedule")) || {};
let notes = localStorage.getItem("zakkerNotes") || "";
let themeColor = localStorage.getItem("zakkerTheme") || "purple";
let todaySessions = parseInt(localStorage.getItem("zakkerTodaySessions") || "0");

const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const motivationalQuotes = [
  "كل خطوة صغيرة تقربك من هدفك!",
  "النجاح مش إنك تذاكر طول الوقت، النجاح إنك تذاكر بتركيز.",
  "ابدأ دلوقتي، حتى لو بدقيقة واحدة.",
  "أنت أقرب للنجاح مما تتخيل.",
  "الاستمرار أهم من الكمال.",
  "ذاكر بذكاء مش بجهد بس.",
  "كل يوم فرصة جديدة تتقدم فيها."
];

function initExtraFeatures() {
  renderWeeklySchedule();
  loadTheme();
  updateDailyQuote();
  loadNotes();
  updateSessionStats();
}

function renderWeeklySchedule() {
  const container = document.getElementById("weeklySchedule");
  if (!container) return;
  container.innerHTML = days.map(day => `
    <div class="schedule-day">
      <strong>${day}</strong>
      <textarea class="schedule-input" data-day="${day}" placeholder="اكتب مهام أو مواد اليوم...">${scheduleData[day] || ""}</textarea>
    </div>
  `).join("");
}

function saveSchedule() {
  document.querySelectorAll(".schedule-input").forEach(input => {
    scheduleData[input.dataset.day] = input.value.trim();
  });
  localStorage.setItem("zakkerSchedule", JSON.stringify(scheduleData));
  showNotification("تم حفظ الجدول الأسبوعي 📅");
}

function generateStudyPlan() {
  const input = document.getElementById("planInput").value.trim();
  const output = document.getElementById("planOutput");
  if (!input) {
    showNotification("اكتب المواد أولاً ⚠️");
    return;
  }
  const lines = input.split("\n").filter(l => l.trim());
  let plan = "<h3>خطة المذاكرة المقترحة</h3><ul>";
  lines.forEach((line, i) => {
    const day = days[i % 7];
    plan += `<li><strong>${day}:</strong> ${escapeHTML(line)}</li>`;
  });
  plan += "</ul><p style='margin-top:15px;color:var(--muted);'>وزّع المذاكرة على الأيام دي وراجع قبل الامتحان بيوم.</p>";
  output.innerHTML = plan;
  output.style.display = "block";
}

// ثيمات الألوان
function setTheme(color) {
  themeColor = color;
  localStorage.setItem("zakkerTheme", color);
  document.body.classList.remove("theme-purple", "theme-blue", "theme-green", "theme-orange");
  document.body.classList.add("theme-" + color);
  showNotification("تم تغيير اللون 🎨");
}

function loadTheme() {
  document.body.classList.add("theme-" + themeColor);
}

// ملاحظات سريعة
function loadNotes() {
  const notesEl = document.getElementById("quickNotes");
  if (notesEl) notesEl.value = notes;
}

function saveNotes() {
  notes = document.getElementById("quickNotes").value;
  localStorage.setItem("zakkerNotes", notes);
}

// تذكير يومي
function updateDailyQuote() {
  const quoteEl = document.querySelector(".quote-card p");
  if (quoteEl) {
    const dayIndex = new Date().getDay();
    quoteEl.textContent = motivationalQuotes[dayIndex % motivationalQuotes.length];
  }
}

// مؤقت متقدم + صوت
function playNotificationSound() {
  try {
    const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==");
    audio.play().catch(() => {});
  } catch (e) {}
}

// وضع التركيز الكامل
function toggleFullscreenTimer() {
  const timerCard = document.querySelector(".focus-timer-card");
  if (!document.fullscreenElement) {
    timerCard.requestFullscreen?.() || timerCard.webkitRequestFullscreen?.();
    showNotification("وضع التركيز الكامل 🎯");
  } else {
    document.exitFullscreen?.();
  }
}

// تصدير المهام
function exportTasksPDF() {
  const tasksText = tasks.map(t => `${t.completed ? "✅" : "⬜"} ${t.name} - ${t.subject}`).join("\n");
  const blob = new Blob([tasksText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "مهامي.txt";
  a.click();
  showNotification("تم تصدير المهام 📄");
}

// تحديث إحصائيات الجلسات
function updateSessionStats() {
  const el = document.getElementById("todaySessionsCount");
  if (el) el.textContent = todaySessions;
}

// عند انتهاء جلسة تركيز
const originalToggleTimer = toggleTimer;
// سيتم استدعاؤها من الكود الأصلي عند الانتهاء

function onFocusSessionComplete() {
  todaySessions++;
  localStorage.setItem("zakkerTodaySessions", todaySessions);
  playNotificationSound();
  updateSessionStats();
  updateAchievements();
}

// كروت أفضل - صعوبة
function updateFlashcardDifficulty(id, difficulty) {
  const card = flashcards.find(c => c.id === id);
  if (card) {
    card.difficulty = difficulty;
    card.reviewCount = (card.reviewCount || 0) + 1;
    saveData();
    showNotification("تم تحديث مستوى الكارت");
  }
}

// شارات إضافية
function updateAchievements() {
  const completed = tasks.filter(t => t.completed).length;
  document.getElementById("achievement1")?.classList.toggle("unlocked", tasks.length >= 1);
  document.getElementById("achievement2")?.classList.toggle("unlocked", completed >= 5);
  document.getElementById("achievement3")?.classList.toggle("unlocked", flashcards.length >= 5);
  document.getElementById("achievement4")?.classList.toggle("unlocked", studyData.sessions >= 1);
  // شارات جديدة
  document.getElementById("achievement5")?.classList.toggle("unlocked", todaySessions >= 4);
  document.getElementById("achievement6")?.classList.toggle("unlocked", flashcards.length >= 10);
  document.getElementById("achievement7")?.classList.toggle("unlocked", studyData.sessions >= 7);
}