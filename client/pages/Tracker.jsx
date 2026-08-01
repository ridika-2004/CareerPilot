import { useState, useEffect, useCallback, useRef } from "react";
import KanbanBoard from "../components/KanbanBoard";
import useAuth from "../context/useAuth";
import api from "../src/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { KanbanSquare, Target, Calendar, StickyNote, Plus, X, ChevronLeft, ChevronRight, Pin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";

const TABS = [
  { id: "kanban", label: "Applications", icon: KanbanSquare },
  { id: "goals", label: "Goals & Tasks", icon: Target },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "notes", label: "Notes", icon: StickyNote },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Tracker() {
  const { user } = useAuth();
  const userId = user?.user_id?.toString() || "";

  const [tab, setTab] = useState("kanban");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [goals, setGoals] = useState([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);
  const [stats, setStats] = useState({ weekly_progress: 0, goal_target: 5 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("5");
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("interview");
  const [notes, setNotes] = useState([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editNoteData, setEditNoteData] = useState(null);
  const [menuOpenForNote, setMenuOpenForNote] = useState(null);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  const [modalMode, setModalMode] = useState('preview');
  const [deletedNoteId, setDeletedNoteId] = useState(null);

  useEffect(() => {
    if (modalMode === 'edit' && textareaRef.current) textareaRef.current.focus();
  }, [modalMode]);

  const getSortedNotes = useCallback(() => [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }), [notes]);

  useEffect(() => {
    const handleUndo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && tab === 'notes' && deletedNoteId) {
        e.preventDefault(); restoreNote(deletedNoteId);
      }
    };
    window.addEventListener('keydown', handleUndo);
    return () => window.removeEventListener('keydown', handleUndo);
  }, [tab, deletedNoteId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenForNote && menuRef.current && !menuRef.current.contains(event.target)) setMenuOpenForNote(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenForNote]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const [todosRes, eventsRes, statsRes, goalsRes] = await Promise.all([
        api.get(`/api/tracker/todos/?user_id=${userId}`),
        api.get(`/api/tracker/events/?user_id=${userId}`),
        api.get(`/api/tracker/dashboard/?user_id=${userId}`),
        api.get(`/api/tracker/goals/?user_id=${userId}`),
      ]);
      setTodos(todosRes.data); setEvents(eventsRes.data);
      setStats(statsRes.data); setGoalInput(statsRes.data.goal_target.toString());
      setGoals(goalsRes.data);
    } catch (err) { console.error("Error loading tracker data:", err); }
  }, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get(`/api/tracker/notes/`);
      setNotes(res.data.map(n => ({ id: n.id, title: n.title, content: n.content, pinned: n.pinned, createdAt: n.createdAt, updatedAt: n.updatedAt })));
    } catch (err) { console.error("Error fetching notes:", err); }
  }, []);

  const addNote = async () => {
    if (!newNoteTitle.trim()) return;
    try {
      const res = await api.post(`/api/tracker/notes/`, { title: newNoteTitle.trim(), content: newNoteContent.trim() || "" });
      const nn = { id: res.data.id, title: res.data.title, content: res.data.content, pinned: res.data.pinned, createdAt: res.data.createdAt, updatedAt: res.data.updatedAt };
      setNotes(prev => [nn, ...prev]); setNewNoteTitle(""); setNewNoteContent(""); setShowAddNote(false);
    } catch (err) { console.error("Error adding note:", err); }
  };

  const updateNote = async (id, updates) => {
    try {
      const res = await api.put(`/api/tracker/notes/${id}/`, updates);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title: res.data.title, content: res.data.content, pinned: res.data.pinned, updatedAt: res.data.updatedAt } : n));
    } catch (err) { console.error("Error updating note:", err); }
  };

  const deleteNote = async (noteId) => {
    try { await api.delete(`/api/tracker/notes/${noteId}/`); setNotes(prev => prev.filter(n => n.id !== noteId)); setDeletedNoteId(noteId); }
    catch (err) { console.error("Error deleting note:", err); }
  };

  const restoreNote = async (noteId) => {
    try { await api.post(`/api/tracker/notes/${noteId}/restore/`); await fetchNotes(); setDeletedNoteId(null); }
    catch (err) { console.error("Error restoring note:", err); }
  };

  const togglePinNote = (id, currentPinned) => { updateNote(id, { pinned: !currentPinned }); setMenuOpenForNote(null); };

  useEffect(() => { if (userId && tab === 'notes') fetchNotes(); }, [userId, tab, fetchNotes]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try { const res = await api.post(`/api/tracker/todos/`, { user_id: userId, text: newTodo }); setTodos([res.data, ...todos]); setNewTodo(""); }
    catch (err) { console.error(err); }
  };

  const toggleTodo = async (id, current) => {
    try { const res = await api.put(`/api/tracker/todos/${id}/`, { user_id: userId, completed: !current }); setTodos(todos.map(t => t.id === id ? res.data : t)); }
    catch (err) { console.error(err); }
  };

  const deleteTodo = async (id) => {
    try { await api.delete(`/api/tracker/todos/${id}/?user_id=${userId}`); setTodos(todos.filter(t => t.id !== id)); }
    catch (err) { console.error(err); }
  };

  const saveWeeklyGoal = async () => {
    const val = parseInt(goalInput); if (isNaN(val) || val <= 0) return;
    try { const res = await api.post(`/api/tracker/goal/`, { user_id: userId, goal_target: val }); setStats({ ...stats, goal_target: res.data.goal_target }); setIsEditingGoal(false); }
    catch (err) { console.error(err); }
  };

  const addGoal = async () => {
    if (!newGoalText.trim()) return;
    try { const res = await api.post(`/api/tracker/goals/`, { user_id: userId, text: newGoalText, deadline: newGoalDeadline || undefined }); setGoals([res.data, ...goals]); setNewGoalText(""); setNewGoalDeadline(""); setAddingGoal(false); }
    catch (err) { console.error(err); }
  };

  const toggleGoal = async (id, current) => {
    try { const res = await api.put(`/api/tracker/goals/${id}/`, { user_id: userId, completed: !current }); setGoals(goals.map(g => g.id === id ? res.data : g)); }
    catch (err) { console.error(err); }
  };

  const deleteGoal = async (id) => {
    try { await api.delete(`/api/tracker/goals/${id}/?user_id=${userId}`); setGoals(goals.filter(g => g.id !== id)); }
    catch (err) { console.error(err); }
  };

  const year = currentDate.getFullYear(); const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const eventsMap = {};
  events.forEach(e => { if (!eventsMap[e.date]) eventsMap[e.date] = []; eventsMap[e.date].push(e); });
  const todayStr = (() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();

  const addCalendarEvent = async () => {
    if (!eventTitle.trim() || !selectedDate) return;
    try { const res = await api.post(`/api/tracker/events/`, { user_id: userId, title: eventTitle, date: selectedDate, event_type: eventType }); setEvents([...events, res.data]); setEventTitle(""); setShowEventModal(false); }
    catch (err) { console.error(err); }
  };

  const removeCalendarEvent = async (id) => {
    try { await api.delete(`/api/tracker/events/${id}/?user_id=${userId}`); setEvents(events.filter(e => e.id !== id)); }
    catch (err) { console.error(err); }
  };

  const downloadNoteAsPDF = async (note) => {
    const renderedHTML = marked(note.content || "");

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "800px";
    container.style.padding = "40px";
    container.style.fontFamily = "sans-serif";
    container.style.fontSize = "15px";
    container.style.lineHeight = "1.6";
    container.style.color = "#111";
    container.style.background = "#fff";
    container.style.boxSizing = "border-box";

    // Title
    const titleEl = document.createElement("h1");
    titleEl.textContent = note.title;
    titleEl.style.fontSize = "24px";
    titleEl.style.fontWeight = "700";
    titleEl.style.marginBottom = "16px";
    titleEl.style.borderBottom = "1px solid #e0e0e0";
    titleEl.style.paddingBottom = "10px";
    container.appendChild(titleEl);

    // Rendered Markdown content
    const contentEl = document.createElement("div");
    contentEl.innerHTML = renderedHTML;

    // Inline styles for common Markdown elements so html2canvas captures them
    contentEl.querySelectorAll("h1").forEach(el => Object.assign(el.style, { fontSize: "22px", fontWeight: "700", margin: "16px 0 8px" }));
    contentEl.querySelectorAll("h2").forEach(el => Object.assign(el.style, { fontSize: "18px", fontWeight: "600", margin: "14px 0 6px" }));
    contentEl.querySelectorAll("h3").forEach(el => Object.assign(el.style, { fontSize: "15px", fontWeight: "600", margin: "12px 0 5px" }));
    contentEl.querySelectorAll("ul").forEach(el => Object.assign(el.style, { paddingLeft: "24px", margin: "6px 0", listStyle: "disc" }));
    contentEl.querySelectorAll("ol").forEach(el => Object.assign(el.style, { paddingLeft: "24px", margin: "6px 0", listStyle: "decimal" }));
    contentEl.querySelectorAll("li").forEach(el => Object.assign(el.style, { marginBottom: "4px" }));
    contentEl.querySelectorAll("p").forEach(el => Object.assign(el.style, { margin: "8px 0" }));
    contentEl.querySelectorAll("code").forEach(el => Object.assign(el.style, { background: "#f4f4f4", padding: "2px 6px", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }));
    contentEl.querySelectorAll("pre").forEach(el => Object.assign(el.style, { background: "#f4f4f4", padding: "12px", borderRadius: "6px", overflowX: "auto", margin: "10px 0" }));
    contentEl.querySelectorAll("blockquote").forEach(el => Object.assign(el.style, { borderLeft: "3px solid #ccc", paddingLeft: "12px", color: "#555", margin: "10px 0" }));
    contentEl.querySelectorAll("strong").forEach(el => Object.assign(el.style, { fontWeight: "700" }));
    contentEl.querySelectorAll("em").forEach(el => Object.assign(el.style, { fontStyle: "italic" }));
    contentEl.querySelectorAll("a").forEach(el => Object.assign(el.style, { color: "#2563eb", textDecoration: "underline" }));
    contentEl.querySelectorAll("hr").forEach(el => Object.assign(el.style, { border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }));
    contentEl.querySelectorAll("table").forEach(el => Object.assign(el.style, { borderCollapse: "collapse", width: "100%", margin: "10px 0" }));
    contentEl.querySelectorAll("th, td").forEach(el => Object.assign(el.style, { border: "1px solid #ddd", padding: "8px 12px", textAlign: "left" }));
    contentEl.querySelectorAll("th").forEach(el => Object.assign(el.style, { background: "#f0f0f0", fontWeight: "600" }));

    container.appendChild(contentEl);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    // Split into multiple pages if content is taller than one page
    let yOffset = 0;
    while (yOffset < imgHeightMm) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -yOffset, pdfWidth, imgHeightMm);
      yOffset += pageHeightMm;
    }

    pdf.save(`${note.title}.pdf`);
    document.body.removeChild(container);
  };

  const goalPct = stats.goal_target > 0 ? Math.min(100, Math.round((stats.weekly_progress / stats.goal_target) * 100)) : 0;
  const today = new Date();
  const isOverdue = (deadline) => deadline ? new Date(deadline) < new Date(today.toDateString()) : false;
  const sortedNotes = getSortedNotes();

  return (
    <div className="anim-fade-up">
      <h1 style={S.h1}>Tracker</h1>
      <p style={S.sub}>Applications, goals, tasks, and calendar — all in one place.</p>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
              <Icon size={15} strokeWidth={1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "kanban" && <KanbanBoard />}

      {tab === "goals" && (<>
        <div style={S.weeklyGoalCard}>
          <div style={S.wgTop}>
            <span style={S.wgLabel}>Weekly Application Goal</span>
            <span style={S.wgNum}>{stats.weekly_progress} <span style={S.wgOf}>/ {stats.goal_target}</span></span>
          </div>
          <div style={S.bar}><div style={S.fill(goalPct)} /></div>
          <div style={S.wgBottom}>
            <span style={S.wgPct}>{goalPct}%</span>
            {isEditingGoal ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="number" value={goalInput} min={1} onChange={e => setGoalInput(e.target.value)} style={S.goalEditInput} />
                <button onClick={saveWeeklyGoal} style={S.smallPrimaryBtn}>Save</button>
                <button onClick={() => setIsEditingGoal(false)} style={S.smallGhostBtn}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setIsEditingGoal(true)} style={S.changeTargetBtn}>Change target</button>
            )}
          </div>
        </div>

        <div style={S.goalsRow}>
          <div style={S.box}>
            <div style={S.boxHead}>
              <span>My Goals</span>
              <button onClick={() => setAddingGoal(!addingGoal)} style={S.addGoalToggle(addingGoal)}>
                {addingGoal ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Goal</>}
              </button>
            </div>
            {addingGoal && (
              <div style={S.addGoalForm}>
                <input placeholder='e.g. "Finish DSA course by Friday"' value={newGoalText} onChange={e => setNewGoalText(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()} style={S.fullInput} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="date" value={newGoalDeadline} onChange={e => setNewGoalDeadline(e.target.value)} style={S.dateInput} />
                  <button onClick={addGoal} style={S.primaryBtn}>Add Goal</button>
                </div>
              </div>
            )}
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {goals.length === 0 ? <div style={S.empty}>No goals yet — add one above!</div> : goals.map(g => (
                <div key={g.id} style={g.completed ? S.goalItemDone : S.goalItem}>
                  <input type="checkbox" checked={g.completed} onChange={() => toggleGoal(g.id, g.completed)} style={{ cursor: "pointer", marginTop: 3, flexShrink: 0, accentColor: "var(--accent)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={S.goalText(g.completed)}>{g.text}</div>
                    {g.deadline && <div style={S.goalDeadline(!g.completed && isOverdue(g.deadline))}>{!g.completed && isOverdue(g.deadline) ? "Overdue · " : "Due "}{new Date(g.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>}
                  </div>
                  <button style={S.delBtn} onClick={() => deleteGoal(g.id)}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div style={S.box}>
            <div style={S.boxHead}><span>Today's Tasks</span></div>
            <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 52 }}>
              {todos.length === 0 ? <div style={S.empty}>No tasks yet.</div> : todos.map(t => (
                <div key={t.id} style={S.todoItem}>
                  <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)} style={{ cursor: "pointer", flexShrink: 0, accentColor: "var(--accent)" }} />
                  <span style={S.todoText(t.completed)}>{t.text}</span>
                  <button style={S.delBtn} onClick={() => deleteTodo(t.id)}><X size={14} /></button>
                </div>
              ))}
            </div>
            <div style={S.addRow}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === "Enter" && addTodo()} placeholder="Add a task..." style={S.fullInput} />
              <button onClick={addTodo} style={S.primaryBtn}>Add</button>
            </div>
          </div>
        </div>
      </>)}

      {tab === "calendar" && (
        <div style={S.box}>
          <div style={S.calHeader}>
            <span style={S.calTitle}>{MONTHS[month]} {year}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={S.calNavBtn} onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></button>
              <button style={S.calNavBtn} onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight size={14} /></button>
            </div>
          </div>
          <div style={S.calGrid}>
            {WEEKDAYS.map(d => <div key={d} style={S.calDayLabel}>{d}</div>)}
            {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 64 }} />)}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsMap[dateStr] || [];
              const cellToday = dateStr === todayStr;
              return (
                <div key={day} style={S.calCell(cellToday, selectedDate === dateStr)} onClick={() => { setSelectedDate(dateStr); setShowEventModal(true); }}>
                  <div style={S.calDateNum(cellToday)}>{day}</div>
                  {dayEvents.slice(0, 2).map(e => <div key={e.id} style={S.eventTag}>{e.title}</div>)}
                  {dayEvents.length > 2 && <div style={{ fontSize: 9, color: "var(--text-faint)" }}>+{dayEvents.length - 2}</div>}
                </div>
              );
            })}
          </div>
          {showEventModal && (
            <div style={S.backdrop} onClick={() => setShowEventModal(false)}>
              <div style={S.modal} onClick={e => e.stopPropagation()} className="anim-scale-in">
                <div style={S.modalTitle}>{selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                {eventsMap[selectedDate]?.length > 0 && (
                  <div style={{ marginBottom: 14, borderBottom: "1px solid var(--border-light)", paddingBottom: 10 }}>
                    {eventsMap[selectedDate].map(e => (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: "var(--text-secondary)" }}>{e.title}</span>
                        <button onClick={() => removeCalendarEvent(e.id)} style={{ border: "none", background: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 11 }}>remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--text-secondary)" }}>Add event</div>
                <input placeholder="Event title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addCalendarEvent()} style={S.modalInput} />
                <select value={eventType} onChange={e => setEventType(e.target.value)} style={S.modalSelect}>
                  <option value="interview">Interview</option>
                  <option value="deadline">Deadline</option>
                  <option value="other">Other</option>
                </select>
                <div style={S.modalBtns}>
                  <button onClick={addCalendarEvent} style={S.primaryBtn}>Add Event</button>
                  <button onClick={() => setShowEventModal(false)} style={S.ghostBtn}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "notes" && (<>
        <button style={S.addNoteBtn} onClick={() => setShowAddNote(!showAddNote)}>
          {showAddNote ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Note</>}
        </button>
        {showAddNote && (
          <div style={S.noteForm} className="anim-scale-in">
            <input type="text" placeholder="Note title" value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} style={S.modalInput} autoFocus />
            <textarea rows={3} placeholder="Content (optional)" value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} style={S.noteFormTextarea} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={S.primaryBtn} onClick={addNote}>Add Note</button>
            </div>
          </div>
        )}
        <div style={S.notesGrid}>
          {sortedNotes.length === 0 ? <div style={S.empty}>No notes yet. Click "New Note" to start.</div> : sortedNotes.map(note => (
            <div key={note.id} style={S.noteCard} onClick={() => { setEditNoteData({ id: note.id, title: note.title, content: note.content }); setModalMode('preview'); }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-xs)"}
            >
              <div style={S.noteHeader}>
                <div style={S.noteTitle}>{note.title}</div>
                <div style={{ position: "relative" }}>
                  <button style={S.threeDotBtn} onClick={(e) => { e.stopPropagation(); setMenuOpenForNote(menuOpenForNote === note.id ? null : note.id); }}>
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpenForNote === note.id && (
                    <div ref={menuRef} style={S.noteMenu} className="anim-scale-in">
                      {/* <div
                        style={S.noteMenuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadNoteAsPDF(note);
                          setMenuOpenForNote(null);
                        }}
                      >
                        Download PDF
                      </div> */}
                      <div style={S.noteMenuItem} onClick={() => { const t = prompt('New title:', note.title); if (t?.trim()) updateNote(note.id, { title: t.trim() }); setMenuOpenForNote(null); }}>
                        <Pencil size={12} /> Rename
                      </div>
                      <div style={S.noteMenuItem} onClick={() => togglePinNote(note.id, note.pinned)}>
                        <Pin size={12} /> {note.pinned ? "Unpin" : "Pin"}
                      </div>
                      <div style={{ ...S.noteMenuItem, borderBottom: "none", color: "var(--danger)" }} onClick={() => deleteNote(note.id)}>
                        <Trash2 size={12} /> Delete
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={S.noteContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  ul: ({node, ...props}) => <ul style={{margin: '4px 0', paddingLeft: '20px', listStyle: 'disc'}} {...props} />,
                  ol: ({node, ...props}) => <ol style={{margin: '4px 0', paddingLeft: '20px', listStyle: 'decimal'}} {...props} />,
                  li: ({node, ...props}) => <li style={{marginBottom: '2px'}} {...props} />,
                  h1: ({node, ...props}) => <h1 style={{fontSize: 18, fontWeight: 700, margin: '8px 0 4px'}} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{fontSize: 16, fontWeight: 600, margin: '6px 0 3px'}} {...props} />,
                  h3: ({node, ...props}) => <h3 style={{fontSize: 14, fontWeight: 600, margin: '5px 0 2px'}} {...props} />,
                }}>{note.content || "*No content*"}</ReactMarkdown>
              </div>
              <div style={S.noteFooter}>
                {note.pinned && <span style={S.pinBadge}><Pin size={10} /> Pinned</span>}
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
        {deletedNoteId && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 16, textAlign: "center" }}>Note deleted. Press <kbd style={{ background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>Ctrl+Z</kbd> to undo.</div>}
        {editNoteData && (
          <div style={S.fullBackdrop} onClick={() => setEditNoteData(null)}>
            <div style={S.fullModal} onClick={e => e.stopPropagation()} className="anim-scale-in">
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
                <button style={S.ghostBtn} onClick={() => setModalMode(modalMode === 'preview' ? 'edit' : 'preview')}>
                  {modalMode === 'preview' ? <Pencil size={14} /> : "Preview"}
                </button>
              </div>
              {modalMode === 'preview' ? (
                <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    h1: (p) => <h1 style={{fontSize: 28, fontWeight: 700, margin: '16px 0 8px'}} {...p} />,
                    h2: (p) => <h2 style={{fontSize: 24, fontWeight: 600, margin: '14px 0 6px'}} {...p} />,
                    h3: (p) => <h3 style={{fontSize: 20, fontWeight: 600, margin: '12px 0 5px'}} {...p} />,
                    ul: (p) => <ul style={{margin: '4px 0', paddingLeft: '20px', listStyle: 'disc'}} {...p} />,
                    ol: (p) => <ol style={{margin: '4px 0', paddingLeft: '20px', listStyle: 'decimal'}} {...p} />,
                    li: (p) => <li style={{marginBottom: '2px'}} {...p} />,
                  }}>{editNoteData.content || '*No content*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea ref={textareaRef} rows={1} value={editNoteData.content} onChange={e => setEditNoteData({ ...editNoteData, content: e.target.value })} placeholder="Write your note (Markdown supported)..." style={S.fullTextarea} autoFocus />
              )}
              <div style={S.modalBtns}>
                <button style={S.primaryBtn} onClick={() => { updateNote(editNoteData.id, { content: editNoteData.content }); setEditNoteData(null); }}>Save</button>
                <button style={S.ghostBtn} onClick={() => setEditNoteData(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}

/* ── Styles ── */
const S = {
  h1: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px", fontFamily: "var(--font-sans)" },
  sub: { color: "var(--text-muted)", fontSize: 14, marginBottom: 24, fontFamily: "var(--font-sans)" },
  tabs: { display: "flex", gap: 4, marginBottom: 28, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 4 },
  tab: (a) => ({
    display: "flex", alignItems: "center", gap: 7,
    border: "none", padding: "9px 18px", fontFamily: "var(--font-sans)",
    fontSize: 13, cursor: "pointer", fontWeight: a ? 600 : 500,
    color: a ? "var(--accent)" : "var(--text-muted)",
    background: a ? "var(--bg-card)" : "transparent",
    borderRadius: "var(--radius-sm)", transition: "all 0.15s",
    boxShadow: a ? "var(--shadow-xs)" : "none",
  }),

  // Weekly goal
  weeklyGoalCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 20,
    boxShadow: "var(--shadow-xs)",
  },
  wgTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  wgLabel: { fontWeight: 600, fontSize: 14, color: "var(--text-primary)" },
  wgNum: { fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" },
  wgOf: { fontSize: 14, fontWeight: 500, color: "var(--text-faint)" },
  bar: { height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  fill: (pct) => ({ height: "100%", width: `${pct}%`, background: "var(--accent-gradient)", borderRadius: 4, transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }),
  wgBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  wgPct: { fontSize: 12, color: "var(--text-muted)", fontWeight: 500 },
  goalEditInput: { width: 50, border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 12, outline: "none", fontFamily: "var(--font-sans)" },
  smallPrimaryBtn: { fontSize: 11, padding: "3px 10px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-sans)" },
  smallGhostBtn: { fontSize: 11, padding: "3px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-sans)", color: "var(--text-secondary)" },
  changeTargetBtn: { fontSize: 12, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 500, fontFamily: "var(--font-sans)" },

  // Goals row
  goalsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  box: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: 20, position: "relative",
    boxShadow: "var(--shadow-xs)",
  },
  boxHead: { fontWeight: 600, fontSize: 14, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-primary)" },
  addGoalToggle: (active) => ({
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 12, padding: "5px 12px", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600,
    background: active ? "var(--text-primary)" : "var(--bg-card)",
    color: active ? "#fff" : "var(--text-secondary)",
    fontFamily: "var(--font-sans)", transition: "all 0.15s",
  }),
  addGoalForm: { marginBottom: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  fullInput: { width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", background: "var(--bg-card)", boxSizing: "border-box", color: "var(--text-primary)" },
  dateInput: { border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontFamily: "var(--font-sans)", outline: "none", width: 150, background: "var(--bg-card)" },
  primaryBtn: { border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", background: "var(--accent-gradient)", color: "var(--btn-accent-text)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" },
  ghostBtn: { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 16px", background: "var(--bg-card)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", color: "var(--text-secondary)" },

  empty: { color: "var(--text-faint)", fontSize: 13, padding: "16px 0", textAlign: "center" },
  goalItem: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)" },
  goalItemDone: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-elevated)" },
  goalText: (done) => ({ flex: 1, fontSize: 13, color: done ? "var(--text-faint)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none", lineHeight: 1.5 }),
  goalDeadline: (overdue) => ({ fontSize: 11, color: overdue ? "var(--warning)" : "var(--text-muted)", marginTop: 2 }),
  delBtn: { background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" },

  todoItem: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13 },
  todoText: (done) => ({ color: done ? "var(--text-faint)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none", flex: 1, lineHeight: 1.4 }),
  addRow: { display: "flex", gap: 6, position: "absolute", bottom: 16, left: 16, right: 16 },

  // Calendar
  calHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  calTitle: { fontWeight: 700, fontSize: 16, color: "var(--text-primary)" },
  calNavBtn: { display: "flex", alignItems: "center", border: "1px solid var(--border)", background: "var(--bg-card)", padding: "6px 10px", cursor: "pointer", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" },
  calDayLabel: { fontWeight: 600, fontSize: 10, color: "var(--text-faint)", padding: "6px 0", textTransform: "uppercase", letterSpacing: "0.5px" },
  calCell: (isToday, isSelected) => ({
    background: isSelected ? "var(--accent-light)" : "var(--bg-card)",
    border: isToday ? "2px solid var(--accent)" : "1px solid var(--border-light)",
    borderRadius: 8, minHeight: 64, padding: 5, cursor: "pointer",
    textAlign: "left", position: "relative", display: "flex", flexDirection: "column",
    transition: "all 0.15s",
  }),
  calDateNum: (isToday) => ({ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--accent)" : "var(--text-secondary)" }),
  eventTag: { fontSize: 9, padding: "1px 6px", borderRadius: 4, marginTop: 2, background: "var(--accent-light)", color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 },

  // Modals
  backdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, width: 360, boxShadow: "var(--shadow-xl)" },
  modalTitle: { fontWeight: 700, fontSize: 16, marginBottom: 16, color: "var(--text-primary)" },
  modalInput: { width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "var(--font-sans)", background: "var(--bg-card)", color: "var(--text-primary)" },
  modalSelect: { width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontSize: 13, outline: "none", marginBottom: 14, background: "var(--bg-card)", fontFamily: "var(--font-sans)", color: "var(--text-primary)" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8 },

  // Notes
  addNoteBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid var(--border)", background: "var(--bg-card)",
    padding: "8px 18px", borderRadius: "var(--radius-md)", fontSize: 13,
    cursor: "pointer", marginBottom: 20, fontFamily: "var(--font-sans)",
    fontWeight: 500, color: "var(--text-secondary)",
  },
  noteForm: { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 18, marginBottom: 24 },
  noteFormTextarea: { width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box", fontFamily: "var(--font-sans)", resize: "vertical", background: "var(--bg-card)", color: "var(--text-primary)" },
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 },
  noteCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: 16, transition: "box-shadow 0.2s",
    position: "relative", display: "flex", flexDirection: "column",
    height: 250, overflow: "hidden", cursor: "pointer",
    boxShadow: "var(--shadow-xs)",
  },
  noteHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  noteTitle: { fontWeight: 600, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.3, flex: 1 },
  threeDotBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4, display: "flex", borderRadius: 4 },
  noteContent: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  noteFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-faint)", marginTop: "auto" },
  pinBadge: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, background: "var(--accent-light)", padding: "2px 8px", borderRadius: 12, color: "var(--accent)", fontWeight: 600 },
  noteMenu: { position: "absolute", top: 36, right: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", zIndex: 30, minWidth: 140, overflow: "hidden" },
  noteMenuItem: { display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 12, cursor: "pointer", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)", transition: "background 0.1s" },

  // Full note modal
  fullBackdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 },
  fullModal: {
    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)",
    width: "95vw", height: "90vh", maxWidth: 1400, display: "flex", flexDirection: "column",
    boxShadow: "var(--shadow-xl)", padding: 24, gap: 16,
  },
  fullTextarea: {
    flex: 1, width: "100%", fontSize: 16, lineHeight: 1.6, padding: 20,
    borderRadius: "var(--radius-lg)", fontFamily: "var(--font-sans)", resize: "vertical",
    outline: "none", border: "1.5px solid var(--border)", color: "var(--text-primary)",
    background: "var(--bg-card)",
  },
};