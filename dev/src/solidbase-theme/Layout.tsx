import type { RouteSectionProps } from "@solidjs/router";
import { Title } from "@solidjs/meta";

import Layout from "../../../src/default-theme/Layout";

export default function (props: RouteSectionProps) {
  return (
    <>
      <Title>I am the captain now</Title>
      <Layout {...props} />
    </>
  );
}
