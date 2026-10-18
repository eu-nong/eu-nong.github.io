import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import "./index.css";

type Section = "gallery" | "guestbook" | "music" | "decor";
type ThemeName = "paper" | "dusk" | "moss" | "rose";
type GuestEntry = { id: string; name: string; message: string; date: string };
type Photo = { id: number; title: string; category: string; src: string; alt: string };

const photos: Photo[] = [
  { id: 1, title: "빛이 머무는 오후", category: "일상", src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=82", alt: "햇살이 비치는 들판" },
  { id: 2, title: "조용한 초록", category: "자연", src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=82", alt: "초록빛 숲길" },
  { id: 3, title: "느린 주말", category: "일상", src: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=82", alt: "커피가 놓인 카페 테이블" },
  { id: 4, title: "바다의 색", category: "여행", src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=82", alt: "푸른 바다의 파도" },
  { id: 5, title: "작은 꽃들", category: "자연", src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=82", alt: "분홍색 꽃" },
  { id: 6, title: "어느 저녁의 기록", category: "여행", src: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=82", alt: "산과 호수의 풍경" },
];

const themes: { id: ThemeName; name: string; description: string; swatches: string[] }[] = [
  { id: "paper", name: "종이와 햇살", description: "따뜻한 아이보리와 잉크", swatches: ["#f5f0e8", "#d9c8ad", "#3d4b40"] },
  { id: "dusk", name: "푸른 저녁", description: "차분한 블루그레이", swatches: ["#e9edf0", "#a9bac7", "#2d3b48"] },
  { id: "moss", name: "숲의 안쪽", description: "부드러운 세이지 그린", swatches: ["#edf0e6", "#b6c4a8", "#344536"] },
  { id: "rose", name: "장미빛 편지", description: "옅은 로즈와 크림", swatches: ["#f7ece9", "#e4c1bc", "#754d4c"] },
];

const musicSources = [
  { title: "Ambient · 차분한 배경음", artist: "Pixabay Music", mood: "calm", url: "https://pixabay.com/music/search/ambient/" },
  { title: "Soft Piano · 잔잔한 피아노", artist: "Pixabay Music", mood: "piano", url: "https://pixabay.com/music/search/soft%20piano/" },
  { title: "Nature · 자연의 소리", artist: "Pixabay Music", mood: "nature", url: "https://pixabay.com/music/search/nature/" },
  { title: "Kevin MacLeod · Creative Commons", artist: "incompetech", mood: "cc-by", url: "https://incompetech.com/music/royalty-free/music.html" },
];

const initialEntries: GuestEntry[] = [
  { id: "seed-1", name: "다정한 방문자", message: "잠깐 머물다 갑니다. 공간이 참 편안하네요.", date: "2026.10.12" },
  { id: "seed-2", name: "오후의 산책자", message: "좋아하는 것들을 오래 모아두는 일은 멋진 것 같아요.", date: "2026.10.15" },
];

function getStoredEntries(): GuestEntry[] {
  try {
    const raw = localStorage.getItem("soft-archive-guestbook");
    return raw ? JSON.parse(raw) as GuestEntry[] : initialEntries;
  } catch {
    return initialEntries;
  }
}

function App() {
  const [section, setSection] = useState<Section>("gallery");
  const [theme, setTheme] = useState<ThemeName>(() => {
    try { return (localStorage.getItem("soft-archive-theme") as ThemeName) || "paper"; }
    catch { return "paper"; }
  });
  const [filter, setFilter] = useState("전체");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [entries, setEntries] = useState<GuestEntry[]>(getStoredEntries);
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [musicFiles, setMusicFiles] = useState<{ name: string; url: string }[]>([]);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(55);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const categories = ["전체", ...Array.from(new Set(photos.map((photo) => photo.category)))];
  const visiblePhotos = useMemo(
    () => filter === "전체" ? photos : photos.filter((photo) => photo.category === filter),
    [filter],
  );
  const currentTrack = musicFiles.find((track) => track.url === activeTrack);

  useEffect(() => {
    try { localStorage.setItem("soft-archive-theme", theme); } catch { /* storage may be unavailable */ }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem("soft-archive-guestbook", JSON.stringify(entries)); } catch { /* storage may be unavailable */ }
  }, [entries]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = guestName.trim();
    const message = guestMessage.trim();
    if (!name || !message) return;
    const entry: GuestEntry = {
      id: crypto.randomUUID(),
      name,
      message,
      date: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/\. /g, ".").replace(/\.$/, ""),
    };
    setEntries((current) => [entry, ...current]);
    setGuestName("");
    setGuestMessage("");
  }

  function addMusicFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files)
      .filter((file) => file.type.startsWith("audio/"))
      .map((file) => ({ name: file.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(file) }));
    objectUrlsRef.current.push(...added.map((track) => track.url));
    setMusicFiles((current) => [...current, ...added]);
    if (!activeTrack && added[0]) {
      setActiveTrack(added[0].url);
      setIsPlaying(false);
    }
  }

  function chooseTrack(url: string) {
    setActiveTrack(url);
    setIsPlaying(true);
    window.setTimeout(() => { void audioRef.current?.play().catch(() => setIsPlaying(false)); }, 0);
  }

  function togglePlayback() {
    if (!currentTrack || !audioRef.current) {
      fileInputRef.current?.click();
      return;
    }
    if (audioRef.current.paused) {
      void audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div className={`app theme-${theme}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => setSection("gallery")} aria-label="처음으로">
          <span className="brand-mark">s.</span>
          <span className="brand-name">small archive</span>
        </button>
        <nav className="nav" aria-label="주 메뉴">
          {([
            ["gallery", "갤러리"],
            ["guestbook", "방명록"],
            ["music", "음악"],
            ["decor", "배경 꾸미기"],
          ] as [Section, string][]).map(([id, label]) => (
            <button key={id} className={`nav-link ${section === id ? "active" : ""}`} onClick={() => setSection(id)}>{label}</button>
          ))}
        </nav>
        <span className="top-note"><span className="status-dot" /> 나만의 작은 기록</span>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>✳</span> A PLACE TO KEEP LITTLE THINGS</p>
            <h1>좋아하는 순간을<br /><em>천천히, 오래.</em></h1>
            <p className="hero-description">사진과 음악, 다정한 말들을 모아두는<br className="desktop-break" /> 작은 개인 아카이브입니다.</p>
            <button className="text-cta" onClick={() => setSection("gallery")}>천천히 둘러보기 <span>↗</span></button>
          </div>
          <div className="hero-image-wrap">
            <img className="hero-image" src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1500&q=85" alt="햇살이 스며드는 숲" />
            <div className="image-note"><span className="note-star">✳</span><span>take a breath<br /><small>and stay awhile</small></span></div>
            <span className="hero-image-caption">FIG. 01 — A QUIET PLACE</span>
          </div>
          <div className="hero-index"><span>01</span><span className="index-line" /><span>04</span></div>
        </section>

        <section className="content-section" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE COLLECTION / 0{section === "gallery" ? 1 : section === "guestbook" ? 2 : section === "music" ? 3 : 4}</p>
              <h2>{section === "gallery" ? "기억의 조각들" : section === "guestbook" ? "다녀간 마음들" : section === "music" ? "오늘의 배경음" : "공간의 분위기"}</h2>
            </div>
            <p className="section-aside">{section === "gallery" ? "moments, collected gently" : section === "guestbook" ? "leave a little note" : section === "music" ? "press play, slow down" : "make it feel like yours"}</p>
          </div>

          {section === "gallery" && (
            <div className="gallery-view">
              <div className="filter-row">
                <span className="muted-label">BROWSE BY</span>
                <div className="filters">{categories.map((category) => <button key={category} className={`filter-chip ${filter === category ? "selected" : ""}`} onClick={() => setFilter(category)}>{category}</button>)}</div>
                <span className="photo-count">{String(visiblePhotos.length).padStart(2, "0")} PHOTOS</span>
              </div>
              <div className="gallery-grid">
                {visiblePhotos.map((photo, index) => (
                  <button className={`photo-card photo-card-${index % 3}`} key={photo.id} onClick={() => setSelectedPhoto(photo)}>
                    <span className="photo-image-wrap"><img src={photo.src} alt={photo.alt} loading="lazy" /><span className="photo-open">↗</span></span>
                    <span className="photo-meta"><span><small>{photo.category}</small><strong>{photo.title}</strong></span><span className="photo-number">/{String(photo.id).padStart(2, "0")}</span></span>
                  </button>
                ))}
              </div>
              <p className="gallery-footnote">사진은 디자인 미리보기용 이미지입니다. 실제 사진으로 바꾸려면 <code>photos</code> 배열의 이미지 주소를 수정하세요.</p>
            </div>
          )}

          {section === "guestbook" && (
            <div className="guestbook-layout">
              <div className="guestbook-intro">
                <span className="big-quote">“</span>
                <h3>머물렀다는<br />흔적을 남겨주세요.</h3>
                <p>짧은 인사도 좋아요.<br />이곳에서 만난 마음을 기록해 둡니다.</p>
                <div className="guestbook-stamp">VISITOR'S<br />NOTEBOOK <span>✳</span></div>
                <p className="local-warning">현재는 이 브라우저에만 저장되는 데모입니다. 모든 방문자에게 글을 공유하려면 Supabase 같은 데이터베이스 연결이 필요합니다.</p>
              </div>
              <div className="guestbook-main">
                <form className="guest-form" onSubmit={addEntry}>
                  <label>YOUR NAME<input value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={30} placeholder="이름 또는 별명" required /></label>
                  <label>A LITTLE NOTE<textarea value={guestMessage} onChange={(event) => setGuestMessage(event.target.value)} maxLength={300} rows={3} placeholder="이곳에 짧은 인사를 남겨주세요." required /></label>
                  <div className="form-bottom"><span>{guestMessage.length}/300</span><button className="dark-button" type="submit">기록 남기기 <span>↗</span></button></div>
                </form>
                <div className="entries-heading"><span>RECENT NOTES</span><span>{String(entries.length).padStart(2, "0")} NOTES</span></div>
                <div className="entry-list">
                  {entries.map((entry, index) => (
                    <article className="entry" key={entry.id}>
                      <span className="entry-index">{String(entries.length - index).padStart(2, "0")}</span>
                      <div className="entry-body"><p>{entry.message}</p><div className="entry-byline"><strong>{entry.name}</strong><time>{entry.date}</time></div></div>
                      <span className="entry-sparkle">✳</span>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "music" && (
            <div className="music-layout">
              <div className="music-feature">
                <div className="record-art"><div className="record"><div className="record-label">s<span>.</span></div></div><span className="record-sparkle">✳</span></div>
                <p className="eyebrow">SOUND FOR SLOW DAYS</p>
                <h3>조금 느리게<br /><em>흘러가는 시간.</em></h3>
                <p>직접 보유한 음원 파일을 추가해 이 페이지에서 재생할 수 있어요. 무료 음원은 사용 조건을 확인한 뒤 내려받아 주세요.</p>
                <button className="dark-button" onClick={() => fileInputRef.current?.click()}>음원 파일 추가 <span>＋</span></button>
                <input ref={fileInputRef} className="visually-hidden" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a" multiple onChange={(event) => addMusicFiles(event.target.files)} />
                <p className="music-privacy">선택한 파일은 업로드되지 않습니다. 현재 브라우저에서만 재생됩니다.</p>
              </div>
              <div className="music-list-panel">
                <div className="music-list-header"><span>CURATED MUSIC SOURCES</span><span>OPEN LICENSE / CHECK TERMS</span></div>
                {musicSources.map((track, index) => (
                  <article className="source-track" key={track.title}>
                    <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className={`track-icon track-icon-${index}`} aria-hidden="true">{["〰", "♫", "☼", "✳"][index]}</span>
                    <div className="track-info"><strong>{track.title}</strong><small>{track.artist} · {track.mood}</small></div>
                    <a className="source-link" href={track.url} target="_blank" rel="noreferrer">음원 찾기 ↗</a>
                  </article>
                ))}
                <div className="music-list-header local-list-header"><span>YOUR LOCAL PLAYLIST</span><span>{musicFiles.length} TRACKS</span></div>
                {musicFiles.length === 0 ? (
                  <div className="empty-playlist"><span>♫</span><p>아직 추가한 음원이 없어요.</p><small>무료 음원을 내려받은 뒤 위의 ‘음원 파일 추가’를 눌러보세요.</small></div>
                ) : musicFiles.map((track, index) => (
                  <button className={`source-track local-track ${activeTrack === track.url ? "current-track" : ""}`} key={track.url} onClick={() => chooseTrack(track.url)}>
                    <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="track-icon">♫</span>
                    <span className="track-info"><strong>{track.name}</strong><small>{activeTrack === track.url ? "선택한 트랙" : "로컬 파일"}</small></span>
                    <span className="play-mini">{activeTrack === track.url && isPlaying ? "Ⅱ" : "▶"}</span>
                  </button>
                ))}
                <audio ref={audioRef} src={activeTrack ?? undefined} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
                <div className="player-bar">
                  <div className="player-track"><span className="player-dot" /><span>{currentTrack?.name ?? "재생할 음원을 선택하세요"}</span></div>
                  <button className="player-play" onClick={togglePlayback} aria-label={isPlaying ? "일시정지" : "재생"}>{isPlaying ? "Ⅱ" : "▶"}</button>
                  <label className="volume-control" aria-label="음량"><span>VOL</span><input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></label>
                </div>
                <p className="license-note">‘저작권 없음’이라고 표시된 음악도 이용 범위가 다를 수 있습니다. Pixabay는 <a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noreferrer">콘텐츠 라이선스</a>를, Incompetech는 곡별 라이선스와 표시 의무를 확인하세요.</p>
              </div>
            </div>
          )}

          {section === "decor" && (
            <div className="decor-view">
              <div className="decor-copy"><p className="eyebrow">YOUR SPACE, YOUR MOOD</p><h3>오늘의 마음에<br /><em>어울리는 색을.</em></h3><p>배경과 포인트 색을 바꿔 나만의 분위기를 만들어보세요. 선택한 테마는 이 브라우저에 저장됩니다.</p><div className="decor-preview-note"><span>✳</span><span>small changes,<br />a softer day.</span></div></div>
              <div className="theme-grid">{themes.map((item) => <button key={item.id} className={`theme-card ${theme === item.id ? "theme-card-active" : ""}`} onClick={() => setTheme(item.id)}><span className="theme-preview" style={{ background: item.swatches[0] }}><span className="theme-preview-block" style={{ background: item.swatches[1] }} /><span className="theme-preview-dot" style={{ background: item.swatches[2] }}>✳</span></span><span className="theme-card-bottom"><span><strong>{item.name}</strong><small>{item.description}</small></span><span className="theme-check">{theme === item.id ? "✓" : "＋"}</span></span><span className="swatches">{item.swatches.map((color) => <i key={color} style={{ background: color }} />)}</span></button>)}</div>
              <div className="decor-tip"><span>✦</span><p><strong>작은 팁</strong> — 실제 사이트 전체 방문자에게 같은 배경을 보여주고 싶다면 기본 테마를 코드에서 지정하세요. 개인별 선택을 계정 간 동기화하려면 별도 저장 기능이 필요합니다.</p></div>
            </div>
          )}
        </section>
      </main>

      <footer className="footer"><span className="footer-brand">small archive <span>✳</span></span><span>MADE OF LITTLE MOMENTS</span><span>© 2026 — KEEP WHAT MATTERS</span></footer>

      {selectedPhoto && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={selectedPhoto.title} onClick={() => setSelectedPhoto(null)}>
          <button className="lightbox-close" onClick={() => setSelectedPhoto(null)} aria-label="닫기">×</button>
          <img src={selectedPhoto.src.replace("w=1200", "w=1800")} alt={selectedPhoto.alt} onClick={(event) => event.stopPropagation()} />
          <div className="lightbox-caption"><span>{selectedPhoto.category} / {String(selectedPhoto.id).padStart(2, "0")}</span><strong>{selectedPhoto.title}</strong></div>
        </div>
      )}
    </div>
  );
}

export default App;
