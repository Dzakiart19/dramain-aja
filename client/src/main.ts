import './index.css';
import { Navbar } from './components/navbar';
import { RadReelAPI } from './api/radreel';
import { VideoPlayer } from './components/video-player';
import type { Drama } from './api/types';

// Init Navbar
new Navbar();

const app = document.getElementById('app')!;

// Simple Hash Router
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
      await renderPlayer(id);
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

// --- Page Renderers ---

async function renderHome() {
  const data = await RadReelAPI.getHome(1, 20);
  
  let html = `
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6 text-red-500 border-l-4 border-red-500 pl-3">Trending Updates</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${data.dramaList.map(dramaCard).join('')}
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
  
  let html = `
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">Search Results: "${query}"</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${data.dramaList.map(dramaCard).join('')}
      </div>
      ${data.dramaList.length === 0 ? '<p class="text-gray-400">No results found.</p>' : ''}
    </div>
  `;
  app.innerHTML = html;
}

async function renderRank() {
  const data = await RadReelAPI.getRanking(1, 1);
  
  let html = `
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6 text-yellow-500">Top Rankings</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${data.rankList.map((drama, index) => dramaCard(drama, index + 1)).join('')}
      </div>
    </div>
  `;
  app.innerHTML = html;
}

async function renderDetail(id: string) {
  const detail = await RadReelAPI.getDramaDetail(id);
  const episodes = await RadReelAPI.getEpisodes(id);
  
  let html = `
    <div class="relative h-[50vh] w-full">
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
      <img src="${detail.poster}" class="w-full h-full object-cover object-top opacity-50" />
      
      <div class="absolute bottom-0 left-0 right-0 p-6 z-20 container mx-auto flex gap-6 items-end">
        <img src="${detail.poster}" class="w-32 md:w-48 rounded-lg shadow-2xl hidden md:block" />
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-2">${detail.title}</h1>
          <div class="flex flex-wrap gap-2 mb-4 text-sm text-gray-300">
             <span class="bg-red-600 px-2 py-0.5 rounded text-white font-bold">${detail.rating}</span>
             <span>${detail.episodes} Eps</span>
             <span>${detail.status}</span>
             <span>${detail.genre.join(', ')}</span>
          </div>
          <p class="text-gray-300 line-clamp-3 md:line-clamp-none max-w-2xl mb-6">${detail.synopsis}</p>
          
          <a href="#/play/${episodes.episodes[0]?.videoFakeId || ''}" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold inline-flex items-center gap-2 transition">
            ▶ Play Episode 1
          </a>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <h3 class="text-xl font-bold mb-4">Episodes</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        ${episodes.episodes.map(ep => `
          <a href="#/play/${ep.videoFakeId}" class="block bg-gray-900 hover:bg-gray-800 rounded p-3 transition group">
            <div class="text-gray-400 text-xs mb-1">Episode</div>
            <div class="font-bold text-lg group-hover:text-red-500">${ep.number}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
  app.innerHTML = html;
}

async function renderPlayer(videoFakeId: string) {
  // Parsing dramaId from videoFakeId might be tricky if not standard, 
  // but for now let's just render the player.
  
  let html = `
    <div class="container mx-auto px-4">
       <div id="video-container" class="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6"></div>
       
       <button onclick="history.back()" class="text-gray-400 hover:text-white mb-4">← Back to Details</button>
    </div>
  `;
  app.innerHTML = html;
  
  // Initialize player
  new VideoPlayer('#video-container', videoFakeId);
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

// Helpers
function dramaCard(drama: Drama, rank?: number) {
  return `
    <a href="#/drama/${drama.id}" class="group relative block rounded-lg overflow-hidden bg-gray-900 aspect-[3/4]">
      <img src="${drama.poster}" loading="lazy" class="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
      
      ${rank ? `<div class="absolute top-0 left-0 bg-red-600 text-white font-bold w-8 h-8 flex items-center justify-center rounded-br-lg z-10">${rank}</div>` : ''}
      
      <div class="absolute bottom-0 left-0 right-0 p-3">
        <h3 class="text-sm font-bold truncate group-hover:text-red-500 transition">${drama.title}</h3>
        <div class="flex justify-between items-center text-xs text-gray-400 mt-1">
          <span>⭐ ${drama.rating}</span>
          <span>${drama.episodes} Eps</span>
        </div>
      </div>
    </a>
  `;
}
