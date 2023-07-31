import { Station } from './station';
import { Transport } from './transport';

export interface TransportWay {
    departure: Station;
    arrival: Station;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    using: Transport[];
}
