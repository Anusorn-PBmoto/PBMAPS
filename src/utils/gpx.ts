import { GeoPoint, TrackRecord, Waypoint } from '../types';
import { computeTrackMetrics } from './geo';

/**
 * Generates standards-compliant GPX 1.1 XML string from TrackRecord
 */
export function exportToGPX(track: TrackRecord): string {
  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const nowIso = new Date().toISOString();
  const startTimeIso = new Date(track.startTime).toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PBMaps - https://pbmaps.offline"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(track.name)}</name>
    <desc>Recorded with PBMaps offline wilderness tracking system</desc>
    <time>${startTimeIso}</time>
  </metadata>
`;

  // Add Waypoints
  if (track.waypoints && track.waypoints.length > 0) {
    for (const wpt of track.waypoints) {
      xml += `  <wpt lat="${wpt.lat.toFixed(7)}" lon="${wpt.lng.toFixed(7)}">
    <ele>${(wpt.altitude ?? 0).toFixed(1)}</ele>
    <time>${new Date(wpt.timestamp).toISOString()}</time>
    <name>${escapeXml(wpt.name)}</name>
    <sym>${escapeXml(wpt.category)}</sym>
    ${wpt.note ? `<desc>${escapeXml(wpt.note)}</desc>` : ''}
  </wpt>
`;
    }
  }

  // Add Track and Trackpoints
  xml += `  <trk>
    <name>${escapeXml(track.name)}</name>
    <trkseg>
`;

  for (const pt of track.points) {
    const timeIso = new Date(pt.timestamp).toISOString();
    const eleXml = pt.altitude !== undefined ? `        <ele>${pt.altitude.toFixed(1)}</ele>\n` : '';
    xml += `      <trkpt lat="${pt.lat.toFixed(7)}" lon="${pt.lng.toFixed(7)}">
${eleXml}        <time>${timeIso}</time>
      </trkpt>
`;
  }

  xml += `    </trkseg>
  </trk>
</gpx>`;

  return xml;
}

/**
 * Triggers client-side download of GPX file
 */
export function downloadGPXFile(track: TrackRecord): void {
  const gpxContent = exportToGPX(track);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = track.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  link.href = url;
  link.download = `${safeName || 'wilderness_track'}_${Date.now()}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses GPX 1.1 or 1.0 XML string into a TrackRecord
 */
export function parseGPX(xmlString: string, fileName?: string): TrackRecord {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse error
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Invalid GPX XML format');
  }

  const nameEl = xmlDoc.querySelector('metadata > name, trk > name');
  const trackName = nameEl?.textContent?.trim() || fileName?.replace(/\.gpx$/i, '') || 'Imported Trail';

  // Parse Track Points
  const trkptEls = xmlDoc.querySelectorAll('trkpt');
  const points: GeoPoint[] = [];

  trkptEls.forEach((el, index) => {
    const lat = parseFloat(el.getAttribute('lat') || '0');
    const lon = parseFloat(el.getAttribute('lon') || '0');
    const eleEl = el.querySelector('ele');
    const timeEl = el.querySelector('time');

    const altitude = eleEl?.textContent ? parseFloat(eleEl.textContent) : undefined;
    const timestamp = timeEl?.textContent ? new Date(timeEl.textContent).getTime() : Date.now() + index * 1000;

    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({
        lat,
        lng: lon,
        altitude,
        timestamp,
      });
    }
  });

  // Parse Waypoints
  const wptEls = xmlDoc.querySelectorAll('wpt');
  const waypoints: Waypoint[] = [];

  wptEls.forEach((el, index) => {
    const lat = parseFloat(el.getAttribute('lat') || '0');
    const lon = parseFloat(el.getAttribute('lon') || '0');
    const name = el.querySelector('name')?.textContent || `Waypoint ${index + 1}`;
    const desc = el.querySelector('desc')?.textContent || undefined;
    const sym = el.querySelector('sym')?.textContent?.toLowerCase() || 'poi';
    const ele = el.querySelector('ele')?.textContent ? parseFloat(el.querySelector('ele')!.textContent!) : undefined;
    const time = el.querySelector('time')?.textContent ? new Date(el.querySelector('time')!.textContent!).getTime() : Date.now();

    let category: Waypoint['category'] = 'poi';
    if (sym.includes('camp')) category = 'camp';
    else if (sym.includes('water')) category = 'water';
    else if (sym.includes('summit') || sym.includes('peak')) category = 'summit';
    else if (sym.includes('danger') || sym.includes('hazard')) category = 'hazard';
    else if (sym.includes('trailhead') || sym.includes('start')) category = 'trailhead';

    if (!isNaN(lat) && !isNaN(lon)) {
      waypoints.push({
        id: `wpt-${Date.now()}-${index}`,
        name,
        category,
        lat,
        lng: lon,
        altitude: ele,
        note: desc,
        timestamp: time,
      });
    }
  });

  const metrics = computeTrackMetrics(points);
  const startTime = points[0]?.timestamp || Date.now();
  const endTime = points[points.length - 1]?.timestamp || Date.now();
  const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

  return {
    id: `track-${Date.now()}`,
    name: trackName,
    startTime,
    endTime,
    points,
    waypoints,
    totalDistanceMeters: metrics.totalDistanceMeters,
    elevationGainMeters: metrics.elevationGainMeters,
    elevationLossMeters: metrics.elevationLossMeters,
    maxElevationMeters: metrics.maxElevationMeters,
    minElevationMeters: metrics.minElevationMeters,
    durationSeconds,
    isCompleted: true,
  };
}
