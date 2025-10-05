const { expect } = require("chai");
const { BN, expectRevert, time } = require("@openzeppelin/test-helpers");

const ElectionFactory = artifacts.require("ElectionFactory");
const Election = artifacts.require("Election");

contract("ElectionFactory", (accounts) => {
  const [owner, creator1, creator2] = accounts;
  let factory;

  beforeEach(async () => {
    factory = await ElectionFactory.new({ from: owner });
  });

  describe("Deployment", () => {
    it("should set the correct owner", async () => {
      const factoryOwner = await factory.owner();
      expect(factoryOwner).to.equal(owner);
    });

    it("should start with zero elections", async () => {
      const count = await factory.electionsCount();
      expect(count.toNumber()).to.equal(0);
    });
  });

  describe("Creating Elections", () => {
    it("should create an election with valid parameters", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60)); // starts in 60 seconds
      const endTime = startTime.add(new BN(3600)); // 1 hour duration

      const tx = await factory.createElection(
        "Presidential Election",
        "Vote for the next president",
        startTime,
        endTime,
        ["Candidate A", "Candidate B", "Candidate C"],
        false, // isMultipleChoice
        1,     // maxChoices
        false, // isCommitReveal
        { from: creator1 }
      );

      // Check event
      expect(tx.logs.length).to.equal(1);
      expect(tx.logs[0].event).to.equal("ElectionCreated");
      expect(tx.logs[0].args.name).to.equal("Presidential Election");
      expect(tx.logs[0].args.isMultipleChoice).to.equal(false);
      expect(tx.logs[0].args.maxChoices.toNumber()).to.equal(1);
      expect(tx.logs[0].args.isCommitReveal).to.equal(false);

      // Check election count
      const count = await factory.electionsCount();
      expect(count.toNumber()).to.equal(1);

      // Get election address
      const elections = await factory.getElections();
      expect(elections.length).to.equal(1);

      // Verify election contract
      const electionAddr = elections[0];
      const election = await Election.at(electionAddr);
      const name = await election.name();
      expect(name).to.equal("Presidential Election");
    });

    it("should create multiple elections", async () => {
      const now = await time.latest();
      const startTime1 = now.add(new BN(60));
      const endTime1 = startTime1.add(new BN(3600));

      await factory.createElection(
        "Election 1",
        "First election",
        startTime1,
        endTime1,
        ["Option A", "Option B"],
        false,
        1,
        false,
        { from: creator1 }
      );

      const startTime2 = now.add(new BN(120));
      const endTime2 = startTime2.add(new BN(7200));

      await factory.createElection(
        "Election 2",
        "Second election",
        startTime2,
        endTime2,
        ["Yes", "No"],
        false,
        1,
        false,
        { from: creator2 }
      );

      const count = await factory.electionsCount();
      expect(count.toNumber()).to.equal(2);

      const elections = await factory.getElections();
      expect(elections.length).to.equal(2);
    });

    it("should revert when creating election with empty name", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      await expectRevert(
        factory.createElection(
          "",
          "Description",
          startTime,
          endTime,
          ["Option A", "Option B"],
          false,
          1,
          false,
          { from: creator1 }
        ),
        "Name required"
      );
    });

    it("should revert when endTime <= startTime", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(3600));
      const endTime = startTime.sub(new BN(60)); // end before start

      await expectRevert(
        factory.createElection(
          "Invalid Election",
          "Description",
          startTime,
          endTime,
          ["Option A", "Option B"],
          false,
          1,
          false,
          { from: creator1 }
        ),
        "Invalid window"
      );
    });

    it("should revert when less than 2 options provided", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      await expectRevert(
        factory.createElection(
          "Invalid Election",
          "Description",
          startTime,
          endTime,
          ["Only One Option"],
          false,
          1,
          false,
          { from: creator1 }
        ),
        "At least 2 options"
      );
    });

    it("should revert when isMultipleChoice is true (MVP restriction)", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      await expectRevert(
        factory.createElection(
          "Multiple Choice Election",
          "Description",
          startTime,
          endTime,
          ["Option A", "Option B", "Option C"],
          true, // isMultipleChoice = true
          2,
          false,
          { from: creator1 }
        ),
        "MVP: single choice only"
      );
    });

    it("should revert when maxChoices != 1 (MVP restriction)", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      await expectRevert(
        factory.createElection(
          "Invalid Max Choices",
          "Description",
          startTime,
          endTime,
          ["Option A", "Option B", "Option C"],
          false,
          3, // maxChoices = 3
          false,
          { from: creator1 }
        ),
        "MVP: maxChoices must be 1"
      );
    });

    it("should revert when isCommitReveal is true (MVP restriction)", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      await expectRevert(
        factory.createElection(
          "Commit-Reveal Election",
          "Description",
          startTime,
          endTime,
          ["Option A", "Option B"],
          false,
          1,
          true, // isCommitReveal = true
          { from: creator1 }
        ),
        "MVP: commit-reveal disabled"
      );
    });
  });

  describe("Querying Elections", () => {
    it("should return all election addresses", async () => {
      const now = await time.latest();
      
      const startTime1 = now.add(new BN(60));
      const endTime1 = startTime1.add(new BN(3600));
      await factory.createElection(
        "Election 1",
        "First",
        startTime1,
        endTime1,
        ["A", "B"],
        false,
        1,
        false,
        { from: creator1 }
      );

      const startTime2 = now.add(new BN(120));
      const endTime2 = startTime2.add(new BN(3600));
      await factory.createElection(
        "Election 2",
        "Second",
        startTime2,
        endTime2,
        ["Yes", "No"],
        false,
        1,
        false,
        { from: creator1 }
      );

      const elections = await factory.getElections();
      expect(elections.length).to.equal(2);

      // Verify both are valid contract addresses
      for (let addr of elections) {
        const election = await Election.at(addr);
        const name = await election.name();
        expect(name.length).to.be.greaterThan(0);
      }
    });

    it("should return correct election count", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      let count = await factory.electionsCount();
      expect(count.toNumber()).to.equal(0);

      await factory.createElection(
        "Election 1",
        "First",
        startTime,
        endTime,
        ["A", "B"],
        false,
        1,
        false,
        { from: creator1 }
      );

      count = await factory.electionsCount();
      expect(count.toNumber()).to.equal(1);

      await factory.createElection(
        "Election 2",
        "Second",
        startTime,
        endTime,
        ["Yes", "No"],
        false,
        1,
        false,
        { from: creator1 }
      );

      count = await factory.electionsCount();
      expect(count.toNumber()).to.equal(2);
    });
  });

  describe("Election Contract Verification", () => {
    it("should create election with correct metadata", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      await factory.createElection(
        "Test Election",
        "Test Description",
        startTime,
        endTime,
        ["Candidate A", "Candidate B", "Candidate C"],
        false,
        1,
        false,
        { from: creator1 }
      );

      const elections = await factory.getElections();
      const election = await Election.at(elections[0]);

      expect(await election.name()).to.equal("Test Election");
      expect(await election.description()).to.equal("Test Description");
      expect((await election.startTime()).toString()).to.equal(startTime.toString());
      expect((await election.endTime()).toString()).to.equal(endTime.toString());
      expect(await election.isMultipleChoice()).to.equal(false);
      expect((await election.maxChoices()).toNumber()).to.equal(1);
      expect(await election.isCommitReveal()).to.equal(false);
      expect(await election.creator()).to.equal(creator1);
      expect(await election.factory()).to.equal(factory.address);
    });

    it("should create election with correct options", async () => {
      const now = await time.latest();
      const startTime = now.add(new BN(60));
      const endTime = startTime.add(new BN(3600));

      const options = ["Option 1", "Option 2", "Option 3", "Option 4"];

      await factory.createElection(
        "Test Election",
        "Description",
        startTime,
        endTime,
        options,
        false,
        1,
        false,
        { from: creator1 }
      );

      const elections = await factory.getElections();
      const election = await Election.at(elections[0]);

      const retrievedOptions = await election.getOptions();
      expect(retrievedOptions.length).to.equal(options.length);
      
      for (let i = 0; i < options.length; i++) {
        expect(retrievedOptions[i]).to.equal(options[i]);
      }
    });
  });
});