// Source one relevant, freely-licensed image per chapter from Wikimedia Commons.
// Writes data/images.json: { "book/num": {src, alt, credit, license, source, file} }.
// Images are HOTLINKED from upload.wikimedia.org — no files enter the repo.
//
// Usage: node scripts/images.mjs            (fetch only missing entries)
//        node scripts/images.mjs --force    (re-fetch everything)
//        node scripts/images.mjs 1/001 2/030 (fetch/replace specific chapters)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const OUT = join(DATA, 'images.json');
const UA = 'ShapeOfTheMany-SiteBuilder/1.0 (https://github.com/TheUnbornLabs/the-shape-of-the-many)';

// Each chapter → a CONCRETE, depictable subject (portrait, iconic photo, or artwork).
// Abstract concepts are mapped to their canonical real-world image.
const QUERIES = {
  // Book 1 — The Shape Forms
  '1/001': 'Starling murmuration',
  '1/002': 'Rayleigh Benard convection cells',
  '1/003': 'Snow geese flock in flight',
  '1/004': 'Cathedral termite mound',
  '1/005': 'Thermostat dial',
  '1/006': 'Melting ice',
  '1/007': 'Mexican wave stadium',
  '1/008': 'Physarum polycephalum slime mould',
  '1/009': 'Bait ball fish school',
  '1/010': 'Wildebeest migration herd',
  '1/011': 'School of sardines',
  '1/012': 'Meerkat sentinel lookout',
  '1/013': 'Northern gannet colony',
  '1/014': 'Common vampire bat',
  '1/015': 'Honeybees on honeycomb',
  '1/016': 'Peacock displaying tail',
  '1/017': 'Francis Galton',
  '1/018': 'Nicolas de Condorcet',
  '1/019': 'Jar of jelly beans',
  '1/020': 'Crowd at outdoor festival',
  '1/021': 'Galton board bean machine',
  '1/022': 'Temple of Apollo Delphi',
  '1/023': 'New York Stock Exchange trading floor',
  '1/024': 'Decision tree diagram',
  '1/025': 'Team collaboration meeting',
  // Book 2 — The Shape Breaks
  '2/026': 'People queuing in line',
  '2/027': 'Newspaper front pages',
  '2/028': 'Bank run Great Depression crowd',
  '2/029': 'Dense crowd of people',
  '2/030': 'Tulip mania Semper Augustus',
  '2/031': 'Salem witch trial illustration',
  '2/032': 'Guy Fawkes masks protest',
  '2/033': 'Concert audience crowd',
  '2/034': 'Emperor\'s New Clothes illustration',
  '2/035': 'Asch conformity experiment',
  '2/036': 'Muzafer Sherif',
  '2/037': 'Milgram experiment',
  '2/038': 'Black Friday shopping crowd',
  '2/039': 'Crowd applauding',
  '2/040': 'Crowded city sidewalk pedestrians',
  '2/041': 'Group discussion people',
  '2/042': 'Lecture hall students',
  '2/043': 'Space Shuttle Challenger launch',
  // Book 3 — The Shape Flows
  '3/044': 'Watts Strogatz small world network',
  '3/045': 'Social network analysis graph',
  '3/046': 'Scale-free network',
  '3/047': 'Betweenness centrality network',
  '3/048': 'Social network community clusters',
  '3/049': 'Network bridge graph',
  '3/050': 'Social network visualization clusters',
  '3/051': 'Village community gathering people',
  '3/052': 'Diffusion of innovations curve',
  '3/053': 'SIR model epidemic curve',
  '3/054': 'Social network diagram nodes',
  '3/055': 'Vintage family listening to radio',
  '3/056': 'Richard Dawkins',
  '3/057': 'Random network graph edges',
  '3/058': 'Leader and followers',
  '3/059': 'Dominoes falling',
  // Book 4 — The Shape Holds Power
  '4/060': 'Stock market display board',
  '4/061': 'John Maynard Keynes 1929',
  '4/062': 'Lehman Brothers headquarters',
  '4/063': 'Flock of sheep herding',
  '4/064': 'Crowd on Wall Street 1929 crash',
  '4/065': 'George Soros',
  '4/066': 'Common grazing pasture cattle',
  '4/067': 'Thomas Schelling economist',
  '4/068': 'Honey bee swarm cluster',
  '4/069': 'Traditional irrigation canal commons',
  '4/070': 'Show of hands vote',
  '4/071': 'Kenneth Arrow Stanford University',
  '4/072': 'Town hall meeting',
  '4/073': 'Ballot box voting',
  '4/074': 'Jury courtroom illustration',
  '4/075': 'Protest demonstration crowd',
  '4/076': 'Festival crowd celebration night',
  '4/077': 'Gustave Le Bon',
  '4/078': 'Sigmund Freud',
  '4/079': 'Elias Canetti',
  '4/080': 'Lascaux cave painting',
  '4/081': 'Military parade marching',
  '4/082': 'World War propaganda poster',
  '4/083': 'Banknotes currency money',
  '4/084': 'Football supporters crowd flags',
  '4/085': 'Riches Heures Duc de Berry',
  // Book 5 — The Shape Remade
  '5/086': 'Swarm robotics kilobots',
  '5/087': 'Person using smartphone app',
  '5/088': 'Social media apps smartphone',
  '5/089': 'Computer server room',
  '5/090': 'Hands typing on keyboard',
  '5/091': 'Wikipedia logo',
  '5/092': 'Probability forecast chart',
  '5/093': 'Birdwatchers with binoculars',
  '5/094': 'Agent-based model simulation',
  '5/095': 'Prisoner\'s dilemma',
  '5/096': 'Handshake cooperation',
  '5/097': 'Rule 30 cellular automaton',
  '5/098': 'Power law distribution graph',
  '5/099': 'Dunlin flock in flight',
  '5/100': 'Blind men and an elephant'
};

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findImage(query) {
  const api = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: query, gsrnamespace: '6', gsrlimit: '6',
    prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '1280'
  });
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  // Rank by search index; keep photographic raster files, skip icons/svg.
  const cands = Object.values(pages)
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((p) => ({ title: p.title, ii: p.imageinfo?.[0] }))
    .filter((c) => c.ii && /image\/(jpeg|png)/.test(c.ii.mime))
    .filter((c) => !/\b(icon|logo\b.*icon|coat of arms|flag of|map of)\b/i.test(c.title))
    .filter((c) => (c.ii.width || 0) >= 200);
  const pick = cands[0];
  if (!pick) return null;
  const em = pick.ii.extmetadata || {};
  return {
    file: pick.title,
    src: pick.ii.thumburl || pick.ii.url,
    credit: stripHtml(em.Artist?.value) || 'Unknown author',
    license: stripHtml(em.LicenseShortName?.value) || 'see source',
    source: pick.ii.descriptionurl
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter((a) => /^\d\/\d{3}$/.test(a));
  const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const out = { ...existing };

  const keys = only.length ? only : Object.keys(QUERIES);
  let ok = 0, miss = 0;
  for (const key of keys) {
    if (!force && !only.length && out[key]) { ok++; continue; }
    const q = QUERIES[key];
    if (!q) { console.log(`  ${key}  (no query defined)`); continue; }
    try {
      const img = await findImage(q);
      if (img) {
        out[key] = { ...img, alt: q, query: q };
        ok++;
        console.log(`  ${key}  ✓  ${img.file.replace(/^File:/, '').slice(0, 60)}  [${img.license}]`);
      } else {
        miss++;
        console.log(`  ${key}  ✗  no image for "${q}"`);
      }
    } catch (e) {
      miss++;
      console.log(`  ${key}  ✗  ${e.message} ("${q}")`);
    }
    await sleep(300); // be polite to the API
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nimages.json: ${Object.keys(out).length} chapters have images (${ok} ok, ${miss} missing this run)`);
}
main();
