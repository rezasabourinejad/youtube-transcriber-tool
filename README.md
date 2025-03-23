# YouTube Video Transcriber

A modern web application that downloads YouTube videos and converts them to text using speech recognition. Built with Node.js and Whisper AI.

## Features

- 🎥 Download YouTube videos using yt-dlp
- 🎯 Convert video audio to text using Whisper AI
- 🔍 Search through transcription with timestamp links
- 📝 Download transcription as SRT file
- 🎨 Modern, responsive UI
- 📊 Real-time progress tracking
- ⚡ Fast and efficient processing

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7 or higher
- FFmpeg
- yt-dlp
- AssemblyAI API Key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/youtube-transcriber.git
cd youtube-transcriber
```

2. Create a `.env` file in the project root and add your AssemblyAI API key:

```bash
ASSEMBLYAI_API_KEY=your_api_key_here
```

You can get an API key by signing up at [AssemblyAI](https://www.assemblyai.com/).

3. Install Node.js dependencies:

```bash
npm install
```

4. Install Python dependencies:

```bash
pip install -r requirements.txt
```

5. Install FFmpeg:

- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt-get install ffmpeg`
- Windows: Download from [FFmpeg website](https://ffmpeg.org/download.html)

6. Install yt-dlp:

```bash
pip install yt-dlp
```

## Usage

1. Start the server:

```bash
node server.js
```

2. Open your browser and navigate to:

```
http://localhost:3000
```

3. Paste a YouTube URL and click "Download and Convert to Text"

4. Wait for the processing to complete

5. Use the search feature to find specific words in the transcription

6. Click on timestamps to jump to specific moments in the video

7. Download the SRT file for use in video editors or subtitling tools

## How It Works

1. The application uses yt-dlp to download YouTube videos
2. FFmpeg extracts the audio from the video
3. Whisper AI processes the audio and generates accurate transcription
4. The transcription is displayed with timestamps and search functionality
5. Users can download the transcription in SRT format

## API Endpoints

- `POST /api/download`: Downloads YouTube video
- `POST /api/transcribe`: Converts video to text
- `GET /download-srt`: Downloads transcription in SRT format

## Project Structure

```
youtube-transcriber/
├── server.js           # Main server file
├── transcribe.js       # Transcription logic
├── youtube-downloader.js # YouTube video downloader
├── public/            # Static files
├── downloads/         # Temporary video downloads
├── audio/            # Extracted audio files
├── subtitles/        # Generated subtitles
└── temp/            # Temporary files
```

## Technologies Used

- Node.js
- Express.js
- FFmpeg
- YouTube API
- Speech Recognition API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Whisper AI](https://github.com/openai/whisper) for speech recognition
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for YouTube video downloading
- [FFmpeg](https://ffmpeg.org/) for audio processing

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.
