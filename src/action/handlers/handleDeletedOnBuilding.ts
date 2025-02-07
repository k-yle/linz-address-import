import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types.js';
import {
  LAYER_PREFIX,
  createDiamond,
  deleteAllAddressTags,
  outFolder,
  toLink,
} from '../util/index.js';

export async function handleDeletedOnBuilding(
  array: StatusReport[Status.NEEDS_DELETE_ON_BUILDING],
): Promise<HandlerReturn> {
  const bySuburb = array.reduce(
    (ac, [linzId, [suburb, osmAddr]]) => {
      ac[suburb] ||= [];
      ac[suburb].push([linzId, osmAddr]);
      return ac;
    },
    {} as Record<string, [string, OsmAddr][]>,
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, osmAddr] of bySuburb[suburb]) {
      report += `${linzId}\t\tneeds deleting but is on a building\t\t${toLink(
        osmAddr.osmId,
      )}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'needs-delete-on-building.txt'), report);

  const features: HandlerReturn = {};

  for (const [, [suburb, osmAddr]] of array) {
    features[LAYER_PREFIX + suburb] ||= [];
    features[LAYER_PREFIX + suburb].push({
      type: 'Feature',
      id: osmAddr.osmId,
      geometry: {
        type: 'Polygon',
        coordinates: createDiamond(osmAddr),
      },
      properties: {
        __action: 'edit',
        ...deleteAllAddressTags(),
      },
    });
  }

  return features;
}
