#!/usr/bin/env node
/**
 * PostgreSQL 쿼리 스크립트
 *
 * Usage:
 *   node query.js "<SQL>"
 *   node query.js --json "<SQL>"
 *
 * 접속 정보 우선순위:
 *   1. 환경변수 (PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD)
 *   2. 현재 디렉터리 .env 파일
 *   3. ~/.config/pg-query/credentials (Linux/Mac)
 *      %USERPROFILE%\.config\pg-query\credentials (Windows)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const CRED_KEYS = ["PG_HOST", "PG_PORT", "PG_DATABASE", "PG_USER", "PG_PASSWORD"];

const GLOBAL_CRED_PATH = path.join(os.homedir(), ".config", "pg-query", "credentials");
const LOCAL_ENV_PATH = path.join(process.cwd(), ".env");

function parseEnvFile(filePath) {
  const vars = {};
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (CRED_KEYS.includes(key) && val) vars[key] = val;
    }
  } catch {
    // 파일 없음 — 무시
  }
  return vars;
}

function loadCredentials() {
  // 1. 전역 credentials 파일
  const fromGlobal = parseEnvFile(GLOBAL_CRED_PATH);

  // 2. 현재 디렉터리 .env (덮어쓰기)
  const fromLocal = parseEnvFile(LOCAL_ENV_PATH);

  // 3. 환경변수 (최우선)
  const fromEnv = {};
  for (const key of CRED_KEYS) {
    if (process.env[key]) fromEnv[key] = process.env[key];
  }

  const creds = { ...fromGlobal, ...fromLocal, ...fromEnv };

  if (!creds.PG_HOST || !creds.PG_DATABASE || !creds.PG_USER) {
    return null;
  }

  return creds;
}

function printTable(rows) {
  if (!rows || rows.length === 0) {
    console.log("(결과 없음)");
    return;
  }

  const cols = Object.keys(rows[0]);
  const widths = cols.map((c) => c.length);

  for (const row of rows) {
    cols.forEach((c, i) => {
      const val = row[c] == null ? "NULL" : String(row[c]);
      if (val.length > widths[i]) widths[i] = val.length;
    });
  }

  console.log(cols.map((c, i) => c.padEnd(widths[i])).join("  "));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) {
    console.log(
      cols.map((c, i) => {
        const val = row[c] == null ? "NULL" : String(row[c]);
        return val.padEnd(widths[i]);
      }).join("  ")
    );
  }
  console.log(`\n(${rows.length}행)`);
}

async function runQuery(sql, jsonMode) {
  const creds = loadCredentials();

  if (!creds) {
    console.error(
      "오류: DB 접속 정보가 설정되지 않았습니다.\n" +
      "다음 중 하나를 설정하세요:\n" +
      `  1. 환경변수: PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD\n` +
      `  2. 현재 디렉터리 .env 파일\n` +
      `  3. credentials 파일: ${GLOBAL_CRED_PATH}`
    );
    process.exit(1);
  }

  const { Client } = require("pg");

  const client = new Client({
    host: creds.PG_HOST,
    port: parseInt(creds.PG_PORT || "5432", 10),
    database: creds.PG_DATABASE,
    user: creds.PG_USER,
    password: creds.PG_PASSWORD,
  });

  await client.connect();

  try {
    const result = await client.query(sql);

    if (jsonMode) {
      console.log(JSON.stringify(result.rows, null, 2));
    } else {
      printTable(result.rows);
    }
  } finally {
    await client.end();
  }
}

// 인수 파싱
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node query.js [--json] "<SQL>"');
  console.error('예시: node query.js "SELECT * FROM users LIMIT 10"');
  process.exit(1);
}

const jsonMode = args[0] === "--json";
const sql = jsonMode ? args[1] : args[0];

if (!sql) {
  console.error('Usage: node query.js [--json] "<SQL>"');
  process.exit(1);
}

runQuery(sql, jsonMode).catch((err) => {
  console.error("DB 오류:", err.message);
  process.exit(1);
});
