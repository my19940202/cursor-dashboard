Hook 事件
preToolUse
在执行任何工具之前调用。这是一个适用于所有工具类型（Shell、Read、Write、MCP、Task 等）的通用 hook。使用匹配器按特定工具进行过滤。


// Input
{
  "tool_name": "Shell",
  "tool_input": { "command": "npm install", "working_directory": "/project" },
  "tool_use_id": "abc123",
  "cwd": "/project",
  "model": "claude-sonnet-4-20250514",
  "agent_message": "Installing dependencies..."
}
// Output
{
  "permission": "allow" | "deny",
  "user_message": "<message shown in client when denied>",
  "agent_message": "<message sent to agent when denied>",
  "updated_input": { "command": "npm ci" }
}
Output Field	Type	Description
permission	string	"allow" 用于继续，"deny" 用于阻止。"ask" 可被 schema 接受，但目前不会对 preToolUse 强制执行。
user_message	string (optional)	当操作被拒绝时显示给用户的消息
agent_message	string (optional)	当操作被拒绝时反馈给 Agent 的消息
updated_input	object (optional)	要使用的修改后工具输入
postToolUse
在工具成功执行后调用。可用于审计、分析以及注入上下文。


// 输入
{
  "tool_name": "Shell",
  "tool_input": { "command": "npm test" },
  "tool_output": "{\"exitCode\":0,\"stdout\":\"All tests passed\"}",
  "tool_use_id": "abc123",
  "cwd": "/project",
  "duration": 5432,
  "model": "claude-sonnet-4-20250514"
}
// 输出
{
  "updated_mcp_tool_output": { "modified": "output" },
  "additional_context": "Test coverage report attached."
}
输入字段	类型	描述
duration	number	执行时间 (毫秒)
tool_output	string	工具返回结果负载的 JSON 字符串 (不是原始终端文本)
输出字段	类型	描述
updated_mcp_tool_output	object (optional)	仅适用于 MCP 工具：替换模型看到的工具输出
additional_context	string (optional)	工具结果后注入到对话中的额外上下文信息
postToolUseFailure
当工具失败、超时或被拒绝时触发。可用于错误跟踪和恢复逻辑。


// 输入
{
  "tool_name": "Shell",
  "tool_input": { "command": "npm test" },
  "tool_use_id": "abc123",
  "cwd": "/project",
  "error_message": "Command timed out after 30s",
  "failure_type": "timeout" | "error" | "permission_denied",
  "duration": 5000,
  "is_interrupt": false
}
// 输出
{
  // 当前不支持输出字段
}
Input Field	Type	Description
error_message	string	失败描述
failure_type	string	失败类型："error"、"timeout" 或 "permission_denied"
duration	number	失败发生前经过的毫秒数
is_interrupt	boolean	此失败是否由用户中断或取消操作导致
subagentStart
在启动子代理 (Task 工具) 前调用。可允许或阻止创建子代理。


// 输入
{
  "subagent_id": "abc-123",
  "subagent_type": "generalPurpose",
  "task": "Explore the authentication flow",
  "parent_conversation_id": "conv-456",
  "tool_call_id": "tc-789",
  "subagent_model": "claude-sonnet-4-20250514",
  "is_parallel_worker": false,
  "git_branch": "feature/auth"
}
// 输出
{
  "permission": "allow" | "deny",
  "user_message": "<message shown when denied>"
}
输入字段	类型	描述
subagent_id	string	此子代理实例的唯一标识符
subagent_type	string	子代理类型：generalPurpose、explore、shell 等。
task	string	分配给子代理的任务描述
parent_conversation_id	string	父级代理会话的对话 ID
tool_call_id	string	触发该子代理的工具调用 ID
subagent_model	string	子代理将使用的模型
is_parallel_worker	boolean	此子代理是否作为并行工作线程运行
git_branch	string (optional)	子代理要操作的 Git 分支 (如适用)
输出字段	类型	描述
permission	string	"allow" 表示继续，"deny" 表示阻止。subagentStart 不支持 "ask"，并将其视为 "deny"。
user_message	string (optional)	子代理被拒绝时向用户显示的消息
subagentStop
在子代理完成、出错或被中止时调用。可触发后续操作。


// Input
{
  "subagent_type": "generalPurpose",
  "status": "completed" | "error" | "aborted",
  "task": "Explore the authentication flow",
  "description": "Exploring auth flow",
  "summary": "<subagent output summary>",
  "duration_ms": 45000,
  "message_count": 12,
  "tool_call_count": 8,
  "loop_count": 0,
  "modified_files": ["src/auth.ts"],
  "agent_transcript_path": "/path/to/subagent/transcript.txt"
}
// Output
{
  "followup_message": "<auto-continue with this message>"
}
Input Field	Type	Description
subagent_type	string	子代理类型：generalPurpose、explore、shell 等。
status	string	"completed"、"error" 或 "aborted"
task	string	传递给子代理的任务描述
description	string	对子代理用途的简要说明
summary	string	子代理的输出摘要
duration_ms	number	执行时长（毫秒）
message_count	number	子代理会话期间交换的消息数
tool_call_count	number	子代理发起的工具调用次数
loop_count	number	此子代理已触发 subagentStop 后续操作的次数（从 0 开始）
modified_files	string[]	子代理修改过的文件
agent_transcript_path	string | null	子代理自身会话记录文件的路径（与父对话分开）
Output Field	Type	Description
followup_message	string (optional)	使用此消息自动继续。仅当 status 为 "completed" 时才会处理。
followup_message 字段支持循环式流程：子代理完成后会触发下一轮迭代。后续消息与 stop hook 一样，受相同的可配置循环上限约束（默认值为 5，可通过 loop_limit 配置）。

