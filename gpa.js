const courseRows = document.getElementById("courseRows");
const addCourseBtn = document.getElementById("addCourseBtn");
const calculateGpaBtn = document.getElementById("calculateGpaBtn");
const resetGpaBtn = document.getElementById("resetGpaBtn");
const gpaError = document.getElementById("gpaError");
const gpaResults = document.getElementById("gpaResults");
const gpaBreakdownBody = document.getElementById("gpaBreakdownBody");
const overallGpaValue = document.getElementById("overallGpaValue");
const totalCreditsValue = document.getElementById("totalCreditsValue");

const storageKey = "gpaCalculatorCourses";
const gradePointsMap = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  F: 0.0
};

const percentageScale = [
  { minimum: 97, letter: "A+" },
  { minimum: 93, letter: "A" },
  { minimum: 90, letter: "A-" },
  { minimum: 87, letter: "B+" },
  { minimum: 83, letter: "B" },
  { minimum: 80, letter: "B-" },
  { minimum: 77, letter: "C+" },
  { minimum: 73, letter: "C" },
  { minimum: 70, letter: "C-" },
  { minimum: 67, letter: "D+" },
  { minimum: 63, letter: "D" },
  { minimum: 0, letter: "F" }
];

let courseRowCount = 0;

loadCourseRows();

addCourseBtn.addEventListener("click", () => {
  addCourseRow();
  saveCourseRows();
  hideGpaResults();
  setMessage(gpaError, "", "");
});

calculateGpaBtn.addEventListener("click", calculateGpa);

resetGpaBtn.addEventListener("click", resetGpaCalculator);

courseRows.addEventListener("change", (event) => {
  const row = event.target.closest(".course-row");

  if (!row) {
    return;
  }

  if (event.target.classList.contains("grade-type")) {
    updateGradeInput(row);
  }

  saveCourseRows();
  hideGpaResults();
  setMessage(gpaError, "", "");
});

courseRows.addEventListener("input", () => {
  saveCourseRows();
  hideGpaResults();
  setMessage(gpaError, "", "");
});

function loadCourseRows() {
  const savedRows = getSavedCourseRows();

  if (savedRows.length > 0) {
    savedRows.forEach((course) => addCourseRow(course));
  } else {
    addCourseRow();
    addCourseRow();
    addCourseRow();
  }
}

function addCourseRow(course = {}) {
  courseRowCount += 1;

  const row = document.createElement("div");
  row.className = "dynamic-row course-row";
  row.innerHTML = `
    <div class="row-grid">
      <div class="field-group">
        <label for="course-name-${courseRowCount}">Course Name</label>
        <input
          type="text"
          id="course-name-${courseRowCount}"
          class="course-name"
          placeholder="e.g. Biology 101"
        />
      </div>
      <div class="field-group">
        <label for="grade-type-${courseRowCount}">Grade Type</label>
        <select id="grade-type-${courseRowCount}" class="grade-type">
          <option value="letter">Letter Grade</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>
      <div class="field-group grade-input-slot"></div>
      <div class="field-group">
        <label for="course-credits-${courseRowCount}">Credits</label>
        <input
          type="number"
          id="course-credits-${courseRowCount}"
          class="course-credits"
          placeholder="e.g. 3"
          min="0.5"
          step="0.5"
        />
      </div>
      <button type="button" class="button-secondary remove-row-btn">Remove</button>
    </div>
  `;

  courseRows.appendChild(row);

  row.querySelector(".course-name").value = course.name || "";
  row.querySelector(".grade-type").value = course.gradeType || "letter";
  row.querySelector(".course-credits").value = course.credits || "";

  updateGradeInput(row, course);

  row.querySelector(".remove-row-btn").addEventListener("click", () => {
    row.remove();
    updateCourseRemoveButtons();
    saveCourseRows();
    hideGpaResults();
    setMessage(gpaError, "", "");
  });

  updateCourseRemoveButtons();
}

function updateGradeInput(row, course = {}) {
  const gradeType = row.querySelector(".grade-type").value;
  const gradeInputSlot = row.querySelector(".grade-input-slot");
  const inputId = `course-grade-${Array.from(courseRows.children).indexOf(row) + 1}`;

  if (gradeType === "percentage") {
    gradeInputSlot.innerHTML = `
      <label for="${inputId}">Percentage (%)</label>
      <input
        type="number"
        id="${inputId}"
        class="course-percentage"
        placeholder="e.g. 86"
        min="0"
        max="100"
      />
    `;

    gradeInputSlot.querySelector(".course-percentage").value = course.percentage || "";
  } else {
    gradeInputSlot.innerHTML = `
      <label for="${inputId}">Letter Grade</label>
      <select id="${inputId}" class="course-letter-grade">
        <option value="">Select grade</option>
        <option value="A+">A+</option>
        <option value="A">A</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B">B</option>
        <option value="B-">B-</option>
        <option value="C+">C+</option>
        <option value="C">C</option>
        <option value="C-">C-</option>
        <option value="D+">D+</option>
        <option value="D">D</option>
        <option value="F">F</option>
      </select>
    `;

    gradeInputSlot.querySelector(".course-letter-grade").value = course.letterGrade || "";
  }
}

