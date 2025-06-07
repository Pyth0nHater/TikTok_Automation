const { chromium } = require("playwright");
const path = require("path");
const { loadData, saveData } = require("../utils/json");
const { sleep } = require("../utils/sleep");

const VIDEO_STORAGE = path.join(__dirname, "../data/all_videos.json");
const NEW_VIDEOS_STORAGE = path.join(__dirname, "../data/new_videos.json");

async function checkNewVideo(link) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.waitForSelector("ytd-rich-item-renderer");

  await sleep(5000);
  // Собираем текущие видео
  const currentVideos = await page.$$eval(
    "ytd-rich-item-renderer",
    (videos) => {
      return videos.map((v) => {
        const timeElement = v.querySelector(
          "#text.ytd-thumbnail-overlay-time-status-renderer"
        );
        return {
          title: v.querySelector("#video-title")?.textContent.trim(),
          link: v.querySelector("#video-title-link")?.href,
          duration: timeElement ? timeElement.textContent.trim() : "N/A",
        };
      });
    }
  );

  const savedVideos = loadData(VIDEO_STORAGE);
  const savedNewVideos = loadData(NEW_VIDEOS_STORAGE);

  const trulyNewVideos = currentVideos.filter(
    (currentVideo) =>
      !savedVideos.some(
        (savedVideo) => savedVideo.title === currentVideo.title
      ) &&
      !savedNewVideos.some((newVideo) => newVideo.title === currentVideo.title)
  );

  if (trulyNewVideos.length > 0) {
    console.log("Найдены новые видео:");
    trulyNewVideos.forEach((video) =>
      console.log(`- ${video.title} (${video.duration}): ${video.link}`)
    );

    saveData(VIDEO_STORAGE, [...savedVideos, ...trulyNewVideos]);
    saveData(NEW_VIDEOS_STORAGE, [...savedNewVideos, ...trulyNewVideos]);
  } else {
    console.log("Новых видео не обнаружено.");
  }

  await browser.close();
}

module.exports = { checkNewVideo };
