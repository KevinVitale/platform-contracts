pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "../Escrow.sol";
import "./TestERC20Token.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestChest {

    Escrow escrow;
    TestERC20Token asset;
    uint count;

    constructor(Escrow _escrow, TestERC20Token _asset) public {
        escrow = _escrow;
        asset = _asset;
    }

    function purchase(uint256 _count) external {

        count = _count;
        Escrow.Vault memory vault = Escrow.Vault({
            player: msg.sender,
            admin: msg.sender,
            asset: address(asset),
            balance: _count,
            lowTokenID: 0,
            highTokenID: 0,
            tokenIDs: new uint256[](0)
        });
        escrow.escrow(vault);
    }

    function onEscrowCallback() external returns (bytes4) {
        require(msg.sender == address(escrow), "must be the escrow contract");
        asset.mint(address(escrow), count);
        return bytes4(keccak256("Immutable Escrow Callback"));
    }

}