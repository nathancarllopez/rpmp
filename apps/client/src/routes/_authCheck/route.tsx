import { notifications } from "@mantine/notifications";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSupaSession } from "../../supabase/getSupaSession";
import SkeletonDashboard from "../../components/misc/SkeletonDashboard";

export const Route = createFileRoute("/_authCheck")({
  beforeLoad: async ({ context, location }) => {
    const { userId } = context;

    if (userId !== null) {
      return { userId }
    }

    const session = await getSupaSession();

    if (!session) {
      notifications.show({
        withCloseButton: true,
        color: "red",
        title: "Authentication Required",
        message: "You must be logged in to access this page.",
      });

      throw redirect({
        to: "/dashboard/home",
        search: {
          redirect: location.href,
        },
      });
    }

    return { userId: session.user.id };
  },
  pendingComponent: SkeletonDashboard,
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
