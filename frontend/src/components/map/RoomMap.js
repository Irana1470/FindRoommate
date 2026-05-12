import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import './RoomMap.css';

const VIETNAM_CENTER = [14.0583, 108.2772];
const DEFAULT_ZOOM = 6;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'user-location-marker',
});

const geocodeCache = new Map();

const buildFullAddress = post =>
  [post.address, post.district, post.city]
    .filter(Boolean)
    .join(', ');

// Geocoding: đổi địa chỉ dạng chữ thành latitude/longitude bằng Nominatim.
const geocodeAddress = async address => {
  const normalizedAddress = address.trim();
  if (!normalizedAddress) return null;
  if (geocodeCache.has(normalizedAddress)) return geocodeCache.get(normalizedAddress);

  const params = new URLSearchParams({
    q: normalizedAddress,
    format: 'json',
    limit: '1',
    countrycodes: 'vn',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await response.json();
  const firstResult = data?.[0];
  const coordinates = firstResult
    ? { lat: Number(firstResult.lat), lon: Number(firstResult.lon) }
    : null;

  geocodeCache.set(normalizedAddress, coordinates);
  return coordinates;
};

// Distance calculation: Haversine formula, trả về khoảng cách theo kilomet.
const calculateDistanceKm = (fromLat, fromLon, toLat, toLon) => {
  const earthRadiusKm = 6371;
  const toRad = degree => degree * Math.PI / 180;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

function FitMapBounds({ posts, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const points = posts
      .filter(post => post.lat && post.lon)
      .map(post => [post.lat, post.lon]);

    if (userLocation) {
      points.push([userLocation.lat, userLocation.lon]);
    }

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, { padding: [36, 36] });
  }, [map, posts, userLocation]);

  return null;
}

export default function RoomMap({ posts, userAddress }) {
  const [mappedPosts, setMappedPosts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState('');

  const normalizedUserAddress = userAddress.trim();

  useEffect(() => {
    let active = true;

    const loadMapData = async () => {
      setLoadingMap(true);
      setMapError('');

      try {
        // API fetch đã thực hiện ở trang cha; tại đây chỉ geocode dữ liệu bài/phòng.
        const geocodedPosts = await Promise.all(posts.map(async post => {
          const fullAddress = buildFullAddress(post);
          const coordinates = await geocodeAddress(fullAddress);
          return coordinates
            ? { ...post, ...coordinates, fullAddress }
            : { ...post, fullAddress };
        }));

        const nextUserLocation = normalizedUserAddress
          ? await geocodeAddress(normalizedUserAddress)
          : null;

        const postsWithDistance = geocodedPosts.map(post => {
          if (!nextUserLocation || !post.lat || !post.lon) return post;

          return {
            ...post,
            distanceKm: calculateDistanceKm(
              nextUserLocation.lat,
              nextUserLocation.lon,
              post.lat,
              post.lon,
            ),
          };
        });

        if (active) {
          setMappedPosts(postsWithDistance);
          setUserLocation(nextUserLocation);
          if (normalizedUserAddress && !nextUserLocation) {
            setMapError('Không tìm thấy tọa độ cho địa chỉ của bạn.');
          }
        }
      } catch (error) {
        if (active) {
          setMapError('Không tải được dữ liệu bản đồ. Vui lòng thử lại sau.');
        }
      } finally {
        if (active) {
          setLoadingMap(false);
        }
      }
    };

    loadMapData();

    return () => {
      active = false;
    };
  }, [posts, normalizedUserAddress]);

  const sortedPosts = useMemo(() => {
    if (!normalizedUserAddress) return mappedPosts;
    return [...mappedPosts].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [mappedPosts, normalizedUserAddress]);

  return (
    <div className="room-map-section">
      <div className="room-map-shell">
        <MapContainer center={VIETNAM_CENTER} zoom={DEFAULT_ZOOM} className="room-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapBounds posts={mappedPosts} userLocation={userLocation} />

          {mappedPosts.filter(post => post.lat && post.lon).map(post => (
            <Marker key={post.id} position={[post.lat, post.lon]}>
              <Popup>
                <strong>{post.title}</strong>
                <div>{post.fullAddress}</div>
                {normalizedUserAddress && post.distanceKm != null && (
                  <div>Khoảng cách: {post.distanceKm.toFixed(1)} km</div>
                )}
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker icon={userIcon} position={[userLocation.lat, userLocation.lon]}>
              <Popup>Vị trí của bạn</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {loadingMap && <div className="room-map-note">Đang tải bản đồ...</div>}
      {mapError && <div className="room-map-error">{mapError}</div>}

      {normalizedUserAddress && sortedPosts.length > 0 && (
        <div className="room-distance-list">
          {sortedPosts.map(post => (
            <div key={post.id} className="room-distance-item">
              <span>{post.title}</span>
              <strong>{post.distanceKm != null ? `${post.distanceKm.toFixed(1)} km` : 'Chưa có tọa độ'}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
