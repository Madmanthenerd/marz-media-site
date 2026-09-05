// GET /.netlify/functions/check-availability?date=YYYY-MM-DD
// Returns open shoot slots for that date based on live Google Calendar availability.
//
// Requires these Netlify environment variables:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   - the service account's client_email
//   GOOGLE_SERVICE_ACCOUNT_KEY     - the service account's private_key (see note below)
//   GOOGLE_CALENDAR_ID             - the calendar to check (default: "primary")
//
// GOOGLE_SERVICE_ACCOUNT_KEY: paste the private_key from the downloaded JSON file
// exactly as-is, including the literal "\n" sequences. This code converts them
// back to real newlines below.

const { google } = require('googleapis');

// Business hours and slot length — adjust these to change how the calendar behaves.
const TIMEZONE = 'America/Chicago';
const DAY_START_HOUR = 9;   // 9am
const DAY_END_HOUR = 17;    // 5pm
const SLOT_MINUTES = 90;    // length of one shoot slot
const SKIP_SUNDAY = true;

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !rawKey) {
    throw new Error('Google service account credentials are not configured.');
  }
  const key = rawKey.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
}

function buildSlots(dateStr) {
  const slots = [];
  let cursor = new Date(`${dateStr}T${String(DAY_START_HOUR).padStart(2, '0')}:00:00`);
  const dayEnd = new Date(`${dateStr}T${String(DAY_END_HOUR).padStart(2, '0')}:00:00`);
  while (true) {
    const slotEnd = new Date(cursor.getTime() + SLOT_MINUTES * 60000);
    if (slotEnd > dayEnd) break;
    slots.push({ start: new Date(cursor), end: slotEnd });
    cursor = slotEnd;
  }
  return slots;
}

exports.handler = async (event) => {
  try {
    const date = event.queryStringParameters && event.queryStringParameters.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Provide a valid date=YYYY-MM-DD parameter.' }) };
    }

    const dow = new Date(`${date}T12:00:00`).getDay(); // 0 = Sunday
    if (SKIP_SUNDAY && dow === 0) {
      return { statusCode: 200, body: JSON.stringify({ date, slots: [] }) };
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    });

    const busy = (freebusy.data.calendars[calendarId] && freebusy.data.calendars[calendarId].busy) || [];
    const candidateSlots = buildSlots(date);

    const openSlots = candidateSlots.filter((slot) => {
      return !busy.some((b) => {
        const busyStart = new Date(b.start);
        const busyEnd = new Date(b.end);
        return slot.start < busyEnd && slot.end > busyStart; // overlap check
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        date,
        slots: openSlots.map((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
          label: s.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE }),
        })),
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not check availability right now.' }) };
  }
};
