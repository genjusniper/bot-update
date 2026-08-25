
import http from 'http';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

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
        const server = http.createServer((req, res) => {
            if (req.url === '/api/status') {
                const queued = this.getQueueCount();
                const activeFsm = this.getActiveFsmCount();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ONLINE', queued, activeFsm }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                <head>
                    <title>Antigravity Web Cockpit (Live)</title>
                    <style>body{font-family:sans-serif; background:#1e1e1e; color:#fff; padding:2rem;} .card{background:#2d2d2d; padding:1.5rem; border-radius:8px; margin-top:1rem; border-left: 4px solid #4caf50;}</style>
                </head>
                <body>
                    <h1>🚀 WA-BOT Control Plane (V15 Live)</h1>
                    <div class="card">
                        <h2>Real-Time Telemetry</h2>
                        <p><strong>System:</strong> <span style="color:#4caf50">ONLINE & HEALTHY</span></p>
                        <p><strong>Pending Jobs (Queue):</strong> <span id="queue">...</span></p>
                        <p><strong>Active Chats (FSM):</strong> <span id="fsm">...</span></p>
                    </div>
                    <script>
                        setInterval(() => {
                            fetch('/api/status').then(r=>r.json()).then(d => {
                                document.getElementById('queue').innerText = d.queued;
                                document.getElementById('fsm').innerText = d.activeFsm;
                            }).catch(console.error);
                        }, 2000);
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

