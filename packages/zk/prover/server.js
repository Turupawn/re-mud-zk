const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');
const snarkjs = require('snarkjs');

const contractAddress = "0x0B36781F9a9AC42633C35A27504b20dC0F7c0261";
const contractAddressWorld = "0x8d8b6b8414e1e3dcfd4168561b9be6bd3bf6ec4b";
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Load bomb positions
const bombPositions = JSON.parse(fs.readFileSync('bombs.json', 'utf-8'));

const app = express();
const PORT = 8080;

// Ethereum provider and contract setup
const provider = new ethers.JsonRpcProvider('http://localhost:8545'); // Adjust RPC URL as needed
const contractABI = [
    "event PlayerMoved(address player, int32 x, int32 y)",
    "function detonateBomb(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals, address playerAddress)",
];

const contractABIWorld = [
    "function app__detonateBomb(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals, address playerAddress)"
];

// Create contract instance
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
const contractWorld = new ethers.Contract(contractAddressWorld, contractABIWorld, wallet);

contract.on('PlayerMoved', async (player, x, y) => {
    console.log(`Player moved to position (${x}, ${y})`);

    // Check if the position matches any bomb position
    for (const bomb of bombPositions) {
        if (""+bomb.x === ""+x && ""+bomb.y === ""+y) {
            console.log("BOMBA")
            console.log(x)
            console.log(y)
            console.log(player)
            try {
                // Generate and verify proof
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                    {
                        bomb1_x: bombPositions[0].x,
                        bomb1_y: bombPositions[0].y,
                        bomb2_x: bombPositions[1].x,
                        bomb2_y: bombPositions[1].y,
                        bomb3_x: bombPositions[2].x,
                        bomb3_y: bombPositions[2].y,
                        player_x: x,
                        player_y: y
                    },
                    "./zk_artifacts/detonateBomb.wasm",
                    "./zk_artifacts/detonateBomb_final.zkey"
                );

                console.log(proof)
                console.log(publicSignals)
                
                //const vkey = await loadVerificationKey();
                //const res = await snarkjs.groth16.verify('./zk_artifacts/verification_key.json', publicSignals, proof);
                //console.log(res)
                

                let pA = proof.pi_a;
                pA.pop();
                let pB = proof.pi_b;
                pB.pop();
                let pC = proof.pi_c;
                pC.pop();

                if (publicSignals[1] == "1") {
                    const tx = await contractWorld.app__detonateBomb(
                        pA,
                        pB,
                        pC,
                        publicSignals,
                        player
                    );
                    console.log('Transaction:', tx);
                }
            } catch (error) {
                console.error("Error generating or verifying proof:", error);
            }
        }
    }
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, async () => {
    console.log(`Server is listening on port ${PORT}`);

    // Print the balance of the wallet
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
    }
});