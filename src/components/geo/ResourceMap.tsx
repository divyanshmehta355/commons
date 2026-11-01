'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface ResourceMapProps {
  resources: any[];
  userLocation: { lat: number; lng: number } | null;
  onSelectResource?: (resourceId: string) => void;
}

export function ResourceMap({ resources, userLocation }: ResourceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter items that have coordinates
  const itemsWithCoords = resources.filter(
    (r) => r.location && Array.isArray(r.location) && r.location.length === 2
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically inject Leaflet stylesheet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically inject Leaflet script if not present
    const initLeafletMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // Avoid double-initialization
      if (!mapInstanceRef.current) {
        const defaultCenter = userLocation
          ? [userLocation.lat, userLocation.lng]
          : itemsWithCoords.length > 0
          ? [itemsWithCoords[0].location[1], itemsWithCoords[0].location[0]]
          : [12.9716, 77.5946]; // Bengaluru default

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: userLocation ? 13 : 12,
          zoomControl: true,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
        setMapLoaded(true);
      }
    };

    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        initLeafletMap();
      };
      document.body.appendChild(script);
    } else {
      initLeafletMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever resources or userLocation changes
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;

    if (!L || !map || !layer) return;

    layer.clearLayers();

    const bounds: [number, number][] = [];

    // Render User Location marker
    if (userLocation) {
      const userLatLng: [number, number] = [userLocation.lat, userLocation.lng];
      bounds.push(userLatLng);

      const userIcon = L.divIcon({
        className: 'user-pin-marker',
        html: `
          <div style="background-color: #0284c7; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.35);"></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(userLatLng, { icon: userIcon })
        .bindPopup('<b>Your Approximate Location</b><br/>Sharing within this radius.')
        .addTo(layer);
    }

    // Render Resource Item markers
    itemsWithCoords.forEach((item) => {
      // item.location is [lon, lat], Leaflet uses [lat, lon]
      const latLng: [number, number] = [item.location[1], item.location[0]];
      bounds.push(latLng);

      const itemIcon = L.divIcon({
        className: 'resource-pin-marker',
        html: `
          <div style="background-color: #065f46; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
            📍
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 170px; padding: 2px;">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />`
              : ''
          }
          <div style="font-weight: bold; font-size: 13px; color: #1c1917; margin-bottom: 2px;">${item.title}</div>
          <div style="color: #065f46; font-size: 11px; font-weight: 600;">${item.communityName || 'Community'}</div>
          ${
            item.distanceFormatted
              ? `<div style="color: #047857; font-size: 11px; font-weight: 700; margin-top: 3px;">📍 ${item.distanceFormatted}</div>`
              : ''
          }
          <div style="margin-top: 4px; font-size: 11px; color: #78716c;">Mode: <b>${item.exchangeMode}</b></div>
          <a href="/resources/${item.$id}" style="display: block; text-align: center; background-color: #047857; color: white; font-weight: 600; padding: 6px 10px; border-radius: 8px; text-decoration: none; margin-top: 8px; font-size: 11px;">
            View Item →
          </a>
        </div>
      `;

      L.marker(latLng, { icon: itemIcon }).bindPopup(popupHtml).addTo(layer);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [itemsWithCoords, userLocation, mapLoaded]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-stone-200 shadow-md text-xs space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-800 border-2 border-white shadow-2xs" />
          <span className="font-semibold text-stone-800">Resource (~1km centroid)</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow-2xs" />
            <span className="font-semibold text-stone-800">Your Location</span>
          </div>
        )}
      </div>

      {itemsWithCoords.length === 0 && (
        <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-xs text-center">
          <MapPin className="w-10 h-10 text-stone-400 mb-2" />
          <h4 className="font-bold text-stone-800 text-sm">No Geo-Tagged Items Found</h4>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            Items in your search have not specified approximate pickup areas yet.
          </p>
        </div>
      )}
    </div>
  );
}
