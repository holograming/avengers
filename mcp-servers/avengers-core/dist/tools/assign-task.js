/**
 * Assign Task Tool
 *
 * 새로운 태스크를 생성하고 에이전트에게 할당합니다.
 */
import { globalState } from "../index.js";
export const assignTaskTool = {
    name: "avengers_assign_task",
    description: "Create and assign a new task. Use for tracking work items and their status. Tasks can be assigned to agents or left unassigned for later.",
    inputSchema: {
        type: "object",
        properties: {
            title: {
                type: "string",
                description: "Short title of the task"
            },
            description: {
                type: "string",
                description: "Detailed description of the task"
            },
            assignee: {
                type: "string",
                description: "Agent to assign (optional)"
            },
            priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
                default: "medium"
            },
            dependencies: {
                type: "array",
                items: { type: "string" },
                description: "Task IDs that must complete before this one"
            },
            acceptanceCriteria: {
                type: "array",
                items: { type: "string" },
                description: "Acceptance criteria for task completion"
            },
            completionLevel: {
                type: "string",
                enum: ["code_only", "with_tests", "with_execution", "with_docs"],
                description: "Completion level specification (default: with_tests)"
            }
        },
        required: ["title"]
    }
};
export async function handleAssignTask(args) {
    const { title, description, assignee, priority, dependencies, acceptanceCriteria, completionLevel } = args;
    // 담당자 유효성 검사
    if (assignee && !globalState.agents.has(assignee)) {
        return {
            content: [{ type: "text", text: `Unknown agent: ${assignee}` }],
            isError: true,
        };
    }
    // 의존성 확인
    if (dependencies) {
        for (const dep of dependencies) {
            if (!globalState.tasks.has(dep)) {
                return {
                    content: [{ type: "text", text: `Unknown dependency task: ${dep}` }],
                    isError: true,
                };
            }
        }
        // 의존성 미완료 확인
        const pendingDeps = dependencies.filter(dep => {
            const task = globalState.tasks.get(dep);
            return task && task.status !== "completed";
        });
        if (pendingDeps.length > 0) {
            // 태스크는 생성하지만 blocked 상태로
        }
    }
    // 태스크 생성
    const taskId = `T${String(++globalState.taskCounter).padStart(3, "0")}`;
    const task = {
        id: taskId,
        title,
        assignee,
        status: assignee ? "in_progress" : "pending",
    };
    globalState.tasks.set(taskId, task);
    // 담당자 상태 업데이트
    if (assignee) {
        const agentState = globalState.agents.get(assignee);
        if (agentState && agentState.status === "idle") {
            globalState.agents.set(assignee, {
                ...agentState,
                status: "working",
                currentTask: taskId,
            });
        }
    }
    return {
        content: [{
                type: "text",
                text: JSON.stringify({
                    message: "Task created successfully",
                    task: {
                        id: taskId,
                        title,
                        description: description || "(no description)",
                        assignee: assignee || "(unassigned)",
                        priority: priority || "medium",
                        status: task.status,
                        dependencies: dependencies || [],
                        acceptanceCriteria: acceptanceCriteria || [],
                        completionLevel: completionLevel || "with_tests"
                    }
                }, null, 2)
            }],
    };
}
