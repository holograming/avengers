# Code Review Skill

체계적인 코드 리뷰 프로세스를 가이드합니다.

## Quick Start

```typescript
// 코드 리뷰 요청
avengers_skill_code_review({ phase: "request", files: ["src/feature.ts"] })
```

---

## The Process

```
REQUEST → REVIEW → RESPOND → APPROVE
```

1. **REQUEST**: 리뷰 요청
2. **REVIEW**: 리뷰 수행
3. **RESPOND**: 피드백 대응
4. **APPROVE**: 승인

---

## Phases

### request
리뷰 요청 전 체크리스트.
- 테스트 통과
- 린팅 에러 없음
- 셀프 리뷰 완료
- 디버그 코드 제거

### review
리뷰 수행.
- 기능 검증
- 설계 검토
- 코드 품질
- 테스트 커버리지
- 보안 검토

### respond
피드백 대응.
- Accept: 수정
- Discuss: 논의
- Defer: 후속 작업

### approve
승인 및 병합.

---

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| Critical | 보안, 데이터 손실, 크래시 | 반드시 수정 |
| Major | 버그, 성능 이슈 | 수정 권장 |
| Minor | 스타일, 개선점 | 선택적 |
| Suggestion | 아이디어, 대안 | 참고 |

---

## Examples

### Full Review Cycle
```typescript
// 1. Request review
avengers_skill_code_review({
  phase: "request",
  files: ["src/auth.ts", "src/login.ts"],
  taskId: "T001"
})

// 2. Conduct review
avengers_skill_code_review({
  phase: "review",
  files: ["src/auth.ts", "src/login.ts"]
})

// 3. Record findings
avengers_skill_code_review({
  phase: "respond",
  findings: [
    {
      severity: "major",
      file: "src/auth.ts",
      line: 42,
      issue: "SQL injection vulnerability",
      suggestion: "Use parameterized queries"
    }
  ]
})

// 4. After fixes, approve
avengers_skill_code_review({
  phase: "approve",
  taskId: "T001"
})
```

---

## Checklist

### Functionality
- [ ] 의도대로 동작
- [ ] 엣지 케이스 처리
- [ ] 에러 처리 적절

### Design
- [ ] 단일 책임 원칙
- [ ] 불필요한 복잡성 없음
- [ ] 프로젝트 패턴 준수

### Quality
- [ ] 명확한 네이밍
- [ ] 매직 넘버 없음
- [ ] 코드 중복 없음

### Security
- [ ] 시크릿 노출 없음
- [ ] 입력 검증
- [ ] SQL 인젝션 방지
