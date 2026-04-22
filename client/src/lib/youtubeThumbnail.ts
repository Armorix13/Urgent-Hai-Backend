import type { Course } from "@/api/courseApi";

/** YouTube i.ytimg / img.youtube.com quality keys — order is randomized per video. */
const YT_QUALITIES = ["hqdefault", "mqdefault", "sddefault", "maxresdefault"] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Extract YouTube video id from common URL shapes (watch, embed, shorts, youtu.be).
 */
export function extractYoutubeVideoId(raw: string): string | null {
  const url = String(raw).trim();
  if (!url) return null;

  try {
    const u = new URL(url, "https://www.youtube.com");
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      if (id && /^[\w-]{10,}$/.test(id)) return id;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{10,}$/.test(v)) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return parts[1];
      if (parts[0] === "shorts" && parts[1]) return parts[1];
      if (parts[0] === "live" && parts[1]) return parts[1];
    }
  } catch {
    /* ignore */
  }

  const fromQuery = url.match(/[?&]v=([\w-]{10,})/);
  if (fromQuery?.[1]) return fromQuery[1];

  const fromShort = url.match(/youtu\.be\/([\w-]+)/i);
  if (fromShort?.[1]) return fromShort[1];

  return null;
}

/** YouTube poster CDN (`i.ytimg.com`) — several qualities per id, order shuffled. */
function youtubePosterCandidates(videoId: string): string[] {
  const qualities = shuffle([...YT_QUALITIES]);
  return qualities.map((q) => `https://i.ytimg.com/vi/${videoId}/${q}.jpg`);
}

/** Poster image URLs for a single video link (YouTube only; empty if not YouTube). */
export function buildVideoPosterUrls(videoUrl: string | null | undefined): string[] {
  const id = extractYoutubeVideoId(String(videoUrl ?? "").trim());
  if (!id) return [];
  return youtubePosterCandidates(id);
}

/** Embed URL for in-app playback, or `null` if not a YouTube URL. */
export function getYoutubeEmbedUrl(videoUrl: string | null | undefined): string | null {
  const id = extractYoutubeVideoId(String(videoUrl ?? "").trim());
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
}

function collectVideoUrls(course: Course): string[] {
  const urls: string[] = [];
  for (const v of course.videos ?? []) {
    const u = v.videoUrl?.trim();
    if (u) urls.push(u);
  }
  const cc = [...(course.courseContent ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  for (const item of cc) {
    const u = item.videoUrl?.trim();
    if (u) urls.push(u);
  }
  return urls;
}

/**
 * URLs to try on the course card, in order:
 * 1. Custom `thumbnail` (if any).
 * 2. Walk every video URL (playlist `videos[]`, then `courseContent[]` by `order`). For each
 *    **distinct** YouTube video id (first time that id appears), append shuffled `i.ytimg.com`
 *    poster URLs. If the first video is not YouTube, it is skipped and the next URL is used.
 *    If all poster sizes for one video fail to load, the card's `onError` advances to posters
 *    from the **next** YouTube video in the list.
 */
export function buildCourseThumbnailCandidates(course: Course): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const seenYoutubeIds = new Set<string>();

  const add = (u: string) => {
    const t = u.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };

  if (course.thumbnail?.trim()) {
    add(course.thumbnail.trim());
  }

  for (const url of collectVideoUrls(course)) {
    const id = extractYoutubeVideoId(url);
    if (!id) continue;
    if (seenYoutubeIds.has(id)) continue;
    seenYoutubeIds.add(id);

    for (const thumb of youtubePosterCandidates(id)) {
      add(thumb);
    }
  }

  return out;
}
