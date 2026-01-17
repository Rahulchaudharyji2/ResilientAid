// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ReliefToken.sol";

contract ReliefFund is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using Strings for uint256;

    ReliefToken public token;

    struct Category {
        string name;
        uint256 totalRaised;
        uint256 totalDistributed;
        bool exists;
    }

    mapping(uint256 => Category) public categories;
    mapping(address => uint256) public entityCategory; // Address -> Category ID
    mapping(address => uint256) public nonces; // Replay protection
    uint256 public categoryCount;

    event CategoryAdded(uint256 indexed id, string name);
    event AidDistributed(address indexed beneficiary, uint256 amount);
    event AidFunded(uint256 indexed categoryId, uint256 amount);
    event AidUsed(uint256 indexed categoryId, address indexed beneficiary, address indexed vendor, uint256 amount);
    event VendorVerified(address indexed vendor);

    constructor(address _tokenAddress, address initialOwner) Ownable(initialOwner) {
        token = ReliefToken(_tokenAddress);
    }

    function addCategory(string memory _name) public onlyOwner {
        categoryCount++;
        categories[categoryCount] = Category(_name, 0, 0, true);
        emit CategoryAdded(categoryCount, _name);
    }

    function whitelistBeneficiary(address _beneficiary, uint256 _categoryId) public onlyOwner {
        require(categories[_categoryId].exists, "Category does not exist");
        token.setBeneficiary(_beneficiary, true);
        entityCategory[_beneficiary] = _categoryId;
    }

    function whitelistVendor(address _vendor, uint256 _categoryId) public onlyOwner {
        require(categories[_categoryId].exists, "Category does not exist");
        token.setVendor(_vendor, true);
        entityCategory[_vendor] = _categoryId;
        emit VendorVerified(_vendor);
    }

    function donate(uint256 _categoryId) public payable {
        require(categories[_categoryId].exists, "Category does not exist");
        require(msg.value > 0, "Donation must be greater than 0");

        // Mint rUSD to the Fund (Pool) representing the value
        token.mint(address(this), msg.value);

        categories[_categoryId].totalRaised += msg.value;
        emit AidFunded(_categoryId, msg.value);
    }

    function distributeAid(address[] memory _beneficiaries, uint256 _amount) public onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            require(token.beneficiaries(_beneficiaries[i]), "Address is not a beneficiary");
            
            // Smart Fund Logic: Use existing pool balance if available, else mint (Safety Net)
            if (token.balanceOf(address(this)) >= _amount) {
                token.transfer(_beneficiaries[i], _amount);
            } else {
                token.mint(_beneficiaries[i], _amount);
            }
            
            // Track stats per category
            uint256 catId = entityCategory[_beneficiaries[i]];
            
            if (token.balanceOf(address(this)) < _amount && catId != 0) {
                 categories[catId].totalRaised += _amount;
                 emit AidFunded(catId, _amount);
            }

            emit AidDistributed(_beneficiaries[i], _amount);
        }
    }
    
    // Function to handle "Offline" transactions submitted by a vendor with a signature
    function processOfflineTransaction(
        address beneficiary,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(token.vendors(msg.sender), "Caller is not a verified vendor");
        
        // 1. Check Category Match
        uint256 benCat = entityCategory[beneficiary];
        uint256 vendCat = entityCategory[msg.sender];
        
        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch: Aid can only be used within the same Relief Category");

        // 2. Replay Protection
        require(nonce > nonces[beneficiary], "Invalid Nonce: Replay Attack");
        nonces[beneficiary] = nonce;

        // 3. Signature Verification
        // Reconstruct the message: "Authorize transfer of <amount> rUSD to vendor. Nonce: <nonce>"
        // Note: amount is in Wei.
        string memory message = string.concat(
            "Authorize transfer of ", 
            amount.toString(), 
            " rUSD to vendor. Nonce: ", 
            nonce.toString()
        );

        bytes32 messageHash = keccak256(bytes(message));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == beneficiary, "Invalid Signature: Not signed by beneficiary");

        // 4. Transfer from beneficiary to vendor
        token.transferFrom(beneficiary, msg.sender, amount);
        
        // 5. Update stats
        categories[benCat].totalDistributed += amount;
        emit AidUsed(benCat, beneficiary, msg.sender, amount);
    }

    // New function to help frontend verify what to sign
    function getMessageHash(uint256 amount, uint256 nonce) public pure returns (bytes32) {
        string memory message = string.concat(
            "Authorize transfer of ", 
            amount.toString(), 
            " rUSD to vendor. Nonce: ", 
            nonce.toString()
        );
        return keccak256(bytes(message));
    }

    // Function for Beneficiaries to pay Vendors directly (Online) while tracking stats
    function payVendor(address _vendor, uint256 _amount) public {
        require(token.beneficiaries(msg.sender), "Caller is not a beneficiary");
        require(token.vendors(_vendor), "Recipient is not a verified vendor");

        uint256 benCat = entityCategory[msg.sender];
        uint256 vendCat = entityCategory[_vendor];

        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch: Aid can only be used within the same Relief Category");

        // Transfer funds - ReliefFund (Owner) moves funds from Beneficiary to Vendor
        token.transferFrom(msg.sender, _vendor, _amount);

        // Update stats
        categories[benCat].totalDistributed += _amount;
        emit AidUsed(benCat, msg.sender, _vendor, _amount);
    }
}
