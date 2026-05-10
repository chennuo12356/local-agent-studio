import { createRuntime } from "@local-agent/runtime";
import type { Conversation, ConversationTurn, TraceStep } from "@local-agent/shared";
import {
  Bot,
  CalendarClock,
  ChevronDown,
  Folder,
  List,
  type LucideIcon,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles
} from "lucide-react";
import {
  createElement,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  appendUserMessage,
  applyTraceEvent,
  createEmptyConversationState,
  type ConversationState
} from "./conversation-reducer";
import { createLocalConversationStore } from "./conversation-store";

const runtime = createRuntime();
const store = createLocalConversationStore();

export function App(): ReactElement {
  const [state, setState] = useState<ConversationState>(() => {
    const loadedState = store.load();
    return loadedState.conversations.length > 0
      ? loadedState
      : createEmptyConversationState();
  });
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const currentConversation = useMemo(
    () =>
      state.conversations.find(
        (conversation) => conversation.id === state.currentConversationId
      ),
    [state]
  );
  const latestTurn = currentConversation?.turns.at(-1);

  useEffect(() => {
    store.save(state);
  }, [state]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isStreaming) {
      return;
    }

    const timestamp = Date.now();
    const createdAt = new Date(timestamp).toISOString();
    const conversationId = currentConversation?.id ?? `conversation-${timestamp}`;
    const userMessageId = `message-user-${timestamp}`;
    const assistantMessageId = `message-assistant-${timestamp}`;
    const nextState = appendUserMessage(state, trimmedPrompt, {
      conversationId,
      messageId: userMessageId,
      createdAt
    });

    setState(nextState);
    setPrompt("");
    setIsStreaming(true);

    let streamingState = nextState;
    try {
      for await (const traceEvent of runtime.runConversationTurn({
        conversationId,
        userMessageId,
        assistantMessageId,
        prompt: trimmedPrompt,
        selectedAgent: "planner"
      })) {
        streamingState = applyTraceEvent(streamingState, traceEvent);
        setState(streamingState);
      }
    } finally {
      setIsStreaming(false);
    }
  }

  function startNewConversation() {
    setState({ ...state, currentConversationId: undefined });
    setPrompt("");
  }

  return createElement(
    "main",
    { className: "flex min-h-screen bg-studio-bg text-studio-ink" },
    createElement(Sidebar, {
      conversations: state.conversations,
      currentConversationId: state.currentConversationId,
      onNewConversation: startNewConversation,
      onSelectConversation: (conversationId: string) =>
        setState({ ...state, currentConversationId: conversationId })
    }),
    createElement(
      "section",
      { className: "flex min-w-0 flex-1 flex-col" },
      createElement(TopBar),
      currentConversation
        ? createElement(ConversationView, {
            conversation: currentConversation,
            prompt,
            isStreaming,
            onPromptChange: setPrompt,
            onSubmit: sendMessage
          })
        : createElement(HomeComposer, {
            prompt,
            isStreaming,
            onPromptChange: setPrompt,
            onSubmit: sendMessage
          })
    ),
    createElement(TracePanel, { turn: latestTurn })
  );
}

