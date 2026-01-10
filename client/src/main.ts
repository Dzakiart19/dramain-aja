import './index.css';
import { Navbar } from './components/navbar';
import { RadReelAPI } from './api/radreel';
import { VideoPlayer } from './components/video-player';
import type { Drama } from './api/types';

new Navbar();

const app = document.getElementById('app')!;

async function router() {
  const hash = window.location.hash || '#/';
  const path = hash.split('?')[0];
  const params = new URLSearchParams(hash.split('?')[1]);

  app.innerHTML = '<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>';

  try {
    if (path === '#/') {
      await renderHome();
    } else if (path === '#/search') {
      await renderSearch(params.get('q') || '');
    } else if (path === '#/rank') {
      await renderRank();
    } else if (path.startsWith('#/drama/')) {
      const id = path.split('/')[2];
      await renderDetail(id);
    } else if (path.startsWith('#/play/')) {
      const id = path.split('/')[2];
      const seq = parseInt(params.get('seq') || '0');
      await renderPlayer(id, seq);
    } else {
      renderNotFound();
    }
  } catch (error) {
    console.error(error);
    app.innerHTML = `<div class="text-center p-10 text-red-500">Error: ${(error as Error).message}</div>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

async function renderHome() {
  const dramaList = await RadReelAPI.getHome(1, 20);
  
  // The API returns an array directly for Home, but let's be safe
  const list = Array.isArray(dramaList) ? dramaList : [];
  
  let html = `
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6 text-red-500 border-l-4 border-red-500 pl-3">Trending Updates</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${list.map(drama => dramaCard(drama)).join('')}
      </div>
    </div>
  `;
  app.innerHTML = html;
}

async function renderSearch(query: string) {
  if (!query) {
    app.innerHTML = '<div class="text-center p-10">Please enter a search term</div>';
    return;
  }
  
  const data = await RadReelAPI.searchDrama(query);
  const dramaList = data.compilationsInfoList || [];
  
  let html = `
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">Search Results: "${query}"</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${dramaList.map(drama => dramaCard(drama)).join('')}
      </div>
      ${dramaList.length === 0 ? '<p class="text-gray-400">No results found.</p>' : ''}
    </div>
  `;
  app.innerHTML = html;
}

async function renderRank() {
  const data = await RadReelAPI.getRanking(1, 1);
  const dramaList = data.compilationsInfoList || [];
  
  let html = `
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6 text-yellow-500">Top Rankings</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${dramaList.map((drama, index) => dramaCard(drama, index + 1)).join('')}
      </div>
    </div>
  `;
  app.innerHTML = html;
}

async function renderDetail(id: string) {
  const detail = await RadReelAPI.getDramaDetail(id);
  const episodesData = await RadReelAPI.getEpisodes(id);
  
  const episodesRaw = Array.isArray(episodesData) ? episodesData : (episodesData.episodes || []);
  
  // Create a clean list of episodes
  const episodes = episodesRaw.map((ep: any, index: number) => {
    // Priority for sequence: ep.sequence, then index, then ep.number - 1
    const sequence = typeof ep.sequence === 'number' ? ep.sequence : index;
    return {
      playId: detail.fakeId,
      number: typeof ep.sequence === 'number' ? ep.sequence + 1 : (ep.number || index + 1),
      title: ep.title || `Episode ${index + 1}`,
      sequence: sequence
    };
  });
  
  console.log('Final episodes map:', episodes);

  let html = `
    <div class="relative min-h-[60vh] w-full bg-black">
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
      <img src="${detail.coverImgUrl}" class="w-full h-full absolute inset-0 object-cover object-top opacity-40" />
      
      <div class="relative p-6 z-20 container mx-auto flex flex-col md:flex-row gap-8 items-end pt-32 pb-12">
        <div class="w-40 md:w-64 shrink-0 shadow-2xl rounded-xl overflow-hidden border border-white/10">
          <img src="${detail.coverImgUrl}" class="w-full h-full object-cover" />
        </div>
        
        <div class="flex-1 text-center md:text-left">
          <h1 class="text-3xl md:text-5xl font-black mb-4 text-white drop-shadow-lg">${detail.title}</h1>
          
          <div class="flex flex-wrap justify-center md:justify-start gap-3 mb-6 text-sm">
             <span class="bg-red-600 px-3 py-1 rounded-full text-white font-bold shadow-lg">${detail.uploadOfEpisodes || episodes.length} Episodes</span>
             <span class="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white border border-white/10">⭐ ${detail.compositeRating || '8.5'}</span>
             ${(detail.compilationsTags || []).map(tag => `<span class="bg-white/10 px-3 py-1 rounded-full text-gray-300 border border-white/5">${tag}</span>`).join('')}
          </div>
          
          <p class="text-gray-300 max-w-3xl mb-8 text-sm md:text-lg leading-relaxed line-clamp-4 md:line-clamp-none">
            ${detail.introduce || 'Tidak ada sinopsis tersedia.'}
          </p>
          
          <div class="flex flex-wrap justify-center md:justify-start gap-4">
            ${episodes.length > 0 ? `
              <a href="#/play/${episodes[0].playId}?seq=${episodes[0].sequence}" class="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-black text-lg inline-flex items-center gap-3 transition transform hover:scale-105 active:scale-95 shadow-xl">
                <span class="text-2xl">▶</span> MULAI NONTON
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12">
      <div class="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <h3 class="text-2xl font-bold flex items-center gap-3">
          <span class="w-2 h-8 bg-red-600 rounded-full"></span>
          Daftar Episode
        </h3>
        <span class="text-gray-500 font-medium">${episodes.length} Tersedia</span>
      </div>
      
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
        ${episodes.map(ep => `
          <a href="#/play/${ep.playId}?seq=${ep.sequence}" class="block aspect-square bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-500 rounded-2xl flex flex-col items-center justify-center transition group relative overflow-hidden">
            <div class="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-white/70">EPS</div>
            <div class="text-2xl font-black group-hover:text-white group-hover:scale-125 transition duration-300">${ep.number}</div>
            <div class="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition pointer-events-none"></div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
  app.innerHTML = html;
}

let currentPlayer: VideoPlayer | null = null;

async function renderPlayer(playId: string, seq: number) {
  // If we're already on the player page for the same drama, just update the episode
  if (currentPlayer && document.getElementById('video-container')) {
    const detail = await RadReelAPI.getDramaDetail(playId);
    const episodesData = await RadReelAPI.getEpisodes(playId);
    const episodesRaw = Array.isArray(episodesData) ? episodesData : (episodesData.episodes || []);
    const episodes = episodesRaw.map((ep: any, index: number) => ({
      number: typeof ep.sequence === 'number' ? ep.sequence + 1 : index + 1,
      sequence: typeof ep.sequence === 'number' ? ep.sequence : index
    }));
    const currentEp = episodes.find(e => e.sequence === seq) || episodes[0];
    
    // Update UI elements without full re-render
    const epTitle = document.querySelector('.text-red-500.font-bold.text-sm');
    if (epTitle) epTitle.textContent = `Episode ${currentEp.number}`;
    
    const epDisplay = document.querySelector('.bg-red-600.rounded-2xl.flex.items-center.justify-center');
    if (epDisplay) epDisplay.textContent = String(currentEp.number);
    
    const epInfo = document.querySelector('.text-white.font-bold:not(.text-xl)');
    if (epInfo && epInfo.previousElementSibling?.textContent?.includes('Sekarang')) {
      epInfo.textContent = `Episode ${currentEp.number}`;
    }

    // Update navigation buttons
    const navContainer = document.querySelector('.flex.gap-3');
    if (navContainer) {
      const nextEp = episodes.find(e => e.sequence === seq + 1);
      navContainer.innerHTML = `
        ${seq > 0 ? `
          <a href="#/play/${playId}?seq=${seq - 1}" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2 border border-white/5">
            ⏮ Prev
          </a>
        ` : ''}
        ${nextEp ? `
          <a id="next-episode-btn" href="#/play/${playId}?seq=${seq + 1}" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black transition flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95">
            Next Episode ⏭
          </a>
        ` : ''}
      `;
    }

    // Update episode grid highlight
    document.querySelectorAll('.grid-cols-4 a').forEach((a, i) => {
      if (i === seq) {
        a.className = 'block aspect-square bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20 border rounded-2xl flex items-center justify-center transition font-black text-lg';
      } else {
        a.className = 'block aspect-square bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 border rounded-2xl flex items-center justify-center transition font-black text-lg';
      }
    });

    currentPlayer.changeEpisode(playId, seq);
    return;
  }

  const detail = await RadReelAPI.getDramaDetail(playId);
  const episodesData = await RadReelAPI.getEpisodes(playId);
  const episodesRaw = Array.isArray(episodesData) ? episodesData : (episodesData.episodes || []);
  
  const episodes = episodesRaw.map((ep: any, index: number) => ({
    number: typeof ep.sequence === 'number' ? ep.sequence + 1 : index + 1,
    sequence: typeof ep.sequence === 'number' ? ep.sequence : index
  }));

  const currentEp = episodes.find(e => e.sequence === seq) || episodes[0];
  const nextEp = episodes.find(e => e.sequence === seq + 1);

  let html = `
    <div class="container mx-auto px-4 py-6 max-w-5xl">
       <div class="flex items-center gap-4 mb-6">
         <button onclick="history.back()" class="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
         </button>
         <div>
           <h2 class="text-xl md:text-2xl font-black text-white line-clamp-1">${detail.title}</h2>
           <p class="text-red-500 font-bold text-sm">Episode ${currentEp.number}</p>
         </div>
       </div>

       <div id="video-container" class="w-full aspect-[9/16] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/5 relative group">
          <!-- Video will be injected here -->
       </div>

       <div class="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
         <div class="flex items-center gap-4">
           <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/20">
             ${currentEp.number}
           </div>
           <div>
             <div class="text-gray-400 text-xs font-bold uppercase tracking-widest">Sekarang Memutar</div>
             <div class="text-white font-bold">Episode ${currentEp.number}</div>
           </div>
         </div>

         <div class="flex gap-3">
           ${seq > 0 ? `
             <a href="#/play/${playId}?seq=${seq - 1}" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2 border border-white/5">
               ⏮ Prev
             </a>
           ` : ''}
           
           ${nextEp ? `
             <a id="next-episode-btn" href="#/play/${playId}?seq=${seq + 1}" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black transition flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95">
               Next Episode ⏭
             </a>
           ` : ''}
         </div>
       </div>

       <div class="mt-12">
         <h3 class="text-xl font-bold mb-6 flex items-center gap-3">
           <span class="w-1.5 h-6 bg-red-600 rounded-full"></span>
           Pilih Episode
         </h3>
         <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
           ${episodes.map(ep => `
             <a href="#/play/${playId}?seq=${ep.sequence}" class="block aspect-square ${ep.sequence === seq ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400'} border rounded-2xl flex items-center justify-center transition font-black text-lg">
               ${ep.number}
             </a>
           `).join('')}
         </div>
       </div>
    </div>
  `;
  app.innerHTML = html;
  currentPlayer = new VideoPlayer('#video-container', playId, seq);
}

function renderNotFound() {
  app.innerHTML = `
    <div class="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p class="text-xl text-gray-400">Halaman tidak ditemukan</p>
      <a href="#/" class="mt-8 text-red-500 hover:underline">Kembali ke Home</a>
    </div>
  `;
}

function dramaCard(drama: Drama, rank?: number) {
  // Try to find episode count from various possible fields
  const epCount = drama.uploadOfEpisodes || drama.totalOfEpisodes || drama.updateOfEpisodes || 0;
  
  return `
    <a href="#/drama/${drama.fakeId}" class="group relative block rounded-2xl overflow-hidden bg-gray-900 aspect-[3/4] shadow-lg border border-white/5">
      <img src="${drama.coverImgUrl}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
      
      ${rank ? `
        <div class="absolute top-3 left-3 bg-red-600 text-white font-black w-8 h-8 flex items-center justify-center rounded-xl z-10 shadow-xl border border-white/20 text-sm">
          ${rank}
        </div>
      ` : ''}
      
      <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition duration-300">
        <h3 class="text-base font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-red-500 transition">${drama.title}</h3>
        <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span class="flex items-center gap-1"><span class="text-orange-500 text-xs">🔥</span> ${drama.hotValue || 'NEW'}</span>
          <span class="bg-white/10 px-2 py-0.5 rounded-md">${epCount} Eps</span>
        </div>
      </div>
    </a>
  `;
}
