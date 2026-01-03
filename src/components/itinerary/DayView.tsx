import { useState } from 'react'
import type { DayPlan, Activity } from '@/types/itinerary'
import ActivityBlock from './ActivityBlock'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export default function DayView({ day }: { day: DayPlan }) {
  const [activities, setActivities] = useState<Activity[]>(day.activities || [])

  // Basic drag-and-drop reordering
  function onDragStart(e: React.DragEvent, idx?: number) {
    if (idx === undefined) return
    e.dataTransfer.setData('text/plain', String(idx))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData('text/plain'))
    const toAttr = (e.currentTarget as HTMLElement).getAttribute('data-idx')
    const to = toAttr ? Number(toAttr) : activities.length - 1
    if (isNaN(from) || isNaN(to)) return
    const next = [...activities]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setActivities(next)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleChange(updated: Activity) {
    setActivities((s) => s.map((a) => (a.id === updated.id ? updated : a)))
  }

  function handleDelete(id: string) {
    setActivities((s) => s.filter((a) => a.id !== id))
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full text-left">
        <h3 className="text-lg font-bold">
          Day {day.day} – {day.city}
        </h3>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-2">
        <div>
          {activities.length === 0 && <div className="text-sm text-muted-foreground">No activities</div>}
          <div className="space-y-3">
            {activities.map((a, idx) => (
              <div
                key={a.id}
                data-idx={idx}
                onDrop={onDrop}
                onDragOver={onDragOver}
              >
                <ActivityBlock
                  activity={a}
                  index={idx}
                  draggable
                  onDragStart={onDragStart}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