beforeShellExecution / beforeMCPExecution
在执行任何 shell 命令或 MCP 工具之前调用。返回一个权限判定结果。

默认情况下，如果 hook 失败 (崩溃、超时、无效 JSON)，操作仍会被允许继续执行 (失败即放行，fail-open)。如果希望在失败时改为阻止该操作，请在 hook 定义中设置 failClosed: true。对于安全性要求较高的 beforeMCPExecution hook，建议这样设置。


// beforeShellExecution 输入
{
  "command": "<full terminal command>",
  "cwd": "<current working directory>",
  "sandbox": false
}
// beforeMCPExecution 输入
{
  "tool_name": "<tool name>",
  "tool_input": "<json params>"
}
// 加上以下之一：
{ "url": "<server url>" }
// 或：
{ "command": "<command string>" }
// 输出
{
  "permission": "allow" | "deny" | "ask",
  "user_message": "<message shown in client>",
  "agent_message": "<message sent to agent>"
}
afterShellExecution
在 shell 命令执行后触发；可用于审计或从命令输出中收集指标。


// 输入
{
  "command": "<full terminal command>",
  "output": "<full terminal output>",
  "duration": 1234,
  "sandbox": false
}
字段	类型	描述
command	string	执行的完整终端命令
output	string	从终端捕获的完整输出
duration	number	执行该 shell 命令所用的时间 (毫秒) ，不包括等待审批的时间
sandbox	boolean	该命令是否在沙盒环境中运行
afterMCPExecution
在 MCP 工具执行后触发，并包含该工具的输入参数和完整的 JSON 结果。


// 输入
{
  "tool_name": "<tool name>",
  "tool_input": "<json params>",
  "result_json": "<tool result json>",
  "duration": 1234
}
字段	类型	描述
tool_name	string	执行的 MCP 工具名称
tool_input	string	传递给该工具的 JSON 参数字符串
result_json	string	工具响应结果的 JSON 字符串
duration	number	工具执行耗时 (毫秒) ，不包括等待审批的时间
afterFileEdit
在 Agent 完成文件编辑后触发；适用于格式化工具或统计 Agent 编写的代码。


// 输入
{
  "file_path": "<absolute path>",
  "edits": [{ "old_string": "<search>", "new_string": "<replace>" }]
}
beforeReadFile
在 Agent 读取文件之前调用。用于进行访问控制，防止将敏感文件发送给模型。

默认情况下，beforeReadFile hook 失败（崩溃、超时、无效 JSON）时会记录日志，并允许继续读取。若要在失败时改为阻止读取，请在 hook 定义中设置 failClosed: true。


// Input
{
  "file_path": "<absolute path>",
  "content": "<file contents>",
  "attachments": [
    {
      "type": "file" | "rule",
      "file_path": "<absolute path>"
    }
  ]
}
// Output
{
  "permission": "allow" | "deny",
  "user_message": "<message shown when denied>"
}
Input Field	Type	描述
file_path	string	将要读取的文件的绝对路径
content	string	文件的完整内容
attachments	array	与提示关联的上下文附件。每个条目都包含一个 type（"file" 或 "rule"）和一个 file_path。
Output Field	Type	描述
permission	string	"allow" 表示继续，"deny" 表示阻止
user_message	string (optional)	被拒绝时向用户显示的消息
beforeTabFileRead
在 Tab (内联补全) 读取文件之前调用。在 Tab 访问文件内容前启用脱敏或访问控制。

与 beforeReadFile 的主要区别：

只会被 Tab 触发，不会被 Agent 触发
不包含 attachments 字段 (Tab 不使用 prompt 附件)
可用于对 Tab 的自主操作应用不同策略

// 输入
{
  "file_path": "<absolute path>",
  "content": "<file contents>"
}
// 输出
{
  "permission": "allow" | "deny"
}
afterTabFileEdit
在 Tab (内联补全) 编辑文件后调用。可用于对 Tab 生成的代码进行格式化或审计。

与 afterFileEdit 的主要区别：

仅由 Tab 触发，不会被 Agent 触发
包含详细的编辑信息：range、old_line 和 new_line，便于精确追踪编辑
适用于对 Tab 所做编辑进行细粒度的格式化或分析

// 输入
{
  "file_path": "<absolute path>",
  "edits": [
    {
      "old_string": "<search>",
      "new_string": "<replace>",
      "range": {
        "start_line_number": 10,
        "start_column": 5,
        "end_line_number": 10,
        "end_column": 20
      },
      "old_line": "<line before edit>",
      "new_line": "<line after edit>"
    }
  ]
}
// 输出
{
  // 当前不支持任何输出字段
}
beforeSubmitPrompt
在用户点击发送后、发起后端请求之前立即调用。可用于阻止提交。


