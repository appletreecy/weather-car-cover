// src/utils/weather.ts

export type DailyWeather = {
    dt: number; // unix timestamp
    temp: {
        min: number;
        max: number;
    };
    pop: number; // probability of precipitation (0..1)
    weather: { id: number; main: string; description: string; icon: string }[];
};

export type CarCoverAdvice = "cover" | "optional" | "no";

export function getCarCoverAdvice(d: DailyWeather): CarCoverAdvice {
    const pop = d.pop ?? 0; // 0..1
    const code = d.weather?.[0]?.id ?? 800;

    // Basic conditions:
    const willRainLikely = pop >= 0.4;       // >= 40% chance of rain
    const isStormy = code >= 200 && code < 600; // thunderstorms / heavy rain

    if (willRainLikely || isStormy) return "no";
    if (pop >= 0.2) return "optional";
    return "cover";
}

export function adviceLabel(advice: CarCoverAdvice): string {
    switch (advice) {
        case "cover":
            return "Cover your car";
        case "optional":
            return "Cover optional";
        case "no":
        default:
            return "No cover needed";
    }
}

export function adviceColor(advice: CarCoverAdvice): string {
    switch (advice) {
        case "no":
            return "#dc2626"; // red
        case "optional":
            return "#f97316"; // orange
        case "cover":
        default:
            return "#16a34a"; // green
    }
}
