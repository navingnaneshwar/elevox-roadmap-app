import { useState } from 'react'
import Roadmap from './components/Roadmap'
import OnboardingForm from './components/OnboardingForm'
import CalendarLogistics from './components/CalendarLogistics'

function App() {
  const [activeComponent, setActiveComponent] = useState('calendar')

  return (
    <>
      {/* Universal Top Nav for switching tools */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        padding: '16px 24px',
        gap: '8px'
      }}>
        <button 
          onClick={() => setActiveComponent('roadmap')}
          style={{
            padding: '8px 16px',
            background: activeComponent === 'roadmap' ? '#B8965A' : 'rgba(255,255,255,0.7)',
            color: activeComponent === 'roadmap' ? '#FFFFFF' : '#B8965A',
            border: '1px solid #B8965A',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '1px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
        >
          ROADMAP
        </button>
        <button 
          onClick={() => setActiveComponent('onboarding')}
          style={{
            padding: '8px 16px',
            background: activeComponent === 'onboarding' ? '#B8965A' : 'rgba(255,255,255,0.7)',
            color: activeComponent === 'onboarding' ? '#FFFFFF' : '#B8965A',
            border: '1px solid #B8965A',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '1px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
        >
          ONBOARDING
        </button>
        <button 
          onClick={() => setActiveComponent('calendar')}
          style={{
            padding: '8px 16px',
            background: activeComponent === 'calendar' ? '#B8965A' : 'rgba(255,255,255,0.7)',
            color: activeComponent === 'calendar' ? '#FFFFFF' : '#B8965A',
            border: '1px solid #B8965A',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '1px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
        >
          CALENDAR
        </button>
      </div>

      {activeComponent === 'roadmap' && <Roadmap />}
      {activeComponent === 'onboarding' && <OnboardingForm />}
      {activeComponent === 'calendar' && <CalendarLogistics />}
    </>
  )
}

export default App
