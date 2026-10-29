import React, { useEffect, useMemo, useState } from 'react';
import Login from './components/Login';
import Dashboard from './modules/Dashboard/Dashboard';
import SuperAdminPage from './modules/SuperAdmin/SuperAdminPage';
import LeadsPage from './modules/Leads/LeadsPage';
import FollowUpsPage from './modules/FollowUps/FollowUpsPage';
import CustomersPage from './modules/Customers/CustomersPage';
import PropertiesPage from './modules/Properties/PropertiesPage';
import ProjectsPage from './modules/Projects/ProjectsPage';
import SiteVisitsPage from './modules/SiteVisits/SiteVisitsPage';
import BookingsPage from './modules/Bookings/BookingsPage';
import PaymentsPage from './modules/Payments/PaymentsPage';
import EmployeesPage from './modules/Employees/EmployeesPage';
import AttendancePage from './modules/Attendance/AttendancePage';
import PayrollPage from './modules/Payroll/PayrollPage';
import ReportsPage from './modules/Reports/ReportsPage';
import SettingsPage from './modules/Settings/SettingsPage';
import { PageTitle, Field, Modal, Status, Empty } from './components/common';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestoreCollection, useCompanies, useCompanyDocument, useFirestoreSettings } from './firebaseData';

const NAV = [
  { group: 'WORKSPACE', items: [['Dashboard','▦'],['Leads','♧'],['Follow-ups','◷'],['Customers','♙'],['Properties','⌂'],['Projects','▤'],['Site Visits','⌖'],['Bookings','✓'],['Payments','₹']] },
  { group: 'PEOPLE', items: [['Employees','♧'],['Attendance','◷'],['Payroll','₹']] },
  { group: 'INSIGHTS', items: [['Reports','▥'],['Settings','⚙']] },
];
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

