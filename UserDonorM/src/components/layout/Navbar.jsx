export function HeaderBar({ userName, onToggleSidebar, onNavigate }) {
  const { token } = useData()
  const [messages, setMessages] = useState([])
  const [newReplies, setNewReplies] = useState([])
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  const SEEN_KEY = 'seen_reply_counts'

  const fetchMessages = async () => {
    if (!token) return
    try {
      const res = await fetch('http://localhost:5001/api/messages/mine', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
        const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
        const fresh = data.filter((m) => {
          const currentCount = m.replies?.length || 0
          const seenCount = seen[m.id] ?? 0
          return currentCount > seenCount
        })
        setNewReplies(fresh)
      }
    } catch {}
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllSeen = () => {
    const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
    messages.forEach((m) => { seen[m.id] = m.replies?.length || 0 })
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
    setNewReplies([])
  }

  const totalNew = newReplies.length

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 flex items-center gap-3 max-w-xl">
        <button type="button" onClick={onToggleSidebar} className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Search donors, donations, campaigns..." />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
          <span className="mr-1">Last updated:</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>

        {/* Bell with dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            className="relative p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <Bell className="h-5 w-5" />
            {totalNew > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-bold leading-none">
                {totalNew}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">
                  Notifications
                  {totalNew > 0 && <span className="ml-2 text-xs text-red-500 font-bold">({totalNew} new)</span>}
                </span>
                <div className="flex items-center gap-3">
                  {totalNew > 0 && (
                    <button onClick={markAllSeen} className="text-[11px] text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {/* New reply notifications */}
                {newReplies.length > 0 ? (
                  <div>
                    <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                      New replies from admin
                    </p>
                    {newReplies.map((m) => {
                      const seenCount = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')[m.id] ?? 0
                      const newCount = (m.replies?.length || 0) - seenCount
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            markAllSeen()
                            setBellOpen(false)
                            onNavigate?.('my-messages')
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 bg-blue-50/40 text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 text-xs font-bold">
                            +{newCount}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{m.subject || '(no subject)'}</p>
                            <p className="text-xs text-gray-500 truncate">{m.message}</p>
                            <p className="text-[10px] text-blue-600 mt-0.5 font-medium">Admin replied to your message</p>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                    <Bell className="h-7 w-7" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}

                {/* General */}
                <div>
                  <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase bg-gray-50 border-b border-gray-100 border-t border-t-gray-100">
                    General
                  </p>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Welcome to Knowledge Channel</p>
                      <p className="text-xs text-gray-500">Thank you for joining and supporting our mission.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => { markAllSeen(); setBellOpen(false); onNavigate?.('my-messages') }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Go to My Messages →
                </button>
              </div>
            </div>
          )}
        </div>

        {userName && (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}