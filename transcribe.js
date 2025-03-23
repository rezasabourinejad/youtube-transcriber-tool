const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const { AssemblyAI } = require("assemblyai");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

// Set fetch globally for AssemblyAI
global.fetch = fetch;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

async function extractAudio(videoPath) {
  return new Promise((resolve, reject) => {
    const outputPath = videoPath.replace(".mp4", ".mp3");
    ffmpeg(videoPath)
      .toFormat("mp3")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

async function transcribeAudio(audioPath) {
  try {
    const config = {
      audio: fs.readFileSync(audioPath),
      punctuate: true,
      format_text: true,
    };

    const transcript = await client.transcripts.transcribe(config);
    console.log(
      "AssemblyAI output structure:",
      JSON.stringify(transcript, null, 2)
    );
    return transcript;
  } catch (error) {
    console.error("Error in text conversion:", error);
    throw error;
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function createSRTFile(transcript, outputPath) {
  let srtContent = "";
  let index = 1;

  transcript.words.forEach((word, i) => {
    if (i === 0 || word.start - transcript.words[i - 1].end > 0.5) {
      if (i > 0) {
        srtContent += "\n";
      }
      srtContent += `${index}\n`;
      srtContent += `${formatTime(word.start)} --> ${formatTime(word.end)}\n`;
      srtContent += `${word.text}\n`;
      index++;
    } else {
      srtContent += ` ${word.text}`;
    }
  });

  fs.writeFileSync(outputPath, srtContent);
  return outputPath;
}

function findWordTimestamps(transcript, searchWord) {
  const results = [];
  const words = transcript.words || [];

  console.log("Words structure:", JSON.stringify(words[0], null, 2));

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.text.toLowerCase().includes(searchWord.toLowerCase())) {
      console.log("Word found:", word);
      results.push({
        word: word.text,
        start: word.start,
        end: word.end,
        confidence: word.confidence,
        timestamp: formatTime(word.start),
      });
    }
  }

  return results;
}

async function processVideo(videoPath, searchWord = null) {
  try {
    console.log("Extracting audio from video...");
    const audioPath = await extractAudio(videoPath);
    console.log("Audio extracted successfully!");

    console.log("Starting text conversion...");
    const transcript = await transcribeAudio(audioPath);
    console.log("Text conversion completed!");

    // ایجاد فایل SRT
    const srtPath = videoPath.replace(".mp4", ".srt");
    createSRTFile(transcript, srtPath);

    const result = {
      text: transcript.text,
      words: transcript.words,
      searchResults: null,
      srtPath: srtPath,
    };

    if (searchWord) {
      result.searchResults = findWordTimestamps(transcript, searchWord);
    }

    return result;
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
}

module.exports = { processVideo };
