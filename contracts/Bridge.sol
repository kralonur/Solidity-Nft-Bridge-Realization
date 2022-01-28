//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Nft.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Bridge is ERC721Holder, Ownable {
    /// ECDSA
    using ECDSA for bytes32;
    /// Address of the validator
    address private _validator;

    /// ERC721 Token with access control and mint function
    ERC721Nft private _nftContract;
    /// A mapping for storing supported chains
    mapping(uint256 => bool) private _chains;
    /// A mapping for storing redeemed swaps
    mapping(bytes32 => bool) private _swapRedeem;

    constructor(address nftContractAddress, address validatorAddress) {
        _nftContract = ERC721Nft(nftContractAddress);
        _validator = validatorAddress;
    }

    /**
     * @dev Emitted when swap is initialized
     * @param tokenId The id of the token to swap
     * @param swapInitializer The initializer of the swap
     * @param chainSwapTo The chain to send token
     * @param nonce The nonce
     * @param uri The uri of the token
     */
    event SwapInitialized(
        uint256 indexed tokenId,
        address indexed swapInitializer,
        uint256 indexed chainSwapTo,
        uint256 nonce,
        string uri
    );

    /**
     * @dev Emitted when swap is redeemed
     * @param tokenId The id of the token to redeem
     * @param swapRedeemer The redeemer of the swap
     * @param chainSwapFrom The chain to get swap from
     * @param hash The hash of the swap
     */
    event SwapRedeemed(
        uint256 indexed tokenId,
        address indexed swapRedeemer,
        uint256 indexed chainSwapFrom,
        bytes32 hash
    );

    /**
     * @dev Emitted when a chain is added
     * @param chainId The id of the added chain
     */
    event ChainAdded(uint256 indexed chainId);
    /**
     * @dev Emitted when a chain is removed
     * @param chainId The id of the removed chain
     */
    event ChainRemoved(uint256 indexed chainId);

    /**
     * @dev Adds chain to supported chain list
     * @param chainId The id of chain
     */
    function addChain(uint256 chainId) external onlyOwner {
        _chains[chainId] = true;
        emit ChainAdded(chainId);
    }

    /**
     * @dev Removes chain from supported chain list
     * @param chainId The id of chain
     */
    function removeChain(uint256 chainId) external onlyOwner {
        _chains[chainId] = false;
        emit ChainRemoved(chainId);
    }

    /**
     * @dev Swaps token to another chain
     * @param tokenId The id of the token to swap
     * @param chainSwapTo The id of chain to swap
     * @param nonce The nonce
     */
    function swap(
        uint256 tokenId,
        uint256 chainSwapTo,
        uint256 nonce
    ) external {
        require(
            _nftContract.ownerOf(tokenId) == msg.sender,
            "You are not the owner of the token"
        );
        require(_chains[chainSwapTo], "Given chain is not supported");

        _nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        emit SwapInitialized(
            tokenId,
            msg.sender,
            chainSwapTo,
            nonce,
            _nftContract.tokenURI(tokenId)
        );
    }

    /**
     * @dev Redeems the token
     * @param tokenId The id of the token to redeem
     * @param swapInitializer The initializer of the swap
     * @param chainSwapFrom The id of chain to get token from
     * @param nonce The nonce
     * @param uri The uri of the token
     * @param v The v parameter of ECDSA signature
     * @param r The r parameter of ECDSA signature
     * @param s The s parameter of ECDSA signature
     */
    function redeem(
        uint256 tokenId,
        address swapInitializer,
        uint256 chainSwapFrom,
        uint256 nonce,
        string memory uri,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(msg.sender == _validator, "You are not the validator");
        require(_chains[chainSwapFrom], "Given chain is not supported");
        bytes32 hash = keccak256(
            abi.encodePacked(tokenId, swapInitializer, chainSwapFrom, nonce)
        );
        require(!_swapRedeem[hash], "You can not redeem token twice");
        address signer = ECDSA.recover(hash.toEthSignedMessageHash(), v, r, s);
        require(signer == _validator, "Invalid sign");

        if (_nftContract.exists(tokenId))
            _nftContract.safeTransferFrom(
                address(this),
                swapInitializer,
                tokenId
            );
        else _nftContract.mint(swapInitializer, uri, tokenId);

        _swapRedeem[hash] = true;

        emit SwapRedeemed(tokenId, swapInitializer, chainSwapFrom, hash);
    }

    /// @dev see {_swapRedeem}
    function isRedeemed(bytes32 hash) external view returns (bool) {
        return _swapRedeem[hash];
    }
}
