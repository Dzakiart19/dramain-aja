export interface Drama {
  id: string;
  title: string;
  poster: string;
  rating: number;
  episodes: number;
  status: string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  thumbnail: string;
  videoFakeId: string;
}

export interface Subtitle {
  language: string;
  url: string;
}

export interface HomeResponse {
  dramaList: Drama[];
  total: number;
}

export interface SearchResponse {
  dramaList: Drama[];
  total: number;
}

export interface RankResponse {
  rankList: Drama[];
  total: number;
}

export interface DramaDetailResponse {
  id: string;
  title: string;
  synopsis: string;
  cast: string[];
  genre: string[];
  poster: string;
  rating: number;
  episodes: number;
  status: string;
}

export interface EpisodesResponse {
  episodes: Episode[];
}

export interface VideoUrlResponse {
  url: string;
  subtitles: Subtitle[];
}

export interface RecommendResponse {
  recommendList: Drama[];
}
