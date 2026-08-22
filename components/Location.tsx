import FadeUp from '@/components/FadeUp';
import { DISTANCES } from '@/content/distances';

const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3536.5233959123634!2d77.6840303757909!3d27.57729833121482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39736f47f3b07383%3A0xf6a2751e6731bdfb!2sPyari%20Kunj%20-%20Near%20Bankey%20Bihari%20(Airbnb%20%E2%80%A2%20Vrindavan)!5e0!3m2!1sen!2sin!4v1784275142743!5m2!1sen!2sin';

export default function Location() {
  return (
    <section className="section" id="location">
      <div className="shell loc-grid">
        <FadeUp className="loc-copy">
          <h2 className="h-display">Everything holy is a walk away</h2>
          <p className="lede">The home sits in old Vrindavan, on the temple side of town. Shri Banke Bihari Ji, Shri Govind Dev Ji, Shri Radhavallabh Ji and Shahji Temple all sit within a few minutes of the doorstep. Leave the car parked — the lanes do the rest.</p>
          <ul className="distance-list">
            {DISTANCES.map((distance) => (
              <li key={distance.place}>
                {distance.place} <span className="d-dots" aria-hidden="true"></span> <span className="d-time">{distance.time}</span>
              </li>
            ))}
          </ul>
          <p className="loc-note">Looking for a place to stay near Prem Mandir or ISKCON Vrindavan? Pyari Kunj is a private homestay a short, inexpensive e-rickshaw ride from both — many guests cover the two in one outing. Located in Vrindavan (Vrindaban), Mathura district, Uttar Pradesh. The exact address is shared after your booking is confirmed.</p>
        </FadeUp>
        <FadeUp as="figure" className="loc-map">
          <div className="loc-map-frame">
            <iframe src={MAP_EMBED_SRC} title="Map: Pyari Kunj, near Banke Bihari Temple, Vrindavan" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"></iframe>
          </div>
          <figcaption className="loc-map-bar">
            <svg className="lm-pin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="lm-text"><strong>Pyari Kunj</strong> · old Vrindavan, on the temple side of town</span>
            <a className="lm-open" href="https://www.google.com/maps/search/?api=1&query=Pyari+Kunj+Near+Bankey+Bihari+Vrindavan" target="_blank" rel="noopener">Open in Google Maps</a>
          </figcaption>
        </FadeUp>
      </div>
      <div className="shell">
        <FadeUp className="ig-moment ig-wide">
          <div className="ig-frame">
            <iframe src="https://www.instagram.com/p/DZsPN4GmBuM/embed/" title="Instagram carousel: how close Pyari Kunj is to Vrindavan's famous temples" loading="lazy" allowFullScreen scrolling="no"></iframe>
          </div>
          <div className="ig-bar">
            <svg className="ig-glyph" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            <span className="ig-text">How close the temples really are, in one swipe</span>
            <a className="ig-open" href="https://www.instagram.com/p/DZsPN4GmBuM/" target="_blank" rel="noopener">See on Instagram</a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
