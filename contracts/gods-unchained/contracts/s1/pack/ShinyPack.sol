pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "./Pack.sol";

contract ShinyPack is Pack {

    constructor(
        S1Cap _cap,
        uint256 _maxMint,
        IRaffle _raffle,
        Beacon _beacon,
        ICards _cards,
        IReferral _referral,
        bytes32 _sku,
        uint256 _price,
        CreditCardEscrow _escrow,
        PurchaseProcessor _pay
    ) public Pack(
        _cap,
        _maxMint,
        _raffle,
        _beacon,
        _cards,
        _referral,
        _sku,
        _price,
        _escrow,
        _pay
    ) {}

    function _getCardDetails(
        uint _index,
        uint _random
    )
        internal
        view
        returns (uint16 proto, uint8 quality)
    {

        Components memory rc = _getComponents(_index, _random);
        Rarity rarity;

        if (_index % 5 == 0) {
            rarity = Rarity.Legendary;
            quality = _getShinyQuality(rc.quality);
        } else if (_index % 5 == 1) {
            rarity = _getRarePlusRarity(rc.rarity);
            quality = _getQuality(rc.quality);
        } else {
            rarity = _getCommonPlusRarity(rc.rarity);
            quality = _getQuality(rc.quality);
        }
        proto = _getRandomCard(rarity, rc.proto);
        return (proto, quality);
    }

    function _getTicketsInPack(uint _index, uint _random) internal pure returns (uint16) {
        uint seed = uint(keccak256(abi.encodePacked(_index, _random)));
        uint modded = seed % 1000;
        if (modded >= 975) {
            return 20000;
        } else if (modded >= 850) {
            return 8000;
        } else if (modded >= 600) {
            return 5000;
        }
        return 3000;
    }

}