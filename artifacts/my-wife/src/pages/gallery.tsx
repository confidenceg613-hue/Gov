import { useState } from "react";
import { useLocation } from "wouter";
import { X, ArrowLeft, ArrowRight, Heart } from "lucide-react";

const PROFILE_PHOTO = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80";

const OUTDOOR_PHOTOS = [
  { id: "outdoor-1",  src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80", label: "Mountain escape" },
  { id: "outdoor-2",  src: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=600&auto=format&fit=crop&q=80", label: "Lakeside morning" },
  { id: "outdoor-3",  src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80", label: "Forest walk" },
  { id: "outdoor-4",  src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop&q=80", label: "Serene valley" },
  { id: "outdoor-5",  src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80", label: "Open road" },
  { id: "outdoor-6",  src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80", label: "Golden hour" },
  { id: "outdoor-7",  src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&auto=format&fit=crop&q=80", label: "Wild blooms" },
  { id: "outdoor-8",  src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&auto=format&fit=crop&q=80", label: "Hidden waterfall" },
  { id: "outdoor-9",  src: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop&q=80", label: "Wildflower field" },
  { id: "outdoor-10", src: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80", label: "Misty forest" },
  { id: "outdoor-11", src: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&auto=format&fit=crop&q=80", label: "Sunset coast" },
  { id: "outdoor-12", src: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=600&auto=format&fit=crop&q=80", label: "Afternoon light" },
  { id: "outdoor-13", src: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&auto=format&fit=crop&q=80", label: "Open sky" },
  { id: "outdoor-14", src: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop&q=80", label: "Countryside" },
  { id: "outdoor-15", src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&auto=format&fit=crop&q=80", label: "Morning light" },
  { id: "outdoor-16", src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80", label: "Starry peaks" },
  { id: "outdoor-17", src: "https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=600&auto=format&fit=crop&q=80", label: "Ocean breeze" },
  { id: "outdoor-18", src: "https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?w=600&auto=format&fit=crop&q=80", label: "Autumn path" },
  { id: "outdoor-19", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", label: "Evening sky" },
  { id: "outdoor-20", src: "https://images.unsplash.com/photo-1500534314209-a157d0e62e75?w=600&auto=format&fit=crop&q=80", label: "Meadow peace" },
];

const INDOOR_PHOTOS = [
  { id: "indoor-1",  src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80", label: "Cozy living room" },
  { id: "indoor-2",  src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop&q=80", label: "Morning kitchen" },
  { id: "indoor-3",  src: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&auto=format&fit=crop&q=80", label: "Soft bedroom" },
  { id: "indoor-4",  src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80", label: "Warm evenings" },
  { id: "indoor-5",  src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80", label: "Coffee ritual" },
  { id: "indoor-6",  src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80", label: "Quiet mornings" },
  { id: "indoor-7",  src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80", label: "Date night" },
  { id: "indoor-8",  src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop&q=80", label: "Candlelit" },
  { id: "indoor-9",  src: "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=600&auto=format&fit=crop&q=80", label: "Cooking together" },
  { id: "indoor-10", src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80", label: "Our café" },
  { id: "indoor-11", src: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80", label: "Window light" },
  { id: "indoor-12", src: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80", label: "Home" },
  { id: "indoor-13", src: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=600&auto=format&fit=crop&q=80", label: "Afternoon tea" },
  { id: "indoor-14", src: "https://images.unsplash.com/photo-1547558902-a77ea42e5fa0?w=600&auto=format&fit=crop&q=80", label: "Fresh blooms" },
  { id: "indoor-15", src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80", label: "Cozy corner" },
  { id: "indoor-16", src: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80", label: "Warm lights" },
  { id: "indoor-17", src: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&auto=format&fit=crop&q=80", label: "Sunday morning" },
  { id: "indoor-18", src: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&auto=format&fit=crop&q=80", label: "Our space" },
  { id: "indoor-19", src: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop&q=80", label: "Lazy Sunday" },
  { id: "indoor-20", src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80", label: "Evening light" },
];

const ALL_PHOTOS = [...OUTDOOR_PHOTOS, ...INDOOR_PHOTOS];

type Tab = "outdoor" | "indoor";

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("outdoor");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos = activeTab === "outdoor" ? OUTDOOR_PHOTOS : INDOOR_PHOTOS;

  const openLightbox = (localIndex: number) => {
    const photo = photos[localIndex];
    const globalIndex = ALL_PHOTOS.findIndex((p) => p.id === photo.id);
    setLightboxIndex(globalIndex);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length);
  };

  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % ALL_PHOTOS.length);
  };

  return (
    <div className="app-shell">
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="chat-card gallery-card">
        {/* Gallery Header */}
        <header className="chat-header">
          <div className="header-left">
            <button className="icon-btn" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="header-title">
                Gallery <Heart className="header-heart" />
              </h1>
              <p className="header-status">{ALL_PHOTOS.length} photos</p>
            </div>
          </div>
        </header>

        {/* Profile hero */}
        <div className="gallery-hero">
          <img
            src={PROFILE_PHOTO}
            alt="My wife"
            className="gallery-profile-img"
            data-testid="img-profile"
          />
          <div className="gallery-profile-info">
            <p className="gallery-profile-name">My Wife</p>
            <p className="gallery-profile-sub">Always in my heart ❤️</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="gallery-tabs">
          <button
            className={`gallery-tab ${activeTab === "outdoor" ? "gallery-tab-active" : ""}`}
            onClick={() => setActiveTab("outdoor")}
            data-testid="tab-outdoor"
          >
            Outdoor ({OUTDOOR_PHOTOS.length})
          </button>
          <button
            className={`gallery-tab ${activeTab === "indoor" ? "gallery-tab-active" : ""}`}
            onClick={() => setActiveTab("indoor")}
            data-testid="tab-indoor"
          >
            Indoor ({INDOOR_PHOTOS.length})
          </button>
        </div>

        {/* Grid */}
        <div className="gallery-grid-area">
          <div className="gallery-grid">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                className="gallery-cell"
                onClick={() => openLightbox(i)}
                data-testid={`img-gallery-${photo.id}`}
              >
                <img src={photo.src} alt={photo.label} className="gallery-cell-img" loading="lazy" />
                <div className="gallery-cell-overlay">
                  <span className="gallery-cell-label">{photo.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="lightbox" onClick={closeLightbox} data-testid="lightbox">
          <button className="lightbox-close" onClick={closeLightbox} data-testid="button-lightbox-close">
            <X size={22} />
          </button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }} data-testid="button-lightbox-prev">
            <ArrowLeft size={22} />
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={ALL_PHOTOS[lightboxIndex].src.replace("w=600", "w=1200")}
              alt={ALL_PHOTOS[lightboxIndex].label}
              className="lightbox-img"
            />
            <p className="lightbox-label">{ALL_PHOTOS[lightboxIndex].label}</p>
            <p className="lightbox-counter">{lightboxIndex + 1} / {ALL_PHOTOS.length}</p>
          </div>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }} data-testid="button-lightbox-next">
            <ArrowRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
