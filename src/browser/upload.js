const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  // Modjus shop proxy
  const proxyOptions = {
    server: "http://45.86.163.132:14787",
    username: "modeler_9GurAS",
    password: "CgukVqkbGhyH",
  };

  //   Soxy shop proxy
  // const proxyOptions = {
  //   server: "http://82.211.8.108:59100",
  //   username: "maksim2464",
  //   password: "3XYXG5t2M7",
  // };

  const browser = await chromium.launch({
    proxy: proxyOptions,
    headless: false,
  });

  const context = await browser.newContext();

  try {
    const cookiesJson = fs.readFileSync("./data/cookie.json", "utf-8");
    const cookies = JSON.parse(cookiesJson);

    const processedCookies = cookies.map((cookie) => {
      const { hostOnly, storeId, session, ...rest } = cookie;
      let sameSite;
      switch (cookie.sameSite?.toLowerCase()) {
        case "no_restriction":
          sameSite = "None";
          break;
        case "lax":
          sameSite = "Lax";
          break;
        case "unspecified":
          sameSite = "Lax";
          break;
        default:
          sameSite = cookie.sameSite || "Lax";
      }
      if (sameSite === "None" && !rest.secure) rest.secure = true;
      return { ...rest, sameSite };
    });

    await context.addCookies(processedCookies);

    const page = await context.newPage();
    await page.goto("https://www.tiktok.com/tiktokstudio/upload?from=webapp", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    console.log("Title:", await page.title());

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput)
      throw new Error("Не удалось найти input для загрузки файла");

    const videoPath = path.resolve("./test.mp4");
    if (!fs.existsSync(videoPath))
      throw new Error(`Файл не найден: ${videoPath}`);

    await fileInput.setInputFiles(videoPath);
    console.log("Видео загружено, ожидаем обработки...");

    // Функция для проверки статуса загрузки
    async function checkUploadStatus(attempts = 10) {
      for (let i = 0; i < attempts; i++) {
        try {
          const statusElement = await page.waitForSelector(
            ".info-status.success",
            {
              timeout: 5000,
              state: "attached",
            }
          );

          const statusText = await statusElement.innerText();
          if (statusText.includes("Загружено")) {
            console.log("Статус загрузки подтвержден:", statusText);
            return true;
          }
        } catch (e) {
          console.log(`Попытка ${i + 1}: статус загрузки еще не подтвержден`);
        }
        await page.waitForTimeout(5000);
      }
      throw new Error(
        "Не удалось подтвердить статус загрузки после всех попыток"
      );
    }

    await checkUploadStatus();

    await page.waitForSelector(".caption-editor", { timeout: 60000 });

    const captionEditor = await page.$(".public-DraftEditor-content");
    if (!captionEditor)
      throw new Error("Не удалось найти поле для ввода описания");

    await captionEditor.click({ clickCount: 3 });
    await page.keyboard.press("Backspace");

    const newCaption = "Новое описание видео с хэштегами #tiktok #test";
    await captionEditor.type(newCaption, { delay: 100 });

    await page.keyboard.press("Enter");
    console.log("Текст описания обновлен");

    await page.waitForSelector(
      'button[data-e2e="post_video_button"]:not([aria-disabled="true"])',
      {
        timeout: 30000,
      }
    );

    const publishButton = await page.$('button[data-e2e="post_video_button"]');
    if (!publishButton) throw new Error("Не удалось найти кнопку публикации");

    console.log("Нажимаем кнопку публикации...");
    await publishButton.click();

    await page.waitForTimeout(60000);
    console.log("Видео должно быть опубликовано");
  } catch (error) {
    console.error("Error:", error);
    await page.screenshot({ path: "error.png" });
  } finally {
    await browser.close();
  }
})();
