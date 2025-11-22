/*
  Image Hub
  - Stores images (Blob) in IndexedDB
  - Lets user title and add tags, search by words, shows post count
  - Uses blob URLs (not base64) so we do not inline image data
*/

const DB_NAME = 'image-hub-db';
const STORE = 'images';
const DB_VERSION = 1;

let dbPromise = null;
function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if(!db.objectStoreNames.contains(STORE)){
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        s.createIndex('by_title', 'title', { unique: false });
        s.createIndex('by_tags', 'tags', { unique: false });
        s.createIndex('by_text', 'searchText', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function addImage(blob, title, tags){
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const data = {
      blob,
      title: title || 'Untitled',
      tags: tags || [],
      created: Date.now(),
      searchText: ((title||'') + ' ' + (tags||[]).join(' ')).toLowerCase()
    };
    const r = store.add(data);
    r.onsuccess = () => { res(r.result); };
    r.onerror = () => rej(r.error);
  });
}

async function getAllImages(){
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const r = store.getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function deleteImage(id){
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE,'readwrite');
    const r = tx.objectStore(STORE).delete(id);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

/* UI */
const fileEl = document.getElementById('file');
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const titleEl = document.getElementById('title');
const tagsEl = document.getElementById('tags');
const cancelBtn = document.getElementById('cancel');
const saveBtn = document.getElementById('save');
const grid = document.getElementById('grid');
const search = document.getElementById('search');
const countEl = document.getElementById('count');

let pickedFile = null;
let lastBlobUrls = new Map(); // id -> objectURL

fileEl.addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  pickedFile = f;
  // show preview via blob URL
  const url = URL.createObjectURL(f);
  preview.src = url;
  titleEl.value = f.name.replace(/\\.[^/.]+$/, '');
  tagsEl.value = '';
  editor.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  clearEditor();
});

saveBtn.addEventListener('click', async () => {
  if(!pickedFile) return clearEditor();
  const title = titleEl.value.trim();
  const tags = tagsEl.value.split(/[, ]+/).filter(Boolean);
  // Convert File to Blob (File is already a Blob). Store blob directly.
  await addImage(pickedFile, title, tags);
  clearEditor();
  await refreshGrid();
});

function clearEditor(){
  editor.classList.add('hidden');
  preview.src = '';
  titleEl.value = '';
  tagsEl.value = '';
  fileEl.value = '';
  pickedFile = null;
}

search.addEventListener('input', debounce(async (e) => {
  await refreshGrid(e.target.value.trim().toLowerCase());
}, 220));

async function refreshGrid(filter = '') {
  // clean old objectURLs
  for(const url of lastBlobUrls.values()) URL.revokeObjectURL(url);
  lastBlobUrls.clear();
  grid.innerHTML = '';
  const all = await getAllImages();
  let items = all.sort((a,b) => b.created - a.created);
  if(filter){
    items = items.filter(it => (it.searchText || '').includes(filter));
  }
  countEl.textContent = String(all.length || 0);

  if(items.length === 0){
    grid.innerHTML = `<div class="card" style="padding:18px;text-align:center;color:var(--muted)">No posts</div>`;
    return;
  }

  for(const item of items){
    const url = URL.createObjectURL(item.blob);
    lastBlobUrls.set(item.id, url);

    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = url;
    img.alt = item.title || 'image';
    card.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const t = document.createElement('div');
    t.className = 'title';
    t.textContent = item.title || 'Untitled';

    const tg = document.createElement('div');
    tg.className = 'tags';
    tg.textContent = (item.tags && item.tags.join(', ')) || '';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.marginTop = '4px';

    const open = document.createElement('button');
    open.textContent = 'Open';
    open.addEventListener('click', () => {
      // open image in new tab as object URL (for sharing)
      window.open(url, '_blank');
    });

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      if(!confirm('Delete this post?')) return;
      await deleteImage(item.id);
      await refreshGrid(search.value.trim().toLowerCase());
    });

    actions.appendChild(open);
    actions.appendChild(del);

    meta.appendChild(t);
    meta.appendChild(tg);
    meta.appendChild(actions);
    card.appendChild(meta);
    grid.appendChild(card);
  }
}

/* Utilities */
function debounce(fn, ms=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); } }

// initialize
refreshGrid();

// close editor on background tap
editor.addEventListener('click', (e)=>{
  if(e.target === editor) clearEditor();
});
