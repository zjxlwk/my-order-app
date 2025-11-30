// 数据库索引配置指南
// 注意：在微信小程序云开发中，索引需要通过云开发控制台或云函数创建

/**
 * 推荐的索引配置
 * 使用说明：在云开发控制台中，为相应的集合添加以下索引
 */
export const recommendedIndexes = {
  // users集合索引
  users: [
    {
      name: 'username_idx', // 索引名称
      key: { username: 1 }, // 用户名升序索引
      unique: true, // 唯一索引，确保用户名不重复
      description: '用于快速查找用户，提高登录效率'
    },
    {
      name: 'token_idx', // 索引名称
      key: { token: 1 }, // token升序索引
      unique: true, // 唯一索引
      description: '用于验证用户身份，提高token验证效率'
    },
    {
      name: 'userType_idx', // 索引名称
      key: { userType: 1 }, // 用户类型升序索引
      unique: false,
      description: '用于按用户类型查询'
    }
  ],
  
  // orders集合索引
  orders: [
    {
      name: 'status_idx', // 索引名称
      key: { status: 1 }, // 订单状态升序索引
      unique: false,
      description: '用于快速筛选不同状态的订单，提高仪表盘查询效率'
    },
    {
      name: 'dispatcher_id_idx', // 索引名称
      key: { dispatcher_id: 1 }, // 派单员ID升序索引
      unique: false,
      description: '用于快速查询派单员的订单'
    },
    {
      name: 'receiver_id_idx', // 索引名称
      key: { receiver_id: 1 }, // 接单员ID升序索引
      unique: false,
      description: '用于快速查询接单员的订单'
    },
    {
      name: 'createdAt_idx', // 索引名称
      key: { createdAt: -1 }, // 创建时间降序索引
      unique: false,
      description: '用于按时间排序查询订单'
    },
    {
      name: 'status_dispatcher_compound_idx', // 索引名称
      key: { status: 1, dispatcher_id: 1 }, // 复合索引
      unique: false,
      description: '优化派单员按状态筛选订单的查询'
    },
    {
      name: 'status_receiver_compound_idx', // 索引名称
      key: { status: 1, receiver_id: 1 }, // 复合索引
      unique: false,
      description: '优化接单员按状态筛选订单的查询'
    }
  ]
};

/**
 * 如何创建索引：
 * 1. 登录微信小程序云开发控制台
 * 2. 进入"数据库"选项卡
 * 3. 选择相应的集合
 * 4. 点击"索引管理"
 * 5. 点击"添加索引"，根据上述配置创建索引
 */

/**
 * 查询优化建议
 * 1. 使用索引覆盖查询，减少回表操作
 * 2. 避免使用skip进行大量数据的分页，考虑使用游标的方式
 * 3. 对于复杂查询，先执行过滤再排序
 * 4. 限制返回字段，使用field方法只返回需要的字段
 */