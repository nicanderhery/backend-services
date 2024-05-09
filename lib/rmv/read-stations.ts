import { Station } from '@/interfaces/rmv/station';
import helper from 'csvtojson';

export const readStations = async (): Promise<Station[]> => {
  const filepath = './data/rmv/RMV_Haltestellen_Tarifperiode_2022_23_Stand_2022-12-21.csv';
  const stations: Station[] = (await helper({ delimiter: ';' }).fromFile(filepath)) as Station[];

  return stations;
};

export const stations: Station[] = [];
readStations()
  .then((data) => {
    stations.push(...data);
  })
  .catch((error) => {
    throw new Error(error);
  });
