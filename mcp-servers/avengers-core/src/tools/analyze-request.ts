/**
 * Analyze Request Tool
 *
 * Captain의 핵심 판단 도구입니다.
 * 사용자 요청을 분석하여 적절한 워크플로우와 필요한 에이전트를 결정합니다.
 *
 * 유연한 워크플로우 지원
 * - 모든 요청이 코딩을 필요로 하지 않음
 * - Captain이 요청 유형을 판단하여 필요한 에이전트만 호출
 * - 완료 기준을 명확히 하여 사용자 기대치를 일치시킴
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { AgentType, agentRoles } from "../agent-templates.js";

/**
 * Request type classification
 */
export type RequestType =
  | "research"      // 정보 검색/조사 (예: "X가 뭐야?")
  | "planning"      // 계획/설계 (예: "X 어떻게 할지 계획 세워")
  | "development"   // 개발/구현 (예: "X 만들어줘")
  | "testing"       // 테스트 (예: "테스트 돌려")
  | "documentation" // 문서화 (예: "문서 작성해")
  | "review"        // 코드 리뷰 (예: "코드 리뷰해")
  | "bugfix"        // 버그 수정 (예: "버그 고쳐")
  | "hybrid";       // 복합 요청

/**
 * Workflow preset types
 */
export type WorkflowType =
  | "research-only"
  | "planning-only"
  | "quick-fix"
  | "documentation-only"
  | "testing-only"
  | "full-development";

/**
 * Completion level types
 */
export type CompletionLevel =
  | "code_only"
  | "with_tests"
  | "with_execution"
  | "with_docs";

/**
 * Execution mode types
 */
export type ExecutionMode = "auto" | "planning" | "execution";

/**
 * Workflow preset configuration
 */
interface WorkflowPreset {
  agents: AgentType[];
  phases: number[];
  autoComplete: boolean;
  description: string;
}

/**
 * Workflow presets for different request types
 */
export const WORKFLOW_PRESETS: Record<WorkflowType, WorkflowPreset> = {
  "research-only": {
    agents: ["jarvis"],
    phases: [1],
    autoComplete: true,
    description: "정보 검색 및 분석만 수행"
  },
  "planning-only": {
    agents: ["jarvis", "dr-strange"],
    phases: [1, 2, 3],
    autoComplete: true,
    description: "리서치 후 계획 수립"
  },
  "quick-fix": {
    agents: ["ironman", "groot"],
    phases: [5, 6],
    autoComplete: false,
    description: "빠른 버그 수정 및 테스트"
  },
  "documentation-only": {
    agents: ["jarvis", "vision"],
    phases: [1, 7],
    autoComplete: true,
    description: "리서치 후 문서 작성"
  },
  "testing-only": {
    agents: ["groot"],
    phases: [6],
    autoComplete: false,
    description: "테스트 실행 및 검증"
  },
  "full-development": {
    agents: ["jarvis", "dr-strange", "ironman", "natasha", "groot", "vision"],
    phases: [1, 2, 3, 4, 5, 6, 7],
    autoComplete: false,
    description: "전체 개발 사이클 수행"
  }
};

/**
 * Completion criteria mapping
 */
export const COMPLETION_CRITERIA_MAP: Record<CompletionLevel, string[]> = {
  "code_only": [
    "코드 작성 완료",
    "타입 체크 통과 (TypeScript/정적 분석)",
    "컴파일 성공 (해당되는 경우)"
  ],
  "with_tests": [
    "코드 작성 완료",
    "단위 테스트 작성 및 통과",
    "통합 테스트 통과",
    "테스트 커버리지 80% 이상"
  ],
  "with_execution": [
    "코드 작성 완료",
    "테스트 작성 및 통과",
    "로컬/개발 환경에서 실행 확인",
    "기본 사용 시나리오 검증"
  ],
  "with_docs": [
    "코드 작성 완료",
    "테스트 작성 및 통과",
    "실행 확인 완료",
    "API 문서 작성 (해당되는 경우)",
    "README 또는 가이드 문서 업데이트"
  ]
};

