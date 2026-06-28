import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { X, ArrowLeft, ArrowRight, Heart, Play } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const H = (p: string) => `${BASE}her/${p}`;
const U = (id: string, w = 600) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

type Photo = { id: string; src: string; label: string; ai?: boolean };
type Video = { id: string; poster: string; src: string; label: string };

// ── AI-generated photos ──────────────────────────────────────────────────────

const AI_WEDDING: Photo[] = [
  { id: "w1", src: H("wedding-1.png"), label: "Our big day 💍", ai: true },
  { id: "w2", src: H("wedding-2.png"), label: "Rose garden 🌸", ai: true },
  { id: "w3", src: H("wedding-3.png"), label: "At the altar ❤️", ai: true },
  { id: "w4", src: H("wedding-4.png"), label: "Beach ceremony 🌊", ai: true },
];

const AI_CHURCH: Photo[] = [
  { id: "ch1", src: H("church-1.png"), label: "Sunday worship 🙏", ai: true },
  { id: "ch2", src: H("church-2.png"), label: "Morning prayer ✝️", ai: true },
  { id: "ch3", src: H("church-3.png"), label: "After service 💕", ai: true },
  { id: "ch4", src: H("church-4.png"), label: "Easter Sunday 🌼", ai: true },
];

const AI_PARTY: Photo[] = [
  { id: "pt1", src: H("party-1.png"), label: "Birthday night 🎉", ai: true },
  { id: "pt2", src: H("party-2.png"), label: "Dancing 🎊", ai: true },
  { id: "pt3", src: H("party-3.png"), label: "Rooftop vibes 🌃", ai: true },
  { id: "pt4", src: H("party-4.png"), label: "Gallery opening 🥂", ai: true },
  { id: "pt5", src: H("party-5.png"), label: "My birthday girl 🎂", ai: true },
];

const AI_CLUB: Photo[] = [
  { id: "cl1", src: H("club-4.png"), label: "Dance floor queen 💃", ai: true },
];

const AI_SCHOOL: Photo[] = [
  { id: "sc1", src: H("school-4.png"), label: "Campus walk 📚", ai: true },
  { id: "sc2", src: H("school-5.png"), label: "Library session 📖", ai: true },
];

const AI_DAILY: Photo[] = [
  { id: "dl1", src: H("daily-5.png"), label: "Morning coffee ☕", ai: true },
  { id: "dl2", src: H("daily-6.png"), label: "Rainy day 🌧️", ai: true },
  { id: "dl3", src: H("daily-7.png"), label: "Street market 🧺", ai: true },
  { id: "dl4", src: H("daily-8.png"), label: "Baking time 🍞", ai: true },
];

const AI_HOT: Photo[] = [
  { id: "ht1", src: H("hot-1.png"), label: "Date night 🕯️", ai: true },
  { id: "ht2", src: H("hot-2.png"), label: "Luxury hotel 🥂", ai: true },
  { id: "ht3", src: H("hot-3.png"), label: "City balcony 🌙", ai: true },
  { id: "hg1", src: H("glam-1.png"), label: "Studio shoot ✨", ai: true },
];

const AI_OUTDOOR: Photo[] = [
  { id: "od1", src: H("outdoor-1.png"), label: "Rooftop sunset 🌇", ai: true },
  { id: "od2", src: H("outdoor-2.png"), label: "Morning run 🏃", ai: true },
  { id: "od3", src: H("outdoor-3.png"), label: "Beach day 🌊", ai: true },
  { id: "od4", src: H("outdoor-4.png"), label: "Mountain hike 🏔️", ai: true },
];

const AI_SELFIE: Photo[] = [
  { id: "sf1", src: H("selfie-1.png"), label: "Bathroom mirror 📱", ai: true },
  { id: "sf2", src: H("selfie-2.png"), label: "Gym check-in 💪", ai: true },
];

// ── Curated Unsplash lifestyle photos ────────────────────────────────────────

