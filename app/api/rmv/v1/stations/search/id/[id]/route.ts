import { stations } from '@/lib/rmv/read-stations';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  id: string;
};

export function GET(req: NextRequest, context: { params: Params }) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ message: 'You need to provide an id' }, { status: 400 });
  }
  const matchStation = stations.find((station) => station.hafasId === id);
  if (!matchStation) {
    return NextResponse.json({ message: 'No station found' }, { status: 404 });
  }
  return NextResponse.json(matchStation);
}
