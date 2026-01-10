import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { RadReelAPI } from '../api/radreel';

export class VideoPlayer {
  private player: any;
  private playId: string;
  private seq: number;

  constructor(containerId: string, playId: string, seq = 0) {
    this.playId = playId;
    this.seq = seq;
    this.init(containerId);
  }

  private async init(containerId: string) {
    const container = document.querySelector(containerId);
    if (!container) return;
    
    try {
      const videoData = await RadReelAPI.getVideoUrl(this.playId, this.seq);

      if (!videoData || !videoData.url) {
        throw new Error("API tidak memberikan URL video.");
      }

      const videoId = `player-${Math.random().toString(36).substr(2, 9)}`;
      container.innerHTML = `<video id="${videoId}" class="video-js w-full h-full vjs-big-play-centered"></video>`;

      this.player = videojs(videoId, {
        controls: true,
        autoplay: true,
        preload: 'auto',
        fluid: false, // Disable fluid to handle vertical video aspect ratio manually
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        controlBar: {
          skipButtons: { forward: 10, backward: 10 },
          volumePanel: { inline: false },
          pictureInPictureToggle: true,
        },
        userActions: {
          hotkeys: true,
          doubleClick: true
        }
      });

      // Add custom styles for the video element to handle portrait/vertical content
      const videoElement = document.getElementById(videoId);
      if (videoElement) {
        videoElement.style.objectFit = 'contain';
        videoElement.style.backgroundColor = 'black';
      }

      this.player.on('ended', () => {
        const nextBtn = document.getElementById('next-episode-btn');
        if (nextBtn) nextBtn.click();
      });

      this.player.src({
        src: videoData.url,
        type: 'application/x-mpegURL'
      });

      if (videoData.subtitles) {
        videoData.subtitles.forEach(sub => {
          this.player.addRemoteTextTrack({
            kind: 'subtitles',
            src: sub.url,
            srclang: sub.language,
            label: sub.language.toUpperCase(),
            default: sub.language === 'id'
          }, false);
        });
      }

      this.setupKeyboard();
    } catch (e) {
      console.error("Video Player Error:", e);
      container.innerHTML = `<div class="flex flex-col items-center justify-center h-full bg-gray-900 text-red-500 p-8 text-center rounded-xl border border-red-900/30">
        <div class="text-5xl mb-4">⚠️</div>
        <p class="text-xl font-bold mb-2">Gagal Memutar Video</p>
        <p class="text-sm text-gray-400 mb-6 max-w-xs">${(e as Error).message}</p>
        <button onclick="location.reload()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold transition">Coba Lagi</button>
      </div>`;
    }
  }

  private setupKeyboard() {
    const handler = (e: KeyboardEvent) => {
      if (!this.player || !document.contains(this.player.el())) {
        document.removeEventListener('keydown', handler);
        return;
      }
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          this.player.paused() ? this.player.play() : this.player.pause();
          break;
        case 'ArrowLeft':
          this.player.currentTime(Math.max(0, this.player.currentTime() - 10));
          break;
        case 'ArrowRight':
          this.player.currentTime(Math.min(this.player.duration(), this.player.currentTime() + 10));
          break;
        case 'f':
          if (this.player.isFullscreen()) {
            this.player.exitFullscreen();
          } else {
            this.player.requestFullscreen();
          }
          break;
      }
    };
    document.addEventListener('keydown', handler);
  }

  private setupProgress() {
    if (!this.player) return;
    
    this.player.on('timeupdate', () => {
      const current = this.player.currentTime();
      if (current > 10) {
        localStorage.setItem(`dramain_progress_${this.videoFakeId}`, current.toString());
      }
    });

    const saved = localStorage.getItem(`dramain_progress_${this.videoFakeId}`);
    if (saved) {
      this.player.one('loadedmetadata', () => {
        this.player.currentTime(parseFloat(saved));
      });
    }
  }

  destroy() {
    if (this.player) {
      this.player.dispose();
    }
  }
}
