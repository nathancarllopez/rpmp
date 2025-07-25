import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <button onClick={checkHealth}>Backend?</button>
}

async function checkHealth() {
  const url = import.meta.env.VITE_BACKEND_URL + "/server/health";

  console.log('fetching from:', url);

  const response = await fetch(url, {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error("failed")
  }

  console.log(response);
}