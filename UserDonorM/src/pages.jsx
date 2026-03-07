
import {
  Search, Heart, BarChart3, Bell, LayoutGrid, User,
  Megaphone, Mail, Menu, LogOut,
} from 'lucide-react'
import logo from './assets/image-removebg-preview.png'
import { useData } from './context/DataContext'
import { MessageSquare } from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const LOGGED_OUT_NAV = [
  { id: 'home', label: 'Home', icon: LayoutGrid },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'transparency', label: 'Transparency', icon: BarChart3 },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'donate', label: 'Donate', icon: Heart },
  { id: 'about', label: 'About Us', icon: User },
  { id: 'auth', label: 'Login / Sign Up', icon: User },
]

const LOGGED_IN_NAV = [
  { id: 'home',        label: 'Home',         icon: LayoutGrid },
  { id: 'campaigns',   label: 'Campaigns',    icon: Megaphone },
  { id: 'dashboard',   label: 'My Dashboard', icon: BarChart3 },
  { id: 'donate',      label: 'Donate',       icon: Heart },
  { id: 'my-messages', label: 'My Messages',  icon: MessageSquare }, // 👈 ADD THIS
  { id: 'about',       label: 'About Us',     icon: User },
  { id: 'contact',     label: 'Contact',      icon: Mail },
  { id: 'logout',      label: 'Logout',       icon: LogOut },
]

const TESTIMONIALS = [
  { id: 1, name: 'Mckhale Janry R. Natividad', role: 'Donor', quote: 'Supporting these campaigns helped me see real impact in the lives of students.' },
  { id: 2, name: 'Grade 5 Learner', role: 'Beneficiary', quote: 'Because of the learning kits, I can now study at home and follow my lessons.' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH')}`
}

export function daysLeft(endDate) {
  const now = new Date()
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'Ended'
  if (diff === 1) return '1 day left'
  return `${diff} days left`
}

export function useAnimatedCounter(target, duration) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.floor(target * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => { if (frame) cancelAnimationFrame(frame) }
  }, [target, duration])
  return value
}

// ─── LAYOUT COMPONENTS ───────────────────────────────────────────────────────

export function SideNav({ isLoggedIn, activePage, onNavigate, collapsed, userName }) {
  const items = isLoggedIn ? LOGGED_IN_NAV : LOGGED_OUT_NAV
  const navItems = items.filter((item) => item.id !== 'logout' && item.id !== 'auth')
  const authItem = items.find((item) => isLoggedIn ? item.id === 'logout' : item.id === 'auth')

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}>
      <div className={`h-24 border-b border-gray-200 flex items-center ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
        <img src={logo} alt="Knowledge Channel Foundation" className={`${collapsed ? 'h-10' : 'h-20'} w-auto object-contain`} />
      </div>
      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'} space-y-1`}>
        {navItems.map((item) => {
          const isActive = item.id === activePage
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors duration-200 ${
                isActive ? 'bg-blue-50 text-blue-700 border-l-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-transparent'
              }`}
            >
              {Icon && <Icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'} ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />}
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 space-y-2">
        {isLoggedIn ? (
          <>
            {!collapsed && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 mb-1">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {userName?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => onNavigate('logout')}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 ${collapsed ? 'justify-center' : ''}`}
            >
              {authItem?.icon && <authItem.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'} text-gray-500`} />}
              {!collapsed && <span>Sign out</span>}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium text-blue-600 rounded-md bg-blue-50 hover:bg-blue-100 ${collapsed ? 'justify-center' : ''}`}
          >
            {authItem?.icon && <authItem.icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'} text-blue-500`} />}
            {!collapsed && <span>Login / Sign Up</span>}
          </button>
        )}
      </div>
    </aside>
  )
}

