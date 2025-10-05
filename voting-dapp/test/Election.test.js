const { expect } = require("chai");
const { BN, expectRevert, time } = require("@openzeppelin/test-helpers");

const ElectionFactory = artifacts.require("ElectionFactory");
const Election = artifacts.require("Election");

contract("Election", (accounts) => {
  const [owner, creator, voter1, voter2, voter3, nonVoter] = accounts;
  let factory;
  let election;
  let startTime;
  let endTime;

  beforeEach(async () => {
    factory = await ElectionFactory.new({ from: owner });
    
    const now = await time.latest();
    startTime = now.add(new BN(60)); // starts in 60 seconds
    endTime = startTime.add(new BN(3600)); // 1 hour duration

    const tx = await factory.createElection(
      "Presidential Election",
      "Vote for the next president",
      startTime,
      endTime,
      ["Candidate A", "Candidate B", "Candidate C"],
      false,
      1,
      false,
      { from: creator }
    );

    const elections = await factory.getElections();
    election = await Election.at(elections[0]);
  });

  describe("Deployment and Initialization", () => {
    it("should have correct metadata", async () => {
      expect(await election.name()).to.equal("Presidential Election");
      expect(await election.description()).to.equal("Vote for the next president");
      expect((await election.startTime()).toString()).to.equal(startTime.toString());
      expect((await election.endTime()).toString()).to.equal(endTime.toString());
    });

    it("should have correct flags (MVP restrictions)", async () => {
      expect(await election.isMultipleChoice()).to.equal(false);
      expect((await election.maxChoices()).toNumber()).to.equal(1);
      expect(await election.isCommitReveal()).to.equal(false);
    });

    it("should have correct creator and factory", async () => {
      expect(await election.creator()).to.equal(creator);
      expect(await election.factory()).to.equal(factory.address);
    });

    it("should have correct options", async () => {
      const options = await election.getOptions();
      expect(options.length).to.equal(3);
      expect(options[0]).to.equal("Candidate A");
      expect(options[1]).to.equal("Candidate B");
      expect(options[2]).to.equal("Candidate C");
    });

    it("should initialize with no votes", async () => {
      expect(await election.hasVoted(voter1)).to.equal(false);
      expect(await election.hasVoted(voter2)).to.equal(false);
    });
  });

  describe("Election State", () => {
    it("should not be open before start time", async () => {
      const isOpen = await election.isOpen();
      expect(isOpen).to.equal(false);
    });

    it("should be open during voting window", async () => {
      await time.increaseTo(startTime.add(new BN(1)));
      const isOpen = await election.isOpen();
      expect(isOpen).to.equal(true);
    });

    it("should not be open after end time", async () => {
      await time.increaseTo(endTime.add(new BN(1)));
      const isOpen = await election.isOpen();
      expect(isOpen).to.equal(false);
    });

    it("should not have ended before end time", async () => {
      await time.increaseTo(startTime.add(new BN(1)));
      const hasEnded = await election.hasEnded();
      expect(hasEnded).to.equal(false);
    });

    it("should have ended after end time", async () => {
      await time.increaseTo(endTime.add(new BN(1)));
      const hasEnded = await election.hasEnded();
      expect(hasEnded).to.equal(true);
    });
  });

  describe("Voting", () => {
    beforeEach(async () => {
      // Advance time to voting window
      await time.increaseTo(startTime.add(new BN(1)));
    });

    it("should allow valid vote during voting window", async () => {
      const tx = await election.vote(0, { from: voter1 });
      
      // Check event
      expect(tx.logs.length).to.equal(1);
      expect(tx.logs[0].event).to.equal("Voted");
      expect(tx.logs[0].args.voter).to.equal(voter1);
      expect(tx.logs[0].args.optionIndex.toNumber()).to.equal(0);

      // Check hasVoted
      expect(await election.hasVoted(voter1)).to.equal(true);
    });

    it("should allow multiple voters to vote for different options", async () => {
      await election.vote(0, { from: voter1 });
      await election.vote(1, { from: voter2 });
      await election.vote(2, { from: voter3 });

      expect(await election.hasVoted(voter1)).to.equal(true);
      expect(await election.hasVoted(voter2)).to.equal(true);
      expect(await election.hasVoted(voter3)).to.equal(true);
    });

    it("should allow multiple voters to vote for the same option", async () => {
      await election.vote(0, { from: voter1 });
      await election.vote(0, { from: voter2 });
      await election.vote(0, { from: voter3 });

      expect(await election.hasVoted(voter1)).to.equal(true);
      expect(await election.hasVoted(voter2)).to.equal(true);
      expect(await election.hasVoted(voter3)).to.equal(true);
    });

    it("should revert when voting before start time", async () => {
      // Create new election in the future
      const futureStart = (await time.latest()).add(new BN(3600));
      const futureEnd = futureStart.add(new BN(3600));

      await factory.createElection(
        "Future Election",
        "Description",
        futureStart,
        futureEnd,
        ["Option A", "Option B"],
        false,
        1,
        false,
        { from: creator }
      );

      const elections = await factory.getElections();
      const futureElection = await Election.at(elections[1]);

      await expectRevert(
        futureElection.vote(0, { from: voter1 }),
        "Out of voting window"
      );
    });

    it("should revert when voting after end time", async () => {
      await time.increaseTo(endTime.add(new BN(1)));

      await expectRevert(
        election.vote(0, { from: voter1 }),
        "Out of voting window"
      );
    });

    it("should revert when voter tries to vote twice", async () => {
      await election.vote(0, { from: voter1 });

      await expectRevert(
        election.vote(1, { from: voter1 }),
        "Already voted"
      );
    });

    it("should revert when voting for invalid option index", async () => {
      await expectRevert(
        election.vote(3, { from: voter1 }), // only 0, 1, 2 are valid
        "Index out of range"
      );

      await expectRevert(
        election.vote(999, { from: voter1 }),
        "Index out of range"
      );
    });

    it("should track hasVoted correctly", async () => {
      expect(await election.hasVoted(voter1)).to.equal(false);
      
      await election.vote(0, { from: voter1 });
      
      expect(await election.hasVoted(voter1)).to.equal(true);
      expect(await election.hasVoted(voter2)).to.equal(false);
    });
  });

  describe("Results", () => {
    beforeEach(async () => {
      // Advance to voting window and cast some votes
      await time.increaseTo(startTime.add(new BN(1)));
      await election.vote(0, { from: voter1 }); // Candidate A
      await election.vote(0, { from: voter2 }); // Candidate A
      await election.vote(1, { from: voter3 }); // Candidate B
    });

    it("should revert when getting results before election ends", async () => {
      await expectRevert(
        election.getResults(),
        "Results available after end"
      );
    });

    it("should return correct results after election ends", async () => {
      await time.increaseTo(endTime.add(new BN(1)));

      const results = await election.getResults();
      expect(results.length).to.equal(3);
      expect(results[0].toNumber()).to.equal(2); // Candidate A: 2 votes
      expect(results[1].toNumber()).to.equal(1); // Candidate B: 1 vote
      expect(results[2].toNumber()).to.equal(0); // Candidate C: 0 votes
    });

    it("should return all zeros if no votes cast", async () => {
      // Create new election
      const now = await time.latest();
      const newStart = now.add(new BN(60));
      const newEnd = newStart.add(new BN(3600));

      await factory.createElection(
        "No Votes Election",
        "Description",
        newStart,
        newEnd,
        ["Option A", "Option B"],
        false,
        1,
        false,
        { from: creator }
      );

      const elections = await factory.getElections();
      const noVotesElection = await Election.at(elections[1]);

      // Advance past end time
      await time.increaseTo(newEnd.add(new BN(1)));

      const results = await noVotesElection.getResults();
      expect(results.length).to.equal(2);
      expect(results[0].toNumber()).to.equal(0);
      expect(results[1].toNumber()).to.equal(0);
    });

    it("should accurately count votes for all options", async () => {
      // Create new election with more voters
      const now = await time.latest();
      const newStart = now.add(new BN(60));
      const newEnd = newStart.add(new BN(3600));

      await factory.createElection(
        "Multi-Voter Election",
        "Description",
        newStart,
        newEnd,
        ["A", "B", "C", "D"],
        false,
        1,
        false,
        { from: creator }
      );

      const elections = await factory.getElections();
      const multiElection = await Election.at(elections[1]);

      await time.increaseTo(newStart.add(new BN(1)));

      // Cast votes
      await multiElection.vote(0, { from: accounts[0] }); // A
      await multiElection.vote(0, { from: accounts[1] }); // A
      await multiElection.vote(0, { from: accounts[2] }); // A
      await multiElection.vote(1, { from: accounts[3] }); // B
      await multiElection.vote(1, { from: accounts[4] }); // B
      await multiElection.vote(2, { from: accounts[5] }); // C
      // D gets no votes

      await time.increaseTo(newEnd.add(new BN(1)));

      const results = await multiElection.getResults();
      expect(results[0].toNumber()).to.equal(3); // A: 3 votes
      expect(results[1].toNumber()).to.equal(2); // B: 2 votes
      expect(results[2].toNumber()).to.equal(1); // C: 1 vote
      expect(results[3].toNumber()).to.equal(0); // D: 0 votes
    });
  });

  describe("Edge Cases", () => {
    it("should handle election with exactly 2 options", async () => {
      const now = await time.latest();
      const newStart = now.add(new BN(60));
      const newEnd = newStart.add(new BN(3600));

      await factory.createElection(
        "Binary Election",
        "Yes or No",
        newStart,
        newEnd,
        ["Yes", "No"],
        false,
        1,
        false,
        { from: creator }
      );

      const elections = await factory.getElections();
      const binaryElection = await Election.at(elections[1]);

      const options = await binaryElection.getOptions();
      expect(options.length).to.equal(2);
      expect(options[0]).to.equal("Yes");
      expect(options[1]).to.equal("No");
    });

    it("should handle election with many options", async () => {
      const now = await time.latest();
      const newStart = now.add(new BN(60));
      const newEnd = newStart.add(new BN(3600));

      const manyOptions = [];
      for (let i = 1; i <= 10; i++) {
        manyOptions.push(`Candidate ${i}`);
      }

      await factory.createElection(
        "Many Candidates Election",
        "Description",
        newStart,
        newEnd,
        manyOptions,
        false,
        1,
        false,
        { from: creator }
      );

      const elections = await factory.getElections();
      const manyElection = await Election.at(elections[1]);

      const options = await manyElection.getOptions();
      expect(options.length).to.equal(10);
    });

    it("should handle voting at exact start time", async () => {
      await time.increaseTo(startTime);
      
      // Should be able to vote at exact start time
      await election.vote(0, { from: voter1 });
      expect(await election.hasVoted(voter1)).to.equal(true);
    });

    it("should handle voting at exact end time", async () => {
      await time.increaseTo(endTime);
      
      // Should be able to vote at exact end time
      await election.vote(0, { from: voter1 });
      expect(await election.hasVoted(voter1)).to.equal(true);
    });

    it("should not allow voting one second after end time", async () => {
      await time.increaseTo(endTime.add(new BN(1)));
      
      await expectRevert(
        election.vote(0, { from: voter1 }),
        "Out of voting window"
      );
    });
  });

  describe("Gas Optimization Checks", () => {
    it("should emit single event per vote", async () => {
      await time.increaseTo(startTime.add(new BN(1)));
      
      const tx = await election.vote(0, { from: voter1 });
      expect(tx.logs.length).to.equal(1);
    });

    it("should handle sequential votes efficiently", async () => {
      await time.increaseTo(startTime.add(new BN(1)));
      
      const tx1 = await election.vote(0, { from: voter1 });
      const tx2 = await election.vote(1, { from: voter2 });
      const tx3 = await election.vote(2, { from: voter3 });

      // All transactions should succeed
      expect(tx1.receipt.status).to.equal(true);
      expect(tx2.receipt.status).to.equal(true);
      expect(tx3.receipt.status).to.equal(true);
    });
  });
});