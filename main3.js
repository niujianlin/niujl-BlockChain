/**
 * 问题：为什么后面以后人挖矿，前面的区块的交易信息transactions条目数量还会变？？？？？
 */

// 引入sha256
const sha256 = require('crypto-js/sha256')
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1') 

// 转账池,通过公私秘钥确保账本信息正确
class Transaction {
    constructor(from, to, amount){
        this.from = from
        this.to = to
        this.amount = amount
    }
    // 需要对文本数据hash
    computeHash(){
        return sha256(this.from+this.to+this.amount).toString()
    }
    // 添加一个签名方法
    sign(key){
        // 加密后的签名signature
        this.signature =  key.sign(this.computeHash(), 'base64').toDER('hex')
    }
    // //验证签名
    // isValid(){
    //     // 如果矿工只是挖矿，交易的发起是系统
    //     if(this.from === ""){
    //         return true
    //     }
    //     // 拿到公钥
    //     const KeyObj = ec.keyFromPublic(this.from, 'hex')
    //     // 用公钥验证生成的hash是否被篡改
    //     return KeyObj.verify(this.computeHash(), this.signature)
    
    // }
    isValid(){
                console.log('444444444444444444444444444444444444')

        // from Address 就是public key
        // 有两种类型的 transaction 
        if(this.from === ''){ // 这里也有bug，若被篡改为''，就逃过了检查！！！！！
            return true
        }
        if(this.from === null){
            return true
        }
        if(!this.signature){  // 若瞎篡改transaction，computeHash()计算不出来，signature为空
            // console.log('from:'+this.from+'to:'+this.to+'amount:'+this.amount+'signature:'+ this.signature)
                    console.log('555555555555555555555555555')
            // throw new Error('签名为空 sig missing，交易Transaction被瞎篡改了')
            console.log('签名为空 sig missing，交易Transaction被瞎篡改了')
        }
                console.log('6666666666666666666666666666666')
                console.log('\nfrom:'+this.from+'\nto:'+this.to+'\namount:'+this.amount+'\nsignature:'+ this.signature+'\n')


        try{
            const publicKey = ec.keyFromPublic(this.from, 'hex')
            console.log('77777777777777777777777777777777777')
            return publicKey.verify(this.computeHash(), this.signature)
        }catch(err){
            // 若篡改了区块中的from，没法生成公钥，因为公钥就是from，因此也没法验证
            console.log('有人篡改了区块中的from，没法生成公钥，因为公钥就是from，因此也没法验证')
            return false
        }

        
      }
}

// 区块
class Block {
    // constructor(data, previousHash) data->转账记录
    constructor(transactions, previousHash){
        this.transactions = transactions;
        this.previousHash = previousHash
        this.timestamp = Date.now()
        this.nonce = 1  //随机数
        this.hash = this.computeHash()
    }
    computeHash(){
        // 交易数据transactions没有hash化！！！！，只是简单换成json格式来进行sha256
        return sha256(JSON.stringify(this.transactions)+this.previousHash+this.nonce+this.timestamp).toString()
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
                console.log('11111111111111111111111111111111')

        //1.验证：挖hash之前先验证一下区块数据（签名）是否被篡改（网络传输中）
        if (!this.validateBlockTransactions()){
            console.log("挖矿失败，因为前面有区块签名验证不通过")
            return false
        }
        // 然后再来挖矿（算hash）
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
                console.log('mine()时的transactions:'+this.transactions.toString()+'有'+this.transactions.length+'个')
        return true
    }

    // 验证：在区块中验证每一个交易数据条目的签名
    validateBlockTransactions(){
                console.log('22222222222222222222222222')

        for(let transaction of this.transactions){
                    console.log('333333333333333333333333333')

            if(!transaction.isValid()){
                console.log('有账本的签名可能在网络传输中被篡改，签名不对，发现异常交易')
                return false
            }
        }
        return true
    }

}