/**
 * 개별 실행 작업
 */
export interface ExecutionTask {
  taskId: string;
  agent: AgentType;
  role: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  prompt: string;
  context?: {
    files?: string[];
    references?: string[];
  };
  dependsOn?: string[];
}

/**
 * 실행 그룹 - 같은 그룹 내 작업은 병렬 실행
 * 그룹 간에는 순차 실행 (waitForGroups로 의존성 지정)
 */
export interface ExecutionGroup {
  groupId: string;
  groupName: string;
  tasks: ExecutionTask[];
  waitForGroups: string[];
  subagentType: "Explore" | "Plan" | "general-purpose";
}

/**
 * DAG 기반 실행 계획
 */
export interface ExecutionPlan {
  enabled: boolean;
  groups: ExecutionGroup[];
}

/**
 * Analysis result interface
 */
export interface RequestAnalysis {
  type: RequestType;
  workflow: WorkflowType;
  intent: string;
  requiredAgents: AgentType[];
  firstStep: string;
  skipPhases: number[];
  researchRequired: boolean;
  researchDepth: "quick" | "moderate" | "comprehensive";
  complexity: "low" | "medium" | "high";
  estimatedSteps: number;
  keywords: string[];
  unknownTerms: string[];
  confidence: number;
  // 완료 기준
  completionLevel: CompletionLevel;
  suggestedCriteria: string[];
  // 실행 모드
  mode: "planning" | "execution";
  // DAG 기반 실행 계획 (v3)
  executionPlan: ExecutionPlan;
}

/**
 * Tool definition
 */
export const analyzeRequestTool: Tool = {
  name: "avengers_analyze_request",
  description: `Captain의 판단 도구. 사용자 요청을 분석하여 적절한 워크플로우와 필요한 에이전트를 결정합니다. 모든 미션 시작 전에 호출하여 효율적인 작업 분배를 수행합니다.

완료 기준 (completionLevel):
- code_only: 코드 작성 + 타입 체크
- with_tests: 코드 + 테스트 (기본값)
- with_execution: 코드 + 테스트 + 실행 확인
- with_docs: 코드 + 테스트 + 실행 + 문서화`,
  inputSchema: {
    type: "object",
    properties: {
      request: {
        type: "string",
        description: "사용자의 요청 내용"
      },
      context: {
        type: "object",
        description: "추가 컨텍스트 정보",
        properties: {
          previousMessages: {
            type: "array",
            items: { type: "string" },
            description: "이전 대화 내용"
          },
          currentFiles: {
            type: "array",
            items: { type: "string" },
            description: "현재 열려있는 파일들"
          },
          recentTasks: {
            type: "array",
            items: { type: "string" },
            description: "최근 완료된 태스크"
          }
        }
      },
      forceResearch: {
        type: "boolean",
        description: "리서치 강제 수행 여부",
        default: true
      },
      completionLevel: {
        type: "string",
        enum: ["code_only", "with_tests", "with_execution", "with_docs"],
        description: "완료 기준 (선택적, 기본값: with_tests)",
        default: "with_tests"
      },
      executionMode: {
        type: "string",
        enum: ["auto", "planning", "execution"],
        description: "실행 모드 (선택적, 기본값: auto). Plan 모드에서는 'planning', 일반 모드에서는 'auto' 권장",
        default: "auto"
      }
    },
    required: ["request"]
  }
};

/**
 * Request analysis parameters
 */
interface AnalyzeParams {
  request: string;
  context?: {
    previousMessages?: string[];
    currentFiles?: string[];
    recentTasks?: string[];
  };
  forceResearch?: boolean;
  completionLevel?: CompletionLevel;
  executionMode?: ExecutionMode;
}

/**
 * Keywords for request type classification
 */
