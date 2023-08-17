// SPDX-License-Identifier: GPL-3.0
// This code was written by Demetris Kyriacou for the TruStake Picanha vault.

pragma solidity =0.8.19;

import "./Types.sol";

import "hardhat/console.sol";


contract Queue{
    mapping(uint256 => Request) public data;
    uint256 public first = 0;
    uint256 public last = 0;

    // **************************************** ENQUEUEING / DEQUEUEING FUNCTIONS ****************************************

    function enqueue(Request calldata x) public {
        data[last] = x;
        last += 1;
    }

    function dequeue() public returns (address, uint256, uint256, bool) {
        require(first < last, "Queue is empty");
        address requestUser = data[first].user; 
        uint256 requestAmount = data[first].amount;  
        uint256 requestExpiryDate = data[first].expiryDate;    
        bool requestIsDirectWithdraw = data[first].isDirectWithdraw;
        delete data[first];
        first += 1;
        return (requestUser, requestAmount, requestExpiryDate, requestIsDirectWithdraw);
    }

    function deleteElement(uint256 idx) public returns (address, uint256, uint256, bool) {
        address requestUser = data[idx].user; 
        uint256 requestAmount = data[idx].amount;  
        uint256 requestExpiryDate = data[idx].expiryDate;    
        bool requestIsDirectWithdraw = data[idx].isDirectWithdraw;
        delete data[idx];
        return (requestUser, requestAmount, requestExpiryDate, requestIsDirectWithdraw);
    }

    // **************************************** LENGTH FUNCTIONS ****************************************
    
    function length() public view returns (uint256) {
        return last - first ;
    }

    function isEmpty() public view returns (bool) {
        return length() == 0;
    }

    // **************************************** GETTER FUNCTIONS ****************************************

    function getUser(uint256 _idx) public view returns (address) {
        return data[_idx].user;
    }

    function getAmount(uint256 _idx) public view returns (uint256) {
        return data[_idx].amount;
    }

    function getExpiryDate(uint256 _idx) public view returns (uint256) {
        return data[_idx].expiryDate;
    }

    function getIsDirectWithdraw(uint256 _idx) public view returns (bool) {
        return data[_idx].isDirectWithdraw;
    }

    // Debugging ONLY function
    function print() public view {
        console.log("PRINTING QUEUE");
        console.log(length());
        console.log(first, last);
        for (uint256 i = first; i < last; i++) {
            console.log(data[i].user, data[i].amount, data[i].expiryDate, data[i].isDirectWithdraw);
        }
    }

    // **************************************** AMOUNT CHANGING FUNCTIONS ****************************************

    function reduceAmount(uint256 _idx, uint256 _amount) public {
        data[_idx].amount -= _amount;
    }

    function clearAmount(uint256 _idx) public {
        data[_idx].amount = 0;
    }

    // **************************************** RESET FUNCTIONS ****************************************

    function clear() public {
        first = 0;
        last = 0;
    }

    function refresh() public{
        first = last;
    }
}

/// @dev This is a FIFO queue made of a mapping to hold requests