# hundred-dao

Vyper contracts used in the [Hundred](https://hundred.finance) Governance DAO (forked and adapted from [Curve Dao contracts](https://github.com/curvefi/curve-dao-contracts)).

## Overview

Hundred DAO consists of multiple smart contracts enabling HND token distribution to ecosystem participants. voting power is weighted using locked HND
`veHND` the same way as `veCRV`is.

View the [documentation](https://curve.readthedocs.io/dao-overview.html) for a more in-depth explanation of how Curve DAO works.

## Testing and Development

### Dependencies

- [python3](https://www.python.org/downloads/release/python-368/) version 3.6 or greater, python3-dev
- [vyper](https://github.com/vyperlang/vyper) version [0.2.13](https://github.com/vyperlang/vyper/releases/tag/v0.2.13)
- [brownie](https://github.com/iamdefinitelyahuman/brownie) - tested with version [1.17.2](https://github.com/eth-brownie/brownie/releases/tag/v1.17.2)
- [brownie-token-tester](https://github.com/iamdefinitelyahuman/brownie-token-tester) - tested with version [0.2.2](https://github.com/iamdefinitelyahuman/brownie-token-tester/releases/tag/v0.2.2)
- [ganache-cli](https://github.com/trufflesuite/ganache-cli) - tested with version [6.12.1](https://github.com/trufflesuite/ganache-cli/releases/tag/v6.12.1)

### Setup

To get started, first create and initialize a Python [virtual environment](https://docs.python.org/3/library/venv.html). Next, clone the repo and install the developer dependencies:

```bash
git clone https://github.com/hundred-finance/hundred-dao.git
cd hundred-dao
pip install -r requirements.txt
brownie pm install OpenZeppelin/openzeppelin-contracts@4.4.2
brownie pm install OpenZeppelin/openzeppelin-contracts@4.2.0
```

### Running the Tests

The test suite is split between [unit](tests/unitary) and [integration](tests/integration) tests. To run the entire suite:

```bash
brownie test
```

To run only the unit tests or integration tests:

```bash
brownie test tests/unitary
brownie test tests/integration
```

Some tests are written in javascript using `hardhat` and can be run as the following:
```bash
npm run test
```

## License

This project is licensed under the [MIT](LICENSE) license.
