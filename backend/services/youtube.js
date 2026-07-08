// Optional bonus feature (section 2.2): show YouTube videos about the searched
// location. Requires a free YouTube Data API v3 key. If no key is configured,
// this simply returns an empty list instead of crashing the app.

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export async function searchLocationVideos(locationName) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { enabled: false, videos: [] };
  }

  const url =
    `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=4` +
    `&q=${encodeURIComponent(locationName + " travel guide")}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { enabled: true, videos: [], error: "YouTube API request failed." };
  }

  const data = await response.json();
  const videos = (data.items || []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url,
    channel: item.snippet.channelTitle,
  }));

  return { enabled: true, videos };
}
