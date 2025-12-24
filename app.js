// app.js - 最简版本，确保能正常运行
App({
  globalData: {
    user_info: null,
    token: null,
    system_info: null,
    base_url: 'https://api.example.com'
  },

  onLaunch: function() {
    console.log('小程序启动');
    
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.system_info = systemInfo;
      console.log('系统信息:', systemInfo);
      
      // 检查登录状态
      this.checkLoginStatus();
      
      // 检查更新
      this.checkUpdate();
      
    } catch (error) {
      console.error('启动错误:', error);
    }
  },

  checkLoginStatus: function() {
    try {
      const token = wx.getStorageSync('token');
      const user_info = wx.getStorageSync('user_info');
      
      if (token && user_info) {
        this.globalData.token = token;
        this.globalData.user_info = user_info;
        console.log('用户已登录:', user_info.nickname || '未知用户');
        return true;
      }
      return false;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  },

  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        console.log('更新检查:', res.hasUpdate);
      });
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      
      updateManager.onUpdateFailed(() => {
        console.error('更新失败');
      });
    }
  },

  // 网络请求方法
  request: function(options) {
    return new Promise((resolve, reject) => {
      // 显示加载提示
      if (options.showLoading !== false) {
        wx.showLoading({
          title: options.loadingText || '加载中...',
          mask: true
        });
      }
      
      // 添加基础URL
      let url = options.url;
      if (!url.startsWith('http')) {
        url = this.globalData.base_url + url;
      }
      
      // 添加token到请求头
      const header = options.header || {};
      if (this.globalData.token) {
        header['Authorization'] = `Bearer ${this.globalData.token}`;
      }
      
      wx.request({
        url: url,
        method: options.method || 'GET',
        data: options.data || {},
        header: header,
        success: (res) => {
          // 隐藏加载提示
          wx.hideLoading();
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // token过期，清除登录状态
            this.logout();
            wx.showModal({
              title: '提示',
              content: '登录已过期，请重新登录',
              showCancel: false,
              success: () => {
                wx.reLaunch({ url: '/pages/login/login' });
              }
            });
            reject(new Error('登录已过期'));
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          wx.hideLoading();
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  },

  // 退出登录
  logout: function() {
    this.globalData.token = null;
    this.globalData.user_info = null;
    
    try {
      wx.removeStorageSync('token');
      wx.removeStorageSync('user_info');
    } catch (error) {
      console.error('清除存储失败:', error);
    }
    
    // 跳转到登录页
    wx.reLaunch({ url: '/pages/login/login' });
  },

  // 工具方法
  formatDate: function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      case 'MM-DD HH:mm':
        return `${month}-${day} ${hours}:${minutes}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }
});