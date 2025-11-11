/*
DailyFocus - single-file React component (App.jsx)

Setup (recommended):
1. Create project with Vite + React: 
   npm create vite@latest daily-focus -- --template react
   cd daily-focus
2. Install Tailwind CSS (recommended) following https://tailwindcss.com/docs/guides/vite
   or use the included CDN for quick demo: add the CDN link to index.html
3. Replace src/App.jsx with this file. Start dev server: npm install && npm run dev

Features implemented in this single file:
- Nightly Daily Reflection modal (auto popup at 21:00 local or manual button)
  stores answers in localStorage per-date
- CRUD To-do list with localStorage per-date
- Daily progress (percent of todos complete) and streak counter
- Simple Focus Mode timer (Pomodoro-like configurable 25/5) with start/pause/reset
- Clean, modern UI using Tailwind classes and a contemporary color palette

Notes:
- This file expects Tailwind classes available. For a quick demo without Tailwind,
  include Tailwind CDN in index.html: <script src="https://cdn.tailwindcss.com"></script>
- All persistent state uses localStorage under keys: df_reflections, df_todos
*/

import React, { useEffect, useState, useRef } from 'react'

const TODAY_KEY = (d = new Date()) => d.toISOString().slice(0,10)

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch (e) {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch(e) {}
  }, [key, state])
  return [state, setState]
}

