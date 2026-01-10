import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { RadReelAPI } from '../api/radreel';

export class VideoPlayer {
  private player: any;
  private videoFakeId: string;

  constructor(containerId: string, videoFakeId: string) {
    this.videoFakeId = videoFakeId;
    this.init(containerId);
  }

  private async init(containerId: string) {
    const container = document.querySelector(containerId);
    if (!container) return;
    
    // Request video URL + subtitles
    try {
      const videoData = await RadReelAPI.getVideoUrl(this.videoFakeId, 0);

      // Buat video element
      const videoId = `player-${this.videoFakeId}`;
      container.innerHTML = `<video id="${videoId}" class="video-js w-full h-full vjs-big-play-centered"></video>`;

      // Init Video.js
      this.player = videojs(videoId, {
        controls: true,
        autoplay: false,
        preload: 'metadata',
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5],
        controlBar: {
          skipButtons: { forward: 10, backward: 10 },
          volumePanel: { inline: false },
          pictureInPictureToggle: true,
        }
      });

      // Set HLS source
      this.player.src({
        src: videoData.url,
        type: 'application/x-mpegURL'
      });

      // Add subtitles
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
      container.innerHTML = `<div class="text-red-500 p-4">Error loading video. Please try again later.</div>`;
    }
  }

  private setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.player) return;
      
      switch(e.key) {
        case ' ': // Space
          e.preventDefault();
          this.player.paused() ? this.player.play() : this.player.pause();
          break;
        case 'ArrowLeft': // Skip -10s
          this.player.currentTime(this.player.currentTime() - 10);
          break;
        case 'ArrowRight': // Skip +10s
          this.player.currentTime(this.player.currentTime() + 10);
          break;
        case 'f': // Fullscreen
          this.player.requestFullscreen();
          break;
        case 'c': // Toggle subtitles
          const tracks = this.player.textTracks();
          for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = tracks[i].mode === 'showing' ? 'hidden' : 'showing';
          }
          break;
      }
    });
  }

  private setupProgress() {
    if (!this.player) return;
    
    this.player.on('timeupdate', () => {
      const current = this.player.currentTime();
      const duration = this.player.duration();
      
      if (current > 30) { // Simpan progress setelah 30 detik
        localStorage.setItem('dramain_progress', JSON.stringify({
          videoId: this.videoFakeId,
          timestamp: current,
          duration
        }));
      }
    });
  }

  destroy() {
    if (this.player) {
      this.player.dispose();
    }
  }
}
