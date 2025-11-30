// 数据库初始化云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    console.log('开始初始化数据库...');
    
    // 尝试获取orders集合，如果不存在则创建
    try {
      // 先尝试获取集合统计，用于检查集合是否存在
      await db.collection('orders').count();
      console.log('orders集合已存在');
    } catch (err) {
      console.log('orders集合不存在，尝试创建...');
      
      // 集合不存在，尝试添加一个文档来自动创建集合
      try {
        const result = await db.collection('orders').add({
          data: {
            _id: 'init_doc',
            isInitDoc: true,
            createdAt: db.serverDate()
          }
        });
        console.log('orders集合创建成功:', result);
        
        // 创建成功后，删除初始化文档
        await db.collection('orders').doc('init_doc').remove();
        console.log('初始化文档已删除');
      } catch (createErr) {
        console.log('创建orders集合失败:', createErr);
      }
    }
    
    // 尝试获取users集合，如果不存在则创建
    try {
      await db.collection('users').count();
      console.log('users集合已存在');
    } catch (err) {
      console.log('users集合不存在，尝试创建...');
      
      try {
        const result = await db.collection('users').add({
          data: {
            _id: 'init_doc',
            isInitDoc: true,
            createdAt: db.serverDate()
          }
        });
        console.log('users集合创建成功:', result);
        
        await db.collection('users').doc('init_doc').remove();
        console.log('初始化文档已删除');
      } catch (createErr) {
        console.log('创建users集合失败:', createErr);
      }
    }
    
    return {
      code: 200,
      message: '数据库初始化完成',
      data: {
        success: true
      }
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      code: 500,
      message: '数据库初始化失败',
      error: error.message
    };
  }
};
