import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authCheck/dashboard/_templates/cook-sheet',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authCheck/dashboard/_templates/cook-sheet"!</div>
}