const TYPE_KEYWORDS: Record<RequestType, string[]> = {
  research: [
    "뭐야", "뭔지", "알려", "검색", "찾아", "조사", "분석",
    "what is", "what's", "search", "find", "research", "analyze",
    "어떤", "무엇", "설명", "explain"
  ],
  planning: [
    "계획", "설계", "기획", "어떻게", "방법",
    "plan", "design", "how to", "strategy", "approach",
    "구조", "아키텍처", "architecture"
  ],
  development: [
    "만들어", "구현", "개발", "생성", "추가", "작성",
    "create", "implement", "develop", "build", "add", "write",
    "기능", "feature", "서비스"
  ],
  testing: [
    "테스트", "검증", "확인", "돌려", "실행",
    "test", "verify", "check", "run", "execute",
    "유닛", "통합", "e2e"
  ],
  documentation: [
    "문서", "readme", "api 문서", "주석",
    "document", "docs", "readme", "comment",
    "명세", "spec"
  ],
  review: [
    "리뷰", "검토", "코드 리뷰", "확인",
    "review", "check", "audit", "inspect"
  ],
  bugfix: [
    "버그", "오류", "에러", "수정", "고쳐", "fix",
    "bug", "error", "fix", "patch", "hotfix",
    "문제", "이슈", "issue"
  ],
  hybrid: []
};

/**
 * Check if request is question form
 */
function isQuestionForm(request: string): boolean {
  const questionPatterns = [
    /\?$/,
    /뭐야/,
    /뭔지/,
    /무엇/,
    /어떻게/,
    /왜/,
    /언제/,
    /어디/,
    /what/i,
    /how/i,
    /why/i,
    /when/i,
    /where/i
  ];

  return questionPatterns.some(pattern => pattern.test(request));
}

/**
 * Check if request contains proper nouns (potential unknown terms)
 */
function extractProperNouns(request: string): string[] {
  const properNouns: string[] = [];

  // 영문 고유명사 패턴 (CamelCase, 대문자로 시작)
  const englishPattern = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g;
  const englishMatches = request.match(englishPattern) || [];
  properNouns.push(...englishMatches);

  // 따옴표로 감싼 용어
  const quotedPattern = /["']([^"']+)["']/g;
  let match;
  while ((match = quotedPattern.exec(request)) !== null) {
    properNouns.push(match[1]);
  }

  // 일반적인 영문 단어 필터링
  const commonWords = new Set([
    "API", "REST", "HTTP", "JSON", "HTML", "CSS", "SQL",
    "React", "Vue", "Node", "Express", "TypeScript", "JavaScript"
  ]);

  return properNouns.filter(noun => !commonWords.has(noun));
}

/**
 * Classify request type based on keywords
 */
function classifyRequestType(request: string): RequestType {
  const lowerRequest = request.toLowerCase();
  const scores: Record<RequestType, number> = {
    research: 0,
    planning: 0,
    development: 0,
    testing: 0,
    documentation: 0,
    review: 0,
    bugfix: 0,
    hybrid: 0
  };

  // Score each type based on keyword matches
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [RequestType, string[]][]) {
    for (const keyword of keywords) {
      if (lowerRequest.includes(keyword.toLowerCase())) {
        scores[type] += 1;
      }
    }
  }

  // Question form strongly suggests research
  if (isQuestionForm(request)) {
    scores.research += 2;
  }

  // Find highest scoring type
  let maxType: RequestType = "research";
  let maxScore = 0;

  for (const [type, score] of Object.entries(scores) as [RequestType, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type;
    }
  }

  // If multiple high scores, it's hybrid
  const highScores = Object.entries(scores).filter(([, score]) => score >= maxScore - 1 && score > 0);
  if (highScores.length > 2) {
    return "hybrid";
  }

  // Default to development if no clear match and not a question
  if (maxScore === 0 && !isQuestionForm(request)) {
    return "development";
  }

  return maxType;
}

/**
 * Determine workflow based on request type
 */
function determineWorkflow(type: RequestType, hasUnknownTerms: boolean): WorkflowType {
  switch (type) {
    case "research":
      return "research-only";
    case "planning":
      return "planning-only";
    case "testing":
      return "testing-only";
    case "documentation":
      return "documentation-only";
    case "bugfix":
      return "quick-fix";
    case "development":
    case "hybrid":
      return "full-development";
    case "review":
      return "quick-fix";
    default:
      return hasUnknownTerms ? "full-development" : "research-only";
  }
}

