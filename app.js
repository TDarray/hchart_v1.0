var express=require('express');
var app=express();
var fs =require('fs');
var net=require('net');
var http=require('http').createServer(app);
var io=require('socket.io')(http);
var os=require('os');
//设置默认IP和端口号
//var IPaddr='192.168.0.101'
//var DataPort=3100;
//var CmdPort=4100;
//设置新IP和端口号
var newIPaddr=0;
var newDataPort=0;
var newCmdPort=0;
//给EventEmitter设置最大监听
var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();
//创建新socket
var nodeServer = new net.Socket();
var client = new net.Socket();
//每次接收的数据长度,如有协议变动可更改
const len = 4027;
//写入包长
var offset=4;//偏移值
var dataNum=0;//接收点数
//测试使用
var haha=0;
// 存储客户端的WebSocket连接实例
var aSocket = null;//(目前只能一对一，后面如有需求，考虑io.emit?)
//创建服务器，监听8888端口（省略127.0.0.1）
var server = http.listen(8888,function () {

  var host = server.address().address
  var port = server.address().port

  console.log("welcome to http://%s:%s", host, port)

});
ee.setMaxListeners(10);
app.use(express.static('public'));
app.get('/',function(req,res){

  res.sendfile(__dirname+'/index.html');
});

// 同客户端建立连接
io.on('connection', function (socketIO) {
  aSocket=socketIO;
  // 测试用，连接成功
  socketIO.emit("test","your websocket has connected");
  //返回数据使用，控制C服务器
  socketIO.on('fromWebClient', function (webClientData) {
    console.log(webClientData);
    var head=new Buffer([0xAA,0x01,0x11,0x11,0x11,0x11]);
    var cmdData=new Buffer(webClientData);
    var cmdControl=Buffer.concat([head,cmdData]);
    console.log(cmdControl);
    client.write(cmdControl);
  });
  socketIO.on('fromCmd',function(CmdData){
    if(newIPaddr!=CmdData.IPaddr){
      newIPaddr=CmdData.IPaddr;
    }else(
        console.log('newIPaddr is same')
    )
    if(newCmdPort!=parseFloat(CmdData.CmdPort)){
      newCmdPort=parseFloat(CmdData.CmdPort);
      connectCPort(newCmdPort,newIPaddr);
    }else(
        console.log('newCmdPort is same')
    )
    if(newDataPort!=parseFloat(CmdData.DataPort)){
      newDataPort=parseFloat(CmdData.DataPort);
      connectDPort(newDataPort,newIPaddr);
    }else(
        console.log('newDataPort is same')
    )
  })
  socketIO.on('disconnect', function () {
    console.log('DISCONNECTED FROM IO');
  });
});

// 从C服务器接收数据
nodeServer.on('data', function (data) {
  //如果接受数据第一位为0xAA(对应值为170)且数据长为len
  if(data.readUInt8(0)==170&&data.length==len){
    dataNum=data.readInt32LE(6);
    console.log('>> nodeServer receive data.length:'+data.length);
    haha++;
    console.log("receive times"+haha);
    console.log('free mem : ' + Math.ceil(os.freemem()/(1024*1024)) + 'mb');
    var useData=byteArrayUntil.getUseJson(data,offset);
    //向客户端发送json数据
    //判断websocket是否已经连接
    if(aSocket!=null){
      aSocket.emit('pushToWebClient',useData);
    }
    console.log('nodeServer data length'+data.length);

  }
});
//连接到C服务器DataPort端口
function connectDPort(DataPort,IPaddr){
  nodeServer.connect(DataPort, IPaddr, function() {
    console.log('CONNECTED TO:',IPaddr,DataPort);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据
    var receive = new Buffer([0xAA,0x02,0xFE]);
    nodeServer.write(receive);
    nodeServer.write('your'+ DataPort +'socket has connected');
  });
  nodeServer.on('error',function(err){
    console.error(err);
  })
}

//连接到C服务器CmdPort端口
function connectCPort(CmdPort,IPaddr){
  client.connect(CmdPort, IPaddr, function() {
    console.log('CONNECTED TO:',IPaddr,CmdPort);
  });
  client.on('error',function(err){
    console.error(err);
  })
}
//构造一个遍历函数,分别返回array或者json
var byteArrayUntil=new function(){
  this.getUseData=function(data,offset){
    var arr=[];
    for(var i=0;i<dataNum;i++){
      arr.push(data.readInt32LE(826+i*offset));
    }
    return arr;
  }
  this.getUseJson=function(data,offset){
    var arr1=[];
    var arr2=[];
    for(var i=0;i<dataNum;i++){
      arr1.push((data.readInt32LE(826+i*offset))/1000);
    }
    var low=parseInt(data.readInt32LE(14)/1000);
    var high=parseInt(data.readInt32LE(18)/1000);
    var off=(high-low)/dataNum;//用加号可以将的到的string类型转化为number类型
    for(var k=low;k<=high;k=k+off) {
      arr2.push(k.toFixed(2));
    }

    return {'dbm':arr1,//arr1的值不能为字符串，否则hchart显示不出
      'hz':arr2};//arr2因为用了tiFixed,所以为字符串，但是竟然不影响？
  }

}();