import { cache } from 'react'
import { client } from "@/lib/triplit"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getDivision,
  leagueDivisionsSchema,
  type LeagueDivision,
} from "@/lib/ratingSystem"

interface ParticipantsTableProps {
  eventId: string
  minLevel?: LeagueDivision
  maxLevel?: LeagueDivision
}

const fetchParticipants = cache(async (eventId: string) => {
  const query = client
    .query("event_registrations")
    .where("event_id", "=", eventId)
    .build()

  const registrations = await client.fetch(query)
  const usersQuery = client.query("users").build()
  const users = await client.fetch(usersQuery)

  return registrations.map((r) => ({
    ...r,
    user: users.find((u) => u.id === r.user_id),
  }))
})

export default async function ParticipantsTable({
  eventId,
  minLevel,
  maxLevel,
}: ParticipantsTableProps) {
  const participants = await fetchParticipants(eventId)

  const filterParticipants = (registrations: typeof participants) => {
    if (!minLevel || !maxLevel) return registrations

    return registrations?.filter((registration) => {
      const currentDivision = registration.user?.current_division
      if (!currentDivision) return true

      const division = getDivision(currentDivision)
      const minIndex = leagueDivisionsSchema.options.indexOf(minLevel)
      const maxIndex = leagueDivisionsSchema.options.indexOf(maxLevel)
      const currentIndex = leagueDivisionsSchema.options.indexOf(division)
      return currentIndex >= minIndex && currentIndex <= maxIndex
    })
  }

  const filteredParticipants = filterParticipants(participants)

  // Convert participants to JSON string
  const participantsJson = JSON.stringify(filteredParticipants, null, 2);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Division</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredParticipants?.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                {registration.user
                  ? `${registration.user.first_name} ${registration.user.last_name}`
                  : "Unknown User"}
              </TableCell>
              <TableCell>
                {registration.user?.current_division || "Not Available"}
              </TableCell>
              <TableCell>
                {registration.user?.rating != null 
                  ? registration.user.rating.toFixed(2)
                  : "Not Available"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
