'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type * as MapLibreTypes from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EventItem } from '@/lib/data/demoEvents';
import { getMapStyle } from '@/lib/map/style';
import { Maximize2, Minimize2, Navigation, Compass, RotateCcw } from 'lucide-react';

interface GlobeHeroProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  selectedEventId?: string | null;
  onNearMeClick?: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const GlobeHero = React.memo(function GlobeHero({
  events,
  onSelectEvent,
  selectedEventId,
  onNearMeClick,
  userCoords,
}: GlobeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreTypes.Map | null>(null);
  const popupRef = useRef<MapLibreTypes.Popup | null>(null);
  const isIntersectingRef = useRef(false);
  const isRotatingRef = useRef(true);
  const rotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eventsMapRef = useRef<Map<string, EventItem>>(new Map());

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Keep an O(1) lookup map for events
  useEffect(() => {
    const map = new Map<string, EventItem>();
    events.forEach((e) => map.set(e.id, e));
    eventsMapRef.current = map;
  }, [events]);

  // Convert events list to GeoJSON FeatureCollection
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
          genre: e.genre,
          is_featured: !!e.is_featured,
          approximate: !!e.approximate_location,
        },
      })),
    };
  }, []);

  // Initialize MapLibre with capped pixel ratio and globe projection
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

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getMapStyle(),
        center: [12.5674, 41.8719],
        zoom: 2.2,
        minZoom: 1.5,
        maxZoom: 14,
        cooperativeGestures: true,
        pixelRatio: defaultDpr,
      });

      mapRef.current = map;

      // Lower pixel ratio while dragging for smooth performance
      map.on('dragstart', () => {
        try { map.setPixelRatio(1); } catch {}
      });
      map.on('dragend', () => {
        try { map.setPixelRatio(defaultDpr); } catch {}
      });

      // Single shared hover popup
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
      });

      map.on('load', () => {
        if (!isMounted) return;

        try {
          map.setProjection({ type: 'globe' });
        } catch (err) {
          console.warn('Globe projection fallback:', err);
        }

        // Add clustered GeoJSON source
        map.addSource('events-source', {
          type: 'geojson',
          data: toGeoJSON(events),
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 45,
        });

        // 1. Cluster Circles Layer
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'events-source',
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

        // 2. Cluster Count Text Layer
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'events-source',
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
          id: 'unclustered-approx',
          type: 'circle',
          source: 'events-source',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'approximate'], true]],
          paint: {
            'circle-color': 'rgba(139, 92, 246, 0.25)',
            'circle-radius': 18,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(167, 139, 250, 0.7)',
          },
        });

        // 4. Unclustered Outer Glow Layer (CSS/layer effect)
        map.addLayer({
          id: 'unclustered-glow',
          type: 'circle',
          source: 'events-source',
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
              13,
              9,
            ],
            'circle-opacity': 0.8,
          },
        });

        // 5. Unclustered Core Dot Layer
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'events-source',
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

        // Click on cluster -> zoom in
        map.on('click', 'clusters', async (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0]?.properties?.cluster_id;
          if (clusterId == null) return;
          const source = map.getSource('events-source') as MapLibreTypes.GeoJSONSource;
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

        // Click on individual event point
        map.on('click', 'unclustered-point', (e) => {
          const feature = e.features?.[0];
          const id = feature?.properties?.id;
          if (!id) return;
          const event = eventsMapRef.current.get(id);
          if (event) {
            isRotatingRef.current = false;
            onSelectEvent(event);
          }
        });

        // Hover effect & popup
        map.on('mousemove', 'unclustered-point', (e) => {
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

        map.on('mouseleave', 'unclustered-point', () => {
          map.getCanvas().style.cursor = '';
          popupRef.current?.remove();
        });

        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = '';
        });

        setInitialLoaded(true);

        // Fetch visitor approximate location
        fetch('/api/geo')
          .then((res) => res.json())
          .then((geo) => {
            if (geo && typeof geo.lng === 'number' && typeof geo.lat === 'number') {
              map.flyTo({
                center: [geo.lng, geo.lat],
                zoom: geo.isDefault ? 2.5 : 3.5,
                duration: 2500,
                essential: true,
              });
            }
          })
          .catch(() => {});
      });

      // Pause rotation on user interaction
      const pauseRotation = () => {
        isRotatingRef.current = false;
        if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
        rotateTimerRef.current = setTimeout(() => {
          isRotatingRef.current = true;
        }, 8000);
      };

      map.on('mousedown', pauseRotation);
      map.on('touchstart', pauseRotation);
      map.on('wheel', pauseRotation);
    }

    initMap();

    return () => {
      isMounted = false;
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update GeoJSON source data without recreating any DOM elements
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialLoaded) return;
    const source = map.getSource('events-source') as MapLibreTypes.GeoJSONSource | undefined;
    if (source && typeof source.setData === 'function') {
      source.setData(toGeoJSON(events));
    }
  }, [events, initialLoaded, toGeoJSON]);

  // Pause rotation and rendering when off-screen or tab hidden (IntersectionObserver + visibilitychange)
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        isIntersectingRef.current = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);

    const handleVisibility = () => {
      // Rotation logic checks document.hidden
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Smooth rotation tick, strictly paused when offscreen or hidden
  useEffect(() => {
    if (!initialLoaded) return;

    const interval = setInterval(() => {
      const map = mapRef.current;
      if (!map || !isRotatingRef.current || !isIntersectingRef.current || document.hidden) {
        return;
      }
      const center = map.getCenter();
      center.lng -= 0.15;
      map.easeTo({
        center,
        duration: 900,
        easing: (n: number) => n,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialLoaded]);

  // Handle fly to user coords if provided via "Near Me"
  useEffect(() => {
    if (userCoords && mapRef.current) {
      isRotatingRef.current = false;
      mapRef.current.flyTo({
        center: [userCoords.lng, userCoords.lat],
        zoom: 6,
        duration: 2000,
        essential: true,
      });
    }
  }, [userCoords]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        mapRef.current?.resize();
      }, 250);
      return next;
    });
  };

  const handleResetOrientation = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [12.5674, 41.8719],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      duration: 1500,
    });
  };

  return (
    <div
      className={`relative w-full transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen bg-[#07070D]'
          : 'h-[500px] sm:h-[620px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Overlay Badges & Title */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-semibold text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Interactive 3D Live Globe</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <p className="text-xs text-slate-400 mt-2 hidden sm:block max-w-xs drop-shadow">
          Drag to spin worldwide • Click pins for tickets & live details • Two fingers to scroll on mobile
        </p>
      </div>

      {/* Floating Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2">
        {onNearMeClick && (
          <button
            onClick={onNearMeClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-400/50 transition-all shadow-lg active:scale-95"
            title="Locate events near you"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Near me</span>
          </button>
        )}

        <button
          onClick={handleResetOrientation}
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-violet-400/50 transition-all shadow-lg active:scale-95"
          title="Reset View"
          aria-label="Reset View"
        >
          <RotateCcw className="w-4 h-4 text-violet-400" />
        </button>

        {/* Explore Globe Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all active:scale-95"
          title={isFullscreen ? 'Exit Fullscreen' : 'Explore Globe (Full Screen)'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              <span>Explore Globe</span>
            </>
          )}
        </button>
      </div>

      {/* Legend at bottom left */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-[#0F0F1A]/85 backdrop-blur-md border border-white/10 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm" />
          <span>Live gig</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
          <span>Featured</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-dashed border-cyan-400 bg-violet-500/30 inline-block" />
          <span>Approximate area</span>
        </div>
      </div>
    </div>
  );
});
