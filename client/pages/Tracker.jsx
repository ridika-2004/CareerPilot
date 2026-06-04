import { useState, useEffect } from "react";
import axios from "axios";
import KanbanBoard from "../components/KanbanBoard";

const s = {
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#111", fontFamily: "'Roboto Mono', monospace" },
  sub: { color: "#888", fontSize: 13, marginBottom: 24, fontFamily: "'Roboto Mono', monospace" },
  tabs: { display: "flex", gap: 0, marginBottom: 28, borderBottom: "2px solid #f0f0f0" },
  tab: (a) => ({
    border: "none", background: "none", padding: "10px 20px", fontFamily: "'Roboto Mono', monospace",
    fontSize: 13, cursor: "pointer", color: a ? "#111" : "#999", fontWeight: a ? 700 : 400,
    borderBottom: a ? "2px solid #111" : "2px solid transparent", marginBottom: -2, transition: "all 0.15s",
  }),
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 },
  box: {
    background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10,
    padding: 20, position: "relative", fontFamily: "'Roboto Mono', monospace",
  },
  boxHead: { fontWeight: 700, fontSize: 14, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#111" },

  // Todo styles
  todoList: { maxHeight: 230, overflowY: "auto", marginBottom: 48 },
  todoItem: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13 },
  todoText: (done) => ({ color: done ? "#bbb" : "#222", textDecoration: done ? "line-through" : "none", flex: 1, lineHeight: 1.4 }),
  todoDelBtn: { background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0 },
  addRow: { display: "flex", gap: 6, position: "absolute", bottom: 16, left: 16, right: 16 },
  input: { flex: 1, border: "1px solid #e0e0e0", borderRadius: 6, padding: "7px 10px", fontSize: 13, fontFamily: "'Roboto Mono', monospace", outline: "none" },
  addBtn: { border: "none", borderRadius: 6, padding: "7px 14px", background: "#111", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "'Roboto Mono', monospace", flexShrink: 0 },

  // Goal progress (weekly application goal)
  goalCard: { background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 8, padding: "14px 16px", marginBottom: 14 },
  goalLabel: { fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8, display: "flex", justifyContent: "space-between" },
  bar: { height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  fill: (pct) => ({ height: "100%", width: `${pct}%`, background: "#1a1a1a", borderRadius: 4, transition: "width 0.6s ease" }),
  pctText: { fontSize: 11, color: "#888", textAlign: "right" },

  // Custom goals
  goalItem: {
    display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10,
    padding: "10px 12px", borderRadius: 7, border: "1px solid #e5e5e5", background: "#fff",
    transition: "border-color 0.15s",
  },
  goalItemDone: {
    display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10,
    padding: "10px 12px", borderRadius: 7, border: "1px solid #f0f0f0", background: "#fafafa",
  },
  goalText: (done) => ({ flex: 1, fontSize: 13, color: done ? "#bbb" : "#222", textDecoration: done ? "line-through" : "none", lineHeight: 1.5 }),
  goalDeadline: (overdue) => ({ fontSize: 11, color: overdue ? "#999" : "#888", marginTop: 2 }),
  goalDelBtn: { background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 },

  // Deadline input form
  deadlineInput: { border: "1px solid #e0e0e0", borderRadius: 6, padding: "7px 10px", fontSize: 12, fontFamily: "'Roboto Mono', monospace", outline: "none", width: "140px" },

  // Calendar
  calHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  calTitle: { fontWeight: 700, fontSize: 15, color: "#111" },
  calNavBtn: { border: "1px solid #e5e5e5", background: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: 12, borderRadius: 6, color: "#555" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" },
  calDayLabel: { fontWeight: 600, fontSize: 10, color: "#999", padding: "4px 0", textTransform: "uppercase" },
  calCell: (isToday, isSelected) => ({
    background: isSelected ? "#f5f5f5" : "#fff",
    border: isToday ? "2px solid #1a1a1a" : "1px solid #f0f0f0",
    borderRadius: 6, minHeight: 62, padding: 4,
    cursor: "pointer", textAlign: "left", position: "relative",
    display: "flex", flexDirection: "column",
  }),
  calDateNum: (isToday) => ({ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? "#1a1a1a" : "#444" }),
  eventTag: (type) => ({
    fontSize: 9, padding: "1px 5px", borderRadius: 3, marginTop: 2,
    background: "#f0f0f0",
    color: "#555",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  }),

  // Modal
  backdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.25)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 },
  modal: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 22, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
  modalTitle: { fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#111" },
  modalInput: { width: "100%", border: "1px solid #e0e0e0", borderRadius: 6, padding: "8px 10px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "'Roboto Mono', monospace" },
  modalSelect: { width: "100%", border: "1px solid #e0e0e0", borderRadius: 6, padding: "8px 10px", fontSize: 13, outline: "none", marginBottom: 14, background: "#fff", fontFamily: "'Roboto Mono', monospace" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8 },
  btnSubmit: { border: "none", borderRadius: 6, padding: "7px 16px", background: "#111", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "'Roboto Mono', monospace" },
  btnCancel: { border: "1px solid #ddd", borderRadius: 6, padding: "7px 16px", background: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "'Roboto Mono', monospace" },

  empty: { color: "#ccc", fontSize: 13, padding: "16px 0", textAlign: "center" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Tracker() {
  const [tab, setTab] = useState("kanban");

  // Todos
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  // Custom goals
  const [goals, setGoals] = useState([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  // Weekly app goal
  const [stats, setStats] = useState({ weekly_progress: 0, goal_target: 5 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("5");

  // Calendar
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("interview");

  const userId = localStorage.getItem("user_id") || "user_default";

  const fetchData = async () => {
    try {
      const [todosRes, eventsRes, statsRes, goalsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/tracker/todos/?user_id=${userId}`),
        axios.get(`http://localhost:8000/api/tracker/events/?user_id=${userId}`),
        axios.get(`http://localhost:8000/api/tracker/dashboard/?user_id=${userId}`),
        axios.get(`http://localhost:8000/api/tracker/goals/?user_id=${userId}`),
      ]);
      setTodos(todosRes.data);
      setEvents(eventsRes.data);
      setStats(statsRes.data);
      setGoalInput(statsRes.data.goal_target.toString());
      setGoals(goalsRes.data);
    } catch (err) {
      console.error("Error loading tracker data:", err);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  // ── Todos ──────────────────────────────────────
  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const res = await axios.post("http://localhost:8000/api/tracker/todos/", { user_id: userId, text: newTodo });
      setTodos([res.data, ...todos]);
      setNewTodo("");
    } catch (err) { console.error(err); }
  };

  const toggleTodo = async (id, current) => {
    try {
      const res = await axios.put(`http://localhost:8000/api/tracker/todos/${id}/`, { user_id: userId, completed: !current });
      setTodos(todos.map(t => t.id === id ? res.data : t));
    } catch (err) { console.error(err); }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/tracker/todos/${id}/?user_id=${userId}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  // ── Weekly goal ────────────────────────────────
  const saveWeeklyGoal = async () => {
    const val = parseInt(goalInput);
    if (isNaN(val) || val <= 0) return;
    try {
      const res = await axios.post("http://localhost:8000/api/tracker/goal/", { user_id: userId, goal_target: val });
      setStats({ ...stats, goal_target: res.data.goal_target });
      setIsEditingGoal(false);
    } catch (err) { console.error(err); }
  };

  // ── Custom goals ───────────────────────────────
  const addGoal = async () => {
    if (!newGoalText.trim()) return;
    try {
      const res = await axios.post("http://localhost:8000/api/tracker/goals/", {
        user_id: userId,
        text: newGoalText,
        deadline: newGoalDeadline || undefined,
      });
      setGoals([res.data, ...goals]);
      setNewGoalText("");
      setNewGoalDeadline("");
      setAddingGoal(false);
    } catch (err) { console.error(err); }
  };

  const toggleGoal = async (id, current) => {
    try {
      const res = await axios.put(`http://localhost:8000/api/tracker/goals/${id}/`, { user_id: userId, completed: !current });
      setGoals(goals.map(g => g.id === id ? res.data : g));
    } catch (err) { console.error(err); }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/tracker/goals/${id}/?user_id=${userId}`);
      setGoals(goals.filter(g => g.id !== id));
    } catch (err) { console.error(err); }
  };

  // ── Calendar ────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const eventsMap = {};
  events.forEach(e => {
    if (!eventsMap[e.date]) eventsMap[e.date] = [];
    eventsMap[e.date].push(e);
  });

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const addCalendarEvent = async () => {
    if (!eventTitle.trim() || !selectedDate) return;
    try {
      const res = await axios.post("http://localhost:8000/api/tracker/events/", {
        user_id: userId, title: eventTitle, date: selectedDate, event_type: eventType,
      });
      setEvents([...events, res.data]);
      setEventTitle("");
      setShowEventModal(false);
    } catch (err) { console.error(err); }
  };

  const removeCalendarEvent = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/tracker/events/${id}/?user_id=${userId}`);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) { console.error(err); }
  };

  const goalPct = stats.goal_target > 0
    ? Math.min(100, Math.round((stats.weekly_progress / stats.goal_target) * 100))
    : 0;

  const today = new Date();
  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date(today.toDateString());
  };

  return (
    <div>
      <div style={s.h1}>Tracker</div>
      <div style={s.sub}>Applications, goals, tasks, and calendar — all in one place.</div>

      <div style={s.tabs}>
        <button id="tab-applications" style={s.tab(tab === "kanban")} onClick={() => setTab("kanban")}>Applications</button>
        <button id="tab-goals" style={s.tab(tab === "goals")} onClick={() => setTab("goals")}>Goals & Tasks</button>
        <button id="tab-calendar" style={s.tab(tab === "calendar")} onClick={() => setTab("calendar")}>Calendar</button>
      </div>

      {/* ── Kanban ── */}
      {tab === "kanban" && <KanbanBoard />}

      {/* ── Goals & Todos ── */}
      {tab === "goals" && (
        <>
          {/* Weekly application goal banner */}
          <div style={s.goalCard}>
            <div style={s.goalLabel}>
              <span>Weekly Application Goal</span>
              <span style={{ color: "#1a1a1a", fontWeight: 700 }}>
                {stats.weekly_progress} / {stats.goal_target} apps
              </span>
            </div>
            <div style={s.bar}>
              <div style={s.fill(goalPct)} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <div style={s.pctText}>{goalPct}% complete</div>
              {isEditingGoal ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#888" }}>Target:</span>
                  <input
                    type="number" value={goalInput} min={1}
                    onChange={e => setGoalInput(e.target.value)}
                    style={{ width: 50, border: "1px solid #ddd", borderRadius: 4, padding: "2px 6px", fontSize: 12, outline: "none" }}
                  />
                  <button onClick={saveWeeklyGoal} style={{ fontSize: 11, padding: "2px 8px", background: "#111", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setIsEditingGoal(false)} style={{ fontSize: 11, padding: "2px 8px", background: "#fff", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setIsEditingGoal(true)} style={{ fontSize: 11, background: "none", border: "none", color: "#555", cursor: "pointer", textDecoration: "underline" }}>
                  Change target
                </button>
              )}
            </div>
          </div>

          <div style={s.row}>
            {/* ── Custom Goals ── */}
            <div style={s.box}>
              <div style={s.boxHead}>
                <span>My Goals</span>
                <button
                  onClick={() => setAddingGoal(!addingGoal)}
                  style={{ fontSize: 12, padding: "3px 10px", border: "1px solid #e5e5e5", borderRadius: 6, background: addingGoal ? "#111" : "#fff", color: addingGoal ? "#fff" : "#555", cursor: "pointer" }}
                >
                  {addingGoal ? "Cancel" : "+ Add Goal"}
                </button>
              </div>

              {addingGoal && (
                <div style={{ marginBottom: 14, background: "#f9f9fb", borderRadius: 8, padding: 12, border: "1px solid #ede9fe" }}>
                  <input
                    placeholder='e.g. "Finish DSA course by Friday"'
                    value={newGoalText}
                    onChange={e => setNewGoalText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addGoal()}
                    style={{ ...s.input, marginBottom: 8, display: "block", width: "100%", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="date"
                      value={newGoalDeadline}
                      onChange={e => setNewGoalDeadline(e.target.value)}
                      style={s.deadlineInput}
                    />
                    <button onClick={addGoal} style={s.addBtn}>Add Goal</button>
                  </div>
                </div>
              )}

              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {goals.length === 0 ? (
                  <div style={s.empty}>No goals yet — add one above!</div>
                ) : (
                  goals.map(g => (
                    <div key={g.id} style={g.completed ? s.goalItemDone : s.goalItem}>
                      <input
                        type="checkbox" checked={g.completed}
                        onChange={() => toggleGoal(g.id, g.completed)}
                        style={{ cursor: "pointer", marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={s.goalText(g.completed)}>{g.text}</div>
                        {g.deadline && (
                          <div style={s.goalDeadline(!g.completed && isOverdue(g.deadline))}>
                            {!g.completed && isOverdue(g.deadline) ? "Overdue \u00b7 " : "Due "}
                            {new Date(g.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </div>
                      <button style={s.goalDelBtn} onClick={() => deleteGoal(g.id)}>×</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── To-Do List ── */}
            <div style={s.box}>
              <div style={s.boxHead}>Today's Tasks</div>
              <div style={s.todoList}>
                {todos.length === 0 ? (
                  <div style={s.empty}>No tasks yet.</div>
                ) : (
                  todos.map(t => (
                    <div key={t.id} style={s.todoItem}>
                      <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)} style={{ cursor: "pointer", flexShrink: 0 }} />
                      <span style={s.todoText(t.completed)}>{t.text}</span>
                      <button style={s.todoDelBtn} onClick={() => deleteTodo(t.id)}>×</button>
                    </div>
                  ))
                )}
              </div>
              <div style={s.addRow}>
                <input
                  value={newTodo} onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTodo()}
                  placeholder="Add a task..."
                  style={s.input}
                />
                <button onClick={addTodo} style={s.addBtn}>Add</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Calendar ── */}
      {tab === "calendar" && (
        <div style={s.box}>
          <div style={s.calHeader}>
            <span style={s.calTitle}>{MONTHS[month]} {year}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={s.calNavBtn} onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>← Prev</button>
              <button style={s.calNavBtn} onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>Next →</button>
            </div>
          </div>

          <div style={s.calGrid}>
            {WEEKDAYS.map(d => <div key={d} style={s.calDayLabel}>{d}</div>)}
            {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 62 }} />)}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsMap[dateStr] || [];
              const cellToday = dateStr === todayStr;
              return (
                <div
                  key={day}
                  style={s.calCell(cellToday, selectedDate === dateStr)}
                  onClick={() => { setSelectedDate(dateStr); setShowEventModal(true); }}
                >
                  <div style={s.calDateNum(cellToday)}>{day}</div>
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} style={s.eventTag(e.event_type)}>{e.title}</div>
                  ))}
                  {dayEvents.length > 2 && <div style={{ fontSize: 9, color: "#aaa" }}>+{dayEvents.length - 2}</div>}
                </div>
              );
            })}
          </div>

          {/* Event modal */}
          {showEventModal && (
            <div style={s.backdrop} onClick={() => setShowEventModal(false)}>
              <div style={s.modal} onClick={e => e.stopPropagation()}>
                <div style={s.modalTitle}>
                  {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>

                {/* Existing events */}
                {eventsMap[selectedDate]?.length > 0 && (
                  <div style={{ marginBottom: 14, borderBottom: "1px solid #f0f0f0", paddingBottom: 10 }}>
                    {eventsMap[selectedDate].map(e => (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: "#555" }}>
                          {e.title}
                        </span>
                        {String(e.id).startsWith("event_") && (
                          <button onClick={() => removeCalendarEvent(e.id)} style={{ border: "none", background: "none", color: "#999", cursor: "pointer", fontSize: 11 }}>
                            remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#444" }}>Add event</div>
                <input
                  placeholder="Event title (e.g. Interview prep)"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCalendarEvent()}
                  style={s.modalInput}
                />
                <select value={eventType} onChange={e => setEventType(e.target.value)} style={s.modalSelect}>
                  <option value="interview">Interview</option>
                  <option value="deadline">Deadline</option>
                  <option value="other">Other</option>
                </select>
                <div style={s.modalBtns}>
                  <button onClick={addCalendarEvent} style={s.btnSubmit}>Add Event</button>
                  <button onClick={() => setShowEventModal(false)} style={s.btnCancel}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
