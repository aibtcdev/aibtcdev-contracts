# aibtcdev DAO Documentation

This directory contains documentation for the aibtcdev DAO smart contracts.

## Core Components

- [Base DAO](base-dao.md) - The main DAO contract that manages extensions and proposal execution
- [Extensions](extensions/README.md) - Modular components that add functionality to the DAO
- [Proposals](proposals/README.md) - Contracts that can be executed by the DAO

## Architecture Overview

The aibtcdev DAO follows an "executor DAO" pattern where:

1. The base DAO contract manages a set of extensions and can execute proposals
2. Extensions provide specific functionality (payments, messaging, etc)
3. Proposals are contracts that can be executed by the DAO to make changes

This modular architecture allows:

- Adding new functionality through extensions
- Upgrading components independently
- Fine-grained access control
- Clear separation of concerns

## Error Codes

Each contract uses a distinct error code range to make debugging easier:

- Base DAO: 900-999
- Actions Extension: 1000-1999  
- Bank Account Extension: 2000-2999
- Direct Execute Extension: 3000-3999
- Messaging Extension: 4000-4999
- Payments Extension: 5000-5999
- Treasury Extension: 6000-6999

## Getting Started

See the individual component documentation for details on:

- Contract interfaces and functions
- Extension capabilities 
- Creating and executing proposals
- Managing DAO settings
