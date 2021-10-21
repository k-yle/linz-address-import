import { MapCat } from '../const';

describe('MapCat', () => {
  it('maps seamark properties', () => {
    expect(MapCat('CATOFP', '2')).toBe('production');

    // this one is recursive
    expect(MapCat('CATOFP', 'pRoDuction platform')).toBe('production');
  });
});
