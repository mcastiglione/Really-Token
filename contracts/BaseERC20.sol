//SPDX-License-Identifier: ISC
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

/**
 * @title  ERC20 token Contract
 * @author Marco Castiglione
 * @notice Custom ERC20 token contract
 * includes all Standard ERC20 functions
 * plus ERC20 metadata (name, symbol, decimals),
 * increaseAllowance and decreaseAllowance for better allowance management
 * functions for minting and burning tokens
 * function for batch minting 
 */
contract BaseERC20 is IERC20, OwnableUpgradeable {

    string private _name;
    string private _symbol;
    uint256 private _decimals;
    uint256 private _totalSupply;

    /// @dev address => balance
    mapping (address => uint256) private _balances;

    /// @dev owner => spender => allowance
    mapping (address => mapping(address => uint256)) private _allowances;

    constructor() {}

    function _erc20Init(
        string calldata name_,
        string calldata symbol_
    ) internal {

        _name = name_;
        _symbol = symbol_;
        _decimals = 18;

    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() external view returns (uint256) {
        return _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(
        address to,
        uint256 amount
    ) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {
        _verifyAndUpdateAllowance(
            from,
            msg.sender,
            amount
        );

        _transfer(from, to, amount);

        return true;
    }

    /**
     * @dev verify that spender has available allowance approved by 'owner'
     * if not available, then revert
     * if available, substract amount
     * @param owner the owner of the funds
     * @param spender the spender of the funds
     * @param amount amount to spend
     */
    function _verifyAndUpdateAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(_allowances[owner][spender] >= amount, "Not enough allowance");

        _allowances[owner][spender] -= amount;
    }

    /**
     * @dev verify address from, to and amount are valid
     * if any of them are invalid, revert
     * @param from must be different from address(0)
     * @param to must be different from address(0)
     * @param amount should be greater than 0
     */
    function _checkValues(
        address from,
        address to,
        uint256 amount
    ) internal pure {
        require(from != address(0), "Invalid address from");
        require(to != address(0), "Invalid address to");
        require(amount > 0, "Invalid amount");
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal {

        _checkValues(from, to, amount);

        require(_balances[from] >= amount, "Not enough balance!");

        _balances[from] -= amount;
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    function allowance(
        address owner,
        address spender
    ) external view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    /**
     * @notice increase allowance from caller to spender
     * @param spender address
     * @param amount to increase
     */
    function increaseAllowance(
        address spender,
        uint256 amount
    ) external returns (bool) {

        _checkValues(msg.sender, spender, amount);

        _approve(
            msg.sender,
            spender,
            _allowances[msg.sender][spender] + amount
        );

        return true;
    }

    /**
     * @notice decrease allowance from caller to spender 
     * @param spender address
     * @param amount to decrease
     */
    function decreaseAllowance(
        address spender, 
        uint256 amount
    ) external returns (bool) {

        require(spender != address(0), "Invalid address");

        uint256 currentAllowance = _allowances[msg.sender][spender];

        require(currentAllowance > amount, "Invalid amount");
        
        uint256 newAllowance = currentAllowance - amount;

        _approve(msg.sender, spender, newAllowance);

        return true;

    }

    function approve(
        address spender,
        uint256 amount
    ) external override returns (bool) {
        _approve(msg.sender, spender, amount);

        return true;
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        _checkValues(owner, spender, amount);

        _allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    /**
     * @notice mint tokens to address. Can only be called by contract owner
     * @param to address to mint
     * @param amount amount to mint
     */
    function mint(
        address to,
        uint256 amount
    ) external onlyOwner {
        _mint(to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal {
        _checkValues(msg.sender, to, amount);

        _balances[to] += amount;
        _totalSupply += amount;

        emit Transfer(address(0), to, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount amount to burn
     */
    function burn(
        uint256 amount
    ) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev burn implementation
     * check values, update and emit {Transfer} event
     * @param from address to burn from
     * @param amount amount to burn
     */
    function _burn(
        address from,
        uint256 amount
    ) internal {
        _checkValues(msg.sender, from, amount);

        uint256 balance = _balances[from];

        require(balance >= amount , "Not enough balance to burn!");

        _balances[from] = balance - amount;
        _totalSupply -= amount;

        emit Transfer(from, address(0), amount);

    }

}
