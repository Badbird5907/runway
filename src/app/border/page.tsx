export default function BorderPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="flex flex-col gap-8">
        {/* Title */}
        <h1 className="text-2xl text-white">Border Side Colors</h1>
        
        {/* Border examples container */}
        <div className="grid grid-cols-4 gap-8">
          {/* Top border */}
          <div className="h-32 w-32 border-4 border-indigo-200 border-t-active" />
          
          {/* Right border */}
          <div className="h-32 w-32 border-4 border-indigo-200 border-r-indigo-500" />
          
          {/* Bottom border */}
          <div className="h-32 w-32 border-4 border-indigo-200 border-b-indigo-500" />
          
          {/* Left border */}
          <div className="h-32 w-32 border-l-2 border-l-active" />
        </div>
      </div>
    </div>
  )
}