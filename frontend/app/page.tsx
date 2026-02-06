"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ================= Type Definitions =================
interface Pokemon {
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
}

// ================= Image Config =================
const IMAGE_CONFIG = {
  CAROUSEL: {
    IMAGES: [
      "/banners/carousel1.jpg",
      "/banners/carousel2.jpg",
      "/banners/carousel3.jpg",
    ],
    INTERVAL: 3000,
  },
  BANNERS: {
    TOP: ["/banners/banner1.jpg", "/banners/banner2.jpg"],
  },
  SIDE_PANELS: {
    LEFT: "/side-panels/left.jpg",
    RIGHT: "/side-panels/right.jpg",
  },
  FALLBACK: "https://via.placeholder.com/128x128?text=Pokemon",
} as const;

// ================= Helper =================
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = IMAGE_CONFIG.FALLBACK;
};

// ================= Main Component =================
export default function Home() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // ================= Carousel Auto =================
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(
        prev => (prev + 1) % IMAGE_CONFIG.CAROUSEL.IMAGES.length
      );
    }, IMAGE_CONFIG.CAROUSEL.INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // ================= Fetch Pokémon =================
  const fetchPokemons = useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/pokemons?page=${pageNumber}&limit=20`
      );
      const data: Pokemon[] = await res.json();
      setPokemons(prev => [...prev, ...data]);
    } catch (err) {
      console.error("Failed to fetch pokemons:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPokemons(page);
  }, [page, fetchPokemons]);

  // ================= Infinite Scroll using Intersection Observer =================
  useEffect(() => {
    if (!loadMoreRef.current || loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          setPage(prev => prev + 1);
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "50px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [loading]);

  const filteredPokemons = pokemons.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Carousel */}
      <TopCarouselSection
        currentIndex={carouselIndex}
        images={IMAGE_CONFIG.CAROUSEL.IMAGES}
        onPrev={() =>
          setCarouselIndex(
            prev =>
              (prev - 1 + IMAGE_CONFIG.CAROUSEL.IMAGES.length) %
              IMAGE_CONFIG.CAROUSEL.IMAGES.length
          )
        }
        onNext={() =>
          setCarouselIndex(
            prev => (prev + 1) % IMAGE_CONFIG.CAROUSEL.IMAGES.length
          )
        }
        onGoToSlide={index => setCarouselIndex(index)}
      />

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4">
        {/* Left Panel */}
        <SidePanel imageSrc={IMAGE_CONFIG.SIDE_PANELS.LEFT} altText="Left Panel" />

        {/* Center Scrollable Content */}
        <div className="w-4/6 flex flex-col h-full">
          {/* Fixed Search Bar */}
          <div className="p-4 bg-gray-50 sticky top-0 z-10">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Scrollable List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 min-h-0"
          >
            {filteredPokemons.length === 0 && !loading ? (
              <NoResultsMessage
                searchTerm={search}
                hasData={pokemons.length > 0}
              />
            ) : (
              <>
                <PokemonGrid pokemons={filteredPokemons} />
                {loading && <LoadingSpinner />}
                <div ref={loadMoreRef} />
                {!loading && filteredPokemons.length > 0 && <LoadMoreHint />}
              </>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <SidePanel imageSrc={IMAGE_CONFIG.SIDE_PANELS.RIGHT} altText="Right Panel" />
      </div>
    </div>
  );
}

// ================= Components =================

// Top Carousel
interface TopCarouselProps {
  currentIndex: number;
  images: string[];
  onPrev: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
}
function TopCarouselSection({ currentIndex, images, onPrev, onNext, onGoToSlide }: TopCarouselProps) {
  return (
    <div className="flex w-full h-48 p-4 gap-4">
      <div className="w-2/3 relative rounded-xl overflow-hidden group shadow-lg">
        <img
          src={images[currentIndex] || IMAGE_CONFIG.FALLBACK}
          alt={`Pokemon Carousel ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={handleImageError}
        />
        <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
          <ChevronLeftIcon />
        </button>
        <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
          <ChevronRightIcon />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, idx) => (
            <button key={idx} onClick={() => onGoToSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`} />
          ))}
        </div>
        <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded-md">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      <div className="w-1/3 flex flex-col gap-4">
        {IMAGE_CONFIG.BANNERS.TOP.map((banner, idx) => (
          <div key={idx} className="flex-1 rounded-xl overflow-hidden shadow-lg">
            <img src={banner} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition" onError={handleImageError} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Side Panel
function SidePanel({ imageSrc, altText }: { imageSrc: string; altText: string }) {
  return (
    <div className="w-1/6 min-w-[120px]">
      <div className="sticky top-4 h-[calc(100vh-2rem)] rounded-xl overflow-hidden shadow-lg">
        <img src={imageSrc} alt={altText} className="w-full h-full object-cover hover:scale-105 transition" onError={handleImageError} />
      </div>
    </div>
  );
}

// Search Bar
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Search Pokémon by name..."
        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// Pokémon Grid
function PokemonGrid({ pokemons }: { pokemons: Pokemon[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {pokemons.map(p => <PokemonCard key={p.name} pokemon={p} />)}
    </div>
  );
}

// Pokémon Card
function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition border border-gray-100 hover:border-blue-100">
      <div className="h-48 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl flex items-center justify-center p-4 mb-4">
        <img src={pokemon.image} alt={pokemon.name} className="max-h-full max-w-full object-contain" loading="lazy" onError={handleImageError} />
      </div>
      <div>
        <h3 className="text-xl font-bold capitalize text-gray-800 mb-3">{pokemon.name}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {pokemon.types.map(type => <TypeBadge key={type} type={type} />)}
        </div>
      </div>
    </div>
  );
}

// Type Badge
function TypeBadge({ type }: { type: string }) {
  const typeColors: Record<string, string> = {
    grass: "bg-green-100 text-green-800 border-green-200",
    poison: "bg-purple-100 text-purple-800 border-purple-200",
    fire: "bg-red-100 text-red-800 border-red-200",
    water: "bg-blue-100 text-blue-800 border-blue-200",
    electric: "bg-yellow-100 text-yellow-800 border-yellow-200",
    flying: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };
  const colorClass = typeColors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  return <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${colorClass}`}>{type}</span>;
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      <p className="mt-4 text-gray-600">Loading more Pokémon...</p>
    </div>
  );
}

// Scroll Hint
function LoadMoreHint() {
  return (
    <div className="text-center py-8 text-gray-500">
      <p className="text-sm">Scroll down to load more Pokémon</p>
      <div className="mt-2 animate-bounce">↓</div>
    </div>
  );
}

// No Results
function NoResultsMessage({ searchTerm, hasData }: { searchTerm: string; hasData: boolean }) {
  if (!hasData) return null;
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pokémon Found</h3>
      <p className="text-gray-500">{searchTerm ? `No results for "${searchTerm}"` : "No Pokémon available"}</p>
      <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
    </div>
  );
}

// Icons
function ChevronLeftIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>; }
function ChevronRightIcon() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>; }
function SearchIcon({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>; }
