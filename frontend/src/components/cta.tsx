'use client'

export default function CTAButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mx-auto w-full px-2 whitespace-nowrap sm:px-4 text-[#05D505] cursor-pointer text-sm mt-auto p-2 rounded-md border border-[#004400] bg-[#001800] hover:bg-[#05D505] hover:text-[#001800] transition-all duration-300 ease-in-out text-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

