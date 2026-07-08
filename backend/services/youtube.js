const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

const HTML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

function decodeHtmlEntities(str) {
  return str.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return HTML_ENTITIES[entity] ?? match;
  });
}

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
    title: decodeHtmlEntities(item.snippet.title),
    thumbnail: item.snippet.thumbnails?.medium?.url,
    channel: decodeHtmlEntities(item.snippet.channelTitle),
  }));

  return { enabled: true, videos };
}