/**
 * Determine research depth
 * M5 설정: 항상 comprehensive (사용자 선택)
 */
function determineResearchDepth(
  request: string,
  unknownTerms: string[],
  forceResearch: boolean
): "quick" | "moderate" | "comprehensive" {
  // M5 설정: 항상 comprehensive
  if (forceResearch) {
    return "comprehensive";
  }

  // 고유명사가 많으면 comprehensive
  if (unknownTerms.length >= 2) {
    return "comprehensive";
  }

  // 고유명사가 1개면 moderate
  if (unknownTerms.length === 1) {
    return "moderate";
  }

  // 없으면 quick
  return "quick";
}

/**
 * Extract intent from request
 */
function extractIntent(request: string, type: RequestType): string {
  // 간단한 의도 추출 (실제로는 더 정교한 NLP 필요)
  const cleanRequest = request
    .replace(/[""'']/g, '"')
    .trim();

  switch (type) {
    case "research":
      return `정보 조사: ${cleanRequest}`;
    case "planning":
      return `계획 수립: ${cleanRequest}`;
    case "development":
      return `개발 구현: ${cleanRequest}`;
    case "testing":
      return `테스트 수행: ${cleanRequest}`;
    case "documentation":
      return `문서 작성: ${cleanRequest}`;
    case "review":
      return `코드 검토: ${cleanRequest}`;
    case "bugfix":
      return `버그 수정: ${cleanRequest}`;
    case "hybrid":
      return `복합 작업: ${cleanRequest}`;
    default:
      return cleanRequest;
  }
}

/**
 * Calculate complexity
 */
