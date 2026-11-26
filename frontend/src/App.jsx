import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, Trash2, Truck, Bell, Recycle, Leaf, Plus, Search,
  MapPin, Activity, AlertTriangle, CheckCircle2, Clock3, Menu, X,
  RefreshCw, Pencil, Trash, ChevronRight, PackageCheck, Weight, Sparkles, LogOut, Eye, EyeOff
} from 'lucide-react'
import { api } from './api'

const nav = [
  ['Overview', LayoutDashboard], ['Dustbins', Trash2], ['Collections', Truck],
  ['Waste Analytics', Recycle], ['Alerts', Bell],
]
const money = (n) => `${Number(n || 0).toLocaleString('en-IN')}`
const statusFor = (n) => n >= 80 ? 'Full' : n >= 60 ? 'Almost Full' : 'Available'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('ecotrack-auth') === 'true')
  const [page, setPage] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const [bins, setBins] = useState([])
  const [collections, setCollections] = useState([])
  const [records, setRecords] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [showBinForm, setShowBinForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [binForm, setBinForm] = useState({ name: '', location: '', fill_level: 0, waste_type: 'Mixed' })
  const [collectionBin, setCollectionBin] = useState('')
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0,10))

  async function loadAll() {
    try {
      setError('')
      const [d, b, c, r, a] = await Promise.all([api.dashboard(), api.bins(), api.collections(), api.records(), api.alerts()])
      setDashboard(d); setBins(b); setCollections(c); setRecords(r); setAlerts(a)
    } catch (e) { setError(`${e.message}. Check that the Flask backend is running on port 5000.`) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (authenticated) loadAll() }, [authenticated])

  function handleLogin() {
    sessionStorage.setItem('ecotrack-auth', 'true')
    setAuthenticated(true)
  }
  function handleLogout() {
    sessionStorage.removeItem('ecotrack-auth')
    setAuthenticated(false)
    setLoading(true)
    setPage('Overview')
  }

  const filteredBins = useMemo(() => bins.filter(b =>
    `${b.name} ${b.location} ${b.waste_type}`.toLowerCase().includes(query.toLowerCase())
  ), [bins, query])

  function openAdd() {
    setEditing(null); setBinForm({ name: '', location: '', fill_level: 0, waste_type: 'Mixed' }); setShowBinForm(true)
  }
  function openEdit(bin) {
    setEditing(bin.id); setBinForm({ name: bin.name, location: bin.location, fill_level: bin.fill_level, waste_type: bin.waste_type }); setShowBinForm(true)
  }
  async function saveBin(e) {
    e.preventDefault()
    try {
      if (editing) await api.updateBin(editing, binForm)
      else await api.addBin(binForm)
      setShowBinForm(false); await loadAll()
    } catch (e) { setError(e.message) }
  }
  async function removeBin(id) {
    if (!confirm('Delete this dustbin?')) return
    try { await api.deleteBin(id); await loadAll() } catch (e) { setError(e.message) }
  }
  async function createCollection(e) {
    e.preventDefault()
    try {
      await api.addCollection({ bin_id: Number(collectionBin), scheduled_date: collectionDate })
      setCollectionBin(''); await loadAll()
    } catch (e) { setError(e.message) }
  }
  async function changeCollection(id, status) {
    try { await api.updateCollection(id, status); await loadAll() } catch (e) { setError(e.message) }
  }

  const total = dashboard?.total_bins ?? 0
  const full = dashboard?.full_bins ?? 0
  const pending = dashboard?.pending_collections ?? 0
  const waste = dashboard?.total_waste_kg ?? 0

  if (!authenticated) return <LoginPage onLogin={handleLogin}/>

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Leaf size={22}/></div><div><b>EcoTrack</b><span>SMART WASTE SYSTEM</span></div><button className="mobile-close" onClick={() => setMobileOpen(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(([name, Icon]) => <button key={name} className={`nav-link ${page === name ? 'active' : ''}`} onClick={() => { setPage(name); setMobileOpen(false) }}><Icon size={18}/><span>{name}</span>{name === 'Alerts' && alerts.length > 0 && <em>{alerts.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="eco-card"><div className="eco-icon"><Sparkles size={17}/></div><b>Cleaner spaces start here.</b><p>Monitor waste smarter, collect faster, and build a greener campus.</p></div><div className="profile"><div className="avatar">AD</div><div><b>Administrator</b><span>System manager</span></div><span className="online-dot"/></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="top-left"><button className="menu-btn" onClick={() => setMobileOpen(true)}><Menu/></button><div><div className="eyebrow">WASTE MANAGEMENT / {page.toUpperCase()}</div><h1>{page === 'Overview' ? 'Good evening, Admin' : page}</h1></div></div><div className="top-actions"><div className="system-status"><span/> System operational</div><button className="icon-btn" onClick={loadAll} title="Refresh"><RefreshCw size={17}/></button><button className="logout-btn" onClick={handleLogout} title="Log out"><LogOut size={16}/><span>Log out</span></button><div className="top-avatar">AD</div></div></header>
      <div className="content">
        {error && <div className="error-banner"><AlertTriangle size={17}/>{error}<button onClick={() => setError('')}><X size={16}/></button></div>}
        {loading ? <div className="loading"><div className="spinner"/>Loading your waste management data...</div> : <>
          {page === 'Overview' && <Overview dashboard={dashboard} bins={bins} collections={collections} alerts={alerts} setPage={setPage}/>}
          {page === 'Dustbins' && <section><div className="section-head"><div><div className="eyebrow">DEVICE MANAGEMENT</div><h2>Dustbin monitoring</h2><p>Track fill levels and manage registered dustbins.</p></div><button className="primary-btn" onClick={openAdd}><Plus size={17}/> Add dustbin</button></div><div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Search by bin or location..." value={query} onChange={e => setQuery(e.target.value)}/></div><span className="muted">{filteredBins.length} dustbins</span></div><div className="bin-grid">{filteredBins.map(bin => <BinCard key={bin.id} bin={bin} onEdit={() => openEdit(bin)} onDelete={() => removeBin(bin.id)}/>)}</div>{filteredBins.length === 0 && <Empty text="No dustbins match your search."/>}</section>}
          {page === 'Collections' && <section><div className="section-head"><div><div className="eyebrow">FIELD OPERATIONS</div><h2>Collection schedule</h2><p>Plan and track waste collection activities.</p></div></div><form className="schedule-form" onSubmit={createCollection}><div><label>Select dustbin</label><select required value={collectionBin} onChange={e => setCollectionBin(e.target.value)}><option value="">Choose a dustbin</option>{bins.map(b => <option value={b.id} key={b.id}>{b.name} — {b.location}</option>)}</select></div><div><label>Collection date</label><input type="date" required value={collectionDate} onChange={e => setCollectionDate(e.target.value)}/></div><button className="primary-btn"><Plus size={17}/> Schedule collection</button></form><div className="table-card"><div className="table-title"><div><h3>All collection requests</h3><p>Update each request as the work progresses.</p></div><span className="count-pill">{collections.length} requests</span></div><CollectionTable collections={collections} onChange={changeCollection}/></div></section>}
          {page === 'Waste Analytics' && <Analytics dashboard={dashboard} records={records}/>}
          {page === 'Alerts' && <section><div className="section-head"><div><div className="eyebrow">ATTENTION REQUIRED</div><h2>System alerts</h2><p>Dustbins at 80% capacity or higher need attention.</p></div><span className="count-pill">{alerts.length} active alerts</span></div>{alerts.length ? <div className="alert-list">{alerts.map(a => <div className="alert-row" key={a.id}><div className="alert-symbol"><AlertTriangle/></div><div className="alert-copy"><b>{a.bin_name} is {a.severity.toLowerCase()}</b><span><MapPin size={13}/> {a.location}</span></div><div className="alert-progress"><div className="progress-track"><i style={{width:`${a.fill_level}%`}}/></div><b>{a.fill_level}%</b></div><button className="text-btn" onClick={() => setPage('Collections')}>Arrange pickup <ChevronRight size={15}/></button></div>)}</div> : <Empty text="All clear! No bins are currently at alert level."/>}</section>}
        </>}
        <footer>© 2026 EcoTrack · Smart Waste Management <span>Prototype data · Hardware integration planned</span></footer>
      </div>
    </main>
    {showBinForm && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowBinForm(false)}><form className="modal" onSubmit={saveBin}><div className="modal-head"><div><div className="eyebrow">DEVICE DETAILS</div><h2>{editing ? 'Edit dustbin' : 'Add new dustbin'}</h2></div><button type="button" className="icon-btn" onClick={() => setShowBinForm(false)}><X/></button></div><label>Dustbin name</label><input required value={binForm.name} onChange={e => setBinForm({...binForm, name:e.target.value})} placeholder="e.g. Bin 07"/><label>Location</label><input required value={binForm.location} onChange={e => setBinForm({...binForm, location:e.target.value})} placeholder="e.g. Sports complex"/><label>Current fill level: {binForm.fill_level}%</label><input type="range" min="0" max="100" value={binForm.fill_level} onChange={e => setBinForm({...binForm, fill_level:Number(e.target.value)})}/><label>Waste type</label><select value={binForm.waste_type} onChange={e => setBinForm({...binForm, waste_type:e.target.value})}><option>Mixed</option><option>Wet</option><option>Dry</option><option>Plastic</option><option>Paper</option></select><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowBinForm(false)}>Cancel</button><button className="primary-btn"><CheckCircle2 size={16}/> Save dustbin</button></div></form></div>}
  </div>
}

function Overview({ dashboard, bins, collections, alerts, setPage }) {
  const stats = [
    {label:'Total dustbins', value:dashboard?.total_bins ?? 0, note:'Registered locations', icon:Trash2, tone:'green'},
    {label:'Bins need attention', value:dashboard?.full_bins ?? 0, note:'80% capacity or above', icon:AlertTriangle, tone:'orange'},
    {label:'Pending collections', value:dashboard?.pending_collections ?? 0, note:'Awaiting completion', icon:Truck, tone:'blue'},
    {label:'Waste recorded', value:`${dashboard?.total_waste_kg ?? 0} kg`, note:'Across all categories', icon:Weight, tone:'purple'},
  ]
  return <section><div className="welcome-row"><div><div className="eyebrow">CAMPUS OVERVIEW</div><h2>Your sustainability at a glance</h2><p>Here’s what’s happening across your monitored locations today.</p></div><div className="date-chip"><Activity size={15}/> Live overview</div></div><div className="stats-grid">{stats.map(s => <div className="stat-card" key={s.label}><div className={`stat-icon ${s.tone}`}><s.icon size={19}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-note">{s.note}</div></div>)}</div><div className="overview-grid"><div className="panel"><div className="panel-head"><div><h3>Dustbin status</h3><p>Fill level across monitored locations</p></div><button className="text-btn" onClick={() => setPage('Dustbins')}>View all <ChevronRight size={15}/></button></div><div className="status-list">{bins.slice(0,5).map(b => <div className="status-item" key={b.id}><div className="bin-mini"><Trash2 size={17}/></div><div className="status-name"><b>{b.name}</b><span>{b.location}</span></div><div className="status-bar"><div className="progress-track"><i className={b.fill_level >= 80 ? 'danger' : b.fill_level >= 60 ? 'warning' : ''} style={{width:`${b.fill_level}%`}}/></div><span>{b.fill_level}%</span></div><StatusPill status={statusFor(b.fill_level)}/></div>)}</div></div><div className="panel"><div className="panel-head"><div><h3>Needs attention</h3><p>High-capacity dustbins</p></div><div className="round-icon orange"><Bell size={17}/></div></div>{alerts.length ? <div className="attention-list">{alerts.slice(0,4).map(a => <div className="attention-item" key={a.id}><div className="attention-dot"/><div><b>{a.bin_name}</b><span>{a.location}</span></div><strong>{a.fill_level}%</strong></div>)}</div> : <div className="all-clear"><CheckCircle2 size={24}/><b>Everything looks good</b><span>No bins need immediate attention.</span></div>}<button className="wide-link" onClick={() => setPage('Alerts')}>Open alert centre <ChevronRight size={15}/></button></div></div><div className="panel collection-panel"><div className="panel-head"><div><h3>Recent collection activity</h3><p>Latest scheduled waste pickups</p></div><button className="text-btn" onClick={() => setPage('Collections')}>Manage schedule <ChevronRight size={15}/></button></div><CollectionTable collections={collections.slice(0,4)}/></div></section>
}

function BinCard({ bin, onEdit, onDelete }) {
  const status = statusFor(bin.fill_level)
  return <div className="bin-card"><div className="bin-card-top"><div className="bin-illustration"><Trash2 size={22}/></div><StatusPill status={status}/></div><div className="bin-title"><h3>{bin.name}</h3><span><MapPin size={13}/> {bin.location}</span></div><div className="fill-info"><span>Current fill level</span><b>{bin.fill_level}%</b></div><div className="progress-track large"><i className={bin.fill_level >= 80 ? 'danger' : bin.fill_level >= 60 ? 'warning' : ''} style={{width:`${bin.fill_level}%`}}/></div><div className="bin-card-foot"><span><Recycle size={13}/> {bin.waste_type} waste</span><div><button className="small-icon" onClick={onEdit} title="Edit"><Pencil size={15}/></button><button className="small-icon delete" onClick={onDelete} title="Delete"><Trash size={15}/></button></div></div></div>
}
function StatusPill({ status }) { return <span className={`status-pill ${status.toLowerCase().replace(' ','-')}`}>{status}</span> }
function CollectionTable({ collections, onChange }) {
  if (!collections.length) return <Empty text="No collection requests yet."/>
  return <div className="table-wrap"><table><thead><tr><th>Dustbin</th><th>Location</th><th>Scheduled date</th><th>Status</th>{onChange && <th>Update</th>}</tr></thead><tbody>{collections.map(c => <tr key={c.id}><td><b>{c.bin_name}</b></td><td>{c.location}</td><td>{c.scheduled_date}</td><td><span className={`collection-status ${c.status.toLowerCase().replace(' ','-')}`}>{c.status}</span></td>{onChange && <td><select className="status-select" value={c.status} onChange={e => onChange(c.id,e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select></td>}</tr>)}</tbody></table></div>
}
function Analytics({ dashboard, records }) {
  const data = dashboard?.waste_by_category || []
  const total = data.reduce((s,x) => s + Number(x.total || 0), 0) || 1
  const colors = ['#4d9a72','#e3a34f','#7195d2','#9b83c9','#6eb8ad']
  return <section><div className="section-head"><div><div className="eyebrow">INSIGHTS & REPORTING</div><h2>Waste analytics</h2><p>Understand waste generation by category.</p></div></div><div className="analytics-grid"><div className="panel"><div className="panel-head"><div><h3>Waste by category</h3><p>Total recorded weight: {dashboard?.total_waste_kg || 0} kg</p></div><div className="round-icon green"><Recycle size={18}/></div></div><div className="donut-wrap"><div className="donut" style={{background:`conic-gradient(${data.map((d,i) => `${colors[i%colors.length]} 0 ${(Number(d.total)/total)*100}%`).join(', ')})`}}><div><b>{dashboard?.total_waste_kg || 0}</b><span>KG TOTAL</span></div></div><div className="legend">{data.map((d,i) => <div key={d.category}><i style={{background:colors[i%colors.length]}}/><span>{d.category}</span><b>{Number(d.total).toFixed(1)} kg</b></div>)}</div></div></div><div className="panel"><div className="panel-head"><div><h3>Collection performance</h3><p>Current request status</p></div><div className="round-icon blue"><PackageCheck size={18}/></div></div><div className="performance-number">{collectionsCount(records, 'unused')}</div><p className="muted">Waste entries recorded in the system</p><div className="performance-note"><CheckCircle2 size={16}/> Keep recording collections to build useful trends.</div></div></div><div className="table-card"><div className="table-title"><div><h3>Recent waste records</h3><p>Sample weights grouped by recorded category.</p></div></div><div className="table-wrap"><table><thead><tr><th>Category</th><th>Weight</th><th>Recorded date</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td><b>{r.category}</b></td><td>{Number(r.weight_kg).toFixed(1)} kg</td><td>{r.recorded_date}</td></tr>)}</tbody></table></div></div></section>
}
function collectionsCount(records) { return records.length }
function Empty({ text }) { return <div className="empty"><Recycle size={24}/><span>{text}</span></div> }


function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@ecotrack.com')
  const [password, setPassword] = useState('EcoTrack@123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (email.trim().toLowerCase() === 'admin@ecotrack.com' && password === 'EcoTrack@123') {
      setError('')
      onLogin()
    } else {
      setError('The email or password is incorrect. Try the demo credentials shown below.')
    }
  }

  return <main className="login-page">
    <div className="login-decoration login-decoration-one"/><div className="login-decoration login-decoration-two"/>
    <div className="login-top-brand"><div className="login-brand-mark"><Leaf size={24}/></div><div><b>EcoTrack</b><span>SMART WASTE MANAGEMENT</span></div></div>
    <section className="login-card">
      <div className="login-card-heading"><div className="login-icon"><Leaf size={21}/></div><div className="login-kicker">WELCOME BACK</div><h1>Sign in to EcoTrack</h1><p>Manage your campus waste operations in one place.</p></div>
      <form className="login-form" onSubmit={submit}>
        <label htmlFor="login-email">Email address</label><div className="login-input-wrap"><span className="login-input-icon">@</span><input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ecotrack.com"/></div>
        <label htmlFor="login-password">Password</label><div className="login-input-wrap"><span className="login-input-icon"><span className="lock-symbol">⌑</span></span><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
        {error && <div className="login-error">{error}</div>}
        <button className="login-submit" type="submit">Sign in <ChevronRight size={18}/></button>
      </form>
      <div className="login-demo"><div className="demo-dot"/><div><b>Demo administrator access</b><span>admin@ecotrack.com</span><span>EcoTrack@123</span></div><button type="button" onClick={() => { setEmail('admin@ecotrack.com'); setPassword('EcoTrack@123'); setError('') }}>Use demo</button></div>
      <div className="login-security"><span><CheckCircle2 size={14}/> Authorized dashboard access</span><span>Protected demo session</span></div>
    </section>
    <footer className="login-footer">© 2026 EcoTrack <span>Building cleaner, greener campuses.</span></footer>
  </main>
}
