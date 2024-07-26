import { Has, defineEnterSystem, defineSystem, defineExitSystem, getComponentValueStrict } from "@latticexyz/recs";
import { PhaserLayer } from "../createPhaserLayer";
import { 
  pixelCoordToTileCoord,
  tileCoordToPixelCoord
} from "@latticexyz/phaserx";
import { TILE_WIDTH, TILE_HEIGHT, Animations, Directions } from "../constants";

function to20ByteAddress(fullAddress: string): string {
    const shortAddress = '0x' + fullAddress.slice(26);
    return shortAddress;
}

export const createMyGameSystem = (layer: PhaserLayer) => {
  const {
    world,
    networkLayer: {
      components: {
        Player
      },
      systemCalls: {
        spawn,
        move,
        detonateBomb
      }
    },
    scenes: {
        Main: {
            objectPool,
            input
        }
    }
  } = layer;

  // This should be on the server instead
  let toggle = false;

  input.pointerdown$.subscribe((event) => {
    const x = event.pointer.worldX;
    const y = event.pointer.worldY;
    const player = pixelCoordToTileCoord({ x, y }, TILE_WIDTH, TILE_HEIGHT);
    if(player.x == 0 && player.y == 0)
        return;
    spawn(player.x, player.y) 
  });

  input.onKeyPress((keys) => keys.has("W"), () => {
    move(Directions.UP);
  });

  input.onKeyPress((keys) => keys.has("S"), () => {
    move(Directions.DOWN);
  });

  input.onKeyPress((keys) => keys.has("A"), () => {
    move(Directions.LEFT);
  });

  input.onKeyPress((keys) => keys.has("D"), () => {
    move(Directions.RIGHT);
  });

  input.onKeyPress((keys) => keys.has("I"), () => {
    // This should be on the server instead
    let bombSprite1 = objectPool.get("Bomb1", "Sprite");
    let bombSprite2 = objectPool.get("Bomb2", "Sprite");
    let bombSprite3 = objectPool.get("Bomb3", "Sprite");
    if (toggle == true) {
      bombSprite1.setComponent({
        id: "position",
        once: (sprite1) => {
          sprite1.setVisible(false);
        }
      })
      bombSprite2.setComponent({
        id: "position",
        once: (sprite2) => {
          sprite2.setVisible(false);
        }
      })
      bombSprite3.setComponent({
        id: "position",
        once: (sprite3) => {
          sprite3.setVisible(false);
        }
      })
    } else {
      bombSprite1.setComponent({
        id: 'animation',
        once: (sprite1) => {
          sprite1.setVisible(true);
          sprite1.play(Animations.Bomb);
          sprite1.setPosition(1*32, 1*32);
        }
      })
      bombSprite2.setComponent({
        id: 'animation',
        once: (sprite2) => {
          sprite2.setVisible(true);
          sprite2.play(Animations.Bomb);
          sprite2.setPosition(2*32, 2*32);
        }
      })
      bombSprite3.setComponent({
        id: 'animation',
        once: (sprite3) => {
          sprite3.setVisible(true);
          sprite3.play(Animations.Bomb);
          sprite3.setPosition(2*32, 3*32);
        }
      })
    }
    toggle = !toggle;
  });

  defineEnterSystem(world, [Has(Player)], ({entity}) => {
    const playerObj = objectPool.get(entity, "Sprite");
    playerObj.setComponent({
        id: 'animation',
        once: (sprite) => {
            sprite.play(Animations.Player);
        }
    })
  });

  defineSystem(world, [Has(Player)], ({ entity }) => {
    const player = getComponentValueStrict(Player, entity);
    const pixelPosition = tileCoordToPixelCoord(player, TILE_WIDTH, TILE_HEIGHT);

    const playerObj = objectPool.get(entity, "Sprite");


    if(!player.isDead)
    {
        detonateBomb(pixelPosition.x/32, pixelPosition.y/32, to20ByteAddress(entity));
    }else
    {
        playerObj.setComponent({
            id: 'animation',
            once: (sprite) => {
              sprite.play(Animations.Dead);
            }
        })
    }

    playerObj.setComponent({
      id: "position",
      once: (sprite) => {
        sprite.setPosition(pixelPosition.x, pixelPosition.y);
      }
    })
  })
};
