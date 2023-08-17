import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { useRouter } from "next/router";

import classes from "./index.module.css";
import Button from "../../components/ui/button";

const injected = new InjectedConnector();

function LoginPage() {
  const { activate, active } = useWeb3React();
  const router = useRouter();

  async function connect() {
    try {
      await activate(injected);
      router.push({
        pathname: "/",
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      {active ? (
        <>Connected</>
      ) : (
        <div className={classes.loginDiv}>
          <Button onClick={() => connect()}>Connect</Button>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
