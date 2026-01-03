import { useState } from 'react'
import type { Activity } from '@/types/itinerary'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ActivityBlock({
  activity,
  index,
  onChange,
  onDelete,
  draggable,
  onDragStart,
}: {
  activity: Activity
  index?: number
  onChange?: (a: Activity) => void
  onDelete?: (id: string) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, idx: number | undefined) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Activity>(activity)

  function save() {
    setEditing(false)
    onChange?.(form)
  }

  return (
    <div
      className="border rounded-lg p-3 bg-card shadow-sm"
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
    >
      {!editing ? (
        <div>
          <div className="font-semibold">{activity.title}</div>
          <div className="text-sm text-muted-foreground">
            {activity.time} · ₹{activity.cost}
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Quick Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete?.(activity.id)}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <Input
            value={String(form.cost)}
            onChange={(e) => setForm({ ...form, cost: Number(e.target.value || 0) })}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
