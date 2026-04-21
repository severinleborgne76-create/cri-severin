import React, { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const DEFAULT_MANDANTS = [
  { id: 'zalmhuys', nom: 'Zalmhuys', frais: 0.04, surgeles: 0.03, autres: 0.025 },
  { id: 'fayet', nom: 'Fayet', frais: 0.05, surgeles: 0.04, autres: 0.03 },
  { id: 'stratos', nom: 'Stratos', frais: 0.06, surgeles: 0.05, autres: 0.04 },
]

const PRODUITS = ['Produit Frais', 'Produit Surgelés', 'Autres']
const STATUTS_CLIENT = ['Prospect', 'Actif', 'Inactif']
const STATUTS_PAIEMENT = ['Non payé', 'En attente', 'Payé']
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function euro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n || 0))
}
function euro2(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0))
}
function pct(n) {
  return `${(Number(n || 0) * 100).toFixed(1)} %`
}
function calcIK(km) {
  km = Number(km || 0)
  if (km <= 5000) return km * 0.636
  if (km <= 20000) return km * 0.359 + 1388
  return km * 0.427
}
function commissionFor(mandant, produit, montant) {
  const m = mandant || {}
  const key = produit === 'Produit Frais' ? 'frais' : produit === 'Produit Surgelés' ? 'surgeles' : 'autres'
  return Number(montant || 0) * Number(m[key] || 0)
}

function useCollection(path, field = 'date') {
  const [items, setItems] = useState([])
  useEffect(() => {
    const q = query(collection(db, path), orderBy(field, 'desc'))
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [path, field])
  return items
}

function useMandants() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const q = query(collection(db, 'mandants'), orderBy('nom', 'asc'))
    const unsub = onSnapshot(q, async snap => {
      if (snap.empty) {
        await Promise.all(DEFAULT_MANDANTS.map(m => setDoc(doc(db, 'mandants', m.id), m)))
      }
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])
  return items
}

