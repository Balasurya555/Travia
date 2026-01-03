export interface Activity {
  id: string
  title: string
  time: string
  cost: number
}

export interface DayPlan {
  day: number
  city: string
  activities: Activity[]
}