export function HeaderBar({ userName, onToggleSidebar }) {
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
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
          <span className="mr-1">Last updated:</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <button type="button" className="p-1 rounded-full text-gray-400 hover:text-gray-500">
          <Bell className="h-5 w-5" />
        </button>
        {userName && (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}

// ─── PAGE COMPONENTS ─────────────────────────────────────────────────────────

export function HeroSection({ onDonate, onViewCampaigns }) {
  const { campaigns, getCampaignRaised } = useData()
  const featured = campaigns.find(c => c.status === 'Active') || campaigns[0]
  const featuredRaised = featured ? getCampaignRaised(featured.title) : 0
  const featuredPercent = featured?.target ? Math.min(Math.round((featuredRaised / featured.target) * 100), 100) : 0

  return (
    <section className="pt-10 pb-12 grid gap-8 md:grid-cols-2 items-center">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Support a Cause. Change a Life.</h1>
        <p className="text-sm md:text-base text-gray-600 mb-6">Help bring quality learning opportunities to every Filipino child through community-driven, transparent, and impactful campaigns.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onDonate} className="inline-flex items-center px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transform transition-transform duration-200 hover:-translate-y-0.5">
            <Heart className="h-4 w-4 mr-2" />Donate Now
          </button>
          <button type="button" onClick={onViewCampaigns} className="inline-flex items-center px-5 py-2.5 rounded-full border border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50">
            View Campaigns
          </button>
        </div>
      </div>
      <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 flex flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-100 mb-2">Featured campaign</p>
          <p className="text-lg font-semibold">{featured?.title || 'Loading...'}</p>
          <p className="mt-2 text-xs text-blue-100 max-w-xs">{featured?.description || ''}</p>
        </div>
        {featured && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{formatCurrency(featuredRaised)} raised</span>
              <span>{featuredPercent}% of goal</span>
            </div>
            <div className="w-full h-2 bg-blue-900/40 rounded-full overflow-hidden">
              <div className="h-2 bg-amber-300 rounded-full" style={{ width: `${featuredPercent}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-blue-100">{daysLeft(featured.endDate)}</p>
          </div>
        )}
      </div>
    </section>
  )
}

export function HomeFeaturedCampaigns({ onDonate, onViewCampaigns }) {
  const { campaigns, getCampaignRaised } = useData()
  const featured = campaigns.filter(c => c.status === 'Active').slice(0, 3)

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Featured Campaigns</h2>
        <button type="button" onClick={onViewCampaigns} className="text-xs text-blue-600 hover:underline">View all</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featured.length === 0 && (
          <p className="text-xs text-gray-500 col-span-3 text-center py-8">No active campaigns yet.</p>
        )}
        {featured.map((campaign) => {
          const raised = getCampaignRaised(campaign.title)
          const percent = campaign.target ? Math.min(Math.round((raised / campaign.target) * 100), 100) : 0
          return (
            <div key={campaign.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="h-28 bg-gray-100 overflow-hidden">
                {campaign.image
                  ? <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-400 text-xs">No image</div>
                }
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <p className="text-xs text-blue-600 font-medium">{campaign.category}</p>
                <p className="text-sm font-semibold text-gray-900">{campaign.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{campaign.description}</p>
                <div className="mt-1">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>{formatCurrency(raised)} raised</span>
                    <span>{formatCurrency(campaign.target)} goal</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px] text-gray-500">
                    <span>{percent}% funded</span><span>{daysLeft(campaign.endDate)}</span>
                  </div>
                </div>
                <button type="button" onClick={() => onDonate(campaign.id)} className="mt-2 w-full inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                  Donate
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ImpactStats() {
  const { donors, donorCount, campaigns, publicStats } = useData()
  const totalFunds = publicStats.reduce((sum, s) => sum + Number(s.raised || 0), 0)
  const totalDonors = donors.length > 0 ? donors.length : donorCount
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length

  const funds = useAnimatedCounter(totalFunds, 900)
  const donorsCount = useAnimatedCounter(totalDonors, 1000)
  const active = useAnimatedCounter(activeCampaigns, 800)
  const beneficiaries = useAnimatedCounter(3200, 1100)

  return (
    <section className="py-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Impact Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Funds Raised', value: formatCurrency(funds) },
          { label: 'Total Donors', value: donorsCount },
          { label: 'Active Campaigns', value: active },
          { label: 'Beneficiaries Helped', value: beneficiaries },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200">
            <p className="text-[11px] text-gray-500 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function WhyDonateSection() {
  const items = [
    { title: 'Secure payments', description: 'Your donations are processed through trusted payment partners.' },
    { title: 'Transparent reporting', description: 'Track how every peso is allocated across campaigns.' },
    { title: 'Real impact', description: 'Stories and data from beneficiaries show the difference you make.' },
    { title: 'Trusted partners', description: 'We work with vetted schools, communities, and organizations nationwide.' },
  ]
  return (
    <section className="py-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Why donate with us</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-900 mb-1">{item.title}</p>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Stories from our community</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-600 italic mb-3">"{t.quote}"</p>
            <p className="text-xs font-semibold text-gray-900">{t.name}</p>
            <p className="text-[11px] text-gray-500">{t.role}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DonorHistorySection() {
  const { donations } = useData()
  const recent = [...donations].slice(0, 5)
  const total = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0)
  const average = donations.length ? Math.round(total / donations.length) : 0

  return (
    <section className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Donor history</h2>
            <span className="text-[11px] text-gray-500">{donations.length} donation{donations.length === 1 ? '' : 's'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Donor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Campaign</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recent.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No donations yet.</td></tr>
                )}
                {recent.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{d.donor}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{d.campaign}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900 font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Donor insights</h3>
          <dl className="space-y-2">
            <div className="flex justify-between"><dt className="text-gray-500">Total donated</dt><dd className="font-semibold">{formatCurrency(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Number of gifts</dt><dd className="font-semibold">{donations.length}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Average gift</dt><dd className="font-semibold">{formatCurrency(average)}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  )
}

export function AboutKnowledgeChannelSection() {
  return (
    <section className="py-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">About Knowledge Channel Foundation</h2>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs text-gray-600 space-y-2">
        <p>Knowledge Channel Foundation is a non-profit organization dedicated to making quality education accessible to every Filipino learner through television, digital platforms, and community-based programs.</p>
        <p>By partnering with schools, teachers, local governments, and development organizations, Knowledge Channel creates and delivers curriculum-aligned video lessons and learning resources.</p>
        <p>Your donations help fund the production of educational content, distribute learning kits, train teachers, and expand the reach of Knowledge Channel to more homes and classrooms across the country.</p>
      </div>
    </section>
  )
}

export function HomePage({ onDonate, onViewCampaigns }) {
  const { isAuthenticated } = useData()
  return (
    <div className="w-full pb-10">
      <HeroSection onDonate={onDonate} onViewCampaigns={onViewCampaigns} />
      <HomeFeaturedCampaigns onDonate={onDonate} onViewCampaigns={onViewCampaigns} />
      <ImpactStats />
      <WhyDonateSection />
      <TestimonialsSection />
      {isAuthenticated && <DonorHistorySection />}
      <AboutKnowledgeChannelSection />
    </div>
  )
}

export function CampaignsPage({ onViewDetails, onDonate }) {
  const { campaigns, getCampaignRaised } = useData()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState('Most Funded')

  const categories = ['All', ...new Set(campaigns.map((c) => c.category).filter(Boolean))]

  const filtered = campaigns.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || c.category === category
    const matchesStatus = status === 'All' || c.status === status
    return matchesSearch && matchesCategory && matchesStatus
  }).sort((a, b) => {
    if (sort === 'Most Funded') return getCampaignRaised(b.title) - getCampaignRaised(a.title)
    if (sort === 'Newest') return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    if (sort === 'Ending Soon') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    return 0
  })

  return (
    <div className="w-full py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500">Find a campaign that matches the cause you care about most.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-full text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Search campaigns" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-xs">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-white">
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-white">
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Paused">Paused</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] text-gray-500 mb-1">Sort by</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-white">
            <option>Most Funded</option><option>Newest</option><option>Ending Soon</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaigns.length === 0 && (
          <p className="text-xs text-gray-500 col-span-3 text-center py-8">No campaigns found.</p>
        )}
        {filtered.map((campaign) => {
          const raised = getCampaignRaised(campaign.title)
          const percent = campaign.target ? Math.min(Math.round((raised / campaign.target) * 100), 100) : 0
          return (
            <div key={campaign.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="h-28 bg-gray-100 overflow-hidden">
                {campaign.image
                  ? <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-400 text-xs">No image</div>
                }
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <p className="text-xs text-blue-600 font-medium">{campaign.category}</p>
                <p className="text-sm font-semibold text-gray-900">{campaign.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{campaign.description}</p>
                <div>
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>{formatCurrency(raised)} raised</span>
                    <span>{formatCurrency(campaign.target)} goal</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px] text-gray-500">
                    <span>{percent}% funded</span><span>{daysLeft(campaign.endDate)}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => onDonate(campaign.id)} className="flex-1 inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Donate</button>
                  <button type="button" onClick={() => onViewDetails(campaign.id)} className="flex-1 inline-flex items-center justify-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View Details</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CampaignDetailsPage({ campaign, onDonate }) {
  const { donations, getCampaignRaised } = useData()
  if (!campaign) return null

  const raised = getCampaignRaised(campaign.title)
  const percent = campaign.target ? Math.min(Math.round((raised / campaign.target) * 100), 100) : 0
  const recentDonations = donations.filter((d) => d.campaign === campaign.title).slice(0, 5)

  const updates = [
    { id: 1, date: 'Jan 5, 2025', text: 'Distributed first batch of learning kits to 150 students.' },
    { id: 2, date: 'Dec 10, 2024', text: 'Campaign reached 50% of its funding goal.' },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <div>
        <div className="h-48 md:h-56 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          {campaign.image
            ? <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-400">No image</div>
          }
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
        <p className="text-xs text-blue-600 font-medium mb-4">{campaign.category}</p>
        <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{formatCurrency(raised)} raised</span>
            <span>{formatCurrency(campaign.target)} goal</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-gray-500 mt-1">
            <span>{percent}% funded</span><span>{daysLeft(campaign.endDate)}</span>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Recent donations</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100 text-sm">
            {recentDonations.length === 0 && <div className="px-4 py-4 text-xs text-gray-500">No donations yet. Be the first to give.</div>}
            {recentDonations.map((d) => (
              <div key={d.id} className="px-4 py-3 flex justify-between">
                <div>
                  <p className="text-xs text-gray-700">{d.donor}</p>
                  <p className="text-[11px] text-gray-500">{d.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900">{formatCurrency(d.amount)}</p>
                  <p className="text-[11px] text-gray-500">{d.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Updates</h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <ul className="space-y-3 text-xs text-gray-600">
              {updates.map((u) => (
                <li key={u.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div><p className="text-[11px] text-gray-500 mb-0.5">{u.date}</p><p>{u.text}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <aside className="lg:sticky lg:top-20">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-900 mb-1">Support this campaign</p>
          <p className="text-[11px] text-gray-500 mb-3">Every contribution brings learners closer to the resources they need.</p>
          <button type="button" onClick={() => onDonate(campaign.id)} className="w-full inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 mb-2">Donate Now</button>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>Share</span>
            <div className="flex gap-2">
              <button type="button" className="px-2 py-1 rounded-full bg-blue-50 text-blue-600">Facebook</button>
              <button type="button" className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">Copy Link</button>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 flex gap-2">
          <BarChart3 className="h-4 w-4 mt-0.5" />
          <p>Your donation helps us reach our goal faster and unlock more learning opportunities for students.</p>
        </div>
      </aside>
    </div>
  )
}

export function DonationPage({ selectedCampaignId, onSubmit, onBackToCampaign }) {
  const { campaigns, getCampaignRaised } = useData()
  const [campaignId, setCampaignId] = useState(selectedCampaignId || '')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('One-time')
  const [method, setMethod] = useState('GCash')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const quickAmounts = [500, 1000, 5000]

  const currentCampaign = campaigns.find((c) => c.id === campaignId) ||
    campaigns.find((c) => c.id === selectedCampaignId) ||
    campaigns[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!campaignId || !amount || !name || !email || !termsAccepted) return
    const chosenCampaign = campaigns.find((c) => c.id === campaignId)
    onSubmit({
      campaignId,
      campaignTitle: chosenCampaign?.title || '',
      amount: Number(amount), type, method, name, email, phone, anonymous, message,
      reference: `KC-${Date.now()}`,
      date: new Date().toLocaleDateString(),
    })
  }

  if (!currentCampaign) return <div className="py-8 text-center text-gray-500 text-sm">Loading campaigns...</div>

  const currentRaised = getCampaignRaised(currentCampaign.title)
  const currentPercent = currentCampaign.target
    ? Math.min(Math.round((currentRaised / currentCampaign.target) * 100), 100)
    : 0

  return (
    <div className="py-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Make a donation</h1>
          {onBackToCampaign && <button type="button" onClick={onBackToCampaign} className="text-xs text-gray-500 hover:text-blue-600">Back to campaign</button>}
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Select campaign</label>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-white">
              <option value="">Choose a campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Choose amount</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickAmounts.map((value) => (
                <button key={value} type="button" onClick={() => setAmount(String(value))} className={`px-3 py-1.5 rounded-full border text-xs ${Number(amount) === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {formatCurrency(value)}
                </button>
              ))}
            </div>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" placeholder="Or enter custom amount" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Donation type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-white">
                <option>One-time</option><option>Monthly (Recurring)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Payment method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-white">
                <option>GCash</option><option>Bank Transfer</option><option>Credit Card</option><option>PayPal</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Phone (optional)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
            </div>
            <div className="flex items-center mt-5">
              <input id="anonymous" type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-3 w-3 text-blue-600 border-gray-300 rounded mr-2" />
              <label htmlFor="anonymous" className="text-[11px] text-gray-600">Give anonymously</label>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Optional message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-xs" rows={3} />
          </div>
          <div className="flex items-start gap-2">
            <input id="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-3 w-3 text-blue-600 border-gray-300 rounded mt-0.5" />
            <label htmlFor="terms" className="text-[11px] text-gray-600">I agree to the terms and conditions and privacy policy.</label>
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Confirm donation</button>
        </form>
      </div>
      <aside className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs">
          <p className="text-[11px] text-gray-500 mb-1">You are supporting</p>
          <p className="text-sm font-semibold text-gray-900 mb-1">{currentCampaign.title}</p>
          <p className="text-[11px] text-blue-600 mb-3">{currentCampaign.category}</p>
          <div className="mb-2">
            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>{formatCurrency(currentRaised)} raised</span>
              <span>{formatCurrency(currentCampaign.target)} goal</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${currentPercent}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{daysLeft(currentCampaign.endDate)}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900">
          <p className="font-semibold mb-1">Why give monthly?</p>
          <p>Monthly support helps sustain long-term programs and reach more learners throughout the school year.</p>
        </div>
      </aside>
    </div>
  )
}

export function ThankYouPage({ donation, onBackHome, onViewCampaign }) {
  if (!donation) return null
  return (
    <div className="py-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your donation</h1>
        <p className="text-sm text-gray-600 mb-6">Your support helps bring learning opportunities to more students across the country.</p>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs text-left mb-6">
          <p className="flex justify-between mb-1"><span className="text-gray-500">Campaign</span><span className="font-semibold">{donation.campaignTitle}</span></p>
          <p className="flex justify-between mb-1"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatCurrency(donation.amount)}</span></p>
          <p className="flex justify-between mb-1"><span className="text-gray-500">Reference</span><span className="font-mono">{donation.reference}</span></p>
          <p className="flex justify-between"><span className="text-gray-500">Date</span><span>{donation.date}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 text-xs">
          <button type="button" onClick={onViewCampaign} className="inline-flex items-center justify-center rounded-full px-4 py-2 text-gray-700 hover:bg-gray-100">View campaign</button>
          <button type="button" onClick={onBackHome} className="inline-flex items-center justify-center rounded-full px-4 py-2 text-gray-700 hover:bg-gray-100">Back to home</button>
        </div>
      </div>
      <aside className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs space-y-3">
        <p className="text-sm font-semibold text-gray-900">Your impact continues</p>
        <p className="text-gray-600">Donations like yours fund learning kits, teacher training, and educational content that reach classrooms across the country.</p>
      </aside>
    </div>
  )
}

export function DashboardPage() {
  const { donations, user } = useData()
  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0)
  const recurring = donations.filter((d) => d.type === 'Recurring').length
  const average = donations.length ? Math.round(totalDonated / donations.length) : 0

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Dashboard</h1>
      {user?.name && <p className="text-sm text-gray-500 mb-6">Welcome back, <span className="font-medium text-gray-700">{user.name}</span>!</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total donated', value: formatCurrency(totalDonated) },
          { label: 'Active recurring donations', value: recurring },
          { label: 'Total donations', value: donations.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200">
            <p className="text-[11px] text-gray-500 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Donation history</p>
            <span className="text-[11px] text-gray-500">{donations.length} donation{donations.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Donor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Campaign</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donations.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No donations yet.</td></tr>
                )}
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{d.donor}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{d.campaign}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900 font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Donor insights</h3>
          <dl className="space-y-3">
            <div className="flex justify-between"><dt className="text-gray-500">Total donated</dt><dd className="font-semibold">{formatCurrency(totalDonated)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Number of gifts</dt><dd className="font-semibold">{donations.length}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Average gift</dt><dd className="font-semibold">{formatCurrency(average)}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export function TransparencyPage() {
  const { campaigns, publicStats } = useData()

  const getCampaignRaised = (title) => {
    const stat = publicStats.find((s) => s.campaign === title)
    return stat ? Number(stat.raised) : 0
  }

  const totalFunds = publicStats.reduce((sum, s) => sum + Number(s.raised || 0), 0)
  const totalDonationCount = publicStats.reduce((sum, s) => sum + Number(s.count || 0), 0)
  const completed = campaigns.filter((c) => c.status === 'Completed')

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Transparency</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-gray-500 mb-1">Total funds raised</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalFunds)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-gray-500 mb-1">Completed campaigns</p>
          <p className="text-lg font-bold text-gray-900">{completed.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-gray-500 mb-1">Total donations received</p>
          <p className="text-lg font-bold text-gray-900">{totalDonationCount}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-2">Fund allocation</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>70% Program implementation</li>
            <li>15% Content development</li>
            <li>10% Monitoring and evaluation</li>
            <li>5% Administration</li>
          </ul>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-2">Annual report</p>
          <p className="text-xs text-gray-600 mb-3">Download our latest annual report to see detailed financials and impact data.</p>
          <button type="button" className="inline-flex items-center rounded-full border border-blue-600 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">Download PDF</button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Campaign breakdown</p>
        <table className="min-w-full text-xs divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Campaign</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Target</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Raised</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">No campaigns yet.</td></tr>
            )}
            {campaigns.map((c) => {
              const raised = getCampaignRaised(c.title)
              const target = Number(c.target || 0)
              const percent = target ? Math.min(Math.round((raised / target) * 100), 100) : 0
              return (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-gray-700">{c.title}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      c.status === 'Active' ? 'bg-green-100 text-green-700' :
                      c.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(target)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(raised)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-gray-500 w-8 text-right">{percent}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ContactPage() {
  const { token, user } = useData()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [status, setStatus] = useState(null) // 'sending' | 'success' | 'error'

  const handleSubmit = async () => {
    if (!name || !email || !message) return
    setStatus('sending')
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setSubject('')
      setMessage('')
      if (!user) { setName(''); setEmail('') }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="py-8 grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact us</h1>
        <p className="text-sm text-gray-600 mb-4">Reach out for partnership opportunities, questions about campaigns, or support with your donation.</p>
        <div className="space-y-2 text-xs text-gray-700">
          <p>Email: <span className="font-semibold">donations@knowledgechannel.org</span></p>
          <p>Phone: <span className="font-semibold">+63 900 000 0000</span></p>
          <p>Office: <span className="font-semibold">Ortigas Center, Pasig City, Philippines</span></p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3 text-xs">
        {!user && (
          <>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
            </div>
          </>
        )}
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-[11px] text-blue-700">
            <span className="font-semibold">{user.name}</span>
            <span className="text-blue-400">·</span>
            <span>{user.email}</span>
          </div>
        )}
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Message</label>
          <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" />
        </div>
        {status === 'success' && <p className="text-green-600 text-[11px] text-center">Message sent successfully!</p>}
        {status === 'error' && <p className="text-red-600 text-[11px] text-center">Something went wrong. Please try again.</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'sending'}
          className="w-full inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
      </div>
    </div>
  )
}
export function AboutPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">About us</h1>
      <p className="text-sm text-gray-600 mb-4">Knowledge Channel Foundation is a non-profit organization that makes quality education more accessible to Filipino learners through television, digital platforms, and community-based programs.</p>
      <p className="text-sm text-gray-600 mb-2">Through partnerships with schools, teachers, local governments, and development organizations, we design and deliver curriculum-aligned video lessons and learning resources.</p>
      <p className="text-sm text-gray-600">Your donations help fund educational content production, distribute learning kits, train teachers, and expand the reach of Knowledge Channel to more homes and classrooms across the country.</p>
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">About KCVIP</h2>
        <p className="text-sm text-gray-600 mb-2">KCVIP brings together individuals and organizations who want to actively support the mission of improving education for Filipino learners.</p>
        <p className="text-sm text-gray-600">By joining KCVIP or supporting KCVIP campaigns, you become part of a community working to ensure that every learner has access to engaging and meaningful learning experiences.</p>
      </div>
    </div>
  )
}

export function LoginPage({ onLoginSuccess }) {
  const { login, register, authError, authLoading } = useData()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (mode === 'login') {
      const success = await login(email, password)
      if (success) onLoginSuccess(email)
    } else {
      if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return }
      const success = await register(name, email, password)
      if (success) onLoginSuccess(name)
    }
  }

  const error = localError || authError

  return (
    <div className="py-10">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">{mode === 'login' ? 'Login' : 'Sign up'}</h1>
          <button type="button" onClick={() => { setMode((prev) => (prev === 'login' ? 'signup' : 'login')); setLocalError('') }} className="text-xs text-blue-600 hover:underline">
            {mode === 'login' ? 'Create account' : 'Have an account? Login'}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
            </div>
          )}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50" />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50 pr-16" />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-3 text-[11px] text-gray-500">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          {error && <p className="text-red-600 text-[11px] text-center">{error}</p>}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[11px] text-gray-600">
              <input type="checkbox" className="h-3 w-3 text-blue-600 border-gray-300 rounded" />
              Remember me
            </label>
            {mode === 'login' && <button type="button" className="text-[11px] text-blue-600 hover:underline">Forgot password?</button>}
          </div>
          <button type="submit" disabled={authLoading} className="w-full inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {authLoading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Login' : 'Sign up')}
          </button>
        </form>
      </div>
    </div>
  )
}