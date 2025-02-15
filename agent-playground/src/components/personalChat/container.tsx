'use client'

import { useRef, useState } from 'react'
import Messages, { Message } from './messages'
import InputArea from './inputArea'
import LoadingIndicator from './loadingIndicator'
import MessageBubble from './messageBubble'

export default function Container() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello, how are you?',
      sender: 'bot',
      timestamp: new Date(),
    },
    {
      id: '2',
      content: 'I am fine, thank you!',
      sender: 'user',
      timestamp: new Date(),
    },
    {
      id: '3',
      content: 'What is your name?',
      sender: 'bot',
      timestamp: new Date(),
    },
    {
      id: '4',
      content: 'My name is John Doe.',
      sender: 'user',
      timestamp: new Date(),
    },

  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const simulateBotReply = async () => {
    // Simulate a delay between 1-2 seconds
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000)
    )

    const botMessage: Message = {
      id: Date.now().toString(),
      content: `Received: "${inputMessage}"`,
      sender: 'bot',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, botMessage])
    setIsLoading(false)
  }

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputMessage,
        sender: 'user',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputMessage('')
      setIsLoading(true)
      simulateBotReply()
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-pink-300">
      <div
        className="flex overflow-y-auto flex-col flex-1 w-full"
        ref={scrollRef}
      >
        <div className="flex flex-col w-full max-w-xl mx-auto bg-white min-h-full">
          {/* <Messages messages={messages} isLoading={isLoading} /> */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && <LoadingIndicator />}
        </div>
      </div>
      <div className="flex flex-col w-full max-w-xl mx-auto bg-white">
        <InputArea
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
