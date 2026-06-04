import { useState } from "react";

const COLS = ["Applied", "Interviewing", "Offer", "Rejected"];

const SAMPLE = [
  { id: 1, role: "ML Engineer", company: "DataCo", col: "Applied", date: "Jun 2" },
  { id: 2, role: "Backend Dev", company: "Techify", col: "Interviewing", date: "May 28" },
  { id: 3, role: "Data Analyst", company: "FinCorp", col: "Offer", date: "May 20" },
  { id: 4, role: "SWE Intern", company: "StartupX", col: "Rejected", date: "May 15" },
];

const colColor = { Applied: "#e8f0ff", Interviewing: "#fff8e0", Offer: "#e6f7ee", Rejected: "#fdecea" };
const colBorder = { Applied: "#b3c9ff", Interviewing: "#ffe699", Offer: "#99dbb4", Rejected: "#f5b3ae" };

const s = {
  board: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  col: (c) => ({ background: colColor[c], border: `1px solid ${colBorder[c]}`, borderRadius: 6, padding: 12, minHeight: 200 }),
  colHead: { fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444", marginBottom: 10 },
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, padding: "10px 12px", marginBottom: 8 },
  cardRole: { fontWeight: 600, fontSize: 13 },
  cardCo: { color: "#777", fontSize: 12 },
  cardDate: { color: "#aaa", fontSize: 11, marginTop: 4 },
  addBtn: { width: "100%", background: "none", border: "1px dashed #ccc", borderRadius: 4, padding: "6px 0", color: "#aaa", cursor: "pointer", fontSize: 12 },
};

export default function KanbanBoard() {
  const [items, setItems] = useState(SAMPLE);
  const [adding, setAdding] = useState(null);
  const [form, setForm] = useState({ role: "", company: "" });

  const add = (col) => {
    if (!form.role) return;
    setItems([...items, { id: Date.now(), col, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), ...form }]);
    setAdding(null);
    setForm({ role: "", company: "" });
  };

  return (
    <div style={s.board}>
      {COLS.map((col) => (
        <div key={col} style={s.col(col)}>
          <div style={s.colHead}>{col} ({items.filter((i) => i.col === col).length})</div>
          {items.filter((i) => i.col === col).map((item) => (
            <div key={item.id} style={s.card}>
              <div style={s.cardRole}>{item.role}</div>
              <div style={s.cardCo}>{item.company}</div>
              <div style={s.cardDate}>{item.date}</div>
            </div>
          ))}
          {adding === col ? (
            <div style={s.card}>
              <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: "100%", border: "1px solid #ddd", borderRadius: 3, padding: "4px 6px", fontSize: 12, marginBottom: 4, boxSizing: "border-box" }} />
              <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} style={{ width: "100%", border: "1px solid #ddd", borderRadius: 3, padding: "4px 6px", fontSize: 12, marginBottom: 6, boxSizing: "border-box" }} />
              <button onClick={() => add(col)} style={{ marginRight: 6, fontSize: 11, cursor: "pointer", border: "1px solid #ccc", borderRadius: 3, padding: "3px 8px", background: "#1a1a1a", color: "#fff" }}>Add</button>
              <button onClick={() => setAdding(null)} style={{ fontSize: 11, cursor: "pointer", border: "1px solid #ccc", borderRadius: 3, padding: "3px 8px", background: "none" }}>Cancel</button>
            </div>
          ) : (
            <button style={s.addBtn} onClick={() => setAdding(col)}>+ add</button>
          )}
        </div>
      ))}
    </div>
  );
}
