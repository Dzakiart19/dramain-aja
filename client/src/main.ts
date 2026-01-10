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
  const episodes = episodesRaw.map((ep: any) => ({
    fakeId: ep.videoFakeId || ep.fakeId,
    number: typeof ep.sequence === 'number' ? ep.sequence + 1 : (ep.number || 1),
    title: ep.title,
    sequence: typeof ep.sequence === 'number' ? ep.sequence : 0
  }));
  
  console.log('Mapped episodes:', episodes);

  let html = `
    <div class="relative min-h-[50vh] w-full bg-black">
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
      <img src="${detail.coverImgUrl}" class="w-full h-full absolute inset-0 object-cover object-top opacity-30" />
      
      <div class="relative p-6 z-20 container mx-auto flex flex-col md:flex-row gap-6 items-end pt-24">
        <img src="${detail.coverImgUrl}" class="w-32 md:w-48 rounded-lg shadow-2xl border border-white/10" />
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-2 text-white">${detail.title}</h1>
          <div class="flex flex-wrap gap-2 mb-4 text-sm text-gray-300">
             <span class="bg-red-600 px-2 py-0.5 rounded text-white font-bold">${detail.uploadOfEpisodes || episodes.length} Eps</span>
             <span class="bg-white/10 px-2 py-0.5 rounded">${detail.compilationsTags?.join(', ') || ''}</span>
          </div>
          <p class="text-gray-300 max-w-2xl mb-6 text-sm md:text-base leading-relaxed">${detail.introduce || ''}</p>
          
          ${episodes.length > 0 && episodes[0].fakeId ? `
            <a href="#/play/${episodes[0].fakeId}?seq=${episodes[0].sequence}" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold inline-flex items-center gap-2 transition transform hover:scale-105">
              ▶ Play Episode 1
            </a>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
        <span class="w-1 h-6 bg-red-600 rounded-full"></span>
        Daftar Episode
      </h3>
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        ${episodes.map(ep => `
          <a href="#/play/${ep.fakeId || ''}?seq=${ep.sequence}" class="block bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-600 rounded-lg p-3 transition group text-center">
            <div class="text-gray-500 text-[10px] uppercase tracking-wider mb-1 group-hover:text-red-400">Episode</div>
            <div class="font-bold text-lg group-hover:text-white">${ep.number}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
  app.innerHTML = html;
}

async function renderPlayer(videoFakeId: string, seq: number) {
  let html = `
    <div class="container mx-auto px-4">
       <div id="video-container" class="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6"></div>
       <button onclick="history.back()" class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
          ← Kembali
       </button>
    </div>
  `;
  app.innerHTML = html;
  new VideoPlayer('#video-container', videoFakeId, seq);
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
  return `
    <a href="#/drama/${drama.fakeId}" class="group relative block rounded-lg overflow-hidden bg-gray-900 aspect-[3/4]">
      <img src="${drama.coverImgUrl}" loading="lazy" class="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
      
      ${rank ? `<div class="absolute top-2 left-2 bg-red-600 text-white font-bold w-7 h-7 flex items-center justify-center rounded-full z-10 shadow-lg border border-white/20 text-xs">${rank}</div>` : ''}
      
      <div class="absolute bottom-0 left-0 right-0 p-3">
        <h3 class="text-sm font-bold truncate group-hover:text-red-500 transition">${drama.title}</h3>
        <div class="flex justify-between items-center text-xs text-gray-400 mt-1">
          <span>🔥 ${drama.hotValue || ''}</span>
          <span>${drama.uploadOfEpisodes || 0} Eps</span>
        </div>
      </div>
    </a>
  `;
}