function calculateComplexity(
  type: RequestType,
  unknownTerms: string[],
  requestLength: number
): "low" | "medium" | "high" {
  let score = 0;

  // Type-based scoring
  if (type === "development" || type === "hybrid") score += 2;
  else if (type === "planning" || type === "bugfix") score += 1;

  // Unknown terms increase complexity
  score += unknownTerms.length;

  // Long requests tend to be more complex
  if (requestLength > 100) score += 1;
  if (requestLength > 200) score += 1;

  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

/**
 * Determine completion level based on request type
 */
function determineCompletionLevel(
  type: RequestType,
  userSpecified?: CompletionLevel
): CompletionLevel {
  // 사용자가 명시적으로 지정한 경우 우선
  if (userSpecified) {
    return userSpecified;
  }

  // 요청 유형별 기본값
  switch (type) {
    case "research":
    case "planning":
    case "documentation":
      // 이 유형들은 완료 기준이 적용되지 않음
      return "with_tests"; // 기본값
    case "testing":
      return "with_tests"; // 테스트는 테스트 통과가 기본
    case "bugfix":
      return "with_tests"; // 버그 수정도 테스트 필수
    case "review":
      return "with_tests"; // 리뷰도 테스트 포함
    case "development":
    case "hybrid":
    default:
      return "with_tests"; // 일반 개발은 테스트 포함이 기본
  }
}

/**
 * Extract research topics from request
 */
function extractResearchTopics(request: string): string[] {
  const topics: string[] = [];

  // 고유명사 추출
  const properNouns = extractProperNouns(request);
  if (properNouns.length > 0) {
    topics.push(...properNouns.map(noun => `${noun} 기술 조사`));
  }

  // 기본 토픽 추가
  if (topics.length === 0) {
    topics.push("요구사항 분석");
  }

  // 기술 스택 조사는 항상 포함
  if (request.includes("만들어") || request.includes("구현") || request.includes("개발")) {
    topics.push("기술 스택 및 아키텍처 조사");
  }

  // 경쟁 서비스 분석 (서비스 개발인 경우)
  if (request.includes("서비스") || request.includes("앱") || request.includes("플랫폼")) {
    topics.push("유사 서비스 및 경쟁 분석");
  }

  return topics.slice(0, 3); // 최대 3개
}

/**
 * Build agent-specific prompt
 */
function buildAgentPrompt(agent: AgentType, request: string, taskDescription: string): string {
  const role = agentRoles[agent] || agent;
  return `# ${role} 작업 지시

## 원본 요청
${request}

## 할당된 작업
${taskDescription}

## 작업 지침
1. 할당된 작업 범위 내에서만 작업합니다.
2. TDD 원칙을 따릅니다 (테스트 먼저 작성).
3. 작업 완료 후 결과를 요약하여 보고합니다.
4. 불확실한 사항이 있으면 Captain에게 문의합니다.

## 산출물
작업 완료 시 다음을 포함하여 보고:
- 수정/생성한 파일 목록
- 주요 변경 사항 요약
- 테스트 결과 (해당하는 경우)
- 추가 작업 필요 여부`;
}

/**
 * Build DAG-based execution plan (v3)
 *
 * 핵심 원칙:
 * - 그룹 내 작업은 병렬 실행
 * - 그룹 간에는 waitForGroups로 의존성 관리
 * - Groot(테스트)는 IronMan/Natasha(개발) 완료 후에만 실행
 */
function buildExecutionPlan(
  workflow: WorkflowType,
  requiredAgents: AgentType[],
  request: string,
  unknownTerms: string[]
): ExecutionPlan {
  const groups: ExecutionGroup[] = [];
  let groupCounter = 1;
  let taskCounter = 1;

  // === 그룹 1: 리서치 (선행 없음, 병렬 가능) ===
  if (requiredAgents.includes("jarvis")) {
    const researchTopics = extractResearchTopics(request);
    const tasks: ExecutionTask[] = researchTopics.map((topic, i) => ({
      taskId: `T${taskCounter++}`,
      agent: "jarvis" as AgentType,
      role: agentRoles["jarvis"],
      description: topic,
      priority: "high" as const,
      prompt: buildAgentPrompt("jarvis", request, topic),
      context: {
        references: unknownTerms.length > 0 ? unknownTerms.map(t => `웹 검색: ${t}`) : []
      }
    }));

    groups.push({
      groupId: `G${groupCounter++}`,
      groupName: "리서치",
      waitForGroups: [],
      subagentType: "Explore",
      tasks
    });
  }

  // === 그룹 2: 기획 (리서치 완료 후) ===
  if (requiredAgents.includes("dr-strange")) {
    const prevGroupId = groups.length > 0 ? groups[groups.length - 1].groupId : null;
    groups.push({
      groupId: `G${groupCounter++}`,
      groupName: "기획",
      waitForGroups: prevGroupId ? [prevGroupId] : [],
      subagentType: "Plan",
      tasks: [{
        taskId: `T${taskCounter++}`,
        agent: "dr-strange",
        role: agentRoles["dr-strange"],
        description: "아키텍처 설계 및 작업 분배",
        priority: "high",
        prompt: buildAgentPrompt("dr-strange", request, "아키텍처 설계 및 세부 작업 계획 수립")
      }]
    });
  }

  // === 그룹 3: 개발 (기획 완료 후, IronMan + Natasha 병렬) ===
  // 중요: Groot는 여기에 포함하지 않음!
  if (workflow === "full-development" || workflow === "quick-fix") {
    const devAgents = requiredAgents.filter(a =>
      ["ironman", "natasha"].includes(a)
    );

    if (devAgents.length > 0) {
      const prevGroupId = groups.length > 0 ? groups[groups.length - 1].groupId : null;
      const devTasks: ExecutionTask[] = devAgents.map(agent => ({
        taskId: `T${taskCounter++}`,
        agent,
        role: agentRoles[agent],
        description: agent === "ironman" ? "프론트엔드 구현" : "백엔드 구현",
        priority: "high" as const,
        prompt: buildAgentPrompt(agent, request,
          agent === "ironman" ? "프론트엔드/UI 구현" : "백엔드/API 구현")
      }));

      groups.push({
        groupId: `G${groupCounter++}`,
        groupName: "개발",
        waitForGroups: prevGroupId ? [prevGroupId] : [],
        subagentType: "general-purpose",
        tasks: devTasks
      });
    }
  }

  // === 그룹 4: 테스트 (개발 완료 후 - Groot) ===
  // 핵심: 개발 그룹(IronMan + Natasha) 완료 후에만 실행!
  if (requiredAgents.includes("groot")) {
    const devGroup = groups.find(g => g.groupName === "개발");
    const waitFor = devGroup ? [devGroup.groupId] :
                    groups.length > 0 ? [groups[groups.length - 1].groupId] : [];

    groups.push({
      groupId: `G${groupCounter++}`,
      groupName: "테스트",
      waitForGroups: waitFor,
      subagentType: "general-purpose",
      tasks: [{
        taskId: `T${taskCounter++}`,
        agent: "groot",
        role: agentRoles["groot"],
        description: "단위/통합 테스트 작성 및 실행",
        priority: "high",
        prompt: buildAgentPrompt("groot", request, "테스트 코드 작성 및 실행, 커버리지 확인")
      }]
    });
  }

  // === 그룹 5: 문서화 (테스트 완료 후, 병렬 가능) ===
  if (requiredAgents.includes("vision")) {
    const prevGroupId = groups.length > 0 ? groups[groups.length - 1].groupId : null;
    const docTopics = ["README 작성/업데이트", "API 문서 생성", "아키텍처 문서 작성"];

    groups.push({
      groupId: `G${groupCounter++}`,
      groupName: "문서화",
      waitForGroups: prevGroupId ? [prevGroupId] : [],
      subagentType: "general-purpose",
      tasks: docTopics.map((topic, i) => ({
        taskId: `T${taskCounter++}`,
        agent: "vision" as AgentType,
        role: agentRoles["vision"],
        description: topic,
        priority: "medium" as const,
        prompt: buildAgentPrompt("vision", request, topic)
      }))
    });
  }

  return {
    enabled: groups.length > 0,
    groups
  };
}

/**
 * Main handler
 */
export async function handleAnalyzeRequest(args: Record<string, unknown>) {
  const params = args as unknown as AnalyzeParams;
  const { request, context, forceResearch = true, completionLevel, executionMode = "auto" } = params;

  if (!request || request.trim().length === 0) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "요청 내용이 비어있습니다.",
          suggestion: "분석할 요청 내용을 입력해주세요."
        }, null, 2)
      }],
      isError: true
    };
  }

  // Extract unknown terms (potential proper nouns)
  const unknownTerms = extractProperNouns(request);

  // Classify request type
  const type = classifyRequestType(request);

  // Determine workflow
  const workflow = determineWorkflow(type, unknownTerms.length > 0);
  const preset = WORKFLOW_PRESETS[workflow];

  // Determine research depth
  const researchDepth = determineResearchDepth(request, unknownTerms, forceResearch);

  // Calculate complexity
  const complexity = calculateComplexity(type, unknownTerms, request.length);

  // Extract intent
  const intent = extractIntent(request, type);

  // Determine completion level
  const determinedCompletionLevel = determineCompletionLevel(type, completionLevel);
  const suggestedCriteria = COMPLETION_CRITERIA_MAP[determinedCompletionLevel];

  // Determine execution mode
  let mode: "planning" | "execution";
  if (executionMode === "planning") {
    mode = "planning";
  } else if (executionMode === "execution") {
    mode = "execution";
  } else {
    // "auto"인 경우: 워크플로우 타입에 따라 자동 결정
    mode = (workflow === "research-only" || workflow === "planning-only")
      ? "planning"
      : "execution";
  }

  // Build DAG-based execution plan (v3)
  const executionPlan = buildExecutionPlan(workflow, preset.agents, request, unknownTerms);

  // Build analysis result
  const analysis: RequestAnalysis = {
    type,
    workflow,
    intent,
    requiredAgents: preset.agents,
    firstStep: preset.agents[0] === "jarvis" ? "jarvis-research" : `${preset.agents[0]}-action`,
    skipPhases: [1, 2, 3, 4, 5, 6, 7].filter(p => !preset.phases.includes(p)),
    researchRequired: preset.agents.includes("jarvis"),
    researchDepth,
    complexity,
    estimatedSteps: preset.phases.length,
    keywords: Object.entries(TYPE_KEYWORDS)
      .filter(([t]) => t === type)
      .flatMap(([, kw]) => kw)
      .filter(kw => request.toLowerCase().includes(kw.toLowerCase())),
    unknownTerms,
    confidence: unknownTerms.length > 0 ? 0.7 : 0.9,
    completionLevel: determinedCompletionLevel,
    suggestedCriteria,
    mode,
    executionPlan
  };

  // Build response message
  const message = buildAnalysisMessage(analysis, preset);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        analysis,
        message,
        nextAction: {
          tool: analysis.researchRequired
            ? "avengers_dispatch_agent"
            : "avengers_assign_task",
          params: analysis.researchRequired
            ? {
                agent: "jarvis",
                task: `리서치: ${unknownTerms.length > 0 ? unknownTerms.join(", ") : request}`,
                mode: "foreground",
                context: {
                  references: unknownTerms.map(term => `웹 검색: ${term}`)
                }
              }
            : {
                title: intent,
                assignee: preset.agents[0]
              }
        }
      }, null, 2)
    }]
  };
}

