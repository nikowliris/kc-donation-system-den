import React, { useState, useEffect } from 'react'
import { useData } from './context/DataContext'
import {
  SideNav, HeaderBar,
  HomePage, CampaignsPage, CampaignDetailsPage,
  DonationPage, ThankYouPage, DashboardPage,
  TransparencyPage, ContactPage, AboutPage, LoginPage,
} from './pages'
import { MyMessages } from './pages/MyMessages.jsx'

const PROTECTED_PAGES = ['dashboard', 'my-messages']
const TRANSIENT_PAGES = ['thank-you', 'donate', 'campaign-details']

export default function App() {
  const { logout, user, isAuthenticated, addDonation, donations, campaigns } = useData()

  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash || TRANSIENT_PAGES.includes(hash)) return 'home'
    if (PROTECTED_PAGES.includes(hash) && !isAuthenticated) return 'login'
    return hash
  })

  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated)
  const [userName, setUserName] = useState(user?.name || '')
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [lastDonation, setLastDonation] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0]

  useEffect(() => {
    if (TRANSIENT_PAGES.includes(activePage)) {
      window.location.hash = ''
    } else {
      window.location.hash = activePage
    }
  }, [activePage])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash) return
      if (TRANSIENT_PAGES.includes(activePage)) return
      if (PROTECTED_PAGES.includes(hash) && !isLoggedIn) {
        setActivePage('login')
        return
      }
      setActivePage(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isLoggedIn, activePage])

  const handleNavigate = (pageId) => {
    if (pageId === 'logout') {
      logout()
      setIsLoggedIn(false)
      setUserName('')
      setActivePage('home')
      return
    }
    setActivePage(pageId)
  }

  const handleLoginSuccess = (name) => {
    setIsLoggedIn(true)
    setUserName(name)
    setActivePage('dashboard')
  }

  const handleDonateStart = (campaignId) => {
    setSelectedCampaignId(campaignId)
    setActivePage('donate')
  }

  const handleViewDetails = (campaignId) => {
    setSelectedCampaignId(campaignId)
    setActivePage('campaign-details')
  }

  const handleDonationSubmit = async (donation) => {
    const payload = {
      donor: donation.name,
      amount: donation.amount,
      type: donation.type === 'Monthly (Recurring)' ? 'Recurring' : 'One-time',
      campaign: donation.campaignTitle,
      campaignId: donation.campaignId,   // ← ensures backend resolves correct title
      channel: donation.method,
      notes: donation.message || '',
    }

    const saved = await addDonation(payload)

    if (saved) {
      setLastDonation({ ...donation, id: saved.id })
    } else {
      setLastDonation(donation)
    }

    setSelectedCampaignId(donation.campaignId)
    setActivePage('thank-you')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <SideNav
        isLoggedIn={isLoggedIn}
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={isSidebarCollapsed}
        userName={userName}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-white via-blue-50/40 to-white">
        <HeaderBar
          userName={userName}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 w-full p-8 overflow-y-auto">
          {activePage === 'home'             && <HomePage onDonate={handleDonateStart} onViewCampaigns={() => setActivePage('campaigns')} />}
          {activePage === 'campaigns'        && <CampaignsPage onViewDetails={handleViewDetails} onDonate={handleDonateStart} />}
          {activePage === 'campaign-details' && <CampaignDetailsPage campaign={selectedCampaign} onDonate={handleDonateStart} />}
          {activePage === 'donate'           && <DonationPage selectedCampaignId={selectedCampaignId} onSubmit={handleDonationSubmit} onBackToCampaign={() => setActivePage('campaign-details')} />}
          {activePage === 'thank-you'        && <ThankYouPage donation={lastDonation} onBackHome={() => setActivePage('home')} onViewCampaign={() => setActivePage('campaign-details')} />}
          {activePage === 'dashboard'        && <DashboardPage />}
          {activePage === 'transparency'     && <TransparencyPage />}
          {activePage === 'contact'          && <ContactPage />}
          {activePage === 'about'            && <AboutPage />}
          {activePage === 'login'            && <LoginPage onLoginSuccess={handleLoginSuccess} />}
          {activePage === 'my-messages'      && <MyMessages />}
        </main>
        <footer className="border-t border-gray-200 py-4 text-center text-[11px] text-gray-500">
          © {new Date().getFullYear()} Knowledge Channel Foundation · For demo purposes only
        </footer>
      </div>
    </div>
  )
}