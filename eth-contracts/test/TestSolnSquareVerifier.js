const SquareVerifier = artifacts.require('SquareVerifier');
const SolnSquareVerifier = artifacts.require('SolnSquareVerifier');
const truffleAssert = require('truffle-assertions');
const validProof = require('../../zokrates/code/valid.json')
const invalidProof = require('../../zokrates/code/invalid.json')


contract('Test SolnSquareVerifier', accounts => {

  const owner = accounts[0];
  const tokenOwner = accounts[1];
  const tokenOwner2 = accounts[2];

  describe('test token minting by providing solution', () => {
    before(async () => {
      const squareContract = await SquareVerifier.new({ from: owner });
      this.contract = await SolnSquareVerifier.new(
        squareContract.address, { from: owner }
      );
    });

    // Test if a new solution can be added for contract - SolnSquareVerifier
    // Test if an ERC721 token can be minted for contract - SolnSquareVerifier
    // using proof.json from 25**2 == 625 (correct)
    it('should mint token for correct proof', async () => {
      let tokenId = 101;
      let tx = await this.contract.mintToken(
        tokenOwner,
        tokenId,
        ...Object.values(validProof.proof), 
        validProof.inputs,
        { from: owner }
      );
      await truffleAssert.eventEmitted(tx, "AddedSolution", (ev) => {
        return (ev.to == tokenOwner && ev.tokenId == tokenId);
      });
      let _owner = await this.contract.ownerOf.call(tokenId);
      assert.equal(_owner, tokenOwner, "Wrong owner of token after mint");
      let bal = await this.contract.balanceOf.call(tokenOwner);
      assert.equal(bal, 1, "Incorrect balance for tokenOwner after mint");
    });

    it('should not allow solution reuse', async () => {
      let tokenId = 201;

      // can't reuse same solution
      await truffleAssert.reverts(
        this.contract.mintToken(
          tokenOwner,
          tokenId,
          ...Object.values(validProof.proof), 
          validProof.inputs,
          { from: owner }
        )
      );
    });

    // using false-proof.json from 25**2 == 400 (incorrect)
    // but with input as true (0x000...01) instead of false (0x000...00)
    it('should not mint token for incorrect proof', async () => {
      let tokenId = 999;
      const inputs = ["0x0000000000000000000000000000000000000000000000000000000000000190", 
      "0x0000000000000000000000000000000000000000000000000000000000000001"]
      await truffleAssert.reverts(
        this.contract.mintToken(
          tokenOwner2,
          tokenId,
          ...Object.values(invalidProof.proof), 
          inputs,
          { from: owner }
        )
      );
      let _owner = await this.contract.ownerOf.call(tokenOwner2);
      assert.equal(
        _owner, "0x0000000000000000000000000000000000000000",
        "Should not assign owner if incorrect proof given"
      );
      let bal = await this.contract.balanceOf.call(tokenOwner2);
      assert.equal(bal, 0, "Incorrect balance for tokenOwner2 after invalid mint");
    });
  });
});