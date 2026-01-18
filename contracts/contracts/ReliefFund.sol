// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ReliefToken.sol";

// Interface to the Soulbound Token (ReliefPass) to check Security PIN
interface IReliefPass {
    function verifyPin(address user, string memory pin) external view returns (bool);
}

contract ReliefFund is ERC20, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using Strings for uint256;

    ReliefToken public token;
    IReliefPass public reliefPass;

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

    constructor(address _tokenAddress, address initialOwner)
        ERC20("Relief Fund Receipt", "RFR")
        Ownable(initialOwner)
    {
        token = ReliefToken(_tokenAddress);
    }

    // Link the ReliefPass (SBT) contract for security checks
    function setReliefPass(address _reliefPass) public onlyOwner {
        reliefPass = IReliefPass(_reliefPass);
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
        if (!categories[_categoryId].exists) revert("Category does not exist");
        if (msg.value == 0) revert("Donation must be greater than 0");

        token.mint(address(this), msg.value);

        categories[_categoryId].totalRaised += msg.value;
        emit AidFunded(_categoryId, msg.value);
    }

    function distributeAid(address[] memory _beneficiaries, uint256 _amount) public onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            if (_beneficiaries[i] != owner()) {
                require(token.beneficiaries(_beneficiaries[i]), "Address is not a beneficiary");
            }
            
            if (token.balanceOf(address(this)) >= _amount) {
                token.transfer(_beneficiaries[i], _amount);
            } else {
                token.mint(_beneficiaries[i], _amount);
            }
            
            uint256 catId = entityCategory[_beneficiaries[i]];
            if (token.balanceOf(address(this)) < _amount && catId != 0) {
                 categories[catId].totalRaised += _amount;
                 emit AidFunded(catId, _amount);
            }

            emit AidDistributed(_beneficiaries[i], _amount);
        }
    }
    
    function processOfflineTransaction(
        address beneficiary,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(token.vendors(msg.sender), "Caller is not a verified vendor");
        
        uint256 benCat = entityCategory[beneficiary];
        uint256 vendCat = entityCategory[msg.sender];
        
        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch");

        require(nonce > nonces[beneficiary], "Invalid Nonce");
        nonces[beneficiary] = nonce;

        string memory message = string.concat(
            "Authorize transfer of ", 
            amount.toString(), 
            " rUSD to vendor. Nonce: ", 
            nonce.toString()
        );

        // Minimal Implementation for Hackathon (Signature verification loose logic)
        // In Prod: verify signature matches beneficiary
        
        token.transferFrom(beneficiary, msg.sender, amount);
        
        categories[benCat].totalDistributed += amount;
        emit AidUsed(benCat, beneficiary, msg.sender, amount);
    }

    function getMessageHash(uint256 amount, uint256 nonce) public pure returns (bytes32) {
        string memory message = string.concat(
            "Authorize transfer of ", 
            amount.toString(), 
            " rUSD to vendor. Nonce: ", 
            nonce.toString()
        );
        return keccak256(bytes(message));
    }

    function payVendor(address _vendor, uint256 _amount) public {
        require(token.beneficiaries(msg.sender), "Caller is not a beneficiary");
        require(token.vendors(_vendor), "Recipient is not a verified vendor");

        uint256 benCat = entityCategory[msg.sender];
        uint256 vendCat = entityCategory[_vendor];

        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch");

        token.transferFrom(msg.sender, _vendor, _amount);

        categories[benCat].totalDistributed += _amount;
        emit AidUsed(benCat, msg.sender, _vendor, _amount);
    }

    // Secure PIN Charge: Called by Vendor, Authorized by Beneficiary's PIN
    function chargeBeneficiary(address _beneficiary, uint256 _amount, string memory _authSecret) public {
        require(token.vendors(msg.sender), "Caller is not a verified vendor");
        require(token.beneficiaries(_beneficiary), "Target is not a beneficiary");
        
        // REAL SECURITY CHECK: (Fixed Logic)
        require(address(reliefPass) != address(0), "ReliefPass not linked");
        
        bool isVerified = reliefPass.verifyPin(_beneficiary, _authSecret);
        require(isVerified, "SECURITY ALERT: PIN Mismatch! Transaction Blocked.");

        uint256 benCat = entityCategory[_beneficiary];
        uint256 vendCat = entityCategory[msg.sender];
        
        require(benCat != 0, "Beneficiary not assigned to category");
        require(benCat == vendCat, "Category Mismatch");

        token.transferFrom(_beneficiary, msg.sender, _amount);
        
        categories[benCat].totalDistributed += _amount;
        emit AidUsed(benCat, _beneficiary, msg.sender, _amount);
    }
}
