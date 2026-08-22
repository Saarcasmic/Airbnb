import { FAQ } from '@/content/faq';
import { REVIEWS } from '@/content/reviews';

/* The single JSON-LD @graph the page injects. The review list and the FAQPage
   entries are MAPPED from REVIEWS and FAQ rather than restated, so the rich
   result can never claim something the visible page does not say. Everything
   else is a straight transcription of the original <script type=ld+json>. */
export const JSON_LD: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.pyari-kunj.in/#website',
      url: 'https://www.pyari-kunj.in/',
      name: 'Pyari Kunj Vrindavan',
      inLanguage: 'en-IN',
    },
    {
      '@type': 'LodgingBusiness',
      '@id': 'https://www.pyari-kunj.in/#lodging',
      name: 'Pyari Kunj Vrindavan',
      url: 'https://www.pyari-kunj.in/',
      description:
        'Pyari Kunj Vrindavan is a peaceful 1BHK homestay near Banke Bihari Temple, with ISKCON and Prem Mandir an easy e-rickshaw ride away. AC, a kitchen, self check-in, free parking, and space for up to four guests. Book direct for a final all-in price with instant confirmation.',
      image: [
        'https://www.pyari-kunj.in/img/og-share.jpg',
        'https://www.pyari-kunj.in/img/lr-wide1.webp',
        'https://www.pyari-kunj.in/img/kitchen-wide.webp',
        'https://www.pyari-kunj.in/img/mandir-900.webp',
      ],
      priceRange: '₹2,499',
      checkinTime: '12:00',
      checkoutTime: '10:00',
      makesOffer: {
        '@type': 'Offer',
        name: 'Direct booking',
        price: '2499',
        priceCurrency: 'INR',
        description:
          'Nightly rate for the entire 1BHK homestay. Final all-in price — no taxes, cleaning, or service fees. Seasonal offer codes can be applied at checkout.',
      },
      telephone: '+91 8791567123',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '6, Malti Kunj, Rattan Chatri',
        addressLocality: 'Vrindavan',
        addressRegion: 'Uttar Pradesh',
        postalCode: '281121',
        addressCountry: 'IN',
      },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Air conditioning', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Free parking', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Kitchen', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Self check-in', value: true },
      ],
      numberOfRooms: 1,
      occupancy: {
        '@type': 'QuantitativeValue',
        maxValue: 4,
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5.0',
        reviewCount: '16',
        bestRating: '5',
      },
      review: REVIEWS.map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
        reviewBody: r.body,
      })),
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.pyari-kunj.in/#faq',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.schemaQuestion ?? f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.schemaAnswer ?? f.answer,
        },
      })),
    },
  ],
};
