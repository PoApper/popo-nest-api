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

## 주의사항

0. [Paxi](https://github.com/PoApper/paxi-popo-nest-api) 프로젝트에서도 같은 DB에 마이그레이션을 생성할 수 있으므로 마이그레이션 적용 시 주의가 필요합니다.
1. **생성된 스크립트 확인**: 마이그레이션 적용 전에 스크립트가 어떻게 나왔는지 확인하고 Column DROP이 있다면 CHANGE로 변경할 수 없는지 확인해야 합니다. DROP하면 데이터 다 날아감
2. **테스트**: 프로덕션에 적용하기 전에 개발 환경에서 충분히 테스트하세요. **중요\*1000**
3. **환경별 분리**: 각 환경의 마이그레이션은 해당 폴더에만 저장됩니다.
4. **순서 관리**: 마이그레이션은 타임스탬프 순서대로 실행됩니다.
