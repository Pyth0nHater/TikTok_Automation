const fs = require("fs");

function loadData(path) {
  try {
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Ошибка чтения файла:", err);
  }
  return [];
}

function saveData(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { loadData, saveData };
