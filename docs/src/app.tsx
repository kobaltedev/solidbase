import { FileRoutes } from "@solidjs/start/router";
import { Router } from "@solidjs/router";
import { SolidBaseRoot } from "@kobalte/solidbase/client";

import "./app.css";

export default function App() {
  return (
    <Router root={SolidBaseRoot}>
      <FileRoutes />
    </Router>
  );
}
