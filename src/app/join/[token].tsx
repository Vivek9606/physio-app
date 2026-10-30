import { Redirect, useLocalSearchParams } from "expo-router";

// Invite links: betterhoodphysio://join/<token> (and https://betterhood.in/join/<token> once app links
// are set up) open the app flow with the token, which the page uses to match the physio's listing.
export default function Join() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <Redirect href={{ pathname: "/", params: { invite: token } }} />;
}
