import { Station } from './station';

export interface Transport {
    departure: Station;
    arrival: Station;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    using: string;
}
