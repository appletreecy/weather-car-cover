// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import WeatherScreen from "./src/screens/WeatherScreen";

export default function App() {
    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar style="auto" />
            <WeatherScreen />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
});
