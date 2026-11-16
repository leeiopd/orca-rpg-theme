# RPG Pixel

16비트 RPG 밤 분위기의 Orca 테마입니다. 남색·크림·금색 색상, 터미널 뒤에 깔리는 픽셀 배경(별밤 길, 유성, 먼 성), 픽셀 폰트 Galmuri로 구성됩니다.

![Starlit Road background](images/starlit-road.png)

## 1. 구성

| 항목 | 파일 | 내용 |
|---|---|---|
| 앱 테마 | `themes/starlit-road.json` | 공개 토큰 73종 전체, 코드 문법 색, 배경 이미지 |
| 터미널 팔레트 | `terminal/starlit-road.json` | ANSI 16색, 커서, 선택 영역 |
| 배경 | `images/starlit-road.png` | 2560×1440. `tools/gen_background.py`가 320×180 격자로 그린 뒤 8배 확대 |
| 폰트 | `fonts/*.woff2` | Galmuri11(400, 700), GalmuriMono11(400) |

## 2. 적용 방법

테마를 설치해도 아래 설정은 자동으로 바뀌지 않습니다. Orca Settings에서 직접 골라주세요.

1. **앱 테마**: Settings에서 테마로 `RPG Pixel: Starlit Road`를 선택합니다.
2. **터미널 팔레트**: 터미널 테마로 `RPG Pixel: Starlit Road`를 선택합니다.
3. **배경 보이기**: Settings에서 "배경 불투명도(Background Opacity)"를 1 미만(권장 0.55~0.7)으로 낮춥니다. 1이면 터미널이 배경을 가립니다. 값을 입력한 뒤 Enter나 Tab을 눌러야 저장됩니다. "Reduce visual effects"가 켜져 있으면 배경이 그려지지 않습니다.
4. **폰트 (선택)**: 인터페이스 폰트로 `Galmuri11`, 터미널 폰트로 `GalmuriMono11`을 고를 수 있습니다. 긴 본문과 한글은 읽기 어려워지므로 기본 폰트를 유지하는 것을 권장합니다. 쓰려면 11px 또는 22px처럼 11의 배수로 맞춰야 가장 선명합니다.

## 3. Party 패널 (별도 플러그인)

`party/` 폴더는 에이전트를 픽셀 RPG 파티원으로 보여주는 별도 플러그인입니다. 코드가 실행되므로 설치할 때 승인이 필요하고, 테마만 쓸 때는 설치하지 않아도 됩니다. 자세한 내용은 [party/README.md](party/README.md)를 참고해주세요.

## 4. 개발

```sh
orca plugin validate . --json
orca plugin dev watch .        # 폴더를 Orca에 불러오고 저장할 때마다 다시 불러옴. Ctrl-C로 해제
python3 tools/gen_background.py images/starlit-road.png   # 배경 다시 그리기 (표준 라이브러리만 사용)
```

## 5. 출처와 라이선스

- **배경 이미지**: `tools/gen_background.py`가 코드로 그린 원본 그림입니다. 외부 이미지와 캐릭터를 쓰지 않았습니다.
- **폰트**: [Galmuri](https://github.com/quiple/galmuri) v2.40.4, Copyright (c) 2019–2025 Lee Minseo (quiple). SIL Open Font License 1.1로 배포되며, 원문은 `fonts/OFL-Galmuri.txt`에 있습니다. 릴리스 파일을 수정 없이 포함했습니다.
- **색감 참고**: Herdr 레이아웃 [CHO-kr/frieren](https://github.com/CHO-kr/frieren)의 Frieren Pixel 분위기를 참고했습니다. 색 값은 이 테마용으로 새로 정했고, 해당 저장소의 이미지·코드는 포함하지 않았습니다.
