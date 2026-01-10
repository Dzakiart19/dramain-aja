import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { RadReelAPI } from '../api/radreel';

export class VideoPlayer {
  private player: any;
  private videoFakeId: string;
  private seq: number;

  constructor(containerId: string, videoFakeId: string, seq = 0) {
    this.videoFakeId = videoFakeId;
    this.seq = seq;
    this.init(containerId);
  }

  private async init(containerId: string) {
    const container = document.querySelector(containerId);
    if (!container) return;
    
    try {
      const videoData = await RadReelAPI.getVideoUrl(this.videoFakeId, this.seq);

      if (!videoData || !videoData.url) {
        throw new Error("No video URL found");
      }

      const videoId = `player-${this.videoFakeId}`;
      container.innerHTML = `<video id="${videoId}" class="video-js w-full h-full vjs-big-play-centered"></video>`;

      this.player = videojs(videoId, {
        controls: true,
        autoplay: true,
        preload: 'auto',
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          skipButtons: { forward: 10, backward: 10 },
          volumePanel: { inline: false },
          pictureInPictureToggle: true,
        }
      });

      this.player.src({
        src: videoData.url,
        type: 'application/x-mpegURL'
      });

      videoData.subtitles?.forEach(sub => {
        this.player.addRemoteTextTrack({
          kind: 'subtitles',
          src: sub.url,
          srclang: sub.language,
          label: sub.language.toUpperCase(),
          default: sub.language === 'id'
        }, false);
      });

      this.setupKeyboard();
      this.setupProgress();
    } catch (e) {
      console.error("Failed to load video", e);
      container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-red-500 p-4 text-center">
        <p class="text-xl font-bold mb-2">Gagal memuat video</p>
        <p class="text-sm opacity-70">${(e as Error).message}</p>
        <button onclick="location.reload()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg">Coba Lagi</button>
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
