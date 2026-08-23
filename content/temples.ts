/* The temple guide behind /temples-near-pyari-kunj.

   `walk` values are the same figures the home page publishes in
   content/distances.ts — they must stay in step, so if one is corrected the
   other should be too.

   The notes deliberately describe what a temple IS and what the walk is like,
   never darshan timings: those shift with the season and the festival calendar,
   and a wrong time printed on a website sends a guest across town for nothing.
   Dinesh Ji gives the current timings on arrival. */

export type Temple = {
  name: string;
  /** matches the home page's distance list */
  walk: string;
  /** what makes it worth the walk */
  note: string;
};

export const WALKABLE_TEMPLES: Temple[] = [
  {
    name: 'Shri Banke Bihari Ji',
    walk: '5 min · 650 m',
    note: 'The temple most people come to Vrindavan for. Bihari Ji is not shown continuously — the curtain is drawn and redrawn, so darshan arrives in glimpses rather than one long view. Evenings and festival days draw the heaviest crowds, which is exactly when being a few minutes away on foot stops being a convenience and starts being the reason you booked here.',
  },
  {
    name: 'Shri Madan Mohan Ji',
    walk: '5 min walk',
    note: 'One of the oldest temples in Vrindavan, set on a rise above the Yamuna in weathered red sandstone. The deity worshipped here today is a replacement — the original was moved to Karauli in Rajasthan centuries ago. It stays quiet even when the rest of town does not, and the climb is short.',
  },
  {
    name: 'Shri Govind Dev Ji',
    walk: '~10 min walk',
    note: 'A late-16th-century red sandstone temple, and architecturally the most ambitious building in old Vrindavan. What stands now is a fraction of the original height, and even so the scale inside is unlike anything else nearby. Worth going for the building as much as the darshan.',
  },
  {
    name: 'Shri Radhavallabh Ji',
    walk: '12 min walk',
    note: 'The seat of the Radhavallabh Sampradaya, founded by Hit Harivansh Mahaprabhu. The mood here is distinctly its own — the tradition places Radha at the centre of everything, and the singing reflects it.',
  },
  {
    name: 'Nidhivan & Seva Kunj',
    walk: '15 min walk',
    note: 'Two low, tangled groves rather than temples in the usual sense. Both carry the same belief: that the raas leela continues here after dark, and that no one should remain inside once the evening aarti is done. Whatever you make of it, the groves are unlike anywhere else in the town.',
  },
  {
    name: 'Shri Radha Raman Ji',
    walk: '15 min walk',
    note: 'Home to a small self-manifested deity that appeared to Gopala Bhatta Goswami from a shaligram shila, and one of the few temples in Vrindavan where the original deity has never left. Modest from outside, dense with history inside.',
  },
  {
    name: 'Shahji Temple',
    walk: '~15 min walk',
    note: 'A 19th-century temple best known for its Basanti Kamra and the spiral marble columns that give the hall its twist. Far less visited than the older temples, which is part of its appeal.',
  },
  {
    name: 'Rangji Temple & Loi Bazar',
    walk: '15–20 min walk',
    note: 'Rangji is South Indian Dravidian architecture dropped into Braj — a tall gopuram and a long colonnaded approach that looks nothing like its neighbours. Loi Bazar sits on the way back, which makes this the natural walk for an unhurried afternoon.',
  },
];

/* Not walkable, but close enough that most guests cover both in one outing. */
export const RICKSHAW_TEMPLES: Temple[] = [
  {
    name: 'ISKCON Vrindavan',
    walk: 'short e-rickshaw ride',
    note: 'The Sri Krishna Balaram Mandir, founded by Srila Prabhupada, whose samadhi stands in the same complex. Well organised, and easier to navigate than the old-town temples if this is a first visit.',
  },
  {
    name: 'Prem Mandir',
    walk: 'short e-rickshaw ride',
    note: 'Modern white marble on a scale nothing else here attempts, built under Jagadguru Kripalu Maharaj. Go after dark — the illumination is the point, and it is the one temple on this list that is genuinely better in the evening.',
  },
];

/* Honest planning notes. Everything here is either observable or comes from how
   the house actually runs — no invented timings, no invented fares. */
export const PLANNING_NOTES = [
  {
    title: 'Go early for Bihari Ji',
    body: 'The lanes around Banke Bihari Ji fill through the day and are at their tightest in the evening. Guests who walk over early tend to describe a completely different experience from those who go at peak.',
  },
  {
    title: 'Leave the car parked',
    body: 'Everything on this list except ISKCON and Prem Mandir is reachable on foot from the door. The old-town lanes are narrow and often closed to cars anyway, so driving between temples usually costs more time than it saves. Parking at the house is free.',
  },
  {
    title: 'Two or three days is the honest answer',
    body: 'One night covers Banke Bihari Ji and little else without rushing. Two to three nights covers this whole list at a walking pace, with an evening left over for Prem Mandir.',
  },
  {
    title: 'Ask before you set out',
    body: 'Darshan timings move with the season and the festival calendar, and published times go stale fast. Dinesh Ji is on site and will tell you what is open when — that is more reliable than anything printed in advance.',
  },
];
