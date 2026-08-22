import FadeUp from '@/components/FadeUp';
import { FAQ } from '@/content/faq';

/* Native <details> on purpose: the open/close is free, works before hydration,
   and Ctrl+F still finds the answers. The "+" is decorative — CSS rotates it. */

export default function Faq() {
  return (
    <section className="section faq-section" id="faq">
      <div className="shell">
        <FadeUp className="section-head">
          <h2 className="h-display">Before you ask</h2>
        </FadeUp>
        <FadeUp className="faq-wrap">
          {FAQ.map((entry) => (
            <details className="faq-item" key={entry.question}>
              <summary>{entry.question}<span className="faq-mark" aria-hidden="true">+</span></summary>
              <p className="faq-answer">{entry.answer}</p>
            </details>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
