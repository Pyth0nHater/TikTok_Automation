const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// Конфигурация Telegram бота
const TELEGRAM_TOKEN = "6807558708:AAEapTJk9thUr6NIIUxn8WRxpx1aoI7pnhs";
const CHAT_ID = "819850346";
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function sendScreenshot(page, stepName) {
  try {
    const screenshotPath = `screenshot_${Date.now()}_${stepName.replace(
      /\s+/g,
      "_"
    )}.png`;
    await page.screenshot({ path: screenshotPath });
    await bot.sendPhoto(CHAT_ID, screenshotPath, {
      caption: `Шаг: ${stepName}`,
    });
    fs.unlinkSync(screenshotPath);
    console.log(`Скриншот отправлен для шага: ${stepName}`);
  } catch (e) {
    console.error("Ошибка при отправке скриншота:", e);
  }
}

(async () => {
  // Новые прокси-настройки (Германия)
  const proxyOptions = {
    server: "http://f.proxys5.net:6200", // или socks5:// для SOCKS5
    username: "u6292972345565-zone-custom-region-DE",
    password: "pEuBRxYd",
  };

  const DATA_PATH = path.join(__dirname, "data");
  const COOKIE_PATH = path.join(DATA_PATH, "cookie.json");
  const videoPath = path.join(DATA_PATH, "test.mp4");

  const browser = await chromium.launch({
    proxy: proxyOptions, // Подключаем прокси здесь
    headless: true,
  });

  const context = await browser.newContext();

  try {
    // [Остальной код без изменений...]
    // Этап 1: Загрузка куков
    const cookiesJson = fs.readFileSync(COOKIE_PATH, "utf-8");
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

    // Этап 2: Переход на страницу загрузки
    await page.goto("https://www.tiktok.com/tiktokstudio/upload?from=webapp", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await sendScreenshot(page, "Страница загрузки открыта");
    console.log("Title:", await page.title());

    await sleep(10000);
    // Этап 3: Загрузка видео
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput)
      throw new Error("Не удалось найти input для загрузки файла");

    if (!fs.existsSync(videoPath))
      throw new Error(`Файл не найден: ${videoPath}`);
    await fileInput.setInputFiles(videoPath);
    await sleep(10000);

    await sendScreenshot(page, "Видео загружено, ожидаем обработки");
    console.log("Видео загружено, ожидаем обработки...");

    // Этап 4: Проверка статуса загрузки
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
            await sendScreenshot(page, "Статус загрузки подтвержден");
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

    // await checkUploadStatus();

    // Этап 5: Редактирование описания
    await page.waitForSelector(".caption-editor", { timeout: 60000 });
    const captionEditor = await page.$(".public-DraftEditor-content");
    if (!captionEditor)
      throw new Error("Не удалось найти поле для ввода описания");

    await captionEditor.click({ clickCount: 3 });
    await page.keyboard.press("Backspace");
    const newCaption = "Новое описание видео с хэштегами #tiktok #test";
    await captionEditor.type(newCaption, { delay: 100 });
    await page.keyboard.press("Enter");
    await sendScreenshot(page, "Текст описания обновлен");
    console.log("Текст описания обновлен");

    // Этап 6: Публикация
    await page.waitForSelector(
      'button[data-e2e="post_video_button"]:not([aria-disabled="true"])',
      {
        timeout: 30000,
      }
    );
    const publishButton = await page.$('button[data-e2e="post_video_button"]');
    if (!publishButton) throw new Error("Не удалось найти кнопку публикации");

    console.log("Нажимаем кнопку публикации...");
    await sendScreenshot(page, "Перед публикацией");
    await publishButton.click();

    await page.waitForTimeout(3000);
    await sendScreenshot(page, "Проверка");
    await page.waitForTimeout(20000);

    await sendScreenshot(page, "После публикации");
    console.log("Видео должно быть опубликовано");
  } catch (error) {
    console.error("Error:", error);
    try {
      await sendScreenshot(page, "Ошибка: " + error.message);
    } catch (e) {
      console.error("Не удалось отправить скриншот ошибки:", e);
    }
  } finally {
    await browser.close();
  }
})();
