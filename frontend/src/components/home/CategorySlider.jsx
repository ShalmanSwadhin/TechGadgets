import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../../utils/categories';

// The categories requested for this ticker, in the requested order, mapped
// onto the *existing* category names already used everywhere else in the
// app (Product schema enum, filters, admin forms). Some were requested in
// plural ("Smartwatches", "Neckbands"...) but the project already has
// singular entries ("Smartwatch", "Neckband"...) — reusing those keeps this
// slider on the same single category system instead of forking a second one.
const SLIDER_CATEGORY_NAMES = [
  'Power Banks',
  'Fast Chargers',
  'Turbo Fans',
  'Earbuds',
  'Speakers',
  'Smartwatch',
  'Neckband',
  'Wired Headphones',
  'Gaming Earphones',
  'Microphone',
  'Trimmer',
  'Mouse',
  'Keyboard',
  'Home Accessories',
];

const SLIDER_CATEGORIES = SLIDER_CATEGORY_NAMES.map((name) =>
  CATEGORIES.find((c) => c.name === name)
).filter(Boolean);

const SPEED_PX_PER_SEC = 24; // slow, headline-ticker pace, not a carousel
const RESUME_DELAY_MS = 3500; // "wait ~3-4s after the user lets go"
const CLICK_VS_DRAG_PX = 6; // movement beyond this cancels the click-through

function CategoryCard({ category, active, duplicate }) {
  const Icon = category.icon;
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      // The duplicated tail (rendered only to make the loop seamless) is a
      // pure visual echo of the real, tabbable set above it — hiding it from
      // the accessibility tree avoids making a screen reader user tab
      // through every category twice for no reason.
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : 0}
      draggable={false}
      className={`card-interactive flex w-20 shrink-0 select-none flex-col items-center gap-2 px-2 py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:w-24 sm:gap-2.5 sm:py-5 md:w-28 ${
        active ? 'border-brand-500 ring-1 ring-brand-500/40 dark:border-brand-500' : ''
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-colors sm:h-11 sm:w-11 ${
          active
            ? 'bg-brand-gradient text-white'
            : 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
        }`}
      >
        <Icon />
      </span>
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700 dark:text-slate-200 sm:text-xs">
        {category.name}
      </span>
    </Link>
  );
}