/**
 * Build human-readable analysis message
 */
function buildAnalysisMessage(analysis: RequestAnalysis, preset: WorkflowPreset): string {
  const lines: string[] = [
    `## 요청 분석 결과`,
    ``,
    `**유형**: ${analysis.type}`,
    `**워크플로우**: ${analysis.workflow} - ${preset.description}`,
    `**복잡도**: ${analysis.complexity}`,
    `**예상 단계**: ${analysis.estimatedSteps}개`,
    ``
  ];

  if (analysis.unknownTerms.length > 0) {
    lines.push(`**조사 필요 용어**: ${analysis.unknownTerms.join(", ")}`);
    lines.push(`**리서치 깊이**: ${analysis.researchDepth}`);
    lines.push(``);
  }

  lines.push(`**필요 에이전트**: ${analysis.requiredAgents.join(" → ")}`);
  lines.push(`**첫 번째 단계**: ${analysis.firstStep}`);

  if (analysis.skipPhases.length > 0) {
    lines.push(`**스킵 단계**: Phase ${analysis.skipPhases.join(", ")}`);
  }

  lines.push(``);
  lines.push(`**실행 모드**: ${analysis.mode === "planning" ? "계획 수립" : "전체 실행"}`);
  lines.push(`**완료 기준**: ${analysis.completionLevel}`);
  lines.push(`**권장 완료 항목**:`);
  analysis.suggestedCriteria.forEach(criteria => {
    lines.push(`  - ${criteria}`);
  });

  // DAG 기반 실행 계획 표시 (v3)
  if (analysis.executionPlan?.enabled) {
    lines.push(``);
    lines.push(`---`);
    lines.push(`## 실행 계획 (DAG 기반)`);
    lines.push(``);

    for (const group of analysis.executionPlan.groups) {
      const waitInfo = group.waitForGroups.length > 0
        ? ` (대기: ${group.waitForGroups.join(", ")} 완료 후)`
        : ` (즉시 실행)`;
      const parallelInfo = group.tasks.length > 1 ? ` [${group.tasks.length}개 병렬]` : "";

      lines.push(`### ${group.groupId}: ${group.groupName}${parallelInfo}${waitInfo}`);

      for (const task of group.tasks) {
        lines.push(`  - ${task.taskId}: ${task.agent} - ${task.description}`);
      }
      lines.push(``);
    }

    lines.push(`**총 그룹 수**: ${analysis.executionPlan.groups.length}개`);
    lines.push(`**총 작업 수**: ${analysis.executionPlan.groups.reduce((acc, g) => acc + g.tasks.length, 0)}개`);
  }

  lines.push(``);
  lines.push(`**신뢰도**: ${Math.round(analysis.confidence * 100)}%`);

  return lines.join("\n");
}