const US_WEDDING: Photo[] = [
  { id: "uw1", src: U("photo-1519225421980-715cb0215aed"), label: "Bridal portrait 👰" },
  { id: "uw2", src: U("photo-1465495976277-4387d4b0b4c6"), label: "Wedding flowers 🌹" },
  { id: "uw3", src: U("photo-1511285560929-80b456503681"), label: "Wedding kiss 💋" },
  { id: "uw4", src: U("photo-1550005809-91ad75fb315f"), label: "Wedding dress 🤍" },
  { id: "uw5", src: U("photo-1606216794074-735e91aa2c92"), label: "Bride laughing 😄" },
  { id: "uw6", src: U("photo-1583939003579-730e3918a45a"), label: "Reception dance 💃" },
  { id: "uw7", src: U("photo-1529543544282-ea669407fca3"), label: "Bridal prep 💄" },
  { id: "uw8", src: U("photo-1591604129939-f1efa4d9f7fa"), label: "Ring close-up 💍" },
  { id: "uw9", src: U("photo-1548142813-c348350df52b"), label: "First dance 🕺" },
  { id: "uw10", src: U("photo-1526047932273-341f2a7631f9"), label: "Confetti moment 🎊" },
  { id: "uw11", src: U("photo-1487530811015-780eb19780a8"), label: "Outdoor vows 🌿" },
];

const US_CHURCH: Photo[] = [
  { id: "uc1", src: U("photo-1438232992991-995b671a1895"), label: "Sunday blessing 🕊️" },
  { id: "uc2", src: U("photo-1507003211169-0a1dd7228f2d"), label: "Quiet prayer 🙏" },
  { id: "uc3", src: U("photo-1504439468489-c8920d796a29"), label: "Cathedral light ✝️" },
  { id: "uc4", src: U("photo-1577495508048-b635879837f1"), label: "Church garden 🌸" },
  { id: "uc5", src: U("photo-1533000759938-aa0ba70beceb"), label: "Evening service 🕯️" },
  { id: "uc6", src: U("photo-1601662528567-526cd06f6582"), label: "Worship night 🎶" },
];

const US_PARTY: Photo[] = [
  { id: "up1", src: U("photo-1529316738988-7e72b43fac68"), label: "New Year's 🥂" },
  { id: "up2", src: U("photo-1528495612343-9ca9f4a4de28"), label: "Confetti rain 🎊" },
  { id: "up3", src: U("photo-1551882547-ff40c63fe2b4"), label: "Pool party 🏊" },
  { id: "up4", src: U("photo-1566737236500-c8ac43014a67"), label: "Concert crowd 🎵" },
  { id: "up5", src: U("photo-1540575467063-178a50c2df87"), label: "Festival vibes 🌟" },
  { id: "up6", src: U("photo-1470225620780-dba8ba36b745"), label: "Music festival 🎸" },
  { id: "up7", src: U("photo-1505236858219-8359eb29e329"), label: "Garden party 🌼" },
  { id: "up8", src: U("photo-1504674900247-0877df9cc836"), label: "Birthday cake 🎂" },
  { id: "up9", src: U("photo-1519671482749-fd09be7ccebf"), label: "Party dance 💃" },
  { id: "up10", src: U("photo-1549451371-64aa98a6f660"), label: "Balloon pop 🎈" },
];