function Sidebar(props: {
  conversations: Conversation[];
  currentConversationId?: string;
  onNewConversation(): void;
  onSelectConversation(conversationId: string): void;
}): ReactElement {
  return createElement(
    "aside",
    {
      className:
        "hidden w-80 shrink-0 flex-col border-r border-studio-line bg-[#eef1f5] p-5 md:flex"
    },
    createElement(
      "div",
      { className: "mb-7 flex items-center gap-3" },
      createElement(
        "div",
        {
          className:
            "flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white"
        },
        createElement(Sparkles, { size: 22 })
      ),
      createElement("strong", { className: "text-2xl" }, "AgentStudio")
    ),
    createElement(
      "nav",
      { className: "grid gap-2 border-b border-studio-line pb-5" },
      createElement(SidebarButton, {
        icon: Plus,
        label: "新会话",
        onClick: props.onNewConversation
      }),
      createElement(SidebarButton, { icon: Search, label: "搜索" }),
      createElement(SidebarButton, { icon: CalendarClock, label: "定时任务" })
    ),
    createElement(
      "div",
      {
        className:
          "mt-5 flex items-center justify-between text-sm font-semibold text-studio-muted"
      },
      createElement("span", null, "会话"),
      createElement(List, { size: 18 })
    ),
    createElement(
      "div",
      { className: "mt-3 grid gap-2 overflow-y-auto" },
      props.conversations.length === 0
        ? createElement(
            "p",
            { className: "mt-24 text-center text-sm text-studio-muted" },
            "暂无对话历史"
          )
        : props.conversations.map((conversation) =>
            createElement(
              "button",
              {
                key: conversation.id,
                type: "button",
                onClick: () => props.onSelectConversation(conversation.id),
                className: `truncate rounded-lg px-3 py-2 text-left text-sm ${
                  conversation.id === props.currentConversationId
                    ? "bg-white font-semibold shadow-sm"
                    : "text-studio-muted hover:bg-white/70"
                }`
              },
              conversation.title
            )
          )
    ),
    createElement(
      "div",
      { className: "mt-auto" },
      createElement(SidebarButton, { icon: Settings, label: "设置" })
    )
  );
}

function SidebarButton(props: {
  icon: LucideIcon;
  label: string;
  onClick?(): void;
}): ReactElement {
  return createElement(
    "button",
    {
      type: "button",
      onClick: props.onClick,
      className:
        "flex items-center gap-3 rounded-lg px-2 py-2 text-left font-semibold hover:bg-white/70"
    },
    createElement(props.icon, { size: 22 }),
    createElement("span", null, props.label)
  );
}

function TopBar(): ReactElement {
  return createElement(
    "header",
    {
      className:
        "relative flex h-16 items-center justify-center border-b border-studio-line bg-studio-bg"
    },
    createElement("strong", null, "Agent Studio"),
    createElement(
      "button",
      {
        type: "button",
        className:
          "absolute right-5 rounded-xl border border-studio-line bg-white px-4 py-2 text-sm font-semibold shadow-sm"
      },
      "Skills Market"
    )
  );
}

type ComposerProps = {
  prompt: string;
  isStreaming: boolean;
  onPromptChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
};

function HomeComposer(props: ComposerProps): ReactElement {
  return createElement(
    "div",
    { className: "flex flex-1 items-center justify-center px-6" },
    createElement(
      "div",
      { className: "w-full max-w-4xl" },
      createElement(
        "h1",
        { className: "mb-6 text-center text-3xl font-bold" },
        "Hi，今天有什么安排？"
      ),
      createElement(
        "div",
        { className: "mb-7 flex justify-center" },
        createElement(
          "div",
          {
            className:
              "flex items-center gap-3 rounded-full bg-[#e8ebf6] p-2 text-sm font-semibold"
          },
          createElement("span", { className: "rounded-full bg-white px-4 py-2" }, "Agent CLI"),
          createElement(Sparkles, { size: 18, className: "text-studio-accent" }),
          createElement(Plus, { size: 18 })
        )
      ),
      createElement(Composer, props),
      createElement(
        "div",
        { className: "mt-5 flex flex-wrap justify-center gap-3 text-sm text-slate-600" },
        ["故事角色扮演", "Beautiful Mermaid", "学术论文助手", "Excel 表格助手", "Word 文档助手"].map(
          (item) =>
            createElement(
              "span",
              {
                key: item,
                className:
                  "rounded-full border border-studio-line bg-white px-4 py-2 shadow-sm"
              },
              item
            )
        )
      )
    )
  );
}

