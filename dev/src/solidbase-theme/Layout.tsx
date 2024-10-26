import { RouteSectionProps } from "@solidjs/router";

import Layout from "../../../src/default-theme/Layout";
import { DefaultThemeComponentsProvider } from "../../../src/default-theme/context";
import Link from "../../../src/default-theme/components/Link";

export default (props: RouteSectionProps) => {
  return (
    <DefaultThemeComponentsProvider
      components={{
        Link: (props) => <Link {...props}>(Overridden) {props.children}</Link>,
      }}
    >
      <Layout {...props} />
    </DefaultThemeComponentsProvider>
  );
};
