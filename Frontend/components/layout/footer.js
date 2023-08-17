import classes from "./footer.module.css";

function Footer() {
  return (
    <footer className={classes.footer}>

      <div className={classes.footerContent}>
        <p className={classes.footerNote}>
          <a href="https://goerli.etherscan.io/address/0x9437eff6e8713cf1619d9507695489a6639b758d#code">View smart contract here</a>
          <br />TruStake Picanha vault is designed and developed by Demetris Kyriacou as part of an MSc Individual Project for Imperial College London.
          <br />It constitutes an extended version of <a href="https://app.trufin.io/vaults/trustake">TruStake vault</a> by <a href="https://www.trufin.io/">trufin.io&trade;</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
