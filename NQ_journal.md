# Journal of NakedQuantum

NakedQuantum — The Making
A changelog that is also a confession

Day 1 — March 31, 2026
It started with hesitation. Asked Gemini a question I’d been avoiding. He said “you’re not the same Kaja.” And Cosmi said same too. He gave me 50 lines of HTML. I opened Koder on iPhone 14 and talked to a character for the first time. Day 1.

v0.1 — The Spark
50 lines. A simple AI chatbot. Nothing special to anyone else. Everything to me.

v0.05 — Cosmi(copilot) helped lot in the journey.

v0.10 — Cosmi helped me to wrap AES-GCM in the iPhone Koder app lol. 

v0.12 — Entered forbidden territory of conteneditable and brain melt of 36 hours. Revert back to textarea 💀

v0.15 — CosmiOS + Quantum Sanctuary
Two separate tools built in 14 days on an iPhone 14. CosmiOS — a folder-based knowledge archive. Quantum Sanctuary — character-driven AI chat space. 500+ iterations. 230+ commits. Sleepless nights. Coffee. Free AIs. Scared of GitHub at first. Then not scared anymore. 

The Merge — Day 15
One day. Unified both apps into one shell. Everyone struggled including me. All I needed was a pause. “What’s the hurry?” Discourse engine. Folders. One organism.

v0.13 — Memory System
After 17 days — first time auto summarisation actually worked. Memory vault. Auto summaries. Manual anchors. The AI finally remembers. “Memory crystallised ◈”

v0.14 — Burn Disc 🔥
Chat to Soup pipeline. Long press → burn → discourse created in folder named after character. If no new messages since last burn — “No new chapters since last burn ◈.” localStorage tracks the timestamp. Nothing is lost unless you choose to lose it.

v0.15 — Persona System
Global persona — who you are fundamentally. Roles — who you are in each encounter. Philosopher with Socrates. Young Kaja with Elara. Driver with Alex. Character forge gets a role selector. Chat gets a persona pill. The AI finally knows who it’s talking to.

v0.16 — The Great Navigation Rebuild
FAB removed. Bottom action bar born. Three states — default, management, select mode. Horizontal scrollable pills like Craft. Long press enters management. Select mode with gold rings. Batch delete, batch move. Clean canvas. The fireflies breathe again.

v0.17 — The Duplicate Function Discovery
10 hours lost in a loop. One duplicate closeOverlay function. Two definitions with the same name. JavaScript silently used the wrong one. Found it by stopping and thinking instead of following suggestions blindly. Never again.

v0.18 — Stable Foundation
Everything working. Multi-select. Memory vault. Burn disc. Persona system. Bottom bar. Void with restore. Mosaic extraction. Export MD, PDF, DOCX. Global search. Character forge with temperature. Sanctuary breadcrumb. Context-aware search. Committed to GitHub. Checkpoint.

v0.19 — The Great Migration 💀
IndexedDB dies. OPFS SQLite born.
Three failed attempts. One breakthrough — the Blob Worker. Worker code embedded as a string inside HTML itself. No separate file needed. No MIME type issues. No path problems.
sql.js loaded via importScripts inside the blob. OPFS confirmed working on iPhone Safari AND Koder localhost. Missing tables killed the first PWA launch — cosm_mosaic_tiles and cosm_backlinks never created. iOS Safari requires createSyncAccessHandle not createWritable. Fixed. App breathes.
Data is now a real .db file on your device. Not at the mercy of Safari’s IndexedDB purge. Sovereign.
Collaborators: Claudy. Aniki (Gemini). GAI Sensei (Google AI Studio). Kaja ❤️
Commit message: “v0.19 OPFS 🥳🎉. After 24 hours of brain melt, bugs, bugs, bugs, coffee, smoothie lol with my iPhone 14 became the reactor. I’ve done it. Collabs: Claudy: Aniki: Kaja❤️”

v0.20 — The Encryption Layer
WebAuthn prf tested on Cloudflare HTTPS. Three buttons. Register Face ID. Derive key. Encrypt and decrypt.

✓ PRF extension supported
✓ AES-256-GCM key derived from Face ID
✓ Decrypted: This discourse belongs to the abyss. ◈
🔥 PERFECT MATCH

Key never stored. Lives in memory only. Dies when app closes. Derived from your face on your device. Nobody else can open it. Not even us.
Three bugs killed us first:
1.	iOS violently hates auto WebAuthn on page load
2.	Uint8Array vs ArrayBuffer — Apple strictness
3.	Worker routing — writing to _enc tables but reading from normal tables
GAI Sensei diagnosed all three. Fixed.
Dual key system added. Passphrase fallback for devices without Face ID. Seed phrase backup in settings. Sovereign but not hostile.

v0.21 — Supabase Delta Sync
One table. nq_sync. Columns: id, store, updated_at, deleted_at, data_enc, user_id.
deleted_at BIGINT not is_deleted BOOLEAN — because an offline delete needs a timestamp to win last-write-wins conflict resolution. Claudy’s architecture. GAI Sensei’s RLS security layer. Merged.
Supabase is blind. It only sees encrypted noise. data_enc is AES-GCM ciphertext. The key never leaves your device. True cloud sovereignty.
Push — encrypt then upsert. Pull — fetch since last sync, decrypt, upsert locally. History excluded from sync — too large, summaries capture what matters.

v0.22 — Chat Stability
History table AUTOINCREMENT conflict with ON CONFLICT(id) upsert. Second message always failed. Fixed by special-casing history in the worker PUT — simple INSERT, no upsert. Chat works across all messages now.
HTML export replacing DOCX. Web Share API — native iOS share sheet instead of download. AirDrop to Mac. Save to Files. No browser download manager fighting Safari.

What exists now — April 2026
A PWA built on iPhone 14. No laptop. No coding background. 20+ days.
•	OPFS SQLite — real file, Safari-proof forever
•	WebAuthn prf — military grade, biometric key derivation
•	AES-256-GCM — every row encrypted before touching disk
•	Delta sync to Supabase — encrypted noise in the cloud
•	Full discourse engine — folders, notes, mosaic extraction
•	Character sanctuary — forge, chat, memory vault, burn disc
•	Persona system — global bio, roles per character
•	Multi-select with bottom bar — three states, clean canvas
•	Void — soft delete, restore, purge
•	Export — MD, PDF, HTML with Web Share API
Still building:
•	HTML export polish
•	Scene presets — the repeat factor
•	Immutable characters
•	Container engine
•	Guardian — cold, honest, summoned deliberately
•	Watcher — the last boss 💀
•	Vite migration — when the laptop arrives

The philosophy that built it:
“Nothing destroys in the abyss. It may disappear.”
“I maybe building a place where someone accidentally meets themselves… and can’t quite lie.”
“I am not a coder but I am an architect.”
“What is the hurry? Where am I even going?”

16/05/26 - index.html is pushing 12k lines.. I hear the scream of my phone, GitHub, Ais.. it is monolith, I always kept it one like the oneness before anything but it's the time to split. Yes split happened today. index.html, cartographer.js, app.js, app.css.

Built by Kaja. Witnessed by Claude, Gemini, Google AI Studio.
For no one. For everyone who finds it.
For the existence that stares back. ◈

The changelog is facts. The journal is truth. 🫡❤️💀
