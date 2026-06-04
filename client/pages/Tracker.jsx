import { useState } from "react";
import KanbanBoard from "../components/KanbanBoard";

const TODAY_TODOS = [
  { id: 1, text: "Apply to DataMind job", done: false },
  { id: 2, text: "Complete LeetCode problem set #12", done: true },
  { id: 3, text: "Update CV work section", done: false },
];

const GOALS = [
  { id: 1, text: "Apply to 5 jobs this week", progress: 3, total: 5 },
  { id: 2, text: "Finish DSA course by Friday", progress: 60, total: 100, unit: "%" },
  { id: 3, text: "Update CV by Sunday", progress: 0, total: 1 },
];

const s = {
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { color: "#888", fontSize: 13, marginBottom: 24 },
  tabs: { display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #e5e5e5" },
  tab: (a) => ({ border: "none", background: "none", padding: "8px 18px", fontFamily: "inherit", fontSize: 13, cursor: "pointer", color: a ? "#1a1a1a" : "#aaa", fontWeight: a ? 600 : 400, borderBottom: a ? "2px solid #1a1a1a" : "2px solid transparent", marginBottom: -1 }),
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 },
  box: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 6, padding: 16 },
  boxHead: { fontWeight: 600, fontSize: 13, marginBottom: 12 },
  todoItem: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 },
  todoText: (done) => ({ color: done ? "#aaa" : "#1a1a1a", textDecoration: done ? "line-through" : "none" }),
  goalItem: { marginBottom: 10 },
  goalText: { fontSize: 13, marginBottom: 4 },
  goalProg: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#888" },
  bar: { flex: 1, height: 4, background: "#ebebeb", borderRadius: 3, overflow: "hidden" },
  fill: (pct) => ({ height: "100%", width: `${pct}%`, background: "#1a1a1a", borderRadius: 3 }),
};

export default function Tracker() {
  const [tab, setTab] = useState("kanban");
  const [todos, setTodos] = useState(TODAY_TODOS);
  const [newTodo, setNewTodo] = useState("");

  const toggleTodo = (id) => setTodos(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo, done: false }]);
    setNewTodo("");
  };

  return (
    <div>
      <div style={s.h1}>Tracker</div>
      <div style={s.sub}>Applications, goals, and daily tasks in one place.</div>

      <div style={s.tabs}>
        <button style={s.tab(tab === "kanban")} onClick={() => setTab("kanban")}>Applications</button>
        <button style={s.tab(tab === "goals")} onClick={() => setTab("goals")}>Goals & Todos</button>
      </div>

      {tab === "kanban" && <KanbanBoard />}

      {tab === "goals" && (
        <div style={s.row}>
          <div style={s.box}>
            <div style={s.boxHead}>Today's Tasks</div>
            {todos.map((t) => (
              <div key={t.id} style={s.todoItem}>
                <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                <span style={s.todoText(t.done)}>{t.text}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="Add a task..."
                style={{ flex: 1, border: "1px solid #ddd", borderRadius: 4, padding: "5px 8px", fontSize: 12, fontFamily: "inherit" }}
              />
              <button onClick={addTodo} style={{ border: "1px solid #ccc", borderRadius: 4, padding: "5px 10px", background: "#1a1a1a", color: "#fff", fontSize: 12, cursor: "pointer" }}>Add</button>
            </div>
          </div>

          <div style={s.box}>
            <div style={s.boxHead}>Weekly Goals</div>
            {GOALS.map((g) => {
              const pct = g.unit === "%" ? g.progress : Math.round((g.progress / g.total) * 100);
              return (
                <div key={g.id} style={s.goalItem}>
                  <div style={s.goalText}>{g.text}</div>
                  <div style={s.goalProg}>
                    <div style={s.bar}><div style={s.fill(pct)} /></div>
                    <span>{g.unit === "%" ? `${g.progress}%` : `${g.progress}/${g.total}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
