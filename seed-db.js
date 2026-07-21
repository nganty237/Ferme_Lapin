const fs = require('fs');

const dbPath = './db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.clapiers = [
  { id: "clap-m1", nom: "Clapier Maternité 1", type: "Maternité", nombreCases: 12, casesOccupees: 11 },
  { id: "clap-m2", nom: "Clapier Maternité 2", type: "Maternité", nombreCases: 12, casesOccupees: 11 },
  { id: "clap-m3", nom: "Clapier Maternité 3", type: "Maternité", nombreCases: 12, casesOccupees: 11 },
  { id: "clap-e1", nom: "Clapier Engraissement 1", type: "Engraissement", nombreCases: 12, casesOccupees: 12 },
  { id: "clap-e2", nom: "Clapier Engraissement 2", type: "Engraissement", nombreCases: 12, casesOccupees: 12 },
  { id: "clap-e3", nom: "Clapier Engraissement 3", type: "Engraissement", nombreCases: 12, casesOccupees: 12 },
  { id: "clap-e4", nom: "Clapier Engraissement 4", type: "Engraissement", nombreCases: 12, casesOccupees: 10 },
  { id: "clap-e5", nom: "Clapier Engraissement 5", type: "Engraissement", nombreCases: 12, casesOccupees: 0 },
  { id: "clap-e6", nom: "Clapier Engraissement 6", type: "Engraissement", nombreCases: 12, casesOccupees: 0 }
];

db.bandes = [
  { id: "bande-a", nom: "Bande A", phase: "Repos", dateDemarragePhase: "2026-06-20", femellesIds: ["F001", "F002", "F003", "F004", "F005", "F006", "F007", "F008", "F009", "F010", "F011"] },
  { id: "bande-b", nom: "Bande B", phase: "Gestation", dateDemarragePhase: "2026-06-20", femellesIds: ["F012", "F013", "F014", "F015", "F016", "F017", "F018", "F019", "F020", "F021", "F022"] },
  { id: "bande-c", nom: "Bande C", phase: "Allaitement", dateDemarragePhase: "2026-06-20", femellesIds: ["F023", "F024", "F025", "F026", "F027", "F028", "F029", "F030", "F031", "F032", "F033"] }
];

db.palpations = [];
db.sexages = [];
db.sessions_saillie = db.saillies || []; // clone them over to match the new storage keys

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('db.json updated successfully');