export default function App(){
  // reflections: { '2025-11-11': 'text' }
  const [reflections, setReflections] = useLocalStorage('df_reflections', {})
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionText, setReflectionText] = useState('')

  // todos: { '2025-11-11': [{id,text,done}] }
  const [todosByDate, setTodosByDate] = useLocalStorage('df_todos', {})
  const today = TODAY_KEY()
  const todaysTodos = todosByDate[today] ?? []

  // focus timer
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [isFocusRunning, setIsFocusRunning] = useState(false)
  const [onBreak, setOnBreak] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes*60)
  const timerRef = useRef(null)

  // UI small bits
  const [newTodoText, setNewTodoText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  // auto show nightly modal at 21:00 local time if no reflection for today
  useEffect(()=>{
    const now = new Date()
    const triggerHour = 21
    const has = reflections[TODAY_KEY(now)]
    if(!has){
      // if current hour >=21 show immediately; else set timeout to that hour
      if(now.getHours() >= triggerHour) setShowReflection(true)
      else {
        const then = new Date(now)
        then.setHours(triggerHour,0,0,0)
        const ms = then - now
        const t = setTimeout(()=> setShowReflection(true), ms)
        return ()=> clearTimeout(t)
      }
    }
  }, [])

  // keep secondsLeft in sync when config changes and timer not running
  useEffect(()=>{
    if(!isFocusRunning){
      setSecondsLeft(onBreak ? breakMinutes*60 : focusMinutes*60)
    }
  }, [focusMinutes, breakMinutes, onBreak, isFocusRunning])

  // timer effect
  useEffect(()=>{
    if(isFocusRunning){
      timerRef.current = setInterval(()=>{
        setSecondsLeft(s => {
          if(s <= 1){
            // switch mode
            const nextBreak = !onBreak
            setOnBreak(nextBreak)
            const nextSeconds = (onBreak ? focusMinutes : breakMinutes) * 60
            return nextSeconds
          }
          return s - 1
        })
      }, 1000)
      return ()=> clearInterval(timerRef.current)
    } else {
      clearInterval(timerRef.current)
    }
  }, [isFocusRunning, onBreak, focusMinutes, breakMinutes])

  function saveReflection(){
    const key = TODAY_KEY()
    setReflections({...reflections, [key]: reflectionText})
    setShowReflection(false)
    setReflectionText('')
  }

  function addTodo(){
    if(!newTodoText.trim()) return
    const item = { id: Date.now(), text: newTodoText.trim(), done:false }
    const next = {...todosByDate, [today]: [...todaysTodos, item]}
    setTodosByDate(next)
    setNewTodoText('')
  }

  function toggleDone(id){
    const nextList = todaysTodos.map(t => t.id===id ? {...t, done: !t.done} : t)
    setTodosByDate({...todosByDate, [today]: nextList})
  }

  function deleteTodo(id){
    const nextList = todaysTodos.filter(t => t.id!==id)
    setTodosByDate({...todosByDate, [today]: nextList})
  }

  function startEdit(todo){ setEditingId(todo.id); setEditingText(todo.text) }
  function saveEdit(){
    if(!editingId) return
    const nextList = todaysTodos.map(t => t.id===editingId ? {...t, text: editingText} : t)
    setTodosByDate({...todosByDate, [today]: nextList})
    setEditingId(null); setEditingText('')
  }

  function progressPercent(){
    if(todaysTodos.length===0) return 0
    const done = todaysTodos.filter(t=>t.done).length
    return Math.round((done / todaysTodos.length)*100)
  }

  function streak(){
    // simple: count consecutive days up to today with at least one reflection or completed todo
    const storageTodos = todosByDate
    const storageRefs = reflections
    let s = 0
    let d = new Date()
    while(true){
      const key = TODAY_KEY(d)
      const hasTodoDone = (storageTodos[key]||[]).some(t=>t.done)
      const hasRef = Boolean(storageRefs[key])
      if(hasTodoDone || hasRef){ s++; d.setDate(d.getDate()-1) } else break
    }
    return s
  }

  function resetDay(){
    const next = {...todosByDate, [today]: []}
    setTodosByDate(next)
    const rnext = {...reflections}; delete rnext[today]; setReflections(rnext)
  }

  // simple UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">DailyFocus</h1>
            <p className="text-sm text-slate-500">Refleksi. Fokus. Tugas harian.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-2 rounded-lg bg-white shadow text-sm" onClick={()=>setShowReflection(true)}>Refleksi</button>
            <button className="px-3 py-2 rounded-lg bg-rose-500 text-white text-sm shadow" onClick={resetDay}>Reset hari</button>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 bg-white p-5 rounded-2xl shadow">
            <h2 className="font-semibold text-lg">To-do Hari Ini</h2>
            <div className="mt-3 flex gap-2">
              <input value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder="Tambah tugas baru" className="flex-1 p-2 rounded-lg border" />
              <button onClick={addTodo} className="px-4 rounded-lg bg-sky-600 text-white">Tambah</button>
            </div>

            <ul className="mt-4 space-y-2">
              {todaysTodos.length===0 && <li className="text-sm text-slate-400">Belum ada tugas hari ini.</li>}
              {todaysTodos.map(t=> (
                <li key={t.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={t.done} onChange={()=>toggleDone(t.id)} />
                    {editingId===t.id ? (
                      <input className="border p-1 rounded" value={editingText} onChange={e=>setEditingText(e.target.value)} />
                    ) : (
                      <span className={t.done? 'line-through text-slate-400' : ''}>{t.text}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId===t.id ? (
                      <>
                        <button onClick={saveEdit} className="text-sm px-2 py-1 rounded bg-emerald-500 text-white">Simpan</button>
                        <button onClick={()=>{setEditingId(null); setEditingText('')}} className="text-sm px-2 py-1 rounded border">Batal</button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>startEdit(t)} className="text-sm px-2 py-1 rounded border">Edit</button>
                        <button onClick={()=>deleteTodo(t.id)} className="text-sm px-2 py-1 rounded bg-red-500 text-white">Hapus</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

          </section>

          <aside className="bg-white p-5 rounded-2xl shadow flex flex-col gap-4">
            <div>
              <h3 className="font-semibold">Progress</h3>
              <div className="mt-2 text-sm text-slate-500">{progressPercent()}% selesai</div>
              <div className="w-full bg-slate-200 rounded-full h-3 mt-2 overflow-hidden">
                <div style={{width: `${progressPercent()}%`}} className="h-3 rounded-full bg-gradient-to-r from-rose-400 to-amber-400"></div>
              </div>
              <div className="mt-2 text-xs text-slate-400">Streak: {streak()} hari</div>
            </div>

            <div>
              <h3 className="font-semibold">Focus Mode</h3>
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-xs">Focus</label>
                  <input type="number" value={focusMinutes} min={1} onChange={e=>setFocusMinutes(Math.max(1,Number(e.target.value)||25))} className="w-20 p-1 border rounded" />
                  <label className="text-xs">Break</label>
                  <input type="number" value={breakMinutes} min={1} onChange={e=>setBreakMinutes(Math.max(1,Number(e.target.value)||5))} className="w-20 p-1 border rounded" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-2xl font-mono">{Math.floor(secondsLeft/60).toString().padStart(2,'0')}:{(secondsLeft%60).toString().padStart(2,'0')}</div>
                  <div className="flex gap-2">
                    <button onClick={()=>setIsFocusRunning(r=>!r)} className="px-3 py-1 rounded bg-sky-600 text-white">{isFocusRunning? 'Pause' : 'Start'}</button>
                    <button onClick={()=>{setIsFocusRunning(false); setSecondsLeft((onBreak?breakMinutes:focusMinutes)*60)}} className="px-3 py-1 rounded border">Reset</button>
                    <button onClick={()=>{setOnBreak(b=>!b)}} className="px-3 py-1 rounded border text-sm">Toggle Break</button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">Mode: {onBreak? 'Break' : 'Focus'}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Quick Actions</h3>
              <div className="mt-2 flex flex-col gap-2">
                <button onClick={()=>{ setShowReflection(true) }} className="px-3 py-2 rounded bg-white border">Tulis refleksi</button>
                <a className="px-3 py-2 rounded bg-rose-50 text-rose-700 text-center">GitHub ready. Siap 'git init' dan push.</a>
              </div>
            </div>

          </aside>
        </main>

        {/* Reflection modal */}
        {showReflection && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Apa pencapaian kecilmu hari ini?</h3>
              <p className="text-sm text-slate-500 mt-1">Tulis satu atau dua baris. Jaga konsistensi.</p>
              <textarea value={reflectionText} onChange={e=>setReflectionText(e.target.value)} rows={4} className="mt-3 w-full border p-3 rounded" placeholder="Contoh: Menyelesaikan 30 menit belajar."
              />
              <div className="mt-4 flex justify-end gap-2">
                <button className="px-4 py-2 rounded border" onClick={()=>{ setShowReflection(false); setReflectionText('') }}>Batal</button>
                <button className="px-4 py-2 rounded bg-rose-500 text-white" onClick={saveReflection}>Simpan</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
