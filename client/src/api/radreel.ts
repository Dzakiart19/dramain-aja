import { API_BASE, BASE_URL, LANG } from './config';
import type { 
  HomeResponse, 
  SearchResponse, 
  RankResponse, 
  DramaDetailResponse, 
  EpisodesResult, 
  VideoUrlResponse, 
  RecommendResponse 
} from './types';

export class RadReelAPI {
  private static lastRequest = 0;
  private static RATE_LIMIT_MS = 500;

  private static async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const now = Date.now();
    if (now - this.lastRequest < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - (now - this.lastRequest);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequest = Date.now();

    const url = new URL(`${API_BASE}${endpoint}`);
    url.searchParams.set('lang', LANG);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    console.log(`🌐 [${new Date().toISOString()}] Request: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ [${new Date().toISOString()}] Response:`, data);
    return data;
  }

  public static async checkHealth() {
    return fetch(`${BASE_URL}/api/radreel/health`).then(r => r.json());
  }

  public static async getHome(page = 1, limit = 20): Promise<HomeResponse> {
    return this.request<HomeResponse>('/home', { tab: 17, page, limit });
  }

  public static async searchDrama(query: string, page = 1): Promise<SearchResponse> {
    if (!query || query.trim().length < 2) {
      throw new Error('Query minimal 2 karakter');
    }
    return this.request<SearchResponse>('/search', { q: query.trim(), page });
  }

  public static async getRanking(type = 1, page = 1): Promise<RankResponse> {
    return this.request<RankResponse>('/rank', { type, page });
  }

  public static async getDramaDetail(id: string): Promise<DramaDetailResponse> {
    return this.request<DramaDetailResponse>(`/drama/${id}`);
  }

  public static async getEpisodes(dramaId: string): Promise<EpisodesResult> {
    return this.request<EpisodesResult>(`/episodes/${dramaId}`);
  }

  public static async getVideoUrl(videoFakeId: string, seq = 0): Promise<VideoUrlResponse> {
    // If videoFakeId is not available, we can't play
    if (!videoFakeId || videoFakeId === 'undefined') {
      throw new Error('ID Video tidak valid');
    }
    return this.request<VideoUrlResponse>(`/play/${videoFakeId}`, { seq });
  }

  public static async getRecommendations(): Promise<RecommendResponse> {
    return this.request<RecommendResponse>('/recommend');
  }
}
