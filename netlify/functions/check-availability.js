// GET /api/check-availability?from=YYYY-MM-DD&days=14&minutes=150
// Returns open start times for each day in the range, from live Google Calendar busy times.
// One calendar query covers the whole range.
//
// Netlify environment variables:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   the service account's client_email
//   GOOGLE_SERVICE_ACCOUNT_KEY     the service account's private_key, pasted as-is (literal \n is fine)
//   GOOGLE_CALENDAR_ID             your calendar's ID (usually your Gmail address)

const {
  SCHEDULE, houstonTime, houstonDateStr, addDays, calendarClient, busyBetween, openSlots, json,
} = require('./lib/shared');

exports.handler = async (event) => {
  try {
    const q = event.queryStringParameters || {};
    const today = houstonDateStr(new Date());
    const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || q.date || '') ? (q.from || q.date) : today;
    const days = Math.min(Math.max(parseInt(q.days || (q.date ? '1' : '14'), 10) || 14, 1), 31);
    const minutes = Math.min(Math.max(parseInt(q.minutes || '120', 10) || 120, 30), 480);

    const lastAllowed = addDays(today, SCHEDULE.daysAhead);
    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      if (d < today || d > lastAllowed) continue;
      dates.push(d);
    }
    if (!dates.length) return json(200, { from, days: {} });

    const calendar = calendarClient(false);
    const busy = await busyBetween(
      calendar,
      houstonTime(dates[0], '00:00'),
      houstonTime(addDays(dates[dates.length - 1], 1), '00:00'),
    );

    const out = {};
    for (const d of dates) out[d] = openSlots(d, minutes, busy);
    return json(200, { from, minutes, days: out });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Could not check availability right now.' });
  }
};
