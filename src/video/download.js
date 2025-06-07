const ytdl = require("ytdl-core");
const fs = require("fs");
const HttpsProxyAgent = require("https-proxy-agent");

// Твой прокси с логином и паролем
const proxyUrl = "http://maksim2464:3XYXG5t2M7@82.211.8.108:59100";

const videoUrl = "https://www.youtube.com/watch?v=xfAhyofp0Z8";

(async () => {
  const proxyAgent = new HttpsProxyAgent(proxyUrl);

  const videoStream = ytdl(videoUrl, {
    requestOptions: {
      agent: proxyAgent,
    },
  });

  videoStream.pipe(fs.createWriteStream("video.mp4"));

  videoStream.on("end", () => {
    console.log("Видео скачано!");
  });

  videoStream.on("error", (err) => {
    console.error("Ошибка:", err);
  });
})();
