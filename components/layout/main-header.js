import { useWeb3React } from "@web3-react/core";
import { useState, useEffect } from "react"; 

import Link from "next/link";
import Image from "next/image";
import classes from "./main-header.module.css";
import { contractAddresses } from "../../constants/contract-address";

function MainHeader() {
  const localPathname = window.location.pathname;
  const { activate, active, library: provider } = useWeb3React();
  const [isAdmin, setIsAdmin] = useState(false); 

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (provider) {
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        console.log('address',address);
        console.log(contractAddresses["treasury"]);
        setIsAdmin(contractAddresses["treasury"] === address);
      }
    };

    checkAdminStatus(); 
  }, [provider]); 


  return (
    <header className={classes.header}>
      <div className={classes.logo}>
        <Link href="/">
          <a>
            <Image
              src="/logo.png"
              alt="home"
              width="60"
              height="60"
            />
          </a>
        </Link>
      </div>

      <nav>
        <ul>
          <li
            className={
              localPathname == "/stake"
                ? classes.selectedTab
                : classes.nonSelectedTab
            }
          >
            <Link href="/stake">Stake</Link>
          </li>
          <li
            className={
              localPathname == "/unstake"
                ? classes.selectedTab
                : classes.nonSelectedTab
            }
          >
            <Link href="/unstake">Unstake</Link>
          </li>

          {isAdmin && (
            <li
              className={
                localPathname == "/admin"
                  ? classes.selectedTab
                  : classes.nonSelectedTab
              }
            >
              <Link href="/admin">Admin</Link>
            </li>
          )}

        </ul>
      </nav>
    </header>
  );
}

export default MainHeader;
