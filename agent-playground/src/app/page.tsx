import AgentCard from '@/components/agentCard/agentCard'
import PersonalChat from '@/components/personalChat/container'

export default function Home() {
  return (
    <div className="flex justify-center h-screen p-8">
      <AgentCard />
      <PersonalChat />
    </div>
  )
}
