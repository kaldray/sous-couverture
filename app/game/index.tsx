// app/game/index.tsx
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { useGameStore, usePreGameSettingsStore } from "@/domain/game/store";
import { router } from "expo-router";
import { Alert, Text, View, StyleSheet, Pressable } from "react-native";

export default function Game() {
  const undercover = usePreGameSettingsStore((state) => state.numUndercover);
  const maxPlayers = usePreGameSettingsStore((state) => state.maxPlayers);
  const resetPreGameSetting = usePreGameSettingsStore(
    (state) => state.actions.reset,
  );
  const resetGame = useGameStore((state) => state.actions.reset);
  const citizens = maxPlayers - undercover;

  const handleQuit = () => {
    Alert.alert("Quitter la partie ?", "La partie en cours sera perdue.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: () => {
          router.dismissTo("/");
          resetGame();
          resetPreGameSetting();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handleQuit} style={styles.link}>
        <IconSymbol name="x.circle" color="#000" />
      </Pressable>
      <View style={styles.topHeader}>
        <Text>Intrus : {undercover}</Text>
        <Text>Civils : {citizens}</Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  link: {
    marginLeft: 1,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
});
