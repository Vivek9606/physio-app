import Constants from "expo-constants";

// Where the physio app web flow lives (betterhood-website-revamp → /physio-app/).
//  1. EXPO_PUBLIC_WEB_URL, if set (e.g. a staging deploy)
//  2. In development: the Astro dev server on the same machine as Metro (`npm run dev:app` in the website)
//  3. Production: betterhood.in
function resolve() {
  const env = process.env.EXPO_PUBLIC_WEB_URL;
  if (env) return env.replace(/\/?$/, "/");
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(":")[0];
    if (host) return `http://${host}:4321/physio-app/`;
  }
  return "https://betterhood.in/physio-app/";
}

export const WEB_URL = resolve();
export const WEB_ORIGIN = new URL(WEB_URL).origin;
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";

export function appUrl(invite?: string) {
  const u = new URL(WEB_URL);
  if (invite) u.searchParams.set("invite", invite);
  return u.toString();
}
