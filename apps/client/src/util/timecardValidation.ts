function toSeconds(time: string) {
  if (!/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(time)) {
    return 0;
  }
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

export function getDuration(time1: string, time2: string) {
  if (!time1 || !time2) return 0;

  const seconds1 = toSeconds(time1);
  const seconds2 = toSeconds(time2);
  const diff = seconds2 - seconds1;

  return diff > 0 ? diff / 3600 : 0;
}

export function startBeforeEnd(start: string, end: string) {
  if (!start || !end) return null;

  const startSeconds = toSeconds(start);
  const endSeconds = toSeconds(end);

  if (startSeconds <= endSeconds) return null;

  return "End time must be after start time";
}