import { createSignal } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "./app.css";

export default function App() {
  return (
    <Router>
      <FileRoutes />
    </Router>
  );
}
