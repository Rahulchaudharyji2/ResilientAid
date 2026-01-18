// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReliefPass is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping from Token ID to Credit Balance (Points)
    mapping(uint256 => uint256) public cardCredits;
    // Mapping from Token ID to Category
    mapping(uint256 => string) public cardCategory;
    // Mapping from Beneficiary Address to Token ID
    mapping(address => uint256) public userTokenId;
    // Mapping from Beneficiary Address to hasPass
    mapping(address => bool) public hasPass;

    // Mapping from Token ID to Security Hash (keccak256 of PIN/BioData)
    mapping(uint256 => bytes32) private _securityHashes;

    constructor(address initialOwner)
        ERC721("Abha Relief Pass", "ABHA")
        Ownable(initialOwner)
    {}

    function mintPass(address to, string memory category, uint256 initialCredits, string memory uri) public onlyOwner {
        require(!hasPass[to], "User already has a Relief Pass");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        cardCredits[tokenId] = initialCredits;
        cardCategory[tokenId] = category;
        userTokenId[to] = tokenId;
        hasPass[to] = true;
        
        // Default PIN: "0000" (Hash for demo setup)
        _securityHashes[tokenId] = keccak256(abi.encodePacked("0000"));
    }

    function setSecurityPin(string memory newPin) public {
        require(hasPass[msg.sender], "No Pass found");
        uint256 tokenId = userTokenId[msg.sender];
        _securityHashes[tokenId] = keccak256(abi.encodePacked(newPin));
    }

    function verifyPin(address user, string memory pin) public view returns (bool) {
         if(!hasPass[user]) return false;
         uint256 tokenId = userTokenId[user];
         return _securityHashes[tokenId] == keccak256(abi.encodePacked(pin));
    }

    // Soulbound: Block transfers (allow only Mint and Burn)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // If from is not zero (minting) and to is not zero (burning), then it is a transfer.
        // We revert to block transfers.
        if (from != address(0) && to != address(0)) {
            revert("ReliefPass: Soulbound token cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }
    
    // Vendor/Admin can spend credits on behalf of user
    function spendCredits(address beneficiary, uint256 amount) public onlyOwner {
        require(hasPass[beneficiary], "User has no pass");
        uint256 tid = userTokenId[beneficiary];
        require(cardCredits[tid] >= amount, "Insufficient credits");
        cardCredits[tid] -= amount;
    }

    function addCredits(address beneficiary, uint256 amount) public onlyOwner {
        require(hasPass[beneficiary], "User has no pass");
        uint256 tid = userTokenId[beneficiary];
        cardCredits[tid] += amount;
    }

    function getPassDetails(address beneficiary) public view returns (uint256 id, uint256 credits, string memory category, string memory uri) {
        require(hasPass[beneficiary], "User has no pass");
        uint256 tid = userTokenId[beneficiary];
        return (tid, cardCredits[tid], cardCategory[tid], tokenURI(tid));
    }
}
