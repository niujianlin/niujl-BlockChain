// 引入sha256
const sha256 = require('crypto-js/sha256')
// 区块
class Block {
    constructor(data, previousHash){
        this.data = data;
        this.previousHash = previousHash
        this.nonce = 1  //随机数
        this.hash = this.computeHash()
    }
    computeHash(){
        return sha256(this.data+this.previousHash+this.nonce).toString()
    }

    // 开头前几位为0的字符串，挖出比较hash用
    getAnswer(difficulty){
        //开头前n位为0的hash
        let answer = ''
        for(let i=0; i<difficulty; i++){
            answer+='0'
        }
        return answer
    }

    // 计算符合区块链难度要求的hash，hash前几位的控制
    mine(difficulty){
        this.hash = this.computeHash()
                    //  console.log("篡改了的hash:"+this.hash)
        while(true){
            if(this.hash.substring(0,difficulty) === this.getAnswer(difficulty)){
                break;
            }else{
                this.nonce++
                this.hash = this.computeHash() //nonce加一后更新块的hash值
            }
        }
        console.log("挖块结束，hash是："+ this.hash)
    }

}

// 链
class Chain {
    constructor() {
        // 空数组，里面放区块
        this.chain = [this.bigBang()]
        // 设置挖出区块的hash值条件，控制挖出时间
        this.difficulty = 5

    }

    //生成祖先区块
    bigBang(){
        const genesisBlock = new Block('我是祖先','')
        return genesisBlock
    }

    // 找链尾区块的函数
    getLatestBlock(){
        return this.chain[this.chain.length - 1]
    }

    // 添加区块到区块链，首先需要找到链尾
    addBlockToChain(newBlock){
        //data
        newBlock.previousHash = this.getLatestBlock().hash
        // newBlock.hash = newBlock.computeHash()
        newBlock.mine(this.difficulty)
        // hash需要满足特定要求，来保证特定时间内出一个块
        this.chain.push(newBlock)
    }

    // 验证新建的区块是否合法(是否被篡改，该区块的prehash是否等于上一区块的hash)，实际上还应该加入hash前几位的验证
    validateChain(){
        // 只有祖先区块
        if(this.chain.length === 1){
            if (this.chain[0].hash !== this.chain[0].computeHash()){
                return false
            }else{
                return true
            }
        }else {
            // this.chain[1]是第二个区块
            for(let i=1; i<=this.chain.length-1; i++){
                const blockToValidate = this.chain[i]
                // 当前区块data是否被篡改
                if(blockToValidate.hash !== blockToValidate.computeHash()){
                    console.log("第"+ i +"个数据被篡改")
                    return false
                }
                        // 上一个区块是否被篡改
                        let j = i-1
                        // console.log("第"+ i +"个区块的prehash是"+blockToValidate.previousHash)
                        // console.log("第"+ j +"个区块的hash是"+this.chain[i-1].hash)

                if(blockToValidate.previousHash !== this.chain[i-1].hash){
                    console.log("第"+ j +"个数据被篡改，前后区块断裂")
                    return false
                }else{
                    if(i===this.chain.length-1){
                        return true
                    }
                }
            }
        }
    }


}


// 测试

//创建一个带头区块的区块链
const niujlChain = new Chain()  
// console.log(niujlChain)
// console.log(niujlChain.validateChain())

// 新建区块
const block1 = new Block('转账19元', '')
const block2 = new Block('转账29元', '')
// const block3 = new Block('转账19元', '')
// const block4 = new Block('转账19元', '')
// 链到区块链上
niujlChain.addBlockToChain(block1)
niujlChain.addBlockToChain(block2)// 
// niujlChain.addBlockToChain(block3)
// niujlChain.addBlockToChain(block4)


console.log(niujlChain)
console.log(niujlChain.validateChain())

// 尝试篡改区块的数据 -> niujlChain.chain[1].data = "转转转101010"
console.log("---尝试篡改区块的数据 -> niujlChain.chain[1].data = '转转转101010'---")
niujlChain.chain[1].data = "转转转101010"
console.log(niujlChain)
console.log(niujlChain.validateChain())
// 尝试篡改区块的数据和hash
console.log("---尝试篡改区块的数据和hash -> niujlChain.chain[1].data = '转转转101010'; niujlChain.chain[1].hash = niujlChain.chain[1].computeHash()---")
niujlChain.chain[1].data = "转转转101010"
// niujlChain.chain[1].hash = niujlChain.chain[1].computeHash()  //没有挖矿难度时，只用computeHash()
niujlChain.chain[1].mine(5)

console.log(niujlChain)
console.log(niujlChain.validateChain())