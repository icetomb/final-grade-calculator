const calculateBtn = document.getElementById("calculateBtn");
const result = document.getElementById("result");

// Existing calculator: find the score needed on the final exam.
calculateBtn.addEventListener("click", () => {
  const currentGrade = parseFloat(document.getElementById("currentGrade").value);
  const finalWeightPercent = parseFloat(document.getElementById("finalWeight").value);
  const targetGrade = parseFloat(document.getElementById("targetGrade").value);

  if (
    !isValidPercentage(currentGrade) ||
    !isValidPercentage(targetGrade) ||
    !isValidPercentage(finalWeightPercent) ||
    finalWeightPercent === 0
  ) {
    setMessage(
      result,
      "Please enter valid percentages. The final exam weight must be greater than 0.",
      "error"
    );
    return;
  }

  const examWeight = finalWeightPercent / 100;
  const courseworkWeight = 1 - examWeight;
  const neededScore = (targetGrade - currentGrade * courseworkWeight) / examWeight;

  if (neededScore > 100) {
    setMessage(
      result,
      `You need ${neededScore.toFixed(2)}% on the final exam. That is above 100%, so this target is not possible.`,
      "error"
    );
  } else if (neededScore < 0) {
    setMessage(
      result,
      "You already secured your target grade before the final exam.",
      "success"
    );
  } else {
    setMessage(
      result,
      `You need ${neededScore.toFixed(2)}% on the final exam.`,
      "success"
    );
  }
});

// Grade breakdown calculator.
const componentRows = document.getElementById("componentRows");
const addComponentBtn = document.getElementById("addComponentBtn");
const calculateGradeBtn = document.getElementById("calculateGradeBtn");
const gradeError = document.getElementById("gradeError");
const gradeBreakdownSection = document.getElementById("gradeBreakdownSection");
const gradeBreakdownBody = document.getElementById("gradeBreakdownBody");
const totalWeightValue = document.getElementById("totalWeightValue");
const finalGradeValue = document.getElementById("finalGradeValue");

const defaultComponents = [
  { name: "Assignments", grade: "", weight: "" },
  { name: "Midterm", grade: "", weight: "" },
  { name: "Final Exam", grade: "", weight: "" }
];

let componentRowCount = 0;

defaultComponents.forEach((component) => {
  addComponentRow(component.name, component.grade, component.weight);
});

addComponentBtn.addEventListener("click", () => {
  addComponentRow("", "", "");
  hideGradeBreakdown();
  setMessage(gradeError, "", "");
});

calculateGradeBtn.addEventListener("click", calculateWeightedGrade);

componentRows.addEventListener("input", () => {
  hideGradeBreakdown();
  setMessage(gradeError, "", "");
});

function addComponentRow(name, grade, weight) {
  componentRowCount += 1;

  const row = document.createElement("div");
  row.className = "dynamic-row component-row";
  row.innerHTML = `
    <div class="row-grid">
      <div class="field-group">
        <label for="component-name-${componentRowCount}">Component Name</label>
        <input
          type="text"
          id="component-name-${componentRowCount}"
          class="component-name"
          placeholder="e.g. Quiz 1"
        />
      </div>
      <div class="field-group">
        <label for="component-grade-${componentRowCount}">Grade Received (%)</label>
        <input
          type="number"
          id="component-grade-${componentRowCount}"
          class="component-grade"
          placeholder="e.g. 85"
          min="0"
          max="100"
        />
      </div>
      <div class="field-group">
        <label for="component-weight-${componentRowCount}">Weight (%)</label>
        <input
          type="number"
          id="component-weight-${componentRowCount}"
          class="component-weight"
          placeholder="e.g. 20"
          min="0"
          max="100"
        />
      </div>
      <button type="button" class="button-secondary remove-row-btn">Remove</button>
    </div>
  `;

  row.querySelector(".component-name").value = name;
  row.querySelector(".component-grade").value = grade;
  row.querySelector(".component-weight").value = weight;

  row.querySelector(".remove-row-btn").addEventListener("click", () => {
    row.remove();
    updateComponentRemoveButtons();
    hideGradeBreakdown();
    setMessage(gradeError, "", "");
  });

  componentRows.appendChild(row);
  updateComponentRemoveButtons();
}

function updateComponentRemoveButtons() {
  const rows = componentRows.querySelectorAll(".component-row");
  const removeButtons = componentRows.querySelectorAll(".remove-row-btn");

  removeButtons.forEach((button) => {
    button.disabled = rows.length === 1;
  });
}

function calculateWeightedGrade() {
  const rows = Array.from(componentRows.querySelectorAll(".component-row"));

  if (rows.length === 0) {
    setMessage(gradeError, "Please add at least one grade component.", "error");
    hideGradeBreakdown();
    return;
  }

  const breakdownData = [];
  let totalWeight = 0;
  let finalGrade = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const componentName = row.querySelector(".component-name").value.trim();
    const grade = parseFloat(row.querySelector(".component-grade").value);
    const weight = parseFloat(row.querySelector(".component-weight").value);

    if (!componentName) {
      setMessage(gradeError, `Please enter a name for component ${index + 1}.`, "error");
      hideGradeBreakdown();
      return;
    }

    if (!isValidPercentage(grade)) {
      setMessage(
        gradeError,
        `Please enter a valid grade between 0 and 100 for "${componentName}".`,
        "error"
      );
      hideGradeBreakdown();
      return;
    }

    if (!isValidPercentage(weight) || weight === 0) {
      setMessage(
        gradeError,
        `Please enter a valid weight greater than 0 and up to 100 for "${componentName}".`,
        "error"
      );
      hideGradeBreakdown();
      return;
    }

    const contribution = (grade * weight) / 100;
    totalWeight += weight;
    finalGrade += contribution;

    breakdownData.push({
      componentName,
      grade,
      weight,
      contribution
    });
  }

  if (Math.abs(totalWeight - 100) > 0.01) {
    setMessage(
      gradeError,
      `The total weight must equal 100%. It currently adds up to ${formatNumber(totalWeight)}%.`,
      "error"
    );
    hideGradeBreakdown();
    return;
  }

  setMessage(gradeError, "", "");
  renderGradeBreakdown(breakdownData, totalWeight, finalGrade);
}

function renderGradeBreakdown(data, totalWeight, finalGrade) {
  gradeBreakdownBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");

    appendCell(row, item.componentName, true);
    appendCell(row, `${formatNumber(item.grade)}%`);
    appendCell(row, `${formatNumber(item.weight)}%`);
    appendCell(row, `${formatNumber(item.contribution)}%`);

    gradeBreakdownBody.appendChild(row);
  });

  totalWeightValue.textContent = `${formatNumber(totalWeight)}%`;
  finalGradeValue.textContent = `${formatNumber(finalGrade)}%`;
  gradeBreakdownSection.classList.remove("hidden");
}

function hideGradeBreakdown() {
  gradeBreakdownSection.classList.add("hidden");
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

function isValidPercentage(value) {
  return !Number.isNaN(value) && value >= 0 && value <= 100;
}

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function appendCell(row, text, isHeader = false) {
  const cell = document.createElement(isHeader ? "th" : "td");

  if (isHeader) {
    cell.scope = "row";
  }

  cell.textContent = text;
  row.appendChild(cell);
}
