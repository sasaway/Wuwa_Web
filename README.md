# Wuwa_Web

명조(Wuthering Waves) 비공식 웹툴 모음입니다. 정적 HTML 페이지로 구성되어 있으며 별도의 빌드 과정 없이 브라우저에서 바로 열어 사용할 수 있습니다.

## 구성

- [`index.html`](index.html) — 도구 목록을 보여주는 메인 페이지
- [`gacha/index.html`](gacha/index.html) — 가챠 계획 시뮬레이터 (보유·수급 재화로 다음 픽업까지 뽑기 가능 여부 계산, 일정·과금 내역 관리)
- [`calculator/index.html`](calculator/index.html) — 스킬 재화 계산기 (캐릭터 스킬 레벨업 재화를 티어별로 합산, 육성 파티 단위 정리)

## 실행 방법

별도 서버나 빌드 도구 없이, `index.html`을 브라우저로 열면 됩니다. 로컬에서 확인하려면:

```bash
open index.html
```

또는 정적 파일 서버로 실행:

```bash
python3 -m http.server 8000
```

이후 `http://localhost:8000` 접속.

## 비고

개인 제작 비공식 도구입니다. 명조(Wuthering Waves)는 Kuro Games의 상표입니다.
