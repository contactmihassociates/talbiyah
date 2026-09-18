/**
 * /api/gallery — the gallery's only writer and reader.
 *
 * This exists so the office can publish a photograph from a phone without
 * anyone touching the repository. It runs on Vercel, beside the static site.
 *
 * WHY THE PASSWORD IS CHECKED HERE AND NOT IN THE BROWSER
 * ------------------------------------------------------
 * admin.html cannot protect anything: whatever a browser checks, a browser
 * can be made to skip. The gate that matters is this one. The password lives
 * in the ADMIN_PASSWORD environment variable, is never sent to the browser,
 * and every write is refused without it. The login on admin.html is now only
 * a convenience so the office is not asked for the password on every action.
 *
 * STORAGE
 * -------
 * Vercel Blob. Photographs are written to gallery/<id>.jpg and the ordered
 * list to gallery/index.json. The manifest is one small file rewritten in
 * full on every change — fine for a gallery one person edits occasionally,
 * and far easier to reason about than per-photo records.
 *
 * SETUP (once, in the Vercel dashboard)
 * -------------------------------------
 *   Storage  -> Create a Blob store -> connect it to this project
 *               (this injects BLOB_READ_WRITE_TOKEN automatically)
 *   Settings -> Environment Variables -> ADMIN_PASSWORD = <the password>
 *
 * Until both exist this endpoint answers 503 with a plain explanation, and
 * admin.html falls back to the download-the-files route.
 */

import { put, del, list } from '@vercel/blob';

const MANIFEST = 'gallery/index.json';
const MAX_PHOTOS = 200;
const MAX_BYTES = 3 * 1024 * 1024; // a resized photo is ~250KB; this is slack

/* ----------------------------------------------------------------- helpers */

// Storage auth has two valid shapes on Vercel now: an explicit
// BLOB_READ_WRITE_TOKEN, or OIDC, which a connected store sets up with no
// token at all (BLOB_STORE_ID is the sign of it). Insisting on the token
// alone would refuse a perfectly good OIDC connection, so accept either and
// let a real storage failure surface as a real error further down.
function storageLinked() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
function configured() {
  return Boolean(storageLinked() && process.env.ADMIN_PASSWORD);
}

// Constant-time compare, so a wrong password cannot be narrowed down by
// timing one character at a time.
function passwordOk(given) {
  const want = process.env.ADMIN_PASSWORD || '';
  if (typeof given !== 'string' || given.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

async function readManifest() {
  try {
    // list() rather than head(): head() wants the blob's full URL in some
    // versions and a pathname in others, and this has to work on whichever
    // the deploy resolves.
    const found = await list({ prefix: MANIFEST, limit: 1 });
    const blob = found.blobs && found.blobs[0];
    if (!blob) return [];
    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.photos) ? data.photos : [];
  } catch {
    return []; // no manifest yet: an empty gallery, not an error
  }
}

async function writeManifest(photos) {
  await put(MANIFEST, JSON.stringify({ photos }, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0
  });
}

function slug(text, fallback) {
  const out = String(text || '').toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-').slice(0, 44);
  return out || fallback;
}

function clean(s, max) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
}

/* -------------------------------------------------------------- the handler */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!configured()) {
    const missing = [];
    if (!storageLinked()) missing.push('the Blob store is not connected to this project');
    if (!process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD is not set');
    return res.status(503).json({
      error: 'not_configured',
      missing,
      message: 'Publishing is not switched on yet: ' + missing.join(', ') +
               '. Fix that in the Vercel dashboard, then redeploy.'
    });
  }

  /* --------------------------------------------------------------- GET */
  // Public. The website itself calls this to draw the gallery.
  if (req.method === 'GET') {
    const photos = await readManifest();
    return res.status(200).json({ photos });
  }

  /* -------------------------------------------------------------- POST */
  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (!passwordOk(body.password)) {
      // Same answer for a wrong password and a missing one.
      return res.status(401).json({ error: 'unauthorised', message: 'Wrong password.' });
    }

    const action = body.action;

    /* ---- publish one photograph ---- */
    if (action === 'add') {
      const title = clean(body.title, 120);
      const caption = clean(body.caption, 400);
      if (!title) {
        return res.status(400).json({ error: 'no_title', message: 'A title is required.' });
      }

      const m = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl || '');
      if (!m) {
        return res.status(400).json({ error: 'bad_image', message: 'That was not a readable picture.' });
      }
      const bytes = Buffer.from(m[2], 'base64');
      if (!bytes.length || bytes.length > MAX_BYTES) {
        return res.status(413).json({ error: 'too_big', message: 'That picture is too large.' });
      }

      const photos = await readManifest();
      if (photos.length >= MAX_PHOTOS) {
        return res.status(409).json({
          error: 'full',
          message: 'The gallery is full at ' + MAX_PHOTOS + ' photographs. Remove some first.'
        });
      }

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const key = 'gallery/' + slug(title, 'photo') + '-' + id.slice(-4) + '.jpg';

      const blob = await put(key, bytes, {
        access: 'public',
        contentType: 'image/jpeg',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 31536000
      });

      const photo = {
        id, title, caption,
        url: blob.url,
        pathname: blob.pathname,
        width: Number(body.width) || null,
        height: Number(body.height) || null,
        added: new Date().toISOString()
      };
      photos.push(photo);
      await writeManifest(photos);
      return res.status(201).json({ photo, count: photos.length });
    }

    /* ---- edit a title or caption ---- */
    if (action === 'update') {
      const photos = await readManifest();
      const p = photos.find(x => x.id === body.id);
      if (!p) return res.status(404).json({ error: 'not_found', message: 'No such photograph.' });
      if (body.title !== undefined) {
        const t = clean(body.title, 120);
        if (!t) return res.status(400).json({ error: 'no_title', message: 'A title is required.' });
        p.title = t;
      }
      if (body.caption !== undefined) p.caption = clean(body.caption, 400);
      await writeManifest(photos);
      return res.status(200).json({ photo: p });
    }

    /* ---- reorder ---- */
    if (action === 'reorder') {
      const order = Array.isArray(body.order) ? body.order : null;
      if (!order) return res.status(400).json({ error: 'bad_order', message: 'No order given.' });
      const photos = await readManifest();
      const byId = new Map(photos.map(p => [p.id, p]));
      const next = order.map(id => byId.get(id)).filter(Boolean);
      // Anything the client did not mention keeps its place at the end, so a
      // stale tab can never silently delete a photograph.
      photos.forEach(p => { if (!order.includes(p.id)) next.push(p); });
      await writeManifest(next);
      return res.status(200).json({ photos: next });
    }

    /* ---- remove ---- */
    if (action === 'remove') {
      const photos = await readManifest();
      const p = photos.find(x => x.id === body.id);
      if (!p) return res.status(404).json({ error: 'not_found', message: 'No such photograph.' });
      try { await del(p.url); } catch { /* already gone: carry on */ }
      await writeManifest(photos.filter(x => x.id !== p.id));
      return res.status(200).json({ removed: p.id });
    }

    /* ---- password check, used by the login form ---- */
    if (action === 'check') {
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'bad_action', message: 'Unknown action.' });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'bad_method' });
}

export const config = {
  api: { bodyParser: { sizeLimit: '6mb' } }
};
