'use client'

import MessageBubble from './messageBubble'
import LoadingIndicator from './loadingIndicator'

export interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function Messages({
  messages,
  isLoading,
}: {
  messages: Message[]
  isLoading: boolean
}) {
  return (
    <div className="flex-1 py-4 px-2 space-y-2">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  )
}