const US_CLUB: Photo[] = [
  { id: "ucl1", src: U("photo-1545128485-c400ce7b23d5"), label: "Neon nights 💜" },
  { id: "ucl2", src: U("photo-1516450360452-9312f5e86fc7"), label: "Dance floor 🌙" },
  { id: "ucl3", src: U("photo-1571266028243-e4733b0f0bb0"), label: "VIP section 🥃" },
  { id: "ucl4", src: U("photo-1493676304819-0d7a8d026dcf"), label: "Late nights ⚡" },
  { id: "ucl5", src: U("photo-1574391884720-bbc3740c59d1"), label: "Rave lights 🔮" },
  { id: "ucl6", src: U("photo-1508700115892-45ecd05ae2ad"), label: "DJ booth 🎧" },
  { id: "ucl7", src: U("photo-1547826039-bdbba0e31aaa"), label: "Club vibes 🪩" },
  { id: "ucl8", src: U("photo-1573126617899-41f1dffb196c"), label: "Smoke machine 🌫️" },
  { id: "ucl9", src: U("photo-1537907690979-7e74a1a3e44d"), label: "Night out 🌃" },
  { id: "ucl10", src: U("photo-1504593811423-6dd665756598"), label: "After midnight 🌚" },
  { id: "ucl11", src: U("photo-1560328055-e938bb2ed50a"), label: "Cocktail hour 🍸" },
  { id: "ucl12", src: U("photo-1533174072545-7a4b6ad7a6c3"), label: "Glitter night ✨" },
  { id: "ucl13", src: U("photo-1531058020387-3be344556be6"), label: "Club glow 🟣" },
  { id: "ucl14", src: U("photo-1516997121675-4c2d1684aa3e"), label: "Disco mirror 🪞" },
];

const US_SCHOOL: Photo[] = [
  { id: "us1", src: U("photo-1523580494863-6f3031224c94"), label: "Campus vibes 🎒" },
  { id: "us2", src: U("photo-1434030216411-0b793f4b4173"), label: "Study mode 📖" },
  { id: "us3", src: U("photo-1551836022-d5d88e9218df"), label: "Graduation 🎓" },
  { id: "us4", src: U("photo-1509062522246-3755977927d7"), label: "Lecture hall 🏫" },
  { id: "us5", src: U("photo-1488190211105-8b0e65b80b4e"), label: "Coffee & study ☕" },
  { id: "us6", src: U("photo-1427504494785-3a9ca7044f45"), label: "Notebook open 📓" },
  { id: "us7", src: U("photo-1580582932707-520aed937b7b"), label: "Chemistry lab 🔬" },
  { id: "us8", src: U("photo-1546410531-bb4caa6b424d"), label: "Class day 📚" },
  { id: "us9", src: U("photo-1601979031925-424e53b6caaa"), label: "Dorm life 🛏️" },
  { id: "us10", src: U("photo-1507679799987-c73779587ccf"), label: "Presentation day 🎤" },
  { id: "us11", src: U("photo-1453733190371-0a9bedd82893"), label: "Campus walk 🌤️" },
  { id: "us12", src: U("photo-1536240478700-b869ad10e2ab"), label: "Finals week 😤" },
  { id: "us13", src: U("photo-1497633762265-9d179a990aa6"), label: "Book lover 📕" },
];

const US_DAILY: Photo[] = [
  { id: "ud1",  src: U("photo-1493925410384-84f842e616fb"), label: "Morning coffee ☕" },
  { id: "ud2",  src: U("photo-1543339308-43e59d6b73a6"), label: "Cooking time 🍳" },
  { id: "ud3",  src: U("photo-1545205597-3d9d02c29597"), label: "Yoga morning 🧘" },
  { id: "ud4",  src: U("photo-1522199710521-72d69614c702"), label: "Work from home 💻" },
  { id: "ud5",  src: U("photo-1560472354-b33ff0c44a43"), label: "Shopping day 🛍️" },
  { id: "ud6",  src: U("photo-1516455207990-7a41ce80f7ee"), label: "Reading time 📚" },
  { id: "ud7",  src: U("photo-1514315384763-ba401779410f"), label: "Park stroll 🌿" },
  { id: "ud8",  src: U("photo-1503023345310-bd7c1de61c7d"), label: "Stretching 🤸" },
  { id: "ud9",  src: U("photo-1512621776951-a57141f2eefd"), label: "Healthy meal 🥗" },
  { id: "ud10", src: U("photo-1506126613408-eca07ce68773"), label: "Meditation 🧘" },
  { id: "ud11", src: U("photo-1507209696998-e4e42d02b2e3"), label: "Bubble bath 🛁" },
  { id: "ud12", src: U("photo-1517705008128-361805f42e86"), label: "Home nails 💅" },
  { id: "ud13", src: U("photo-1549038905-f42f2ab9de3e"), label: "Candle night 🕯️" },
  { id: "ud14", src: U("photo-1484723091739-30a097e8f929"), label: "Breakfast in bed 🥐" },
  { id: "ud15", src: U("photo-1496181133206-80ce9b88a853"), label: "Journaling 📔" },
  { id: "ud16", src: U("photo-1575052814086-f385e2e2ad1b"), label: "Art time 🎨" },
  { id: "ud17", src: U("photo-1556909114-f6e7ad7d3136"), label: "Cozy corner 🏠" },
  { id: "ud18", src: U("photo-1540518614846-7eded433c457"), label: "Window morning 🌤️" },
  { id: "ud19", src: U("photo-1510915361894-db8b60106cb1"), label: "Playlist mood 🎵" },
  { id: "ud20", src: U("photo-1534528741775-53994a69daeb"), label: "Night skincare ✨" },
];

