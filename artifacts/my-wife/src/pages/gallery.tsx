import { useState } from "react";
import { useLocation } from "wouter";
import { X, ArrowLeft, ArrowRight, Heart, Play } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const H = (p: string) => `${BASE}her/${p}`;

// ─── Photo Categories ─────────────────────────────────────────────────────────

type Photo = { id: string; src: string; label: string };
type Video = { id: string; poster: string; src: string; label: string };

const WEDDING: Photo[] = [
  { id: "w1", src: H("wedding-1.png"), label: "Our wedding day 💍" },
  { id: "w2", src: H("wedding-2.png"), label: "In the garden 🌸" },
  { id: "w3", src: H("wedding-3.png"), label: "At the altar ❤️" },
  { id: "w4", src: H("wedding-4.png"), label: "Beach ceremony 🌊" },
];

const CHURCH: Photo[] = [
  { id: "c1", src: H("church-1.png"), label: "Sunday worship 🙏" },
  { id: "c2", src: H("church-2.png"), label: "Morning prayer ✝️" },
  { id: "c3", src: H("church-3.png"), label: "After service 💕" },
];

const PARTY: Photo[] = [
  { id: "p1", src: H("party-1.png"), label: "Birthday night 🎉" },
  { id: "p2", src: H("party-2.png"), label: "Dancing 🎊" },
  { id: "p3", src: H("party-3.png"), label: "Rooftop vibes 🌃" },
  { id: "p4", src: "https://images.unsplash.com/photo-1529316738988-7e72b43fac68?w=600&auto=format&fit=crop&q=80", label: "New Year's 🥂" },
  { id: "p5", src: "https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=600&auto=format&fit=crop&q=80", label: "Celebration ✨" },
];

