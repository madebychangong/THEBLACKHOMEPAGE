# 더블랙샵 손님용 시세표

이 폴더는 손님용 홈페이지 전용입니다. 관리자 화면은 들어있지 않습니다.

## Cloudflare Pages 설정

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`
- KV binding: `THEBLACK_KV`

관리자 폴더와 같은 KV namespace를 `THEBLACK_KV` 이름으로 연결해야 관리자에서 저장한 가격표가 반영됩니다.
