const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

ffmpeg("./test.mp4")
  .inputOptions(["-ss", "00:02:30", "-to", "00:03:45"])
  .outputOptions("-c copy")
  .save("output.mp4")
  .on("end", () => console.log("Готово за доли секунды! ⚡️"))
  .on("error", (err) => console.error("Ошибка:", err));
