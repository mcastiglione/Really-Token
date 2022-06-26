// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IERC20.sol";

contract FeeCollector is OwnableUpgradeable, UUPSUpgradeable {

    event Withdrawal(
        address tokenAddress, 
        address recipient,
        uint256 amount
    );

    constructor() {}

    function initialize(
        address owner_
    ) external initializer {
        __UUPSUpgradeable_init();

        _transferOwnership(owner_);
    }

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
    ) external onlyOwner {

        require(tokenAddress != address(0), "Invalid tokenAddress");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(tokenBalance >= amount, "Not enough balance");

        IERC20(tokenAddress).transfer(recipient, amount);

        emit Withdrawal(tokenAddress, recipient, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}