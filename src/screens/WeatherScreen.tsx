// src/screens/WeatherScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import DayCard from "@components/DayCard";
import type { DailyWeather } from "@utils/weather";

// Shape of Open-Meteo daily response
type OpenMeteoDaily = {
    time: string[]; // ISO dates, e.g. "2025-11-17"
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
    weathercode?: number[];
};

type OpenMeteoResponse = {
    daily: OpenMeteoDaily;
};

// Optional: very basic description from weather code
function describeWeatherCode(code: number | undefined): string {
    if (code == null) return "";
    if (code === 0) return "Clear sky";
    if (code === 1 || code === 2) return "Mainly clear";
    if (code === 3) return "Cloudy";
    if (code >= 45 && code <= 48) return "Fog";
    if (code >= 51 && code <= 57) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 95 && code <= 99) return "Thunderstorm";
    return "Weather code " + code;
}

const WeatherScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [daily, setDaily] = useState<DailyWeather[]>([]);
    const [place, setPlace] = useState<string | null>(null); // 👈 new: human-readable place
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null); // 👈 new: debug

    const fetchWeather = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);

            // 1) Ask for location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setError("Location permission denied. Enable it in Settings.");
                setLoading(false);
                return;
            }

            // 2) Get current position
            const loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;

            console.log("[Location] latitude:", latitude, "longitude:", longitude);
            setCoords({ lat: latitude, lon: longitude });

            // 3) Reverse geocode to human-readable place
            try {
                const results = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });

                if (results && results.length > 0) {
                    const addr = results[0];
                    // addr has fields like city, region, country, etc.
                    const nice =
                        [addr.city, addr.region, addr.country].filter(Boolean).join(", ") ||
                        "Unknown location";
                    setPlace(nice);
                    console.log("[Location] reverse geocoded:", nice);
                } else {
                    setPlace("Unknown location");
                }
            } catch (geoErr) {
                console.warn("[Location] reverseGeocodeAsync error:", geoErr);
                setPlace(null);
            }

            // 4) Call Open-Meteo (no API key needed)
            const url =
                `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${latitude}` +
                `&longitude=${longitude}` +
                `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
                `&timezone=auto`;

            console.log("[Weather] Open-Meteo URL:", url);

            const res = await axios.get<OpenMeteoResponse>(url);
            const d = res.data.daily;

            if (!d || !d.time || d.time.length === 0) {
                throw new Error("No daily forecast data received.");
            }

            // 5) Map Open-Meteo daily data to our DailyWeather type
            const mapped: DailyWeather[] = d.time.map((dateStr, index) => {
                // Make a dt timestamp (seconds)
                const dtMs = new Date(dateStr + "T12:00:00").getTime();
                const dt = Math.round(dtMs / 1000);

                const max = d.temperature_2m_max[index];
                const min = d.temperature_2m_min[index];
                const popRaw = d.precipitation_probability_max?.[index] ?? 0; // 0..100
                const code = d.weathercode?.[index] ?? 0;

                const description = describeWeatherCode(code);

                const day: DailyWeather = {
                    dt,
                    temp: {
                        max,
                        min,
                    },
                    pop: popRaw / 100, // convert 0..100 → 0..1
                    weather: [
                        {
                            id: code,
                            main: description,
                            description,
                            icon: "", // no icon from Open-Meteo (DayCard will hide if empty)
                        },
                    ],
                };

                return day;
            });

            setDaily(mapped.slice(0, 7)); // only 7 days
        } catch (err: any) {
            console.error(
                "[Weather] Error:",
                err?.response?.status,
                err?.response?.data || err?.message
            );
            setError(err?.message ?? "Failed to load weather.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWeather();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Car Lexus RX450 Cover Planner</Text>
            <Text style={styles.subtitle}>Next 7 days forecast & recommendations</Text>

            {/* 👇 Show detected place + coords for debugging */}
            {place && (
                <Text style={styles.locationText}>
                    Location: {place}
                    {coords
                        ? ` (lat: ${coords.lat.toFixed(3)}, lon: ${coords.lon.toFixed(3)})`
                        : ""}
                </Text>
            )}

            {loading && !refreshing && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 10 }}>Loading forecast…</Text>
                </View>
            )}

            {error && !loading && (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && (
                <ScrollView
                    style={{ marginTop: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {daily.map((day, idx) => (
                        <DayCard key={day.dt} day={day} index={idx} />
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 64,
        paddingHorizontal: 16,
        backgroundColor: "#e5e7eb",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 14,
        color: "#4b5563",
        marginTop: 4,
    },
    locationText: {
        marginTop: 8,
        fontSize: 13,
        color: "#4b5563",
    },
    center: {
        marginTop: 32,
        alignItems: "center",
    },
    errorText: {
        color: "#b91c1c",
        textAlign: "center",
        marginHorizontal: 20,
    },
});

export default WeatherScreen;
