/* Photographs for the festival Event structured data.
   ─────────────────────────────────────────────────────────────────────────────
   Every photo the site itself owns is of the house, and Google asks that an
   Event image depict the event. So these come from Wikimedia Commons — freely
   licensed, and each one checked by hand for what it actually shows.

   Two rules were applied when picking them:

     1. Never label a photo as something it is not. Where Commons has no image
        of the observance, the festival falls back to DEFAULT_IMAGES — Vrindavan
        itself — rather than borrowing a photo of a different festival, or of
        the right festival in the wrong part of the country.
     2. Every licence here requires attribution, which JSON-LD gives no place to
        put. The page therefore renders a visible credit list; do not add an
        entry here without adding it there too. CREDITS is derived from this
        file so the two cannot drift.

   Files are referenced at their 1280px Commons thumbnail (Google wants ≥1200px
   wide) rather than the multi-megabyte originals. */

export type FestivalImage = {
  /** Direct Commons thumbnail URL. Verified to return 200 image/jpeg. */
  url: string;
  /** Photographer, exactly as credited on Commons. */
  credit: string;
  license: 'CC BY-SA 4.0' | 'CC BY-SA 3.0' | 'CC BY 3.0';
  /** The Commons file page — where the licence and full credit live. */
  source: string;
  /** What the photograph actually shows. Kept honest, not aspirational. */
  depicts: string;
};

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';
const THUMB = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

const BANKE_BIHARI: FestivalImage = {
  url: `${THUMB}/0/0d/Banke_Bihari_Temple%2C_Vrindavan%2C_Mathura%2C_Uttar_Pradesh%2C_India_%282010%29.jpg/1280px-Banke_Bihari_Temple%2C_Vrindavan%2C_Mathura%2C_Uttar_Pradesh%2C_India_%282010%29.jpg`,
  credit: 'Guptaele',
  license: 'CC BY-SA 4.0',
  source: `${COMMONS}Banke_Bihari_Temple,_Vrindavan,_Mathura,_Uttar_Pradesh,_India_(2010).jpg`,
  depicts: 'Shri Banke Bihari Mandir, Vrindavan',
};

const VRINDAVAN_STREETS: FestivalImage = {
  url: `${THUMB}/c/c3/Street_Scenes_and_Temples_of_Mathura_%26_Vrindavan_001.jpg/1280px-Street_Scenes_and_Temples_of_Mathura_%26_Vrindavan_001.jpg`,
  credit: 'Shoot stufz',
  license: 'CC BY-SA 4.0',
  source: `${COMMONS}Street_Scenes_and_Temples_of_Mathura_%26_Vrindavan_001.jpg`,
  depicts: 'The lanes and temples of Mathura and Vrindavan',
};

/* Used by every festival Commons has no photograph of. Vrindavan is at least
   the true location of all of them. */
const DEFAULT_IMAGES: FestivalImage[] = [BANKE_BIHARI, VRINDAVAN_STREETS];

