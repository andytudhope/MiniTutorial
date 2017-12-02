pragma solidity ^0.4.11;

import "./MiniMeToken.sol";

contract FranklinToken is MiniMeToken {  

    function FranklinToken(address _tokenFactory) MiniMeToken(   
      _tokenFactory,
      0x0,                    // no parent token
      0,                      // no snapshot block number from parent
      "Franklin",             // Token name
      0,                      // Decimals
      "FRN",                  // Symbol
      true                    // Enable transfers
      ) 
      {
      }
}