'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import type * as MapLibreTypes from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EventItem } from '@/lib/data/demoEvents';
import { getMapStyle } from '@/lib/map/style';
import { MapPin } from 'lucide-react';

interface Map2DSectionProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const Map2DSection = React.memo(function Map2DSection({
  events,
  onSelectEvent,
  userCoords,
}: Map2DSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreTypes.Map | null>(null);
  const popupRef = useRef<MapLibreTypes.Popup | null>(null);
  const eventsMapRef = useRef<Map<string, EventItem>>(new Map());

  useEffect(() => {
    const map = new Map<string, EventItem>();
    events.forEach((e) => map.set(e.id, e));
    eventsMapRef.current = map;
  }, [events]);

  const toGeoJSON = useCallback((items: EventItem[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: items.map((e) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.lng, e.lat],
        },
        properties: {
          id: e.id,
          title: e.title,
          artist_name: e.artist_name,
          venue_name: e.venue_name,
          city: e.city,
          is_featured: !!e.is_featured,
          approximate: !!e.approximate_location,
        },
      })),
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    async function initMap() {
      const maplibregl = await import('maplibre-gl');
      if (!isMounted || !containerRef.current) return;

      if (maplibregl.config) {
        maplibregl.config.WORKER_URL = '/maplibre-gl-worker.mjs';
      }

      const defaultDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

      const initialLng = userCoords ? userCoords.lng : events[0]?.lng ?? 12.5674;
      const initialLat = userCoords ? userCoords.lat : events[0]?.lat ?? 41.8719;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getMapStyle(),
        center: [initialLng, initialLat],
        zoom: userCoords ? 6 : 3,
        cooperativeGestures: true,
        pixelRatio: defaultDpr,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      mapRef.current = map;

      // Lower pixel ratio during drag for smooth performance
      map.on('dragstart', () => {
        try { map.setPixelRatio(1); } catch {}
      });
      map.on('dragend', () => {
        try { map.setPixelRatio(defaultDpr); } catch {}
      });

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
      });

      map.on('load', () => {
        if (!isMounted) return;

        map.addSource('map2d-events', {
          type: 'geojson',
          data: toGeoJSON(events),
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 45,
        });

        // 1. Clusters
        map.addLayer({
          id: 'map2d-clusters',
          type: 'circle',
          source: 'map2d-events',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#7C3AED',
              5,
              '#8B5CF6',
              15,
              '#06B6D4',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              16,
              5,
              22,
              15,
              28,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
            'circle-opacity': 0.9,
          },
        });

        // 2. Cluster Count
        map.addLayer({
          id: 'map2d-cluster-count',
          type: 'symbol',
          source: 'map2d-events',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold'],
            'text-size': 11,
          },
          paint: {
            'text-color': '#FFFFFF',
          },
        });

        // 3. Approximate Area Layer
        map.addLayer({
          id: 'map2d-unclustered-approx',
          type: 'circle',
          source: 'map2d-events',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'approximate'], true]],
          paint: {
            'circle-color': 'rgba(139, 92, 246, 0.25)',
            'circle-radius': 18,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(167, 139, 250, 0.7)',
          },
        });

        // 4. Glow outer layer
        map.addLayer({
          id: 'map2d-unclustered-glow',
          type: 'circle',
          source: 'map2d-events',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['get', 'is_featured'],
              'rgba(245, 158, 11, 0.35)',
              'rgba(139, 92, 246, 0.35)',
            ],
            'circle-radius': [
              'case',
              ['get', 'is_featured'],
              12,
              8,
            ],
            'circle-opacity': 0.8,
          },
        });

        // 5. Core Dot
        map.addLayer({
          id: 'map2d-unclustered-point',
          type: 'circle',
          source: 'map2d-events',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['get', 'is_featured'],
              '#F59E0B',
              '#22D3EE',
            ],
            'circle-radius': [
              'case',
              ['get', 'is_featured'],
              6,
              5,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
          },
        });

        // Cluster click -> zoom in
        map.on('click', 'map2d-clusters', async (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['map2d-clusters'] });
          const clusterId = features[0]?.properties?.cluster_id;
          if (clusterId == null) return;
          const source = map.getSource('map2d-events') as MapLibreTypes.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const geom = features[0].geometry as GeoJSON.Point;
            map.easeTo({
              center: geom.coordinates as [number, number],
              zoom,
              duration: 800,
            });
          } catch {}
        });

        // Event click
        map.on('click', 'map2d-unclustered-point', (e) => {
          const feature = e.features?.[0];
          const id = feature?.properties?.id;
          if (!id) return;
          const event = eventsMapRef.current.get(id);
          if (event) {
            onSelectEvent(event);
          }
        });

        // Hover popup
        map.on('mousemove', 'map2d-unclustered-point', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features?.[0];
          if (!feature) return;
          const geom = feature.geometry as GeoJSON.Point;
          const p = feature.properties;
          if (popupRef.current && geom.coordinates) {
            popupRef.current
              .setLngLat(geom.coordinates as [number, number])
              .setHTML(`
                <div style="font-family: inherit; font-size: 11px; padding: 2px 4px; color: #fff; background: rgba(15,15,26,0.95); border-radius: 6px;">
                  <strong style="color: #22D3EE;">${p.artist_name || ''}</strong><br/>
                  <span style="color: #94A3B8;">${p.venue_name || ''} • ${p.city || ''}</span>
                </div>
              `)
              .addTo(map);
          }
        });

        map.on('mouseleave', 'map2d-unclustered-point', () => {
          map.getCanvas().style.cursor = '';
          popupRef.current?.remove();
        });

        map.on('mouseenter', 'map2d-clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'map2d-clusters', () => {
          map.getCanvas().style.cursor = '';
        });
      });
    }

    initMap();

    return () => {
      isMounted = false;
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update source data on events change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('map2d-events') as MapLibreTypes.GeoJSONSource | undefined;
    if (source && typeof source.setData === 'function') {
      source.setData(toGeoJSON(events));
    }
  }, [events, toGeoJSON]);

  return (
    <div className="w-full h-[450px] sm:h-[520px] rounded-2xl overflow-hidden glass-panel border border-white/10 relative shadow-2xl animate-in fade-in duration-300">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 2D indicator badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-xs font-semibold text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-lg pointer-events-auto">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>2D Map View</span>
        </div>
      </div>
    </div>
  );
});
