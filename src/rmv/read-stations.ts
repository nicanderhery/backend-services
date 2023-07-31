import helper from 'csvtojson';
import { Station } from './interfaces/station';

export const readStations = async (): Promise<Station[]> => {
    const filepath = './src/rmv/data/RMV_Haltestellen_Tarifperiode_2022_23_Stand_2022-12-21.csv';
    const stations: Station[] = (await helper({ delimiter: ';' }).fromFile(filepath)) as Station[];

    return stations;
};
