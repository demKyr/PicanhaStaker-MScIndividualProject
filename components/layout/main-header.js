import Link from "next/link";
import Image from "next/image";

import classes from "./main-header.module.css";

function MainHeader() {
  const localPathname = window.location.pathname;
  return (
    <header className={classes.header}>
      <div className={classes.logo}>
        <Link href="/">
          <a>
            <Image
              src="/logo.png"
              alt="home"
              width="100"
              height="100"
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
        </ul>
      </nav>
    </header>
  );
}

export default MainHeader;
