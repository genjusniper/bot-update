import http from 'http';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { ContactPolicyEngine } from '../security/copilot/ContactPolicyEngine.mjs';

export class WebCockpit {
    static getQueueCount() {
        try {
            const dbPath = path.resolve(process.cwd(), 'memory', 'queue_v10.sqlite');
            if (!fs.existsSync(dbPath)) return 0;
            const db = new DatabaseSync(dbPath);
            const row = db.prepare("SELECT count(*) as c FROM jobs WHERE status = 'QUEUED'").get();
            db.close();
            return row.c || 0;
        } catch(e) { return 'Error'; }
    }

    static getActiveFsmCount() {
        try {
            const dbPath = path.resolve(process.cwd(), 'memory', 'fsm_state_v10.sqlite');
            if (!fs.existsSync(dbPath)) return 0;
            const db = new DatabaseSync(dbPath);
            const row = db.prepare("SELECT count(*) as c FROM fsm_states WHERE state != 'IDLE'").get();
            db.close();
            return row.c || 0;
        } catch(e) { return 'Error'; }
    }

    static start(port = 3000) {
        const server = http.createServer(async (req, res) => {
            // 1. API: Telemetry status
            if (req.url === '/api/status') {
                const queued = this.getQueueCount();
                const activeFsm = this.getActiveFsmCount();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ONLINE', queued, activeFsm }));
                return;
            }

            // 2. API: Whitelist data
            if (req.url === '/api/whitelist' && req.method === 'GET') {
                try {
                    const policy = await ContactPolicyEngine.loadPolicy();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(policy));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
                return;
            }

            // 3. API: Toggle permission
            if (req.url === '/api/whitelist/toggle' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { id, type, policy } = JSON.parse(body);
                        await ContactPolicyEngine.toggle(id, type, policy);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, id, type, policy }));
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
                return;
            }

