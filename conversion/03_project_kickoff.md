# Tossplace 클론 - 프로젝트 킥오프

## 프로젝트 생성 (2025-01-13 16:00)

### 1. 프로젝트 구조 생성 완료

```
tossplace-clone/
├── src/
│   ├── core/
│   │   ├── models/
│   │   │   ├── ProductModel.h
│   │   │   ├── OrderModel.h
│   │   │   ├── CustomerModel.h
│   │   │   └── PaymentModel.h
│   │   ├── services/
│   │   │   ├── OrderService.h
│   │   │   ├── PaymentService.h
│   │   │   ├── ProductService.h
│   │   │   └── CustomerService.h
│   │   └── database/
│   │       ├── Database.h
│   │       └── DatabaseSchema.sql
│   ├── ui/
│   │   ├── pages/
│   │   │   ├── MainPage.qml
│   │   │   ├── OrderPage.qml
│   │   │   ├── PaymentPage.qml
│   │   │   ├── ProductPage.qml
│   │   │   └── KioskPage.qml
│   │   ├── components/
│   │   │   ├── OrderList.qml
│   │   │   ├── PaymentButton.qml
│   │   │   ├── ProductCard.qml
│   │   │   └── TossHeader.qml
│   │   ├── styles/
│   │   │   ├── TossTheme.qml
│   │   │   └── Colors.qml
│   │   └── main.qml
│   ├── main.cpp
│   ├── ApplicationController.h
│   └── ApplicationController.cpp
├── tests/
│   ├── unit/
│   │   ├── test_payment.cpp
│   │   ├── test_order.cpp
│   │   └── test_product.cpp
│   └── integration/
│       ├── test_workflow.cpp
│       └── test_database.cpp
├── CMakeLists.txt
├── qml.qrc
└── README.md
```

### 2. 팀 구성 및 작업 할당

| 작업 ID | 담당 | 제목 | 상태 |
|--------|------|------|------|
| T001 | IronMan | QML 프로젝트 구조, 토스 스타일 시스템 | 대기 중 |
| T002 | Natasha | C++ 프로젝트 구조, 데이터 모델, DB 초기화 | 대기 중 |
| T003 | IronMan | 주문/결제 UI 페이지 | 대기 중 |
| T004 | Natasha | 주문 처리, 결제 로직, DB 연동 | 대기 중 |
| T005 | Natasha | 상품 관리 로직 | 대기 중 |
| T006 | IronMan | 키오스크/배달 UI | 대기 중 |
| T007 | Natasha | 배달 연동 로직, 확장 기능 | 대기 중 |
| T008 | Groot | 단위/통합 테스트 | 대기 중 |
| T009 | Groot | UI 테스트 | 대기 중 |
| T010 | 전체 | 성능 최적화, 버그 수정 | 대기 중 |

### 3. Worktree 브랜치 전략

```
test/moc-toss-place (메인 브랜치)
├── worktree/ironman-T001/     # 프론트엔드 초기화
├── worktree/natasha-T002/     # 백엔드 초기화
└── (Phase 2부터 병렬 작업...)
```

### 4. 다음 단계

1. **Phase 1 시작** (IronMan & Natasha 병렬)
   - IronMan: T001 - QML 프로젝트 구조, 토스 스타일 시스템
   - Natasha: T002 - C++ 프로젝트 구조, 데이터 모델, DB 초기화

2. **리뷰 & 병합**
   - Groot이 테스트 작성
   - Captain이 코드 리뷰 및 병합 조율

3. **Phase 2 시작**
   - T003-T005 병렬 진행

---

*상태: 준비 완료 (Phase 1 시작 대기)*
*담당: Captain*
