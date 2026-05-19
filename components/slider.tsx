import { StyleSheet, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { usePreGameSettingsStore } from "@/domain/game/store";

export function NumerPlayerSlider() {
  const playerCount = usePreGameSettingsStore((state) => state.maxPlayers);
  const undercoverCount = usePreGameSettingsStore(
    (state) => state.numUndercover,
  );
  const setPlayerCount = usePreGameSettingsStore(
    (state) => state.actions.setPlayer,
  );

  return (
    <>
      <Text style={styles.h1}>Joueurs : {playerCount}</Text>
      <Text style={styles.h2}>Dont Intrus : {undercoverCount}</Text>
      <Slider
        style={{ width: 200, height: 40 }}
        minimumValue={3}
        maximumValue={20}
        step={1}
        onValueChange={(value) => setPlayerCount(value)}
        minimumTrackTintColor="#DBD7D2"
        maximumTrackTintColor="#000000"
      />
    </>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 20,
  },
  h2: {
    fontSize: 18,
  },
});
