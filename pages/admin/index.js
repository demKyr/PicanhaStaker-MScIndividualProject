import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

import AdminModel from "../../components/admin-components/admin-model";
import AdminInfoModel from "../../components/admin-components/admin-info-model";
import { contractAddresses } from "../../constants/contract-address";

function AdminPage() {
  const { activate, active, library: provider } = useWeb3React();
  const signer = provider.getSigner();
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    if (active && signer) {
      const getAddress = async () => {
        const address = await signer.getAddress();
        setUserAddress(address);
      };
      getAddress();
    }
  }, [active, signer]);

  if (userAddress === contractAddresses["treasury"]) {
    return (
      <div>
        <AdminInfoModel />
        <p className="note">Reminder: Total Shares * Share Price + Total Preshares = Total Staked + Unclaimed Rewards + Vault Balance - wQueueBalance</p>
        <AdminModel />
      </div>
    );
  } else {
    return <div>You do not have access to this page.</div>;
  }
}

export default AdminPage;
