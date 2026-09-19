import React, { useEffect, useState } from "react";

const TABS = [
  ["home", "Home"],
  ["repos", "Repos"],
  ["bounties", "Bounties"],
  ["builds", "Builds"],
  ["ship", "Ship"],
  ["drive", "Drive"],
  ["domains", "Domains"],
  ["mesh", "Mesh"],
  ["aws", "AWS"],
  ["ai", "AI"],
  ["help", "Help"],
];

const KEY = "ju-fleet-brain-v1";
const empty = {
  device: "ju-1",
  project: "",
  githubUser: "juliushill42",
  llamaUrl: "https://llama.geturclarity.com/v1/chat/completions",
  llamaKey: "",
  ionos: "",
  awsId: "",
  meshNote: "",
  hosts: [{ name: "desk", target: "user@100.x.x.x" }],
  proofs: {},
  ledger: [],
  notes: "",
};

function load() {
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return empty; }
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [b, setB] = useState(load);
  const [repos, setRepos] = useState([]);
  const [q, setQ] = useState("");
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([{ role: "ai", text: "Pick a project first. Then ask." }]);
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState("");
  const [zones, setZones] = useState("");

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(b)), [b]);
  useEffect(() => {
    const user = b.githubUser || "juliushill42";
    fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`)
      .then((r) => r.json())
      .then((d) => setRepos(Array.isArray(d) ? d : []))
      .catch(() => setRepos([]));
  }, [b.githubUser]);

  const project = b.project || "";
  const filtered = repos.filter((r) => `${r.name} ${r.description || ""}`.toLowerCase().includes(q.toLowerCase()));
  const set = (k, v) => setB({ ...b, [k]: v });
  function pick(name) { setB({ ...b, project: name }); setTab("builds"); }

  async function ask() {
    const text = prompt.trim();
    if (!text) return;
    setPrompt("");
    setChat((c) => [...c, { role: "me", text }]);
    setBusy(true);
    const ctx = `device=${b.device} project=${project}`;
    if (b.llamaUrl) {
      try {
        const headers = { "Content-Type": "application/json" };
        if (b.llamaKey) headers.Authorization = `Bearer ${b.llamaKey}`;
        const res = await fetch(b.llamaUrl, { method: "POST", headers, body: JSON.stringify({ model: "local", messages: [{ role: "system", content: ctx }, { role: "user", content: text }] }) });
        const data = await res.json();
        setChat((c) => [...c, { role: "ai", text: String(data?.choices?.[0]?.message?.content || JSON.stringify(data)) }]);
        setBusy(false); return;
      } catch (e) {
        setChat((c) => [...c, { role: "ai", text: "llama failed: " + e.message }]);
      }
    }
    setChat((c) => [...c, { role: "ai", text: `Working on ${project || "NO PROJECT"}. ${ctx}` }]);
    setBusy(false);
  }

  async function listZones() {
    if (!b.ionos) { setZones("Set IONOS key on Home"); return; }
    const res = await fetch("https://api.hosting.ionos.com/dns/v1/zones", { headers: { "X-API-Key": b.ionos } });
    setZones(await res.text());
  }

  const brain = JSON.stringify(b, null, 2);

  return (
    <div className="app">
      <header className="top">
        <div><h1>JU FLEET</h1><div className="sub">{b.device} · {project || "NO PROJECT"}</div></div>
        <div className="pill">{repos.length} repos</div>
      </header>
      {tab === "home" && (
        <>
          <section className="hero"><h2>How this works</h2><p>Same URL on three phones. Pick a project first. Chrome is the map. Termux Ju is the hands.</p></section>
          <div className="grid">
            <div className="card"><b>{b.device}</b><span>phone</span></div>
            <div className="card"><b>{project || "NONE"}</b><span>project</span></div>
          </div>
          <label>This phone</label>
          <select value={b.device} onChange={(e) => set("device", e.target.value)}><option>ju-1</option><option>ju-2</option><option>ju-3</option></select>
          <label>Active project</label>
          <select value={project} onChange={(e) => set("project", e.target.value)}>
            <option value="">— pick —</option>
            {repos.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <label>GitHub user</label><input value={b.githubUser} onChange={(e) => set("githubUser", e.target.value)} />
          <label>llama URL</label><input value={b.llamaUrl} onChange={(e) => set("llamaUrl", e.target.value)} />
          <label>llama key</label><input value={b.llamaKey} onChange={(e) => set("llamaKey", e.target.value)} />
          <label>IONOS key</label><input value={b.ionos} onChange={(e) => set("ionos", e.target.value)} />
          <label>AWS id</label><input value={b.awsId} onChange={(e) => set("awsId", e.target.value)} />
        </>
      )}
      {tab === "repos" && (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
          <div className="list" style={{ marginTop: 12 }}>
            {filtered.map((r) => (
              <article className="row" key={r.id}>
                <h3>{r.name}</h3>
                <p className="cap">{r.description || "No description"}</p>
                <div className="actions">
                  <button onClick={() => pick(r.name)}>Make active</button>
                  <a className="btn ghost" href={r.html_url} target="_blank" rel="noreferrer">GitHub</a>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "bounties" && (
        <section className="hero"><h2>Bounties</h2><p>Log money on the active project. Search is in Termux Ju.</p>
          <div className="actions"><button onClick={() => setB({ ...b, ledger: [...b.ledger, { status: "claimed", project, device: b.device }] })}>Claimed</button>
          <button className="ghost" onClick={() => setB({ ...b, ledger: [...b.ledger, { status: "paid", project, device: b.device }] })}>Paid</button></div>
        </section>
      )}
      {tab === "builds" && (
        <section className="hero"><h2>Proof {project || "NONE"}</h2>
          <p>Last {b.proofs[project]?.result || "NEVER"}</p>
          <div className="actions">
            <button onClick={() => project && setB({ ...b, proofs: { ...b.proofs, [project]: { result: "PASS", at: new Date().toISOString(), device: b.device } } })}>PASS</button>
            <button className="ghost" onClick={() => project && setB({ ...b, proofs: { ...b.proofs, [project]: { result: "FAIL", at: new Date().toISOString(), device: b.device } } })}>FAIL</button>
          </div>
        </section>
      )}
      {tab === "ship" && (
        <section className="hero"><h2>Ship {project || "—"}</h2>
          <div className="actions">
            <a className="btn" href="https://github.com/new" target="_blank" rel="noreferrer">New repo</a>
            <a className="btn ghost" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Vercel</a>
          </div>
        </section>
      )}
      {tab === "drive" && (
        <section className="hero"><h2>Brain JSON</h2>
          <textarea value={brain} readOnly />
          <label>Paste from another phone</label>
          <textarea onBlur={(e) => { try { setB({ ...empty, ...JSON.parse(e.target.value) }); } catch {} }} />
        </section>
      )}
      {tab === "domains" && (
        <section className="hero"><h2>Domains</h2>
          <div className="actions"><button onClick={listZones}>List IONOS</button></div>
          <input value={probe} onChange={(e) => setProbe(e.target.value)} placeholder="ju.geturclarity.com" />
          <p className="cap">{zones}</p>
        </section>
      )}
      {tab === "mesh" && (
        <section className="hero"><h2>Mesh</h2>
          <input value={b.hosts[0]?.target || ""} onChange={(e) => setB({ ...b, hosts: [{ name: "desk", target: e.target.value }] })} />
        </section>
      )}
      {tab === "aws" && (<section className="hero"><h2>AWS</h2><p>{b.awsId || "unset"}</p></section>)}
      {tab === "ai" && (
        <>
          <div className="chat">{chat.map((m, i) => <div key={i} className={`bubble ${m.role === "me" ? "me" : ""}`}>{m.text}</div>)}</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <button className="wide" disabled={busy} onClick={ask}>Send</button>
        </>
      )}
      {tab === "help" && (
        <section className="hero"><h2>Manual</h2>
          <p>Name phone ju-1/2/3. Pick a project. Chrome=map. Termux Ju=hands.</p>
        </section>
      )}
      <nav className="nav">{TABS.map(([id, label]) => <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    </div>
  );
}
