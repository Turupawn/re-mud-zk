import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "app",
  enums: {
    Direction: [
      "Up",
      "Down",
      "Left",
      "Right"
    ]
  },
  tables: {
    Player: {
      schema: {
        player: "address",
        x: "int32",
        y: "int32",
        isDead: "bool",
      },
      key: ["player"]
    },
    ZKState: {
      schema: {
        bombsCommitment: "uint32",
        circomVerifier: "address"
      },
      key: [],
    },
  }
});
