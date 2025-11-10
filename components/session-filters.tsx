"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TutorOption = {
  id: string
  name: string
}

type SessionFilterValues = {
  from: string
  to: string
  tutorId: string
  firstSession: string
  rescheduled: string
  noShow: string
}

type SessionFiltersProps = {
  tutors: TutorOption[]
  values: SessionFilterValues
}

export function SessionFilters({ tutors, values }: SessionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const ANY_VALUE = "__any__"

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === ANY_VALUE) {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  function clearFilters() {
    startTransition(() => {
      router.replace(pathname)
    })
  }

  const hasFilters =
    !!(values.tutorId || values.firstSession || values.rescheduled || values.noShow)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          type="date"
          value={values.from}
          onChange={(event) => update("from", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="date"
          value={values.to}
          onChange={(event) => update("to", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tutor">Tutor</Label>
        <Select
          value={values.tutorId || ANY_VALUE}
          onValueChange={(value) => update("tutorId", value)}
        >
          <SelectTrigger id="tutor">
            <SelectValue placeholder="All tutors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>All tutors</SelectItem>
            {tutors.map((tutor) => (
              <SelectItem key={tutor.id} value={tutor.id}>
                {tutor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="firstSession">First session</Label>
        <Select
          value={values.firstSession || ANY_VALUE}
          onValueChange={(value) => update("firstSession", value)}
        >
          <SelectTrigger id="firstSession">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Any</SelectItem>
            <SelectItem value="true">First session</SelectItem>
            <SelectItem value="false">Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rescheduled">Rescheduled</Label>
        <Select
          value={values.rescheduled || ANY_VALUE}
          onValueChange={(value) => update("rescheduled", value)}
        >
          <SelectTrigger id="rescheduled">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Any</SelectItem>
            <SelectItem value="true">Rescheduled</SelectItem>
            <SelectItem value="false">Not rescheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="noShow">No-show</Label>
        <Select
          value={values.noShow || ANY_VALUE}
          onValueChange={(value) => update("noShow", value)}
        >
          <SelectTrigger id="noShow">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_VALUE}>Any</SelectItem>
            <SelectItem value="true">No-show</SelectItem>
            <SelectItem value="false">Attended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
            className="w-full"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
