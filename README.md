# Drone Control System

Google Maps 기반 드론 제어 시뮬레이션 시스템입니다. Electron + React + TypeScript로 구축되었습니다.

## 주요 기능

### 드론 제어
- **개별 드론 제어**: 이륙, 착륙, 복귀, 위치 찾기, 경로 표시
- **전체 드론 명령**: 전체 이륙, 전체 복귀, 전체 랜덤 이동
- **드론 이동 명령**: 지도 우클릭으로 드론 이동, Shift+우클릭으로 웨이포인트 추가
- **드론 상태 표시**: idle, ascending, hovering, moving, returning, landing, mia 등 상태별 색상 표시

### 지도 기능
- **Google Maps 연동**: 실시간 드론 위치 표시
- **마커 클러스터링**: 6대 이상 밀집 시 자동 클러스터링, 줌 레벨에 따른 동적 범위 조절
- **경로 표시**: 드론별 이동 경로 시각화
- **Base 마커**: 이착륙 기지 위치 표시 및 설정

### 서버 기능
- **WebSocket 서버**: 실시간 드론 상태 동기화
- **드론 시뮬레이션**: 드론 수 설정, 자동 배터리 소모, 자동 복귀/착륙
- **서버 설정**: Heartbeat 주기, Base 이동 시간, Base 고도 등 설정 가능

## 스크린샷

(추후 추가)

## 설치 방법

### 요구 사항
- Node.js 18+
- Yarn

### 설치

```bash
yarn
```

### 개발 모드 실행

```bash
yarn dev
```

### 빌드

```bash
# Windows
yarn build:win

# macOS
yarn build:mac

# Linux
yarn build:linux
```

## 사용법

### 1. API Key 설정
1. API 탭에서 Google Maps API Key를 입력합니다.
2. "Apply" 버튼을 클릭합니다.

### 2. 서버 시작
1. SERVER 탭에서 Host와 Port를 설정합니다.
2. "Start Server" 버튼을 클릭합니다.

### 3. 드론 제어
1. MAIN 탭에서 드론 목록을 확인합니다.
2. 개별 드론 버튼으로 이륙, 착륙, 복귀 등을 제어합니다.
3. 드론 목록 헤더의 버튼으로 전체 명령을 내립니다.

### 4. 드론 이동
1. 지도에서 드론 마커를 클릭하여 선택합니다.
2. 지도에서 우클릭하여 해당 위치로 이동 명령을 내립니다.
3. Shift+우클릭으로 웨이포인트를 추가합니다.

### 5. Base 설정
1. 지도에서 Base 마커를 클릭합니다.
2. 좌표를 직접 입력하거나 지도에서 선택합니다.
3. "Base 위치 적용" 버튼을 클릭합니다.

## 단축키

| 단축키 | 기능 |
|--------|------|
| `Tab` | 사이드바 열기/닫기 |
| `Ctrl + 1` | MAIN 탭 |
| `Ctrl + 2` | SERVER 탭 |
| `Ctrl + 3` | API 탭 |
| `Ctrl + 4` | HELP 탭 |

## 기술 스택

- **Frontend**: React 19, TypeScript
- **Desktop**: Electron (electron-vite)
- **Maps**: Google Maps API (@vis.gl/react-google-maps)
- **State**: React Query (TanStack Query)
- **Styling**: SCSS Modules
- **Server**: WebSocket (ws)

## 프로젝트 구조

```
src/
├── main/           # Electron 메인 프로세스
├── preload/        # Preload 스크립트 (IPC 브릿지)
├── server/         # WebSocket 서버 (DroneServer)
└── renderer/src/   # React 앱 (UI)
    ├── components/ # UI 컴포넌트
    ├── contexts/   # React Context (WebSocket)
    ├── hooks/      # Custom Hooks (queries, mutations)
    └── utils/      # 유틸리티 함수
```

## 라이선스

MIT
