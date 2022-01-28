# Solidity NFT Bridge Realization

This contract provides platform for swapping ERC721 token between different bridges.

How it works: User uses `swap` function on Bridge contract to swap tokens from main chain. The contract transfers the users token to bridge address. However bridge does NOT burns the token but stores it. After token received bridge emits `SwapInitialized` event for backend to listen. On backend when `SwapInitialized` is received , validator signs new hash for second chain to redeem token. Then validator redeems the token from second chain (in other words second chain mints new token with exact same details of sent token from first chain). 

Note: Validator can burn the token on first chain if it's wanted (not implemented by default). But validator needs the burner role for it's to burn token from first chain.

## Development

The contract is written with solidity.

Hardhat development environment being used to write this contract.

The test coverage is %100 (result from solidity-coverage).

For linting solhint and prettier is being used.

Contract could be deployed to rinkeby testnet using infura api key and wallet private key.
Environment file has to be created to use test network and contract validation. (.env.example file contains example template)

Scripts folder contains the script for contract deployment.

For the easier contract interaction, hardhat tasks are created.
To see the list of tasks, write `npx hardhat` to the terminal.