function Card({ title, value, sub }) {
  return (
    <div className="card stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div className="card section-card">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Input({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function App() {
  const ventes = useCollection('ventes')
  const clients = useCollection('clients', 'nom')
  const kms = useCollection('kms')
  const mandants = useMandants()
  const [tab, setTab] = useState('dashboard')

  const stats = useMemo(() => {
    const ca = ventes.reduce((s, v) => s + Number(v.montant || 0), 0)
    const commission = ventes.reduce((s, v) => {
      const m = mandants.find(x => x.nom === v.mandant)
      return s + commissionFor(m, v.produit, v.montant)
    }, 0)
    const km = kms.reduce((s, k) => s + Number(k.km || 0), 0)
    return { ca, commission, km, ik: calcIK(km) }
  }, [ventes, kms, mandants])

  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ month: MONTHS[i], ca: 0 }))
    ventes.forEach(v => {
      if (!v.date) return
      const d = new Date(v.date)
      if (!Number.isNaN(d.getTime())) arr[d.getMonth()].ca += Number(v.montant || 0)
    })
    const max = Math.max(1, ...arr.map(x => x.ca))
    return { arr, max }
  }, [ventes])

  return (
    <div className="app-shell">
      <aside className="sidebar card">
        <div className="brand">
          <div className="brand-mark">◈</div>
          <div>
            <div className="brand-title">CRM Séverin</div>
            <div className="brand-sub">Apple Premium</div>
          </div>
        </div>
        <nav className="nav">
          {[
            ['dashboard', 'Tableau de bord'],
            ['clients', 'Clients'],
            ['ventes', 'Ventes'],
            ['kms', 'Déplacements'],
            ['mandants', 'Mandants'],
          ].map(([id, label]) => (
            <button key={id} className={tab === id ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {clients.length} clients · {ventes.length} ventes · {kms.length} trajets
        </div>
      </aside>

      <main className="content">
        <div className="hero card">
          <div>
            <div className="eyebrow">Synchronisé Mac + iPad</div>
            <h1>Ton CRM commercial</h1>
            <p>Toutes les données sont centralisées dans Firebase. Une modification faite sur un appareil remonte automatiquement sur l’autre.</p>
          </div>
          <div className="pill">Cloud actif</div>
        </div>

        {tab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <Card title="CA total" value={euro(stats.ca)} sub="Toutes ventes confondues" />
              <Card title="Commissions" value={euro2(stats.commission)} sub="Calculées selon les taux mandants" />
              <Card title="Kilomètres" value={`${stats.km.toLocaleString('fr-FR')} km`} sub="Déplacements saisis" />
              <Card title="IK estimées" value={euro2(stats.ik)} sub="Base barème simplifié" />
            </div>
            <Section title="CA mensuel">
              <div className="bars">
                {monthly.arr.map(item => (
                  <div key={item.month} className="bar-col">
                    <div className="bar-wrap">
                      <div className="bar" style={{ height: `${(item.ca / monthly.max) * 180}px` }} />
                    </div>
                    <div className="bar-label">{item.month}</div>
                    <div className="bar-value">{item.ca ? euro(item.ca) : '—'}</div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'clients' && <ClientsSection clients={clients} mandants={mandants} />}
        {tab === 'ventes' && <VentesSection ventes={ventes} clients={clients} mandants={mandants} />}
        {tab === 'kms' && <KmsSection kms={kms} clients={clients} mandants={mandants} />}
        {tab === 'mandants' && <MandantsSection mandants={mandants} />}
      </main>
    </div>
  )
}

function ClientsSection({ clients, mandants }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nom: '', contact: '', ville: '', tel: '', mandant: mandants[0]?.nom || '', statut: 'Prospect' })

  useEffect(() => {
    if (!form.mandant && mandants[0]?.nom) setForm(f => ({ ...f, mandant: mandants[0].nom }))
  }, [mandants])

  async function save() {
    if (!form.nom?.trim()) return
    await addDoc(collection(db, 'clients'), form)
    setOpen(false)
    setForm({ nom: '', contact: '', ville: '', tel: '', mandant: mandants[0]?.nom || '', statut: 'Prospect' })
  }

  return (
    <Section title="Clients & prospects" action={<button className="primary-btn" onClick={() => setOpen(true)}>+ Nouveau client</button>}>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>Mandant</th><th>Statut</th><th>Ville</th><th>Téléphone</th><th></th></tr></thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.nom}</td><td>{c.mandant || '—'}</td><td>{c.statut || '—'}</td><td>{c.ville || '—'}</td><td>{c.tel || '—'}</td>
                <td><button className="link-btn" onClick={() => deleteDoc(doc(db, 'clients', c.id))}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau client">
        <div className="form-grid">
          <Input label="Nom"><input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></Input>
          <Input label="Contact"><input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></Input>
          <Input label="Ville"><input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} /></Input>
          <Input label="Téléphone"><input value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} /></Input>
          <Input label="Mandant"><select value={form.mandant} onChange={e => setForm({ ...form, mandant: e.target.value })}>{mandants.map(m => <option key={m.id}>{m.nom}</option>)}</select></Input>
          <Input label="Statut"><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>{STATUTS_CLIENT.map(s => <option key={s}>{s}</option>)}</select></Input>
        </div>
        <div className="modal-actions"><button className="secondary-btn" onClick={() => setOpen(false)}>Annuler</button><button className="primary-btn" onClick={save}>Enregistrer</button></div>
      </Modal>
    </Section>
  )
}

function VentesSection({ ventes, clients, mandants }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), mandant: mandants[0]?.nom || '', client: '', produit: PRODUITS[0], montant: '', statut: 'Non payé' })
  const selectedMandant = mandants.find(m => m.nom === form.mandant)

  useEffect(() => {
    if (!form.mandant && mandants[0]?.nom) setForm(f => ({ ...f, mandant: mandants[0].nom }))
  }, [mandants])

  const filteredClients = clients.filter(c => !form.mandant || c.mandant === form.mandant)

  async function save() {
    if (!form.date || !form.mandant || !form.montant) return
    await addDoc(collection(db, 'ventes'), { ...form, montant: Number(form.montant) })
    setOpen(false)
  }

  return (
    <Section title="Ventes" action={<button className="primary-btn" onClick={() => setOpen(true)}>+ Nouvelle vente</button>}>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Mandant</th><th>Client</th><th>Produit</th><th>Montant</th><th>Commission</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {ventes.map(v => {
              const m = mandants.find(x => x.nom === v.mandant)
              return (
                <tr key={v.id}>
                  <td>{v.date}</td><td>{v.mandant}</td><td>{v.client || '—'}</td><td>{v.produit}</td><td>{euro(v.montant)}</td><td>{euro2(commissionFor(m, v.produit, v.montant))}</td><td>{v.statut}</td>
                  <td><button className="link-btn" onClick={() => deleteDoc(doc(db, 'ventes', v.id))}>Supprimer</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle vente">
        <div className="form-grid">
          <Input label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Input>
          <Input label="Mandant"><select value={form.mandant} onChange={e => setForm({ ...form, mandant: e.target.value, client: '' })}>{mandants.map(m => <option key={m.id}>{m.nom}</option>)}</select></Input>
          <Input label="Client"><select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}><option value="">—</option>{filteredClients.map(c => <option key={c.id}>{c.nom}</option>)}</select></Input>
          <Input label="Produit"><select value={form.produit} onChange={e => setForm({ ...form, produit: e.target.value })}>{PRODUITS.map(p => <option key={p}>{p}</option>)}</select></Input>
          <Input label="Montant HT"><input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} /></Input>
          <Input label="Statut paiement"><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>{STATUTS_PAIEMENT.map(s => <option key={s}>{s}</option>)}</select></Input>
        </div>
        <div className="inline-info">Commission estimée : <strong>{euro2(commissionFor(selectedMandant, form.produit, form.montant))}</strong> · Taux : <strong>{selectedMandant ? pct(selectedMandant[form.produit === 'Produit Frais' ? 'frais' : form.produit === 'Produit Surgelés' ? 'surgeles' : 'autres']) : '—'}</strong></div>
        <div className="modal-actions"><button className="secondary-btn" onClick={() => setOpen(false)}>Annuler</button><button className="primary-btn" onClick={save}>Enregistrer</button></div>
      </Modal>
    </Section>
  )
}

function KmsSection({ kms, clients, mandants }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), mandant: mandants[0]?.nom || '', client: '', depart: 'Bureau', arrivee: '', km: '' })

  useEffect(() => {
    if (!form.mandant && mandants[0]?.nom) setForm(f => ({ ...f, mandant: mandants[0].nom }))
  }, [mandants])

  const filteredClients = clients.filter(c => !form.mandant || c.mandant === form.mandant)

  async function save() {
    if (!form.date || !form.km) return
    await addDoc(collection(db, 'kms'), { ...form, km: Number(form.km) })
    setOpen(false)
  }

  return (
    <Section title="Déplacements & IK" action={<button className="primary-btn" onClick={() => setOpen(true)}>+ Nouveau trajet</button>}>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Mandant</th><th>Client</th><th>Départ</th><th>Arrivée</th><th>Km</th><th>IK</th><th></th></tr></thead>
          <tbody>
            {kms.map(k => (
              <tr key={k.id}>
                <td>{k.date}</td><td>{k.mandant || '—'}</td><td>{k.client || '—'}</td><td>{k.depart || '—'}</td><td>{k.arrivee || '—'}</td><td>{Number(k.km || 0).toLocaleString('fr-FR')}</td><td>{euro2(calcIK(k.km))}</td>
                <td><button className="link-btn" onClick={() => deleteDoc(doc(db, 'kms', k.id))}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau déplacement">
        <div className="form-grid">
          <Input label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Input>
          <Input label="Mandant"><select value={form.mandant} onChange={e => setForm({ ...form, mandant: e.target.value, client: '' })}>{mandants.map(m => <option key={m.id}>{m.nom}</option>)}</select></Input>
          <Input label="Client"><select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}><option value="">—</option>{filteredClients.map(c => <option key={c.id}>{c.nom}</option>)}</select></Input>
          <Input label="Départ"><input value={form.depart} onChange={e => setForm({ ...form, depart: e.target.value })} /></Input>
          <Input label="Arrivée"><input value={form.arrivee} onChange={e => setForm({ ...form, arrivee: e.target.value })} /></Input>
          <Input label="Kilomètres"><input type="number" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} /></Input>
        </div>
        <div className="inline-info">IK estimées : <strong>{euro2(calcIK(form.km))}</strong></div>
        <div className="modal-actions"><button className="secondary-btn" onClick={() => setOpen(false)}>Annuler</button><button className="primary-btn" onClick={save}>Enregistrer</button></div>
      </Modal>
    </Section>
  )
}

