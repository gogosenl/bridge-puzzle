import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

export function PressableScale({ children, style, ...props }: PropsWithChildren<Props>) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 }]}>
      {children}
    </Pressable>
  );
}

