// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReliefToken.sol";

contract ReliefFund is Ownable {
    ReliefToken public token;

    struct Category {
        string name;
        uint256 totalRaised;
        uint256 totalDistributed;
        bool exists;
    }

    mapping(uint256 => Category) public categories;
    mapping(address => uint256) public entityCategory; // Address -> Category ID
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
        // Note: In production, this might be triggered by an Oracle or Stablecoin transfer.
        // Here, we treat Native Token (ETH/MATIC) 1:1 with rUSD for simplicity of demo.
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
            // Note: We don't increment totalRaised here anymore if it comes from the pool
            // But if we Minted (Safety Net), we should probably consider it "Government Funding" (Raised).
            // For simplicity, we only track Donor Funding in 'totalRaised' now (via donate function).
            // Actually, if we mint, let's essentially say it was "Auto-Raised".
            
            // Wait, user wants to see "Raised" for that category.
            // If Admin mints, it's effectively raised.
            // Let's keep the increment logic BUT only if we minted.
            // If we transferred from pool, it was already counted in 'donate'. Don't double count.
            
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
        
        // Critical: Check Category Match
        uint256 benCat = entityCategory[beneficiary];
        uint256 vendCat = entityCategory[msg.sender];
        
        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch: Aid can only be used within the same Relief Category");

        // Transfer from beneficiary to vendor
        token.transferFrom(beneficiary, msg.sender, amount);
        
        // Update stats
        categories[benCat].totalDistributed += amount;
        emit AidUsed(benCat, beneficiary, msg.sender, amount);
    }

    // NEW: Function for Beneficiaries to pay Vendors directly (Online) while tracking stats
    function payVendor(address _vendor, uint256 _amount) public {
        require(token.beneficiaries(msg.sender), "Caller is not a beneficiary");
        require(token.vendors(_vendor), "Recipient is not a verified vendor");

        uint256 benCat = entityCategory[msg.sender];
        uint256 vendCat = entityCategory[_vendor];

        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch: Aid can only be used within the same Relief Category");

        // Transfer funds - ReliefFund (Owner) moves funds from Beneficiary to Vendor
        // This utilizes the 'infinite allowance' override in ReliefToken for the Owner
        token.transferFrom(msg.sender, _vendor, _amount);

        // Update stats
        categories[benCat].totalDistributed += _amount;
        emit AidUsed(benCat, msg.sender, _vendor, _amount);
    }
}
