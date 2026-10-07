import { notFound } from "next/navigation";
import FrontendPage from "@/frontend/pages";
import { canonical, routePermission } from "@/frontend/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  if (!routePermission(canonical("/" + path.join("/")))) notFound();
  return <FrontendPage />;
}
