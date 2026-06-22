import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function seedDatabase(db) {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return;

  const hash = (pwd) => bcrypt.hashSync(pwd, SALT_ROUNDS);

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, best_score) VALUES (?, ?, ?)'
  );
  insertUser.run('marco_rossi', hash('password123'), 18);
  insertUser.run('giulia_bianchi', hash('metro2026'), 22);
  insertUser.run('luca_verdi', hash('rails99'), 0);

  const lines = [
    { name: 'Red Line', color: '#c0392b' },
    { name: 'Blue Line', color: '#2980b9' },
    { name: 'Green Line', color: '#27ae60' },
    { name: 'Yellow Line', color: '#f1c40f' },
  ];
  const insertLine = db.prepare('INSERT INTO lines (name, color) VALUES (?, ?)');
  const lineIds = lines.map((l) => insertLine.run(l.name, l.color).lastInsertRowid);

  const stations = [
    { name: 'Nexus Centrale', x: 120, y: 80, interchange: 1 },
    { name: 'Porta Aurora', x: 280, y: 80, interchange: 1 },
    { name: 'Croce del Mercato', x: 440, y: 80, interchange: 0 },
    { name: 'Stazione Nord', x: 600, y: 80, interchange: 1 },
    { name: 'Piazza delle Luci', x: 760, y: 80, interchange: 1 },
    { name: 'Fonte Silente', x: 280, y: 220, interchange: 1 },
    { name: 'Borgo Tranquillo', x: 440, y: 220, interchange: 0 },
    { name: 'Mercato Antico', x: 600, y: 220, interchange: 1 },
    { name: 'Viale dei Mosaici', x: 760, y: 220, interchange: 0 },
    { name: 'Torre Cinerea', x: 440, y: 360, interchange: 1 },
    { name: 'Giardino Eco', x: 600, y: 360, interchange: 0 },
    { name: 'Campo dell Eco', x: 760, y: 360, interchange: 1 },
    { name: 'Riva del Porto', x: 120, y: 220, interchange: 0 },
    { name: 'Colle dei Viali', x: 120, y: 360, interchange: 0 },
  ];

  const insertStation = db.prepare(
    'INSERT INTO stations (name, pos_x, pos_y, is_interchange) VALUES (?, ?, ?, ?)'
  );
  const stationIds = stations.map((s) =>
    insertStation.run(s.name, s.x, s.y, s.interchange).lastInsertRowid
  );

  const byName = (name) => stationIds[stations.findIndex((s) => s.name === name)];

  const lineRoutes = [
    ['Nexus Centrale', 'Porta Aurora', 'Croce del Mercato', 'Stazione Nord', 'Piazza delle Luci'],
    ['Nexus Centrale', 'Riva del Porto', 'Fonte Silente', 'Borgo Tranquillo', 'Mercato Antico', 'Viale dei Mosaici'],
    ['Porta Aurora', 'Fonte Silente', 'Torre Cinerea', 'Giardino Eco', 'Campo dell Eco'],
    ['Piazza delle Luci', 'Stazione Nord', 'Torre Cinerea', 'Mercato Antico', 'Colle dei Viali', 'Campo dell Eco'],
  ];

  const insertLineStation = db.prepare(
    'INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)'
  );

  lineRoutes.forEach((route, lineIndex) => {
    route.forEach((stationName, position) => {
      insertLineStation.run(lineIds[lineIndex], byName(stationName), position);
    });
  });

  const segmentSet = new Set();
  const addSegment = (a, b) => {
    const idA = byName(a);
    const idB = byName(b);
    const key = idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
    if (!segmentSet.has(key)) {
      segmentSet.add(key);
      db.prepare(
        'INSERT INTO segments (station_a_id, station_b_id) VALUES (?, ?)'
      ).run(Math.min(idA, idB), Math.max(idA, idB));
    }
  };

  lineRoutes.forEach((route) => {
    for (let i = 0; i < route.length - 1; i++) {
      addSegment(route[i], route[i + 1]);
    }
  });

  const events = [
    { description: 'Quiet journey, no change', effect: 0 },
    { description: 'Wrong platform, you lose time', effect: -2 },
    { description: 'Kind passenger, small tip', effect: 1 },
    { description: 'Delay on the line', effect: -3 },
    { description: 'Complimentary ticket found', effect: 2 },
    { description: 'Fine for unstamped ticket', effect: -4 },
    { description: 'Tourist bonus on this stretch', effect: 3 },
    { description: 'Sudden maintenance work', effect: -1 },
    { description: 'Live music on the carriage', effect: 2 },
    { description: 'Forgotten backpack, extra costs', effect: -2 },
  ];

  const insertEvent = db.prepare('INSERT INTO events (description, effect) VALUES (?, ?)');
  events.forEach((e) => insertEvent.run(e.description, e.effect));

  const marcoId = db.prepare('SELECT id FROM users WHERE username = ?').get('marco_rossi').id;
  const giuliaId = db.prepare('SELECT id FROM users WHERE username = ?').get('giulia_bianchi').id;

  const insertGame = db.prepare(`
    INSERT INTO games (user_id, start_station_id, end_station_id, phase, route_json, coins, score, is_valid_route, execution_json)
    VALUES (?, ?, ?, 'result', ?, 20, ?, 1, ?)
  `);

  const nexus = byName('Nexus Centrale');
  const campo = byName('Campo dell Eco');
  const route1 = JSON.stringify([
    { fromId: nexus, toId: byName('Porta Aurora') },
    { fromId: byName('Porta Aurora'), toId: byName('Fonte Silente') },
    { fromId: byName('Fonte Silente'), toId: byName('Torre Cinerea') },
    { fromId: byName('Torre Cinerea'), toId: campo },
  ]);
  insertGame.run(marcoId, nexus, campo, route1, 18, '[]');

  const insertGame2 = db.prepare(`
    INSERT INTO games (user_id, start_station_id, end_station_id, phase, route_json, coins, score, is_valid_route, execution_json)
    VALUES (?, ?, ?, 'result', ?, 20, ?, 1, ?)
  `);
  const riva = byName('Riva del Porto');
  const viale = byName('Viale dei Mosaici');
  const route2 = JSON.stringify([
    { fromId: riva, toId: byName('Fonte Silente') },
    { fromId: byName('Fonte Silente'), toId: byName('Borgo Tranquillo') },
    { fromId: byName('Borgo Tranquillo'), toId: byName('Mercato Antico') },
    { fromId: byName('Mercato Antico'), toId: viale },
  ]);
  insertGame2.run(giuliaId, riva, viale, route2, 22, '[]');
}
