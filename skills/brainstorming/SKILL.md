# Brainstorming Skill

아이디어를 구조화된 설계로 발전시킵니다.

## Quick Start

```typescript
// 브레인스토밍 시작
avengers_skill_brainstorm({ phase: "start", topic: "my-feature" })
```

---

## The Process

```
UNDERSTAND → EXPLORE → DESIGN → FINALIZE
```

1. **UNDERSTAND**: 요구사항 파악
2. **EXPLORE**: 접근 방식 탐색
3. **DESIGN**: 상세 설계
4. **FINALIZE**: 문서화

---

## Phases

### start
브레인스토밍 세션 시작.

### understand
요구사항 이해.
- 문제 정의
- 사용자 파악
- 제약사항 확인
- 성공 기준 정의

### explore
접근 방식 탐색.
- 2-3개 옵션 제시
- 장단점 분석
- 추천안 제시

### design
상세 설계.
- 아키텍처 개요
- 컴포넌트 정의
- 데이터 흐름
- 에러 처리
- 테스트 전략

### finalize
설계 문서 완성.
- `docs/plans/YYYY-MM-DD-{topic}-design.md` 생성
- 구현 계획 수립

---

## Examples

### Feature Design
```typescript
// 1. Start session
avengers_skill_brainstorm({ phase: "start", topic: "auth-system" })

// 2. Gather requirements
avengers_skill_brainstorm({ phase: "understand", topic: "auth-system" })

// 3. Present options
avengers_skill_brainstorm({
  phase: "explore",
  topic: "auth-system",
  options: ["JWT", "Session", "OAuth"]
})

// 4. Detail design
avengers_skill_brainstorm({ phase: "design", topic: "auth-system" })

// 5. Finalize
avengers_skill_brainstorm({ phase: "finalize", topic: "auth-system" })
```

---

## Best Practices

1. **한 번에 하나의 질문**: 명확한 의사결정
2. **객관식 선호**: 빠른 피드백
3. **단계별 검증**: 각 섹션 승인 후 진행
4. **다이어그램 활용**: Mermaid로 시각화
