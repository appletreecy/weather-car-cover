// src/components/DayCard.tsx
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { DailyWeather, adviceLabel, adviceColor, getCarCoverAdvice } from "@utils/weather";

type Props = {
    day: DailyWeather;
    index: number; // 0 = today, 1 = tomorrow, ...
};

const DayCard: React.FC<Props> = ({ day, index }) => {
    const advice = getCarCoverAdvice(day);
    const label = adviceLabel(advice);
    const badgeColor = adviceColor(advice);

    const date = new Date(day.dt * 1000);
    const dayName = index === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" });

    const iconCode = day.weather?.[0]?.icon;
    const iconUrl = iconCode
        ? `https://openweathermap.org/img/wn/${iconCode}@2x.png`
        : undefined;

    const description = day.weather?.[0]?.description ?? "";

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Text style={styles.dateText}>
                        {date.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </Text>
                    <Text style={styles.desc}>{description}</Text>
                </View>

                {iconUrl && (
                    <Image
                        source={{ uri: iconUrl }}
                        style={styles.icon}
                        resizeMode="contain"
                    />
                )}
            </View>

            <View style={styles.footerRow}>
                <Text style={styles.tempText}>
                    {Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°
                </Text>
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{label}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    dayName: {
        fontSize: 16,
        fontWeight: "600",
    },
    dateText: {
        fontSize: 14,
        color: "#4b5563",
    },
    desc: {
        marginTop: 4,
        fontSize: 14,
        color: "#6b7280",
        textTransform: "capitalize",
    },
    icon: {
        width: 60,
        height: 60,
    },
    footerRow: {
        flexDirection: "row",
        marginTop: 8,
        alignItems: "center",
        justifyContent: "space-between",
    },
    tempText: {
        fontSize: 16,
        fontWeight: "500",
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
});

export default DayCard;
