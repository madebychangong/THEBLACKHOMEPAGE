# 더블랙샵 단순 시세표

`index.html` 하나에 손님용 화면과 숨김 편집 모드가 같이 들어있는 버전입니다.

## Cloudflare Pages 설정

- Build command: 비우기
- Build output directory: `.`
- Environment variables:
  - `ADMIN_PASSWORD=the0408!`
  - `SESSION_SECRET=긴랜덤문자열`
- KV binding:
  - `THEBLACK_KV`

`THEBLACK_KV`가 연결되어 있어야 페이지 안에서 저장한 가격표가 방문자 화면에도 반영됩니다.

## 편집 모드 열기

- 로고/상호 영역을 1.5초 길게 누르기
- PC에서는 `Ctrl + Alt + A`

## 파일

- `index.html`: 화면과 숨김 편집 모드
- `가격표.txt`: 최초 가격표 원본
- `logo.png`: 로고