export default function CategorySlider() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const visibleRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  // The true, sub-pixel scroll position we're driving. element.scrollLeft
  // itself rounds to whole pixels on read *and* write, and this ticker's
  // per-frame step is well under 1px (24px/s ÷ ~60fps ≈ 0.4px/frame) — if
  // each frame instead read the just-rounded DOM value and added to that,
  // the fractional part is thrown away every time and the position can
  // never advance at all. Accumulating here in plain JS keeps the fraction.
  const scrollPosRef = useRef(0);
  // Mutable interaction state — deliberately refs, not React state, so a
  // 60fps drag/animation loop never triggers a re-render (see req. on
  // avoiding per-frame state updates).
  const dragRef = useRef({ startX: 0, startScrollLeft: 0, moved: 0, isMouse: false });

  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Only run the auto-scroll loop while the section is actually on screen —
  // it typically starts below the fold under the hero, so there's no reason
  // to burn a rAF loop against it before the user ever scrolls that far.
  useEffect(() => {
    if (reducedMotion) return undefined;
    const section = sectionRef.current;
    if (!section) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;

    const clearResumeTimer = () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
    const scheduleResume = () => {
      clearResumeTimer();
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false;
        lastTsRef.current = null; // don't let dt jump across the pause
      }, RESUME_DELAY_MS);
    };
    const pauseNow = () => {
      pausedRef.current = true;
      clearResumeTimer();
    };

    scrollPosRef.current = track.scrollLeft;

    const step = (ts) => {
      if (!pausedRef.current && visibleRef.current) {
        if (lastTsRef.current == null) lastTsRef.current = ts;
        const dt = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        const halfWidth = track.scrollWidth / 2; // exactly one set's width
        if (halfWidth > 0) {
          scrollPosRef.current += SPEED_PX_PER_SEC * dt;
          // The second set is an identical copy, so wrapping here is
          // invisible — this is what makes the loop feel infinite.
          if (scrollPosRef.current >= halfWidth) {
            scrollPosRef.current -= halfWidth;
          }
          track.scrollLeft = scrollPosRef.current;
        }
      } else {
        lastTsRef.current = null;
        // Stay in sync with wherever manual/native scrolling left the real
        // position, so resuming continues from there instead of replaying
        // whatever we last drove it to before the user took over.
        scrollPosRef.current = track.scrollLeft;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    // Deliberately NOT listening to the track's 'scroll' event to detect
    // interaction: the loop above fires scrollLeft writes every ~16ms, and
    // there's no reliable, race-free way to tell "a scroll event caused by
    // my own last write" apart from "a scroll event the user caused" once
    // the browser's async dispatch timing is in the mix — an earlier
    // version tried a same-frame flag and the two fought, freezing the
    // animation almost immediately. Explicit interaction-start/end events
    // (pointer/wheel) are unambiguous and need no such guessing.
    const onPointerDown = (e) => {
      pauseNow();
      dragRef.current = {
        startX: e.clientX,
        startScrollLeft: track.scrollLeft,
        moved: 0,
        isMouse: e.pointerType === 'mouse',
      };
      // Deliberately no setPointerCapture here: capturing the pointer
      // redirects its eventual pointerup away from whatever element is
      // actually under the cursor (e.g. a category link) to the track
      // instead, which breaks the browser's mousedown/mouseup pairing that
      // synthesizes the click — every card became unclickable by mouse
      // with capture on. A plain click without a drag still works fine
      // without it; the only cost is a fast drag that leaves the strip
      // stops tracking, which is a minor nicety, not a hard requirement.
    };
    const onPointerMove = (e) => {
      const drag = dragRef.current;
      if (drag.startX === undefined) return;
      const dx = e.clientX - drag.startX;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.isMouse) track.scrollLeft = drag.startScrollLeft - dx;
    };
    const endInteraction = () => {
      scheduleResume();
    };
    // Each wheel tick re-pauses and re-arms the timer, so a sustained
    // trackpad gesture (many rapid wheel events) keeps extending the pause
    // exactly as long as the user is actually scrolling.
    const onWheel = () => {
      pauseNow();
      scheduleResume();
    };

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', endInteraction);
    track.addEventListener('pointercancel', endInteraction);
    track.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearResumeTimer();
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', endInteraction);
      track.removeEventListener('pointercancel', endInteraction);
      track.removeEventListener('wheel', onWheel);
    };
  }, [reducedMotion]);

  // A drag/swipe that moved past the threshold shouldn't also fire the
  // category link's navigation — otherwise every scroll gesture that
  // happens to end over a card would accidentally "click" it.
  const handleClickCapture = (e) => {
    if (dragRef.current.moved > CLICK_VS_DRAG_PX) {
      e.preventDefault();
    }
  };

  if (SLIDER_CATEGORIES.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-label="Shop by category"
      className="overflow-hidden border-y border-slate-200/70 bg-white py-6 dark:border-white/10 dark:bg-surface-dark sm:py-7"
    >
      {/* scroll-behavior must stay "auto" (the default), not "smooth" — the
          rAF loop below writes scrollLeft every ~16ms, and "smooth" makes
          the browser retarget an eased animation on every single write,
          which never catches up to a constantly-moving target and reads as
          completely frozen instead of a slow, continuous glide. */}
      <div
        ref={trackRef}
        onClickCapture={handleClickCapture}
        className="container-page flex cursor-grab gap-3 overflow-x-auto [scroll-behavior:auto] active:cursor-grabbing sm:gap-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDER_CATEGORIES.map((category) => (
          <CategoryCard key={category.name} category={category} active={activeCategory === category.name} />
        ))}
        {/* Duplicate tail for the seamless right-to-left loop; skipped
            entirely under reduced-motion since nothing needs to loop. */}
        {!reducedMotion &&
          SLIDER_CATEGORIES.map((category) => (
            <CategoryCard key={`${category.name}-dup`} category={category} active={activeCategory === category.name} duplicate />
          ))}
      </div>
    </section>
  );
}
