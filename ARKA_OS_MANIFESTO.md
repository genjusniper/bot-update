# 🌌 ARKA PERSONAL AGENT OS — ARCHITECTURAL MANIFESTO

> **"MAXIMUM CAPABILITY, MINIMUM UNNECESSARY LIMITATION."**  
> *Setiap kapabilitas yang legal, aman, terotorisasi, dan secara teknis memungkinkan, dioptimalkan hingga batas maksimal—tanpa kompromi setengah matang.*

---

## 🏛️ Arsitektur Inti: LLM Bukan Otak Tunggal

ARKA memisahkan antara **Cognitive Orchestration** (pengambilan keputusan, memori, relasi, aturan) dan **Generative Realization** (pembuatan teks oleh model LLM).

```text
                    ┌─ Memory (SQLite WAL + Fact Store)
                    ├─ Contacts & Identity Intelligence
RAW MESSAGE ────────┼─ Group Context & Privacy Scope
                    ├─ World Knowledge & Ground Truth
                    ├─ Relationship Tier (Owner / VIP / Friend)
                    ├─ Conversation State & Temporal Rhythm
                    └─ Behavioral Signals & Room Climate
                              │
                              ▼
                 INTELLIGENCE ORCHESTRATOR
               (PersonalSimulationKernel)
                              │
                              ▼
                    DECISION / SIMULATION
                 (Heuristics, Heuristics Matrix)
                              │
                              ▼
                      RESPONSE CONTRACT
             (What, How, Cognitive, Social, Texture)
                              │
                              ▼
                     MODEL / MODEL FLEET
              (Gemini 2.5 Flash / Groq / Local)
                              │
                              ▼
            FACT + CONTEXT + BEHAVIOR VALIDATION
                    (BehavioralFirewall)
                              │
                              ▼
                    WHATSAPP NATIVE OUTPUT
                (1 Bubble, 2 Bubbles, or Burst)
```

---

## 💎 13 Pilar Kapabilitas Maksimal ARKA

1. 🧠 **Reasoning Engine**: Memahami inti masalah, membandingkan opsi, dan menyusun keputusan pragmatis tanpa bias teori berlebihan.
2. 🌐 **Current Knowledge & Grounding**: Pengambilan fakta dinamis dan web search terarah saat konteks membutuhkan data real-time.
3. 👤 **Identity Intelligence**: Mengenali kontak, nomor JID/LID, alias, kedekatan, dan konteks peran tanpa tertukar.
4. 🧩 **Context Intelligence**: Memahami rujukan implisit (*"dia"*, *"proyek kemarin"*, *"yang tadi"*, *"grup itu"*).
5. 💾 **Evidence-Based Memory**: Membedakan secara tegas antara **Fakta Terbukti** (*Ground Truth*) vs **Dugaan / Asumsi**, menolak halusinasi dengan kejujuran autentik (*"wah belum tau e"*).
6. 🤖 **Multi-Model Fleet Routing**: Memilih provider dan model terbaik secara dinamis:
   - *Gemini 2.5 Flash*: Kecepatan & reasoning multimodal.
   - *Groq (Llama-3.3-70B / Mixtral)*: Fallback instan saat limit quota.
   - *Local Fallback*: Ketahanan offline saat jaringan terputus.
7. 🗣️ **WhatsApp-Native Behavior**: Karakter chat manusiawi sejati: ritme pengetikan, bubble terpisah (*multi-bubble*), jeda realistis, variasi panjang-pendek, cuek kontekstual, dan typo wajar pada situasi santai.
8. 🎭 **Relationship Calibration**: Menyesuaikan nada dan batasan secara presisi:
   - *Owner*: Otoritas penuh, kontrol sistem, ringkas.
   - *Close Friend*: Semarangan Javanese, humor deadpan, akrab.
   - *Customer / VIP*: Sopan, formal, nol lelucon vulgar, fokus solusi komersial.
   - *Group Chat*: Privasi publik, informasi rahasia terlindungi.
9. 🔄 **Self-Correction & Behavioral Firewall**: Inspeksi pasca-generasi untuk memastikan output mematuhi kontrak perilaku (pencegah ceramah saat curhat, pemangkas kelebihan kata, pelindung data privat).
10. 📈 **Outcome Learning & Memory Tracking**: Merekam hasil keputusan (*Context → Options → Decision → Outcome → Lesson*) untuk pembelajaran jangka panjang tanpa merusak core baseline.
11. ⚙️ **Tool Autonomy**: Otonomi aman dalam menentukan kapan harus menjalankan kalkulasi, query memori, web search, eksekusi kode, atau memanggil sub-agen.
12. 🧪 **Pre-Emission Simulation**: Mensimulasikan dan mengevaluasi kandidat strategi sebelum menjatuhkan pilihan terbaik.
13. 🛡️ **Role-Based Security Boundary**: Izin berjenjang berbasis identitas (RBAC: Owner, Admin, Trusted, User, Guest) yang melindungi sistem dari akses ilegal atau manipulasi prompt.

---

## 🧭 Prinsip Desain Anti-Degradasi

- **Bukan Membatasi, Tapi Mengarahkan**: Batasan yang ada hanyalah batasan keselamatan, privasi, dan otorisasi.
- **Natural ≠ Random**: Variasi terjadi pada pilihan kata, jeda, dan pemilihan kalimat; tetapi keselamatan, privasi, dan otoritas tetap 100% deterministik.
- **Zero Prompt Bloat**: Specialist engine tidak diizinkan menyuntikkan paragraf instruksi liar ke LLM; seluruh sinyal dikonsolidasikan ke dalam *PersonalContextContract* yang ringkas, terukur, dan terbukti.
