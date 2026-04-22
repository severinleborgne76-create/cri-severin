import { useMemo, useState } from "react";

const initialMandants = [
  {
    id: "zalmhuys",
    nom: "Zalmhuys",
    commissionParDefaut: 3,
    produits: [
      { id: "z1", nom: "Saumon frais filet", categorie: "Produit Frais", commission: 3 },
      { id: "z2", nom: "Saumon surgelé", categorie: "Produit Surgelés", commission: 4 },
      { id: "z3", nom: "Portion saumon", categorie: "Autres", commission: 3 },
    ],
  },
  {
    id: "fayet",
    nom: "Fayet",
    commissionParDefaut: 3,
    produits: [
      { id: "f1", nom: "Cabillaud Islande", categorie: "Produit Frais", commission: 3 },
      { id: "f2", nom: "Lieu noir", categorie: "Produit Frais", commission: 3 },
      { id: "f3", nom: "Poissons divers arrivage", categorie: "Autres", commission: 3 },
    ],
  },
  {
    id: "fumoir",
    nom: "Le Fumoir",
    commissionParDefaut: 4,
    produits: [
      { id: "lf1", nom: "Saumon fumé premium", categorie: "Autres", commission: 4 },
    ],
  },
  {
    id: "stratos",
    nom: "Stratos",
    commissionParDefaut: 4,
    produits: [
      { id: "s1", nom: "Bar Grèce", categorie: "Produit Frais", commission: 4 },
      { id: "s2", nom: "Daurade Grèce", categorie: "Produit Frais", commission: 4 },
    ],
  },
  {
    id: "dzm",
    nom: "DZM",
    commissionParDefaut: 3,
    produits: [
      { id: "d1", nom: "Couteaux frais", categorie: "Produit Frais", commission: 2 },
      { id: "d2", nom: "Couteaux surgelés", categorie: "Produit Surgelés", commission: 5 },
    ],
  },
];

const euro = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const euro2 = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

