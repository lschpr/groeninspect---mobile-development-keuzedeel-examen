import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Children, Fragment, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, CONTENT_MAX_WIDTH, hairline, radius, type } from '../theme';

// Pakt het type van de `name`-prop van de icoon-bibliotheek. Zo geeft
// TypeScript een fout als je een icoonnaam typt die niet bestaat.
export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

// Trillen alleen bij betekenisvolle momenten: opslaan gelukt of een fout.
export function tik(soort: 'succes' | 'fout') {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    soort === 'succes' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  );
}

// Kritisch gedempte veer: snel, zonder doorschieten.
export const veer = { damping: 26, stiffness: 300, mass: 1 };

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

// Navigatiebalk met gecentreerde titel en een actie links/rechts.
export function NavBar({ title, left, right }: { title?: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.navBar}>
      <View style={styles.navSide}>{left}</View>
      <Text style={styles.navTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.navSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Terug">
      {({ pressed }) => (
        <>
          <Icon name="chevron-left" size={30} color={pressed ? colors.secondary : colors.primary} />
          <Text style={[styles.backText, pressed && { color: colors.secondary }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function TextButton({
  title,
  onPress,
  bold,
  color = colors.primary,
}: {
  title: string;
  onPress: () => void;
  bold?: boolean;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button">
      {({ pressed }) => (
        <Text style={[type.body, { color, fontWeight: bold ? '600' : '400', opacity: pressed ? 0.45 : 1 }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const inactief = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactief}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactief }}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }, inactief && { opacity: 0.5 }, style]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

// Gegroepeerde lijst (zoals Instellingen op iOS): kop, witte groep, voettekst.
export function Section({
  header,
  footer,
  footerKleur,
  children,
  inset = true,
}: {
  header?: string;
  footer?: ReactNode;
  footerKleur?: string;
  children: ReactNode;
  inset?: boolean;
}) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {header && <Text style={styles.sectionHeader}>{header.toUpperCase()}</Text>}
      <View style={styles.group}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={[styles.separator, inset && { marginLeft: 16 }]} />}
            {child}
          </Fragment>
        ))}
      </View>
      {footer && <Text style={[styles.sectionFooter, footerKleur && { color: footerKleur }]}>{footer}</Text>}
    </View>
  );
}

type RowProps = {
  title: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  accessory?: 'chevron' | 'check' | 'none';
  multiline?: boolean;
  // Actie-rij: titel en icoon in accentkleur (bijv. "Foto maken").
  titleColor?: string;
};

// `inhoud` is een functie die de rij tekent, met of zonder "ingedrukt"-kleur.
// Zonder onPress tekenen we alleen de rij; met onPress zetten we hem in een
// Pressable, die ons vertelt of de vinger er nu op staat (pressed).
export function Row({ title, value, icon, onPress, accessory = 'none', multiline, titleColor }: RowProps) {
  const inhoud = (pressed: boolean) => (
    <View style={[styles.row, pressed && { backgroundColor: colors.fill }]}>
      {icon && <Icon name={icon} size={22} color={titleColor ?? colors.secondary} />}
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: titleColor ?? colors.text }]}>{title}</Text>
        {value !== undefined && multiline && <Text style={styles.rowValueOnder}>{value}</Text>}
      </View>
      {value !== undefined && !multiline && (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      )}
      {accessory === 'chevron' && <Icon name="chevron-right" size={22} color={colors.tertiary} />}
      {accessory === 'check' && <Icon name="check" size={22} color={colors.primary} />}
    </View>
  );
  if (!onPress) return inhoud(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => inhoud(pressed)}
    </Pressable>
  );
}

// Status als stip + tekst: rustig, maar direct zichtbaar.
export function Status({ verstuurd }: { verstuurd: boolean }) {
  const kleur = verstuurd ? colors.primary : colors.warning;
  return (
    <View style={styles.status}>
      <View style={[styles.statusDot, { backgroundColor: kleur }]} />
      <Text style={[type.footnote, { color: kleur, fontWeight: '600' }]}>
        {verstuurd ? 'Verstuurd' : 'Niet verstuurd'}
      </Text>
    </View>
  );
}

// Segmented control met een meeschuivende selectie (veeranimatie).
// <T extends string> betekent: dit werkt met elk soort tekst-keuzes, bijv.
// 'alle' | 'open' | 'verstuurd' of 'medewerker' | 'admin'.
// Hoe het werkt: onLayout meet hoe breed de balk is. Die breedte delen we door
// het aantal opties = breedte per knop. Het witte blokje schuift dan naar
// (gekozen index × breedte per knop), met een vering-animatie (withSpring).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const [breedte, setBreedte] = useState(0);
  const index = options.findIndex((o) => o.key === value);
  const segment = breedte > 0 ? (breedte - 4) / options.length : 0;

  const thumbStyle = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: withSpring(index * segment, veer) }],
  }));

  return (
    <View
      style={styles.segTrack}
      onLayout={(e: LayoutChangeEvent) => setBreedte(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {breedte > 0 && <Animated.View style={[styles.segThumb, thumbStyle]} />}
      {options.map((o) => {
        const actief = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={styles.segItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: actief }}
          >
            <Text style={[styles.segText, actief && { fontWeight: '600', color: colors.text }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },

  navBar: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 8 },
  navSide: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 8 },
  navTitle: { ...type.headline, color: colors.text, textAlign: 'center', flexShrink: 1 },
  back: { flexDirection: 'row', alignItems: 'center', marginLeft: -12 },
  backText: { ...type.body, color: colors.primary, marginLeft: -4 },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: { ...type.headline, color: colors.white },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderTopWidth: hairline,
    borderTopColor: colors.separator,
  },

  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { ...type.sectionHeader, color: colors.secondary, marginLeft: 16, marginBottom: 7 },
  group: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  separator: { height: hairline, backgroundColor: colors.separator },
  sectionFooter: { ...type.footnote, color: colors.secondary, marginHorizontal: 16, marginTop: 7 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16, paddingVertical: 11 },
  rowValue: { ...type.body, color: colors.secondary, maxWidth: '60%' },
  rowValueOnder: { ...type.callout, color: colors.secondary, marginTop: 2 },

  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  segTrack: {
    flexDirection: 'row',
    backgroundColor: colors.fill,
    borderRadius: 9,
    padding: 2,
    height: 36,
  },
  segThumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: 7,
    backgroundColor: colors.card,
    borderWidth: hairline,
    borderColor: colors.separator,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segText: { ...type.footnote, fontSize: 14, color: colors.secondary },
});
