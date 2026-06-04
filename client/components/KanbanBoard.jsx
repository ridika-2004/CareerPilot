import { useState, useEffect } from "react";
import axios from "axios";

const COLS = ["Applied", "Interviewing", "Offer", "Rejected"];

const colColor = { Applied: "#fafafa", Interviewing: "#fafafa", Offer: "#fafafa", Rejected: "#fafafa" };
const colBorder = { Applied: "#e5e5e5", Interviewing: "#e5e5e5", Offer: "#e5e5e5", Rejected: "#e5e5e5" };

const s = {
  board: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  col: (c) => ({ background: colColor[c], border: `1px solid ${colBorder[c]}`, borderRadius: 6, padding: 12, minHeight: 300 }),
  colHead: { fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444", marginBottom: 10 },
  card: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 4, padding: "10px 12px", marginBottom: 8, position: "relative" },
  cardRole: { fontWeight: 600, fontSize: 13, paddingRight: 20 },
  cardCo: { color: "#777", fontSize: 12 },
  cardDate: { color: "#aaa", fontSize: 11, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" },
  addBtn: { width: "100%", background: "none", border: "1px dashed #ccc", borderRadius: 4, padding: "6px 0", color: "#aaa", cursor: "pointer", fontSize: 12 },
  select: { border: "1px solid #ddd", borderRadius: 3, fontSize: 10, padding: "1px 4px", background: "#f9f9f9", cursor: "pointer", color: "#555", outline: "none" },
  deleteBtn: { position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 12, padding: 0 }
};

export default function KanbanBoard() {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(null);
  const [form, setForm] = useState({ role: "", company: "" });
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("user_id") || "user_default";

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/tracker/applications/?user_id=${userId}`);
      // Backend returns status as 'status'. We map it to 'col' on the frontend to match original design.
      const mapped = res.data.map(item => ({
        ...item,
        col: item.status
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const add = async (col) => {
    if (!form.role || !form.company) return;
    try {
      const res = await axios.post("http://localhost:8000/api/tracker/applications/", {
        user_id: userId,
        role: form.role,
        company: form.company,
        status: col
      });
      setItems([...items, { ...res.data, col: res.data.status }]);
      setAdding(null);
      setForm({ role: "", company: "" });
    } catch (err) {
      console.error("Error adding application:", err);
    }
  };

  const moveCard = async (id, newCol) => {
    const card = items.find(i => i.id === id);
    if (!card) return;
    try {
      await axios.put(`http://localhost:8000/api/tracker/applications/${id}/`, {
        user_id: userId,
        role: card.role,
        company: card.company,
        status: newCol
      });
      setItems(items.map(item => item.id === id ? { ...item, col: newCol, status: newCol } : item));
    } catch (err) {
      console.error("Error moving application:", err);
    }
  };

  const removeCard = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/tracker/applications/${id}/?user_id=${userId}`);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  return (
    <div style={s.board}>
      {COLS.map((col) => (
        <div key={col} style={s.col(col)}>
          <div style={s.colHead}>{col} ({items.filter((i) => i.col === col).length})</div>
          {loading && items.length === 0 ? (
            <div style={{ fontSize: 12, color: "#888", textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : (
            items.filter((i) => i.col === col).map((item) => (
              <div key={item.id} style={s.card}>
                <button style={s.deleteBtn} onClick={() => removeCard(item.id)}>×</button>
                <div style={s.cardRole}>{item.role}</div>
                <div style={s.cardCo}>{item.company}</div>
                <div style={s.cardDate}>
                  <span>{item.date}</span>
                  <select
                    value={item.col}
                    onChange={(e) => moveCard(item.id, e.target.value)}
                    style={s.select}
                  >
                    {COLS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ))
          )}
          {adding === col ? (
            <div style={s.card}>
              <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: "100%", border: "1px solid #ddd", borderRadius: 3, padding: "4px 6px", fontSize: 12, marginBottom: 4, boxSizing: "border-box", outline: "none" }} />
              <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} style={{ width: "100%", border: "1px solid #ddd", borderRadius: 3, padding: "4px 6px", fontSize: 12, marginBottom: 6, boxSizing: "border-box", outline: "none" }} />
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

