import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NumerPlayerSlider } from "@/components/slider";
import { Button } from "@/components/ui/button";

export default function PreGameScreen() {
  return (
    <>
      <Link href="/" asChild style={styles.link}>
        <Pressable>
          <IconSymbol name="chevron.left" color="#000" />
        </Pressable>
      </Link>
      <View style={styles.container}>
        <NumerPlayerSlider />
        <Link href="/game" asChild style={styles.link}>
          <Pressable>
            <Text>Commencez la partie !</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    marginLeft: 1,
  },
  container: {
    display: "flex",
    marginTop: 50,
    justifyContent: "flex-start",
    alignItems: "center",
    height: "100%",
  },
});
