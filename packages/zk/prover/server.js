const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');
const snarkjs = require('snarkjs');

const contractAddress = "0x8d8b6b8414e1e3dcfd4168561b9be6bd3bf6ec4b";
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Load bomb positions
const bombPositions = JSON.parse(fs.readFileSync('bombs.json', 'utf-8'));

const app = express();
const PORT = 8080;

// Ethereum provider and contract setup
const provider = new ethers.JsonRpcProvider('http://localhost:8545'); // Adjust RPC URL as needed
const contractABI = [
    "event PlayerMoved(address indexed player, uint256 x, uint256 y)",
    "function detonateBomb(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals, address playerAddress) public",
    "event Store_SetRecord(address indexed tableId, bytes32[] keyTuple, bytes staticData, bytes encodedLengths, bytes dynamicData)"
];

// Create contract instance
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Create a wallet instance
const wallet = new ethers.Wallet(privateKey, provider);
const contractWithSigner = contract.connect(wallet);

// Load verification key
const loadVerificationKey = async () => {
    const response = await fetch('src/zk_artifacts/verification_key.json');
    return await response.json();
};

// Listen for PlayerMoved events
contract.on('Store_SetRecord', async (tableId, keyTuple, staticData, encodedLengths, dynamicData) => {
    console.log("Test")
});

contract.on('PlayerMoved', async (player, x, y) => {
    console.log(`Player moved to position (${x}, ${y})`);

    // Check if the position matches any bomb position
    for (const bomb of bombPositions) {
        if (bomb.x === x.toNumber() && bomb.y === y.toNumber()) {
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
                        player_x: x.toNumber(),
                        player_y: y.toNumber()
                    },
                    "src/zk_artifacts/detonateBomb.wasm",
                    "src/zk_artifacts/detonateBomb_final.zkey"
                );

                const vkey = await loadVerificationKey();
                const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);

                if (res) {
                    console.log("Proof is valid");
                } else {
                    console.log("Proof is invalid");
                }

                let pA = proof.pi_a;
                pA.pop();
                let pB = proof.pi_b;
                pB.pop();
                let pC = proof.pi_c;
                pC.pop();

                if (publicSignals[1] == "1") {
                    const tx = await contractWithSigner.detonateBomb(
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

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
