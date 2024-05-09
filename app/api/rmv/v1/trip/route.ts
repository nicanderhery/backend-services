import { Transport } from '@/interfaces/rmv/transport';
import { TransportWay } from '@/interfaces/rmv/transport-way';
import { loadEnv } from '@/lib/env-validator';
import { stations } from '@/lib/rmv/read-stations';
import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const originId = req.nextUrl.searchParams.get('originId');
  const destId = req.nextUrl.searchParams.get('destId');
  const time = req.nextUrl.searchParams.get('time');
  const date = req.nextUrl.searchParams.get('date');
  if (!originId || !destId) {
    return NextResponse.json({ message: 'No origin or destination id provided' }, { status: 400 });
  }
  if (originId === destId) {
    return NextResponse.json({ message: 'Origin and destination are the same' }, { status: 400 });
  }
  const origin = stations.find((station) => station.hafasId === originId);
  const dest = stations.find((station) => station.hafasId === destId);
  if (!origin || !dest) {
    return NextResponse.json({ message: 'Origin or destination is invalid' }, { status: 400 });
  }
  if (time && !checkTimeFormat(time)) {
    return NextResponse.json({ message: 'Time format is incorrect' }, { status: 400 });
  }
  if (date && !checkDateFormat(date)) {
    return NextResponse.json({ message: 'Date format is incorrect' }, { status: 400 });
  }

  const url = new URL('https://www.rmv.de/hapi/trip');
  url.searchParams.append('accessId', loadEnv().RMV_ACCESS_ID);
  url.searchParams.append('originId', originId);
  url.searchParams.append('destId', destId);
  if (time) {
    url.searchParams.append('time', time);
  }
  if (date) {
    url.searchParams.append('date', date);
  }
  url.searchParams.append('format', 'json');

  return fetch(url.toString())
    .then((response) => {
      if (!response.ok) {
        return NextResponse.json({ message: 'RMV API is not available' }, { status: 500 });
      }
      return response.json();
    })
    .then((data) => {
      const trips = data.Trip;
      const ways: TransportWay[] = [];
      for (const trip of trips) {
        const myTransportWay: TransportWay = {
          departure: origin,
          arrival: dest,
          departureDate: trip.Origin.date,
          departureTime: trip.Origin.time,
          arrivalDate: trip.Destination.date,
          arrivalTime: trip.Destination.time,
          using: [],
        };
        const listOfLegs = trip.LegList.Leg;
        for (const leg of listOfLegs) {
          const originStation = stations.find((station) => station.hafasId === leg.Origin.extId);
          const arrivalStation = stations.find(
            (station) => station.hafasId === leg.Destination.extId
          );
          if (!originStation || !arrivalStation) {
            myTransportWay.using = [];
            break;
          }
          const transport: Transport = {
            departure: originStation,
            arrival: arrivalStation,
            departureDate: leg.Origin.date,
            departureTime: leg.Origin.time,
            arrivalDate: leg.Destination.date,
            arrivalTime: leg.Destination.time,
            using: leg.name,
          };
          myTransportWay.using.push(transport);
        }
        if (myTransportWay.using.length > 0) {
          ways.push(myTransportWay);
        }
      }
      return NextResponse.json(ways);
    });
}

/**
 * Check if the time format is correct.
 * @param time Time to check, format: HH:MM
 * @returns {boolean} True if the time format is correct, false otherwise.
 */
const checkTimeFormat = (time: string): boolean => {
  const regex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

/**
 * Check if the date format is correct.
 * @param date Date to check, format: YYYY-MM-DD
 * @returns {boolean} True if the date format is correct, false otherwise.
 */
const checkDateFormat = (date: string): boolean => {
  const regex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  return regex.test(date);
};
