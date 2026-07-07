// Helper to calculate duration in hours between startTime and endTime (e.g. "08:00" and "16:00")
export function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (endMin <= startMin) return 0;
    return Number(((endMin - startMin) / 60).toFixed(2));
  } catch {
    return 0;
  }
}
