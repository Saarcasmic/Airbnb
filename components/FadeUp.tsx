'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/* Scroll reveal. The CSS reveal is transform-only (globals.css ~1891), so a
   section is never blank if this never runs — the observer only settles it into
   place. Reduced motion is already neutralised in CSS, so there is nothing to
   branch on here.

   `as` exists because the source markup hangs .fade-up off several element
   types (div, figure, ul, dl) and swapping the tag would change the layout. */

type FadeUpTag = 'div' | 'figure' | 'ul' | 'dl';

type FadeUpProps = {
  as?: FadeUpTag;
  className?: string;
  children: ReactNode;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
};

export default function FadeUp({ as: Tag = 'div', className, children, ...rest }: FadeUpProps) {
  // A callback ref rather than useRef+ref: it is the one form assignable to all
  // four tags' ref types without a cast.
  const node = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = node.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        node.current = el;
      }}
      className={className ? `fade-up ${className}` : 'fade-up'}
      {...rest}
    >
      {children}
    </Tag>
  );
}
