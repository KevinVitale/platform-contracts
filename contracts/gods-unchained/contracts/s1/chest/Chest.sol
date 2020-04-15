pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@imtbl/platform/contracts/token/TradeToggleERC20.sol";
import "@imtbl/platform/contracts/escrow/IEscrow.sol";
import "@imtbl/platform/contracts/pay/vendor/CappedVendor.sol";
import "../S1Vendor.sol";
import "../pack/IPack.sol";

contract Chest is S1Vendor, TradeToggleERC20, ERC20Burnable {

    struct Purchase {
        address user;
        uint256 count;
    }

    // Pack contract in which these chests can be opened
    IPack public pack;
    // Temporary variable to hold purchase details before the escrow callback
    uint256 internal temporaryCount;

    constructor(
        string memory _name,
        string memory _symbol,
        IPack _pack,
        uint256 _saleCap,
        IReferral _referral,
        bytes32 _sku,
        uint256 _price,
        ICreditCardEscrow _escrow,
        IPay _pay
    ) public
        S1Vendor(_referral, _sku, _price, _escrow, _pay)
        TradeToggleERC20(_name, _symbol, 0)
    {
        require(address(_pack) != address(0), "GU:S1:Chest: pack must be set on construction");
        pack = _pack;
    }

    /** @dev Purchase chests for a user
     *
     * @param _user the user who will receive the chests
     * @param _quantity the number of chests to purchase
     * @param _payment the details of the method by which payment will be made
     * @param _referrer the address of the user who made this referral
     */
    function purchaseFor(
        address payable _user,
        uint256 _quantity,
        IPay.Payment memory _payment,
        address payable _referrer
    ) public payable returns (uint256) {

        uint256 paymentID = super.purchaseFor(_user, _quantity, _payment, _referrer);

        if (_payment.currency == IPay.Currency.ETH || _payment.escrowFor == 0) {
            _mint(_user, _quantity);
        } else {
            // escrow the chests
            IEscrow.Vault memory vault = IEscrow.Vault({
                player: _user,
                releaser: address(escrow),
                asset: address(this),
                balance: _quantity,
                lowTokenID: 0,
                highTokenID: 0,
                tokenIDs: new uint256[](0)
            });

            temporaryCount = _quantity;

            bytes memory data = abi.encodeWithSignature("mintTokens()");

            escrow.callbackEscrow(vault, address(this), data, paymentID, _payment.escrowFor);

        }

        return paymentID;
    }

    function mintTokens() public {
        address protocol = address(escrow.getProtocol());
        require(msg.sender == protocol, "GU:S1:Chest: minter must be core escrow contract");
        require(temporaryCount > 0, "GU:S1:Chest: must create some tokens");
        _mint(protocol, temporaryCount);
        temporaryCount = 0;
    }

    /** @dev Open a number of chests
     *
     * @param _count the number of chests to open
     */
    function open(uint _count) public {
        _burn(msg.sender, _count);
        pack.openChests(msg.sender, _count);
    }

    /** @dev One way switch to enable trading */
    function makeTradable() external onlyOwner {
        require(!tradable, "GU:S1:Chest: must not be already tradable");
        tradable = true;
        emit TradabilityChanged(true);
    }

}