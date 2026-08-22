import FadeUp from '@/components/FadeUp';
import { RULES } from '@/content/rules';

export default function HouseRules() {
  return (
    <section className="section" id="house-rules">
      <div className="shell">
        <FadeUp className="section-head">
          <h2 className="h-display">The house keeps a few traditions</h2>
        </FadeUp>
        <FadeUp className="rules-grid">
          {RULES.map((rule) => (
            <div className="rule-item" key={rule.title}>
              <h3>{rule.title}</h3>
              <p>{rule.body}</p>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