const BY_SLUG: Record<string, FestivalImage[]> = {
  'radha-ashtami': [
    {
      url: `${THUMB}/7/74/Radharani_Temple_Barsana_2.jpg/1280px-Radharani_Temple_Barsana_2.jpg`,
      credit: 'Kridha20',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Radharani_Temple_Barsana_2.jpg`,
      depicts: 'Shri Radha Rani Temple, Barsana — where Radha Ashtami is kept',
    },
    {
      url: `${THUMB}/7/70/Radharani_Temple_Barsana_3.jpg/1280px-Radharani_Temple_Barsana_3.jpg`,
      credit: 'Kridha20',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Radharani_Temple_Barsana_3.jpg`,
      depicts: 'Shri Radha Rani Temple, Barsana',
    },
  ],

  'sharad-purnima': [
    {
      url: `${THUMB}/f/f3/The_Moon_on_Sharad_Purnima_2017.jpg/1280px-The_Moon_on_Sharad_Purnima_2017.jpg`,
      credit: 'ShotgunMavericks',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}The_Moon_on_Sharad_Purnima_2017.jpg`,
      depicts: 'The Sharad Purnima full moon',
    },
    BANKE_BIHARI,
  ],

  'govardhan-puja': [
    {
      url: `${THUMB}/7/7f/Govardhan_Puja.jpg/1280px-Govardhan_Puja.jpg`,
      credit: 'Milan Madhav Das',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Govardhan_Puja.jpg`,
      depicts: 'Govardhan Puja on the Vraja Mandala parikrama, Vrindavan',
    },
    {
      url: `${THUMB}/5/55/Mansi_Ganga_Pravesh_Dwar_and_End_of_Parikrama_Gate_-_panoramio.jpg/1280px-Mansi_Ganga_Pravesh_Dwar_and_End_of_Parikrama_Gate_-_panoramio.jpg`,
      credit: 'Gyanendra_Singh_Chau… (Panoramio)',
      license: 'CC BY 3.0',
      source: `${COMMONS}Mansi_Ganga_Pravesh_Dwar_and_End_of_Parikrama_Gate_-_panoramio.jpg`,
      depicts: 'The Govardhan parikrama gate at Mansi Ganga',
    },
  ],

  'barsana-lathmar-holi': [
    {
      url: `${THUMB}/c/ca/LATHMAR_HOLI.jpg/1280px-LATHMAR_HOLI.jpg`,
      credit: 'Arpan.basuchowdhury',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}LATHMAR_HOLI.jpg`,
      depicts: 'Lathmar Holi',
    },
    {
      url: `${THUMB}/2/2e/Lathmar_Holi_is_a_local_celebration_of_the_Hindu_festival_of_Holi_which_takes_in_Barsana_and_Nandgaon.jpg/1280px-Lathmar_Holi_is_a_local_celebration_of_the_Hindu_festival_of_Holi_which_takes_in_Barsana_and_Nandgaon.jpg`,
      credit: 'Vijay Sundararaman Iyer',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Lathmar_Holi_is_a_local_celebration_of_the_Hindu_festival_of_Holi_which_takes_in_Barsana_and_Nandgaon.jpg`,
      depicts: 'Lathmar Holi at Barsana and Nandgaon',
    },
  ],

  'nandgaon-lathmar-holi': [
    {
      url: `${THUMB}/4/4b/Lathmar_Holi_2022_in_Nandgaon%2C_Uttar_Pradesh.jpg/1280px-Lathmar_Holi_2022_in_Nandgaon%2C_Uttar_Pradesh.jpg`,
      credit: 'Sachinghai09',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Lathmar_Holi_2022_in_Nandgaon,_Uttar_Pradesh.jpg`,
      depicts: 'Lathmar Holi at Nandgaon, 2022',
    },
    {
      url: `${THUMB}/d/d1/Holi_Celebration_in_Nandgaon%2C_Mathura%2C_Uttar_Pradesh.jpg/1280px-Holi_Celebration_in_Nandgaon%2C_Mathura%2C_Uttar_Pradesh.jpg`,
      credit: 'KuldeepRawat07',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Holi_Celebration_in_Nandgaon,_Mathura,_Uttar_Pradesh.jpg`,
      depicts: 'Holi at Nandgaon, Mathura',
    },
  ],

  'phoolon-wali-holi': [
    {
      url: `${THUMB}/1/12/Flowers_Holi_Celebration.jpg/1280px-Flowers_Holi_Celebration.jpg`,
      credit: 'Saxenation',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Flowers_Holi_Celebration.jpg`,
      depicts: 'Flowers poured over devotees at Banke Bihari Mandir, Vrindavan',
    },
    {
      url: `${THUMB}/2/27/Banke_Bihari_Mandir_Vrindavan_-_Phool_Bangla_Darshan.jpg/1280px-Banke_Bihari_Mandir_Vrindavan_-_Phool_Bangla_Darshan.jpg`,
      credit: 'Aliva Sahoo',
      license: 'CC BY-SA 3.0',
      source: `${COMMONS}Banke_Bihari_Mandir_Vrindavan_-_Phool_Bangla_Darshan.jpg`,
      depicts: 'Phool Bangla darshan at Banke Bihari Mandir, Vrindavan',
    },
  ],

  'holika-dahan': [
    {
      url: `${THUMB}/5/50/Holika_Dahan_-_Traditional_Bonfire_Ceremony_of_Holi_12.jpg/1280px-Holika_Dahan_-_Traditional_Bonfire_Ceremony_of_Holi_12.jpg`,
      credit: 'Shoot stufz',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Holika_Dahan_-_Traditional_Bonfire_Ceremony_of_Holi_12.jpg`,
      depicts: 'The Holika Dahan bonfire',
    },
    BANKE_BIHARI,
  ],

  dhulandi: [
    {
      url: `${THUMB}/5/5d/Holi_festival%2C_Vrindavan%2C_Mathura%2C_Uttar_Pradesh%2C_India_%282018%29_1.jpg/1280px-Holi_festival%2C_Vrindavan%2C_Mathura%2C_Uttar_Pradesh%2C_India_%282018%29_1.jpg`,
      credit: 'Joyrajsamanta',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Holi_festival,_Vrindavan,_Mathura,_Uttar_Pradesh,_India_(2018)_1.jpg`,
      depicts: 'Holi in Vrindavan, 2018',
    },
    {
      url: `${THUMB}/6/60/Vrindavan_holi_03.jpg/1280px-Vrindavan_holi_03.jpg`,
      credit: 'Azimronnie',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Vrindavan_holi_03.jpg`,
      depicts: 'Holi in Vrindavan',
    },
  ],

  'radha-raman-appearance': [
    {
      url: `${THUMB}/9/97/Radha_Raman_Temple.jpg/1280px-Radha_Raman_Temple.jpg`,
      credit: 'Kridha20',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Radha_Raman_Temple.jpg`,
      depicts: 'Shri Radha Raman Temple, Vrindavan',
    },
    {
      url: `${THUMB}/a/a4/Entrance_Radha_Raman_Temple%2C_Vrindavan.jpg/1280px-Entrance_Radha_Raman_Temple%2C_Vrindavan.jpg`,
      credit: 'Ekabhishek',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Entrance_Radha_Raman_Temple,_Vrindavan.jpg`,
      depicts: 'The entrance to Shri Radha Raman Temple, Vrindavan',
    },
  ],

  /* The one photograph here from outside Braj. It genuinely shows Jhulan Yatra
     — Radha and Krishna on the flower swing — which is the thing worth showing;
     Commons has no Vrindavan equivalent. Paired with Vrindavan for place. */
  'jhulan-yatra': [
    {
      url: `${THUMB}/4/45/Idols_of_Radha_Krishna_seated_on_a_beautifully_decorated_swing_with_flowers_and_lights_on_occasion_of_Jhulan_Yatra_at_Radha_Krishna_temple%2C_Dibrugarh_02.jpg/1280px-Idols_of_Radha_Krishna_seated_on_a_beautifully_decorated_swing_with_flowers_and_lights_on_occasion_of_Jhulan_Yatra_at_Radha_Krishna_temple%2C_Dibrugarh_02.jpg`,
      credit: 'AjayDas',
      license: 'CC BY-SA 4.0',
      source: `${COMMONS}Idols_of_Radha_Krishna_seated_on_a_beautifully_decorated_swing_with_flowers_and_lights_on_occasion_of_Jhulan_Yatra_at_Radha_Krishna_temple,_Dibrugarh_02.jpg`,
      depicts: 'Radha and Krishna on the Jhulan Yatra swing',
    },
    BANKE_BIHARI,
  ],
};

/** Images for a festival. Falls back to Vrindavan where none depicts it. */
export function imagesFor(slug: string): FestivalImage[] {
  return BY_SLUG[slug] ?? DEFAULT_IMAGES;
}

/** Just the URLs, for Event.image. */
export function imageUrlsFor(slug: string): string[] {
  return imagesFor(slug).map((i) => i.url);
}

/* Every distinct photograph, deduplicated by URL — the visible credit list the
   licences require. Derived, so it can never fall out of step with the above. */
export const CREDITS: FestivalImage[] = Object.values(BY_SLUG)
  .concat([DEFAULT_IMAGES])
  .flat()
  .filter((img, i, all) => all.findIndex((o) => o.url === img.url) === i);
