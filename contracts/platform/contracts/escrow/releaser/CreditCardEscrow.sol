pragma solidity 0.5.11;

import "../IReleasable.sol";
import "../IBatchERC721Escrow.sol";
import "../IListERC721Escrow.sol";

contract CreditCardEscrow {

    // Emitted when assets are escrowed
    event Escrowed(address indexed escrow, uint indexed id, uint64 endBlock);

    // Emitted when the release of the assets in a custodial escrow account is successfully requested
    event ReleaseRequested(address indexed escrow, uint indexed id, uint64 endBlock);

    // Emitted when the release of the assets in a custodial escrow account is cancelled
    event ReleaseCancelled(address indexed escrow, uint indexed id);

    // Emitted when the assets in any escrow account are released
    event Released(address indexed escrow, uint indexed id);

    // Emitted when the destruction of the assets in an escrow account is successfully requested
    event DestructionRequested(address indexed escrow, uint indexed id, uint64 endBlock);

    // Emitted when the destruction of the assets in an escrow account is cancelled
    event DestructionCancelled(address indexed escrow, uint indexed id);

    // Emitted when the assets in an escrow account are destroyed
    event Destroyed(address indexed escrow, uint indexed id);

    struct Lock {
        // the block after which these cards can be taked from escrow
        uint64 endBlock;
        // the address which will own these cards after the escrow period
        address owner;
        // the block after which these cards can be destroyed
        uint64 destructionBlock;
        // the block after which these cards will be released
        uint64 releaseBlock;
    }

    // Batch escrow contract
    IBatchERC721Escrow public batchEscrow;
    // Batch escrow contract
    IListERC721Escrow public listEscrow;
    // Mapping from escrow IDs to details
    mapping(address => mapping(uint => Lock)) public locks;
    // The address which can escrow assets
    address public escrower;
    // The address which can destroy assets
    address public destroyer;
    // Number of blocks an escrow account must be marked for destruction before it is destroyed
    uint64 public destructionDelay;
    // The address which can withdraw custodial assets
    address public custodian;
    // Number of blocks a custodial escrow asset must be marked for release
    uint64 public releaseDelay;

    constructor(
        IBatchERC721Escrow _batchEscrow,
        IListERC721Escrow _listEscrow,
        address _escrower,
        address _destroyer,
        uint64 _destructionDelay,
        address _custodian,
        uint64 _releaseDelay
    ) public {
        batchEscrow = _batchEscrow;
        listEscrow = _listEscrow;
        escrower = _escrower;
        destroyer = _destroyer;
        destructionDelay = _destructionDelay;
        custodian = _custodian;
        releaseDelay = _releaseDelay;
    }

    modifier onlyDestroyer {
        require(msg.sender == destroyer, "must be the destroyer");
        _;
    }

    modifier onlyEscrower {
        require(msg.sender == escrower, "must be the escrower");
        _;
    }

    modifier onlyCustodian {
        require(msg.sender == custodian, "must be the custodian");
        _;
    }

    /**
     * @dev Set the standard destruction delay for new escrow accounts
     *
     * @param _delay Number of blocks an escrow account must be marked for destruction before it is destroyed
     */
    function setDestructionDelay(uint64 _delay) public onlyOwner {
        destructionDelay = _delay;
    }

    /**
     * @dev Set the destroyer account
     *
     * @param _destroyer Address of the destroyer account
     */
    function setDestroyer(address _destroyer) public onlyOwner {
        require(_destroyer != destroyer, "must change existing destroyer");
        destroyer = _destroyer;
    }

    /**
     * @dev Set the standard release delay for custodial accounts
     *
     * @param _delay Number of blocks a custodial escrow account must be marked for release
     */
    function setReleaseDelay(uint64 _delay) public onlyOwner {
        releaseDelay = _delay;
    }

    /**
     * @dev Set the custodian account
     *
     * @param _custodian Address of the custodian account
     */
    function setCustodian(address _custodian) public onlyOwner {
        require(_custodian != custodian, "must change existing custodian");
        custodian = _custodian;
    }

    /**
     * @dev Release all assets from an escrow account
     *
     * @param _id The ID of the escrow account to be released
     */
    function release(IReleasable _escrow, uint _id) public {

        Lock memory lock = locks[address(_escrow)][_id];

        require(lock.endBlock != 0, "must have escrow period set");
        require(block.number >= lock.endBlock, "escrow period must have expired");

        _escrow.release(_id, lock.owner);

        delete locks[_id];

        emit Released(_id);
    }

    /**
     * @dev Request that a custodial escrow account's assets be marked for release
     *
     * @param _id The ID of the escrow account to be marked
     */
    function requestRelease(address _escrow, uint _id) public onlyCustodian {

        Lock storage lock = locks[_escrow][_id];

        require(lock.endBlock != 0, "must be in escrow");
        require(lock.destructionBlock == 0, "must not be marked for destruction");
        require(block.number + releaseDelay >= lock.endBlock, "release period must end after escrow period");

        uint64 releaseBlock = uint64(block.number) + releaseDelay;

        lock.releaseBlock = releaseBlock;

        emit ReleaseRequested(_id, releaseBlock);
    }

    /**
     * @dev Cancel a release request
     *
     * @param _id The ID of the escrow account to be unmarked
     */
    function cancelRelease(address _escrow, uint _id) public onlyCustodian {

        Lock storage lock = locks[_escrow][_id];

        require(lock.releaseBlock != 0, "must be marked for release");
        require(lock.releaseBlock > block.number, "release period must not have expired");

        lock.releaseBlock = 0;

        emit ReleaseCancelled(_escrow, _id);
    }

    /**
     * @dev Request that an escrow account's assets be marked for destruction
     *
     * @param _id The ID of the escrow account to be marked
     */
    function requestDestruction(address _escrow, uint _id) public onlyDestroyer {

        Lock storage lock = locks[_escrow][_id];

        require(lock.endBlock != 0, "must be in escrow");
        require(lock.destructionBlock == 0, "must not be marked for destruction");
        require(block.number > lock.endBlock, "escrow period must not have expired");

        uint64 destructionBlock = uint64(block.number) + destructionDelay;
        lock.destructionBlock = destructionBlock;

        emit DestructionRequested(_escrow, _id, destructionBlock);
    }

    /**
     * @dev Revoke a destruction request
     *
     * @param _id The ID of the escrow account to be unmarked
     */
    function cancelDestruction(address _escrow, uint _id) public onlyDestroyer {

        Lock storage lock = locks[_escrow][_id];

        require(lock.destructionBlock != 0, "must be marked for destruction");
        require(lock.destructionBlock > block.number, "destruction period must not have expired");

        // reset the destruction block
        lock.destructionBlock = 0;

        emit DestructionCancelled(_escrow, _id);
    }

    /**
     * @dev Destroy all assets in an escrow account
     *
     * @param _id The ID of the escrow account to be destroyed
     */
    function destroy(address _escrow, uint _id) public {

        Lock memory lock = locks[_escrow][_id];

        require(lock.destructionBlock != 0, "must be marked for destruction");
        require(block.number >= lock.destructionBlock, "destruction period must have expired");

        // burn the assets by releasing to the 0 address
        IReleasable(_escrow).release(_id, address(0));

        delete locks[_escrow][_id];

        emit Destroyed(_escrow, _id);
    }

    function escrowERC20(ERC20Escrow.Vault memory vault) external onlyEscrower returns (uint) {

        require(_duration > 0, "must be locked for a number of blocks");
        require(_owner != address(0), "cannot release to the zero address");
        require(vault.releaser == address(this), "must be releasable by this");

        // escrow the assets with this contract as the releaser
        uint id = escrow.escrow(vault);

        _lock(escrow, id, _duration, _owner);

        return id;
    }

    /**
     * @dev Escrow a consecutive range of assets
     *
     * @param _asset NFT contract address of the assets to be escrowed
     * @param _low The first token ID in the range to be escrowed (inclusive)
     * @param _high The last token ID in the range to be escrowed (inclusive)
     * @param _owner Address which will own these assets during escrow
     * @param _duration Number of blocks for which to hold this asset in escrow
     */
    function escrowBatch(BatchERC721Escrow.Vault memory vault, address cbTo, bytes memory cbData) external onlyEscrower returns (uint) {

        require(_duration > 0, "must be locked for a number of blocks");
        require(_owner != address(0), "cannot release to the zero address");
        require(vault.releaser == address(this), "must be releasable by this");

        // escrow the assets with this contract as the releaser
        uint id = batchEscrow.escrowRange(vault, cbTo, cbData;

        _lock(batchEscrow, id, _duration, _owner);

        return id;
    }

    /**
     * @dev Escrow a list of assets
     *
     * @param vault NFT contract address of the assets to be escrowed
     * @param _low The first token ID in the range to be escrowed (inclusive)
     * @param _high The last token ID in the range to be escrowed (inclusive)
     * @param _owner Address which will own these assets during escrow
     * @param _duration Number of blocks for which to hold this asset in escrow
     */
    function escrowList(ListERC721Escrow.Vault memory vault, address cbTo, bytes memory cbData) external onlyEscrower returns (uint) {

        require(_duration > 0, "must be locked for a number of blocks");
        require(_owner != address(0), "cannot release to the zero address");
        require(vault.releaser == address(this), "must be releasable by this");

        // escrow the assets with this contract as the releaser
        uint id = listEscrow.escrow(vault, cbTo, cbData);

        _lock(address(listEscrow), id, _duration, _owner);

        return id;
    }

    function _lock(address _escrow, uint _id, uint64 _duration, address _owner) internal {

        require(_duration > 0, "must be locked for a number of blocks");
        require(_owner != address(0), "owner cannot be the zero address");

        locks[_escrow][_id] = Lock({
            owner: _owner,
            endBlock: uint64(block.number + _duration),
            destructionBlock: 0,
            releaseBlock: 0
        });

        emit Escrowed(_escrow, _id, _duration);
    }
}