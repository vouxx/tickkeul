# 티끌 (tickkeul)

모으면 태산이 되는 공시 공부.

주식·경제 흐름을 듀오링고처럼 하루 몇 분씩 배우는 앱. 로그인 없이 진도는 브라우저(localStorage)에 저장돼요.

- **학습** (`/`): 9개 유닛 27개 레슨. 주식 첫걸음 · 한국 시장 구조 · 차트 읽기 · 기업 가치 · 공시 읽기 · 돈의 흐름 · 경제 사이클 · 국제 정세 · 투자 심리
- **용어·레벨 학습** (`/words`): 경제·주식 용어 1,148개를 초급·중급·고급·특급으로 나눠 12개씩 스테이지 학습(카드·퀴즈), 레벨별 실전 문제 264개, 검색 가능한 용어 사전
  - 용어: `src/data/glossary.ts`(핵심) + `src/data/terms/*.json`(분야별), 실전 문제: `src/data/questions/*.json`
  - 내용을 추가·수정한 뒤 `npm run check:content`로 중복·형식을 검사해요 (`-- --fix`로 중복 자동 제거)
- **복습** (`/review`): 틀린 문제 다시 풀기, 끝내면 하트 회복
- **모의투자** (`/play`): 가상 자금 1,000만 원으로 실제·예시 공시 보고 투자 판단
- 콘텐츠는 `src/data/course.ts`에서 추가·수정해요 (문제 유형: card, choice, match, chart, disclosure). 새 유닛은 `src/data/course-more.ts`

```bash
npm install
npm run dev
```

## 실제 DART 공시로 문제 만들기

1. `.env.example`을 `.env.local`로 복사하고 키 두 개를 채워요.
   - `DART_API_KEY`: https://opendart.fss.or.kr → 인증키 신청
   - `DATA_GO_KR_KEY`: https://www.data.go.kr/data/15094808/openapi.do → 활용신청 후 일반 인증키(Decoding)
2. 문제를 생성해요. 결과는 `src/data/dart-problems.json`에 저장돼요.

```bash
npm run problems                                         # 최근 1년
npm run problems -- --from 20240101 --to 20241231 --per-type 20
```

지금은 유상증자, 자기주식 취득, 자기주식 처분 공시를 다뤄요. 잠정실적은 DART에 구조화된 API가 없어 아직 예시 문제만 있어요.
