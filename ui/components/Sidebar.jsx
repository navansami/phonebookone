import { useState } from 'react'
import {
  Users,
  Star,
  Languages,
  Tag,
  Sun,
  Moon,
  Menu,
  X,
  Shield,
  Building2,
  Building,
  Network
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Sidebar = ({
  currentView,
  setCurrentView,
  onOpenFmcNetwork
}) => {
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { id: 'all', label: 'All Contacts', icon: Users },
    { id: 'emergency', label: 'Emergency', icon: Shield },
    { id: 'ifa', label: 'Owners', icon: Building },
    { id: 'thirdparty', label: 'Third Party', icon: Building2 },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'languages', label: 'Languages', icon: Languages },
    { id: 'tags', label: 'Tags', icon: Tag },
  ]


  const handleViewChange = (viewId) => {
    setCurrentView(viewId)
    setIsMobileMenuOpen(false)
  }


  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#05070b] transition-colors">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-200 dark:border-[#1b212a] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#05070b] dark:to-[#05070b] transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-[#23b7f2] dark:to-[#1296e2] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-[#f4fbff] dark:to-[#53d1ff]">
              Phonebook
            </h1>
            <p className="text-xs text-gray-600 dark:text-[#8ea4b8] font-medium">Fairmont The Palm</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-[#6f8396] uppercase tracking-wider mb-3 px-2">
          Navigation
        </h2>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Network Section */}
      <div className="px-4 pb-4">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-[#6f8396] uppercase tracking-wider mb-3 px-2">
          Network
        </h2>
        <div className="space-y-1">
          <button
            onClick={onOpenFmcNetwork}
            className="sidebar-link"
            aria-label="Open FMC Network"
          >
            <Network className="w-5 h-5 flex-shrink-0" />
            <span>FMC Network</span>
          </button>
        </div>
      </div>

      {/* Theme Toggle at Bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-[#1b212a] transition-colors">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-medium text-gray-700 dark:text-[#dbe4ec]">Dark Mode</span>
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            style={{ backgroundColor: theme === 'dark' ? '#23b7f2' : '#7c3aed' }}
            aria-label="Toggle theme"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-sm ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="w-3 h-3 text-[#0f6f9a]" />
              ) : (
                <Sun className="w-3 h-3 text-gray-600" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Burger Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Slides in from left */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#05070b] shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar - Always visible */}
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 bg-white dark:bg-[#05070b] border-r border-gray-200 dark:border-[#1b212a] shadow-sm transition-colors">
        {sidebarContent}
      </aside>
    </>
  )
}

export default Sidebar