const US_HOT: Photo[] = [
  { id: "uht1",  src: U("photo-1524504388940-b1c1722653e1"), label: "Photoshoot 📸" },
  { id: "uht2",  src: U("photo-1520813792240-56fc4a3765a7"), label: "Summer vibes 🌞" },
  { id: "uht3",  src: U("photo-1529626455594-4ff0802cfb7e"), label: "Fashion shoot 💋" },
  { id: "uht4",  src: U("photo-1488716820095-cbe80883c496"), label: "Natural beauty 🌸" },
  { id: "uht5",  src: U("photo-1502823403499-6ccfcf4fb453"), label: "She's everything 💕" },
  { id: "uht6",  src: U("photo-1508214751196-bcfd4ca60f91"), label: "Stunning 💫" },
  { id: "uht7",  src: U("photo-1517841905240-472988babdf9"), label: "Fire look 🔥" },
  { id: "uht8",  src: U("photo-1531746020798-e6953c6e8e04"), label: "Late night 🌙" },
  { id: "uht9",  src: U("photo-1544005313-94ddf0286df2"), label: "She glows ✨" },
  { id: "uht10", src: U("photo-1554151228-14d9def656e4"), label: "Effortless 💎" },
  { id: "uht11", src: U("photo-1506794778202-cad84cf45f1d"), label: "All red 🔴" },
  { id: "uht12", src: U("photo-1487412720507-e7ab37603c6f"), label: "Golden hour 🌅" },
  { id: "uht13", src: U("photo-1472099645785-5658abf4ff4e"), label: "Magazine cover 📸" },
  { id: "uht14", src: U("photo-1507003211169-0a1dd7228f2d"), label: "Soft glow 🕯️" },
  { id: "uht15", src: U("photo-1463453091185-61582044d556"), label: "City woman 🏙️" },
  { id: "uht16", src: U("photo-1459411552884-841db9b3cc2a"), label: "Sleek look 🖤" },
];

const US_OUTDOOR: Photo[] = [
  { id: "uod1",  src: U("photo-1506905925346-21bda4d32df4"), label: "Mountain escape 🏔️" },
  { id: "uod2",  src: U("photo-1476231682828-37e571bc172f"), label: "Lakeside 🌊" },
  { id: "uod3",  src: U("photo-1441974231531-c6227db76b6e"), label: "Forest walk 🌲" },
  { id: "uod4",  src: U("photo-1501854140801-50d01698950b"), label: "Valley view 🌿" },
  { id: "uod5",  src: U("photo-1469854523086-cc02fe5d8800"), label: "Road trip 🚗" },
  { id: "uod6",  src: U("photo-1518173946687-a4c8892bbd9f"), label: "Sunset coast 🌅" },
  { id: "uod7",  src: U("photo-1465146344425-f00d5f5c8f07"), label: "Wildflowers 🌸" },
  { id: "uod8",  src: U("photo-1433086966358-54859d0ed716"), label: "Waterfall 💧" },
  { id: "uod9",  src: U("photo-1464822759023-fed622ff2c3b"), label: "Golden hour 🌇" },
  { id: "uod10", src: U("photo-1502082553048-f009c37129b9"), label: "Misty forest 🌫️" },
  { id: "uod11", src: U("photo-1519681393784-d120267933ba"), label: "Starry peaks 🌟" },
  { id: "uod12", src: U("photo-1486325212027-8081e485255e"), label: "Open field 🌾" },
];

