const AIModelLeasing = artifacts.require("AIModelLeasing");

module.exports = function (deployer) {
  deployer.deploy(AIModelLeasing, { gas: 2000000 });  // Increase gas limit
};