const CLUB: Photo[] = [
  { id: "cl1", src: "https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=600&auto=format&fit=crop&q=80", label: "Neon nights 💃" },
  { id: "cl2", src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80", label: "DJ set 🎶" },
  { id: "cl3", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80", label: "Dance floor 🌙" },
  { id: "cl4", src: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&auto=format&fit=crop&q=80", label: "VIP section 🥃" },
  { id: "cl5", src: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&auto=format&fit=crop&q=80", label: "Late nights 🌟" },
];

const SCHOOL: Photo[] = [
  { id: "s1", src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&auto=format&fit=crop&q=80", label: "Campus life 📚" },
  { id: "s2", src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80", label: "Studying hard 📖" },
  { id: "s3", src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80", label: "Graduation day 🎓" },
  { id: "s4", src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80", label: "Lecture hall 🏫" },
  { id: "s5", src: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&auto=format&fit=crop&q=80", label: "Coffee & books ☕" },
];

const DAILY: Photo[] = [
  { id: "d1", src: "https://images.unsplash.com/photo-1493925410384-84f842e616fb?w=600&auto=format&fit=crop&q=80", label: "Morning coffee ☕" },
  { id: "d2", src: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80", label: "Cooking 🍳" },
  { id: "d3", src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&auto=format&fit=crop&q=80", label: "Morning yoga 🧘" },
  { id: "d4", src: "https://images.unsplash.com/photo-1522199710521-72d69614c702?w=600&auto=format&fit=crop&q=80", label: "Working 💻" },
  { id: "d5", src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&auto=format&fit=crop&q=80", label: "Shopping 🛍️" },
  { id: "d6", src: "https://images.unsplash.com/photo-1516455207990-7a41ce80f7ee?w=600&auto=format&fit=crop&q=80", label: "Reading 📖" },
  { id: "d7", src: "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=600&auto=format&fit=crop&q=80", label: "Park walk 🌿" },
  { id: "d8", src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&auto=format&fit=crop&q=80", label: "Running 🏃" },
];

const GLAM: Photo[] = [
  { id: "g1", src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80", label: "Looking gorgeous 🔥" },
  { id: "g2", src: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=600&auto=format&fit=crop&q=80", label: "Hot stuff 💋" },
  { id: "g3", src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80", label: "Photoshoot 📸" },
  { id: "g4", src: "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&auto=format&fit=crop&q=80", label: "Natural beauty ✨" },
  { id: "g5", src: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&auto=format&fit=crop&q=80", label: "She's everything 💕" },
  { id: "g6", src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80", label: "Stunning 💫" },
];

// ─── Videos ──────────────────────────────────────────────────────────────────

const VIDEOS: Video[] = [
  { id: "v1", poster: H("party-1.png"), src: "https://videos.pexels.com/video-files/3121461/3121461-hd_1280_720_30fps.mp4", label: "Birthday dance 🎉" },
  { id: "v2", poster: H("daily-1.png"), src: "https://videos.pexels.com/video-files/4473545/4473545-hd_1280_720_25fps.mp4", label: "Morning routine ☀️" },
  { id: "v3", poster: H("church-1.png"), src: "https://videos.pexels.com/video-files/3040284/3040284-hd_1280_720_25fps.mp4", label: "Sunday walk 🌿" },
  { id: "v4", poster: H("school-1.png"), src: "https://videos.pexels.com/video-files/4812205/4812205-hd_1280_720_25fps.mp4", label: "Study session 📚" },
  { id: "v5", poster: H("wedding-2.png"), src: "https://videos.pexels.com/video-files/3214660/3214660-hd_1280_720_25fps.mp4", label: "Wedding day 💍" },
  { id: "v6", poster: H("party-3.png"), src: "https://videos.pexels.com/video-files/4608164/4608164-hd_1280_720_25fps.mp4", label: "Rooftop night 🌙" },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "wedding" | "church" | "party" | "club" | "school" | "daily" | "glam" | "videos";

const TABS: { key: Tab; label: string; count: number }[] = [
  { key: "wedding", label: "💍 Wedding", count: WEDDING.length },
  { key: "church",  label: "⛪ Church",  count: CHURCH.length },
  { key: "party",   label: "🎉 Party",   count: PARTY.length },
  { key: "club",    label: "🎊 Club",    count: CLUB.length },
  { key: "school",  label: "📚 School",  count: SCHOOL.length },
  { key: "daily",   label: "☀️ Daily",   count: DAILY.length },
  { key: "glam",    label: "🔥 Glam",    count: GLAM.length },
  { key: "videos",  label: "🎬 Videos",  count: VIDEOS.length },
];

function photosFor(tab: Tab): Photo[] {
  switch (tab) {
    case "wedding": return WEDDING;
    case "church":  return CHURCH;
    case "party":   return PARTY;
    case "club":    return CLUB;
    case "school":  return SCHOOL;
    case "daily":   return DAILY;
    case "glam":    return GLAM;
    default:        return [];
  }
}

const ALL_PHOTOS: Photo[] = [...WEDDING, ...CHURCH, ...PARTY, ...CLUB, ...SCHOOL, ...DAILY, ...GLAM];
const PROFILE = H("wedding-2.png");

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("wedding");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [videoIdx, setVideoIdx] = useState<number | null>(null);

  const openPhoto = (photo: Photo) => {
    const gi = ALL_PHOTOS.findIndex((p) => p.id === photo.id);
    setLightboxIdx(gi);
  };

  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx(((lightboxIdx ?? 0) - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length);
  const next = () => setLightboxIdx(((lightboxIdx ?? 0) + 1) % ALL_PHOTOS.length);

  const photos = photosFor(tab);

  return (
    <div className="app-shell">
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="chat-card gallery-card">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <button className="icon-btn" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="header-title">Gallery <Heart className="header-heart" /></h1>
              <p className="header-status">{ALL_PHOTOS.length} photos · {VIDEOS.length} videos</p>
            </div>
          </div>
        </header>

        {/* Profile hero */}
        <div className="gallery-hero">
          <img src={PROFILE} alt="My wife" className="gallery-profile-img" />
          <div className="gallery-profile-info">
            <p className="gallery-profile-name">My Wife</p>
            <p className="gallery-profile-sub">Always in my heart ❤️</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="gallery-tabbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`gallery-tab ${tab === t.key ? "gallery-tab-active" : ""}`}
              onClick={() => setTab(t.key)}
              data-testid={`tab-${t.key}`}
            >
              {t.label} <span className="tab-count">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Grid or video grid */}
        <div className="gallery-grid-area">
          {tab === "videos" ? (
            <div className="gallery-grid">
              {VIDEOS.map((v, i) => (
                <button key={v.id} className="gallery-cell video-cell" onClick={() => setVideoIdx(i)}>
                  <img src={v.poster} alt={v.label} className="gallery-cell-img" loading="lazy" />
                  <div className="video-play-overlay">
                    <Play size={28} fill="white" color="white" />
                  </div>
                  <div className="gallery-cell-overlay">
                    <span className="gallery-cell-label">{v.label}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="gallery-grid">
              {photos.map((photo) => (
                <button key={photo.id} className="gallery-cell" onClick={() => openPhoto(photo)} data-testid={`img-${photo.id}`}>
                  <img src={photo.src} alt={photo.label} className="gallery-cell-img" loading="lazy" />
                  <div className="gallery-cell-overlay">
                    <span className="gallery-cell-label">{photo.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxIdx !== null && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><X size={22} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }}><ArrowLeft size={22} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={ALL_PHOTOS[lightboxIdx].src} alt={ALL_PHOTOS[lightboxIdx].label} className="lightbox-img" />
            <p className="lightbox-label">{ALL_PHOTOS[lightboxIdx].label}</p>
            <p className="lightbox-counter">{lightboxIdx + 1} / {ALL_PHOTOS.length}</p>
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }}><ArrowRight size={22} /></button>
        </div>
      )}

      {/* Video lightbox */}
      {videoIdx !== null && (
        <div className="lightbox" onClick={() => setVideoIdx(null)}>
          <button className="lightbox-close" onClick={() => setVideoIdx(null)}><X size={22} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <video
              src={VIDEOS[videoIdx].src}
              poster={VIDEOS[videoIdx].poster}
              controls
              autoPlay
              className="lightbox-img"
              style={{ background: "#000" }}
            />
            <p className="lightbox-label">{VIDEOS[videoIdx].label}</p>
            <p className="lightbox-counter">Video {videoIdx + 1} / {VIDEOS.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
