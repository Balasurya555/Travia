import { Input } from '@/components/ui/input'

export default function SearchBar({ onChange }: { onChange: (v: string) => void }) {
  return (
    <Input
      placeholder="Search cities or trips..."
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
