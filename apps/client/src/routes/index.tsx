import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <button onClick={checkHealth}>Backend?</button>
}

async function checkHealth() {
  const url = "http://localhost:3001/server/health";
  const response = await fetch(url, {
    method: "GET"
  });

  console.log(response);

  if (!response.ok) {
    throw new Error("failed")
  }

  console.log(response.body);
}