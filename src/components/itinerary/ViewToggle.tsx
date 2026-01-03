import { Button } from '@/components/ui/button'

export default function ViewToggle({
  mode,
  setMode,
}: {
  mode: 'calendar' | 'list'
  setMode: (v: 'calendar' | 'list') => void
}) {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant={mode === 'list' ? 'default' : 'outline'}
        onClick={() => setMode('list')}
      >
        List View
      </Button>
      <Button
        variant={mode === 'calendar' ? 'default' : 'outline'}
        onClick={() => setMode('calendar')}
      >
        Calendar View
      </Button>
    </div>
  )
}
