import { assert } from "chai";
import { ethers } from "ethers";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { useEnvironment } from "./helpers";

describe("hardhat-ethers plugin", function () {
  describe("hardhat network with no accounts", function () {
    useEnvironment("hardhat-project-no-accounts", "hardhat");

    describe("fixture setup", function () {
      it("should not have accounts", async function () {
        const signers = await this.env.ethers.getSigners();
        assert.isEmpty(signers);
      });
    });

    describe("getContractAt", function () {
      let signerAddress: string;

      beforeEach(async function () {
        await this.env.network.provider.request({
          method: "evm_mine",
          params: [],
        });

        const { miner } = await this.env.ethers.provider.getBlock("latest");
        signerAddress = miner;

        await this.env.run(TASK_COMPILE, { quiet: true });
      });

      describe("with the name and address", function () {
        it("Should return an instance of a contract with a read-only provider", async function () {
          const receipt = await deployGreeter(this.env, signerAddress);

          assert.isTrue(this.env.ethers.provider._isProvider);
          const contract = await this.env.ethers.getContractAt(
            "Greeter",
            receipt.contractAddress
          );

          assert.isDefined(contract.provider);
          assert.isNotNull(contract.provider);
          assert.strictEqual(contract.provider, this.env.ethers.provider);
          assert.containsAllKeys(contract.functions, [
            "setGreeting(string)",
            "greet()",
          ]);

          const greeting = await contract.functions.greet();

          assert.equal(greeting, "Hi");
        });
      });

      describe("with the abi and address", function () {
        it("Should return an instance of a contract with a read-only provider", async function () {
          const receipt = await deployGreeter(this.env, signerAddress);

          const signers = await this.env.ethers.getSigners();
          assert.isEmpty(signers);

          const greeterArtifact = await this.env.artifacts.readArtifact(
            "Greeter"
          );

          const contract = await this.env.ethers.getContractAt(
            greeterArtifact.abi,
            receipt.contractAddress
          );

          assert.isDefined(contract.provider);
          assert.isNotNull(contract.provider);
          assert.strictEqual(contract.provider, this.env.ethers.provider);
          assert.containsAllKeys(contract.functions, [
            "setGreeting(string)",
            "greet()",
          ]);

          const greeting = await contract.functions.greet();

          assert.equal(greeting, "Hi");
        });
      });
    });
  });
});

async function deployGreeter(
  hre: HardhatRuntimeEnvironment,
  signerAddress: string
) {
  const Greeter = await hre.ethers.getContractFactory("Greeter");
  const tx = Greeter.getDeployTransaction();
  tx.from = signerAddress;

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [signerAddress],
  });
  const txHash: string = (await hre.network.provider.request({
    method: "eth_sendTransaction",
    params: [tx],
  })) as string;

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [signerAddress],
  });
  assert.isDefined(hre.ethers.provider);
  const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
  assert.equal(receipt.status, 1, "The deployment transaction failed.");

  return receipt;
}
