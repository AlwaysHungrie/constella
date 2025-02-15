import { LuSend } from "react-icons/lu"

export interface InputAreaProps {
  inputMessage: string
  setInputMessage: (message: string) => void
  handleSendMessage: () => void
  isLoading: boolean
}

export default function InputArea({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoading,
}: InputAreaProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="border-t border-gray-200 p-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-gray-50 text-gray-900 rounded border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="p-2 text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded transition-colors disabled:text-emerald-400 disabled:hover:text-emerald-400"
          aria-label="Send message"
        >
          <LuSend size={18} />
        </button>
      </div>
    </div>
  )
}
