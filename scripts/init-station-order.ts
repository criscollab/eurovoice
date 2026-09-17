import { db } from '../src/lib/db'

async function main() {
  // Get all stations in their current order (by createdAt)
  const stations = await db.station.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, order: true },
  })

  console.log(`Found ${stations.length} stations. Assigning order values...\n`)

  // Assign sequential order values
  for (let i = 0; i < stations.length; i++) {
    await db.station.update({
      where: { id: stations[i].id },
      data: { order: i },
    })
    console.log(`  ${i}: ${stations[i].name}`)
  }

  console.log('\n✅ Order values assigned successfully')
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