// 输入
{
  "prompt": "<user prompt text>",
  "attachments": [
    {
      "type": "file" | "rule",
      "file_path": "<absolute path>"
    }
  ]
}
// 输出
{
  "continue": true | false,
  "user_message": "<message shown to user when blocked>"
}
输出字段	类型	描述
continue	boolean	是否允许提示词提交继续进行
user_message	string (optional)	当提示词被阻止时向用户显示的消息
afterAgentResponse
当 agent 完成一条 assistant 消息后被调用。


// Input
{
  "text": "<assistant final text>"
}
afterAgentThought
在 Agent 完成一个思考阶段后被调用。可用于观察 Agent 的推理过程。


// 输入
{
  "text": "<fully aggregated thinking text>",
  "duration_ms": 5000
}
// 输出
{
  // 当前不支持任何输出字段
}
字段	类型	描述
text	string	已完成思考区块的完整汇总文本
duration_ms	number (optional)	思考区块的持续时间 (毫秒)
stop
在 agent 循环结束时触发。可以选择自动提交一条后续用户消息，以继续迭代。


// Input
{
  "status": "completed" | "aborted" | "error",
  "loop_count": 0
}

// Output
{
  "followup_message": "<message text>"
}
可选字段 followup_message 为字符串。当提供且非空时，Cursor 会自动将其作为下一条用户消息提交，可用于实现循环式流程（例如持续迭代直到达成目标）。
loop_count 字段表示在当前会话中，stop hook 已触发自动后续消息的次数（从 0 开始计数）。默认限制为每个脚本最多 5 次自动后续，可通过 loop_limit 选项配置。将 loop_limit 设为 null 可移除此上限。相同的限制也适用于 subagentStop 后续消息。
sessionStart
在创建新的 composer 会话时调用。此 hook 以 fire-and-forget 方式运行；agent 循环不会等待其完成，也不会强制要求阻塞式响应。使用此 hook 来设置会话专属环境变量或注入额外上下文。


// Input
{
  "session_id": "<unique session identifier>",
  "is_background_agent": true | false,
  "composer_mode": "agent" | "ask" | "edit"
}

// Output
{
  "env": { "<key>": "<value>" },
  "additional_context": "<context to add to conversation>"
}
Input Field	Type	描述
session_id	string	此会话的唯一标识符（与 conversation_id 相同）
is_background_agent	boolean	表示该会话是后台 agent 会话还是交互式会话
composer_mode	string (optional)	composer 启动时的模式（例如 "agent"、"ask"、"edit"）
Output Field	Type	描述
env	object (optional)	为此会话设置的环境变量，对后续所有 hook 的执行均可用
additional_context	string (optional)	要添加到会话初始系统上下文中的额外上下文
The schema also accepts continue and user_message fields, but current callers do not enforce them. Session creation is not blocked even when continue is false.

sessionEnd
在 composer 会话结束时调用。此钩子为 fire-and-forget 类型，适合用于日志记录、分析或清理任务。响应会被记录但不会被使用。


// 输入
{
  "session_id": "<unique session identifier>",
  "reason": "completed" | "aborted" | "error" | "window_close" | "user_close",
  "duration_ms": 45000,
  "is_background_agent": true | false,
  "final_status": "<status string>",
  "error_message": "<error details if reason is 'error'>"
}

// 输出
{
  // 无输出字段 - 即发即忘
}
Input Field	Type	Description
session_id	string	即将结束的会话的唯一标识符
reason	string	会话的结束方式："completed"、"aborted"、"error"、"window_close" 或 "user_close"
duration_ms	number	会话的总持续时间 (毫秒)
is_background_agent	boolean	该会话是否为后台 agent 会话
final_status	string	会话的最终状态
error_message	string (optional)	当 reason 为 "error" 时的错误信息
preCompact
在上下文窗口进行压缩/汇总之前调用。这是一个仅用于观察的 hook，不能阻塞或修改压缩行为。可用于记录压缩发生的时间或通知用户。


// 输入
{
  "trigger": "auto" | "manual",
  "context_usage_percent": 85,
  "context_tokens": 120000,
  "context_window_size": 128000,
  "message_count": 45,
  "messages_to_compact": 30,
  "is_first_compaction": true | false
}

// 输出
{
  "user_message": "<message to show when compaction occurs>"
}
输入字段	类型	说明
trigger	string	触发压缩的方式："auto" 或 "manual"
context_usage_percent	number	当前上下文窗口的使用百分比 (0-100)
context_tokens	number	当前上下文窗口中的 token 数
context_window_size	number	最大上下文窗口大小 (按 token 计)
message_count	number	会话中的消息数量
messages_to_compact	number	将要被压缩的消息数量
is_first_compaction	boolean	此会话是否为首次执行压缩
输出字段	类型	说明
user_message	string (optional)	发生压缩时展示给用户的消息