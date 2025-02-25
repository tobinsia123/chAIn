import React, { useState, useEffect } from "react";
import Web3 from "web3";
import AIModelLeasing from "./AIModelLeasing.json";
import config from "./config"; // Import contract address
import axios from "axios";  // Import Axios for API requests

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [models, setModels] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [gpt2Output, setGpt2Output] = useState("");

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.enable();
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);

          const contractAddress = config.contractAddress;
          if (!contractAddress) {
            alert("Contract address not found! Please deploy the contract and update config.js.");
            return;
          }

          const instance = new web3.eth.Contract(AIModelLeasing.abi, contractAddress);
          setContract(instance);
          await fetchModels(instance);
        } else {
          alert("MetaMask is not installed!");
        }
      } catch (error) {
        alert("Failed to load web3, accounts, or contract. Check console for details.");
        console.error(error);
      }
    };

    initWeb3();
  }, []);

  const fetchModels = async (instance) => {
    const modelCount = await instance.methods.getModelCount().call();
    const loadedModels = [];
    for (let i = 0; i < modelCount; i++) {
      const model = await instance.methods.getModel(i).call();
      loadedModels.push(model);
    }
    setModels(loadedModels);
  };

  const leaseModel = async (modelId, price) => {
    if (!contract || !account) {
      alert("Contract or account not loaded.");
      return;
    }

    try {
      await contract.methods.leaseModel(modelId).send({ from: account, value: price });
      alert("Model leased successfully!");
    } catch (error) {
      alert("Error leasing model: " + error.message);
    }
  };

  const getGpt2Response = async () => {
    const apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;

    if (!apiKey) {
      alert("API Key is missing! Please check your .env file.");
      console.error("Error: Missing Hugging Face API Key.");
      return;
    }

    try {
      console.log("Sending request to Hugging Face API...");

      // Using a better AI model for responses
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill", // Better than GPT-2 for coherent responses
        { inputs: userInput.trim() }, // Ensure clean input
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      console.log("API Response:", response.data);

      // Validate API response format
      if (!response.data || !response.data[0]?.generated_text) {
        alert("Invalid response from AI model.");
        console.error("Invalid response format:", response);
        return;
      }

      // Extract only generated text, remove unnecessary metadata
      const generatedText = response.data[0].generated_text.replace(/\s+/g, ' ').trim();

      setGpt2Output(generatedText);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      alert("Failed to get AI response. Please check the console for details.");
    }
  };

  return (
    <div>
      <h1>AI Model Leasing</h1>
      <p>Connected Account: {account || "Not Connected"}</p>
      <h2>Available Models</h2>
      {models.length === 0 ? (
        <p>No models available.</p>
      ) : (
        models.map((model, index) => (
          <div key={index} style={{ border: "1px solid black", padding: "10px" }}>
            <p><strong>Description:</strong> {model.description}</p>
            <p><strong>Price:</strong> {Web3.utils.fromWei(model.pricePerUse, "ether")} ETH</p>
            <p><strong>Available:</strong> {model.available ? "Yes" : "No"}</p>
            {model.available && (
              <button onClick={() => leaseModel(index, model.pricePerUse)}>
                Lease Model
              </button>
            )}
          </div>
        ))
      )}

      <h2>Interact with AI Model</h2>
      <textarea 
        value={userInput} 
        onChange={(e) => setUserInput(e.target.value)} 
        placeholder="Enter text to generate response" 
        rows="5" 
        cols="50"
      />
      <br />
      <button onClick={getGpt2Response}>Generate Response</button>

      {gpt2Output && (
        <div>
          <h3>AI Model Output:</h3>
          <p>{gpt2Output}</p>
        </div>
      )}
    </div>
  );
}

export default App;
