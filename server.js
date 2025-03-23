const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { processVideo } = require("./transcribe");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

// Required directories
const downloadsDir = path.join(__dirname, "downloads");
const audioDir = path.join(__dirname, "audio");
const subtitlesDir = path.join(__dirname, "subtitles");

// Create directories if they don't exist
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}
if (!fs.existsSync(subtitlesDir)) {
  fs.mkdirSync(subtitlesDir);
}

app.use(express.json());
app.use(express.static("public"));

// WebSocket connections
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
  });
});

function broadcastProgress(message, progress) {
  const data = JSON.stringify({ message, progress });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Get video information
app.get("/api/video-info", async (req, res) => {
  try {
    const url = req.query.url;
    broadcastProgress("Getting video information...", 10);

    exec(`yt-dlp --get-title "${url}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return res.status(500).json({ error: error.message });
      }
      const title = stdout.trim();
      const filePath = path.join(downloadsDir, `${title}.mp4`);
      broadcastProgress(`Video title: ${title}`, 20);
      res.json({
        title,
        result: {
          filePath,
        },
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download video
app.post("/api/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Sanitize the URL
    const sanitizedUrl = url.replace(/[;&|`$]/g, "");

    // Get video title
    const titlePromise = new Promise((resolve, reject) => {
      exec(`yt-dlp --get-title "${sanitizedUrl}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("Title fetch error:", error);
          reject(error);
          return;
        }
        resolve(stdout.trim());
      });
    });

    const videoTitle = await titlePromise;
    const safeTitle = videoTitle.replace(/[^a-zA-Z0-9]/g, "_");
    const outputPath = path.join(__dirname, "downloads", `${safeTitle}.mp4`);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      return res.json({
        message: "Video already downloaded",
        title: videoTitle,
        path: outputPath,
      });
    }

    // Download video
    const downloadPromise = new Promise((resolve, reject) => {
      const download = exec(
        `yt-dlp -f "best[ext=mp4]" -o "${outputPath}" "${sanitizedUrl}"`
      );

      download.stdout.on("data", (data) => {
        console.log("Download progress:", data);
        // Extract progress percentage if available
        const progressMatch = data.match(/(\d+\.?\d*)%/);
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          broadcastProgress(
            `Downloading: ${progress.toFixed(1)}%`,
            30 + progress * 0.2
          );
        }
      });

      download.stderr.on("data", (data) => {
        console.error("Download stderr:", data);
      });

      download.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Download failed with code ${code}`));
        }
      });

      download.on("error", (error) => {
        console.error("Download error:", error);
        reject(error);
      });
    });

    await downloadPromise;
    broadcastProgress("Download completed successfully!", 50);
    res.json({
      message: "Download completed",
      title: videoTitle,
      path: outputPath,
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Convert to text
app.post("/api/transcribe", async (req, res) => {
  try {
    const { videoPath, searchWord } = req.body;
    broadcastProgress("Extracting audio from video...", 60);

    const result = await processVideo(videoPath, searchWord);
    broadcastProgress("Audio extracted successfully!", 70);
    broadcastProgress("Converting to text...", 80);

    // Add file path to result
    const srtPath = path.join(
      subtitlesDir,
      path.basename(videoPath, ".mp4") + ".srt"
    );
    result.srtPath = srtPath;

    res.json(result);
    broadcastProgress("Text conversion completed!", 100);
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: error.message });
  }
});

// Download SRT file
app.get("/download-srt", (req, res) => {
  try {
    const srtPath = req.query.path;
    if (!srtPath || !fs.existsSync(srtPath)) {
      return res.status(404).json({ error: "SRT file not found" });
    }

    const fileName = path.basename(srtPath);
    res.download(srtPath, fileName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
