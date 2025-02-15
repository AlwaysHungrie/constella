import { Message } from './messages'

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-sm px-4 py-2 rounded shadow-sm ${
          isUser ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <span
          className={`text-xs mt-1 block ${
            isUser ? 'text-emerald-100' : 'text-gray-500'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
