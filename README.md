# WhiteWise Official Site

화이트와이즈(WhiteWise)의 공식 사업자 홈페이지입니다. 현재 저장소는 `whitewise95/whitewise95.github.io`이며, 공개 주소는 https://whitewise95.github.io/ 입니다. Brew Way 앱 저장소와는 별도로 관리합니다.

## 실행과 검증

Node.js 24를 사용합니다. `npm ci` 후 `npm run build`로 `dist/`를 만들고, `npm test`로 원문·화면·링크를 검사합니다. `npm run serve`는 로컬 4173 포트에서 결과를 보여줍니다. 빌드된 HTML은 별도 서버 없이 열어볼 수도 있습니다.

`npm run build`는 기존 브랜치 기반 Pages와 호환되도록 최상위 `index.html`, `assets/`, `legal/`, `services/`도 함께 갱신합니다. 이 파일들은 직접 편집하지 말고 원본과 생성물을 함께 커밋합니다. GitHub Actions 배포는 검증을 통과한 `dist/`만 게시합니다. 중복 배포를 방지하려면 저장소 Settings → Pages → Source를 GitHub Actions로 선택합니다.

약관 주소는 `https://whitewise95.github.io/legal/brew-way/terms/`입니다. 예전 `/whitewise-official-site/` 경로는 사용하지 않습니다. 토스 콘솔 등 외부에 등록한 약관 URL 5종도 새 주소 기준으로 확인해야 합니다.

## 약관 수정

`src/legal/brew-way/*/versions/2026-08-28.md`가 약관 내용의 원본입니다. 버전과 시행일은 그대로 유지합니다. `npm run build` 또는 `npm run legal:generate`를 실행하면 같은 폴더의 `index.html`이 공통 화면으로 갱신됩니다. 생성된 HTML을 직접 고치지 않습니다.

서비스 기능은 `src/legal/brew-way/features.json`에 등록합니다. 기능을 추가하거나 이름·저장 정보를 바꿀 때 `status`, 이용약관 설명, 개인정보 처리 설명과 수집 항목을 함께 작성하면 `npm run build`가 이용약관의 제공 기능과 개인정보 처리방침의 기능별 안내를 자동으로 갱신합니다. `planned` 유료 기능은 `billingType`을 `one-time` 또는 `recurring`으로 함께 작성해야 합니다. 별도 앱 저장소의 기능 변경을 자동 감지하지 않으므로 이 목록도 함께 수정해야 합니다. 개인정보 수집·광고·결제처럼 운영 정책이 달라지는 기능은 `docs/LEGAL_RELEASE_REVIEW.md`의 운영 확인을 거친 뒤 운영본으로 확정합니다.

공통 화면은 `scripts/legal.mjs`, 디자인은 `src/assets/legal.css`, 목차·인쇄 동작은 `src/assets/legal.js`에서 관리합니다. Markdown 변환에는 Marked, 아이콘에는 Lucide를 빌드 시에만 사용합니다. 외부 스크립트·폰트·추적 도구를 방문자의 브라우저에서 불러오지 않습니다. 자바스크립트 없이도 본문·문서 이동·목차·원문 다운로드를 이용할 수 있습니다.

## 공개 전 확인

`legal-release.json`의 `publicationMode`로 게시 상태를 명시합니다. 현재는 `review`이며, 검토본 안내와 검색 제외 표식을 유지한 상태로 GitHub Pages에 게시합니다. `main`에 push하면 빌드·테스트·`npm run check:publish`를 통과한 결과가 자동 배포됩니다. 빌드된 내려받기 원문에도 기능 목록을 반영합니다.

실제 동의를 받는 운영본은 [운영 확인 문서](docs/LEGAL_RELEASE_REVIEW.md)에 따라 미확정 문구를 해소하고 확인 근거를 남긴 뒤 `publicationMode`를 `production`으로 변경합니다. 이 모드는 기존 `npm run check:release` 검사까지 통과해야 게시됩니다. 검토본 게시 성공은 운영 준비 완료나 법률 검토 완료를 뜻하지 않습니다.
