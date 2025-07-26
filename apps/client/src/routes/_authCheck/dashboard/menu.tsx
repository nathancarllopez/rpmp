import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authCheck/dashboard/menu')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authCheck/dashboard/menu"!</div>
}
