# RPG Party

Orca 오른쪽 사이드바에 Party 패널을 추가합니다. 현재 워크스페이스의 에이전트 한 명이 픽셀 파티원 한 명으로 표시되고, 에이전트 상태와 도구 호출에 따라 동작합니다.

## 1. 동작

| 조건 | 동작 |
|---|---|
| working | 걷기 |
| blocked | 머리 위 `!` |
| done | 승리 포즈, 15초 뒤 휴식 |
| waiting | 휴식 (`Zzz`) |
| Bash 등 명령 | 주문 (직업별 효과) |
| Read, Grep, Glob | 마도서 |
| Edit, Write, apply_patch | 룬 새기기 |
| WebSearch, WebFetch | 비행 |
| Agent, Task | 소환 |

도구 동작은 도구가 끝난 뒤 4초간 재생됩니다(`agent.tool.after` 훅, 관찰만 함).

카드는 탭 순서대로 놓입니다. 플러그인 API에는 탭 순서가 없어서, 워커가 `orca terminal list --include-visual-layouts`를 읽기 전용으로 실행해 순서를 얻습니다. 탭을 끌어 옮기면 5초 안에 카드 순서도 바뀝니다. CLI를 실행하지 못하면 API가 준 순서로 표시합니다.

## 2. 직업과 레벨

- 직업 5종: 마법사, 전사, 레인저, 성직자, 도적. 새 파티원은 현재 파티에서 가장 적게 쓰인 직업을 받고, 터미널별로 유지됩니다.
- 탭 제목에 `마법사`, `전사`, `레인저`, `성직자`(`힐러`), `도적`(또는 영문 mage, warrior, ranger, cleric, rogue)을 넣으면 그 직업이 우선합니다.
- EXP: 편집·소환 3, 명령 2, 읽기·검색 1. 레벨 n에 필요한 누적 EXP는 10, 30, 60, 100…입니다.

## 3. 권한

`storage:own`(EXP·직업 저장), `agent:read`(에이전트 상태), `workspace:read`(워크스페이스 전환 시 목록 갱신). 설치할 때 승인이 필요합니다.

## 4. 개발

```sh
orca plugin test .                 # 규칙·워커 테스트
npx -p typescript tsc -p .         # 타입 검사
orca plugin dev load .             # Orca에 불러오기 (승인 필요)
node tools/preview-sprites.ts out.png 3   # 스프라이트 시트 PNG
orca plugin dev request . party.demo --data '{"on":true}'    # 시연 파티 5명 표시 (스크린샷용)
orca plugin dev request . party.demo --data '{"on":false}'   # 실제 에이전트 표시로 복귀
```

그림은 `src/sprites.ts`가 32×32 격자에 코드로 그립니다. 외부 이미지는 쓰지 않습니다.
