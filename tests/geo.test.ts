import { describe, it, expect } from 'vitest';
import {
  calculateDistanceKm,
  formatDistance,
  fuzzCoordinates,
  isPointInPolygon,
  resolveApproximateLocation,
  CoordinatePoint,
  CoordinatePolygon,
} from '../src/lib/geo/spatial';

describe('Geo-Spatial Utilities & Spatial Columns Logic', () => {
  it('calculates Haversine distance between two points accurately', () => {
    // Indiranagar: [77.6412, 12.9784]
    // Koramangala: [77.6208, 12.9352]
    const indiranagar: CoordinatePoint = [77.6412, 12.9784];
    const koramangala: CoordinatePoint = [77.6208, 12.9352];

    const distance = calculateDistanceKm(indiranagar, koramangala);
    // Real distance between Indiranagar and Koramangala is ~5.3 km
    expect(distance).toBeGreaterThan(4.5);
    expect(distance).toBeLessThan(6.0);

    // Distance to same point is 0
    expect(calculateDistanceKm(indiranagar, indiranagar)).toBe(0);
  });

  it('formats distance into human-readable strings', () => {
    expect(formatDistance(0.45)).toBe('450 m away');
    expect(formatDistance(0.8)).toBe('800 m away');
    expect(formatDistance(1.23)).toBe('1.2 km away');
    expect(formatDistance(5.0)).toBe('5.0 km away');
  });

  it('fuzzes coordinates to neighborhood grid to protect resident privacy', () => {
    const exactLocation: CoordinatePoint = [77.641289, 12.978432];
    const fuzzed = fuzzCoordinates(exactLocation, 2);

    expect(fuzzed).toEqual([77.64, 12.98]);
    expect(fuzzed[0]).not.toBe(exactLocation[0]);
    expect(fuzzed[1]).not.toBe(exactLocation[1]);
  });

  it('correctly determines whether a point is inside a polygon boundary', () => {
    // Simple square polygon around Bengaluru center
    // [[lon, lat], [lon, lat], ...]
    const boundary: CoordinatePolygon = [
      [
        [77.5, 12.9],
        [77.7, 12.9],
        [77.7, 13.1],
        [77.5, 13.1],
        [77.5, 12.9],
      ],
    ];

    const insidePoint: CoordinatePoint = [77.6, 13.0];
    const outsidePoint: CoordinatePoint = [78.0, 14.0];

    expect(isPointInPolygon(insidePoint, boundary)).toBe(true);
    expect(isPointInPolygon(outsidePoint, boundary)).toBe(false);
  });

  it('resolves neighborhood and city names to coordinates', () => {
    expect(resolveApproximateLocation('Indiranagar, Bengaluru')).toEqual([77.6412, 12.9784]);
    expect(resolveApproximateLocation('Koramangala 4th Block')).toEqual([77.6208, 12.9352]);
    expect(resolveApproximateLocation('Mumbai')).toEqual([72.8777, 19.0760]);
  });
});
