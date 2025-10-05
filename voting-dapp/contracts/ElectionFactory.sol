// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Election.sol";

contract ElectionFactory {
    address public owner;
    address[] private _elections;

    event ElectionCreated(
        address indexed electionAddress,
        string name,
        uint256 startTime,
        uint256 endTime,
        bool isMultipleChoice,
        uint8 maxChoices,
        bool isCommitReveal
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // MVP: criar eleição e opções numa única transação
    function createElection(
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        string[] memory options,
        bool isMultipleChoice, // deve ser false no MVP
        uint8 maxChoices,      // deve ser 1 no MVP
        bool isCommitReveal    // deve ser false no MVP
    ) external returns (address) {
        // Para desenvolvimento, pode permitir qualquer criador
        // Em produção, restrinja com onlyOwner ou papel admin
        Election election = new Election(
            msg.sender,
            name,
            description,
            startTime,
            endTime,
            options,
            isMultipleChoice,
            maxChoices,
            isCommitReveal
        );
        address electionAddr = address(election);
        _elections.push(electionAddr);

        emit ElectionCreated(
            electionAddr,
            name,
            startTime,
            endTime,
            isMultipleChoice,
            maxChoices,
            isCommitReveal
        );

        return electionAddr;
    }

    function getElections() external view returns (address[] memory) {
        return _elections;
    }

    function electionsCount() external view returns (uint256) {
        return _elections.length;
    }
}