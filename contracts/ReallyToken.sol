//SPDX-License-Identifier: ISC
pragma solidity ^0.8.0;

import "./BaseERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ReallyToken custom ERC20 Contract
 * @author Marco Castiglione
*/
contract ReallyToken is BaseERC20, UUPSUpgradeable {

    bytes32 public domainSeparator;

    /// @dev owner => nonce
    mapping(address => uint256) public nonces;

    bytes32 private constant _PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    function initialize(
        string calldata name_,
        string calldata symbol_
    ) external initializer {

        __Ownable_init();
        __UUPSUpgradeable_init();

        _erc20Init(name_, symbol_);

        _updateDomainSeparator();

    }

    /** 
     * @dev   approve funds from owner to spender via signature
     * @param tokenOwner the owner of the funds
     * @param spender the one to approve to
     * @param amount amount to approve
     * @param deadline deadline of the permit
     * @param v the v of the signature
     * @param r the r of the signature
     * @param s the s of the signature
     */
    function permit(
        address tokenOwner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

        // Assembly for more efficiently computing
        bytes32 hashStruct = keccak256(
            abi.encode(
                _PERMIT_TYPEHASH,
                tokenOwner,
                spender,
                amount,
                nonces[tokenOwner],
                deadline
            )
        );

        bytes32 eip712DomainHash = _domainSeparator();

        bytes32 hash = keccak256(
            abi.encodePacked(uint16(0x1901), eip712DomainHash, hashStruct)
        );

        address signer = _recover(hash, v, r, s);

        require(signer == tokenOwner, "ERC20Permit: invalid signature");

        nonces[tokenOwner] += 1;
        _approve(tokenOwner, spender, amount);
    }

    /** 
     * @dev   transfer funds from tokenOwner to address ´to´ with signature
     *        can only be called by ´spender´
     * @param tokenOwner the owner of the funds
     * @param spender the one to approve to
     * @param to recipient of the funds
     * @param amount amount to approve
     * @param deadline deadline of the permit
     * @param v the v of the signature
     * @param r the r of the signature
     * @param s the s of the signature
     */
    function executePermit(
        address tokenOwner,
        address spender,
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= deadline, "expired deadline");
        require(msg.sender == spender, "Invalid sender");

        // Assembly for more efficiently computing
        bytes32 hashStruct = keccak256(
            abi.encode(
                _PERMIT_TYPEHASH,
                tokenOwner,
                spender,
                amount,
                nonces[tokenOwner],
                deadline
            )
        );

        bytes32 eip712DomainHash = _domainSeparator();

        bytes32 hash = keccak256(
            abi.encodePacked(uint16(0x1901), eip712DomainHash, hashStruct)
        );

        address signer = _recover(hash, v, r, s);

        require(signer == tokenOwner, "ERC20Permit: invalid signature");

        nonces[tokenOwner] += 1;
        _transfer(tokenOwner, to, amount);
    }

    /** 
     * @dev   transfer funds from N owners to address ´to´ with signature
     *        can only be called by ´spender´
     * @param owners the owner of the funds
     * @param amounts amount to approve
     * @param deadlines deadline of the permit
     * @param spender the one to approve to
     * @param to recipient of the funds
     * @param vs the v of the signature
     * @param rs the r of the signature
     * @param ss the s of the signature
     */
    function executePermitBatch(
        address[] memory owners,
        uint256[] memory amounts,
        uint256[] memory deadlines,
        address spender,
        address to,
        uint8[] memory vs,
        bytes32[] memory rs,
        bytes32[] memory ss
    ) public virtual {

        require(msg.sender == spender, "Invalid sender");

        require(owners.length > 0, "Invalid owners lenght");
        require(amounts.length == owners.length , "Invalid amount lenght");
        require(deadlines.length == owners.length, "Invalid deadlines lenght");
        require(vs.length == owners.length, "Invalid vs lenght");
        require(rs.length == owners.length, "Invalid rs lenght");
        require(ss.length == owners.length, "Invalid ss lenght");

        bytes32 eip712DomainHash = _domainSeparator();

        for (uint256 n = 0; n < owners.length; n++) {
            require(block.timestamp <= deadlines[n], "expired deadline");

            address tokenOwner = owners[n];

            // Assembly for more efficiently computing
            bytes32 hashStruct = keccak256(
                abi.encode(
                    _PERMIT_TYPEHASH,
                    tokenOwner,
                    spender,
                    amounts[n],
                    nonces[tokenOwner],
                    deadlines[n]
                )
            );

            bytes32 hash = keccak256(
                abi.encodePacked(uint16(0x1901), eip712DomainHash, hashStruct)
            );

            address signer = _recover(hash, vs[n], rs[n], ss[n]);

            require(signer == tokenOwner, "ERC20Permit: invalid signature");

            nonces[tokenOwner] += 1;
            _transfer(tokenOwner, to, amounts[n]);

        }
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return domainSeparator;
    }

    // Returns the domain separator, updating it if chainID changes
    function _domainSeparator() private returns (bytes32) {
        if (domainSeparator != 0x00) {
            return domainSeparator;
        }

        return _updateDomainSeparator();
    }

    function _updateDomainSeparator() private returns (bytes32) {
        uint256 chainID = _chainID();

        bytes32 newDomainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name())), // ERC-20 Name
                keccak256(bytes("1")),    // Version
                chainID,
                address(this)
            )
        );

        domainSeparator = newDomainSeparator;

        return newDomainSeparator;
    }

    function getChainId() external view returns (uint256) {
        return _chainID();
    }

    function _chainID() private view returns (uint256) {
        uint256 chainID;
        assembly {
            chainID := chainid()
        }

        return chainID;
    }

    function _recover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address) {
        if (
            uint256(s) >
            0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0
        ) {
            revert("ECDSA: invalid signature 's' value");
        }

        if (v != 27 && v != 28) {
            revert("ECDSA: invalid signature 'v' value");
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

}
