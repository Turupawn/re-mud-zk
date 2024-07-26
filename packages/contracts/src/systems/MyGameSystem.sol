// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Player, PlayerData, ZKState } from "../codegen/index.sol";
import { Direction } from "../codegen/common.sol";
import { getKeysWithValue } from "@latticexyz/world-modules/src/modules/keyswithvalue/getKeysWithValue.sol";

import { EncodedLengths, EncodedLengthsLib } from "@latticexyz/store/src/EncodedLengths.sol";

interface ICircomVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals) external view returns (bool);
}

contract MyGameSystem is System {
  event PlayerMoved(address indexed player, int32 x, int32 y);

  function spawn(int32 x, int32 y) public {
    address playerAddress = _msgSender();
    Player.set(playerAddress, x, y, false);
  }

  function move(Direction direction) public {
    address playerAddress = _msgSender();
    PlayerData memory player = Player.get(playerAddress);

    require(!player.isDead, "Player is dead");

    int32 x = player.x;
    int32 y = player.y;

    if(direction == Direction.Up)
      y-=1;
    if(direction == Direction.Down)
      y+=1;
    if(direction == Direction.Left)
      x-=1;
    if(direction == Direction.Right)
      x+=1;

    Player.setX(playerAddress, x);
    Player.setY(playerAddress, y);

    emit PlayerMoved(msg.sender, x, y);
  }

  function detonateBomb(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals, address playerAddress) public {
    ICircomVerifier(ZKState.getCircomVerifier()).verifyProof(_pA, _pB, _pC, _pubSignals);
    uint32 commitment = uint32(_pubSignals[0]);
    uint32 result = uint32(_pubSignals[1]);
    int32 guessX = int32(uint32(uint(_pubSignals[2])));
    int32 guessY = int32(uint32(uint(_pubSignals[3])));

    PlayerData memory player = Player.get(playerAddress);

    require(!player.isDead, "Player already dead");
    require(result == 1, "No bomb in this position");
    require(player.x == guessX && player.y == guessY, "Invalid position ");

    uint32 bombsCommitment = ZKState.getBombsCommitment();
    require(uint32(uint(commitment)) == bombsCommitment, "Invalid commitment");

    Player.setIsDead(playerAddress, true);
  }
}
