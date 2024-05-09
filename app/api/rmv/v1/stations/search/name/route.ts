import { Station } from '@/interfaces/rmv/station';
import { stations } from '@/lib/rmv/read-stations';
import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');
  if (!query) {
    return NextResponse.json({ message: 'No query provided' }, { status: 400 });
  }

  // Filter stations that have a name that contains the query
  const filteredStations: Station[] = [];
  filteredStations.push(...stations.filter((station) => stationFilter(station, query)));

  return NextResponse.json(filteredStations);
}

/**
 * Filter stations by name. count the number of words in the query and check if the station name contains all of them.
 * @param station Station to check
 * @param query Query to check
 * @returns {boolean} True if the station name contains all words of the query, false otherwise.
 */
const stationFilter = (station: Station, query: string): boolean => {
  const querySplit = query.split(' ');
  let counter = querySplit.length;
  for (const queryPart of querySplit) {
    if (station.nameFahrPlan.toLowerCase().includes(queryPart.toLowerCase())) {
      counter -= 1;
    }

    if (counter === 0) {
      return true;
    }
  }
  return false;
};
