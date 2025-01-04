# AIBTC DAO Protocol Overview

## Core Components

### Base DAO (aibtcdev-base-dao)
The foundational smart contract that implements the core DAO functionality. It manages extensions, executes proposals, and maintains the overall security of the protocol through permission checks and state management.

### Bootstrap Proposal (aibtc-prop001-bootstrap)
The initial proposal that configures the DAO by enabling the core set of extensions and establishing the DAO's manifest. This proposal runs once during DAO construction to set up the initial state.

## Extensions

1. **aibtc-ext001-actions**
   - Manages voting on predefined actions using a SIP-010 token with a lower threshold than direct-execute.

2. **aibtc-ext002-bank-account**
   - Allows a principal to withdraw STX from the contract on a periodic basis with configurable amounts.

3. **aibtc-ext003-direct-execute**
   - Enables high-threshold voting on proposals to execute Clarity code directly in the context of the DAO.

4. **aibtc-ext004-messaging**
   - Provides functionality to send on-chain messages that can be monitored by anyone listening to the contract.

5. **aibtc-ext005-payments**
   - Implements payment processing for aibtcdev services with resource management and invoice tracking.

6. **aibtc-ext006-treasury**
   - Manages the DAO's assets including STX, SIP-009 NFTs, and SIP-010 FTs with deposit and withdrawal functionality.

## Protocol Architecture

The AIBTC DAO protocol is designed as a modular system where the Base DAO acts as the central hub, coordinating all interactions between extensions and proposals. This architecture provides several key benefits:

1. **Security**: All extensions must be explicitly enabled by the DAO, and only approved extensions can execute privileged operations.

2. **Modularity**: New functionality can be added by deploying new extensions without modifying the core DAO contract.

3. **Flexibility**: Different extensions can implement various voting mechanisms and thresholds appropriate to their specific use cases.

The bootstrap proposal initializes this ecosystem by enabling the core set of extensions, each serving a specific purpose in the DAO's operation. Extensions can interact with each other through the Base DAO's extension callback mechanism, allowing for complex multi-step operations while maintaining security boundaries.

Each extension has its own error code range (1000-6000) to ensure clear error handling and debugging across the protocol. This systematic approach to error management helps in maintaining and troubleshooting the protocol.
