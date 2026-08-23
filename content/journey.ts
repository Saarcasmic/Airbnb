/* The arrival guide behind /getting-to-vrindavan.

   Distances and durations are deliberately given as approximate ranges. They
   vary with the route taken and the traffic, and a guest who is told "25 minutes"
   and takes 40 feels misled. Nothing here quotes a fare: auto, e-rickshaw and
   taxi prices move constantly and are usually negotiated, so a number printed
   here would be wrong within a season and would read as a quote we are bound to.

   TODO (Saar): if you want fares on the page, add them here as ranges you are
   willing to stand behind, and they will render in the "what it costs" slot. */

export type Route = {
  mode: string;
  /** the headline fact — kept vague enough to stay true */
  summary: string;
  detail: string;
};

export const ROUTES: Route[] = [
  {
    mode: 'By train',
    summary: 'Mathura Junction, then roughly 25–30 minutes by road',
    detail:
      'Mathura Junction (MTJ) is the practical railhead for Vrindavan — about 12–15 km away depending on the route, and very well connected. From New Delhi or Hazrat Nizamuddin the run to Mathura is broadly a 1.5–2 hour train journey. Vrindavan has a small station of its own, but it sees far fewer services, so most guests arrive via Mathura Junction and cover the last stretch by road.',
  },
  {
    mode: 'By road from Delhi',
    summary: 'About 180 km on the Yamuna Expressway, roughly 3–3.5 hours',
    detail:
      'The Yamuna Expressway is among the better highways in the country and the drive is straightforward. Traffic getting out of Delhi is usually the only real variable, so leaving early buys you more than driving fast does. Free parking is available on the premises when you arrive.',
  },
  {
    mode: 'By air',
    summary: 'Delhi (DEL) is the sensible airport, Agra (AGR) is closer',
    detail:
      'Vrindavan has no airport. Agra is nearer at roughly 55 km, but its flight schedule is thin. Delhi is around 150–180 km away and has vastly more connections, so most guests flying in land at Delhi and continue by road or rail from there.',
  },
  {
    mode: 'The last stretch',
    summary: 'Auto and e-rickshaw run continuously into the old town',
    detail:
      'From Mathura Junction you can take a taxi, an auto, or an app cab. Within Vrindavan itself the e-rickshaw is what everyone uses, and they run constantly. Ask for Rattan Chatri — it is the landmark local drivers know. The exact address and door directions are sent on WhatsApp once your booking is confirmed.',
  },
];

/* Practical notes about arriving at the house itself. All of this comes from how
   the property actually operates — check-in window, parking, the caretaker. */
export const ARRIVAL_NOTES = [
  {
    title: 'Check-in is 12:00–6:00 pm',
    body: 'Check-out is before 10:00 am. Timings can sometimes flex depending on the booking either side of yours — message ahead and we will tell you honestly whether it is possible.',
  },
  {
    title: 'Someone is there to let you in',
    body: 'Caretaker Dinesh Ji welcomes you at the homestay and hands over the flat. You are not hunting for a lockbox in a lane you have never seen.',
  },
  {
    title: 'Free parking, and a warning about the monkeys',
    body: 'Parking on the premises is free. Vrindavan monkeys are genuinely opportunistic — keep glasses, phones and bags close on the walk in, and do not leave anything visible in the car.',
  },
  {
    title: 'It is on the first floor',
    body: 'The apartment is up one flight of stairs, in a quiet family building. Worth knowing in advance if anyone travelling with you finds stairs difficult.',
  },
];
