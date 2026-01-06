// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReliefToken is ERC20, Ownable {
    mapping(address => bool) public vendors;
    mapping(address => bool) public beneficiaries;

    uint256 public beneficiaryCount;
    uint256 public vendorCount;

    event VendorStatusChanged(address indexed vendor, bool status);
    event BeneficiaryStatusChanged(address indexed beneficiary, bool status);

    constructor(address initialOwner) ERC20("Relief USD", "rUSD") Ownable(initialOwner) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function setVendor(address vendor, bool status) public onlyOwner {
        if (vendors[vendor] != status) {
            if (status) {
                vendorCount++;
            } else {
                vendorCount--;
            }
        }
        vendors[vendor] = status;
        emit VendorStatusChanged(vendor, status);
    }

    function setBeneficiary(address beneficiary, bool status) public onlyOwner {
        if (beneficiaries[beneficiary] != status) {
            if (status) {
                beneficiaryCount++;
            } else {
                beneficiaryCount--;
            }
        }
        beneficiaries[beneficiary] = status;
        emit BeneficiaryStatusChanged(beneficiary, status);
    }

    function _update(address from, address to, uint256 value) internal override {
        // Allow minting (from is 0x0)
        if (from == address(0)) {
            super._update(from, to, value);
            return;
        }

        // Allow burning (to is 0x0)
        if (to == address(0)) {
            super._update(from, to, value);
            return;
        }

        // Allow owner (Admin/Fund) to move funds anywhere
        if (owner() == from) {
            super._update(from, to, value);
            return;
        }

        // RESTRICTION: Beneficiaries can ONLY transfer to verified Vendors
        require(vendors[to], "Restricted: Can only transfer to verified vendors");

        super._update(from, to, value);
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal override {
        if (spender == owner || spender == super.owner()) {
            return; // Owner (ReliefFund) has infinite allowance
        }
        super._spendAllowance(owner, spender, value);
    }
}