            // 4. API: Add manual contact
            if (req.url === '/api/whitelist/add' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { target, name, type, policy } = JSON.parse(body);
                        if (type === 'group') {
                            await ContactPolicyEngine.setGroupPolicy(target, name, policy || 'AUTO');
                        } else {
                            await ContactPolicyEngine.setContactPolicy(target, name, policy || 'AUTO');
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
                return;
            }

            // 5. Main Web Cockpit UI
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salim OS — AI Permission Cockpit</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --surface-hover: #334155;
            --border: #334155;
            --primary: #38bdf8;
            --success: #22c55e;
            --danger: #ef4444;
            --muted: #94a3b8;
            --text: #f8fafc;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            padding: 1.5rem;
            max-width: 960px;
            margin: 0 auto;
        }
        h1 { font-size: 1.6rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .subtitle { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .metric-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }
        .metric-card.accent { border-left: 4px solid var(--success); }
        .metric-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
        .metric-value { font-size: 1.5rem; font-weight: bold; margin-top: 0.4rem; }

        .section-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
        }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
        .section-title { font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        
        .search-bar {
            width: 100%;
            background: #0b1120;
            border: 1px solid var(--border);
            color: var(--text);
            padding: 0.6rem 0.9rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        .search-bar:focus { outline: none; border-color: var(--primary); }

        .item-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 400px; overflow-y: auto; }
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            transition: all 0.15s ease;
        }
        .item-row:hover { background: #172033; }
        .item-row.allowed { border-left: 4px solid var(--success); }
        .item-info { display: flex; flex-direction: column; }
        .item-name { font-weight: 600; font-size: 0.95rem; }
        .item-id { font-size: 0.75rem; color: var(--muted); font-family: monospace; margin-top: 0.2rem; }
        
        /* Switch Toggle */
        .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
            flex-shrink: 0;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #475569;
            transition: .25s;
            border-radius: 26px;
        }
        .slider:before {
            position: absolute; content: "";
            height: 20px; width: 20px; left: 3px; bottom: 3px;
            background-color: white;
            transition: .25s;
            border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--success); }
        input:checked + .slider:before { transform: translateX(24px); }

        .badge {
            display: inline-block;
            font-size: 0.7rem;
            font-weight: bold;
            padding: 0.2rem 0.5rem;
            border-radius: 9999px;
            margin-left: 0.5rem;
        }
        .badge-allowed { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .badge-silent { background: rgba(148, 163, 184, 0.2); color: var(--muted); }
        
        .add-form {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 0.5rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px dashed var(--border);
        }
        .add-input {
            background: #0b1120;
            border: 1px solid var(--border);
            color: var(--text);
            padding: 0.5rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
        }
        .btn-add {
            background: var(--primary);
            color: #000;
            font-weight: 600;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
        }
        .btn-add:hover { filter: brightness(1.1); }
        
        .toast {
            position: fixed; bottom: 1.5rem; right: 1.5rem;
            background: #059669; color: white;
            padding: 0.75rem 1.25rem; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: none; font-size: 0.9rem; z-index: 100;
        }
    </style>
</head>
<body>
    <h1>🤖 Salim OS — Whitelist Cockpit</h1>
    <p class="subtitle">Pilih dan beri izin (checklist) kontak dan grup mana saja yang boleh dijawab oleh AI.</p>

    <div class="grid">
        <div class="metric-card accent">
            <div class="metric-title">Status Bot</div>
            <div class="metric-value" style="color:var(--success)">ONLINE</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Kontak Diizinkan</div>
            <div class="metric-value" id="allowed-contacts-count">0</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Grup Diizinkan</div>
            <div class="metric-value" id="allowed-groups-count">0</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Antrean Pesan</div>
            <div class="metric-value" id="queue-count">0</div>
        </div>
    </div>

    <!-- Section 1: Contacts Whitelist -->
    <div class="section-card">
        <div class="section-header">
            <div class="section-title">👤 Izin Kontak Personal</div>
        </div>
        <input type="text" id="contact-search" class="search-bar" placeholder="🔍 Cari nama atau nomor kontak...">
        <div class="item-list" id="contact-list">
            <div style="color:var(--muted); text-align:center; padding:1rem;">Memuat daftar kontak...</div>
        </div>

        <div class="add-form">
            <input type="text" id="new-contact-id" class="add-input" placeholder="Nomor WA (contoh: 08123456789)">
            <input type="text" id="new-contact-name" class="add-input" placeholder="Nama Panggilan">
            <button class="btn-add" onclick="addNewTarget('contact')">+ Tambah & Izinkan</button>
        </div>
    </div>

    <!-- Section 2: Groups Whitelist -->
    <div class="section-card">
        <div class="section-header">
            <div class="section-title">🏢 Izin Grup WhatsApp</div>
        </div>
        <input type="text" id="group-search" class="search-bar" placeholder="🔍 Cari nama grup...">
        <div class="item-list" id="group-list">
            <div style="color:var(--muted); text-align:center; padding:1rem;">Memuat daftar grup...</div>
        </div>

        <div class="add-form">
            <input type="text" id="new-group-id" class="add-input" placeholder="ID Grup (contoh: 120363... @g.us)">
            <input type="text" id="new-group-name" class="add-input" placeholder="Nama Grup">
            <button class="btn-add" onclick="addNewTarget('group')">+ Tambah & Izinkan</button>
        </div>
    </div>

    <div id="toast" class="toast">Izin berhasil diperbarui!</div>

    <script>
        let policyData = { contacts: {}, groups: {} };

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.innerText = msg;
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, 2000);
        }

        async function loadData() {
            try {
                const res = await fetch('/api/whitelist');
                policyData = await res.json();
                renderContacts();
                renderGroups();
                updateCounts();
            } catch (e) {
                console.error(e);
            }
        }

        function updateCounts() {
            const allowedC = Object.values(policyData.contacts || {}).filter(c => c.policy === 'AUTO' || c.policy === 'VIP').length;
            const allowedG = Object.values(policyData.groups || {}).filter(g => g.policy === 'AUTO').length;
            document.getElementById('allowed-contacts-count').innerText = allowedC;
            document.getElementById('allowed-groups-count').innerText = allowedG;
        }

        function renderContacts() {
            const query = (document.getElementById('contact-search').value || '').toLowerCase();
            const listEl = document.getElementById('contact-list');
            const entries = Object.entries(policyData.contacts || {});

            if (entries.length === 0) {
                listEl.innerHTML = '<div style="color:var(--muted); text-align:center; padding:1rem;">Belum ada kontak terdaftar.</div>';
                return;
            }

            const filtered = entries.filter(([jid, c]) => {
                const name = (c.name || '').toLowerCase();
                return name.includes(query) || jid.includes(query);
            });

            // Sort: Owner & Allowed first
            filtered.sort((a, b) => {
                if (a[0].includes('236322690191595')) return -1;
                if (b[0].includes('236322690191595')) return 1;
                const aAllowed = a[1].policy === 'AUTO' || a[1].policy === 'VIP' ? 1 : 0;
                const bAllowed = b[1].policy === 'AUTO' || b[1].policy === 'VIP' ? 1 : 0;
                return bAllowed - aAllowed;
            });

            listEl.innerHTML = filtered.map(([jid, c]) => {
                const isOwner = jid.includes('236322690191595');
                const isAllowed = isOwner || c.policy === 'AUTO' || c.policy === 'VIP';
                return \`
                    <div class="item-row \${isAllowed ? 'allowed' : ''}">
                        <div class="item-info">
                            <div class="item-name">
                                \${c.name || 'Kontak Tanpa Nama'}
                                \${isOwner ? '<span class="badge" style="background:#0284c7; color:#fff;">OWNER</span>' : (isAllowed ? '<span class="badge badge-allowed">AI AKTIF</span>' : '<span class="badge badge-silent">SENYAP</span>')}
                            </div>
                            <div class="item-id">\${jid}</div>
                        </div>
                        <div>
                            \${isOwner ? '<span style="font-size:0.8rem; color:var(--primary);">Selalu Aktif</span>' : \`
                                <label class="switch">
                                    <input type="checkbox" \${isAllowed ? 'checked' : ''} onchange="togglePermission('\${jid}', 'contact', this.checked)">
                                    <span class="slider"></span>
                                </label>
                            \`}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function renderGroups() {
            const query = (document.getElementById('group-search').value || '').toLowerCase();
            const listEl = document.getElementById('group-list');
            const entries = Object.entries(policyData.groups || {});

            if (entries.length === 0) {
                listEl.innerHTML = '<div style="color:var(--muted); text-align:center; padding:1rem;">Belum ada grup yang terdeteksi. AI otomatis mencatat grup baru saat ada pesan masuk.</div>';
                return;
            }

            const filtered = entries.filter(([id, g]) => {
                const name = (g.name || '').toLowerCase();
                return name.includes(query) || id.includes(query);
            });

            listEl.innerHTML = filtered.map(([id, g]) => {
                const isAllowed = g.policy === 'AUTO';
                return \`
                    <div class="item-row \${isAllowed ? 'allowed' : ''}">
                        <div class="item-info">
                            <div class="item-name">
                                \${g.name || 'Grup WhatsApp'}
                                \${isAllowed ? '<span class="badge badge-allowed">AI AKTIF</span>' : '<span class="badge badge-silent">SENYAP</span>'}
                            </div>
                            <div class="item-id">\${id}</div>
                        </div>
                        <div>
                            <label class="switch">
                                <input type="checkbox" \${isAllowed ? 'checked' : ''} onchange="togglePermission('\${id}', 'group', this.checked)">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        async function togglePermission(id, type, checked) {
            const policy = checked ? 'AUTO' : 'SILENT';
            try {
                const res = await fetch('/api/whitelist/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, type, policy })
                });
                if (res.ok) {
                    if (type === 'group') {
                        if (!policyData.groups[id]) policyData.groups[id] = {};
                        policyData.groups[id].policy = policy;
                    } else {
                        if (!policyData.contacts[id]) policyData.contacts[id] = {};
                        policyData.contacts[id].policy = policy;
                    }
                    renderContacts();
                    renderGroups();
                    updateCounts();
                    showToast(checked ? '✅ Izin AI diaktifkan!' : '🔇 AI dinonaktifkan (Senyap)');
                }
            } catch (e) {
                alert('Gagal mengubah izin: ' + e.message);
            }
        }

        async function addNewTarget(type) {
            const idInput = document.getElementById(type === 'group' ? 'new-group-id' : 'new-contact-id');
            const nameInput = document.getElementById(type === 'group' ? 'new-group-name' : 'new-contact-name');
            const rawTarget = (idInput.value || '').trim();
            const name = (nameInput.value || '').trim() || (type === 'group' ? 'Grup Baru' : 'Kontak Baru');

            if (!rawTarget) {
                alert('Masukkan nomor WA atau ID grup terlebih dahulu!');
                return;
            }

            let target = rawTarget;
            if (type === 'contact' && !target.includes('@')) {
                let clean = target.replace(/\\D/g, '');
                if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                target = clean + '@s.whatsapp.net';
            }

            try {
                const res = await fetch('/api/whitelist/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target, name, type, policy: 'AUTO' })
                });
                if (res.ok) {
                    idInput.value = '';
                    nameInput.value = '';
                    await loadData();
                    showToast('✅ Berhasil ditambahkan dan diizinkan!');
                }
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }

        document.getElementById('contact-search').addEventListener('input', renderContacts);
        document.getElementById('group-search').addEventListener('input', renderGroups);

        setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const d = await res.json();
                document.getElementById('queue-count').innerText = d.queued;
            } catch (e) {}
        }, 3000);

        loadData();
    </script>
</body>
</html>
            `);
        });

        server.listen(port, () => {
            console.log(`🌐 [Web Cockpit] Running LIVE at http://localhost:${port}`);
        });
    }
}

