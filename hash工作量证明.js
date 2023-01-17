const sha256 = require("crypto-js/sha256")
//轻微扰动，结果变化巨大
// console.log(sha256('niujl1').toString())
// console.log(sha256('niujl2').toString())

function proofOfWork(){
    let data = 'niujl'
    let x = 1
    while(true){
        // 哈希值第一位为0，随机数x取几次可以得到
        // if(sha256(data + x).toString()[0] !== '0'){
        //     x++
        if(sha256(data + x).toString().substring(0,4) !== '0000'){ //哈希值前4位为0
            x++
        }else{
            console.log(sha256(data + x).toString())
            console.log(x)
            break
        }
    }
}

proofOfWork()