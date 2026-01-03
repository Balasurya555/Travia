import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CityFilter({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-40"><SelectValue placeholder="Filter by Region"/></SelectTrigger>
      <SelectContent>
        <SelectItem value="europe">Europe</SelectItem>
        <SelectItem value="asia">Asia</SelectItem>
        <SelectItem value="america">America</SelectItem>
      </SelectContent>
    </Select>
  )
}
