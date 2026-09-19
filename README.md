# Fair Winds (순풍)

명조(Wuthering Waves) 비공식 웹 도구 모음입니다. 뽑기 계획, 재화 계산, 스킬 재료와 육성 파티 정리를 한곳에서 합니다. 정적 HTML 페이지로 구성되어 있어 별도의 빌드 과정 없이 브라우저에서 바로 사용할 수 있습니다.

## 구성

- [`index.html`](index.html) 랜딩 페이지
- [`gacha/index.html`](gacha/index.html) 가챠 계획 시뮬레이터. 보유·수급 재화로 다음 픽업까지 뽑기 가능 여부를 계산하고 일정·과금 내역을 관리합니다. 메인 계산에 반영할 버전은 가챠 계획 탭에서 고릅니다.
- [`calculator/index.html`](calculator/index.html) 스킬 재화 계산기. 캐릭터 스킬 레벨업 재화를 합산하고, 포지션과 속성으로 파티를 추천합니다. 포지션 기본값은 참고용이며 캐릭터별로 바꿀 수 있습니다.
- [`today/index.html`](today/index.html) 오늘 할 일. 결정 플레이트 자동 계산(한 번 입력하고 사용량만 누르면 가득 차는 시각을 계산), 주간 플레이트 계획, 주기별 숙제 체크리스트를 한 화면에서 관리합니다.
- [`assets/`](assets) 세 페이지가 함께 쓰는 스타일(`fairwinds.css`), 저장 어댑터(`store.js`), 결정 플레이트 계산(`plates.js`)과 아이콘
- [`brand/brand.json`](brand/brand.json) 색, 글꼴, 말투, 규격의 기준 파일

## 실행 방법

별도 서버나 빌드 도구 없이 `index.html`을 브라우저로 열면 됩니다. 로컬에서 확인하려면:

```bash
open index.html
```

또는 정적 파일 서버로 실행:

```bash
python3 -m http.server 8000
```

이후 `http://localhost:8000` 접속.

## 테스트

로직 단위 테스트가 있습니다 (Node.js 내장 테스트 러너, 별도 설치 불필요):

```bash
npm test
```

`assets/plates.js`(결정 플레이트 회복 계산)와 `assets/store.js`(저장 어댑터)를 검증합니다.

## 데이터 저장

입력한 데이터는 사용 중인 브라우저의 `localStorage`에만 저장되며 서버로 전송하지 않습니다. 계산기는 JSON 파일로 내보내고 불러올 수 있습니다. 글꼴(Pretendard, Outfit)은 CDN에서 불러오며, 불러오지 못하면 시스템 글꼴로 표시됩니다. 오늘 할 일·가챠 계획 페이지는 역경의 탑·해역 시즌 날짜를 공개 API인 encore.moe에서 가져오는데, 이 요청은 방문자의 브라우저가 직접 보내므로 방문자의 IP가 해당 API에 노출됩니다(입력한 데이터 자체는 전송되지 않습니다).

## 비고

개인 제작 비공식 도구입니다. 명조(Wuthering Waves)는 Kuro Games의 상표입니다. 공식 캐릭터 이미지는 사용하지 않습니다.
