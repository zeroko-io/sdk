import { createRoot } from "react-dom/client"

function App() {
  const page = location.pathname === "/about" ? "About" : "Home"
  return <h1>{page}, from React on Zeroko</h1>
}

createRoot(document.getElementById("root")).render(<App />)
