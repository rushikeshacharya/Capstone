const ERC721MintableComplete = artifacts.require('CustomERC721Token');
const truffleAssert = require('truffle-assertions');


contract('TestERC721Mintable', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];
    const account_three = accounts[2];


    describe('match erc721 spec', function () {
        beforeEach(async function () { 
            this.contract = await ERC721MintableComplete.new({from: account_one});

            // TODO: mint multiple tokens
            await this.contract.mint(account_one, 1);
            await this.contract.mint(account_two, 2);
            await this.contract.mint(account_two, 3);

        })

        it('should return total supply', async function () { 
            const supply = await this.contract.totalSupply.call();
            assert.equal(supply.toNumber(), 3, "Incorrect supply")
        })

        it('should get token balance', async function () { 
            const bal1 = await this.contract.balanceOf.call(account_one);
            const bal2 = await this.contract.balanceOf.call(account_two);
            assert.equal(bal1, 1, "Incorrect balance");
            assert.equal(bal2, 2, "Incorrect balance");
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () { 
            const tokenUri = await this.contract.tokenURI.call(1);
            assert.equal(tokenUri, "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1", "Invalid Token uri")
        })

        it('should transfer token from one owner to another', async function () { 
            let tx = await this.contract.transferFrom(
                account_two, account_three, 2, { from: account_two })

            await truffleAssert.eventEmitted(tx, "Transfer", (ev) => {
                return (
                    ev.from == account_two &&
                    ev.to == account_three &&
                    ev.tokenId == 2
                );
            });
            const owner = await this.contract.ownerOf.call(2);
            assert.equal(owner, account_three, "Wrong owner of token after transfer");
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await ERC721MintableComplete.new({from: account_one});
        })

        it('should fail when minting when address is not contract owner', async function () { 
            await truffleAssert.reverts(
                this.contract.mint(account_two, 4, {from: account_two})
            );
        })

        it('should return contract owner', async function () { 
            let owner = await this.contract.getOwner.call();
            assert.equal(owner, account_one, "Wrong owner returned");
        })

    });
})