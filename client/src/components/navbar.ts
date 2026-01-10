export class Navbar {
  constructor() {
    this.render();
    this.addListeners();
  }

  private render() {
    const nav = document.createElement('nav');
    nav.className = 'fixed top-0 left-0 right-0 bg-black/80 backdrop-blur z-50 border-b border-white/10 text-white';
    nav.innerHTML = `
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <a href="#/" class="text-xl font-bold text-red-500">DramaIn-Aja</a>
        
        <!-- Search Desktop -->
        <div class="hidden md:flex flex-1 max-w-md mx-4 relative">
          <input type="text" id="search-desktop" 
                 class="w-full bg-white/10 backdrop-blur rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                 placeholder="Cari drama...">
        </div>
        
        <!-- Menu Desktop -->
        <div class="hidden md:flex gap-6 font-medium">
          <a href="#/" class="hover:text-red-500 transition">Home</a>
          <a href="#/rank" class="hover:text-red-500 transition">Rank</a>
          <a href="#/bookmark" class="hover:text-red-500 transition">Bookmark</a>
        </div>
        
        <!-- Mobile Menu Button -->
        <button id="mobile-menu-btn" class="md:hidden text-2xl">☰</button>
      </div>
      
      <!-- Mobile Menu (Hidden by default) -->
      <div id="mobile-menu" class="hidden md:hidden bg-black/95 border-b border-white/10 p-4 absolute w-full">
         <div class="flex flex-col gap-4">
            <input type="text" id="search-mobile" 
                 class="w-full bg-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                 placeholder="Cari drama...">
            <a href="#/" class="block py-2">Home</a>
            <a href="#/rank" class="block py-2">Rank</a>
            <a href="#/bookmark" class="block py-2">Bookmark</a>
         </div>
      </div>
    `;
    document.body.prepend(nav);
  }

  private addListeners() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
      });
    }

    const handleSearch = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLInputElement;
        if (target.value.trim()) {
          window.location.hash = `#/search?q=${encodeURIComponent(target.value.trim())}`;
          if (menu) menu.classList.add('hidden'); // Close mobile menu
        }
      }
    };

    document.getElementById('search-desktop')?.addEventListener('keyup', handleSearch);
    document.getElementById('search-mobile')?.addEventListener('keyup', handleSearch);
  }
}
