import SqLiteDatabase, {Database, Statement} from 'better-sqlite3'
import {ClBurn, ClMint} from "./types";
import {mapClBurn, mapClMint} from "./mappers";
import fs from "fs";

let db: Database

export const bootstrapDb = () => {
  db = new SqLiteDatabase('sqlite/shadow.db', {
    // verbose: console.log
  })

  // db.prepare(`DROP TABLE IF EXISTS mints`).run()
  // db.prepare(`
  //   CREATE TABLE mints (
  //     id TEXT PRIMARY KEY NOT NULL,
  //     txHash TEXT NOT NULL,
  //     blockNumber INTEGER NOT NULL,
  //     timestamp INTEGER NOT NULL,
  //     pool TEXT NOT NULL,
  //     userAddress TEXT NOT NULL,
  //     token0 TEXT NOT NULL,
  //     token1 TEXT NOT NULL,
  //     amount0 TEXT NOT NULL,
  //     amount1 TEXT NOT NULL
  //   )
  // `).run()
  //
  // db.prepare(`DROP TABLE IF EXISTS burns`).run()
  // db.prepare(`
  //   CREATE TABLE burns (
  //     id TEXT PRIMARY KEY NOT NULL,
  //     txHash TEXT NOT NULL,
  //     blockNumber INTEGER NOT NULL,
  //     timestamp INTEGER NOT NULL,
  //     pool TEXT NOT NULL,
  //     userAddress TEXT NOT NULL,
  //     token0 TEXT NOT NULL,
  //     token1 TEXT NOT NULL,
  //     amount0 TEXT NOT NULL,
  //     amount1 TEXT NOT NULL
  //   )
  // `).run()

  console.log("Opened database:", db.name)

  return db
}

export const insertMintEvents = (
  events: ClMint[]
) => {
  const insert = db.prepare(`
    INSERT INTO mints (id, txHash, blockNumber, timestamp, pool, userAddress, token0, token1, amount0, amount1)
    VALUES (@id, @txHash, @blockNumber, @timestamp, @pool, @userAddress, @token0, @token1, @amount0, @amount1)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  insertMany(events.map(mapClMint));
}

export const insertBurnEvents = (
  events: ClBurn[]
) => {
  const insert = db.prepare(`
    INSERT INTO burns (id, txHash, blockNumber, timestamp, pool, userAddress, token0, token1, amount0, amount1)
    VALUES (@id, @txHash, @blockNumber, @timestamp, @pool, @userAddress, @token0, @token1, @amount0, @amount1)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  insertMany(events.map(mapClBurn));
}

export const exportDatabase = async () => {
  return db.backup(`export/shadow_export_${Math.round(Date.now() / 1000)}.db`)
    .then(() => {
      console.log('DB export completed successfully');
    })
    .catch((err) => {
      console.error('DB export failed:', err);
    });
}

function* toRows(stmt: any) {
  yield stmt.columns().map((column: any) => column.name);
  yield* stmt.raw().iterate();
}

export const exportToCsv = (
  filename: string,
  stmt: Statement
) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filename);
    for (const row of toRows(stmt)) {
      stream.write(row.join(',') + '\n');
    }
    stream.on('error', reject);
    stream.end(resolve);
  });
}

export const exportAllToCsv = async () => {
  const mints = db.prepare('SELECT * FROM mints');
  await exportToCsv('export/mints.csv', mints)
  console.log('Mints exported to csv')

  const burns = db.prepare('SELECT * FROM burns');
  await exportToCsv('export/burns.csv', burns)
  console.log('Burns exported to csv')
}

process.on('exit', () => db.close());
