import { Link } from "expo-router";
import { View, StyleSheet, Text, Pressable } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Link href="/pregame" asChild>
        <Pressable>
          <Text>Commencer une partie</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});