function updateCourseRemoveButtons() {
  const rows = courseRows.querySelectorAll(".course-row");
  const removeButtons = courseRows.querySelectorAll(".remove-row-btn");

  removeButtons.forEach((button) => {
    button.disabled = rows.length === 1;
  });
}

function calculateGpa() {
  const rows = Array.from(courseRows.querySelectorAll(".course-row"));

  if (rows.length === 0) {
    setMessage(gpaError, "Please add at least one course.", "error");
    hideGpaResults();
    return;
  }

  const breakdownData = [];
  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const courseName = row.querySelector(".course-name").value.trim();
    const gradeType = row.querySelector(".grade-type").value;
    const credits = parseFloat(row.querySelector(".course-credits").value);

    if (!courseName) {
      setMessage(gpaError, `Please enter a course name for row ${index + 1}.`, "error");
      hideGpaResults();
      return;
    }

    if (Number.isNaN(credits) || credits <= 0) {
      setMessage(
        gpaError,
        `Please enter valid credits greater than 0 for "${courseName}".`,
        "error"
      );
      hideGpaResults();
      return;
    }

    let displayGrade = "";
    let gradePoints = 0;

    if (gradeType === "percentage") {
      const percentage = parseFloat(row.querySelector(".course-percentage").value);

      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        setMessage(
          gpaError,
          `Please enter a valid percentage between 0 and 100 for "${courseName}".`,
          "error"
        );
        hideGpaResults();
        return;
      }

      const letterGrade = convertPercentageToLetter(percentage);
      displayGrade = `${formatValue(percentage)}% (${letterGrade})`;
      gradePoints = gradePointsMap[letterGrade];
    } else {
      const letterGrade = row.querySelector(".course-letter-grade").value;

      if (!letterGrade || !(letterGrade in gradePointsMap)) {
        setMessage(
          gpaError,
          `Please choose a letter grade for "${courseName}".`,
          "error"
        );
        hideGpaResults();
        return;
      }

      displayGrade = letterGrade;
      gradePoints = gradePointsMap[letterGrade];
    }

    const qualityPoints = gradePoints * credits;
    totalCredits += credits;
    totalQualityPoints += qualityPoints;

    breakdownData.push({
      courseName,
      displayGrade,
      credits,
      gradePoints,
      qualityPoints
    });
  }

  const gpa = totalQualityPoints / totalCredits;

  setMessage(gpaError, "", "");
  renderGpaBreakdown(breakdownData, gpa, totalCredits);
  saveCourseRows();
}

function renderGpaBreakdown(data, gpa, totalCredits) {
  gpaBreakdownBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");
    appendCell(row, item.courseName, true);
    appendCell(row, item.displayGrade);
    appendCell(row, formatValue(item.credits));
    appendCell(row, item.gradePoints.toFixed(2));
    appendCell(row, item.qualityPoints.toFixed(2));
    gpaBreakdownBody.appendChild(row);
  });

  overallGpaValue.textContent = gpa.toFixed(2);
  totalCreditsValue.textContent = formatValue(totalCredits);
  gpaResults.classList.remove("hidden");
}

function convertPercentageToLetter(percentage) {
  for (const band of percentageScale) {
    if (percentage >= band.minimum) {
      return band.letter;
    }
  }

  return "F";
}

function saveCourseRows() {
  const rows = Array.from(courseRows.querySelectorAll(".course-row"));
  const courseData = rows.map((row) => ({
    name: row.querySelector(".course-name").value,
    gradeType: row.querySelector(".grade-type").value,
    letterGrade: row.querySelector(".course-letter-grade")
      ? row.querySelector(".course-letter-grade").value
      : "",
    percentage: row.querySelector(".course-percentage")
      ? row.querySelector(".course-percentage").value
      : "",
    credits: row.querySelector(".course-credits").value
  }));

  localStorage.setItem(storageKey, JSON.stringify(courseData));
}

function getSavedCourseRows() {
  const savedRows = localStorage.getItem(storageKey);

  if (!savedRows) {
    return [];
  }

  try {
    const parsedRows = JSON.parse(savedRows);
    return Array.isArray(parsedRows) ? parsedRows : [];
  } catch (error) {
    return [];
  }
}

function resetGpaCalculator() {
  localStorage.removeItem(storageKey);
  courseRows.innerHTML = "";
  courseRowCount = 0;
  addCourseRow();
  addCourseRow();
  addCourseRow();
  gpaBreakdownBody.innerHTML = "";
  overallGpaValue.textContent = "0.00";
  totalCreditsValue.textContent = "0.00";
  hideGpaResults();
  setMessage(gpaError, "", "");
}

function hideGpaResults() {
  gpaResults.classList.add("hidden");
}

function setMessage(element, message, type) {
  if (!message) {
    element.textContent = "";
    element.className = "message hidden";
    return;
  }

  element.textContent = message;
  element.className = `message ${type}`;
}

function formatValue(value) {
  const number = Number(value);

  if (Number.isInteger(number)) {
    return String(number);
  }

  return number.toFixed(2);
}

function appendCell(row, text, isHeader = false) {
  const cell = document.createElement(isHeader ? "th" : "td");

  if (isHeader) {
    cell.scope = "row";
  }

  cell.textContent = text;
  row.appendChild(cell);
}
