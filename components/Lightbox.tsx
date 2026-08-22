'use client';

/* The 21-photo gallery, plus the triggers that open it.

   Load-time note: the overlay is hidden with `visibility:hidden` (not
   `display:none`) and is `position:fixed; inset:0`, so its slides have real
   layout boxes filling the viewport. `loading="lazy"` therefore does NOT hold
   the first one back — measured against the old page, hero-tile-1.webp (55 KB)
   was fetched on every single page load, competing with the LCP hero, for the
   majority of visitors who never opened the gallery.

   All 21 slides still render into the server HTML, because their src and alt are
   worth real image-search traffic for a property listing. What stops the fetch is
   `content-visibility:hidden` on the closed overlay (see globals.css), which skips
   the subtree's layout entirely so nothing intersects the viewport. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { PHOTOS } from '@/content/photos';
import { safeTrack } from '@/booking/tracking';

type LightboxContextValue = { open: (index: number) => void };

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error('useLightbox must be used inside <LightboxProvider>');
  return ctx;
}

/* Wraps the page so any PhotoTrigger, wherever it sits in the tree, can open the
   gallery without the sections themselves needing to be client components. */
export function LightboxProvider({ children }: { children: ReactNode }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  // Flips once, on the first open — only used to promote nearby slides to eager.
  const [opened, setOpened] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const isOpen = openAt !== null;

  const open = useCallback((i: number) => {
    setOpened(true);
    setIndex(i);
    setOpenAt(i);
    safeTrack('lightbox_opened', { photo_index: i });
  }, []);

  const close = useCallback(() => {
    setOpenAt(null);
    safeTrack('lightbox_closed', { last_index: index });
  }, [index]);

  const scrollTo = useCallback((i: number, behavior: ScrollBehavior = 'smooth') => {
    const slide = trackRef.current?.children[i] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior, block: 'nearest', inline: 'start' });
    setIndex(i);
  }, []);

  // Jump to the requested slide once the track exists. 'instant' so opening at
  // index 16 never animates through the sixteen slides before it.
  useEffect(() => {
    if (openAt === null) return;
    const slide = trackRef.current?.children[openAt] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'nearest', inline: 'start' });
  }, [openAt]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft' && index > 0) scrollTo(index - 1);
      if (e.key === 'ArrowRight' && index < PHOTOS.length - 1) scrollTo(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, index, close, scrollTo]);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.offsetWidth);
    if (i !== index && i >= 0 && i < PHOTOS.length) setIndex(i);
  }, [index]);

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}

      <div
        className={'mosaic-lightbox' + (isOpen ? ' open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Photo gallery"
      >
        <div className="lb-header">
          <span className="lb-counter">
            {index + 1} / {PHOTOS.length}
          </span>
          <button className="lb-close" onClick={close} aria-label="Close gallery">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="lb-track" ref={trackRef} onScroll={onScroll}>
          {PHOTOS.map((photo, i) => (
            <div className="lb-slide" key={photo.src}>
              <img
                src={photo.src}
                width={photo.width}
                height={photo.height}
                alt={photo.alt}
                /* Once the overlay is open, content-visibility no longer skips the
                   subtree, so the current slide and its neighbours resolve at once
                   and the rest stay lazy behind the horizontal scroll. */
                loading={opened && Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>
        <button
          className="lb-nav lb-prev"
          onClick={() => index > 0 && scrollTo(index - 1)}
          aria-label="Previous photo"
        >
          &#8249;
        </button>
        <button
          className="lb-nav lb-next"
          onClick={() => index < PHOTOS.length - 1 && scrollTo(index + 1)}
          aria-label="Next photo"
        >
          &#8250;
        </button>
      </div>
    </LightboxContext.Provider>
  );
}

/* Drop-in replacement for the old `<button class="js-photo" data-photo-index="N">`.
   Server components render it without becoming client components themselves. */
export function PhotoTrigger({
  photoIndex,
  className,
  ariaLabel,
  children,
}: {
  photoIndex: number;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { open } = useLightbox();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        safeTrack('photo_trigger_clicked', { photo_index: photoIndex });
        open(photoIndex);
      }}
    >
      {children}
    </button>
  );
}
