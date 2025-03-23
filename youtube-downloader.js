const { exec } = require("child_process");
const path = require("path");

class YouTubeDownloader {
  constructor() {
    this.outputDir = path.join(__dirname, "downloads");
  }

  async downloadVideo(url, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        format = "best[ext=mp4]",
        output = "%(title)s.%(ext)s",
        outputDir = this.outputDir,
      } = options;

      const command = `yt-dlp -f "${format}" "${url}" -o "${path.join(
        outputDir,
        output
      )}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Download error:", error);
          reject(error);
          return;
        }
        console.log("Output:", stdout);
        resolve(stdout);
      });
    });
  }

  async getVideoInfo(url) {
    return new Promise((resolve, reject) => {
      const command = `yt-dlp --dump-json "${url}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Error getting information:", error);
          reject(error);
          return;
        }
        try {
          const info = JSON.parse(stdout);
          console.log("Video information:", info.title);
          resolve(info);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

module.exports = { YouTubeDownloader };

// Usage example
async function main() {
  const downloader = new YouTubeDownloader();

  try {
    // Get video information
    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const videoInfo = await downloader.getVideoInfo(videoUrl);
    console.log("Video information:", videoInfo.title);

    // Download video
    await downloader.downloadVideo(videoUrl, {
      format: "best[ext=mp4]",
      output: "%(title)s.%(ext)s",
    });
    console.log("Download completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
