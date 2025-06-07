//const proxyUrl = "http://modeler_9GurAS:CgukVqkbGhyH@45.86.163.132:14787";

const { checkNewVideo } = require("./browser/checker");
const cron = require("node-cron");

async function main() {
  const checker = cron.schedule("* * * * *", async () => {
    await checkNewVideo("https://www.youtube.com/@EveloneRofls/videos");
  });

  cron.schedule("* * * * *", async () => {
    checker.stop();
    await checkNewVideo("https://my.aeza.net/auth/login");
    checker.start();
  });
}

main();
