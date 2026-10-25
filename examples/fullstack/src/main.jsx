import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

function App() {
  const [visits, setVisits] = useState(null)
  useEffect(() => {
    fetch("/api/visits", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setVisits(d.visits))
  }, [])
  return <h1>{visits === null ? "Counting" : `Visit number ${visits}`}</h1>
}

createRoot(document.getElementById("root")).render(<App />)
