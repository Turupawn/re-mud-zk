import { getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { singletonEntity } from "@latticexyz/store-sync/recs";

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

  return {
    spawn, move
  };
}