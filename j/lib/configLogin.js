/**
 *全局变量caitong   固定名称，登录后回调caitong方法
 *loginSuccess  登录成功回调
 *logoutSuccess  退出成功回调
 *sinaSSOController.getSinaCookie() 获取新浪账号信息  没有返回null  
 *Object { status: "0", flag: "00", evid: "", uid: "1834456825", nick: "余荫漫步" }
 *SINA_OUTLOGIN_LAYER.isLogin()  //是否登录
 */
 // ssologin.js是注入的 所以先定义一下 
window.sinaSSOController = null;
window.SINA_OUTLOGIN_LAYER = null;


/**
 *将微博昵称和wbId放cookie中 不建议使用   写入新浪域  有可能被清掉
 *发送新浪特定接口请求返回会执行新浪域的白名单  delete掉自己写入新浪域的cookie
 *建议使用cookie里的SUBP
 解密方法：
  var getCookie = function(name) {
    var Res = (new RegExp(name + "=([^;]+)")).exec(document.cookie);
    return Res == null ? null : Res[1]
  }
  var subp = getCookie("SUBP");
  if (!subp) {
      return null
  }
  var arrSubp = sinaSSOEncoder.getSUBPCookie.decode(subp);
  try {
      arrSubp.uid = arrSubp.uid.replace(/(^\s*)|(\s*$)/g, "");
      arrSubp.nick = decodeURIComponent(arrSubp.nick.replace(/(^\s*)|(\s*$)/g, ""))
  } catch (err) {
      return null
  }
  console.log(arrSubp);
  return arrSubp
*/ 