// 链
class Chain {
    constructor() {
        // 空数组，里面放区块
        this.chain = [this.bigBang()]
        // 打包交易条目，这里面到底应不应该删东西？？？为啥能直接影响到以前添加的块？？？
        this.transactionPool = [];
        // 每挖出一个区块50个币
        this.minerReward = 50
        // 设置挖出区块的hash值条件，控制挖出时间
        this.difficulty = 4

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

    //添加transaction交易条目 到 transactionPool里
    addTransaction(transaction){
        // 2.验证：交易数据是否被篡改（验证签名对不对）
        if(!transaction.isValid()){
            throw new Error('签名不对！invalid transaction')
            return false
        }
        console.log("签名验证正确，添加到交易池中。valid transaction")
        this.transactionPool.push(transaction)
    }

    // 这个方法好像没啥用了，当有人需要记录账本信息时
    // 构造区块的prehash（首先需要找到链尾）以及构造符合要求的区块hash（挖矿），添加区块到区块链
    addBlockToChain(newBlock){
        //构造区块的prehash
        newBlock.previousHash = this.getLatestBlock().hash
        // newBlock.hash = newBlock.computeHash()
        // hash需要满足特定要求，来保证特定时间内出一个块
        newBlock.mine(this.difficulty)
        // 添加到区块链
        this.chain.push(newBlock)
    }
    
    // 某人准备挖矿
    mineTransactionPool(minerRewardAddress){

        // 挖出块得到的奖励50币也是他通过transaction交易记录来发布
        const minerRewardTransaction = new Transaction('', minerRewardAddress, this.minerReward)
        // 打包自己的挖矿奖励（交易条目）形成新的交易条目

        // !!!!!!!!!!!!就是这句话导致前一个块的transactions改变的！！！！！！！！！！！！！!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // this.transactionPool.push(minerRewardTransaction)
        // 试着修改
        this.addTransaction(minerRewardTransaction) // 还是不行

        try{
            console.log('第二次挖前this.chain[1].transactions有'+this.chain[1].transactions.length+'个交易信息添加到新块上，已经链到区块链上\n%j', this.chain[1])         
        }catch(e){
            
        }

        // 为什么要先打包交易条目并上传到池中，万一挖矿失败了怎么版？？？
        // ----------------------------------------------
        // 挖矿(建好新的区块，包含全部transaction交易)
        const newBlock = new Block(this.transactionPool, this.getLatestBlock().hash)

        if(newBlock.mine(this.difficulty)){ //验证前面所有区块+挖矿都正确
                        console.log('有'+newBlock.transactions.length+'个交易信息添加到新块上，将会链到区块链上')         
            // 添加到区块链上，push方法有问题，会改变前一个区块的transactions!!!!!!!!!!!!!!!!!!!!!!!!!!
            this.chain.push(newBlock)
            // this.chain[this.chain.length] = newBlock
                        console.log('push后this.chain[1].transactions有'+this.chain[1].transactions.length+'个交易信息添加到新块上，已经链到区块链上')         
            // this.transactionPool = []  //交易条目已上传，可以清空了,应该不能清空吧?????
        }
       
    }

    // 完整检查，自己调用
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
                // 先看 签名是否别篡改（每条交易里的transaction）
                if(!blockToValidate.validateBlockTransactions()){
                    console.log("发现非法交易（第"+ i +"签名不对）")
                    return false
                }
                // 再看 当前区块data是否被篡改（hash）
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


const niujlChain = new Chain();

// 生成我们的密钥对
//发款者（同时也是发送到链上的交易池中的人）
const keyPairSender = ec.genKeyPair();
const privateKeySender = keyPairSender.getPrivate('hex')
const publicKeySender = keyPairSender.getPublic('hex')
//收款者
const keyPairReceiver = ec.genKeyPair();
const privateKeyReceiver = keyPairReceiver.getPrivate('hex')
const publicKeyReceiver = keyPairReceiver.getPublic('hex')

// 添加一条交易记录（公钥相当于人的id）
const t1 = new Transaction(publicKeySender, publicKeyReceiver, 10)
// 对这条记录加密，发款者加密，其他人只能用公钥验证是否合法（有没有被篡改valid()）
t1.sign(keyPairSender)

// 打印这条记录，这条记录是否被篡改
console.log("-------新添加的交易记录t1----------")
console.log(t1)
// console.log(t1.isValid(t1)) 

// 若篡改t1的transaction的交易钱数（可能也在网络中篡改）
// t1.amount = 20
// console.log(t1.isValid(t1)) // 这条记录是否被篡改

// 将这条记录添加到区块链的交易条目池中，（没有挖矿）为什么？？交易为什么不需要挖矿
niujlChain.addTransaction(t1)
// 取款人来挖矿了
niujlChain.mineTransactionPool(publicKeySender)

// // 篡改区块的数据和hash,好像没法验证啊？？？后续再有人挖矿才能验证，好像还不行？？？？
// // 好像是签名验证时出的问题
// console.log("-------篡改前----------")
// console.log(niujlChain.chain[1].transactions)
// niujlChain.chain[1].transactions[0].from = "转转转101010"
// console.log("-------篡改后----------")
// console.log(niujlChain.chain[1])

// 取款人第二次挖矿
niujlChain.mineTransactionPool(publicKeyReceiver)
// 第三次挖矿
// niujlChain.mineTransactionPool(publicKeySender)

console.log("-------查看区块链的情况----------")
console.log(niujlChain)
console.log("-------查看第1个区块的情况----------")
console.log(niujlChain.chain[0])
console.log("-------查看第2个区块的情况----------")
console.log(niujlChain.chain[1])
console.log("-------查看第2个区块交易池的情况----------")
console.log(niujlChain.chain[1].transactions)
console.log("-------查看第3个区块交易池的情况----------")
console.log(niujlChain.chain[2].transactions)

// 整条链的完整验证
// console.log(niujlChain.validateChain())