const US_SELFIE: Photo[] = [
  { id: "usl1", src: U("photo-1570295999919-56ceb5ecca61"), label: "Happy selfie 😊" },
  { id: "usl2", src: U("photo-1580489944761-15a19d654956"), label: "Car selfie 🚗" },
  { id: "usl3", src: U("photo-1569913486515-b74bf7751574"), label: "Beach selfie 🏖️" },
  { id: "usl4", src: U("photo-1595152772835-219674b2a163"), label: "Sunny day 🌞" },
  { id: "usl5", src: U("photo-1526510747491-58f928ec870f"), label: "Night out 🌙" },
  { id: "usl6", src: U("photo-1619539259015-f76cf41e5ef6"), label: "Candid smile 💕" },
  { id: "usl7", src: U("photo-1541531487456-0d5bdaa1e2e0"), label: "Coffee date ☕" },
  { id: "usl8", src: U("photo-1531746020798-e6953c6e8e04"), label: "Glowing ✨" },
];

// ─── Assemble full gallery ───────────────────────────────────────────────────

type Tab = "wedding" | "church" | "party" | "club" | "school" | "daily" | "hot" | "outdoor" | "selfies" | "videos";

const TABS: { key: Tab; label: string; photos: Photo[] }[] = [
  { key: "wedding",  label: "💍 Wedding",  photos: [...AI_WEDDING, ...US_WEDDING] },
  { key: "church",   label: "⛪ Church",   photos: [...AI_CHURCH,  ...US_CHURCH] },
  { key: "party",    label: "🎉 Party",    photos: [...AI_PARTY,   ...US_PARTY] },
  { key: "club",     label: "🎊 Club",     photos: [...AI_CLUB,    ...US_CLUB] },
  { key: "school",   label: "📚 School",   photos: [...AI_SCHOOL,  ...US_SCHOOL] },
  { key: "daily",    label: "☀️ Daily",    photos: [...AI_DAILY,   ...US_DAILY] },
  { key: "hot",      label: "🔥 Hot",      photos: [...AI_HOT,     ...US_HOT] },
  { key: "outdoor",  label: "🌿 Outdoor",  photos: [...AI_OUTDOOR, ...US_OUTDOOR] },
  { key: "selfies",  label: "📱 Selfies",  photos: [...AI_SELFIE,  ...US_SELFIE] },
];

const ALL_PHOTOS = TABS.flatMap((t) => t.photos);

const TOTAL_PHOTOS = ALL_PHOTOS.length;

const VIDEOS: Video[] = [
  { id: "v1", poster: H("party-1.png"),   src: "https://videos.pexels.com/video-files/3121461/3121461-hd_1280_720_30fps.mp4", label: "Birthday dance 🎉" },
  { id: "v2", poster: H("daily-5.png"),   src: "https://videos.pexels.com/video-files/4473545/4473545-hd_1280_720_25fps.mp4", label: "Morning routine ☀️" },
  { id: "v3", poster: H("church-1.png"),  src: "https://videos.pexels.com/video-files/3040284/3040284-hd_1280_720_25fps.mp4", label: "Sunday walk 🌿" },
  { id: "v4", poster: H("school-4.png"),  src: "https://videos.pexels.com/video-files/4812205/4812205-hd_1280_720_25fps.mp4", label: "Study session 📚" },
  { id: "v5", poster: H("wedding-2.png"), src: "https://videos.pexels.com/video-files/3214660/3214660-hd_1280_720_25fps.mp4", label: "Wedding memories 💍" },
  { id: "v6", poster: H("hot-3.png"),     src: "https://videos.pexels.com/video-files/4608164/4608164-hd_1280_720_25fps.mp4", label: "City night 🌙" },
];

