// orders云函数 - 订单管理功能
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 导入工具模块
const { createErrorResponse, handleCloudFunctionError } = require('./utils/errorHandler');
const { validateRequiredFields, validateOrderStatus } = require('./utils/validator');

// 直接定义云函数主逻辑，不使用包装器避免语法问题
exports.main = async (event, context) => {
  try {
    const { action, userId, params } = event || {};
    
    // 安全地检查userId，避免验证器错误
    if (!userId || userId === '') {
      return {
        code: 401,
        message: '用户未登录'
      };
    }
    
    // 确保params存在
    const safeParams = params || {};
    
    // 获取用户信息以验证权限
    let user;
    try {
      const userResult = await db.collection('users').doc(userId).get();
      user = userResult.data;
    } catch (err) {
      // 如果用户不存在或users集合不存在
      if (err.errCode === -502005 || err.errCode === -502017) {
        return {
          code: 401,
          message: '用户验证失败'
        };
      }
      throw err;
    }
    
    // 根据action执行不同的操作
    switch (action) {
      // 确保在所有case中都使用safeParams而不是params，以避免解构错误
      case 'getList':
        // 获取订单列表
        {
          // 安全地从safeParams中提取参数，添加更多可能的参数支持
          const { 
            status, 
            page = 1, 
            pageSize = 10,
            userType,
            query: searchQuery
          } = safeParams;
          
          const skip = (page - 1) * pageSize;
          
          let query = db.collection('orders');
          
          // 记录完整查询信息，便于调试
          console.log('订单查询 - userId:', userId, 'userType:', user.userType, '前端status:', status);
          
          // 构建查询条件对象
          let whereCondition = {};
          
          // 先处理状态映射，确保后续判断基于正确的状态值
          let actualStatus = status;
          if (status && status !== 'all') {
            // 处理状态映射关系：前端的'delivering'对应数据库的'accepted'
            actualStatus = status === 'delivering' ? 'accepted' : status;
            console.log('状态映射 - 前端status:', status, '实际status:', actualStatus);
          }
          
          // 根据不同用户类型应用不同的过滤条件
          // 对于接单员：
          // 1. 查询待接单时不添加receiverId过滤条件，因为待接单订单还没有分配
          // 2. 查询配送中和已完成订单时，只显示自己接的订单
          if (user.userType === 'receiver' && actualStatus !== 'pending') {
            whereCondition.receiverId = userId;
            console.log('应用receiverId过滤条件:', whereCondition.receiverId);
          }
          // 对于派单员：不需要特殊过滤，可以查看所有订单
          
          // 根据状态筛选
          if (actualStatus && actualStatus !== 'all') {
            whereCondition.status = actualStatus;
            console.log('应用状态过滤条件:', whereCondition.status);
          }
          
          // 构建查询条件
            if (searchQuery && typeof searchQuery === 'string') {
              // 派单员页面特殊处理：支持用户名和用户ID搜索
              if (user.userType === 'dispatcher') {
                try {
                  // 首先构建基础搜索条件数组
                  let orConditions = [
                    { deliveryAddress: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                    { contactPerson: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                    { contactPhone: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                    // 直接添加用户ID搜索条件
                    { dispatcherId: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                    { receiverId: db.RegExp({ regexp: searchQuery, options: 'i' }) }
                  ];
                  
                  // 同时查询匹配的用户名
                  const matchingUsers = await db.collection('users')
                    .where({
                      username: db.RegExp({ regexp: searchQuery, options: 'i' })
                    })
                    .field({ _id: true })
                    .get();
                  
                  const userIds = matchingUsers.data.map(u => u._id);
                  
                  // 如果有匹配的用户，添加用户ID搜索条件
                  if (userIds.length > 0) {
                    orConditions.push(
                      db.command.or([
                        { dispatcherId: db.command.in(userIds) },
                        { receiverId: db.command.in(userIds) }
                      ])
                    );
                  }
                  
                  // 现在创建完整的OR条件
                  const searchConditions = db.command.or(orConditions);
                
                // 如果有基础条件，使用AND组合
                if (Object.keys(whereCondition).length > 0) {
                  query = query.where(
                    db.command.and([
                      whereCondition,
                      searchConditions
                    ])
                  );
                } else {
                  query = query.where(searchConditions);
                }
              } catch (userSearchError) {
                console.error('用户搜索出错:', userSearchError);
                // 出错时回退到原始搜索逻辑
                const fallbackSearchConditions = db.command.or([
                  { deliveryAddress: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                  { contactPerson: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                  { contactPhone: db.RegExp({ regexp: searchQuery, options: 'i' }) }
                ]);
                
                if (Object.keys(whereCondition).length > 0) {
                  query = query.where(
                    db.command.and([
                      whereCondition,
                      fallbackSearchConditions
                    ])
                  );
                } else {
                  query = query.where(fallbackSearchConditions);
                }
              }
            } else {
              // 接单员页面保持原有搜索逻辑
              const searchConditions = db.command.or([
                { deliveryAddress: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                { contactPerson: db.RegExp({ regexp: searchQuery, options: 'i' }) },
                { contactPhone: db.RegExp({ regexp: searchQuery, options: 'i' }) }
              ]);
              
              // 如果有基础条件（如receiverId或status），使用AND组合
              if (Object.keys(whereCondition).length > 0) {
                query = query.where(
                  db.command.and([
                    whereCondition,
                    searchConditions
                  ])
                );
              } else {
                // 只有搜索条件
                query = query.where(searchConditions);
              }
            }
          } else if (Object.keys(whereCondition).length > 0) {
            // 只有基础条件，没有搜索条件
            query = query.where(whereCondition);
          }
          // 没有条件时查询全部订单
          
          // 查询条件已在前面的逻辑中应用
          
          // 查询订单总数和列表，处理集合不存在的情况
          try {
            // 先尝试检查集合是否存在（通过获取第一个文档）
            const checkResult = await db.collection('orders').limit(1).get();
            
            // 获取总数
            const countResult = await query.count();
            const total = countResult.total;
            
            // 查询订单列表
            const ordersResult = await query
              .orderBy('createdAt', 'desc')
              .skip(skip)
              .limit(pageSize)
              .get();
            
            // 优化关联查询：先收集所有需要查询的用户ID
            const userIds = new Set();
            ordersResult.data.forEach(order => {
              if (order.dispatcherId) userIds.add(order.dispatcherId);
              if (order.receiverId) userIds.add(order.receiverId);
            });
            
            // 批量查询用户信息，减少数据库请求次数
            const userMap = {};
            if (userIds.size > 0) {
              const userIdsArray = Array.from(userIds);
              const usersResult = await db.collection('users')
                .where({
                  _id: db.command.in(userIdsArray)
                })
                .field({ _id: true, username: true })
                .get();
              
              // 构建用户ID到用户名的映射
              usersResult.data.forEach(user => {
                userMap[user._id] = user.username || '未知用户';
              });
            }
            
            // 组装订单数据
            const ordersWithUserInfo = ordersResult.data.map(order => {
              const enrichedOrder = { 
                ...order,
                id: order._id || order.id,
                status: order.status === 'accepted' ? 'delivering' : (order.status || 'pending'),
                dispatcherName: order.dispatcherId ? userMap[order.dispatcherId] || '未知用户' : '',
                receiverName: order.receiverId ? userMap[order.receiverId] || '未知用户' : ''
              };
              return enrichedOrder;
            });
            
            // 确保返回的数据格式符合前端预期
            return {
              code: 200,
              message: '获取订单列表成功',
              data: ordersWithUserInfo // 返回包含用户信息的订单数组
            };
          } catch (err) {
            // 处理所有可能的错误，包括集合不存在
            console.error('获取订单列表失败:', err);
            
            // 无论什么错误，都返回一个安全的响应
            return {
              code: 200,
              message: '获取订单列表成功',
              data: [] // 直接返回空数组
            };
          }
        }
        
      case 'getStats':
        // 获取订单统计数据
        {
          try {
            console.log('获取订单统计数据 - userId:', userId, 'userType:', user.userType);
            
            // 构建基础查询条件
            let baseQuery = {};
            
            // 对于接单员：
            // 1. 查询待接单时不添加receiverId过滤条件，因为待接单订单还没有分配
            // 2. 查询配送中和已完成订单时，只显示自己接的订单
            // 这里需要分别查询不同状态的订单以保持一致性
            console.log('统计数据 - 用户名:', user.username, '用户类型:', user.userType);
            console.log('统计数据基础查询条件（初始）:', baseQuery);
            
            // 优化统计查询：使用聚合查询减少数据库请求
            try {
              // 分别查询不同状态的订单数量，保持与获取订单列表逻辑一致
              let pendingCount = 0;
              let deliveringCount = 0;
              let completedCount = 0;
              
              // 对于接单员：
              // 1. 查询待接单时不添加receiverId过滤条件
              // 2. 查询配送中和已完成订单时，只显示自己接的订单
              if (user.userType === 'receiver') {
                console.log('接单员统计查询 - 待接单不需要receiverId过滤');
                // 查询待接单（所有人都能看到）
                const pendingResult = await db.collection('orders').where({ status: 'pending' }).count();
                pendingCount = pendingResult.total;
                
                // 查询配送中（只看自己的）
                const deliveringResult = await db.collection('orders').where({
                  receiverId: userId,
                  status: 'accepted'
                }).count();
                deliveringCount = deliveringResult.total;
                
                // 查询已完成（只看自己的）
                const completedResult = await db.collection('orders').where({
                  receiverId: userId,
                  status: 'completed'
                }).count();
                completedCount = completedResult.total;
              } else {
                // 对于派单员或其他角色，使用聚合查询
                console.log('非接单员使用聚合查询统计数据');
                const aggregationResult = await db.collection('orders')
                  .where(baseQuery)
                  .aggregate()
                  .group({
                    _id: '$status',
                    count: _.sum(1)
                  })
                  .end();
                  
                // 处理聚合结果
                if (aggregationResult.list && aggregationResult.list.length > 0) {
                  aggregationResult.list.forEach(item => {
                    if (item._id === 'pending') {
                      pendingCount = item.count;
                    } else if (item._id === 'accepted') {
                      deliveringCount = item.count;
                    } else if (item._id === 'completed') {
                      completedCount = item.count;
                    }
                  });
                }
              }
              
              // 初始化统计结果
              const stats = {
                pending: pendingCount,
                delivering: deliveringCount,
                completed: completedCount
              };
              
              // 计算总数：接单员的总订单数只包含配送中和已完成，不包含待接单
              stats.total = user.userType === 'receiver' ? 
                stats.delivering + stats.completed : 
                stats.pending + stats.delivering + stats.completed;
              
              console.log('接单员统计结果 - 待接单:', pendingCount, '配送中:', deliveringCount, '已完成:', completedCount, '总数:', user.userType === 'receiver' ? deliveringCount + completedCount : pendingCount + deliveringCount + completedCount);
              
              return {
                code: 200,
                message: '获取订单统计成功',
                data: stats
              };
            } catch (aggregationError) {
              // 如果聚合查询失败（例如数据库版本不支持），回退到原始方法
              console.log('聚合查询失败，使用回退方法:', aggregationError);
              
              // 根据用户类型采用不同的查询策略
              let pendingCount = 0;
              let deliveringCount = 0;
              let completedCount = 0;
              
              if (user.userType === 'receiver') {
                console.log('接单员统计查询（回退方法）- 待接单不需要receiverId过滤');
                // 接单员：分别查询不同状态的订单
                const pendingResult = await db.collection('orders').where({ status: 'pending' }).count();
                const deliveringResult = await db.collection('orders').where({ receiverId: userId, status: 'accepted' }).count();
                const completedResult = await db.collection('orders').where({ receiverId: userId, status: 'completed' }).count();
                
                pendingCount = pendingResult.total;
                deliveringCount = deliveringResult.total;
                completedCount = completedResult.total;
              } else {
                // 非接单员：并行查询所有状态
                console.log('非接单员统计查询（回退方法）');
                const [pendingResult, acceptedResult, completedResult] = await Promise.all([
                  db.collection('orders').where({ ...baseQuery, status: 'pending' }).count(),
                  db.collection('orders').where({ ...baseQuery, status: 'accepted' }).count(),
                  db.collection('orders').where({ ...baseQuery, status: 'completed' }).count()
                ]);
                
                pendingCount = pendingResult.total;
                deliveringCount = acceptedResult.total;
                completedCount = completedResult.total;
              }
              
              return {
                code: 200,
                message: '获取订单统计成功',
                data: {
                  pending: pendingCount,
                  delivering: deliveringCount,
                  completed: completedCount,
                  total: user.userType === 'receiver' ? deliveringCount + completedCount : pendingCount + deliveringCount + completedCount
                }
              };
            }
          } catch (err) {
            // 如果集合不存在，返回默认统计数据
            if (err.errCode === -502005 || err.message.includes('collection not exist')) {
              return {
                code: 200,
                message: '获取订单统计成功（暂无数据）',
                data: {
                  pending: 0,
                  delivering: 0,
                  completed: 0,
                  total: 0
                }
              };
            }
            throw err;
          }
        }
        
      case 'create':
        // 创建订单（仅派单员可操作）
        {
          if (user.userType !== 'dispatcher') {
            return {
              code: 403,
              message: '只有派单员可以创建订单'
            };
          }
          
          const orderData = safeParams || {};
          
          // 使用通用验证器验证必要的订单数据
          try {
            validateRequiredFields({
              orderId: orderData.orderId,
              deliveryAddress: orderData.deliveryAddress,
              contactPerson: orderData.contactPerson,
              contactPhone: orderData.contactPhone
            });
          } catch (validationError) {
            return {
              code: 400,
              message: validationError.message
            };
          }
          
          // 验证联系方式格式
          const phoneRegex = /^1[3-9]\d{9}$/;
          if (!phoneRegex.test(orderData.contactPhone)) {
            return {
              code: 400,
              message: '请输入正确的手机号码'
            };
          }
          
          // 尝试创建订单
          try {
            // 设置超时处理
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('操作超时')), 5000);
            });
            
            // 执行订单创建操作，并处理超时
            const raceResult = await Promise.race([
              (async () => {
                // 先检查订单号是否已存在
                const existingOrder = await db.collection('orders').where({ 
                  orderId: orderData.orderId 
                }).count();
                
                if (existingOrder.total > 0) {
                  return { 
                    code: 400,
                    message: '订单号已存在，请使用其他订单号'
                  };
                }
                
                // 直接尝试创建订单，不预先检查集合是否存在
                const newOrder = await db.collection('orders').add({
                  data: {
                    ...orderData,
                    dispatcherId: userId,
                    status: 'pending', // 初始状态为待接单
                    createdAt: db.serverDate(),
                    updatedAt: db.serverDate()
                  }
                });
                
                return {
                  code: 200,
                  message: '创建订单成功',
                  data: {
                    orderId: orderData.orderId,
                    id: newOrder._id
                  }
                };
              })(),
              timeoutPromise
            ]);
            
            return raceResult;
          } catch (err) {
            // 处理所有可能的错误，特别是集合不存在的情况
            console.log('创建订单失败:', err);
            
            if (err.message === '操作超时') {
              return {
                code: 408,
                message: '创建订单超时，请稍后重试'
              };
            }
            
            // 如果是数据库操作错误，返回正确的错误信息
            return {
              code: 500,
              message: '创建订单失败，请稍后重试',
              data: null
            };
          }
        }
        
      case 'accept':
        // 接单操作（仅接单员可操作）
        {
          if (user.userType !== 'receiver') {
            return {
              code: 403,
              message: '无权限接单'
            };
          }
          
          // 支持从不同位置获取订单ID
          const { orderId } = safeParams || {};
          
          console.log('接单操作 - userId:', userId, 'orderId:', orderId);
          
          if (!orderId) {
            return {
              code: 400,
              message: '订单ID不能为空'
            };
          }
          
          try {
            // 先检查订单是否存在
            const orderInfo = await db.collection('orders').doc(orderId).get();
            console.log('订单信息:', orderInfo.data);
            
            // 更新订单状态
            const updateResult = await db.collection('orders').doc(orderId).update({
              data: {
                status: 'accepted',
                receiverId: userId,
                acceptedAt: db.serverDate(),
                updatedAt: db.serverDate()
              }
            });
            
            console.log('订单更新结果:', updateResult);
            
            // 返回更详细的成功信息，包含订单ID
            return {
              code: 200,
              message: '接单成功',
              data: {
                orderId: orderId,
                receiverId: userId
              }
            };
          } catch (err) {
            console.error('接单失败:', err);
            // 处理各种可能的错误情况
            if (err.errCode === -502005 || err.errCode === -502002 || err.message.includes('collection not exist')) {
              return {
                code: 404,
                message: '订单不存在或数据库未初始化'
              };
            }
            // 抛出错误以便上层捕获
            throw err;
          }
        }
        
      case 'complete':
      case 'completeOrder':
        // 完成订单（仅接单员可操作）
        {
          if (user.userType !== 'receiver') {
            return {
              code: 403,
              message: '无权限完成订单'
            };
          }
          
          // 兼容直接传递orderId或通过params传递orderId的方式
          const orderId = safeParams.orderId || safeParams.params?.orderId;
          
          try {
            // 更新订单状态
            await db.collection('orders').doc(orderId).update({
              data: {
                status: 'completed',
                completedAt: db.serverDate(),
                updatedAt: db.serverDate()
              }
            });
            
            return {
              code: 200,
              message: '订单已完成'
            };
          } catch (err) {
            // 处理集合不存在或订单不存在的情况
            if (err.errCode === -502005 || err.errCode === -502002 || err.message.includes('collection not exist')) {
              return {
                code: 404,
                message: '订单不存在或数据库未初始化'
              };
            }
            throw err;
          }
        }
        
      case 'getDetail':
        // 获取订单详情
        {
          const { orderId } = safeParams;
          
          try {
            const order = await db.collection('orders').doc(orderId).get();
            
            // 验证权限：只有相关的派单员或接单员才能查看
            if (order.data.dispatcherId !== userId && order.data.receiverId !== userId) {
              return {
                code: 403,
                message: '无权限查看此订单'
              };
            }
            
            return {
              code: 200,
              message: '获取订单详情成功',
              data: order.data
            };
          } catch (err) {
            // 处理集合不存在或订单不存在的情况
            if (err.errCode === -502005 || err.errCode === -502002 || err.message.includes('collection not exist')) {
              return {
                code: 404,
                message: '订单不存在或数据库未初始化'
              };
            }
            throw err;
          }
        }
        
      case 'update_order':
        // 更新订单
        {
          const { orderId, orderData } = safeParams;
          try {
            // 检查订单是否存在
            const order = await db.collection('orders').doc(orderId).get();
            
            // 验证权限
            if (order.data.dispatcherId !== userId) {
              return {
                code: 403,
                message: '无权限更新此订单'
              };
            }
            
            // 更新订单
            await db.collection('orders').doc(orderId).update({
              data: {
                ...orderData,
                updatedAt: db.serverDate()
              }
            });
            
            return {
              code: 200,
              message: '订单更新成功'
            };
          } catch (err) {
            // 处理集合不存在或订单不存在的情况
            if (err.errCode === -502005 || err.errCode === -502002 || err.message.includes('collection not exist')) {
              return {
                code: 404,
                message: '订单不存在或数据库未初始化'
              };
            }
            throw err;
          }
        }
        
      default:
        return {
          code: 400,
          message: '不支持的操作'
        };
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return {
      code: 500,
      message: '操作失败，请重试',
      error: error.message
    };
  }
};
