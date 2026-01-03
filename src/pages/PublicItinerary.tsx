import DayView from '@/components/itinerary/DayView'

export default function PublicItinerary() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Shared Trip</h2>

      <DayView
        day={{
          day: 1,
          city: 'Rome',
          activities: [{ id: '1', title: 'Colosseum', time: '9 AM', cost: 2000 }],
        }}
      />

      <button className="mt-4 text-blue-600 underline">Copy Trip</button>
    </div>
  )
}
