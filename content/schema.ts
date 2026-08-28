import { FAQ } from '@/content/faq';

/* The single JSON-LD @graph the page injects. The FAQPage entries are MAPPED
   from FAQ rather than restated, so the rich result can never claim something
   the visible page does not say.

   The guest reviews are NOT in here, and must not go back in. Google's
   review-snippet guidelines rule this out twice over:

     - "If the entity that's being reviewed controls the reviews about itself,
       their pages that use LocalBusiness or any other type of Organization
       structured data are ineligible for star review feature." LodgingBusiness
       is a LocalBusiness subtype, and this is our own site.
     - "Don't aggregate reviews or ratings from other websites." Ours came from
       the Airbnb listing.

   Violating those risks a spammy-structured-markup manual action, and the stars
   were never going to render anyway. The reviews still show on the page for
   people to read — that is unaffected, and is where they belong. Star ratings in
   search should come from the Google Business Profile instead. */
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
      /* No aggregateRating and no review here, deliberately — see the note above.
         REVIEWS still renders on the page for people to read; it just is not
         claimed as a rich result. */
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
