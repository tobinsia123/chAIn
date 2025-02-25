// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AIModelLeasing {

    // Struct for models
    struct Model {
        uint256 id;
        address payable owner;
        string description;
        uint256 pricePerUse;
        bool available;
    }

    // Array to hold all models
    Model[] public models;

    // Mapping to store the leaser for each model
    mapping(uint256 => address) public modelLeasers;

    // Debugging events
    event DebugLog(string message);
    event ContractDeployed(address deployer);
    
    // Event logs
    event ModelRegistered(uint256 modelId, address owner, string description, uint256 pricePerUse);
    event ModelLeased(uint256 modelId, address leaser, uint256 pricePaid);
    event ModelReleased(uint256 modelId, address leaser);

    // Contract constructor
    constructor() {
        emit ContractDeployed(msg.sender);
    }

    // Function to register a new model
    function registerModel(string memory description, uint256 pricePerUse) public {
        require(msg.sender != address(0), "Invalid sender address");
        require(pricePerUse > 0, "Price must be greater than 0");

        uint256 modelId = models.length;
        models.push(Model(modelId, payable(msg.sender), description, pricePerUse, true));

        emit ModelRegistered(modelId, msg.sender, description, pricePerUse);
        emit DebugLog("Model registered successfully");
    }

    // Function to lease a model
    function leaseModel(uint256 modelId) public payable {
        require(models.length > 0, "No models registered yet");
        require(modelId < models.length, "Invalid model ID");
        Model storage model = models[modelId];

        require(model.available, "Model is not available");
        require(msg.value >= model.pricePerUse, "Insufficient payment");
        require(modelLeasers[modelId] == address(0), "Model already leased");

        // Safe transfer of funds
        (bool success, ) = model.owner.call{value: msg.value}("");
        require(success, "Transfer failed");

        // Update model availability
        model.available = false;
        modelLeasers[modelId] = msg.sender;

        emit ModelLeased(modelId, msg.sender, msg.value);
        emit DebugLog("Model leased successfully");
    }

    // Function to release a model (make it available again)
    function releaseModel(uint256 modelId) public {
        require(models.length > 0, "No models registered yet");
        require(modelId < models.length, "Invalid model ID");
        require(msg.sender == modelLeasers[modelId], "Only the current leaser can release the model");

        models[modelId].available = true;
        delete modelLeasers[modelId];

        emit ModelReleased(modelId, msg.sender);
        emit DebugLog("Model released successfully");
    }

    // Get the number of models
    function getModelCount() public view returns (uint256) {
        return models.length;
    }

    // Get model details by modelId
    function getModel(uint256 modelId) public view returns (
        uint256 id,
        address owner,
        string memory description,
        uint256 pricePerUse,
        bool available
    ) {
        require(models.length > 0, "No models registered yet");
        require(modelId < models.length, "Invalid model ID");

        Model memory model = models[modelId];
        return (model.id, model.owner, model.description, model.pricePerUse, model.available);
    }
}