const PROFILE = H("wedding-2.png");

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("wedding");
  const [showVideos, setShowVideos] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [videoIdx, setVideoIdx] = useState<number | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const currentPhotos = TABS.find((t) => t.key === activeTab)?.photos ?? [];

  const openPhoto = (photo: Photo) => {
    const gi = ALL_PHOTOS.findIndex((p) => p.id === photo.id);
    setLightboxIdx(gi);
  };

  const prev = () => setLightboxIdx(((lightboxIdx ?? 0) - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length);
  const next = () => setLightboxIdx(((lightboxIdx ?? 0) + 1) % ALL_PHOTOS.length);

  return (
    <div className="app-shell">
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb bg-orb-1" /><div className="bg-orb bg-orb-2" /><div className="bg-orb bg-orb-3" />
      </div>

      <div className="chat-card gallery-card">
        <header className="chat-header">
          <div className="header-left">
            <button className="icon-btn" onClick={() => setLocation("/")}><ArrowLeft size={18} /></button>
            <div>
              <h1 className="header-title">Gallery <Heart className="header-heart" /></h1>
              <p className="header-status">{TOTAL_PHOTOS} photos · {VIDEOS.length} videos</p>
            </div>
          </div>
        </header>

        <div className="gallery-hero">
          <img src={PROFILE} alt="My wife" className="gallery-profile-img" />
          <div className="gallery-profile-info">
            <p className="gallery-profile-name">My Wife</p>
            <p className="gallery-profile-sub">Always in my heart ❤️</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="gallery-tabbar" ref={tabBarRef}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`gallery-tab ${!showVideos && activeTab === t.key ? "gallery-tab-active" : ""}`}
              onClick={() => { setActiveTab(t.key); setShowVideos(false); }}
            >
              {t.label} <span className="tab-count">({t.photos.length})</span>
            </button>
          ))}
          <button
            className={`gallery-tab ${showVideos ? "gallery-tab-active" : ""}`}
            onClick={() => setShowVideos(true)}
          >
            🎬 Videos <span className="tab-count">({VIDEOS.length})</span>
          </button>
        </div>

        {/* Grid */}
        <div className="gallery-grid-area">
          {showVideos ? (
            <div className="gallery-grid">
              {VIDEOS.map((v, i) => (
                <button key={v.id} className="gallery-cell video-cell" onClick={() => setVideoIdx(i)}>
                  <img src={v.poster} alt={v.label} className="gallery-cell-img" loading="lazy" />
                  <div className="video-play-overlay"><Play size={28} fill="white" color="white" /></div>
                  <div className="gallery-cell-overlay"><span className="gallery-cell-label">{v.label}</span></div>
                </button>
              ))}
            </div>
          ) : (
            <div className="gallery-grid">
              {currentPhotos.map((photo) => (
                <button key={photo.id} className={`gallery-cell ${photo.ai ? "gallery-cell-ai" : ""}`} onClick={() => openPhoto(photo)}>
                  <img src={photo.src} alt={photo.label} className="gallery-cell-img" loading="lazy" />
                  {photo.ai && <span className="ai-badge">✨ Her</span>}
                  <div className="gallery-cell-overlay"><span className="gallery-cell-label">{photo.label}</span></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxIdx !== null && (
        <div className="lightbox" onClick={() => setLightboxIdx(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIdx(null)}><X size={22} /></button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }}><ArrowLeft size={22} /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={ALL_PHOTOS[lightboxIdx].src.replace("w=600", "w=1200")} alt={ALL_PHOTOS[lightboxIdx].label} className="lightbox-img" />
            {ALL_PHOTOS[lightboxIdx].ai && <p className="ai-lightbox-tag">✨ AI Generated · Her Face</p>}
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
            <video src={VIDEOS[videoIdx].src} poster={VIDEOS[videoIdx].poster} controls autoPlay className="lightbox-img" style={{ background: "#000" }} />
            <p className="lightbox-label">{VIDEOS[videoIdx].label}</p>
            <p className="lightbox-counter">Video {videoIdx + 1} / {VIDEOS.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
