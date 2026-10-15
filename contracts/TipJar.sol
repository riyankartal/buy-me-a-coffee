// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TipJar {
    using SafeERC20 for IERC20;

    struct Tip {
        address tipper;
        uint256 amount;
        string tipperName;
        string message;
        uint256 timestamp;
    }

    IERC20 public usdc;
    address public recipientA;
    address public recipientB;
    uint256 public bpsA;
    uint256 public goalAmount;
    uint256 public totalReceived;
    mapping(address => uint256) public pendingBalance;
    Tip[] public recentTips;
    uint256 public tipCount;
    address public owner;

    event Tipped(
        address indexed tipper,
        uint256 amount,
        uint256 tipCount,
        string tipperName,
        string message
    );
    event Withdrawn(address indexed recipient, uint256 amount);
    event GoalUpdated(uint256 newGoal);
    event RecipientsUpdated(address recipientA, address recipientB, uint256 bpsA);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "TipJar: not owner");
        _;
    }

    modifier onlyRecipientA() {
        require(msg.sender == recipientA, "TipJar: not recipientA");
        _;
    }

    modifier onlyRecipientB() {
        require(msg.sender == recipientB, "TipJar: not recipientB");
        _;
    }

    constructor(
        address usdc_,
        address recipientA_,
        address recipientB_,
        uint256 bpsA_,
        uint256 goalAmount_,
        address owner_
    ) {
        require(usdc_ != address(0), "TipJar: usdc zero");
        require(recipientA_ != address(0), "TipJar: recipientA zero");
        require(recipientB_ != address(0), "TipJar: recipientB zero");
        require(owner_ != address(0), "TipJar: owner zero");
        require(bpsA_ <= 10_000, "TipJar: bpsA too high");

        usdc = IERC20(usdc_);
        recipientA = recipientA_;
        recipientB = recipientB_;
        bpsA = bpsA_;
        goalAmount = goalAmount_;
        owner = owner_;
        // pre-allocate 12 slots so ring-buffer writes are always updates, never pushes
        for (uint256 i = 0; i < 12; i++) {
            recentTips.push(Tip({tipper: address(0), amount: 0, tipperName: "", message: "", timestamp: 0}));
        }
    }

    function tip(uint256 amount, string calldata tipperName, string calldata message) external {
        require(amount > 0, "TipJar: amount zero");
        require(bytes(tipperName).length <= 64, "TipJar: name too long");
        require(bytes(message).length <= 256, "TipJar: message too long");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        uint256 amountA = (amount * bpsA) / 10_000;
        uint256 amountB = amount - amountA;

        pendingBalance[recipientA] += amountA;
        pendingBalance[recipientB] += amountB;
        totalReceived += amount;

        uint256 newTipCount = tipCount + 1;
        uint256 slot = tipCount % 12;
        recentTips[slot] = Tip({
            tipper: msg.sender,
            amount: amount,
            tipperName: tipperName,
            message: message,
            timestamp: block.timestamp
        });
        tipCount = newTipCount;

        emit Tipped(msg.sender, amount, newTipCount, tipperName, message);
    }

    function withdrawA() external onlyRecipientA {
        uint256 amount = pendingBalance[recipientA];
        require(amount > 0, "TipJar: nothing to withdraw");

        pendingBalance[recipientA] = 0;
        usdc.safeTransfer(recipientA, amount);

        emit Withdrawn(recipientA, amount);
    }

    function withdrawB() external onlyRecipientB {
        uint256 amount = pendingBalance[recipientB];
        require(amount > 0, "TipJar: nothing to withdraw");

        pendingBalance[recipientB] = 0;
        usdc.safeTransfer(recipientB, amount);

        emit Withdrawn(recipientB, amount);
    }

    function setGoal(uint256 newGoal) external onlyOwner {
        goalAmount = newGoal;
        emit GoalUpdated(newGoal);
    }

    function setRecipients(address newA, address newB, uint256 newBpsA) external onlyOwner {
        require(newA != address(0), "TipJar: recipientA zero");
        require(newB != address(0), "TipJar: recipientB zero");
        require(newBpsA <= 10_000, "TipJar: bpsA too high");
        require(pendingBalance[recipientA] == 0, "TipJar: recipientA has pending balance");
        require(pendingBalance[recipientB] == 0, "TipJar: recipientB has pending balance");

        recipientA = newA;
        recipientB = newB;
        bpsA = newBpsA;

        emit RecipientsUpdated(newA, newB, newBpsA);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TipJar: owner zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Returns the 12 ring-buffer slots as parallel arrays.
    /// Slots with timestamp == 0 are empty (not yet filled).
    function getRecentTips()
        external
        view
        returns (
            address[] memory tippers,
            uint256[] memory amounts,
            string[] memory names,
            string[] memory messages,
            uint256[] memory timestamps
        )
    {
        uint256 len = recentTips.length;
        tippers = new address[](len);
        amounts = new uint256[](len);
        names = new string[](len);
        messages = new string[](len);
        timestamps = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            Tip storage t = recentTips[i];
            tippers[i] = t.tipper;
            amounts[i] = t.amount;
            names[i] = t.tipperName;
            messages[i] = t.message;
            timestamps[i] = t.timestamp;
        }
    }
}
