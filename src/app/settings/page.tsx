

import { auth } from "@clerk/nextjs/server";
import SettingsClient from "@/app/settings/settingsClient";

export default async function SettingsPage() {
  const { userId } = await auth();
  // Values will be fetched inside client via Clerk for avatar; DB values are fetched via server actions through the form submission cycle
  return (
    <SettingsClient userId={userId || ""} />
  );
}