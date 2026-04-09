/**
 * Wallpaper service — fetches Bing daily wallpapers via backend proxy.
 */

import apiService, { API_BASE_URL } from './apiService';

export interface BingWallpaper {
  url: string;           // Full-res URL via proxy
  title: string;
  copyright: string;
  thumbnailUrl: string;  // 400x240 thumbnail via proxy
  startdate: string;     // YYYYMMDD
}

interface BingApiResponse {
  images: Array<{
    url: string;
    urlbase: string;
    title: string;
    copyright: string;
    startdate: string;
  }>;
}

/**
 * Fetch latest Bing daily wallpapers (up to 8, most recent first).
 * idx=0 is today's wallpaper — updated daily by Bing.
 */
export async function fetchBingWallpapers(mkt: string = 'zh-CN'): Promise<BingWallpaper[]> {
  const data = await apiService.get<BingApiResponse>(
    `/api/wallpaper/daily?mkt=${encodeURIComponent(mkt)}&n=8&idx=0`
  );

  return (data.images || []).map(img => {
    const urlbase = img.urlbase.startsWith('/') ? img.urlbase : `/${img.urlbase}`;
    return {
      url: `${API_BASE_URL}/api/wallpaper/image?url=${encodeURIComponent(urlbase + '_UHD.jpg')}`,
      thumbnailUrl: `${API_BASE_URL}/api/wallpaper/image?url=${encodeURIComponent(urlbase + '_400x240.jpg')}`,
      title: img.title || '',
      copyright: img.copyright || '',
      startdate: img.startdate || '',
    };
  });
}

export default { fetchBingWallpapers };
