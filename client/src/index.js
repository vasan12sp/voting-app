import Web3 from 'web3';
import './style.css';

// The ABI (Application Binary Interface) defines how to interact with the contract
// You'll need to copy this from your build/contracts/Voting.json file
// This is just a placeholder - you need to replace it with your actual ABI
const VOTING_ABI = [{
  "inputs": [
    {
      "internalType": "string[]",
      "name": "candidateNames",
      "type": "string[]"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "constructor"
},
{
  "anonymous": false,
  "inputs": [
    {
      "indexed": true,
      "internalType": "uint256",
      "name": "candidateId",
      "type": "uint256"
    }
  ],
  "name": "votedEvent",
  "type": "event"
},
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "name": "candidates",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "id",
      "type": "uint256"
    },
    {
      "internalType": "string",
      "name": "name",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "voteCount",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [],
  "name": "candidatesCount",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  "name": "voters",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "view",
  "type": "function",
  "constant": true
},
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_candidateId",
      "type": "uint256"
    }
  ],
  "name": "vote",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}]; // You'll fill this in Step 6

// This is the contract address after deployment
// You'll get this from the console output after running 'truffle migrate'
const VOTING_ADDRESS = '0x22fd351A452Fc8BF407452E525cD6fa8ce3D30cf'; // You'll fill this in Step 6




class App {
  constructor() {
    this.web3 = null;
    this.accounts = [];
    this.votingContract = null;
    this.hasVoted = false;
    
    // Initialize the app
    this.init();
  }

  debounceRender() {
    clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(() => this.render(), 300);
  }
  
  async init() {
    try {
      // Setup Web3
      await this.initWeb3();
      
      // Setup the contract
      await this.initContract();
      
      // Setup the UI
      this.debounceRender();


      // Setup event listeners
      this.setupEventListeners();
      
      // Listen for contract events
      this.listenForEvents();
    } catch (error) {
      console.error("Could not initialize the app:", error);
      //this.showError("Failed to initialize the application. Make sure MetaMask is installed and connected to the correct network.");
    }
  }
  
  async initWeb3() {
    if (window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Ensure the first account is always used
            this.accounts = accounts;
            console.log("Connected Account:", this.accounts[0]); // Debugging output

            // Update the displayed account in UI
            document.getElementById("accountAddress").textContent = this.accounts[0];

        } catch (error) {
            throw new Error("User denied account access");
        }
    }
    else if (window.web3) {
        this.web3 = new Web3(window.web3.currentProvider);
        this.accounts = await this.web3.eth.getAccounts();
    }
    else {
        this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
        this.accounts = await this.web3.eth.getAccounts();
    }

    if (!this.accounts || this.accounts.length === 0) {
        throw new Error("No accounts found! Ensure MetaMask is unlocked and connected.");
    }
}

  
  async initContract() {
    // Create contract instance
    this.votingContract = new this.web3.eth.Contract(
      VOTING_ABI,
      VOTING_ADDRESS
    );
  }
  
  showError(message) {
    alert(message);
  }
  
  setupEventListeners() {
    const voteButton = document.getElementById('voteButton');
    voteButton.removeEventListener('click', this.voteHandler); // Remove previous listener

    this.voteHandler = async () => {
        const candidateId = document.getElementById('candidateSelect').value;
        await this.castVote(candidateId);
    };

    voteButton.addEventListener('click', this.voteHandler);
}

  
  listenForEvents() {
    // Watch for vote events
    this.votingContract.events.votedEvent({
      fromBlock: 'latest'
    })
    .on('data', (event) => {
      console.log("Vote cast event detected:", event);
      this.debounceRender();
 // Update UI when votes are cast
    })
    .on('error', console.error);
  }
  
  async castVote(candidateId) {
    try {
      // Show loading
      document.getElementById('content').style.display = 'none';
      document.getElementById('loader').style.display = 'block';
      
      // Vote for candidate
      await this.votingContract.methods.vote(candidateId).send({
        from: this.accounts[0]
      });
      
      // Update UI
      this.debounceRender();

    } catch (error) {
      console.error("Error casting vote:", error);
      this.showError(error.message);
      
      // Show content
      document.getElementById('content').style.display = 'block';
      document.getElementById('loader').style.display = 'none';
    }
  }
  
  async render() {
    try {
      // Show loader
      document.getElementById('loader').style.display = 'block';
      document.getElementById('content').style.display = 'none';
      
      // Display account address
      document.getElementById('accountAddress').textContent = this.accounts[0];
      
      // Get candidates count
      const candidatesCount = await this.votingContract.methods.candidatesCount().call();
      
      // Get and render candidates
      const candidatesResults = document.getElementById('candidatesResults');
      const candidateSelect = document.getElementById('candidateSelect');
      
      // Clear previous content
      candidatesResults.innerHTML = '';  // Clear the results table
      candidateSelect.innerHTML = '<option value="" disabled selected>Select a candidate</option>'; // Reset dropdown

      
      // Loop through candidates and display them
      for (let i = 1; i <= candidatesCount; i++) {
        const candidate = await this.votingContract.methods.candidates(i).call();
        
        // Render candidate for results table
        const candidateTemplate = `
          <tr>
            <td>${candidate.id}</td>
            <td>${candidate.name}</td>
            <td>${candidate.voteCount}</td>
            <td><button class="btn btn-primary btn-sm vote-btn" data-id="${candidate.id}">Vote</button></td>
          </tr>
        `;
        candidatesResults.innerHTML += candidateTemplate;
        
        // Render candidate for select dropdown
        const candidateOption = `<option value="${candidate.id}">${candidate.name}</option>`;
        candidateSelect.innerHTML += candidateOption;
      }
      
      // Check if the user has already voted
      this.hasVoted = await this.votingContract.methods.voters(this.accounts[0]).call();
      
      // Show/hide vote form based on voting status
      if (this.hasVoted) {
        document.getElementById('voteForm').style.display = 'none';
        document.getElementById('hasVoted').style.display = 'block';
      } else {
        document.getElementById('voteForm').style.display = 'block';
        document.getElementById('hasVoted').style.display = 'none';
      }
      
      // Add inline vote button handlers
      document.querySelectorAll('.vote-btn').forEach(button => {
        button.addEventListener('click', (event) => {
          const candidateId = event.target.getAttribute('data-id');
          this.castVote(candidateId);
        });
      });
      
      // Show content
      document.getElementById('loader').style.display = 'none';
      document.getElementById('content').style.display = 'block';
    } catch (error) {
      console.error("Error rendering application:", error);
      this.showError("Failed to load voting data. Please check your connection to the blockchain.");
    }
  }
}

// Initialize the app when the window loads
window.addEventListener('load', () => {
  new App();
});