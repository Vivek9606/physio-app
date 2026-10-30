// Native side of the WebView bridge. The page (src/components/physio-app/bridge.ts in the website)
// posts JSON messages { type, ...payload }; anything unknown is ignored.
import { Linking, Platform, Share } from "react-native";
import * as Haptics from "expo-haptics";
import { APP_VERSION } from "./config";

export type Message =
  | { type: "ready" }
  | { type: "haptic"; style?: "light" | "success" | "warning" }
  | { type: "share"; url: string; text?: string }
  | { type: "open"; url: string }
  | { type: "notify"; title: string; body: string; to?: string };

// Runs before the page's own scripts, so the page knows it's inside the shell from the first render.
export const injectedBeforeLoad = `window.BH_NATIVE = ${JSON.stringify({ platform: Platform.OS, version: APP_VERSION })}; true;`;

export function parse(data: string): Message | null {
  try {
    const m = JSON.parse(data);
    return m && typeof m.type === "string" ? m : null;
  } catch {
    return null;
  }
}

export async function handle(m: Message) {
  switch (m.type) {
    case "haptic":
      if (m.style === "success") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (m.style === "warning") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case "share":
      return Share.share(Platform.OS === "ios" ? { url: m.url, message: m.text } : { message: m.text ? `${m.text}\n${m.url}` : m.url });
    case "open":
      if (/^https?:\/\//.test(m.url)) return Linking.openURL(m.url);
      return;
    case "notify":
      // The page already shows an in-app banner. System notifications come from push once the backend
      // sends them (expo-notifications), so a buzz is enough here.
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}
