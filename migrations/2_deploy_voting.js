const Voting = artifacts.require("Voting");

module.exports = function(deployer) {
  // Array of candidate names to initialize the contract with
  const candidateNames = ["Candidate 1", "Candidate 2", "Candidate 3"];
  
  deployer.deploy(Voting, candidateNames);
};