# TDD Skill

Test-Driven Development 워크플로우를 가이드합니다.

## Quick Start

```typescript
// TDD 시작
avengers_skill_tdd({ phase: "start", feature: "my-feature" })
```

---

## The Cycle

```
RED → GREEN → REFACTOR → (repeat)
```

1. **RED**: 실패하는 테스트 작성
2. **GREEN**: 테스트를 통과하는 최소 코드
3. **REFACTOR**: 코드 개선 (테스트 유지)

---

## Phases

### start
TDD 세션 시작. 기본 원칙 확인.

### red
실패하는 테스트 작성.
- AAA 패턴 (Arrange-Act-Assert)
- 하나의 동작만 테스트
- 명확한 테스트 이름

### green
테스트 통과하는 최소 코드.
- 추가 기능 금지
- 최적화 금지
- 리팩토링 금지

### refactor
코드 개선.
- DRY 원칙
- 명확한 네이밍
- 작은 변경 단위

### complete
TDD 사이클 완료.

---

## Examples

### Basic Usage
```typescript
// 1. Start
avengers_skill_tdd({ phase: "start", feature: "user-login" })

// 2. Write failing test
avengers_skill_tdd({ phase: "red", feature: "user-login", testFile: "tests/login.test.ts" })

// 3. Make it pass
avengers_skill_tdd({ phase: "green", feature: "user-login", testResult: "fail" })

// 4. Refactor
avengers_skill_tdd({ phase: "refactor", feature: "user-login", testResult: "pass" })

// 5. Complete or continue
avengers_skill_tdd({ phase: "complete", feature: "user-login" })
```

---

## Rules

1. **No production code without a failing test**
2. **Write minimal code to pass**
3. **Refactor only when tests are green**
4. **Run tests after every change**
