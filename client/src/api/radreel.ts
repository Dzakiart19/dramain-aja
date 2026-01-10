import { API_BASE, BASE_URL, LANG } from './config';
import type { 
  HomeResponse, 
  SearchResponse, 
  RankResponse, 
  DramaDetailResponse, 
  EpisodesResponse, 
  VideoUrlResponse, 
  RecommendResponse 
} from './types';

export class RadReelAPI {
  // Rate limiting
  private static lastRequest = 0;
  private static RATE_LIMIT_MS = 500;

  // Generic request handler
  private static async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    // Rate limit guard
    const now = Date.now();
    if (now - this.lastRequest < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - (now - this.lastRequest);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequest = Date.now();

    // Build full URL
    const url = new URL(`${API_BASE}${endpoint}`);
    url.searchParams.set('lang', LANG);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    console.log(`🌐 [${new Date().toISOString()}] Request: ${url.toString()}`);

    // Fetch dengan timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [${new Date().toISOString()}] Response:`, data);
      return data;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout (10s)');
      }
      console.error('API Error:', error);
      throw error;
    }
  }

  // 1. Health Check
  public static async checkHealth() {
    return fetch(`${BASE_URL}/api/radreel/health`).then(r => r.json());
  }

  // 2. Homepage
  public static async getHome(page = 1, limit = 20): Promise<HomeResponse> {
    return this.request<HomeResponse>('/home', { tab: 17, page, limit });
  }

  // 3. Search
  public static async searchDrama(query: string, page = 1): Promise<SearchResponse> {
    if (!query || query.trim().length < 3) {
      throw new Error('Query minimal 3 karakter');
    }
    return this.request<SearchResponse>('/search', { q: query.trim(), page });
  }

  // 4. Ranking
  public static async getRanking(type = 1, page = 1): Promise<RankResponse> {
    return this.request<RankResponse>('/rank', { type, page });
  }

  // 5. Drama Detail
  public static async getDramaDetail(id: string): Promise<DramaDetailResponse> {
    if (!id) throw new Error('Drama ID harus diisi');
    return this.request<DramaDetailResponse>(`/drama/${id}`);
  }

  // 6. Episodes
  public static async getEpisodes(dramaId: string): Promise<EpisodesResponse> {
    return this.request<EpisodesResponse>(`/episodes/${dramaId}`);
  }

  // 7. Video URL
  public static async getVideoUrl(videoFakeId: string, seq = 0): Promise<VideoUrlResponse> {
    return this.request<VideoUrlResponse>(`/play/${videoFakeId}`, { seq });
  }

  // 8. Recommendations
  public static async getRecommendations(): Promise<RecommendResponse> {
    return this.request<RecommendResponse>('/recommend');
  }
}
