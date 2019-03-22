// miniprogram/pages/more/more.js
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";
const toast = require('../../utils/message').toast;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imageArray: [
      "cloud://test-5c133c.7465-test-5c133c/mp-qrcode.jpeg",
      "cloud://test-5c133c.7465-test-5c133c/web-qrcode.jpeg",
      "cloud://test-5c133c.7465-test-5c133c/app-qrcode.png",
    ],
    currentIndex: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let tmpUserInfo = wx.getStorageSync("curUserProfile");
    let bgImgUrl = tmpUserInfo.bgImgUrl,
    nickname = tmpUserInfo.nickName;
    this.setData({
      bgImgUrl,
      nickname,
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  onPageScroll: function(e) {
    if (e.scrollTop > 0) {
      this.setData({
        fixVeryTop: true
      })
    } 
    if (e.scrollTop > 80) {
      this.setData({
        fixTop: true
      })
    } else {
      this.setData({
        fixTop: false,
        fixVeryTop: false
      })
    }
  },

  previewImg(e) {
    let { img } = e.target.dataset;
    wx.showActionSheet({
      itemList: ['保存到手机相册'],
      async success(res) {
        let { tapIndex } = res;
        switch(tapIndex) {
          case 0:
            try {
              let { tempFilePath } = await wx.cloud.downloadFile({
                fileID: img,
              });
        
              if (tempFilePath === undefined) {
                throw new Error('文件下载失败');
              } else {
                wx.saveImageToPhotosAlbum({
                  filePath: tempFilePath,
                  success() {
                    toast('图片保存成功，请到手机相册中查看');
                  }
                })
              }
        
            } catch (error) {
              toast(error.message);
            }
            break;
        }
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})