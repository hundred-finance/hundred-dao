#!/usr/bin/env sh

npx hardhat run ./scripts/deployment/calculate_backstop_masterchef_topups.ts --network arbitrum --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network arbitrum --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network fantom --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network gnosis --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network harmony --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network moonriver --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network optimism --no-compile
npx hardhat run ./scripts/deployment/calculate_treasury_topup.ts --network polygon --no-compile
