const calculateBtn = document.getElementById("calculateBtn");
const result = document.getElementById("result");

calculateBtn.addEventListener("click", () => {
  const currentGrade = parseFloat(document.getElementById("currentGrade").value);
  const finalWeightPercent = parseFloat(document.getElementById("finalWeight").value);
  const targetGrade = parseFloat(document.getElementById("targetGrade").value);

  if (
    isNaN(currentGrade) ||
    isNaN(finalWeightPercent) ||
    isNaN(targetGrade)
  ) {
    result.textContent = "Please fill in all fields.";
    return;
  }

  if (finalWeightPercent <= 0 || finalWeightPercent > 100) {
    result.textContent = "Final exam weight must be between 0 and 100.";
    return;
  }

  const w = finalWeightPercent / 100;
  const needed = (targetGrade - currentGrade * (1 - w)) / w;

  if (needed > 100) {
    result.textContent = `You need ${needed.toFixed(2)}% on the final. That is above 100%, so the target is not possible.`;
  } else if (needed < 0) {
    result.textContent = `You already secured your target grade.`;
  } else {
    result.textContent = `You need ${needed.toFixed(2)}% on the final exam.`;
  }
});