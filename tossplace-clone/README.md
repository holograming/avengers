# Tossplace 클론 - 크로스플랫폼 POS 시스템

[![Status](https://img.shields.io/badge/status-planning-blue)]()
[![Platform](https://img.shields.io/badge/platform-Win%2FMac%2FWeb-success)]()
[![Tech Stack](https://img.shields.io/badge/tech-Qt%2FQml%2FC%2B%2B%2FReact-orange)]()

## 프로젝트 개요

Tossplace를 클론코딩한 완전한 POS(매장 운영) 시스템입니다. 데스크탑(Qt/QML + C++)과 웹(React)을 동시에 개발합니다.

### 핵심 기능

- **POS 매장 운영**: 주문, 결제, 상품 관리
- **고객 관리**: 고객 정보 및 거래 이력
- **배달 연동**: 배달앱 API 통합
- **키오스크 모드**: 셀프주문 시스템
- **테이블 오더**: 테이블별 주문 관리
- **분석 대시보드**: 매출, 상품 분석

## 프로젝트 구조

```
tossplace-clone/
├── desktop/           # Windows/macOS (Qt/QML + C++)
├── web/              # Web (React + TypeScript)
├── shared/           # 공유 스키마 및 문서
└── README.md
```

## 기술 스택

| 계층 | Desktop | Web |
|------|---------|-----|
| **언어** | C++ | TypeScript |
| **UI** | QML | React 18 |
| **상태관리** | QML State | Redux/Zustand |
| **DB** | SQLite | IndexedDB |
| **빌드** | CMake | Vite |

## 시작하기

### Desktop 개발

```bash
cd desktop
mkdir build && cd build
cmake ..
make
./tossplace-clone
```

### Web 개발

```bash
cd web
npm install
npm run dev
```

## Avengers 개발 팀

- **IronMan**: 프론트엔드 (QML + React)
- **Natasha**: 백엔드 (C++ 비즈니스 로직)
- **Groot**: 테스트 전문가

## 상태

- ✅ 프로젝트 계획 완료
- ⏳ Phase 1: 프로젝트 기초 구축 (진행 중)
- ⏳ Phase 2: 핵심 기능 구현
- ⏳ Phase 3: 확장 기능
- ⏳ Phase 4: 테스트 & 최적화

## 라이선스

MIT

---

*개발 중 | 2025-01-13*
