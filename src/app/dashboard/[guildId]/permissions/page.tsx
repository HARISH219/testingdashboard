import { redirect } from "next/navigation";

/**
 * The Permissions module was upgraded into the premium "Permits" experience at
 * /permits. This route is kept only to redirect any existing links/bookmarks.
 */
export default function PermissionsRedirect({ params }: { params: { guildId: string } }) {
  redirect(`/dashboard/${params.guildId}/permits`);
}
