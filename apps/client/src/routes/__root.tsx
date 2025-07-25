import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  userId: string | null;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet/>
      <ReactQueryDevtools />
      <TanStackRouterDevtools/>
    </>
  )
}
