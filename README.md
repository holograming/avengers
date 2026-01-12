# Avengers

> 🦾 Claude Code가 팀을 이끌고 복잡한 개발 작업을 자동으로 완성합니다

![Status](https://img.shields.io/badge/status-active-success)
![Phase](https://img.shields.io/badge/M1~M5-complete-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Why Avengers?

**"끝날 때까지 끝나지 않습니다"** — Infinity War 원칙

일반적인 AI 코딩 도구는 단일 작업만 수행합니다.
**Avengers는 7명의 전문 에이전트가 협업하여 전체 개발 사이클을 자동으로 완성합니다.**

### 차별화 포인트

| 기능 | 일반 AI 도구 | Avengers |
|------|-------------|---------|
| 작업 분석 | 수동 | ✅ 자동 (Captain) |
| 워크플로우 | 고정 | ✅ 유연 (M5) |
| 병렬 작업 | 불가 | ✅ Worktree 기반 |
| 복구 | 없음 | ✅ Infinity War |
| 정책 운영 | 없음 | ✅ 4개 정책 |

---

## ⚡ Quick Start

```bash
# 1. 프로젝트에 Avengers 추가
npm install @avengers/core

# 2. 미션 시작
/mission "로그인 기능 구현"

# 3. 결과 확인
/debrief
```

**2시간 만에 완성** (순차 작업 시 5시간 소요)

[상세 설치 가이드 →](docs/INSTALLATION.md)

---

## 🦸 Meet the Team

```
       Captain (오케스트레이터)
            ↓
    ┌───────┼───────┐
 Jarvis  Dr.Strange  Vision
(리서치)  (기획)    (문서)
    └───────┼───────┘
    ┌───────┼───────┐
 IronMan  Natasha  Groot
(풀스택)  (백엔드) (테스트)
```

각 에이전트는 전문 분야에서 자율적으로 작업합니다.

[에이전트 상세 →](docs/AGENTS.md)

---

## 🚀 Features

### M5: Flexible Workflow

**왜 필요한가?**
모든 요청이 전체 개발 사이클을 필요로 하지 않습니다.
M5는 요청 유형을 자동 분석하여 필요한 에이전트만 호출합니다.

- 🔍 **Research Only**: Jarvis만 (10분)
- 📋 **Planning Only**: Jarvis → Dr.Strange (30분)
- 🐛 **Quick Fix**: IronMan/Natasha → Groot (90분)
- 🎨 **Full Development**: 전체 팀 (2-4시간)

[워크플로우 가이드 →](docs/WORKFLOWS.md)

### Infinity War Principle

작업이 중단되어도 **100% 복구** 가능합니다.

- 자동 상태 저장 (10분마다)
- 4계층 복구 메커니즘
- 데이터 손실 < 10분

[복구 정책 →](.claude/policies/recovery-policy.md)

### Policy-Driven Operation

모든 협업 규칙이 명확히 문서화되어 있습니다.

- [Shared Context](.claude/policies/shared-context-policy.md) — 정보 공유
- [Task](.claude/policies/task-policy.md) — 작업 관리
- [Logging](.claude/policies/logging-policy.md) — 이벤트 기록
- [Recovery](.claude/policies/recovery-policy.md) — 상태 복구

[정책 개요 →](.claude/policies/README.md)

---

## 📚 Documentation

| 문서 | 설명 |
|------|------|
| [INSTALLATION.md](docs/INSTALLATION.md) | 설치 및 설정 |
| [WORKFLOWS.md](docs/WORKFLOWS.md) | M5 워크플로우 상세 |
| [AGENTS.md](docs/AGENTS.md) | 에이전트 역할 |
| [FEATURES.md](docs/FEATURES.md) | 기능 레퍼런스 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 아키텍처 |
| [EXAMPLES.md](docs/EXAMPLES.md) | 사용 예시 |
| [CLAUDE.md](CLAUDE.md) | Claude Code 통합 |

---

## 📊 Project Status

- ✅ **Phase 1**: M1-M5 Core System
- 🔄 **Phase 2**: External Integration
- ⏳ **Phase 3**: Advanced Features

---

## 🤝 Contributing

Contributions welcome! [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT — [LICENSE](LICENSE)
