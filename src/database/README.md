# Database Migration Management

이 프로젝트는 환경별로 마이그레이션을 분리하여 관리합니다.

## 폴더 구조

```
src/database/
├── data-source.dev.ts      # 개발 환경 DataSource
├── data-source.prod.ts     # 프로덕션 환경 DataSource
├── data-source.local.ts    # 로컬 환경 DataSource
└── migrations/
    ├── dev/                # 개발 환경 마이그레이션
    ├── prod/               # 프로덕션 환경 마이그레이션
    └── local/              # 로컬 환경 마이그레이션
```

## 사용법

TypeORM 엔티티를 변경한 후 Dev, Prod DB 마이그레이션할 일이 있을 때 사용합니다.

사용할 환경에 맞는 data-source.\*.example.ts 스크립트에 들어가서 hostname, username, password, database 등을 수정하고 파일 이름 변경 후 하단에 있는 명령어를 실행합니다.
마이그레이션을 만들 때 `example-name`에 `popo-수정사항-월-일`과 같이 적당한 마이그레이션 이름을 넣어줍니다. ex) popo-add-isEdited-08-15

```bash
$ npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/database/data-source.dev.ts src/database/migrations/dev/popo-example-name-month-day

Migration .../popo-nest-api/src/database/migrations/dev/1755250819946-popo-example-name-month-day.ts has been generated successfully.

$ npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.dev.ts
...
```

## 비교과활동 / 활동 수기 테이블 (2026-09-26)

- dev: `migrations/dev/1790380800000-popo-add-extracurricular-09-26.ts`
- prod: `migrations/prod/1790380800001-popo-add-extracurricular-09-26.ts`

각 환경의 DataSource로 위 `migration:run` 명령을 실행합니다. `activity`와
`activity_report`만 생성하며 기존 테이블은 변경하지 않습니다. UUID는 기존
마이그레이션과 같이 `varchar(36)`을 사용합니다. 롤백은 수기 테이블을 먼저 삭제한
후 활동 테이블을 삭제하므로, 이미 등록된 활동과 수기가 있다면 롤백 전 백업이 필요합니다.
두 환경의 생성/삭제 SQL은 격리된 MariaDB 10.11에서 검증했습니다.

배포 환경에서는 `S3_REGION`과 `S3_BUCKET_NAME`이 필수이며 누락되면 시작에
실패합니다. 로컬 디스크 파일 저장은 `NODE_ENV=local` 또는 `NODE_ENV`가 없는
로컬 실행에서만 허용됩니다. `NODE_ENV=test`에서는 S3 없이 시작할 수 있지만
로컬 파일 저장은 허용하지 않으므로 테스트에서 `FileService`를 대체합니다.

## 주의사항

0. [Paxi](https://github.com/PoApper/paxi-popo-nest-api) 프로젝트에서도 같은 DB에 마이그레이션을 생성할 수 있으므로 마이그레이션 적용 시 주의가 필요합니다.
1. **생성된 스크립트 확인**: 마이그레이션 적용 전에 스크립트가 어떻게 나왔는지 확인하고 Column DROP이 있다면 CHANGE로 변경할 수 없는지 확인해야 합니다. DROP하면 데이터 다 날아감
2. **테스트**: 프로덕션에 적용하기 전에 개발 환경에서 충분히 테스트하세요. **중요\*1000**
3. **환경별 분리**: 각 환경의 마이그레이션은 해당 폴더에만 저장됩니다.
4. **순서 관리**: 마이그레이션은 타임스탬프 순서대로 실행됩니다.
