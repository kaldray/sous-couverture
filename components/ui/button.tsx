import { PropsWithChildren } from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { ThemedText } from "../themed-text";

interface ButtonProps extends PropsWithChildren, TouchableOpacityProps {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
}

export function Button({
  children,
  lightColor,
  darkColor,
  type,
  ...props
}: ButtonProps) {
  return (
    <>
      <TouchableOpacity {...props}>
        <ThemedText type={type} lightColor={lightColor} darkColor={darkColor}>
          {children}
        </ThemedText>
      </TouchableOpacity>
    </>
  );
}
