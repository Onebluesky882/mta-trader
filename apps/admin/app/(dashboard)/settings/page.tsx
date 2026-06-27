'use client'
import { useSettings } from '@/hooks/use-settings'
import { ProfileForm } from '@/components/settings/profile-form'

export default function SettingsPage() {
  const { user, isLoading } = useSettings()

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Settings</h1>
      <ProfileForm user={user} isLoading={isLoading} />
    </div>
  )
}
