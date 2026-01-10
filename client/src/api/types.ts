export interface Drama {
  fakeId: string; // Used as ID in API responses
  title: string;
  coverImgUrl: string; // poster field name from API
  rating?: number; // might not exist in list
  hotValue?: string; // used in rank
  uploadOfEpisodes?: number; // episode count
  introduce?: string;
  compilationsTags?: string[];
  tagList?: string[];
}

export interface Episode {
  fakeId: string;
  number: number;
  title: string;
  introduce?: string;
}

export interface Subtitle {
  language: string;
  url: string;
}

export interface HomeResponse extends Array<Drama> {}

export interface SearchResponse {
  compilationsInfoList: Drama[];
  total: number;
}

export interface RankResponse {
  rankCode: string[];
  compilationsInfoList: Drama[];
}

export interface DramaDetailResponse {
  fakeId: string;
  title: string;
  introduce: string;
  coverImgUrl: string;
  uploadOfEpisodes: number;
  compilationsTags?: string[];
}

export interface EpisodesResponse {
  episodes: Episode[];
  dramaId?: string;
}

export type EpisodesResult = EpisodesResponse | Episode[];

export interface VideoUrlResponse {
  url: string;
  subtitles: Subtitle[];
}

export interface RecommendResponse extends Array<Drama> {}
