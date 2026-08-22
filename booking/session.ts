/* A one-shot hand-off between routes.

   "Start a new booking" on /confirmed used to reset the funnel and reopen the
   calendar in the same click, because both lived on the same page. Now that it
   navigates, the intent has to survive the hop — via sessionStorage rather than a
   query parameter, so nothing lands in the URL that could be shared or indexed. */

export const REQUEST_CALENDAR_KEY = 'pk_open_calendar';

/** Reads and clears the flag in one go: it must only ever fire once. */
export function consumeCalendarRequest(): boolean {
  try {
    if (sessionStorage.getItem(REQUEST_CALENDAR_KEY) !== '1') return false;
    sessionStorage.removeItem(REQUEST_CALENDAR_KEY);
    return true;
  } catch {
    return false;
  }
}
