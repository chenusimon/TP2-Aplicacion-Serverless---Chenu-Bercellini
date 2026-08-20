import type { FormEvent, KeyboardEvent, RefObject } from "react";
import type { Message } from "@/backend/model";
import { Icon } from "./Icon";

const suggestions = [
  "Explain a difficult topic",
  "Help me brainstorm ideas",
  "Review some code",
  "Create a study plan",
];

type ConversationPanelProps = {
  messages: Message[];
  prompt: string;
  loading: boolean;
  sending: boolean;
  error: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onPromptChange: (prompt: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ConversationPanel({
  messages,
  prompt,
  loading,
  sending,
  error,
  messagesEndRef,
  onPromptChange,
  onSubmit,
}: ConversationPanelProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {loading ? (
        <div className="grid flex-1 place-items-center text-sm text-black/40">Loading messages...</div>
      ) : messages.length === 0 ? (
        <EmptyConversation onSelectSuggestion={onPromptChange} />
      ) : (
        <MessageList messages={messages} sending={sending} messagesEndRef={messagesEndRef} />
      )}

      <div className="sticky bottom-0 bg-gradient-to-t from-[#f8f8f6] via-[#f8f8f6] to-transparent px-4 pb-4 pt-8 sm:px-8 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          {error && <p role="alert" className="mb-2 text-center text-sm text-red-700">{error}</p>}
          <form onSubmit={onSubmit} className="flex min-h-16 items-end gap-3 rounded-[22px] border border-black/10 bg-white p-2 pl-5 shadow-[0_8px_30px_rgba(0,0,0,0.07)]">
            <textarea
              aria-label="Message"
              placeholder="Message Askly"
              rows={1}
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending || loading}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-3 text-[15px] leading-5 outline-none placeholder:text-black/35 disabled:opacity-50"
            />
            <button type="submit" aria-label="Send message" disabled={sending || !prompt.trim()} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#20201f] text-white hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40">
              <Icon name="send" />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-black/35">Askly can make mistakes. Check important information.</p>
        </div>
      </div>
    </div>
  );
}

function EmptyConversation({ onSelectSuggestion }: { onSelectSuggestion: (suggestion: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12 sm:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-[#20201f] text-lg font-semibold text-white shadow-lg shadow-black/10">A</div>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">What can I help you with?</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">Start a new conversation, ask a question, or continue one of your recent chats.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onSelectSuggestion(suggestion)} className="rounded-2xl border border-black/8 bg-white p-4 text-left text-sm text-black/65 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/15 hover:text-black">
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

type MessageListProps = {
  messages: Message[];
  sending: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

function MessageList({ messages, sending, messagesEndRef }: MessageListProps) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-7 px-5 py-10 sm:px-8">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.role === "user" ? (
            <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-[#e7e7e2] px-4 py-3 text-[15px] leading-6 sm:max-w-[75%]">{message.content}</div>
          ) : (
            <div className="flex max-w-full items-start gap-3 sm:max-w-[90%]">
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#20201f] text-xs font-semibold text-white">A</div>
              <div className="whitespace-pre-wrap py-1 text-[15px] leading-7">{message.content}</div>
            </div>
          )}
        </div>
      ))}
      {sending && messages.at(-1)?.role === "user" && (
        <div className="flex items-start gap-3 text-black/45">
          <div className="grid size-8 place-items-center rounded-xl bg-[#20201f] text-xs font-semibold text-white">A</div>
          <p className="py-1 text-sm">Thinking...</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
