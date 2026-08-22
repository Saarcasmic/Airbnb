/* Shared shapes for the page's content. Everything the old index.html hard-coded
   as markup lives here as data instead, so the visible copy and the JSON-LD are
   generated from ONE source and can never drift apart. */

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

/* A guest review. `screenshot` is the WhatsApp/Airbnb screenshot shown in the
   review rail; `body` is the shorter line that goes into the JSON-LD Review. */
export type Review = {
  author: string;
  screenshot: string;
  width: number;
  height: number;
  /** alt text for the screenshot image */
  alt: string;
  /** reviewBody for schema.org — deliberately separate from `alt` */
  body: string;
};

/* The visible <details> copy and the JSON-LD answer differ in a few places
   ("shown on this page" vs "shown on this website", and one longer question
   title). Both are kept verbatim so neither surface changes. */
export type FaqEntry = {
  /** the <summary> text on the page */
  question: string;
  /** the <p class="faq-answer"> text on the page */
  answer: string;
  /** schema.org Question name — falls back to `question` when identical */
  schemaQuestion?: string;
  /** schema.org acceptedAnswer text — falls back to `answer` when identical */
  schemaAnswer?: string;
};

export type Distance = {
  place: string;
  /** e.g. "5 min walk", "5 min · 650 m" */
  time: string;
};

export type Rule = {
  title: string;
  body: string;
};
