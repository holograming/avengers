---
disable-model-invocation: false
---

# Mission Debrief

임무를 완료하고 결과를 요약합니다.

## 디브리핑 프로세스

1. **태스크 완료 확인**
   - 모든 태스크 상태 검증
   - 미완료 항목 확인

2. **테스트 결과 확인** (Groot)
   - 테스트 통과 여부
   - 커버리지 리포트

3. **코드 품질 검토**
   - 코드 리뷰 결과
   - 개선 사항

4. **문서화 확인** (Vision)
   - 문서 완성도
   - API 문서 업데이트

5. **워크트리 정리**
   - 병렬 작업 브랜치 머지
   - 워크트리 제거

6. **최종 보고서**
   - 구현 내용 요약
   - 변경 파일 목록
   - 다음 단계 권장

## 보고서 형식

```markdown
## Mission Debrief Report

### Mission
{mission_description}

### Completed Tasks
| ID | Task | Agent | Status |
|----|------|-------|--------|
| T001 | ... | ... | ✓ |

### Test Results
- Total: X tests
- Passed: X ✓
- Failed: X ✗
- Coverage: X%

### Files Changed
- src/...
- tests/...

### Documentation
- README updated
- API docs generated

### Next Steps
1. ...
2. ...

### Team Performance
| Agent | Tasks | Success Rate |
|-------|-------|--------------|
| IronMan | 5 | 100% |
| Natasha | 3 | 100% |
```

## 사용법

```
/debrief
```

Captain이 팀의 작업 결과를 수집하고 최종 보고서를 작성합니다.
