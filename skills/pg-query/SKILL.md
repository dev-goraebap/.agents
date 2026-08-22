---
name: pg-query
description: >
  PostgreSQL DB에 직접 접근하는 스킬. DB 조회, 테이블 구조 확인, 데이터 검증이 필요할 때 사용한다.
  Node.js 스크립트로 직접 연결하며 접속 정보는 환경변수 또는 credentials 파일에서 읽는다.
  "postgres 조회", "DB 확인", "테이블 구조", "pg-query", "쿼리 실행", "데이터 검증",
  "PostgreSQL 접속" 같은 요청에 트리거한다.
compatibility: Requires Node.js. Run `npm install` in scripts/ before first use.
allowed-tools: Bash
metadata:
  author: dev-goraebap
  version: "1.0.0"
---

# pg-query

PostgreSQL DB에 Node.js 스크립트(`pg` 패키지)로 직접 연결해 쿼리를 실행한다.

---

## 사전 준비

스크립트 첫 사용 전 의존성을 설치한다:

```bash
npm install --prefix <skill-path>/scripts/
```

### 접속 정보 설정 (우선순위 순)

1. **환경변수** — 가장 높은 우선순위

```bash
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=mydb
PG_USER=myuser
PG_PASSWORD=mypassword
```

2. **현재 디렉터리의 `.env` 파일** — 프로젝트별 설정

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=mydb
PG_USER=myuser
PG_PASSWORD=mypassword
```

3. **전역 credentials 파일** — 공통 개발 DB 설정

| OS | 경로 |
|----|------|
| Linux / Mac | `~/.config/pg-query/credentials` |
| Windows | `%USERPROFILE%\.config\pg-query\credentials` |

```
PG_HOST=
PG_PORT=5432
PG_DATABASE=
PG_USER=
PG_PASSWORD=
```

파일이 없거나 필수 항목이 없으면:
> "DB 접속 정보가 설정되지 않았습니다. 환경변수 또는 credentials 파일을 확인하세요."

---

## 스크립트 사용법

```bash
# 테이블 형식 출력
node scripts/query.js "SELECT * FROM users LIMIT 10"

# JSON 형식 출력 (에이전트가 파싱할 때 유용)
node scripts/query.js --json "SELECT * FROM users LIMIT 10"
```

---

## 자주 사용하는 SQL

```bash
# 테이블 목록 (public 스키마)
node scripts/query.js "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"

# 컬럼 목록
node scripts/query.js "SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'TABLE_NAME' ORDER BY ordinal_position"

# 제약조건 (PK, FK, UNIQUE 등)
node scripts/query.js "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'TABLE_NAME'"

# 외래키 상세
node scripts/query.js "SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.key_column_usage kcu JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name WHERE kcu.table_name = 'TABLE_NAME'"

# 인덱스
node scripts/query.js "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'TABLE_NAME'"

# 시퀀스 현재값
node scripts/query.js "SELECT sequence_name, last_value FROM information_schema.sequences s JOIN (SELECT sequencename, last_value FROM pg_sequences) ps ON s.sequence_name = ps.sequencename WHERE s.sequence_schema = 'public'"

# 실행 중인 쿼리
node scripts/query.js "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active'"
```
