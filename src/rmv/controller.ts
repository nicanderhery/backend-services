import { RequestHandler, Router } from 'express';
import { SM } from '..';
import { RmvResponse } from './interfaces/response';
import { Station } from './interfaces/station';
import { Transport } from './interfaces/transport';
import { TransportWay } from './interfaces/transport-way';
import { readStations } from './read-stations';

const stations: Station[] = [];
readStations()
    .then((data) => {
        stations.push(...data);
    })
    .catch((error) => {
        throw new Error(`Error reading stations: ${error}`);
    });

const rmvAccessId = process.env.RMV_ACCESS_ID;
if (!rmvAccessId) {
    throw new Error('No RMV access id found');
}

const baseUrl = SM.get('baseUrl');
if (!baseUrl) {
    throw new Error('No base url found');
}

const apiRoute = SM.get('apiRoute');
if (!apiRoute) {
    throw new Error('No api route found');
}

const router = Router({ mergeParams: true });

// Redirect to the latest version
router.get('/', (_req, res) => {
    res.redirect(`/${apiRoute}/rmv/v1`);
});

router.get('/v1', (_req, res) => {
    res.status(200).send({ message: 'API v1' });
});

router.get('/v1/stations/search/name', (req, res) => {
    const query = req.query.query as string;
    if (!query) {
        return res.status(400).send({ message: 'No query provided' });
    }

    // Filter stations that have a name that contains the query
    const filteredStations: Station[] = [];
    filteredStations.push(
        ...stations.filter((station) => {
            return stationFilter(station, query);
        }),
    );

    res.status(200).send(filteredStations);
});

router.get('/v1/stations/search/id/:id', (req, res) => {
    const id = req.params.id as unknown as number;
    if (!id) {
        return res.status(400).send({ message: 'No id provided' });
    }

    const station = stations.find((station) => station.hafasId === id);
    if (!station) {
        return res.status(404).send({ message: 'Station not found' });
    }

    res.status(200).send(station);
});

router.get('/v1/trip', (async (req, res) => {
    // Get the parameters from the request
    const originId = req.query.originId as unknown as number;
    const destId = req.query.destId as unknown as number;
    const time = req.query.time as string;
    const date = req.query.date as string;
    const origin = stations.find((station) => station.hafasId === originId);
    const dest = stations.find((station) => station.hafasId === destId);

    // Check if the parameters are valid
    if (!originId || !destId) {
        return res.status(400).send({ message: 'No origin or destination id provided' });
    }

    // Check if the origin and destination are the same
    if (originId === destId) {
        return res.status(400).send({ message: 'Origin and destination are the same' });
    }

    // Check if the origin and destination are valid
    if (!origin || !dest) {
        return res.status(400).send({ message: 'Origin or destination is invalid' });
    }

    // Check if time is given and if it is in the correct format
    if (time && !checkTimeFormat(time)) {
        return res.status(400).send({ message: 'Time format is incorrect' });
    }

    // Check if date is given and if it is in the correct format
    if (date && !checkDateFormat(date)) {
        return res.status(400).send({ message: 'Date format is incorrect' });
    }

    // Fetch trip from rmv api
    const url = new URL('https://www.rmv.de/hapi/trip');
    url.searchParams.append('accessId', rmvAccessId);
    url.searchParams.append('originId', originId.toString());
    url.searchParams.append('destId', destId.toString());
    if (time) {
        url.searchParams.append('time', time);
    }
    if (date) {
        url.searchParams.append('date', date);
    }
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());

    // Check if the response is valid
    if (!response.ok) {
        return res.status(500).send({ message: 'RMV API is not available' });
    }

    // Get data from response
    const data = (await response.json()) as RmvResponse;
    const trips = data.Trip;
    const ways: TransportWay[] = [];

    // Loop through all trips, create TransportWay objects and push them to listOfWays
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

        // Loop through all legs of the trip, create Transport objects and push them to myTransportWay.using
        const listOfLegs = trip.LegList.Leg;
        for (const leg of listOfLegs) {
            const originStation = stations.find((station) => station.hafasId === leg.Origin.extId);
            const arrivalStation = stations.find(
                (station) => station.hafasId === leg.Destination.extId,
            );
            // Check if the origin and destination are valid, otherwise this trip is invalid
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

        // Insert the TransportWay object into the list of ways only when there is at least one transport in it
        if (myTransportWay.using.length > 0) {
            ways.push(myTransportWay);
        }
    }

    res.status(200).send(ways);
}) as RequestHandler);

export default router;

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
            counter--;
        }

        if (counter === 0) {
            return true;
        }
    }
    return false;
};

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
