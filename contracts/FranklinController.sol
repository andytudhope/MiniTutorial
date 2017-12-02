pragma solidity ^0.4.11;

import "./FranklinToken.sol";

contract Owned {
    modifier onlyOwner {require (msg.sender == owner); _;}
    
    address public owner;

    /// @notice The Constructor assigns the message sender to be `owner`
    function Owned() { owner = msg.sender;}

    /// @notice `owner` can step down and assign some other address to this role
    /// @param _newOwner The address of the new owner. 0x0 can be used to create
    ///  an unowned neutral vault, however that cannot be undone
    function changeOwner(address _newOwner) onlyOwner {
        owner = _newOwner;
    }
}

contract FranklinController is TokenController, Owned {
    
    FranklinToken public tokenContract; 

    /// Complete example here: https://github.com/Giveth/minime/blob/master/contracts/SampleCampaign-TokenController.sol
    /// I don't need most of the stuff there, but I do need someone to check me on this. 
    /// @param _tokenAddress Address of the token contract that this contract controls.

    function FranklinController (address _tokenAddress) {
        tokenContract = FranklinToken(_tokenAddress);
    }

    /// @notice Notifies the controller about a transfer. For the FranklinToken all
    ///  transfers are allowed by default and no extra notifications are needed
    /// @param _from The origin of the transfer
    /// @param _to The destination of the transfer
    /// @param _amount The amount of the transfer
    /// @return False if the controller does not authorize the transfer
    function onTransfer(address _from, address _to, uint _amount) returns(bool) {
        return true;
    }

    /// @notice Notifies the controller about an approval. For this MeetupToken all
    ///  approvals are allowed by default and no extra notifications are needed
    /// @param _owner The address that calls `approve()`
    /// @param _spender The spender in the `approve()` call
    /// @param _amount The amount in the `approve()` call
    /// @return False if the controller does not authorize the approval
    function onApprove(address _owner, address _spender, uint _amount) returns (bool) {
        return true;
    }

    /// @notice Generates tokens when called by the Owner of this contract. 
    /// @param _amount Amount of tokens to be made with this call. The thinking being that it might be 
    /// cheaper to create them in batches and distribute them from the _owner address.
    function generateTokens(uint _amount) onlyOwner returns (bool) {
        // Extra check.
        require(tokenContract.controller() != 0); 

        require(tokenContract.generateTokens(msg.sender, _amount));

        TokensMinted(_amount);

        return true;
    }

    event TokensMinted(uint _amount);
}