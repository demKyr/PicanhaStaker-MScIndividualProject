// SPDX-License-Identifier: GPL-3.0
// This code was written by Demetris Kyriacou for the TruStake Picanha vault.

pragma solidity =0.8.19;

/// @notice Struct to hold information on pointers of processed withdrawal requests in wQueue to send funds after unbonding period.
/// @param first pointer to the first processed request in the queue.
/// @param amount pointer to the last processed request in the queue.
struct IndirectWithdrawal {
    uint256 first;
    uint256 last;
}


/// @notice struct that is added to a queue and holds information on a user's request.
/// @param user the user who made the request.
/// @param amount the amount of MATIC which the user requested.
struct Request {
    address user;
    uint256 amount;
    uint256 expiryDate;
    bool isDirectWithdraw;
}

