import type { Photo } from '@/content/types';

/* The 21 lightbox slides, in gallery order. ORDER IS LOAD-BEARING: the hero
   button, the collage tiles and the mosaic tiles all jump into the lightbox by
   numeric index (0, 1, 4, 7, 14, 16, 18), so inserting or reordering a photo
   silently repoints those thumbnails at the wrong slide. */
export const PHOTOS: Photo[] = [
  { src: '/img/hero-tile-1.webp', width: 597, height: 800, alt: 'The bedroom through the door, floral bedding and wall art' },
  { src: '/img/hero-tile-2.webp', width: 1792, height: 2400, alt: 'Morning light in the hall' },
  { src: '/img/hero-tile-3.webp', width: 725, height: 1086, alt: 'Bedroom with framed miniature paintings above the bed' },
  { src: '/img/hero-tile-4.webp', width: 800, height: 1071, alt: 'Green ceramic breakfast set on the marble sill' },
  { src: '/img/lr-temple.webp', width: 1792, height: 2400, alt: 'Hand-painted mandir in the living room' },
  { src: '/img/induction.webp', width: 2048, height: 1535, alt: 'Kitchen counter with induction cooktop, kettle, and clay matka' },
  { src: '/img/bath-essentials.webp', width: 2048, height: 869, alt: 'Body wash, conditioner, and shampoo dispensers in the bathroom' },
  { src: '/img/bath-wide.webp', width: 2048, height: 1529, alt: 'Full bathroom with hot water' },
  { src: '/img/kitchen-1.webp', width: 2048, height: 1374, alt: 'Kitchenette' },
  { src: '/img/exterior.webp', width: 2048, height: 1529, alt: 'The sunlit terrace just outside the apartment' },
  { src: '/img/bedside.webp', width: 1152, height: 1536, alt: 'Carved bedside table with brass lamp' },
  { src: '/img/lr-flower.webp', width: 1792, height: 2400, alt: 'Hand-painted floral detail' },
  { src: '/img/kitchen-crockery.webp', width: 2048, height: 1143, alt: 'Tea, sugar, and masala jars on the kitchen shelf' },
  { src: '/img/fridge.webp', width: 1086, height: 1448, alt: 'Whirlpool refrigerator with voltage stabiliser' },
  { src: '/img/bedroom-front.webp', width: 1536, height: 2752, alt: 'Bedroom front view' },
  { src: '/img/lr-wide3.webp', width: 1792, height: 2400, alt: 'Living room view' },
  { src: '/img/lr-wide1.webp', width: 1856, height: 2304, alt: 'Living room with floor seating and prayer nook' },
  { src: '/img/lr-almirah.webp', width: 1536, height: 2752, alt: 'Built-in almirah clothes storage' },
  { src: '/img/kitchen-wide.webp', width: 2048, height: 1143, alt: 'Full kitchen wide angle' },
  { src: '/img/bath-side.webp', width: 2048, height: 1529, alt: 'Bathroom side angle' },
  { src: '/img/bedroom-curtains-open.webp', width: 2048, height: 1529, alt: 'Bedroom with curtains open and window AC' },
];
