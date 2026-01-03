import { useState } from 'react'
import type { DayPlan } from '@/types/itinerary'
import DayView from '@/components/itinerary/DayView'
import ViewToggle from '@/components/itinerary/ViewToggle'

const sampleData: DayPlan[] = [
  {
    day: 1,
    city: 'Paris',
    activities: [
      { id: '1', title: 'Eiffel Tower', time: '10:00 AM', cost: 2500 },
      { id: '2', title: 'Seine Cruise', time: '6:00 PM', cost: 1800 },
    ],
  },
  {
    day: 2,
    city: 'Versailles',
    activities: [
      { id: '3', title: 'Palace of Versailles', time: '11:00 AM', cost: 2200 },
    ],
  },
]

export default function Itinerary() {
  const [mode, setMode] = useState<'calendar' | 'list'>('list')

  return (
    <div className="p-6">
      <ViewToggle mode={mode} setMode={setMode} />

      {mode === 'list' && (
        <div className="space-y-6">
          {sampleData.map((day) => (
            <DayView key={day.day} day={day} />
          ))}
        </div>
      )}

      {mode === 'calendar' && (
        <div className="text-muted-foreground">Calendar View (wire this with shadcn Calendar)</div>
      )}
    </div>
  )
}
