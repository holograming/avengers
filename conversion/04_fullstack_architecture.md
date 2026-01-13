# Tossplace 클론 - 풀스택 크로스플랫폼 아키텍처

## 최종 기술 결정

### 프로젝트 구조 (Desktop + Web)

```
tossplace-clone/
├── desktop/                    # Qt/QML (C++) - Windows/macOS
│   ├── src/
│   │   ├── core/
│   │   │   ├── models/        # 데이터 모델 (C++)
│   │   │   ├── services/      # 비즈니스 로직 (C++)
│   │   │   └── database/      # SQLite (C++)
│   │   ├── ui/
│   │   │   ├── pages/         # QML 페이지
│   │   │   ├── components/    # QML 컴포넌트
│   │   │   └── styles/        # 토스 스타일
│   │   └── resources/         # 이미지/아이콘
│   └── tests/                 # 데스크탑 테스트
│
├── web/                        # React/TypeScript - 웹
│   ├── src/
│   │   ├── pages/            # React 페이지
│   │   ├── components/       # React 컴포넌트
│   │   ├── services/         # API 클라이언트
│   │   ├── store/            # 상태 관리 (Redux/Zustand)
│   │   ├── types/            # TypeScript 타입
│   │   └── styles/           # CSS/Styled Components
│   ├── public/               # 정적 자산
│   └── tests/                # 웹 테스트
│
├── shared/                    # 공유 자산
│   ├── docs/                 # API 문서, 설계 문서
│   ├── schemas/              # 데이터베이스 스키마
│   └── assets/               # 공유 아이콘/이미지
│
└── README.md
```

## 기술 스택 최종 정의

| 계층 | Desktop (Win/Mac) | Web |
|------|-------------------|-----|
| **UI** | QML | React 18 + TSX |
| **언어** | C++ (Qt) | TypeScript |
| **상태관리** | QML State Machine | Redux/Zustand |
| **DB** | SQLite | IndexedDB (로컬) + API |
| **API 통신** | Qt 내장 (QNetwork) | Axios/Fetch |
| **테스트** | Qt Test | Jest + React Testing Library |
| **스타일** | QSS/QML Styling | Styled Components/Tailwind |
| **빌드** | CMake | Vite/Webpack |

## 개발 팀 역할 재정의

| 에이전트 | 담당 영역 | 작업 범위 |
|---------|---------|---------|
| **IronMan** | 프론트엔드 통합 | QML + React 모두 담당 (UI/UX) |
| **Natasha** | 백엔드 + 공유 로직 | C++ 비즈니스 로직, 공유 스키마, API |
| **Groot** | 전체 테스트 | Desktop 테스트 + Web 테스트 + 통합 테스트 |

## Phase 1: 기초 구조 (병렬 독립)

### Task T001 (IronMan) - Desktop QML 기초
- 프로젝트 구조 및 CMakeLists.txt
- 토스 스타일 시스템 (QML)
- 기본 페이지 레이아웃
- **Worktree**: worktree/ironman-T001

### Task T002 (Natasha) - Backend 핵심 로직
- C++ 프로젝트 구조
- 데이터 모델 (Product, Order, Customer, Payment)
- SQLite 데이터베이스 초기화
- 기본 서비스 클래스 구조
- **Worktree**: worktree/natasha-T002

### Task T003 (IronMan) - Web React 기초
- package.json 및 설정
- 라우팅 구조
- 토스 스타일 (Styled Components)
- 기본 페이지 레이아웃
- **Worktree**: worktree/ironman-T003 (T001 완료 후)

## Phase 2: 핵심 기능 (병렬 의존)

### Task T004 (Natasha) - 주문/결제 로직
- OrderService 구현
- PaymentService 구현 (Mock)
- DB 스키마 업데이트
- 의존성: T002 완료

### Task T005 (IronMan) - Desktop 주문/결제 UI
- OrderPage.qml
- PaymentPage.qml
- ProductCard 컴포넌트
- 의존성: T001 완료

### Task T006 (IronMan) - Web 주문/결제 UI
- OrderPage.tsx
- PaymentPage.tsx
- ProductCard 컴포넌트
- 의존성: T003 완료

## Phase 3: 확장 기능 (병렬)

### Task T007 (Natasha) - 확장 기능 로직
- DeliveryService (Mock)
- KioskService
- ReservationService

### Task T008 (IronMan) - Desktop 확장 UI
- KioskPage.qml
- 배달 연동 UI

### Task T009 (IronMan) - Web 확장 UI
- KioskPage.tsx
- 배달 연동 UI

## Phase 4: 테스트 & 최적화

### Task T010 (Groot) - Desktop 테스트
- 단위 테스트 (Qt Test)
- 통합 테스트

### Task T011 (Groot) - Web 테스트
- 단위 테스트 (Jest)
- React 컴포넌트 테스트

### Task T012 (전체) - 성능 최적화
- Desktop: 메모리 최적화, 렌더링 성능
- Web: 번들 사이즈 최적화, 로딩 성능

## 브랜치 전략

```
test/moc-toss-place (메인)
├── worktree/ironman-T001/      # Desktop QML 기초
├── worktree/natasha-T002/      # Backend 핵심
├── worktree/ironman-T003/      # Web React 기초
├── worktree/natasha-T004/      # 주문/결제 로직
├── worktree/ironman-T005/      # Desktop UI
├── worktree/ironman-T006/      # Web UI
└── (계속...)
```

## 완료 기준 (with_execution)

- ✅ Desktop: Qt/QML 컴파일 성공, 기본 UI 실행 확인
- ✅ Web: npm run dev 성공, 브라우저 실행 확인
- ✅ 모든 테스트 통과
- ✅ 기본 워크플로우 동작 확인 (주문 → 결제)

---

*업데이트: 2025-01-13 16:30 Captain*
