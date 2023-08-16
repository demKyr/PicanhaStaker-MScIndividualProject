import { Fragment } from "react";
import { useWeb3React } from "@web3-react/core";

import MainHeader from "./main-header";
import Footer from "./footer";
import LoginPage from "../../pages/login";

function Layout(props) {
  const { activate, active } = useWeb3React();
  if (active) {
    return (
      <Fragment>
        <MainHeader />
        <main>{props.children}</main>
        <Footer />
      </Fragment>
    );
  } else {
    return <LoginPage />;
  }
}

export default Layout;
