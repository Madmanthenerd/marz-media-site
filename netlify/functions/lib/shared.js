// Shared helpers for the booking functions: Houston time math, Google Calendar access,
// and turning busy blocks into open start times.

const { google } = require('googleapis');
const { SCHEDULE } = require('../../../pricing.js');

const TZ = SCHEDULE.timezone;

// Offset (ms) between UTC and the given time zone at instant `ms`.
function tzOffset(ms, tz = TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ms));
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second);
  return asUTC - Math.floor(ms / 1000) * 1000;
}

// "2026-10-12", "09:30" in Houston → Date (correct across daylight-saving changes).
function houstonTime(dateStr, hhmm) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffset(guess);
  const second = guess - tzOffset(t);
  if (second !== t) t = second;
  return new Date(t);
}

function houstonDateStr(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function dayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
}

function formatLong(date) {
  return date.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ,
  });
}

function calendarClient(write = false) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !rawKey) throw new Error('Google service account credentials are not configured.');
  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, '\n'),
    scopes: [write ? 'https://www.googleapis.com/auth/calendar' : 'https://www.googleapis.com/auth/calendar.readonly'],
  });
  return google.calendar({ version: 'v3', auth });
}

function calendarId() { return process.env.GOOGLE_CALENDAR_ID || 'primary'; }

async function busyBetween(calendar, from, to) {
  const id = calendarId();
  const res = await calendar.freebusy.query({
    requestBody: { timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: TZ, items: [{ id }] },
  });
  const cal = res.data.calendars && res.data.calendars[id];
  if (cal && cal.errors && cal.errors.length) {
    throw new Error(`Calendar not readable by the service account: ${JSON.stringify(cal.errors)}`);
  }
  return ((cal && cal.busy) || []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

// Open start times for one Houston date, given busy blocks and the shoot length.
function openSlots(dateStr, minutes, busy, now = new Date()) {
  if (!SCHEDULE.openDays.includes(dayOfWeek(dateStr))) return [];
  const step = SCHEDULE.stepMinutes * 60000;
  const len = minutes * 60000;
  const buf = SCHEDULE.bufferMinutes * 60000;
  const earliest = now.getTime() + SCHEDULE.minNoticeHours * 3600000;
  const dayEnd = houstonTime(dateStr, SCHEDULE.lastEnd).getTime();
  const slots = [];
  for (let t = houstonTime(dateStr, SCHEDULE.firstStart).getTime(); t + len <= dayEnd; t += step) {
    if (t < earliest) continue;
    const s = t - buf;
    const e = t + len + buf;
    if (busy.some((b) => s < b.end.getTime() && e > b.start.getTime())) continue;
    const start = new Date(t);
    slots.push({ start: start.toISOString(), end: new Date(t + len).toISOString(), label: formatTime(start) });
  }
  return slots;
}

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = {
  TZ, SCHEDULE, tzOffset, houstonTime, houstonDateStr, addDays, dayOfWeek, formatTime, formatLong,
  calendarClient, calendarId, busyBetween, openSlots, json, esc,
};
