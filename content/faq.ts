import type { FaqEntry } from '@/content/types';

/* The visible copy and the JSON-LD copy are NOT the same text. The page can say
   "above" and "this page" because the booking desk is right there; the rich
   result is read out of context, so it spells out "Pyari Kunj" and "this
   website". Where the two versions differ the schema wording is kept in
   schemaQuestion / schemaAnswer; where they match, those fields are omitted and
   schema.ts falls back to the visible string. Do not "tidy" either side. */
export const FAQ: FaqEntry[] = [
  {
    question: 'Is Pyari Kunj a homestay in Vrindavan near Banke Bihari Temple?',
    answer: 'Yes. Pyari Kunj is a private 1BHK homestay in Vrindavan, about a 5-minute walk (650 m) from Banke Bihari Temple, making it convenient for temple visits and central Vrindavan stays.',
  },
  {
    question: 'How much does Pyari Kunj cost per night?',
    answer: 'The rate is ₹2,499 per night for the entire 1BHK homestay. That is the final all-in price — no taxes, cleaning, or service fees are added. When a seasonal offer is running, the code is shown on this page and you can apply it before paying.',
    schemaAnswer: 'The rate is ₹2,499 per night for the entire 1BHK homestay. That is the final all-in price — no taxes, cleaning, or service fees are added. When a seasonal offer is running, the code is shown on this website and you can apply it before paying.',
  },
  {
    question: 'How do I book directly?',
    answer: 'Pick your dates above to see your total, apply an offer code if you have one, then pay securely by UPI, card, or netbanking through Razorpay. Your booking is confirmed instantly.',
    schemaQuestion: 'How do I book Pyari Kunj directly?',
    schemaAnswer: 'Pick your dates on this website to see your total, apply an offer code if you have one, then pay securely by UPI, card, or netbanking through Razorpay. Your booking is confirmed instantly.',
  },
  {
    question: 'Is parking available?',
    answer: 'Yes. Pyari Kunj offers free on-premises parking, which is useful for guests arriving by car in Vrindavan.',
    schemaQuestion: 'Is parking available at Pyari Kunj Vrindavan?',
  },
  {
    question: 'Is this better for families than a hotel in Vrindavan?',
    answer: 'For many families, yes. Pyari Kunj gives you a private 1BHK setup with kitchen access, parking, and a quieter home-style environment instead of a standard hotel room.',
  },
  {
    question: 'What is the cancellation policy?',
    answer: "Cancel at least 24 hours before your check-in date for a full refund. Cancellations within 24 hours of check-in, or no-shows, are refunded 50%. If we ever have to cancel your confirmed booking, you're refunded in full. Refunds return to your original payment method via Razorpay in about 5–7 working days.",
  },
  {
    question: 'Is Pyari Kunj a good base during Janmashtami or Radha Ashtami?',
    answer: "Yes — being an under-10-minute walk from Banke Bihari Ji matters most exactly when the lanes are busiest, such as Janmashtami or Radha Ashtami. ISKCON's Janmashtami celebration also draws huge crowds and is an easy e-rickshaw ride away. Rooms fill early for these dates, so booking a few weeks ahead is worth it.",
  },
  {
    question: 'How many nights should I plan for a Vrindavan trip?',
    answer: 'Two to three nights covers Banke Bihari Ji, Nidhivan, Radha Raman Ji, and a relaxed walk through Loi Bazar without rushing. Longer stays suit a fuller parikrama including ISKCON and Prem Mandir.',
  },
  {
    question: 'Which Vrindavan temples are within walking distance of Pyari Kunj?',
    answer: 'Quite a few. Shri Madan Mohan Ji is a 5-minute walk, Shri Banke Bihari Ji is 5 minutes (650 m), Shri Govind Dev Ji is about 10 minutes, Shri Radhavallabh Ji is 12 minutes, and Nidhivan, Seva Kunj, Shri Radha Raman Ji, Shahji Temple, Rangji Temple and Loi Bazar market are all within 15–20 minutes on foot.',
  },
  {
    question: 'How do I reach ISKCON Vrindavan and Prem Mandir from Pyari Kunj?',
    answer: "By a short, inexpensive e-rickshaw ride — it's how pilgrims from this side of town make the trip daily. ISKCON's Sri Krishna Balaram Mandir and Prem Mandir sit close enough to each other that most guests cover both in one outing.",
  },
];