function Composer(props: ComposerProps): ReactElement {
  return createElement(
    "form",
    {
      onSubmit: props.onSubmit,
      className:
        "rounded-2xl border border-[#d8dcff] bg-white p-4 shadow-[0_18px_60px_rgba(124,140,255,0.14)]"
    },
    createElement("textarea", {
      "aria-label": "发送消息",
      value: props.prompt,
      onChange: (event: ChangeEvent<HTMLTextAreaElement>) =>
        props.onPromptChange(event.currentTarget.value),
      placeholder: "发消息、上传文件、打开文件夹或创建定时任务...",
      className:
        "min-h-24 w-full resize-none border-0 bg-transparent text-lg outline-none placeholder:text-slate-400",
      disabled: props.isStreaming
    }),
    createElement(
      "div",
      { className: "flex items-center gap-5 text-sm text-slate-500" },
      createElement(Plus, { size: 18 }),
      createElement(
        "span",
        { className: "flex items-center gap-2" },
        createElement(Folder, { size: 18 }),
        "关联文件夹"
      ),
      createElement(
        "span",
        { className: "flex items-center gap-2" },
        createElement(Bot, { size: 18 }),
        "默认模型",
        createElement(ChevronDown, { size: 14 })
      ),
      createElement(
        "span",
        { className: "flex items-center gap-2" },
        createElement(Shield, { size: 18 }),
        "权限 · 默认",
        createElement(ChevronDown, { size: 14 })
      ),
      createElement(
        "button",
        {
          type: "submit",
          disabled: props.isStreaming,
          className:
            "ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#e2e5ef] text-slate-500 disabled:opacity-60",
          "aria-label": "发送"
        },
        createElement(Send, { size: 18 })
      )
    )
  );
}

function ConversationView(props: {
  conversation: Conversation;
  prompt: string;
  isStreaming: boolean;
  onPromptChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}): ReactElement {
  return createElement(
    "div",
    { className: "mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-6 py-6" },
    createElement("h1", { className: "mb-4 truncate text-xl font-bold" }, props.conversation.title),
    createElement(
      "div",
      { className: "flex-1 space-y-4 overflow-y-auto pb-5" },
      props.conversation.messages.map((message) =>
        createElement(
          "div",
          {
            key: message.id,
            className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`
          },
          createElement(
            "div",
            {
              className: `max-w-[78%] rounded-2xl px-4 py-3 leading-7 ${
                message.role === "user"
                  ? "bg-black text-white"
                  : "border border-studio-line bg-white text-studio-ink shadow-sm"
              }`
            },
            message.content || "正在思考..."
          )
        )
      )
    ),
    createElement(Composer, {
      prompt: props.prompt,
      isStreaming: props.isStreaming,
      onPromptChange: props.onPromptChange,
      onSubmit: props.onSubmit
    })
  );
}

function TracePanel(props: { turn?: ConversationTurn }): ReactElement {
  return createElement(
    "aside",
    { className: "hidden w-96 shrink-0 border-l border-studio-line bg-white p-5 xl:block" },
    createElement("h2", { className: "mb-4 text-lg font-bold" }, "调用流程"),
    props.turn
      ? createElement(
          "div",
          { className: "space-y-3" },
          props.turn.trace.map((step) =>
            createElement(TraceTimelineItem, { key: step.id, step })
          )
        )
      : createElement(
          "p",
          { className: "mt-20 text-center text-sm text-studio-muted" },
          "发送消息后显示 agent 和工具链调用过程"
        )
  );
}

function TraceTimelineItem(props: { step: TraceStep }): ReactElement {
  return createElement(
    "details",
    { className: "rounded-lg border border-studio-line bg-studio-bg p-3" },
    createElement(
      "summary",
      { className: "cursor-pointer list-none font-semibold" },
      props.step.title
    ),
    createElement(
      "dl",
      { className: "mt-3 grid gap-2 text-xs text-slate-600" },
      createElement("div", null, "状态：", props.step.status),
      props.step.riskLevel
        ? createElement("div", null, "风险：", props.step.riskLevel)
        : null,
      props.step.policyDecision
        ? createElement("div", null, "策略：", props.step.policyDecision)
        : null,
      props.step.input
        ? createElement(
            "pre",
            { className: "overflow-auto rounded bg-white p-2" },
            JSON.stringify(props.step.input, null, 2)
          )
        : null,
      props.step.output
        ? createElement(
            "pre",
            { className: "overflow-auto rounded bg-white p-2" },
            JSON.stringify(props.step.output, null, 2)
          )
        : null
    )
  );
}
