import { getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { singletonEntity } from "@latticexyz/store-sync/recs";

import * as snarkjs from 'snarkjs';

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { worldContract, waitForTransaction }: SetupNetworkResult,
  { Player }: ClientComponents,
) {
  const spawn = async (x: number, y: number) => {
    const tx = await worldContract.write.app__spawn([x, y]);
    await waitForTransaction(tx);
    return getComponentValue(Player, singletonEntity);
  };

  const move = async (direction: number) => {
    const tx = await worldContract.write.app__move([direction]);
    await waitForTransaction(tx);
    return getComponentValue(Player,  singletonEntity);
  }

  const detonateBomb = async (x: number, y: number, playerAddress: any) => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
        bomb1_x: 1,
        bomb1_y: 1,
        bomb2_x: 2,
        bomb2_y: 2,
        bomb3_x: 2,
        bomb3_y: 3,
        player_x: x,
        player_y: y
    }, "src/zk_artifacts/detonateBomb.wasm", "src/zk_artifacts/detonateBomb_final.zkey");

    const vkey = await fetch("src/zk_artifacts/verification_key.json").then( function(res) {
        return res.json();
    });

    const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);

    let pA = proof.pi_a
    pA.pop()
    let pB = proof.pi_b
    pB.pop()
    let pC = proof.pi_c
    pC.pop()

    if(publicSignals[1] == "1")
    {
      console.log("BOMBA!!");
      //const tx = await worldContract.write.app__detonateBomb([pA, pB, pC, publicSignals, playerAddress]);
      //await waitForTransaction(tx);
      //return getComponentValue(Player,  singletonEntity);
    }
  }
  return {
    spawn, move, detonateBomb
  };
}