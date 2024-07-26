// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { ZKState } from "../src/codegen/index.sol";
import { Groth16Verifier } from "../src/CircomVerifier.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    StoreSwitch.setStoreAddress(worldAddress);
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    uint32 bombsCommitment = uint32(uint(8613278371666841974523698252941148485158405612101680617360618409530277878563));
    address circomVerifier = address(new Groth16Verifier());
    ZKState.set(bombsCommitment, circomVerifier);

    vm.stopBroadcast();
  }
}
