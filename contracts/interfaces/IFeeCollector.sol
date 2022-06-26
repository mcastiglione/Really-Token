// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IFeeCollector {

    event Withdrawal(
        address tokenAddress, 
        address recipient,
        uint256 amount
    );

    /**
     * @notice withdraw accrued funds
     * can only be called by owner
     * @param tokenAddress the address of the token to withdraw funds from
     * @param recipient of the funds
     * @param amount amount to withdraw
     */
    function withdraw(
        address tokenAddress, 
        address recipient,
        uint256 amount
    ) external;

}