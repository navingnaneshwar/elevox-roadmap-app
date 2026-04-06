import { useState } from 'react'
import Roadmap from './components/Roadmap'
import OnboardingForm from './components/OnboardingForm'
import CalendarLogistics from './components/CalendarLogistics'
import Dashboard from './components/Dashboard'
import ProfileView from './components/ProfileView'

function App() {
  const [activeComponent, setActiveComponent] = useState('dashboard')
  const [profileData, setProfileData] = useState(null)

  const navItems = [
    { id: 'dashboard',  label: 'DASHBOARD'  },
    { id: 'onboarding', label: 'ONBOARDING' },
    { id: 'profile',    label: 'PROFILE'    },
    { id: 'roadmap',    label: 'ROADMAP'    },
    { id: 'calendar',   label: 'CALENDAR'   },
  ]

  const navBg = activeComponent === 'dashboard' || activeComponent === 'onboarding'
    ? 'rgba(7,11,20,0.85)'
    : 'rgba(255,255,255,0.7)'

  const btnActive   = { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: '1px solid transparent' }
  const btnInactive = { background: navBg, color: '#6366f1', border: '1px solid rgba(99,102,241,0.35)' }

  return (
    <>
      {/* Universal Top Nav */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        padding: '12px 20px',
        gap: '6px',
      }}>
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveComponent(id)}
            style={{
              padding: '7px 14px',
              borderRadius: '7px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '1.2px',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.18s',
              ...(activeComponent === id ? btnActive : btnInactive),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeComponent === 'dashboard'  && (
        <Dashboard
          profileData={profileData}
          onSwitchTo={setActiveComponent}
        />
      )}
      {activeComponent === 'onboarding' && (
        <OnboardingForm
          onComplete={(data) => { setProfileData(data); setActiveComponent('dashboard'); }}
        />
      )}
      {activeComponent === 'profile'    && (
        <ProfileView
          profileData={profileData}
          onStartOnboarding={() => setActiveComponent('onboarding')}
        />
      )}
      {activeComponent === 'roadmap'    && <Roadmap />}
      {activeComponent === 'calendar'   && <CalendarLogistics />}
    </>
  )
}

export default App