function App() {
  const [page, setPage] = useState("dashboard");
  const [mandants, setMandants] = useState(initialMandants);
  const [ventes, setVentes] = useState([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    mandantId: initialMandants[0].id,
    produitId: initialMandants[0].produits[0].id,
    client: "",
    montant: "",
    statut: "Prévision",
    commentaire: "",
  });

  const mandantActuel = useMemo(
    () => mandants.find((m) => m.id === form.mandantId),
    [mandants, form.mandantId]
  );

  const produitsActuels = mandantActuel?.produits || [];

  const produitActuel = useMemo(
    () => produitsActuels.find((p) => p.id === form.produitId),
    [produitsActuels, form.produitId]
  );

  const commissionCalculee = useMemo(() => {
    const taux = Number(produitActuel?.commission || 0);
    const montant = Number(form.montant || 0);
    return (montant * taux) / 100;
  }, [form.montant, produitActuel]);

  const saveVente = () => {
    if (!form.client.trim() || !form.montant || !produitActuel || !mandantActuel) {
      alert("Merci de remplir client, produit et montant.");
      return;
    }

    const nouvelleVente = {
      id: Date.now().toString(),
      date: form.date,
      mandantId: mandantActuel.id,
      mandantNom: mandantActuel.nom,
      produitId: produitActuel.id,
      produitNom: produitActuel.nom,
      categorie: produitActuel.categorie,
      client: form.client.trim(),
      montant: Number(form.montant),
      tauxCommission: Number(produitActuel.commission || 0),
      commission: commissionCalculee,
      statut: form.statut,
      commentaire: form.commentaire.trim(),
    };

    setVentes((prev) => [nouvelleVente, ...prev]);

    const premierProduit = mandantActuel.produits[0];
    setForm((prev) => ({
      ...prev,
      client: "",
      montant: "",
      commentaire: "",
      statut: "Prévision",
      produitId: premierProduit?.id || "",
    }));

    setPage("ventes");
  };

  const removeVente = (id) => {
    setVentes((prev) => prev.filter((v) => v.id !== id));
  };

  const updateMandantCommission = (mandantId, value) => {
    setMandants((prev) =>
      prev.map((m) =>
        m.id === mandantId ? { ...m, commissionParDefaut: Number(value || 0) } : m
      )
    );
  };

  const updateProduitCommission = (mandantId, produitId, value) => {
    setMandants((prev) =>
      prev.map((m) =>
        m.id !== mandantId
          ? m
          : {
              ...m,
              produits: m.produits.map((p) =>
                p.id === produitId ? { ...p, commission: Number(value || 0) } : p
              ),
            }
      )
    );
  };

  const totalCA = ventes.reduce((sum, v) => sum + Number(v.montant || 0), 0);
  const totalCommission = ventes.reduce((sum, v) => sum + Number(v.commission || 0), 0);

  const ventesPayees = ventes.filter((v) => v.statut === "Payé").length;
  const ventesPrevues = ventes.filter((v) => v.statut === "Prévision").length;

  const caParMandant = mandants
    .map((m) => {
      const ventesMandant = ventes.filter((v) => v.mandantId === m.id);
      return {
        nom: m.nom,
        ca: ventesMandant.reduce((sum, v) => sum + v.montant, 0),
        commission: ventesMandant.reduce((sum, v) => sum + v.commission, 0),
      };
    })
    .sort((a, b) => b.ca - a.ca);

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoBox}>
            <div style={styles.logoIcon}>◈</div>
            <div>
              <div style={styles.logoTitle}>CRM Séverin</div>
              <div style={styles.logoSub}>Apple Premium V3</div>
            </div>
          </div>

          <NavItem active={page === "dashboard"} onClick={() => setPage("dashboard")}>
            Tableau de bord
          </NavItem>
          <NavItem active={page === "ventes"} onClick={() => setPage("ventes")}>
            Ventes
          </NavItem>
          <NavItem active={page === "nouvelle"} onClick={() => setPage("nouvelle")}>
            Nouvelle vente
          </NavItem>
          <NavItem active={page === "mandants"} onClick={() => setPage("mandants")}>
            Mandants
          </NavItem>
        </div>

        <div style={styles.sidebarFooter}>
          {ventes.length} ventes · {mandants.length} mandants
        </div>
      </aside>

      <main style={styles.main}>
        {page === "dashboard" && (
          <>
            <Header
              title="Ton CRM commercial"
              subtitle="Suivi de ton activité, de tes commissions et de tes mandants."
            />

            <div style={styles.cardsGrid}>
              <StatCard title="CA total" value={euro(totalCA)} subtitle="Toutes ventes" />
              <StatCard
                title="Commissions"
                value={euro2(totalCommission)}
                subtitle="Calcul automatique"
              />
              <StatCard title="Ventes payées" value={ventesPayees} subtitle="Statut payé" />
              <StatCard title="Prévisions" value={ventesPrevues} subtitle="À confirmer" />
            </div>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>CA par mandant</h2>
              {caParMandant.map((item) => (
                <div key={item.nom} style={styles.rowBetween}>
                  <div>{item.nom}</div>
                  <div style={{ fontWeight: 700 }}>
                    {euro(item.ca)} · {euro2(item.commission)}
                  </div>
                </div>
              ))}
              {caParMandant.every((x) => x.ca === 0) && (
                <div style={styles.emptyText}>Aucune vente saisie pour le moment.</div>
              )}
            </section>
          </>
        )}

        {page === "nouvelle" && (
          <>
            <Header
              title="Nouvelle vente"
              subtitle="Choisis un mandant, puis le produit associé. La commission se calcule automatiquement."
            />

            <section style={styles.section}>
              <div style={styles.formGrid}>
                <Field label="Date">
                  <input
                    type="date"
                    style={styles.input}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </Field>

                <Field label="Mandant">
                  <select
                    style={styles.input}
                    value={form.mandantId}
                    onChange={(e) => {
                      const newMandantId = e.target.value;
                      const newMandant = mandants.find((m) => m.id === newMandantId);
                      setForm((f) => ({
                        ...f,
                        mandantId: newMandantId,
                        produitId: newMandant?.produits[0]?.id || "",
                      }));
                    }}
                  >
                    {mandants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Produit">
                  <select
                    style={styles.input}
                    value={form.produitId}
                    onChange={(e) => setForm((f) => ({ ...f, produitId: e.target.value }))}
                  >
                    {produitsActuels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Client">
                  <input
                    style={styles.input}
                    placeholder="Nom du client"
                    value={form.client}
                    onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                  />
                </Field>

                <Field label="Montant HT (€)">
                  <input
                    type="number"
                    style={styles.input}
                    placeholder="Ex. 12000"
                    value={form.montant}
                    onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                  />
                </Field>

                <Field label="Statut">
                  <select
                    style={styles.input}
                    value={form.statut}
                    onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}
                  >
                    <option>Prévision</option>
                    <option>En attente</option>
                    <option>Payé</option>
                  </select>
                </Field>
              </div>

              <Field label="Commentaire">
                <textarea
                  style={{ ...styles.input, minHeight: 90, resize: "vertical" }}
                  placeholder="Notes vente, conditions, remise, etc."
                  value={form.commentaire}
                  onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
                />
              </Field>

              <div style={styles.infoBox}>
                <div><strong>Produit :</strong> {produitActuel?.nom || "—"}</div>
                <div><strong>Catégorie :</strong> {produitActuel?.categorie || "—"}</div>
                <div><strong>Taux :</strong> {produitActuel?.commission || 0}%</div>
                <div><strong>Commission estimée :</strong> {euro2(commissionCalculee)}</div>
              </div>

              <button style={styles.primaryButton} onClick={saveVente}>
                Enregistrer la vente
              </button>
            </section>
          </>
        )}

        {page === "ventes" && (
          <>
            <Header
              title="Historique des ventes"
              subtitle="Toutes tes ventes saisies avec mandant, produit et commission."
              action={
                <button style={styles.primaryButton} onClick={() => setPage("nouvelle")}>
                  + Nouvelle vente
                </button>
              }
            />

            <section style={styles.section}>
              <div style={styles.tableHeader}>
                <span>Date</span>
                <span>Mandant</span>
                <span>Produit</span>
                <span>Client</span>
                <span>Montant</span>
                <span>Commission</span>
                <span>Statut</span>
                <span></span>
              </div>

              {ventes.map((v) => (
                <div key={v.id} style={styles.tableRow}>
                  <span>{v.date}</span>
                  <span>{v.mandantNom}</span>
                  <span>{v.produitNom}</span>
                  <span>{v.client}</span>
                  <span>{euro(v.montant)}</span>
                  <span>{euro2(v.commission)}</span>
                  <span>{v.statut}</span>
                  <button style={styles.deleteBtn} onClick={() => removeVente(v.id)}>
                    ✕
                  </button>
                </div>
              ))}

              {ventes.length === 0 && (
                <div style={styles.emptyText}>Aucune vente enregistrée pour le moment.</div>
              )}
            </section>
          </>
        )}

        {page === "mandants" && (
          <>
            <Header
              title="Mandants & commissions"
              subtitle="Tu peux ajuster les commissions par produit selon tes accords commerciaux."
            />

            {mandants.map((m) => (
              <section key={m.id} style={styles.section}>
                <div style={styles.rowBetween}>
                  <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>{m.nom}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>Taux défaut</span>
                    <input
                      type="number"
                      style={{ ...styles.input, width: 90, marginBottom: 0 }}
                      value={m.commissionParDefaut}
                      onChange={(e) => updateMandantCommission(m.id, e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  {m.produits.map((p) => (
                    <div key={p.id} style={styles.productRow}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.nom}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>{p.categorie}</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>Commission</span>
                        <input
                          type="number"
                          style={{ ...styles.input, width: 90, marginBottom: 0 }}
                          value={p.commission}
                          onChange={(e) =>
                            updateProduitCommission(m.id, p.id, e.target.value)
                          }
                        />
                        <span>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

function NavItem({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        marginBottom: 10,
        borderRadius: 14,
        border: active ? "1px solid #dbeafe" : "1px solid transparent",
        background: active ? "#eff6ff" : "transparent",
        color: active ? "#111827" : "#4b5563",
        fontSize: 16,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Header({ title, subtitle, action }) {
  return (
    <section style={styles.hero}>
      <div>
        <div style={styles.heroEyebrow}>SYNCHRONISÉ MAC + IPAD</div>
        <h1 style={styles.heroTitle}>{title}</h1>
        <p style={styles.heroText}>{subtitle}</p>
      </div>
      {action || <div style={styles.cloudBadge}>Cloud actif</div>}
    </section>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardSub}>{subtitle}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </label>
  );
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: "#111827",
  },
  sidebar: {
    width: 280,
    background: "#f8fafc",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid #e5e7eb",
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  logoSub: {
    fontSize: 13,
    color: "#6b7280",
  },
  sidebarFooter: {
    fontSize: 13,
    color: "#6b7280",
    padding: "10px 6px",
  },
  main: {
    flex: 1,
    padding: 28,
  },
  hero: {
    background: "#ffffff",
    borderRadius: 28,
    padding: 28,
    marginBottom: 22,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#2563eb",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 1.1,
    margin: 0,
    marginBottom: 12,
  },
  heroText: {
    margin: 0,
    color: "#6b7280",
    maxWidth: 760,
    fontSize: 15,
    lineHeight: 1.5,
  },
  cloudBadge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
    marginBottom: 22,
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  },
  sectionTitle: {
    fontSize: 18,
    margin: 0,
    marginBottom: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 15,
    marginBottom: 0,
  },
  infoBox: {
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    padding: 16,
    borderRadius: 18,
    marginBottom: 18,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    color: "#1f2937",
  },
  primaryButton: {
    background: "#2583ff",
    color: "white",
    border: "none",
    borderRadius: 16,
    padding: "14px 18px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr 1.2fr 1fr 1fr 1fr 50px",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 18,
    background: "#f9fafb",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr 1.2fr 1fr 1fr 1fr 50px",
    gap: 10,
    padding: "14px 16px",
    borderBottom: "1px solid #f3f4f6",
    alignItems: "center",
  },
  deleteBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    color: "#9ca3af",
  },
  emptyText: {
    color: "#6b7280",
    padding: "12px 4px",
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  productRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #f3f4f6",
  },
};

export default App;
