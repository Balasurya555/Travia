import { Button } from '@/components/ui/button'

export default function CityCard({ city }: { city: any }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <h4 className="font-semibold">{city.name}</h4>
      <p className="text-sm text-muted-foreground">
        {city.country} · {city.region}
      </p>
      <Button className="mt-2">Add to Trip</Button>
    </div>
  )
}
