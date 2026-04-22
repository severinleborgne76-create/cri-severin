import { useState } from "react";

export default function App() {
  const [page, setPage] = useState("dashboard");

  const mandantsInit = [
    {
      nom: "Zalmhuys",
      commission: 3,
      produits: [
        { nom: "Saumon frais filet", commission: 3 },
        { nom: "Saumon surgelé", commission: 4 },
      ],
    },
    {
      nom: "Fayet",
      commission: 3,
      produits: [
        { nom: "Cabillaud Islande", commission: 3 },
        { nom: "Lieu noir", commission: 3 },
      ],
    },
    {
      nom: "Le Fumoir",
      commission: 4,
      produits: [{ nom: "Saumon fumé premium", commission: 4 }],
    },
    {
      nom: "Stratos",
      commission: 4,
      produits: [
        { nom: "Bar Grèce", commission: 4 },
        { nom: "Daurade Grèce", commission: 4 },
      ],
    },
    {
      nom: "DZM",
      commission: 3,
      produits: [
        { nom: "Couteaux frais", commission: 2 },
        { nom: "Couteaux surgelés", commission: 5 },
      ],
    },
  ];

  const [mandants] = useState(mandantsInit);
  const [ventes, setVentes] = useState([]);

  const [mandantChoisi, setMandantChoisi] = useState("Zalmhuys");
  const [client, setClient] = useState("");
  const [montant, setMontant] = useState("");

  const produitsActuels =
    mandants.find((m) => m.nom === mandantChoisi)?.produits || [];

  const [produitChoisi, setProduitChoisi] = useState(
    produitsActuels[0]?.nom || ""
  );

  const saveVente = () => {
    const prod = produitsActuels.find((p) => p.nom === produitChoisi);
    const taux = prod?.commission || 0;
    const commission = (Number(montant) * taux) / 100;

    setVentes([
      ...ventes,
      {
        date: new Date().toLocaleDateString(),
        mandant: mandantChoisi,
        produit: produitChoisi,
        client,
        montant,
        taux,
        commission,
      },
    ]);

    setClient("");
    setMontant("");
  };

  const caTotal = ventes.reduce((a, b) => a + Number(b.montant), 0);
  const commissions = ventes.reduce((a, b) => a + Number(b.commission), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>
      <div
        style={{
          width: "240px",
          background: "#f4f4f4",
          padding: "30px",
        }}
      >
        <h2>CRM Séverin</h2>

        <p onClick={() => setPage("dashboard")} style={{ cursor: "pointer" }}>
          Tableau de bord
        </p>

        <p onClick={() => setPage("ventes")} style={{ cursor: "pointer" }}>
          Ventes
        </p>

        <p onClick={() => setPage("mandants")} style={{ cursor: "pointer" }}>
          Mandants
        </p>
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        {page === "dashboard" && (
          <>
            <h1>Ton CRM Commercial</h1>
            <h2>CA total : {caTotal.toFixed(0)} €</h2>
            <h2>Commissions : {commissions.toFixed(0)} €</h2>
          </>
        )}

        {page === "mandants" && (
          <>
            <h1>Mandants</h1>

            {mandants.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: "15px",
                  marginBottom: "15px",
                  background: "#f5f5f5",
                  borderRadius: "10px",
                }}
              >
                <strong>{m.nom}</strong> ({m.commission}%)
                <ul>
                  {m.produits.map((p, x) => (
                    <li key={x}>
                      {p.nom} - {p.commission}%
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}

        {page === "ventes" && (
          <>
            <h1>Nouvelle Vente</h1>

            <select
              value={mandantChoisi}
              onChange={(e) => {
                setMandantChoisi(e.target.value);
                const liste =
                  mandants.find((m) => m.nom === e.target.value)?.produits || [];
                setProduitChoisi(liste[0]?.nom || "");
              }}
            >
              {mandants.map((m, i) => (
                <option key={i}>{m.nom}</option>
              ))}
            </select>

            <br />
            <br />

            <select
              value={produitChoisi}
              onChange={(e) => setProduitChoisi(e.target.value)}
            >
              {produitsActuels.map((p, i) => (
                <option key={i}>{p.nom}</option>
              ))}
            </select>

            <br />
            <br />

            <input
              placeholder="Client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />

            <br />
            <br />

            <input
              placeholder="Montant €"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />

            <br />
            <br />

            <button onClick={saveVente}>Ajouter Vente</button>

            <hr />

            <h2>Historique</h2>

            {ventes.map((v, i) => (
              <div key={i}>
                {v.date} | {v.mandant} | {v.produit} | {v.client} | {v.montant}€
                | {v.commission.toFixed(0)}€
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}