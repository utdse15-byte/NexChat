import type { Message } from '../../domain/chat/types';

export default function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex w-full justify-end mb-6">
      <div className="max-w-[80%] bg-slate-800 rounded-2xl px-4 py-3 text-slate-100 whitespace-pre-wrap wrap-break-word">
        {message.content}
      </div>
    </div>
  );
}
