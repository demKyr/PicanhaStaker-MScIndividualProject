import classes from "./footer.module.css";

function Footer() {
  return (
    <footer className={classes.footer}>

      <div className={classes.footerContent}>
          <a href="https://goerli.etherscan.io/address/0x9437eff6e8713cf1619d9507695489a6639b758d#code" target="_blank" rel="noopener noreferrer" className={classes.link}>View smart contract here</a>
        <p className={classes.footerNote}>
          TruStake Picanha vault is designed and developed by Demetris Kyriacou as part of an MSc Individual Project for Imperial College London.
          It constitutes an extended version of <span><a href="https://app.trufin.io/vaults/trustake" target="_blank" rel="noopener noreferrer">TruStake vault</a></span> by <span><a href="https://www.trufin.io/" target="_blank" rel="noopener noreferrer">trufin.io&trade;</a></span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
