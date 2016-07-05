__inline('./lib/template.js');
__inline('./lib/login_yp.js');


/**
 *支付模块
 */
// 3种玩法 玩法类型:z_sx(上下盘) z_spf(胜平负) z_dx(大小球)  默认z_sx
// 转发到用户中心注册页面
function registerForm(wbId, nick, wbType) {
  var actionUrl = baseurl + '/uc/register/bindPhone';
  var turnForm = document.createElement("form");
  //一定要加入到body中！！
  document.body.appendChild(turnForm);
  turnForm.method = 'post';
  turnForm.action = actionUrl;
  turnForm.id = 'jq_tmp_form';
  turnForm.target = '_blank';
  //创建隐藏表单
  var input1 = document.createElement("input");
  input1.setAttribute("name", "thirdId");
  input1.setAttribute("type", "hidden");
  input1.setAttribute("value", wbId);
  turnForm.appendChild(input1);

  //创建隐藏表单
  var input2 = document.createElement("input");
  input2.setAttribute("name", "thirdType");
  input2.setAttribute("type", "hidden");
  input2.setAttribute("value", wbType);
  turnForm.appendChild(input2);

  var input3 = document.createElement("input");
  input3.setAttribute("name", "nickName");
  input3.setAttribute("type", "hidden");
  input3.setAttribute("value", nick);
  turnForm.appendChild(input3);

  turnForm.submit();
  document.body.removeChild(turnForm);
}