function uid(prefix='ID') { return `${prefix}-${Math.random().toString(36).slice(2,6).toUpperCase()}${Date.now().toString().slice(-4)}`; }

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const companies = useCompanies(session?.role === 'superadmin');
  const tenantId = activeCompanyId || session?.companyId || null;
  const ownerDataTenantId = (session?.role === 'owner' || Boolean(activeCompanyId)) ? tenantId : null;
  const companyDoc = useCompanyDocument(tenantId);
  const [page, setPage] = useState('Dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const employeeContext = session?.role === 'employee' ? { uid:session.uid, name:session.name } : null;
  const [leads, setLeads] = useFirestoreCollection(tenantId, 'leads', employeeContext);
  const [employees, setEmployees] = useFirestoreCollection(ownerDataTenantId, 'employees');
  const [attendance, setAttendance] = useFirestoreCollection(tenantId, 'attendance', employeeContext);
  const [payroll, setPayroll] = useFirestoreCollection(ownerDataTenantId, 'payroll');
  const [properties, setProperties] = useFirestoreCollection(tenantId, 'properties');
  const [companyForm, setCompanyForm] = useState({ name:'Rihaos Realtor', plan:'Growth', users:5, color:'#55b9ee' });
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name:'', phone:'', email:'', source:'Website', budget:'', location:'', type:'2 BHK', status:'New', assigned:'', next:'Today', notes:'' });
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name:'', email:'', role:'Sales Executive', phone:'', salary:'', status:'Active' });
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [propertyForm, setPropertyForm] = useState({ name:'', location:'', type:'Apartment', price:'', status:'Available' });
  const [settings, setSettings] = useFirestoreSettings(tenantId, { companyName:'Rihaos Realtor', brandColor:'#55b9ee', currency:'INR', timezone:'Asia/Kolkata' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) { setSession(null); setAuthLoading(false); return; }
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (!profileSnap.exists()) {
          setAuthMessage('Login ho gaya, lekin Firestore users/' + user.uid + ' profile nahi mili. Setup guide ke mutabik role profile banayein.');
          await signOut(auth);
          setSession(null);
        } else {
          const profile = profileSnap.data();
          if (!['superadmin','owner','employee'].includes(profile.role)) throw new Error('User profile role must be superadmin, owner, or employee.');
          if (profile.role !== 'superadmin' && !profile.companyId) throw new Error('Owner/Employee profile mein exact companyId missing hai.');
          setSession({ uid:user.uid, email:user.email || profile.email || '', name:profile.name || user.displayName || user.email || 'User', role:profile.role, companyId:profile.companyId || null, companyName:profile.companyName || '' });
          setAuthMessage('');
          setPage(profile.role === 'superadmin' ? 'Companies' : 'Dashboard');
        }
      } catch (error) {
        setAuthMessage(error.message || 'Login profile load nahi hua.');
        await signOut(auth).catch(()=>{});
      } finally { setAuthLoading(false); }
    });
    return unsubscribe;
  }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t); } }, [toast]);

  async function login(role, email, password) {
    setActiveCompanyId(null);
    setAuthMessage('');
    if (!email || !password) { setAuthMessage('Email aur password dono bharein.'); return; }
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));
      if (!profileSnap.exists()) {
        await signOut(auth);
        throw new Error('Firebase account ka users/{UID} profile nahi mila. Setup guide mein diye gaye profile fields add karein.');
      }
      const profile = profileSnap.data();
      if (profile.role !== role) {
        await signOut(auth);
        throw new Error('Is email ka role ' + (profile.role || 'set nahi') + ' hai. Login par wahi tab select karein.');
      }
      if (role !== 'superadmin' && !profile.companyId) {
        await signOut(auth);
        throw new Error('Owner/Employee ke users profile mein companyId missing hai.');
      }
    } catch (error) {
      setAuthMessage(error.code === 'auth/invalid-credential' ? 'Email ya password galat hai.' : error.code === 'auth/operation-not-allowed' ? 'Firebase Console > Authentication > Sign-in method mein Email/Password enable karein.' : error.message || 'Login nahi ho paya.');
    }
  }
  async function logout() {
    setActiveCompanyId(null);
    await signOut(auth);
    setSession(null);
    setPage('Dashboard');
  }
  const company = activeCompanyId ? companyDoc : session?.role === 'superadmin' ? (companies[0] || null) : companyDoc;
  const visibleEmployees = session?.role === 'employee' ? [{ id:session.uid, name:session.name, role:'Employee', status:'Active' }] : employees;
  const isSuper = session?.role === 'superadmin' && !activeCompanyId;
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayAttendance = attendance.filter(a => a.date === todayKey);
  const openLeads = leads.filter(l => !['Won','Lost'].includes(l.status));
  const overdue = leads.filter(l => ['Today','Overdue'].includes(l.next) && !['Won','Lost'].includes(l.status));
  const filteredLeads = useMemo(() => leads.filter(l => `${l.name} ${l.phone} ${l.location} ${l.id} ${l.assigned}`.toLowerCase().includes(search.toLowerCase())), [leads, search]);

  function addLead(e) { e.preventDefault(); const lead = { ...leadForm, id:uid('LD'), budget:Number(leadForm.budget || 0), assigned:leadForm.assigned || (session.role === 'employee' ? session.name : employees[0]?.name) || 'Unassigned', createdBy:session.uid }; setLeads(prev => [lead, ...prev]); setLeadForm({ name:'', phone:'', email:'', source:'Website', budget:'', location:'', type:'2 BHK', status:'New', assigned:'', next:'Today', notes:'' }); setLeadFormOpen(false); setToast('Lead created successfully'); }
  function updateLead(id, changes) { setLeads(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l)); setToast('Lead updated'); }
  function addEmployee(e) { e.preventDefault(); setEmployees(prev => [...prev, { ...employeeForm, id:uid('EMP'), salary:Number(employeeForm.salary || 0) }]); setEmployeeForm({ name:'', email:'', role:'Sales Executive', phone:'', salary:'', status:'Active' }); setEmployeeFormOpen(false); setToast('Employee added'); }
  function addProperty(e) { e.preventDefault(); setProperties(prev => [...prev, { ...propertyForm, id:uid('PR'), price:Number(propertyForm.price || 0) }]); setPropertyForm({ name:'', location:'', type:'Apartment', price:'', status:'Available' }); setPropertyFormOpen(false); setToast('Property added'); }
  function checkIn() { if (attendance.some(a => a.date === todayKey && a.employeeId === session.uid)) { setToast('Aaj ka check-in already recorded hai'); return; } setAttendance(prev => [{ id:uid('ATT'), employeeId:session.uid, name:session.name, date:todayKey, checkIn:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}), checkOut:'', status:'Present' }, ...prev]); setToast('Check-in recorded'); }
  function checkOut() { const key = session.uid; const record = attendance.find(a => a.date === todayKey && a.employeeId === key && !a.checkOut); if (!record) { setToast('Pehle check-in karein'); return; } setAttendance(prev => prev.map(a => a.id === record.id ? { ...a, checkOut:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) } : a)); setToast('Check-out recorded'); }
  function createPayroll() { const month = new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'}); const next = employees.map(e => ({ id:uid('PAY'), employeeId:e.id, employee:e.name, month, base:Number(e.salary||0), incentive:0, deductions:0, status:'Draft' })); setPayroll(prev => [...next, ...prev]); setToast('Payroll drafts created for active employees'); }
  async function addCompany(e) {
    e.preventDefault();
    const name = companyForm.name.trim();
    if (!name) return;
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Date.now().toString().slice(-5)}`;
    const c = { ...companyForm, name, short:name.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(), status:'Active', users:Number(companyForm.users), createdAt:new Date().toISOString() };
    try {
      await setDoc(doc(db, 'companies', id), c);
      setCompanyForm({ name:'', plan:'Growth', users:5, color:'#55b9ee' });
      setToast('Company Firebase mein create ho gayi. Owner account ka users profile ab banayein.');
    } catch (error) { setToast('Company save nahi hui: ' + error.message); }
  }

  if (!session) return <Login onLogin={login} authMessage={authMessage} authLoading={authLoading} />;

  return <div className={`shell ${collapsed?'collapsed':''} ${mobileNav?'nav-open':''}`} style={{'--brand':company?.color || '#55b9ee'}}>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className="sidebar">
      <div className="brand"><div className="brand-logo">N<span>+</span></div><div className="brand-text"><strong>NISS TECHNOLOGY<span>.</span></strong><small>RIHAOS REALTOR CRM</small></div><button className="collapse-btn" onClick={() => setCollapsed(v=>!v)} title="Collapse sidebar">‹</button></div>
      {isSuper ? <><div className="side-caption">PLATFORM</div><button className={`nav-item ${page==='Companies'?'active':''}`} onClick={()=>{setPage('Companies');setMobileNav(false)}}><span className="nav-icon">▦</span><span>Companies</span></button><button className={`nav-item ${page==='Platform Overview'?'active':''}`} onClick={()=>{setPage('Platform Overview');setMobileNav(false)}}><span className="nav-icon">◈</span><span>Platform overview</span></button><button className={`nav-item ${page==='Subscriptions'?'active':''}`} onClick={()=>{setPage('Subscriptions');setMobileNav(false)}}><span className="nav-icon">₹</span><span>Subscriptions</span></button></> : <>
        <div className="company-switch"><div className="company-avatar">{company?.short || 'RR'}</div><div className="company-meta"><b>{settings.companyName || company?.name}</b><small>{company?.plan || 'Growth'} plan</small></div><span>⌄</span></div>
        {NAV.map(group => <div key={group.group}><div className="side-caption">{group.group}</div>{group.items.filter(([label]) => activeCompanyId || session.role === 'owner' || session.role === 'superadmin' || !['Payments','Employees','Payroll','Reports','Settings'].includes(label)).map(([label, icon]) => <button key={label} className={`nav-item ${page===label?'active':''}`} onClick={() => {setPage(label);setMobileNav(false)}}><span className="nav-icon">{icon}</span><span>{label}</span>{label==='Leads' && <em>{openLeads.length}</em>}</button>)}</div>)}
      </>}
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon">✦</div><b>{isSuper?'Platform controls':'Make work flow.'}</b><p>{isSuper?'Manage client workspaces in one place.':'Your team workspace is ready to grow.'}</p><button onClick={()=>{setPage(isSuper?'Subscriptions':'Settings');setMobileNav(false)}}>{isSuper?'View plans':'Workspace settings'} <span>↗</span></button></div><div className="sidebar-user"><div className="avatar">{session.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div className="user-meta"><b>{session.name}</b><small>{session.role==='superadmin'?'Super Admin':session.role==='owner'?'Workspace Owner':'Sales Employee'}</small></div><button className="more-btn" onClick={logout} title="Sign out">↗</button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(v=>!v)}>☰</button><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{page}</strong></div>{activeCompanyId && <button className="btn secondary" onClick={()=>{setActiveCompanyId(null);setPage("Companies")}}>← Back to Platform</button>}<div className="top-actions"><label className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="icon-button" title="Notifications" onClick={()=>setToast('You are all caught up')}>♧<i/></button><div className="top-avatar">{session.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div></div></header>
      <div className="content">
        {isSuper ? <SuperAdminPage page={page} companies={companies} setPage={setPage} companyForm={companyForm} setCompanyForm={setCompanyForm} addCompany={addCompany} onOpenCompany={(c)=>{setActiveCompanyId(c.id);setPage('Dashboard');setToast(`Workspace preview: ${c.name}`)}}/> : <>
          {page==='Dashboard' && <Dashboard company={company} leads={leads} employees={visibleEmployees} attendance={todayAttendance} overdue={overdue} properties={properties} setPage={setPage} money={money} />}
          {page==='Leads' && <LeadsPage leads={filteredLeads} allLeads={leads} employees={employees} onAdd={()=>setLeadFormOpen(true)} onUpdate={updateLead} search={search} money={money} />}
          {page==='Follow-ups' && <FollowUpsPage leads={leads} updateLead={updateLead} />}
          {page==='Customers' && <CustomersPage leads={leads} />}
          {page==='Properties' && <PropertiesPage properties={properties} onAdd={session.role==='owner' || activeCompanyId ? ()=>setPropertyFormOpen(true) : null} money={money} />}
          {page==='Projects' && <ProjectsPage properties={properties} money={money} />}
          {page==='Site Visits' && <SiteVisitsPage leads={leads} />}
          {page==='Bookings' && <BookingsPage leads={leads} money={money} />}
          {page==='Payments' && <PaymentsPage payroll={payroll} money={money} />}
          {page==='Employees' && <EmployeesPage employees={employees} onAdd={()=>setEmployeeFormOpen(true)} money={money} />}
          {page==='Attendance' && <AttendancePage attendance={attendance} employees={visibleEmployees} checkIn={checkIn} checkOut={checkOut} todayKey={todayKey} role={session.role} userId={session.uid} />}
          {page==='Payroll' && <PayrollPage payroll={payroll} employees={employees} createPayroll={createPayroll} setPayroll={setPayroll} money={money} />}
          {page==='Reports' && <ReportsPage leads={leads} employees={employees} properties={properties} money={money} />}
          {page==='Settings' && <SettingsPage settings={settings} setSettings={setSettings} company={company} setToast={setToast} />}
        </>}
      </div>
      <footer className="footer"><span>NISS TECHNOLOGY <b>•</b> Rihaos Realtor CRM</span><span>Built by NISS Technology · <button onClick={()=>setToast('Firebase connected workspace')}>System status: Firebase</button></span></footer>
    </main>
    {leadFormOpen && <Modal title="Create new lead" onClose={()=>setLeadFormOpen(false)}><form className="form-grid" onSubmit={addLead}><Field label="Customer name" required><input required value={leadForm.name} onChange={e=>setLeadForm({...leadForm,name:e.target.value})} placeholder="e.g. Rahul Sharma"/></Field><Field label="Phone number" required><input required value={leadForm.phone} onChange={e=>setLeadForm({...leadForm,phone:e.target.value})} placeholder="Mobile number"/></Field><Field label="Email"><input type="email" value={leadForm.email} onChange={e=>setLeadForm({...leadForm,email:e.target.value})} placeholder="name@email.com"/></Field><Field label="Lead source"><select value={leadForm.source} onChange={e=>setLeadForm({...leadForm,source:e.target.value})}>{['Website','99acres','MagicBricks','Referral','Facebook','Instagram','Walk-in','WhatsApp','Other'].map(x=><option>{x}</option>)}</select></Field><Field label="Budget (₹)"><input type="number" value={leadForm.budget} onChange={e=>setLeadForm({...leadForm,budget:e.target.value})} placeholder="10000000"/></Field><Field label="Preferred location"><input value={leadForm.location} onChange={e=>setLeadForm({...leadForm,location:e.target.value})} placeholder="Sector / city"/></Field><Field label="Property preference"><select value={leadForm.type} onChange={e=>setLeadForm({...leadForm,type:e.target.value})}>{['1 BHK','2 BHK','3 BHK','4 BHK','Villa','Plot','Commercial','Office'].map(x=><option>{x}</option>)}</select></Field><Field label="Lead status"><select value={leadForm.status} onChange={e=>setLeadForm({...leadForm,status:e.target.value})}>{['New','Qualified','Hot','Site Visit','Negotiation','Won','Lost'].map(x=><option>{x}</option>)}</select></Field><Field label="Assign to"><select value={leadForm.assigned} onChange={e=>setLeadForm({...leadForm,assigned:e.target.value})}><option value="">Auto / Unassigned</option>{employees.map(x=><option>{x.name}</option>)}</select></Field><Field label="Next follow-up"><select value={leadForm.next} onChange={e=>setLeadForm({...leadForm,next:e.target.value})}>{['Today','Tomorrow','Oct 27','Oct 28','Next week','Not scheduled'].map(x=><option>{x}</option>)}</select></Field><Field label="Notes" wide><textarea value={leadForm.notes} onChange={e=>setLeadForm({...leadForm,notes:e.target.value})} placeholder="Customer requirements..."/></Field><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setLeadFormOpen(false)}>Cancel</button><button className="btn primary">Create lead</button></div></form></Modal>}
    {employeeFormOpen && <Modal title="Add team member" onClose={()=>setEmployeeFormOpen(false)}><form className="form-grid" onSubmit={addEmployee}><Field label="Full name" required><input required value={employeeForm.name} onChange={e=>setEmployeeForm({...employeeForm,name:e.target.value})}/></Field><Field label="Work email" required><input required type="email" value={employeeForm.email} onChange={e=>setEmployeeForm({...employeeForm,email:e.target.value})}/></Field><Field label="Role"><select value={employeeForm.role} onChange={e=>setEmployeeForm({...employeeForm,role:e.target.value})}>{['Sales Executive','Sales Manager','Property Consultant','HR','Accountant','Operations'].map(x=><option>{x}</option>)}</select></Field><Field label="Phone"><input value={employeeForm.phone} onChange={e=>setEmployeeForm({...employeeForm,phone:e.target.value})}/></Field><Field label="Monthly base salary (₹)"><input type="number" value={employeeForm.salary} onChange={e=>setEmployeeForm({...employeeForm,salary:e.target.value})}/></Field><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setEmployeeFormOpen(false)}>Cancel</button><button className="btn primary">Add employee</button></div></form></Modal>}
    {propertyFormOpen && <Modal title="Add property inventory" onClose={()=>setPropertyFormOpen(false)}><form className="form-grid" onSubmit={addProperty}><Field label="Property / project name" required><input required value={propertyForm.name} onChange={e=>setPropertyForm({...propertyForm,name:e.target.value})}/></Field><Field label="Location" required><input required value={propertyForm.location} onChange={e=>setPropertyForm({...propertyForm,location:e.target.value})}/></Field><Field label="Type"><select value={propertyForm.type} onChange={e=>setPropertyForm({...propertyForm,type:e.target.value})}>{['Apartment','Villa','Plot','Commercial','Office','Retail'].map(x=><option>{x}</option>)}</select></Field><Field label="Price (₹)"><input type="number" value={propertyForm.price} onChange={e=>setPropertyForm({...propertyForm,price:e.target.value})}/></Field><Field label="Availability"><select value={propertyForm.status} onChange={e=>setPropertyForm({...propertyForm,status:e.target.value})}>{['Available','On Hold','Sold','Unavailable'].map(x=><option>{x}</option>)}</select></Field><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setPropertyFormOpen(false)}>Cancel</button><button className="btn primary">Add property</button></div></form></Modal>}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;
}

