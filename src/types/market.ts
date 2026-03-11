export interface MarketSignal {
  platform: string;
  postText: string;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  scrapedAt: Date;
}
