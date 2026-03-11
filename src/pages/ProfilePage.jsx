// src/pages/ProfilePage.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileView from '../components/ProfileView'
import { dbToFormData } from './OnboardingPage'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  return (
    <ProfileView
      profileData={profile ? dbToFormData(profile) : null}
      onStartOnboarding={() => navigate('/onboarding')}
    />
  )
}
