"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Option = {
  value: string
  label: string
}

type TutorFiltersProps = {
  cohorts: Option[]
  riskBands: Option[]
}

export function TutorFilters({ cohorts, riskBands }: TutorFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const ALL_VALUE = "__all__"

  const currentRisk = searchParams.get("risk") ?? ""
  const currentCohort = searchParams.get("cohort") ?? ""

  const riskValue = currentRisk || ALL_VALUE
  const cohortValue = currentCohort || ALL_VALUE

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) {
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={riskValue}
        onValueChange={(value) =>
          updateParam("risk", value === ALL_VALUE ? "" : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Risk band" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All risk bands</SelectItem>
          {riskBands.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={cohortValue}
        onValueChange={(value) =>
          updateParam("cohort", value === ALL_VALUE ? "" : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Cohort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All cohorts</SelectItem>
          {cohorts.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(currentRisk || currentCohort) && (
        <Button variant="outline" size="sm" onClick={clearFilters} disabled={isPending}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