// 用户id nba_-param_sm
var euro_memberid = '';
// 订单id nba_-param_so
var euro_orderid = '';
// 当前购买套餐内容
var euro_edata = {};
// 微博id
// var euro_wbId = '2007294495';
var euro_wbId = '';
util.payduing = {};
util.money = {};
util.yppay = {
  getwbid: function(){
    //判断登录状态
    var isLogin = window.caitong.isLogin();
    if(!isLogin){
      return false;
    } else {
      euro_wbId = window.caitong.getWbId();
      return euro_wbId;
    }
  },
  checkwbid: function(){
    //判断登录状态
    var isLogin = window.caitong.isLogin();
    if(!isLogin){
      util.alert("在购买前请先登录");
      return false;
    } else {
      euro_wbId = window.caitong.getWbId() || euro_wbId;
      if(!euro_wbId){ util.alert("登录账号异常，请重新登录"); }
      return euro_wbId;
    }
  },
  // step1 点击购买小炮预测验证比赛id  获取相应的数据
  payStep1: function() {
    var self = this;
    // 再次判断一次wbId
    var thirdId = self.checkwbid();
    if(!thirdId){ return false;}
    edata = euro_edata;
    var gameType = edata.gameType;
    var packType = edata.packType;
    var teamId = edata.id || '';

    $.ajax({
      url: 'http://ai.lottery.sina.com.cn/zc/order/batch.htm?thirdId=' + thirdId + '&gameType=' + gameType + '&season=2015&packType=' + packType + '&teamId=' + teamId,
      dataType: 'jsonp',
      data: {},
      cache: true,
      jsonpCallback: "batch_" + thirdId + '_' + gameType + '_' + packType,
      type: "get",
      success: function(data) {
        // 200:有订单记录
        // 201:无订单记录
        // 300:未绑定手机号码
        util.log(data);
        var code = data.code;
        euro_orderid = '';
        if (code == 200) {
          euro_memberid = data.memberId;
          euro_orderid = data.orderLogNo;
          // 显示弹出层
          $(".popup_money").html('¥' + edata.price + "元");
          popupShow($popup);

        } else if (code == 201) {
          euro_memberid = data.memberId;
          // 显示弹出层
          $(".popup_money").html('¥' + edata.price + "元");
          popupShow($popup);
        } else if (code == 300) { //未关联注册  
          util.payduing[thirdId + '_' + gameType + '_' + packType] = false;
          var nickName = getSinaWbCookieVal('SINA_WB_LOCAL_NICKNAME');
          registerForm(thirdId, nickName, 1); //转发到用户中心注册页面
        } else {
          util.alert(data.msg);
        }

        util.payduing[thirdId + '_' + gameType + '_' + packType] = false;
      }
    });
  },

  // step2 点击弹出层立即支付按钮
  payStep2: function() {
    var self = this;
    self.checkwbid();
    var memberId = euro_memberid;
    var edata = euro_edata;
    var gameType = edata.gameType;
    var packType = edata.packType;
    var teamId = edata.id || '';
    var price = edata.price;
    if (euro_orderid) {
      // 已存在订单号  1.打开新开页面paypre.html  2.显示弹出层 我已支付成功
      self.payStepToPaypre();
      popupShow($popup_canpay);
      return;
    }
    // if(util.payduing[memberId+'_'+gameType+'_'+packType+'_'+price]){
    //   return;
    // }
    // util.payduing[memberId+'_'+gameType+'_'+packType]= true;
    $.ajax({
      url: 'http://ai.lottery.sina.com.cn/zc/order/batchToPay.htm?memberId=' + memberId + '&gameType=' + gameType + '&season=2015&packType=' + packType + '&teamId=' + teamId + '&price=' + price,
      dataType: 'jsonp',
      data: {},
      cache: true,
      jsonpCallback: "batchToPay_" + memberId + "_" + gameType + "_" + packType,
      type: "get",
      success: function(data) {
        var code = data.code;
        if (code && code == "200") {
          euro_orderid = data.orderLogNo;
          self.payStepToPaypre();
          popupShow($popup_canpay);
        } else if (code == 300) { //未关联注册  
          util.payduing[memberId + '_' + gameType + '_' + packType + '_' + price] = false;
          var nickName = getSinaWbCookieVal('SINA_WB_LOCAL_NICKNAME');
          registerForm(thirdId, nickName, 1); //转发到用户中心注册页面
        } else {
          util.alert(data.msg);
        }
        // util.payduing[memberId+'_'+gameType+'_'+packType]= false;
      }
    });
  },
  // 打开页面 ./payperpack.htm
  payStepToPaypre: function() {
    var self = this;

    // euro_edata.memberId = euro_memberid;
    // euro_edata.wbId = euro_wbId;
    // euro_edata.orderLogNo = euro_orderid;

    var param_data = {};
    param_data.memberId = euro_memberid;
    param_data.wbId = euro_wbId;
    param_data.orderLogNo = euro_orderid;

    param_data.packname = euro_edata.packname;
    param_data.gameType = euro_edata.gameType;
    var info = JSON.stringify(param_data);

    var thirdId = euro_wbId;
    var price = euro_edata.price;

    var packnameObj = {'淘汰赛礼包':'1','全赛事礼包':'2','小组赛礼包':'3'};
    var pname = packnameObj[euro_edata.packname];
    // var packnameArr = ['','淘汰赛礼包','全赛事礼包','小组赛礼包'];

    var actionUrl = 'http://odds.sports.sina.com.cn/uefa/prePayPack?memberId='+param_data.memberId+'&wbId='+param_data.wbId+'&orderLogNo=' + param_data.orderLogNo+'&packname=' + param_data.packname+'&gameType=' + param_data.gameType+'&thirdId=' + thirdId + '&price=' + price+'&pname='+pname+'&info=' + info;
    window.newWin.location.href = actionUrl;
  },

  // step4 在新页面 http://ai.lottery.sina.com.cn//nba/payweb/pre.htm 立即支付按钮
  payStep4: function(orderNo, memberId, chargeWay) {
    var self = this;
    self.checkwbid();
    $.ajax({
      url: 'http://ai.lottery.sina.com.cn/zc/order/batchPay.htm?memberId=' + memberId + '&orderNo=' + orderNo + '&chargeWay=' + chargeWay,
      dataType: 'jsonp',
      data: {},
      cache: true,
      jsonpCallback: "dcPay_"+orderNo+"_"+memberId+"_"+chargeWay,
      type: "get",
      success: function(data) {
        var code = data.code;
        // util.windowOpen("http://ai.lottery.daily.2caipiao.com/sina-payment/charge.do?gameType=z_dx&amount=29.00&clientType=4&chargeWay=4&matchId=139180&memberId=519526&sign=99db726978f67fd12d8ebcf89f12c20f&orderNo=D1605261057018327995",'_self');
        if (code && code == "200") {
          // 跳转到真正的支付页面
          util.windowOpen(data.redirectURL, '_self');
        } else {
          util.alert(data.msg);
        }
      }
    });
  },

  // step5 弹出层 我已支付成功按钮
  payStep5: function() {
    var self = this;
    self.checkwbid();
    var url = '';
    var teamId = euro_edata.id || '';
    if (euro_orderid) {
      url = 'http://ai.lottery.sina.com.cn/zc/order/batchSuc.htm?memberId=' + euro_memberid + '&orderNo=' + euro_orderid + '&gameType=' + euro_edata.gameType + '&season=2015&packType=' + euro_edata.packType + '&teamId=' + teamId;
    } else {
      url = 'http://ai.lottery.sina.com.cn/zc/order/batchSuc.htm?memberId=' + euro_memberid + '&orderNo=&gameType=' + euro_edata.gameType + '&season=2015&packType=' + euro_edata.packType + '&teamId=' + teamId;
    }
    $.ajax({
      url: url,
      dataType: 'jsonp',
      data: {},
      cache: true,
      jsonpCallback: "dcSuc_" + euro_edata.gameType + "_" + euro_edata.packType,
      type: "get",
      success: function(data) {
        var code = data.code;
        if (code == 200) {
          location.reload(true);
        } else {
          util.alert(data.msg);
        }
      }
    });
  },

  openPage: function() {
    window.newWin = window.open('http://euro.sina.com.cn/lottery/', '_blank');
    util.yppay.payStep2();
  }
}

