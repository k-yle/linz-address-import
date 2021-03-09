import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';
import { LinzSourceAddress, LinzData } from '../types';

const input = join(__dirname, '../../data/linz.csv');
const output = join(__dirname, '../../data/linz.json');

// TODO: perf baseline is 50seconds
function linzToJson(): Promise<LinzData> {
  return new Promise((resolve, reject) => {
    const out: LinzData = {};
    let i = 0;

    createReadStream(input)
      .pipe(csv())
      .on('data', (data: LinzSourceAddress) => {
        if (data.address_type !== 'Road') return; // skip water addresses
        out[data.address_id] = {
          housenumber: data.full_address_number,
          street: data.full_road_name,
          suburb: [data.town_city ? 'U' : 'R', data.suburb_locality],
          lat: +data.shape_Y,
          lng: +data.shape_X,
        };

        i += 1;
        if (!(i % 1000)) process.stdout.write('.');
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function processLinzData(): Promise<void> {
  const res = await linzToJson();
  await fs.writeFile(output, JSON.stringify(res));
}
