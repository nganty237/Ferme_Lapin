const fs = require('fs');

const dbPath = './db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Configuration
db.configuration = {
  nombreCagesTotal: 108,
  nombreClapiers: 9,
  nombreCasesParClapier: 12,
  densiteParCage: 3,
  dureeGestationJours: 30,
  dureeAllaitementJours: 30,
  dureeSexageJours: 30,
  dureeEngraissementJours: 60,
  nombreCagesReproductrices: 33,
  prixAlimentKg: 350,
  prixVenteDefaut: 3000,
  taillePorteeMoyenne: 6,
  nombreFemelles: 33,
  nombreMales: 3,
  nombreBandes: 3,
};

// 2. Bandes
if (!db.bandes || db.bandes.length === 0) {
  db.bandes = [
    {
      id: 'bande-a',
      nom: 'Bande A',
      etat: 'Au repos',
      dateCreation: '2026-01-01',
      cycleJours: 42,
    },
    {
      id: 'bande-b',
      nom: 'Bande B',
      etat: 'En gestation',
      dateCreation: '2026-01-01',
      cycleJours: 42,
    },
    {
      id: 'bande-c',
      nom: 'Bande C',
      etat: 'En allaitement',
      dateCreation: '2026-01-01',
      cycleJours: 42,
    }
  ];
}

// 3. Affectation Males
if (!db.affectationMales || db.affectationMales.length === 0) {
  db.affectationMales = [
    {
      id: "aff-a",
      bandeId: "bande-a",
      affectations: [
        {
          maleId: "M01",
          femellesIds: ["F001", "F002", "F003", "F004", "F005", "F006", "F007", "F008", "F009", "F010", "F011"]
        }
      ]
    },
    {
      id: "aff-b",
      bandeId: "bande-b",
      affectations: [
        {
          maleId: "M02",
          femellesIds: ["F012", "F013", "F014", "F015", "F016", "F017", "F018", "F019", "F020", "F021", "F022"]
        }
      ]
    },
    {
      id: "aff-c",
      bandeId: "bande-c",
      affectations: [
        {
          maleId: "M03",
          femellesIds: ["F023", "F024", "F025", "F026", "F027", "F028", "F029", "F030", "F031", "F032", "F033"]
        }
      ]
    }
  ];
}

// 4. Empty arrays for others if they don't exist
const collections = ['ventes', 'deces', 'clapiers', 'palpations', 'sexages', 'sessions_saillie'];
for (const col of collections) {
  if (!db[col]) {
    db[col] = [];
  }
}

// Write back
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('db.json updated successfully.');
