import { FileRoutes } from "@solidjs/start/router";
import { Router } from "@solidjs/router";

import "./app.css";
import { SolidBaseRoot } from "../../src/client/context";

export default function App() {
  return (
    <Router root={SolidBaseRoot}>
      <FileRoutes />
    </Router>
  );
}
