const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Relief Contracts", function () {
  let ReliefToken, token, ReliefFund, fund;
  let owner, beneficiary, vendor, other;

  beforeEach(async function () {
    [owner, beneficiary, vendor, other] = await ethers.getSigners();

    ReliefToken = await ethers.getContractFactory("ReliefToken");
    token = await ReliefToken.deploy(owner.address);
    await token.waitForDeployment();

    ReliefFund = await ethers.getContractFactory("ReliefFund");
    fund = await ReliefFund.deploy(await token.getAddress(), owner.address);
    await fund.waitForDeployment();

    // Transfer ownership to fund
    await token.transferOwnership(await fund.getAddress());
  });

  describe("Whitelisting", function () {
    it("Should allow owner to whitelist beneficiary", async function () {
      await fund.whitelistBeneficiary(beneficiary.address);
      expect(await token.beneficiaries(beneficiary.address)).to.equal(true);
    });

    it("Should allow owner to whitelist vendor", async function () {
      await fund.whitelistVendor(vendor.address);
      expect(await token.vendors(vendor.address)).to.equal(true);
    });
  });

  describe("Distribution", function () {
    it("Should allow fund to distribute aid", async function () {
      await fund.whitelistBeneficiary(beneficiary.address);
      await fund.distributeAid([beneficiary.address], 100);
      expect(await token.balanceOf(beneficiary.address)).to.equal(100);
    });
  });

  describe("Restricted Transfers", function () {
    beforeEach(async function () {
      await fund.whitelistBeneficiary(beneficiary.address);
      await fund.whitelistVendor(vendor.address);
      await fund.distributeAid([beneficiary.address], 100);
    });

    it("Should FAIL if beneficiary sends to non-vendor", async function () {
      await expect(
        token.connect(beneficiary).transfer(other.address, 50)
      ).to.be.revertedWith("Restricted: Can only transfer to verified vendors");
    });

    it("Should PASS if beneficiary sends to verified vendor", async function () {
      await token.connect(beneficiary).transfer(vendor.address, 50);
      expect(await token.balanceOf(vendor.address)).to.equal(50);
    });
  });

  describe("Offline Process / Fund Controls", function () {
    beforeEach(async function () {
      await fund.whitelistBeneficiary(beneficiary.address);
      await fund.whitelistVendor(vendor.address);
      await fund.distributeAid([beneficiary.address], 100);
    });

    it("Should allow ReliefFund to move funds without allowance (Super Owner)", async function () {
      // 1. Beneficiary has 100 tokens (from beforeEach)
      // 2. Vendor calls processOfflineTransaction(beneficiary, 20, nonce, sig)
      // 3. Vendor should gain 20
      // 4. Beneficiary should lose 20
      
      const tx = await fund.connect(vendor).processOfflineTransaction(beneficiary.address, 20, 0, "0x");
      await tx.wait();
      
      expect(await token.balanceOf(beneficiary.address)).to.equal(80);
      expect(await token.balanceOf(vendor.address)).to.equal(20);
    });
  });
});
