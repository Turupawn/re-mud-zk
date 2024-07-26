pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template commitmentHasher() {
    signal input bomb1_x;
    signal input bomb1_y;
    signal input bomb2_x;
    signal input bomb2_y;
    signal input bomb3_x;
    signal input bomb3_y;
    signal output commitment;
    component poseidonComponent;
    poseidonComponent = Poseidon(6);
    poseidonComponent.inputs[0] <== bomb1_x;
    poseidonComponent.inputs[1] <== bomb1_y;
    poseidonComponent.inputs[2] <== bomb2_x;
    poseidonComponent.inputs[3] <== bomb2_y;
    poseidonComponent.inputs[4] <== bomb3_x;
    poseidonComponent.inputs[5] <== bomb3_y;
    commitment <== poseidonComponent.out;
}

template detonateBomb() {
    signal input bomb1_x;
    signal input bomb1_y;
    signal input bomb2_x;
    signal input bomb2_y;
    signal input bomb3_x;
    signal input bomb3_y;
    signal input player_x;
    signal input player_y;
    signal output commitment;
    signal output result;

    component commitmentHasherComponent;
    commitmentHasherComponent = commitmentHasher();
    commitmentHasherComponent.bomb1_x <== bomb1_x;
    commitmentHasherComponent.bomb1_y <== bomb1_y;
    commitmentHasherComponent.bomb2_x <== bomb2_x;
    commitmentHasherComponent.bomb2_y <== bomb2_y;
    commitmentHasherComponent.bomb3_x <== bomb3_x;
    commitmentHasherComponent.bomb3_y <== bomb3_y;
    commitment <== commitmentHasherComponent.commitment;

    // Comparators
    signal check_bomb1_x, check_bomb1_y;
    signal check_bomb2_x, check_bomb2_y;
    signal check_bomb3_x, check_bomb3_y;

    check_bomb1_x <== bomb1_x - player_x;
    check_bomb1_y <== bomb1_y - player_y;
    check_bomb2_x <== bomb2_x - player_x;
    check_bomb2_y <== bomb2_y - player_y;
    check_bomb3_x <== bomb3_x - player_x;
    check_bomb3_y <== bomb3_y - player_y;

    // Check if any of the comparisons are zero
    component isz_bomb1_x = IsZero();
    component isz_bomb1_y = IsZero();
    component isz_bomb2_x = IsZero();
    component isz_bomb2_y = IsZero();
    component isz_bomb3_x = IsZero();
    component isz_bomb3_y = IsZero();

    isz_bomb1_x.in <== check_bomb1_x;
    isz_bomb1_y.in <== check_bomb1_y;
    isz_bomb2_x.in <== check_bomb2_x;
    isz_bomb2_y.in <== check_bomb2_y;
    isz_bomb3_x.in <== check_bomb3_x;
    isz_bomb3_y.in <== check_bomb3_y;

    // Aggregate results
    signal match_a, match_b, match_c;
    signal match_any;

    match_a <== isz_bomb1_x.out * isz_bomb1_y.out;
    match_b <== isz_bomb2_x.out * isz_bomb2_y.out;
    match_c <== isz_bomb3_x.out * isz_bomb3_y.out;

    match_any <== match_a + match_b + match_c;

    component isz_final = IsZero();
    isz_final.in <== 1 - match_any;
    isz_final.out ==> result;

    log("Result:");
    log(result);
    log("Bombs commitment:");
    log(commitment);
}

component main {public [player_x, player_y]} = detonateBomb();