const sha256 = require("crypto-js/sha256");
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1') // curve name
// 需要签名的是什么 是transaction
// 签名transaction这个数据本什么，不，签名他的hash
// 为什么要签名hash ...
// 需要外人能够verify这个transaction
class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    // this.timestamp = timestamp;
  }

  computeHash(){
    return sha256(
        this.from +
        this.to +
        this.amount
    ).toString();
  }

  // 签名需要private key
  sign(privateKey){
    // 验证你拥有这笔钱。privateKey和fromAddress对应的上
    this.signature =  privateKey.sign(this.computeHash(), 'base64').toDER('hex')
  }

  isValid(){
    // from Address 就是public key
    // 有两种类型的 transaction 
    if(this.from === null)
      return true
    if(!this.signature)
      throw new Error('sig missing')
    const publicKey = ec.keyFromPublic(this.from, 'hex')
    return publicKey.verify(this.computeHash(), this.signature)
  }
}

class Block {
  constructor(transactions, previousHash) {
    // data 是 string
    // data -> transaction <-> array of objects
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.timestamp = Date.now();
    this.nonce = 1;
    this.hash = this.computeHash();
  }

  computeHash() {
    // data 需要 stringify
    // JSON.stringify
    return sha256(
      JSON.stringify(this.transactions) +
        this.previousHash +
        this.nonce +
        this.timestamp
    ).toString();
  }

  getAnswer(difficulty) {
    //开头前n位为0的hash
    let answer = "";
    for (let i = 0; i < difficulty; i++) {
      answer += "0";
    }
    return answer;
  }
  //计算复合区块链难度要求的hash
  // 什么是 复合区块链难度要求的hash
  mine(difficulty) {
    if(!this.validateTransactions()){
      throw new Error('tampered transactions found, abort, 发现异常交易，停止挖矿')
    }
    while (true) {
      this.hash = this.computeHash();
      if (this.hash.substring(0, difficulty) !== this.getAnswer(difficulty)) {
        this.nonce++;
        this.hash = this.computeHash();
      } else {
        break;
      }
    }
    console.log("挖矿结束", this.hash);
  }

  //在block里验证这所有的transactions
  validateTransactions(){
    for(let transaction of this.transactions){
      if(!transaction.isValid()){
        console.log('非法交易')
        return false
      }
    }
    return true
  }
}

// 区块 的 链
// 生成祖先区块
class Chain {
  constructor(difficulty) {
    this.chain = [this.bigBang()];
    this.transactionPool = [];
    this.minerReward = 50;
    this.difficulty = difficulty;
    // this.difficulty = 4
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty
  }

  bigBang() {
    const genesisBlock = new Block("我是祖先", "");
    return genesisBlock;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // 添加transaction 到 transactionPool里
  // 验证transaction 的合法性
  // 暴露给外部的方法不应该允许添加空地址的transaction
  addTransaction(transaction) {
    if(!transaction.from || !transaction.to)
      throw new Error('invalid from or to')
    
    if(!transaction.isValid())
      throw new Error('invalid transaction, tampered or invalid sig')

    this.transactionPool.push(transaction);
  }

  mineTransactionPool(minerRewardAddress) {
    // 发放矿工奖励
    const minerRewardTransaction = new Transaction(
      null,
      minerRewardAddress,
      this.minerReward
    );
    this.transactionPool.push(minerRewardTransaction);

    // 挖矿
    const newBlock = new Block(
      this.transactionPool,
      this.getLatestBlock().hash
    );
    newBlock.mine(this.difficulty);

    // 添加区块到区块链
    // 清空 transaction Pool
    this.chain.push(newBlock);
    this.transactionPool = [];
  }

  //验证这个当前的区块链是否合法
  //当前的数据有没有被篡改
  //我们要验证区块的previousHash是否等于previous区块的hash

  // validate all the transactions
  validateChain() {
    if (this.chain.length === 1) {
      if (this.chain[0].hash !== this.chain[0].computeHash()) {
        return false;
      }
      return true;
    }
    // this.chain[1] 是第二个区块
    // 我们从第二个区块开始 验证
    // 验证到最后一个区块 this.chain.length -1
    for (let i = 1; i <= this.chain.length - 1; i++) {
      const blockToValidate = this.chain[i];
      // block的transactions均valid
      if (!blockToValidate.validateTransactions()){
        console.log('非法交易')
        return false
      }
      //当前的数据有没有被篡改
      if (blockToValidate.hash !== blockToValidate.computeHash()) {
        console.log("数据篡改");
        return false;
      }
      console.log(this.chain)
      //我们要验证区块的previousHash是否等于previous区块的hash
      const previousBlock = this.chain[i - 1];
      if (blockToValidate.previousHash !== previousBlock.hash) {
        console.log("前后区块链接断裂");
        return false;
      }
    }
    return true;
  }
}


// 测试

const niujlChain = new Chain(4);

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
niujlChain.mineTransactionPool(publicKeyReceiver)

// 篡改区块的数据和hash,好像没法验证啊？？？后续再有人挖矿才能验证，好像还不行？？？？
// 好像是签名验证时出的问题
// niujlChain.chain[1].transactions[0].from = "转转转101010"
// console.log(niujlChain.chain[1].transactions[0])

// 取款人第二次挖矿
niujlChain.mineTransactionPool(publicKeyReceiver)


console.log("-------查看区块链的情况----------")
console.log(niujlChain)
console.log("-------查看第2个区块的情况----------")
console.log(niujlChain.chain[1])
console.log("-------查看第2个区块交易池的情况----------")
console.log(niujlChain.chain[1].transactions)
console.log("-------查看第3个区块交易池的情况----------")
console.log(niujlChain.chain[2].transactions)