function MandantsSection({ mandants }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nom: '', frais: 0.05, surgeles: 0.04, autres: 0.03 })

  async function save() {
    const id = form.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await setDoc(doc(db, 'mandants', id), form)
    setOpen(false)
    setForm({ nom: '', frais: 0.05, surgeles: 0.04, autres: 0.03 })
  }

  return (
    <Section title="Mandants & taux" action={<button className="primary-btn" onClick={() => setOpen(true)}>+ Nouveau mandant</button>}>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Mandant</th><th>Frais</th><th>Surgelés</th><th>Autres</th><th></th></tr></thead>
          <tbody>
            {mandants.map(m => (
              <tr key={m.id}>
                <td>{m.nom}</td><td>{pct(m.frais)}</td><td>{pct(m.surgeles)}</td><td>{pct(m.autres)}</td>
                <td><button className="link-btn" onClick={() => deleteDoc(doc(db, 'mandants', m.id))}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau mandant">
        <div className="form-grid">
          <Input label="Nom"><input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></Input>
          <Input label="Taux frais"><input type="number" step="0.001" value={form.frais} onChange={e => setForm({ ...form, frais: Number(e.target.value) })} /></Input>
          <Input label="Taux surgelés"><input type="number" step="0.001" value={form.surgeles} onChange={e => setForm({ ...form, surgeles: Number(e.target.value) })} /></Input>
          <Input label="Taux autres"><input type="number" step="0.001" value={form.autres} onChange={e => setForm({ ...form, autres: Number(e.target.value) })} /></Input>
        </div>
        <div className="modal-actions"><button className="secondary-btn" onClick={() => setOpen(false)}>Annuler</button><button className="primary-btn" onClick={save}>Enregistrer</button></div>
      </Modal>
    </Section>
  )
}
