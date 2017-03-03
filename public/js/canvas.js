var myChart = echarts.init(document.getElementById('main'));
var app = {};
var i=0;
var low=100; //数据低频
var high=900; //数据高频
var arr1=[];
var xArray=new function(){
    this.getJson=function(){
        for(var k=low;k<high;k++){
            arr1.push(k);
        }
        return {'dbm':arr1}
    }

}();
console.log(xArray.getJson().dbm);

var option = {
    title: {
        text: 'canvas'
    },
    tooltip: {
        trigger: 'axis'
    },
    xAxis: {

        data: xArray.getJson().dbm,
        boundaryGap: false,
        axisLabel :{
            interval:50
        }
    },
    yAxis: {
        boundaryGap: [0,'100%'],
        splitLine: {
            show: false
        }
    },

    toolbox: {
        left: 'center',
        feature: {
            dataZoom: {
                yAxisIndex: 'none'
            },
            restore: {},
            saveAsImage: {}
        }
    },


    series: {
        name: 'canvas',
        type: 'line',
        data: useData.hz,
        markLine: {
            silent: true,
            data: [{
                yAxis: 10000
            }, {
                yAxis: 20000
            }, {
                yAxis: 30000
            }, {
                yAxis: 40000
            }, {
                yAxis: 50000
            }]
        }
    }
};
myChart.setOption(option);


if (option && typeof option === "object") {
    myChart.setOption(option, true);
}




