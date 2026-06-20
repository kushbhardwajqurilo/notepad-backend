function getEasternDayRange(dateString) {
  const [year, month, day] = dateString.split("-").map(Number); // Create UTC noon to safely determine DST status

  const probe = new Date(Date.UTC(year, month - 1, day, 12));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  }).formatToParts(probe);

  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value;

  const match = offsetPart.match(/GMT([+-])(\d{2}):(\d{2})/);

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);

  const offsetMinutes = sign * (hours * 60 + minutes);

  const startUtc = new Date(
    Date.UTC(year, month - 1, day, 0, 0) - offsetMinutes * 60 * 1000,
  );

  const endUtc = new Date(
    Date.UTC(year, month - 1, day + 1, 0, 0) - offsetMinutes * 60 * 1000,
  );

  return {
    startUtc,
    endUtc,
  };
}

module.exports = getEasternDayRange;
