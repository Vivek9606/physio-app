import { useCallback, useEffect, useRef, useState, type ComponentType, type Ref } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { WebView, type WebViewMessageEvent, type WebViewNavigation, type WebViewProps } from "react-native-webview";
import type { ShouldStartLoadRequest, WebViewErrorEvent, WebViewHttpErrorEvent } from "react-native-webview/lib/WebViewTypes";
import { WEB_URL, appUrl } from "@/lib/config";
import { handle, injectedBeforeLoad, parse } from "@/lib/bridge";

const CREAM = "#fbf7f1";
const PLUM = "#5e1951";

// WebView's class typings resolve to never-props under strict TS, so type the element explicitly.
type Handle = WebView<{}>;
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<Handle> }>;

// The whole app is the website's /physio-app/ flow; this screen hosts it and wires up native bits:
// Android back → WebView history, links outside the flow → system browser, and the message bridge.
export default function AppScreen() {
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const web = useRef<Handle>(null);
  const [uri, setUri] = useState(() => appUrl(invite));
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  // A new invite link while the app is open restarts the flow with that token.
  useEffect(() => { if (invite) setUri(appUrl(invite)); }, [invite]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      web.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const onNav = (n: WebViewNavigation) => setCanGoBack(n.canGoBack);

  // Stay inside /physio-app/; everything else (articles, WhatsApp, other sites) opens outside the app.
  const onShouldStart = useCallback((r: ShouldStartLoadRequest) => {
    if (r.isTopFrame === false || r.url.startsWith(WEB_URL) || r.url === "about:blank") return true;
    if (/^(https?|mailto|tel|whatsapp):/.test(r.url)) Linking.openURL(r.url).catch(() => {});
    return false;
  }, []);

  const retry = () => { setFailed(null); setLoading(true); web.current?.reload(); };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <Web
        ref={web}
        source={{ uri }}
        style={styles.web}
        originWhitelist={["*"]}
        injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
        onMessage={(e: WebViewMessageEvent) => { const m = parse(e.nativeEvent.data); if (m) handle(m).catch(() => {}); }}
        onNavigationStateChange={onNav}
        onShouldStartLoadWithRequest={onShouldStart}
        onLoadEnd={() => setLoading(false)}
        onError={(e: WebViewErrorEvent) => setFailed(e.nativeEvent.description || "Couldn't load the app.")}
        onHttpError={(e: WebViewHttpErrorEvent) => e.nativeEvent.statusCode >= 500 && setFailed(`Server error ${e.nativeEvent.statusCode}`)}
        domStorageEnabled
        javaScriptEnabled
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        textZoom={100}
        applicationNameForUserAgent="BetterhoodPhysio"
      />
      {loading && !failed && (
        <View style={styles.cover} pointerEvents="none">
          <ActivityIndicator color={PLUM} size="large" />
        </View>
      )}
      {failed && (
        <View style={styles.cover}>
          <Text style={styles.h}>You're offline, or the app couldn't load</Text>
          <Text style={styles.p}>{failed}</Text>
          {__DEV__ && <Text style={styles.small}>{WEB_URL}{"\n"}Is the website running with `npm run dev:app`?</Text>}
          <Pressable style={styles.btn} onPress={retry}><Text style={styles.btnText}>Try again</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  web: { flex: 1, backgroundColor: CREAM },
  cover: { ...StyleSheet.absoluteFill, backgroundColor: CREAM, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  h: { fontSize: 18, fontWeight: "700", color: "#240c2c", textAlign: "center" },
  p: { fontSize: 14, color: "#5b4a5e", textAlign: "center" },
  small: { fontSize: 12, color: "#85758a", textAlign: "center" },
  btn: { marginTop: 8, backgroundColor: PLUM, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
