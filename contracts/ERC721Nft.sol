//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721Nft is ERC721URIStorage, AccessControl {
    /// Current token id
    uint256 public tokenId;
    /// Constant for minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// Constant for burner role
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor() ERC721("Token", "TKN") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Mints new ERC721 token then sets it's uri and attends it's id automatically
     * @dev see {mint}
     */
    function mint(address tokenOwner, string memory tokenURI)
        external
        onlyRole(MINTER_ROLE)
    {
        mint(tokenOwner, tokenURI, tokenId);
        tokenId++;
    }

    /**
     * @dev Mints new ERC721 token then sets it's uri
     * @param tokenOwner The owner of the minted token
     * @param tokenURI The URI of the minted token
     * @param tokenIdToMint The id of token to mint
     */
    function mint(
        address tokenOwner,
        string memory tokenURI,
        uint256 tokenIdToMint
    ) public onlyRole(MINTER_ROLE) {
        _safeMint(tokenOwner, tokenIdToMint);
        _setTokenURI(tokenIdToMint, tokenURI);
    }

    /// @dev see {ERC721-_burn}
    function burn(uint256 tokenIdToBurn) external onlyRole(BURNER_ROLE) {
        _burn(tokenIdToBurn);
    }

    /// @dev see {ERC721-_exists}
    function exists(uint256 tokenIdToSearch) external view returns (bool) {
        return _exists(tokenIdToSearch);
    }
}
