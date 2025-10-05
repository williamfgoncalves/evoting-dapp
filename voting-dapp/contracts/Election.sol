// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19; // 🔧 Trocar para 0.8.19 para evitar bug com string[]

contract Election {
    // Metadados da eleição
    string public name;
    string public description;
    uint256 public startTime;
    uint256 public endTime;

    // Flags / modo de operação
    bool public isMultipleChoice; // sempre false no MVP
    uint8 public maxChoices;      // 1 no MVP
    bool public isCommitReveal;   // false no MVP

    // Opções e contadores
    string[] private _options;
    uint256[] private _tallies;

    // Controle
    address public factory;
    address public creator;
    mapping(address => bool) private _hasVoted;

    // Eventos
    event Voted(address indexed voter, uint256 indexed optionIndex);
    event Finalized(uint256 timestamp);

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    constructor(
        address _creator,
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        string[] memory options,
        bool _isMultipleChoice,
        uint8 _maxChoices,
        bool _isCommitReveal
    ) {
        // --- Validações ---
        require(bytes(_name).length > 0, "Name required");
        require(_endTime > _startTime, "Invalid window");
        require(options.length >= 2, "At least 2 options");
        require(!_isMultipleChoice, "MVP: single choice only");
        require(_maxChoices == 1, "MVP: maxChoices must be 1");
        require(!_isCommitReveal, "MVP: commit-reveal disabled");

        // --- Inicializações ---
        factory = msg.sender;
        creator = _creator;
        name = _name;
        description = _description;
        startTime = _startTime;
        endTime = _endTime;
        isMultipleChoice = _isMultipleChoice;
        maxChoices = _maxChoices;
        isCommitReveal = _isCommitReveal;

        // --- Armazenar opções ---
        _options = new string[](options.length);
        _tallies = new uint256[](options.length);

        // Copiar strings manualmente (evita problemas de memória com ABI encoder)
        for (uint256 i = 0; i < options.length; i++) {
            _options[i] = options[i];
        }
    }

    // MVP: voto aberto, um único índice
    function vote(uint256 optionIndex) external {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Out of voting window");
        require(!_hasVoted[msg.sender], "Already voted");
        require(optionIndex < _options.length, "Index out of range");

        _hasVoted[msg.sender] = true;
        _tallies[optionIndex] += 1;

        emit Voted(msg.sender, optionIndex);
    }

    // Leitura
    function getOptions() external view returns (string[] memory) {
        return _options;
    }

    // Força front a pedir resultados só depois do fim
    function getResults() external view returns (uint256[] memory) {
        require(hasEnded(), "Results available after end");
        return _tallies;
    }

    function hasVoted(address voter) external view returns (bool) {
        return _hasVoted[voter];
    }

    function isOpen() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    function hasEnded() public view returns (bool) {
        return block.timestamp > endTime;
    }
}