util.alert = function(msg) {
  $('#popup_msg').html(msg);
  popupShow($popup_msg);
}

// 显示相应的弹层
function popupShow($layout) {
  var viewData = util.viewData();
  var layout = $layout[0];
  document.body.style.overflow = 'hidden';
  $popup_box.hide();
  $layout.show();
  layout.style.visibility = "hidden";
  var cHeight = layout.offsetHeight;
  layout.style.marginTop = (viewData.viewHeight / 2 - cHeight / 2 - 30) + 'px';
  $mask.show();
  layout.style.visibility = "visible";
};
// 隐藏弹层
function popupHide() {
  document.body.style.overflow = 'auto';
  $mask.hide();
  $popup_box.hide();
}



var ypObj = {
  getHasPurchase: function() {
    // 已经购买
    var self = this;
    if (!util.yppay.getwbid()) {
      return; }
    $.ajax({
      url: 'http://ai.lottery.sina.com.cn/zc/psn/ckPack.htm?thirdId=' + euro_wbId + '&season=2015',
      dataType: 'jsonp',
      data: {},
      cache: true,
      jsonpCallback: "ckPack",
      type: "get",
      success: function(data) {
        // data = {
        //   "result":"success",
        //   "code":200,
        //   "all":["z_dx"],
        //   "group":["z_dx","z_sx"],
        //   "out":["z_dx"],
        //   "team_934":["z_dx"],
        //   "team_933":[],
        //   "team_944":[],
        //   "team_922":[],
        //   "team_926":[],
        //   "team_924":[],
        //   "team_939":[],
        //   "team_821":["z_dx"],
        //   "memberId":519526
        // }
        if (data.code == 200) {
          // 全赛事礼包 all
          if (data.all && data.all.length > 0) {
            self.hasPurchase(__euro.yp_01, data.all);
          }

          // 小组赛礼包 group
          if (data.group && data.group.length > 0) {
            self.hasPurchase(__euro.yp_02, data.group,"allRepaet");
          }
          // 淘汰赛礼包 out
          if (data.out && data.out.length > 0) {
            self.hasPurchase(__euro.yp_00, data.out, "outRepeat");
          }
          // 淘汰赛allin
          if (data.outAll === true) {
            self.hasPurchase(__euro.yp_00, "outAll");
          }
        }
        self.render();
      }
    });
  },
  hasPurchase: function(ypdata, yparr, ifRepeat) {
    // all in 玩法
    if (yparr === "outAll") {
      // ypdata[3].status = '3';
      $.each(ypdata, function(i, v) {
        if (v.status) {
          v.status = "3";
        }
      })
      return;
    }
    if (ifRepeat === "outRepeat"||ifRepeat === "allRepeat") {
      yp_out[3].status = '3';
    }
    for (var i = 0, len = yparr.length; i < len; i++) {
      if (yparr[i] == 'z_sx') {
        ypdata[0].status = '3';
      } else if (yparr[i] == 'z_spf') {
        ypdata[1].status = '3';
      } else if (yparr[i] == 'z_dx') {
        ypdata[2].status = '3';
      } else if (yparr[i] == 'z_all') {
        ypdata[3].status = '3';
      } else {
        // ypdata[0].status = '3';
      }
    }

  },
  render: function(data) {
    var self = this;
    template.helper("getMsg", function(data) {
      return data.msg[data.status];
    });
    template.helper("getPay", function(status) {
      return status == '1' ? 'yp_pay' : '';
    });
    var data_00 = __euro.yp_00;
    var html = template('yp_00_tmp', { data: data_00 });
    $("#yp_00")[0].innerHTML = html;
    // 先判断是否显示全赛事礼包 1为显示???
    if (__euro.allIsShow == '1') {
      $("#yp_01").show();
      var data_01 = __euro.yp_01;
      var html = template('yp_01_tmp', { data: data_01 });
      $("#yp_01")[0].innerHTML = html;
    } else {
      $("#yp_01").hide();
    }
    // 先判断是否显示小组赛礼包 1为显示???
    if (__euro.groupIsShow == '1') {
      $("#yp_02").show();
      var data_02 = __euro.yp_02;
      var html = template('yp_02_tmp', { data: data_02 });
      $("#yp_02")[0].innerHTML = html;
    } else {
      $("#yp_02").hide();
    }
    // 按钮颜色
    $(".yp_msg").each(function() {
      var yp_msgText = $(this).text();
      if (yp_msgText !== '领取') {
        $(this).addClass('yp_msg1');
      }
    });

    self.playCount();
  },
  playCount: function() {
    outdate = outdate.replace(/-/gi, "/");
    var outTime = new Date(outdate).getTime();
    var lastTime = outTime - $.now();
    var lastHour = 0;
    if (lastTime && lastTime >= 0) {
      lastHour = Math.floor(lastTime / 1000 / 60 / 60);
      $(".yp_countNum_txt").text(lastHour);
    } else {
      // $(".yp_countNum").parents('.ypbox').hide();
    }
  },
  bindEvent: function() {
    var self = this;
    $("body").on("click", ".yp_pay", function() {
      var $box = $(this).closest('.ypbox');
      var obj = $box.data("box");
      var idx = $(this).data("idx");
      euro_edata = __euro[obj][idx];
      //判断登录状态      
      var isLogin = checkLogin();
      if (!isLogin) {
        middleLogin();
      } else {
        util.yppay.payStep1();
      }
    });

    window.$mask = $("#mask");
    // 所有弹出层容器
    window.$popup_box = $(".popup_box");
    // 支付容器
    window.$popup = $("#popup_layout_pay");
    // 支付应该成功容器
    window.$popup_canpay = $("#popup_layout_canpay");
    // 未支付容器
    window.$popup_nopay = $("#popup_layout_nopay");
    // 没有预测数据的提示容器
    window.$popup_msg = $("#popup_layout_msg");

    // 弹层层隐藏按钮
    $(".popup_btn_close").on("click", function() {
      // 隐藏弹出层
      popupHide();
    });

    //弹出层 支付按钮
    // $(".popup_btn_pay").click(function() {
    // 先验证是否存在订单号
    //   util.yppay.payStep2();
    // });

    //提示信息按钮:知道了  取消
    $(".popup_btn_know").on('click', function(event) {
      // 隐藏弹出层
      popupHide();
    });
    $(".popup_btn_cancel").on('click', function(event) {
      // 隐藏弹出层
      popupHide();
    });

    //支付成功确认
    $(".popup_btn_canpay").on('click', function() {
      // 隐藏弹出层
      popupHide();
      // 支付是否成功验证
      util.yppay.payStep5();
    });

    $(".yp_footer_btn").on('click', function(event) {
      $(".yp_footeOther").slideToggle();
    });

    setInterval(function(){
      self.playCount();
    },30*60*1000);
  },
  init: function() {
    var self = this;
    if (util.yppay.getwbid()) {
      self.getHasPurchase();
    } else {
      self.render();
    }
    self.bindEvent();
  }
};
ypObj.init();
