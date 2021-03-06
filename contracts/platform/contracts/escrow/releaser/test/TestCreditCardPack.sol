pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "../CreditCardEscrow.sol";
import "../../test/TestERC20Token.sol";
import "../../test/TestERC721Token.sol";

contract TestCreditCardPack {

    CreditCardEscrow escrow;
    TestERC20Token erc20;
    TestERC721Token erc721;

    struct Purchase {
        uint256 count;
    }

    Purchase[] public purchases;

    constructor(CreditCardEscrow _escrow, TestERC20Token _erc20, TestERC721Token _erc721) public {
        escrow = _escrow;
        erc20 = _erc20;
        erc721 = _erc721;
    }

    function purchaseERC20(address user, uint256 count, uint64 duration) public {

        Escrow.Vault memory vault = Escrow.Vault({
            player: user,
            admin: address(escrow),
            asset: address(erc20),
            balance: count,
            lowTokenID: 0,
            highTokenID: 0,
            tokenIDs: new uint256[](0)
        });

        uint256 id = purchases.push(Purchase({
            count: count
        })) - 1;

        bytes memory data = abi.encodeWithSignature("erc20Hook(uint256)", id);

        escrow.escrow(vault, data, id, duration);
    }

    function purchaseERC721(address user, uint256 count, uint64 duration) public {

        // predict what the token IDs will be
        uint256 low = erc721.totalSupply();
        uint256 high = low + count;

        Escrow.Vault memory vault = Escrow.Vault({
            player: user,
            admin: address(escrow),
            asset: address(erc721),
            balance: 0,
            lowTokenID: low,
            highTokenID: high,
            tokenIDs: new uint256[](0)
        });

        uint256 id = purchases.push(Purchase({
            count: count
        })) - 1;

        bytes memory data = abi.encodeWithSignature("erc721Hook(uint256)", id);

        escrow.escrow(vault, data, id, duration);
    }

    function erc721Hook(uint256 purchaseID) public {
        require(msg.sender == address(escrow), "must be the escrow contract");
        Purchase memory p = purchases[purchaseID];
        erc721.mint(escrow.getProtocol(), p.count);
        delete purchases[purchaseID];
    }

    function erc20Hook(uint256 purchaseID) public {
        require(msg.sender == address(escrow), "must be the escrow contract");
        uint256 count = purchases[purchaseID].count;
        delete purchases[purchaseID];
        erc20.mint(escrow.getProtocol(), count);
    }

}